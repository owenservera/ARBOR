//! In-process bridge from the existing VIVIM validator into the existing HQKG DAG.
//! @hq:capability hqkg.indexed-native-program@1
//! @hq:consumes vivim.native-program@1
//! @hq:consumes hqkg.typed-dag@1
//! Indexed development metadata only. Caller owns current graph and policy;
//! this is not live source authentication or a Host execution permission.
use crate::{Error, Graph, Result};
use crate::engine::{Budget,CancellationToken,EngineRegistry};
use crate::typed_dag::{self,DagExecutor,DagReport,GraphDomain,IncrementalCache,ProgramIdentity,RevisionToken,SourceBinding,TransformStep,ValidatedPureProgram};
use vivim_programmability_core::{self as core,DataClass,PolicyLimits,Program};

/// Bind a real validator result to the currently supplied canonical development
/// graph snapshot. The graph node version is the reference revision. Never
/// substitute a Wiki revision, filesystem timestamp, or semantic registry version.
pub fn bind_indexed_program(graph:&Graph,expected:&RevisionToken,program:&Program,policy:&PolicyLimits)->Result<ValidatedPureProgram>{
    if expected.namespace.domain!=GraphDomain::Development||expected.graph_epoch==0||expected.graph_epoch!=graph.epoch(){
        return Err(Error::Conflict("stale or non-development graph snapshot".into()))
    }
    expected.namespace.validate()?;
    for step in &program.steps{
        // Graph-derived bindings can include internal indexed metadata. A
        // source-free consumer cannot claim public output or an external destination.
        if step.inputs.is_empty() && !step.dependencies.is_empty()
            && (step.output_data_class != DataClass::Internal
                || policy.max_input_class < DataClass::Internal
                || step.destination.is_some()) {
            return Err(Error::Conflict("derived development sources require internal read-only policy".into()))
        }
        for source in &step.inputs{
            if !matches!(source.data_class,DataClass::Public|DataClass::Internal){
                return Err(Error::Conflict("private sources cannot enter development computation".into()))
            }
            let n=graph.node(&source.source_id).ok_or_else(||Error::Missing("indexed program source missing".into()))?;
            if n.kind.as_str()!="source-file"
                || n.properties.get("hqkg.exchange.source").map(String::as_str)!=Some("repos-hq.index")
                || n.version!=source.revision
                || n.properties.get("content_sha256")!=Some(&source.digest){
                return Err(Error::Conflict("indexed source identity, revision or digest mismatch".into()))
            }
        }
    }
    let pure=core::to_pure_transform_program(program,policy)
        .map_err(|e|Error::Invalid(format!("native program refused: {e:?}")))?;
    if pure.contract!=typed_dag::CONTRACT||pure.interface!=typed_dag::PURE_INTERFACE{
        return Err(Error::Conflict("native DAG contract mismatch".into()))
    }
    let identity=ProgramIdentity::new(&pure.identity.id,pure.identity.revision,pure.identity.policy_revision)?;
    let ns=expected.namespace.clone();
    let steps=pure.steps.into_iter().map(|s|TransformStep{
        id:s.id,engine:s.engine,operation:s.operation,input:s.input,
        sources:s.sources.into_iter().map(|source|SourceBinding{
            namespace:ns.clone(),id:source.id,revision:source.revision,
            digest:source.digest,provenance:source.provenance,
        }).collect(),
        after:s.after,retry_io:s.retry_io,
    }).collect();
    ValidatedPureProgram::new(identity,ns,expected.clone(),steps)
}
/// Uses the existing engine registry and cache, never a new scheduler/store.
/// A registered pure implementation is a trusted local contract, not a sandbox.
/// Holding the graph borrow fences this in-process snapshot for this run.
pub fn run_indexed_program(graph:&Graph,expected:&RevisionToken,program:&Program,policy:&PolicyLimits,
    registry:&EngineRegistry,cache:&mut IncrementalCache,budget:Budget,cancel:&CancellationToken)->Result<DagReport>{
    let bound=bind_indexed_program(graph,expected,program,policy)?;
    DagExecutor::new(registry).run_validated(&bound,expected,cache,budget,cancel)
}
