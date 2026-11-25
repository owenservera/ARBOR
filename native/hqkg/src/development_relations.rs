//! Exact bounded traversals of the incumbent source knowledge graph.
//! @hq:capability hqkg.source-relationship-traversal@1
//! @hq:consumes hqkg.development-transform@1
//! These are indexed static relationships, not executable wiring or authority.
use crate::{Error,Graph,Node,Result};
use serde_json::{json,Value};
use std::collections::{BTreeMap,BTreeSet,VecDeque};

const OWNER:&str="repos-hq.index";
const MAX_DEPTH:usize=4;
const MAX_RESULTS:usize=80;
fn prop<'a>(n:&'a Node,key:&str)->Option<&'a str>{n.properties.get(key).map(String::as_str)}
fn owned(n:&Node)->bool{prop(n,"hqkg.exchange.source")==Some(OWNER)}
fn file(n:&Node)->bool{owned(n)&&n.kind.as_str()=="source-file"
    &&prop(n,"source_path").is_some_and(|p| !p.is_empty())
    &&prop(n,"content_sha256").is_some_and(|d| d.len()==64 && d.bytes().all(|b| b.is_ascii_digit() || (b'a'..=b'f').contains(&b)))}
fn owned_edge(e:&crate::Edge)->bool{
    e.properties.get("hqkg.exchange.source").map(String::as_str)==Some(OWNER)
}
#[derive(Default)]
pub struct Walk {
    pub nodes:Vec<Value>,
    pub truncated:bool,
    pub depth_limited:bool,
    pub result_limited:bool,
    pub edge_limited:bool,
    pub returns_to_source:bool,
}
/// Traverse actual resolved import edges. Depth is bounded even for cyclic
/// repositories. A shared descendant is not misclassified as an import cycle.
pub fn imports(graph:&Graph,root:&str,reverse:bool,depth:usize)->Result<Walk>{
    if depth>MAX_DEPTH{return Err(Error::Invalid("source traversal depth exceeds four".into()))}
    walk_imports(graph,root,reverse,depth,MAX_RESULTS,usize::MAX)
}
fn walk_imports(graph:&Graph,root:&str,reverse:bool,depth:usize,max_results:usize,max_edges:usize)->Result<Walk>{
    if !graph.node(root).is_some_and(file){
        return Err(Error::Invalid("source traversal needs an imported source file".into()))
    }
    let mut seen=BTreeSet::new();
    seen.insert(root.to_owned());
    let mut queue=VecDeque::from([(root.to_owned(),0usize)]);
    let mut results=BTreeMap::<String,(usize,String)>::new();
    let mut walk=Walk::default();
    let mut scanned=0usize;
    'walk: while let Some((id,level))=queue.pop_front(){
        let edges=if reverse{graph.incoming(&id,Some("imports"))?}
            else{graph.outgoing(&id,Some("imports"))?};
        for edge in edges{
            if scanned>=max_edges{walk.truncated=true;walk.edge_limited=true;break 'walk}
            scanned+=1;
            if !owned_edge(edge){continue}
            let to=if reverse{&edge.from}else{&edge.to};
            if to==root {walk.returns_to_source=true;continue}
            if !graph.node(to).is_some_and(file){
                return Err(Error::Corrupt("invalid owned import endpoint provenance".into()));
            }
            if seen.contains(to){continue}
            if level==depth {walk.truncated=true;walk.depth_limited=true;continue}
            if results.len()>=max_results{walk.truncated=true;walk.result_limited=true;continue}
            seen.insert(to.clone());
            results.insert(to.clone(),(level+1,id.clone()));
            queue.push_back((to.clone(),level+1));
        }
    }
    for(id,(level,via))in results{
        let node=graph.node(&id).ok_or_else(||Error::Corrupt("source traversal target vanished".into()))?;
        walk.nodes.push(json!({
            "id":id,"path":prop(node,"source_path"),"depth":level,"via":via,
            "revision":node.version,"digest":prop(node,"content_sha256"),
            "relation":if reverse{"imported-by"}else{"imports"}
        }));
    }
    walk.nodes.sort_by(|a,b|{
        a["depth"].as_u64().cmp(&b["depth"].as_u64())
            .then(a["path"].as_str().cmp(&b["path"].as_str()))
            .then(a["id"].as_str().cmp(&b["id"].as_str()))
    });
    Ok(walk)
}

