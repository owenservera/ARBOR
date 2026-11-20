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
fn valid_semantic(s: &str) -> bool {
    if s.len() > 180 { return false; }
    let Some((name, version)) = s.split_once('@') else {return false};
    !name.is_empty() && name.as_bytes()[0].is_ascii_alphanumeric()
        && name.bytes().all(|b|b.is_ascii_lowercase()||b.is_ascii_digit()||b"._-".contains(&b))
        && version.split('.').all(|part|!part.is_empty()&&part.bytes().all(|b|b.is_ascii_digit()))
}
#[derive(Debug, PartialEq, Eq)]
pub struct SourceAnchor {
    pub file_id: String, pub path: String, pub content_digest: String,
    pub anchor_id: String, pub annotation_kind: String, pub state: String,
    pub first_line: u64, pub occurrence_count: u64,
}
#[derive(Debug, PartialEq, Eq)]
pub struct SemanticSources {
    pub epoch: u64, pub semantic_id: String, pub anchors: Vec<SourceAnchor>,
}
/// Only importer-owned records linked by both explicit source edges are admitted.
/// No fuzzy string matching or inferred symbol ownership.
pub fn sources(graph: &Graph, semantic_id: &str) -> Result<SemanticSources> {
    if !valid_semantic(semantic_id) {return Err(Error::Invalid("invalid versioned semantic id".into()))}
    let matches: Vec<_> = graph.nodes().filter(|n|owned(&n.properties)
        && n.kind.as_str()=="semantic-id" && prop(n,"semantic_id")==Some(semantic_id)).collect();
    if matches.len()!=1 {return Err(Error::Missing("unique imported semantic id not found".into()))}
    let mut anchors=Vec::new();
    for edge in graph.incoming(&matches[0].id,Some("references-semantic-id"))? {
        if !owned(&edge.properties) {continue}
        let Some(anchor)=graph.node(&edge.from) else {continue};
        if !owned(&anchor.properties)||anchor.kind.as_str()!="semantic-file-anchor"
            ||prop(anchor,"semantic_id")!=Some(semantic_id) {continue}
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
            anchor_id:anchor.id.clone(),annotation_kind:tag.into(),state:state.into(),first_line,occurrence_count});
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
        if !owned(&node.properties)||node.kind.as_str()!="source-file"{continue}
        if files.len()>=MAX_MATCHES {truncated=true;break}
        if let Some(path)=prop(node,"source_path"){files.push((path.to_owned(),d));}
        if d==depth {continue}
        for edge in graph.incoming(&id,Some("imports"))?{
            if !owned(&edge.properties)||seen.contains(&edge.from){continue}
            if seen.len()>=MAX_MATCHES{truncated=true;continue}
            if graph.node(&edge.from).is_some_and(|n|owned(&n.properties)&&n.kind.as_str()=="source-file"){
                seen.insert(edge.from.clone());queue.push_back((edge.from.clone(),d+1));
            }
        }
    }
    files.sort_by(|a,b|a.1.cmp(&b.1).then(a.0.cmp(&b.0)));
    Ok(Impact{epoch:graph.epoch(),files,truncated})
}
