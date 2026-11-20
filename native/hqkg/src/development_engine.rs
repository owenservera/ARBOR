//! Read-only, source-backed native transforms over the existing imported HQKG.
//! @hq:capability hqkg.development-transform@1
//! @hq:consumes hqkg.typed-dag@1
//! @hq:consumes hqkg.indexed-native-program@1
//! This interpreter reads indexed metadata, never the filesystem or private World graph.
//! Computed conclusions are static observations, not live runtime or execution proof.
use crate::{Error, Graph, Node, Result};
use crate::engine::{ComputeEngine, EngineDescriptor, EngineOutput, EngineRegistry, EngineRequest,
                    SwapReceipt, PURE_ENGINE_SLOT, PURE_INTERFACE, PURE_OPERATIONS};
use crate::typed_dag::CONTRACT;
use serde_json::{json, Value};
use std::collections::{BTreeMap, BTreeSet};
use std::sync::Arc;

const OWNER: &str = "repos-hq.index";
const MAX_SOURCES: usize = 16;
const MAX_LINKS: usize = 48;
const MAX_RESULT_BYTES: usize = 64 * 1024;

fn property<'a>(node: &'a Node, key: &str) -> Option<&'a str> {
    node.properties.get(key).map(String::as_str)
}
fn source_node(graph: &Graph, id: &str, version: u64, digest: &str) -> Result<Value> {
    let node = graph.node(id).ok_or_else(|| Error::Missing("indexed source absent".into()))?;
    if node.kind.as_str() != "source-file"
        || property(node, "hqkg.exchange.source") != Some(OWNER)
        || node.version != version
        || property(node, "content_sha256") != Some(digest)
    {
        return Err(Error::Conflict("indexed source changed or provenance is unavailable".into()));
    }
    let path = property(node, "source_path").ok_or_else(|| Error::Corrupt("indexed path absent".into()))?;
    Ok(json!({"id":node.id,"path":path,"revision":node.version,"digest":digest}))
}
/// Decode the trusted DAG's byte-length framing, rather than splitting on
/// separators that a genuine dependency output could contain.
fn fields(data: &str) -> Result<Vec<&str>> {
    if data.len() > MAX_RESULT_BYTES { return Err(Error::Invalid("development frame too large".into())); }
    let mut result = Vec::new();
    let mut cursor = 0;
    while cursor < data.len() {
        if result.len() >= 160 { return Err(Error::Invalid("too many framed fields".into())); }
        let colon = data.as_bytes()[cursor..].iter().position(|b| *b == b':')
            .ok_or_else(|| Error::Invalid("invalid development frame".into()))? + cursor;
        if colon == cursor || colon - cursor > 7 { return Err(Error::Invalid("invalid frame length".into())); }
        let length = data[cursor..colon].parse::<usize>()
            .map_err(|_| Error::Invalid("invalid frame length".into()))?;
        let start = colon + 1;
        let end = start.checked_add(length).ok_or_else(|| Error::Invalid("frame overflow".into()))?;
        let field = data.get(start..end).ok_or_else(|| Error::Invalid("truncated frame".into()))?;
        result.push(field);
        cursor = end;
    }
    Ok(result)
}
fn parse_count(raw: Option<&&str>, maximum: usize) -> Result<usize> {
    let value = raw.ok_or_else(|| Error::Invalid("missing framed count".into()))?
        .parse::<usize>().map_err(|_| Error::Invalid("invalid framed count".into()))?;
    if value > maximum { return Err(Error::Invalid("framed count exceeds budget".into())); }
    Ok(value)
}
/// Actual source refs and upstream materialized outputs are supplied by the
/// incumbent DAG executor. No client may select source paths through this engine.
fn request_parts<'a>(request: &'a EngineRequest) -> Result<(Vec<(&'a str,u64,&'a str)>, Vec<(&'a str,&'a str)>)> {
    let rows = fields(&request.data)?;
    if rows.len() < 7 || rows[0] != CONTRACT || rows[2] != "sources" {
        return Err(Error::Invalid("not a validated HQKG transformation frame".into()));
    }
    let original = fields(rows[1])?;
    if original.len() != 3 || original[0] != "vlang.program-identity"
        || original[2] != request.operation {
        return Err(Error::Invalid("program identity or operation is missing".into()));
    }
    let count = parse_count(rows.get(3),MAX_SOURCES)?;
    let mut index = 4;
    let mut sources = Vec::with_capacity(count);
    for _ in 0..count {
        if index + 3 > rows.len() { return Err(Error::Invalid("incomplete source frame".into())); }
        let rev = rows[index+1].parse::<u64>()
            .map_err(|_| Error::Invalid("bad indexed source revision".into()))?;
        sources.push((rows[index],rev,rows[index+2]));
        index += 3;
    }
    if rows.get(index) != Some(&"dependencies") { return Err(Error::Invalid("missing dependency frame".into())); }
    index += 1;
    let n = parse_count(rows.get(index),MAX_SOURCES)?;
    index += 1;
    if rows.len() != index + n * 2 + 1 {
        return Err(Error::Invalid("unbounded or truncated dependency frame".into()));
    }
    let mut deps = Vec::new();
    for _ in 0..n {
        deps.push((rows[index],rows[index+1]));
        index += 2;
    }
    // The final generation is the executor lease, not a program-provided value.
    if rows[index].parse::<u64>().unwrap_or(0) == 0 {
        return Err(Error::Invalid("invalid engine generation".into()));
    }
    Ok((sources,deps))
}
fn linked(graph: &Graph, id: &str, relation: &str, reverse: bool) -> Result<Vec<Value>> {
    let mut out = Vec::new();
    let mut seen = BTreeSet::new();
    let edges = if reverse { graph.incoming(id,Some(relation))? }
        else { graph.outgoing(id,Some(relation))? };
    for edge in edges {
        if edge.properties.get("hqkg.exchange.source").map(String::as_str) != Some(OWNER) {continue}
        let other = if reverse { &edge.from } else { &edge.to };
        if !seen.insert(other) {continue}
        let Some(node) = graph.node(other) else {continue};
        if property(node,"hqkg.exchange.source") != Some(OWNER) {continue}
        let path = property(node,"source_path").unwrap_or("");
        if path.is_empty() {continue}
        if out.len() >= MAX_LINKS {break}
        out.push(json!({"id":node.id,"kind":node.kind.as_str(),"path":path,
            "name":property(node,"symbol_name").or_else(||property(node,"semantic_id")),
            "relation":relation,"revision":node.version,
            "digest":property(node,"content_sha256"),
            "status":property(node,"status")}));
    }
    out.sort_by(|a,b| a["path"].as_str().cmp(&b["path"].as_str())
        .then(a["id"].as_str().cmp(&b["id"].as_str())));
    Ok(out)
}
pub struct DevelopmentGraphEngine { graph: Arc<Graph> }
impl DevelopmentGraphEngine {
    pub fn new(graph: Graph) -> Self {Self{graph:Arc::new(graph)}}
}
impl ComputeEngine for DevelopmentGraphEngine {
    fn descriptor(&self) -> EngineDescriptor {
        EngineDescriptor::new(PURE_ENGINE_SLOT,"hqkg-indexed-graph/v1",PURE_INTERFACE,PURE_OPERATIONS)
    }
    fn execute(&self, request: &EngineRequest) -> Result<EngineOutput> {
        if !PURE_OPERATIONS.contains(&request.operation.as_str()) {
            return Err(Error::Unsupported("not a pure graph operation".into()));
        }
        let (sources,upstream)=request_parts(request)?;
        let mut canonical = BTreeMap::new();
        for (id,revision,digest) in sources {
            canonical.insert(id.to_string(),source_node(&self.graph,id,revision,digest)?);
        }
        let mut imports = BTreeMap::<String,Value>::new();
        let mut dependents = BTreeMap::<String,Value>::new();
        let mut symbols = BTreeMap::<String,Value>::new();
        let mut semantic = BTreeMap::<String,Value>::new();
        for id in canonical.keys() {
            if matches!(request.operation.as_str(),"select-context"|"compile"|"project") {
                for row in linked(&self.graph,id,"imports",false)? {
                    if let Some(key)=row["id"].as_str(){imports.insert(key.into(),row);}
                }
            }
            if matches!(request.operation.as_str(),"evaluate"|"project") {
                for row in linked(&self.graph,id,"imports",true)? {
                    if let Some(key)=row["id"].as_str(){dependents.insert(key.into(),row);}
                }
            }
            if matches!(request.operation.as_str(),"interpret"|"compile"|"project") {
                for row in linked(&self.graph,id,"contains-indexed-symbol",false)? {
                    if let Some(key)=row["id"].as_str(){symbols.insert(key.into(),row);}
                }
                for row in linked(&self.graph,id,"has-semantic-anchor",false)? {
                    if let Some(key)=row["id"].as_str(){semantic.insert(key.into(),row);}
                }
            }
        }
        // Dependency data is actually produced by upstream native steps.
        // Decode it as a versioned, bounded development read model.
        let mut previous = Vec::new();
        for (id,data) in upstream {
            let value:Value=serde_json::from_str(data)
                .map_err(|_|Error::Invalid("upstream computation is not structured graph data".into()))?;
            if value["schema"]!="hqkg.development-transform/1"
                || value["authority"]!="none" {
                return Err(Error::Conflict("upstream compute contract mismatch".into()));
            }
            previous.push(json!({"stepId":id,"operation":value["operation"],
                "sourceCount":value["sourceCount"],"importCount":value["importCount"],
                "symbolCount":value["symbolCount"],"semanticCount":value["semanticCount"],
                "dependentCount":value["dependentCount"]}));
        }
        let state=if canonical.is_empty(){"no-bound-sources"}else{"indexed-source-backed"};
        let output=json!({
            "schema":"hqkg.development-transform/1","authority":"none",
            "evidence":"indexed-static-only","operation":request.operation,"state":state,
            "sourceCount":canonical.len(),"importCount":imports.len(),"symbolCount":symbols.len(),
            "semanticCount":semantic.len(),"dependentCount":dependents.len(),
            "sources":canonical.into_values().collect::<Vec<_>>(),
            "imports":imports.into_values().collect::<Vec<_>>(),
            "symbols":symbols.into_values().collect::<Vec<_>>(),
            "semantics":semantic.into_values().collect::<Vec<_>>(),
            "dependents":dependents.into_values().collect::<Vec<_>>(),
            "upstream":previous,"executionAuthorized":false,"effectPerformed":false
        });
        let text=serde_json::to_string(&output).map_err(|e|Error::Invalid(e.to_string()))?;
        if text.len()>MAX_RESULT_BYTES {return Err(Error::Invalid("computed graph projection exceeds budget".into()))}
        Ok(EngineOutput{data:text})
    }
}
/// Reuse the existing engine registry and generation leases. The registry owns
/// one clone of the indexed graph snapshot for the duration of this computation.
pub fn install_development_engine(registry:&EngineRegistry,graph:Graph)->Result<SwapReceipt>{
    registry.install(Arc::new(DevelopmentGraphEngine::new(graph)),None)
}
