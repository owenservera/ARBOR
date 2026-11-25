//! In-process bridge from the existing VIVIM validator into the existing HQKG DAG.
//! @hq:capability hqkg.indexed-native-program@1
//! @hq:consumes vivim.native-program@1
//! @hq:consumes hqkg.typed-dag@1
//! Indexed development metadata only. Caller owns current graph and policy;
//! this is not live source authentication or a Host execution permission.
use crate::{Error, Graph, Result};
use crate::engine::{Budget,CancellationToken,EngineRegistry};
use crate::typed_dag::{self,DagExecutor,DagReport,GraphDomain,IncrementalCache,ProgramIdentity,RevisionToken,SourceBinding,TransformStep,ValidatedPureProgram};
use vivim_programmability_core::{self as core,DataClass,PolicyLimits,Program,Risk,SourceRef,TransformKind};
use crate::semantic_source::{self, SourceAnchor};

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

/// A closed set of read-only computations over an exact versioned capability.
/// No arbitrary operation string or effect candidate enters the program.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum SemanticTask {
    Inspect,
    Impact,
    Compose,
}
impl SemanticTask {
    pub fn parse(value: &str) -> Result<Self> {
        match value {
            "inspect" => Ok(Self::Inspect),
            "impact" => Ok(Self::Impact),
            "compose" => Ok(Self::Compose),
            _ => Err(Error::Invalid("semantic task must be inspect, impact or compose".into())),
        }
    }
    pub fn name(self) -> &'static str {
        match self {
            Self::Inspect => "inspect",
            Self::Impact => "impact",
            Self::Compose => "compose",
        }
    }
}
pub struct SemanticProgram {
    pub anchor: SourceAnchor,
    pub program: Program,
}
/// Resolve a unique, unambiguous capability declaration in the supplied graph
/// snapshot, then construct a normal typed program using existing operations.
/// Annotation identity is evidence of static source meaning, not runtime
/// capability admission. A caller still needs current owner authorization.
pub fn build_semantic_program(
    graph: &Graph, expected: &RevisionToken, semantic_id: &str,
    task: SemanticTask, policy: &PolicyLimits,
) -> Result<SemanticProgram> {
    if expected.namespace.domain != GraphDomain::Development
        || expected.graph_epoch == 0 || expected.graph_epoch != graph.epoch() {
        return Err(Error::Conflict("stale or non-development semantic snapshot".into()));
    }
    let result = semantic_source::sources(graph, semantic_id)?;
    let mut declarations = result.anchors.into_iter().filter(|a| a.annotation_kind == "capability");
    let anchor = declarations.next().ok_or_else(|| Error::Missing("no indexed capability declaration".into()))?;
    if declarations.next().is_some() || anchor.occurrence_count != 1 || anchor.state != "indexed-not-live-checked" {
        return Err(Error::Conflict("ambiguous indexed capability declaration".into()));
    }
    let node = graph.node(&anchor.file_id).ok_or_else(|| Error::Missing("capability source missing".into()))?;
    let anchor_node = graph.node(&anchor.anchor_id).ok_or_else(|| Error::Missing("capability anchor missing".into()))?;
    let source = SourceRef {
        source_id: anchor.file_id.clone(), revision: node.version,
        digest: anchor.content_digest.clone(), data_class: DataClass::Internal,
    };
    let make_step = |id: &str, kind, dependencies: Vec<String>, inputs: Vec<SourceRef>| core::TransformStep {
        id: id.into(), kind, dependencies, inputs, output_data_class: DataClass::Internal,
        risk: Risk::R0, destination: None,
    };
    // Inspect/impact operate on the exact declared source, without requiring
    // an exhaustive import closure. Compose requires complete selection and
    // will refuse if the graph traversal or source budget is exceeded.
    let first = if task == SemanticTask::Compose { TransformKind::SelectContext } else { TransformKind::Normalize };
    let mut steps = vec![
        make_step("source", first, vec![], vec![source]),
        make_step("meaning", TransformKind::Interpret, vec!["source".into()], vec![]),
    ];
    if task != SemanticTask::Inspect {
        steps.push(make_step("impact", TransformKind::Evaluate, vec!["source".into()], vec![]));
    }
    let program = Program {
        id: format!("semantic.{}.{}", anchor.anchor_id, task.name()),
        revision: anchor_node.version, policy_id: policy.id.clone(), policy_revision: policy.revision, steps,
    };
    // Validate the same normal program and source bindings before handing it
    // back to the incumbent executor; this is not an execution grant.
    bind_indexed_program(graph, expected, &program, policy)?;
    Ok(SemanticProgram { anchor, program })
}

/// Owner-scoped immutable computation session, using the existing registry,
/// validator and bounded cache. The owner must check its current authorization
/// and snapshot identity before each call. Not an effect or permission boundary.
pub struct DevelopmentSession {
    graph: std::sync::Arc<Graph>,
    expected: RevisionToken,
    registry: EngineRegistry,
    cache: IncrementalCache,
}
impl DevelopmentSession {
    pub fn new(graph: Graph, expected: RevisionToken) -> Result<Self> {
        if expected.namespace.domain != GraphDomain::Development
            || expected.graph_epoch == 0 || expected.graph_epoch != graph.epoch() {
            return Err(Error::Conflict("stale or non-development session snapshot".into()));
        }
        expected.namespace.validate()?;
        graph.check_indexes()?;
        let graph = std::sync::Arc::new(graph);
        let registry = EngineRegistry::new();
        crate::development_engine::install_shared_development_engine(&registry, std::sync::Arc::clone(&graph))?;
        Ok(Self { graph, expected, registry, cache: IncrementalCache::new() })
    }
    fn check_revision(&self, current: &RevisionToken) -> Result<()> {
        if &self.expected != current {
            return Err(Error::Conflict("development session revision changed; open a new snapshot".into()));
        }
        Ok(())
    }
    pub fn execute_program(&mut self, current: &RevisionToken, program: &Program,
        policy: &PolicyLimits, budget: Budget, cancel: &CancellationToken) -> Result<DagReport> {
        self.check_revision(current)?;
        run_indexed_program(&self.graph, current, program, policy, &self.registry,
            &mut self.cache, budget, cancel)
    }
    pub fn execute_semantic(&mut self, current: &RevisionToken, semantic_id: &str,
        task: SemanticTask, policy: &PolicyLimits, budget: Budget,
        cancel: &CancellationToken) -> Result<(SemanticProgram, DagReport)> {
        self.check_revision(current)?;
        if cancel.is_cancelled() {
            return Err(Error::Conflict("semantic computation cancelled before compilation".into()));
        }
        let compiled = build_semantic_program(&self.graph, current, semantic_id, task, policy)?;
        let report = self.execute_program(current, &compiled.program, policy, budget, cancel)?;
        Ok((compiled, report))
    }
    pub fn cache_entries(&self) -> usize { self.cache.len() }
    pub fn cache_approximate_bytes(&self) -> usize { self.cache.approximate_bytes() }
}