/// Bounded larger static coverage, separate from strict typed composition.
/// Each partition contains at most sixteen verified source identities.
/// Partitions are not execution plans and do not imply complete interpretation.
pub fn partitioned_imports(graph:&Graph,root:&str,reverse:bool)->Result<Value>{
    const COVERAGE_DEPTH:usize=32;
    const COVERAGE_RESULTS:usize=512;
    const COVERAGE_EDGES:usize=32768;
    const PARTITION_SIZE:usize=16;
    let walk=walk_imports(graph,root,reverse,COVERAGE_DEPTH,COVERAGE_RESULTS,COVERAGE_EDGES)?;
    let source=graph.node(root).ok_or_else(||Error::Missing("coverage root absent".into()))?;
    let root=json!({"id":source.id,"path":prop(source,"source_path"),
        "revision":source.version,"digest":prop(source,"content_sha256"),"depth":0});
    let partitions:Vec<_>=walk.nodes.chunks(PARTITION_SIZE).enumerate()
        .map(|(i,rows)|json!({"index":i,"sources":rows})).collect();
    Ok(json!({"schema":"hqkg.partitioned-import-coverage/1","epoch":graph.epoch(),
        "authority":"none","evidence":"indexed-static-only","root":root,
        "direction":if reverse{"dependents"}else{"imports"},
        "complete":!walk.truncated,"depthLimited":walk.depth_limited,
        "resultLimited":walk.result_limited,"edgeLimited":walk.edge_limited,
        "returnsToSource":walk.returns_to_source,
        "sourceCount":walk.nodes.len(),"partitionCount":partitions.len(),"partitions":partitions,
        "bounds":{"depth":COVERAGE_DEPTH,"sources":COVERAGE_RESULTS,"edges":COVERAGE_EDGES,"partitionSize":PARTITION_SIZE},
        "executionAuthorized":false,"effectPerformed":false}))
}

#[derive(Default)]
pub struct SemanticView{
    pub observations:Vec<Value>,pub potential_wiring:Vec<Value>,pub truncated:bool,
}
/// Follow only importer-authenticated anchor and typed annotation edges.
pub fn semantic(graph:&Graph,file_id:&str)->Result<SemanticView>{
    let source=graph.node(file_id)
        .filter(|node|file(node)).ok_or_else(||Error::Missing("indexed source for semantic lookup".into()))?;
    let path=prop(source,"source_path").unwrap_or("");
    let digest=prop(source,"content_sha256").unwrap_or("");
    let mut result=SemanticView::default();
    let mut anchors=BTreeMap::new();
    for edge in graph.outgoing(file_id,Some("has-semantic-anchor"))?{
        if !owned_edge(edge){continue}
        let Some(node)=graph.node(&edge.to)else{continue};
        if !owned(node)||node.kind.as_str()!="semantic-file-anchor"{continue}
        if prop(node,"source_path")!=Some(path)||prop(node,"content_sha256")!=Some(digest){
            return Err(Error::Conflict("semantic source digest mismatch".into()))
        }
        let references=graph.outgoing(&node.id,Some("references-semantic-id"))?;
        let matched:Vec<_>=references.into_iter().filter(|e|owned_edge(e)
            &&graph.node(&e.to).is_some_and(|n|owned(n)&&n.kind.as_str()=="semantic-id"
                &&prop(n,"semantic_id")==prop(node,"semantic_id"))).collect();
        if matched.len()!=1{return Err(Error::Corrupt("unresolved semantic identity anchor".into()))}
        if anchors.len()>=MAX_RESULTS{result.truncated=true;continue}
        let id=prop(node,"semantic_id").unwrap_or("");
        anchors.insert(node.id.clone(),json!({
            "anchorId":node.id,"semanticId":id,"annotation":prop(node,"annotation_kind"),
            "status":prop(node,"status"),"firstLine":prop(node,"first_line"),
            "occurrences":prop(node,"occurrence_count"),"fileId":file_id
        }));
    }
    result.observations=anchors.into_values().collect();
    result.observations.sort_by(|a,b|a["semanticId"].as_str().cmp(&b["semanticId"].as_str())
        .then(a["annotation"].as_str().cmp(&b["annotation"].as_str())));
    let mut potential=BTreeMap::<String,Value>::new();
    // Producers and consumers share a semantic ID, not necessarily a working
    // runtime connection. This is a discovery candidate, never a verified wire.
    for (mine,opposite,role) in [
        ("annotated-emits","annotated-consumes","potential-consumer"),
        ("annotated-consumes","annotated-emits","potential-producer")
    ]{
        for declaration in graph.outgoing(file_id,Some(mine))?{
            if !owned_edge(declaration)
                ||declaration.properties.get("content_sha256").map(String::as_str)!=Some(digest){continue}
            let Some(identity)=graph.node(&declaration.to)else{continue};
            if !owned(identity)||identity.kind.as_str()!="semantic-id"{continue}
            for peer in graph.incoming(&identity.id,Some(opposite))?{
                if !owned_edge(peer)||peer.from==file_id{continue}
                let Some(other)=graph.node(&peer.from)else{continue};
                if !file(other)||peer.properties.get("content_sha256").map(String::as_str)
                    !=prop(other,"content_sha256"){continue}
                if potential.len()>=MAX_RESULTS{result.truncated=true;continue}
                let key=format!("{}:{}:{}",role,identity.id,other.id);
                potential.insert(key,json!({
                    "role":role,"semanticId":prop(identity,"semantic_id"),"peerFileId":other.id,
                    "peerPath":prop(other,"source_path"),"peerRevision":other.version,
                    "peerDigest":prop(other,"content_sha256"),"evidence":"indexed-annotation-only"
                }));
            }
        }
    }
    result.potential_wiring=potential.into_values().collect();
    Ok(result)
}
