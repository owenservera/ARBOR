//! Read-only semantic source and static impact queries over the canonical HQKG journal.
//! @hq:capability hqkg.semantic-source-query@1
//! @hq:consumes hq.semantic-file-anchor@1
//! @hq:invariant Annotation occurrence never establishes execution authority or runtime behavior.
use crate::{Error, Graph, Node, Result};
use std::collections::{BTreeSet, VecDeque};

const OWNER: &str = "repos-hq.index";
const MAX_MATCHES: usize = 512;
const MAX_DEPTH: usize = 8;
fn owned(props: &crate::Properties) -> bool {
    props.get("hqkg.exchange.source").map(String::as_str) == Some(OWNER)
}
fn prop<'a>(node: &'a Node, key: &str) -> Option<&'a str> {
    node.properties.get(key).map(String::as_str)
}
fn valid_file(node: &Node) -> bool {
    owned(&node.properties) && node.kind.as_str() == "source-file"
        && prop(node, "source_path").is_some_and(|p| !p.is_empty())
        && prop(node, "content_sha256").is_some_and(|digest| {
            digest.len() == 64 && digest.bytes().all(|b| b.is_ascii_digit() || (b'a'..=b'f').contains(&b))
        })
}
fn valid_semantic(s: &str) -> bool {
    if s.len() > 180 { return false; }
    let Some((name, version)) = s.split_once('@') else {return false};
    !name.is_empty() && name.as_bytes()[0].is_ascii_alphanumeric()
        && name.bytes().all(|b|b.is_ascii_lowercase()||b.is_ascii_digit()||b"._-".contains(&b))
        && version.split('.').all(|part|!part.is_empty()&&part.bytes().all(|b|b.is_ascii_digit()))
}
/// An importer-owned AST observation, not a type-check or authority proof.
#[derive(Debug, PartialEq, Eq)]
pub struct SyntaxBinding {
    pub symbol_id: String,
    pub qualified_name: String,
    pub syntax_digest: String,
    pub signature_digest: String,
}
fn valid_digest(v: &str) -> bool {
    v.len()==64 && v.bytes().all(|b| b.is_ascii_digit() || (b'a'..=b'f').contains(&b))
}
fn syntax_binding(graph: &Graph, anchor: &Node, file: &Node, line: u64, count: u64) -> Result<Option<SyntaxBinding>> {
    let edges: Vec<_> = graph.outgoing(&anchor.id,Some("binds-indexed-symbol"))?
        .into_iter().filter(|e|owned(&e.properties)).collect();
    let Some(id)=prop(anchor,"bound_symbol_id") else {
        if !edges.is_empty() || prop(anchor,"assurance")==Some("syntax-only") {
            return Err(Error::Corrupt("orphan syntax binding".into()))
        }
        return Ok(None)
    };
    if edges.len()!=1 || edges[0].to!=id || count!=1 || prop(anchor,"assurance")!=Some("syntax-only") {
        return Err(Error::Corrupt("ambiguous syntax binding".into()))
    }
    let edge=edges[0];
    let symbol=graph.node(id).ok_or_else(||Error::Corrupt("missing syntax symbol".into()))?;
    let qualified=prop(symbol,"qualified_name").unwrap_or("");
    let name=prop(symbol,"symbol_name").unwrap_or("");
    let kind=prop(symbol,"symbol_kind").unwrap_or("");
    let syntax=prop(symbol,"syntax_digest").unwrap_or("");
    let signature=prop(symbol,"signature_digest").unwrap_or("");
    let first=prop(symbol,"first_line").and_then(|v|v.parse::<u64>().ok()).unwrap_or(0);
    let parents:Vec<_>=graph.incoming(id,Some("contains-indexed-symbol"))?
        .into_iter().filter(|e|owned(&e.properties)).collect();
    if !owned(&symbol.properties) || symbol.kind.as_str()!="source-symbol"
        || prop(symbol,"assurance")!=Some("syntax-only")
        || prop(symbol,"status")!=Some("indexed-not-live-checked")
        || prop(symbol,"occurrence_count")!=Some("1")
        || prop(symbol,"source_path")!=prop(file,"source_path")
        || prop(symbol,"content_sha256")!=prop(file,"content_sha256")
        || edge.properties.get("content_sha256").map(String::as_str)!=prop(file,"content_sha256")
        || edge.properties.get("source_line").and_then(|v|v.parse::<u64>().ok())!=Some(line)
        || edge.properties.get("evidence_class").map(String::as_str)!=Some("rust-ast-doc-ownership")
        || first<line || name.is_empty() || name.len()>180 || name.chars().any(char::is_control)
        || qualified.is_empty() || qualified.len()>512 || qualified.chars().any(char::is_control)
        || !(qualified==name || qualified.ends_with(&format!("::{name}")))
        || kind.is_empty() || !valid_digest(syntax) || !valid_digest(signature)
        || parents.len()!=1 || parents[0].from!=file.id {
        return Err(Error::Corrupt("syntax binding provenance mismatch".into()))
    }
    Ok(Some(SyntaxBinding{symbol_id:id.into(),qualified_name:qualified.into(),
        syntax_digest:syntax.into(),signature_digest:signature.into()}))
}
#[derive(Debug, PartialEq, Eq)]
pub struct SourceAnchor {
    pub file_id: String, pub path: String, pub content_digest: String,
    pub anchor_id: String, pub annotation_kind: String, pub state: String,
    pub first_line: u64, pub occurrence_count: u64,
    pub bound_symbol: Option<SyntaxBinding>,
}
#[derive(Debug, PartialEq, Eq)]
pub struct SemanticSources {
    pub epoch: u64, pub semantic_id: String, pub anchors: Vec<SourceAnchor>,
}
/// Only importer-owned records linked by both explicit source edges are admitted.
/// No fuzzy string matching or inferred symbol ownership.
pub fn sources(graph: &Graph, semantic_id: &str) -> Result<SemanticSources> {
    if !valid_semantic(semantic_id) {return Err(Error::Invalid("invalid versioned semantic id".into()))}
    let mut matches = graph.nodes().filter(|n|owned(&n.properties)
        && n.kind.as_str()=="semantic-id" && prop(n,"semantic_id")==Some(semantic_id));
    let identity = matches.next().ok_or_else(|| Error::Missing("imported semantic id not found".into()))?;
    if matches.next().is_some() {return Err(Error::Conflict("imported semantic identity is ambiguous".into()))}
    let mut anchors=Vec::new();
    let mut seen_anchors = BTreeSet::new();
    for edge in graph.incoming(&identity.id,Some("references-semantic-id"))? {
        if !owned(&edge.properties) {continue}
        let anchor=graph.node(&edge.from).ok_or_else(||Error::Corrupt("missing semantic anchor".into()))?;
        if !owned(&anchor.properties)||anchor.kind.as_str()!="semantic-file-anchor"
            ||prop(anchor,"semantic_id")!=Some(semantic_id) {
            return Err(Error::Corrupt("owned semantic edge has mismatched anchor".into()))
        }
        if !seen_anchors.insert(anchor.id.clone()) {
            return Err(Error::Corrupt("duplicate semantic anchor reference".into()))
        }
        // The forward direction must also identify exactly this semantic ID.
        let forward=graph.outgoing(&anchor.id,Some("references-semantic-id"))?;
        if forward.iter().filter(|e|owned(&e.properties)).count()!=1 {
            return Err(Error::Corrupt("semantic anchor identity linkage is ambiguous".into()))
        }
        let incoming: Vec<_>=graph.incoming(&anchor.id,Some("has-semantic-anchor"))?
            .into_iter().filter(|e|owned(&e.properties)).collect();
        if incoming.len()!=1 {return Err(Error::Corrupt("semantic anchor source linkage is ambiguous".into()))}
        let file=graph.node(&incoming[0].from).ok_or_else(||Error::Corrupt("missing semantic source file".into()))?;
        let path=prop(file,"source_path").unwrap_or("");
        let digest=prop(file,"content_sha256").unwrap_or("");
        let tag=prop(anchor,"annotation_kind").unwrap_or("");
        let state=prop(anchor,"status").unwrap_or("");
        let first_line=prop(anchor,"first_line").and_then(|s|s.parse::<u64>().ok()).unwrap_or(0);
        let occurrence_count=prop(anchor,"occurrence_count").and_then(|s|s.parse::<u64>().ok()).unwrap_or(0);
        if !owned(&file.properties)||file.kind.as_str()!="source-file"||path.is_empty()
            ||prop(anchor,"source_path")!=Some(path)||prop(anchor,"content_sha256")!=Some(digest)
            ||digest.len()!=64||!digest.bytes().all(|b|b.is_ascii_digit()||(b'a'..=b'f').contains(&b))
            ||!matches!(tag,"type"|"capability"|"contract"|"emits"|"consumes"|"action")
            ||first_line==0||occurrence_count==0
            ||(if occurrence_count==1 {state!="indexed-not-live-checked"} else {state!="ambiguous"}) {
            return Err(Error::Corrupt("semantic anchor provenance mismatch".into()))
        }
        if anchors.len()>=MAX_MATCHES {return Err(Error::Invalid("semantic match limit exceeded".into()))}
        anchors.push(SourceAnchor{file_id:file.id.clone(),path:path.into(),content_digest:digest.into(),
            anchor_id:anchor.id.clone(),annotation_kind:tag.into(),state:state.into(),first_line,occurrence_count,
            bound_symbol:syntax_binding(graph,anchor,file,first_line,occurrence_count)?});
    }
    anchors.sort_by(|a,b|(&a.path,&a.annotation_kind,&a.anchor_id).cmp(&(&b.path,&b.annotation_kind,&b.anchor_id)));
    Ok(SemanticSources{epoch:graph.epoch(),semantic_id:semantic_id.into(),anchors})
}
#[derive(Debug, PartialEq, Eq)]
pub struct Impact {
    pub epoch: u64, pub files: Vec<(String,usize)>, pub truncated: bool,
}
/// Reverse resolved-import traversal from exact semantic anchor files. This is a
/// conservative *static* recompute candidate set, not runtime invalidation proof.
pub fn impact(graph:&Graph, semantic_id:&str, depth:usize)->Result<Impact>{
    if depth>MAX_DEPTH{return Err(Error::Invalid("impact depth must be 0..8".into()))}
    let found=sources(graph,semantic_id)?;
    let mut seen=BTreeSet::new();let mut queue=VecDeque::new();let mut files=Vec::new();let mut truncated=false;
    for anchor in found.anchors{
        if seen.insert(anchor.file_id.clone()){queue.push_back((anchor.file_id,0));}
    }
    while let Some((id,d))=queue.pop_front(){
        let Some(node)=graph.node(&id) else {continue};
        if !valid_file(node){return Err(Error::Corrupt("invalid indexed impact source".into()))}
        if files.len()>=MAX_MATCHES {truncated=true;break}
        if let Some(path)=prop(node,"source_path"){files.push((path.to_owned(),d));}
        for edge in graph.incoming(&id,Some("imports"))?{
            if !owned(&edge.properties)||seen.contains(&edge.from){continue}
            let importer=graph.node(&edge.from).ok_or_else(||Error::Corrupt("missing indexed importer".into()))?;
            if !valid_file(importer){return Err(Error::Corrupt("invalid indexed importer provenance".into()))}
            // The frontier is incomplete if a valid unseen importer is just
            // beyond the requested depth. Cycles and already-reached nodes do
            // not count as omitted results.
            if d==depth||seen.len()>=MAX_MATCHES{truncated=true;continue}
            seen.insert(edge.from.clone());queue.push_back((edge.from.clone(),d+1));
        }
    }
    files.sort_by(|a,b|a.1.cmp(&b.1).then(a.0.cmp(&b.0)));
    Ok(Impact{epoch:graph.epoch(),files,truncated})
}

/// Exact source symbol group. Multiple declarations are never resolved to one.
#[derive(Debug,PartialEq,Eq)]
pub struct IndexedSymbol {
    pub id:String,pub file_id:String,pub path:String,pub name:String,pub kind:String,
    pub first_line:u64,pub occurrence_count:u64,pub state:String,pub content_digest:String,
}
pub fn symbols(graph:&Graph,name:&str)->Result<Vec<IndexedSymbol>>{
    if name.is_empty()||name.len()>180||name.chars().any(char::is_control){
        return Err(Error::Invalid("invalid symbol name".into()))
    }
    let mut found=Vec::new();
    for n in graph.nodes().filter(|n|owned(&n.properties)&&n.kind.as_str()=="source-symbol"&&prop(n,"symbol_name")==Some(name)){
        if found.len()>=MAX_MATCHES{return Err(Error::Invalid("symbol query match limit exceeded".into()))}
        let parents:Vec<_>=graph.incoming(&n.id,Some("contains-indexed-symbol"))?.into_iter().filter(|e|owned(&e.properties)).collect();
        if parents.len()!=1{return Err(Error::Corrupt("symbol source linkage missing or ambiguous".into()))}
        let f=graph.node(&parents[0].from).ok_or_else(||Error::Corrupt("missing symbol source".into()))?;
        let path=prop(n,"source_path").unwrap_or("");
        let digest=prop(n,"content_sha256").unwrap_or("");
        let kind=prop(n,"symbol_kind").unwrap_or("");
        let state=prop(n,"status").unwrap_or("");
        let count=prop(n,"occurrence_count").and_then(|v|v.parse::<u64>().ok()).unwrap_or(0);
        let line=prop(n,"first_line").and_then(|v|v.parse::<u64>().ok()).unwrap_or(0);
        if !owned(&f.properties)||f.kind.as_str()!="source-file"||path.is_empty()
            ||prop(f,"source_path")!=Some(path)||prop(f,"content_sha256")!=Some(digest)
            ||digest.len()!=64||!digest.bytes().all(|b|b.is_ascii_digit()||(b'a'..=b'f').contains(&b))
            ||kind.is_empty()||count==0||line==0||
            (if count==1{state!="indexed-not-live-checked"}else{state!="ambiguous"}){
            return Err(Error::Corrupt("symbol provenance mismatch".into()))
        }
        found.push(IndexedSymbol{id:n.id.clone(),file_id:f.id.clone(),path:path.into(),name:name.into(),kind:kind.into(),
            first_line:line,occurrence_count:count,state:state.into(),content_digest:digest.into()});
    }
    found.sort_by(|a,b|(&a.path,&a.kind,&a.id).cmp(&(&b.path,&b.kind,&b.id)));
    Ok(found)
}
