//! VIVIM product-native programmability primitives.
//!
//! PURE LIBRARY ONLY: no network, storage, timers, grants, Host effects,
//! scheduling, code loading or provider operations. This crate accepts
//! already-authenticated caller-supplied metadata; it does not authenticate it.
//! An accepted program is an INERT candidate, never an authorization token.

use std::collections::{BTreeMap, BTreeSet};

pub mod wire;
pub mod visual;
pub mod wiki_read;
pub mod vec;
pub mod command_program;
pub mod context_grounding;
pub mod wiki_target;
pub mod recovery_diagnosis;
pub mod ui_value;
pub mod product_kernel;
pub mod ui_tokens;
pub mod navigation;
pub mod vec_admission;
pub mod source_digest;
#[cfg(target_arch="wasm32")]
pub mod browser_abi;
mod lineage;

pub const SCHEMA: &str = "vivim.native-program/1";
pub const MAX_STEPS: usize = 64;
pub const MAX_INPUTS: usize = 64;
pub const MAX_DEPENDENCIES: usize = 64;

/// Contract identifiers of the existing HQKG typed DAG this translation targets
/// (`native/hqkg/src/typed_dag.rs` + `native/hqkg/src/engine.rs`). This crate
/// stays dependency-free, so the literals are mirrored here and asserted equal
/// on both sides by their tests.
pub const HQKG_DAG_CONTRACT: &str = "hqkg.typed-dag/1";
pub const HQKG_PURE_INTERFACE: &str = "hqkg.transform.pure/1";
pub const HQKG_PURE_ENGINE_SLOT: &str = "vlang.pure";

/// Classification is ordered, so allowed disclosure never expands implicitly.
#[derive(Clone, Copy, Debug, Eq, PartialEq, Ord, PartialOrd)]
pub enum DataClass { Public, Internal, Private, Sensitive, Secret }

#[derive(Clone, Copy, Debug, Eq, PartialEq, Ord, PartialOrd)]
pub enum Risk { R0, R1, R2, R3 }

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct SourceRef {
    pub source_id: String,
    pub revision: u64,
    /// SHA-256 hex of exact source bytes, NOT source authenticity.
    pub digest: String,
    pub data_class: DataClass,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum TransformKind {
    Normalize,
    SelectContext,
    Interpret,
    Compile,
    Evaluate,
    Project,
    /// Non-executing description of an effect to be submitted to Host.
    EffectCandidate,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct TransformStep {
    pub id: String,
    pub kind: TransformKind,
    pub dependencies: Vec<String>,
    pub inputs: Vec<SourceRef>,
    pub output_data_class: DataClass,
    pub risk: Risk,
    /// Absent means internal local-only output, never implied provider access.
    pub destination: Option<String>,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Program {
    pub id: String,
    pub revision: u64,
    pub policy_id: String,
    pub policy_revision: u64,
    pub steps: Vec<TransformStep>,
}

/// Caller must supply CURRENT policy after checking owner, revocation & grants.
/// This snapshot is not permission to disclose or execute.
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PolicyLimits {
    pub id: String,
    pub revision: u64,
    pub max_risk: Risk,
    pub max_input_class: DataClass,
    pub max_output_class: DataClass,
    pub allowed_destinations: BTreeSet<String>,
    pub allow_effect_candidates: bool,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum Refusal {
    InvalidId,
    InvalidRevision,
    InvalidDigest,
    EmptyProgram,
    TooManySteps,
    TooManyInputs,
    TooManyDependencies,
    DuplicateStep,
    MissingDependency,
    CyclicDependency,
    PolicyStale,
    RiskExceedsPolicy,
    InputClassExceedsPolicy,
    OutputClassExceedsPolicy,
    DataClassDowngrade,
    DestinationNotAllowed,
    SecretExternalDisclosure,
    EffectCandidateDisabled,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ValidatedProgram {
    pub schema: &'static str,
    pub program_id: String,
    pub program_revision: u64,
    pub policy_revision: u64,
    /// Stable topological order; independent of authored list order.
    pub ordered_step_ids: Vec<String>,
    pub execution_authorized: bool,
    pub effect_performed: bool,
}

fn identifier(s: &str) -> bool {
    !s.is_empty() && s.len() <= 128 &&
    s.as_bytes().iter().all(|b| b.is_ascii_alphanumeric() || b"._:-".contains(b))
}

fn digest_ok(s: &str) -> bool {
    s.len() == 64 && s.as_bytes().iter().all(|b| b.is_ascii_hexdigit() && !b.is_ascii_uppercase())
}

/// A deterministic compiler of *inert* typed transformation DAGs.
///
/// Does not consult an external registry; the owner must validate action IDs
/// against the current Host action catalogue when mapping this into effects.
/// No method here accepts or returns approval/grant tokens.
pub fn validate_program(program: &Program, policy: &PolicyLimits) -> Result<ValidatedProgram, Refusal> {
    if !identifier(&program.id) || !identifier(&program.policy_id) ||
       !identifier(&policy.id) { return Err(Refusal::InvalidId); }
    if program.revision == 0 || program.policy_revision == 0 || policy.revision == 0 {
        return Err(Refusal::InvalidRevision);
    }
    if program.policy_id != policy.id || program.policy_revision != policy.revision {
        return Err(Refusal::PolicyStale);
    }
    if program.steps.is_empty() { return Err(Refusal::EmptyProgram); }
    if program.steps.len() > MAX_STEPS { return Err(Refusal::TooManySteps); }

    let mut index = BTreeMap::new();
    for step in &program.steps {
        if !identifier(&step.id) { return Err(Refusal::InvalidId); }
        if index.insert(step.id.as_str(), step).is_some() { return Err(Refusal::DuplicateStep); }
        if step.dependencies.len() > MAX_DEPENDENCIES { return Err(Refusal::TooManyDependencies); }
        if step.inputs.len() > MAX_INPUTS { return Err(Refusal::TooManyInputs); }
        if step.risk > policy.max_risk { return Err(Refusal::RiskExceedsPolicy); }
        if step.output_data_class > policy.max_output_class {
            return Err(Refusal::OutputClassExceedsPolicy);
        }
        if matches!(step.kind, TransformKind::EffectCandidate) && !policy.allow_effect_candidates {
            return Err(Refusal::EffectCandidateDisabled);
        }
        if let Some(dest) = &step.destination {
            if !identifier(dest) || !policy.allowed_destinations.contains(dest) {
                return Err(Refusal::DestinationNotAllowed);
            }
            if step.output_data_class == DataClass::Secret {
                return Err(Refusal::SecretExternalDisclosure);
            }
        }
        let mut source_ids = BTreeSet::new();
        for source in &step.inputs {
            if !identifier(&source.source_id) { return Err(Refusal::InvalidId); }
            if source.revision == 0 { return Err(Refusal::InvalidRevision); }
            if !digest_ok(&source.digest) { return Err(Refusal::InvalidDigest); }
            if source.data_class > policy.max_input_class {
                return Err(Refusal::InputClassExceedsPolicy);
            }
            // A claim that private data became public is not proof of redaction.
            // Future explicit declassification requires an authenticated Host-owned verifier.
            if source.data_class > step.output_data_class {
                return Err(Refusal::DataClassDowngrade);
            }
            if !source_ids.insert((&source.source_id, source.revision, &source.digest)) {
                return Err(Refusal::InvalidId);
            }
        }
    }

    let mut sorted = Vec::with_capacity(index.len());
    let mut visited = BTreeSet::new();
    let mut visiting = BTreeSet::new();
    fn visit<'a>(
        id: &'a str,
        index: &BTreeMap<&'a str, &'a TransformStep>,
        visited: &mut BTreeSet<&'a str>,
        visiting: &mut BTreeSet<&'a str>,
        sorted: &mut Vec<String>,
    ) -> Result<(), Refusal> {
        if visited.contains(id) { return Ok(()); }
        if !visiting.insert(id) { return Err(Refusal::CyclicDependency); }
        let step = index.get(id).ok_or(Refusal::MissingDependency)?;
        let mut deps = BTreeSet::new();
        for dep in &step.dependencies {
            if !identifier(dep) { return Err(Refusal::InvalidId); }
            if !deps.insert(dep.as_str()) { return Err(Refusal::DuplicateStep); }
        }
        for dep in deps {
            visit(dep, index, visited, visiting, sorted)?;
        }
        visiting.remove(id);
        visited.insert(id);
        sorted.push(id.to_owned());
        Ok(())
    }
    for id in index.keys() {
        visit(id, &index, &mut visited, &mut visiting, &mut sorted)?;
    }
    // Dependency results carry the same taint as direct source references.
    // A downstream transform cannot self-declare a less sensitive output.
    for id in &sorted {
        let step = index.get(id.as_str()).ok_or(Refusal::MissingDependency)?;
        for dep in &step.dependencies {
            let predecessor = index.get(dep.as_str()).ok_or(Refusal::MissingDependency)?;
            if predecessor.output_data_class > step.output_data_class {
                return Err(Refusal::DataClassDowngrade);
            }
        }
    }
    Ok(ValidatedProgram {
        schema: SCHEMA,
        program_id: program.id.clone(),
        program_revision: program.revision,
        policy_revision: policy.revision,
        ordered_step_ids: sorted,
        execution_authorized: false,
        effect_performed: false,
    })
}

impl TransformKind {
    /// Operation the existing HQKG pure engine serves for this kind.
    /// `None` for effect candidates: an effect is never a pure transform.
    pub fn pure_operation(&self) -> Option<&'static str> {
        Some(match self {
            TransformKind::Normalize => "normalize",
            TransformKind::SelectContext => "select-context",
            TransformKind::Interpret => "interpret",
            TransformKind::Compile => "compile",
            TransformKind::Evaluate => "evaluate",
            TransformKind::Project => "project",
            TransformKind::EffectCandidate => return None,
        })
    }
}

/// Inert identity of a validated program; the native DAG must execute exactly
/// this program revision.
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ProgramIdentity {
    pub id: String,
    pub revision: u64,
    pub policy_revision: u64,
}

/// Validated source reference in the HQKG `SourceBinding` shape.
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PureSourceBinding {
    pub id: String,
    pub revision: u64,
    pub digest: String,
    /// Where the identity was asserted. This crate cannot verify provenance.
    pub provenance: String,
}

/// One validated typed step translated to the HQKG `TransformStep` shape.
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PureTransformStep {
    pub id: String,
    pub engine: String,
    pub operation: String,
    pub input: String,
    pub sources: Vec<PureSourceBinding>,
    pub after: Vec<String>,
    pub retry_io: u8,
}

/// Field-for-field translation of a validated program into the plan the
/// existing native DAG executes. Namespace and revision token are bound by the
/// native caller; identity, step order and dependencies are exactly the
/// validated ones. No step is executable as an effect.
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PureTransformProgram {
    pub contract: &'static str,
    pub interface: &'static str,
    pub identity: ProgramIdentity,
    pub steps: Vec<PureTransformStep>,
}

/// Validate first, then translate. The policy validator above is unchanged;
/// this only projects an already-validated program onto the existing HQKG pure
/// contract, in stable topological order.
pub fn to_pure_transform_program(
    program: &Program,
    policy: &PolicyLimits,
) -> Result<PureTransformProgram, Refusal> {
    let validated = validate_program(program, policy)?;
    let by_id: BTreeMap<&str, &TransformStep> =
        program.steps.iter().map(|s| (s.id.as_str(), s)).collect();
    let mut steps = Vec::with_capacity(validated.ordered_step_ids.len());
    for id in &validated.ordered_step_ids {
        let step = *by_id
            .get(id.as_str())
            .ok_or(Refusal::MissingDependency)?;
        let operation = step
            .kind
            .pure_operation()
            .ok_or(Refusal::EffectCandidateDisabled)?;
        let provenance = format!("native-program/{}@{}", program.id, program.revision);
        let mut sources = Vec::with_capacity(step.inputs.len());
        for source in &step.inputs {
            sources.push(PureSourceBinding {
                id: source.source_id.clone(),
                revision: source.revision,
                digest: source.digest.clone(),
                provenance: provenance.clone(),
            });
        }
        let mut after = step.dependencies.clone();
        after.sort();
        after.dedup();
        steps.push(PureTransformStep {
            id: step.id.clone(),
            engine: HQKG_PURE_ENGINE_SLOT.into(),
            operation: operation.into(),
            input: operation.into(),
            sources,
            after,
            // Pure engines do no IO; there is nothing to retry.
            retry_io: 0,
        });
    }
    Ok(PureTransformProgram {
        contract: HQKG_DAG_CONTRACT,
        interface: HQKG_PURE_INTERFACE,
        identity: ProgramIdentity {
            id: validated.program_id.clone(),
            revision: validated.program_revision,
            policy_revision: validated.policy_revision,
        },
        steps,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    fn limits() -> PolicyLimits {
        PolicyLimits {
            id: "policy".into(), revision: 2, max_risk: Risk::R1,
            max_input_class: DataClass::Private, max_output_class: DataClass::Private,
            allowed_destinations: BTreeSet::from(["claude".into()]),
            allow_effect_candidates: false,
        }
    }
    fn step(id: &str, deps: &[&str]) -> TransformStep {
        TransformStep {
            id: id.into(), kind: TransformKind::Evaluate,
            dependencies: deps.iter().map(|s| s.to_string()).collect(),
            inputs: vec![SourceRef {source_id: "context".into(), revision: 1,
                digest: "a".repeat(64), data_class: DataClass::Private}],
            output_data_class: DataClass::Private, risk: Risk::R0,
            destination: None,
        }
    }
    fn program(steps: Vec<TransformStep>) -> Program {
        Program {id: "mission".into(), revision: 1,
            policy_id: "policy".into(), policy_revision: 2, steps}
    }
    #[test]
    fn sorted_dag_is_stable_and_never_authorizes() {
        let a = program(vec![step("finish", &["begin"]),step("begin", &[])]);
        let b = program(vec![step("begin", &[]),step("finish", &["begin"])]);
        let va=validate_program(&a,&limits()).unwrap();
        assert_eq!(va.ordered_step_ids, vec!["begin", "finish"]);
        assert_eq!(va.ordered_step_ids,validate_program(&b,&limits()).unwrap().ordered_step_ids);
        assert!(!va.execution_authorized && !va.effect_performed);
    }
    #[test]
    fn missing_or_cyclic_dependencies_refused() {
        assert_eq!(validate_program(&program(vec![step("a",&["b"])]),&limits()).unwrap_err(),Refusal::MissingDependency);
        assert_eq!(validate_program(&program(vec![step("a",&["b"]),step("b",&["a"])]),&limits()).unwrap_err(),Refusal::CyclicDependency);
    }
    #[test]
    fn duplicate_ids_refused() {
        assert_eq!(validate_program(&program(vec![step("a",&[]),step("a",&[])]),&limits()).unwrap_err(),Refusal::DuplicateStep);
    }
    #[test]
    fn stale_policy_fails_closed() {
        let mut p=program(vec![step("a",&[])]);
        p.policy_revision=1;
        assert_eq!(validate_program(&p,&limits()).unwrap_err(),Refusal::PolicyStale);
    }
    #[test]
    fn risk_cannot_exceed_policy() {
        let mut s=step("a",&[]);s.risk=Risk::R2;
        assert_eq!(validate_program(&program(vec![s]),&limits()).unwrap_err(),Refusal::RiskExceedsPolicy);
    }
    #[test]
    fn class_cannot_exceed_policy() {
        let mut s=step("a",&[]);s.inputs[0].data_class=DataClass::Sensitive;
        assert_eq!(validate_program(&program(vec![s]),&limits()).unwrap_err(),Refusal::InputClassExceedsPolicy);
    }
    #[test]
    fn destination_requires_allowlist() {
        let mut s=step("a",&[]);s.destination=Some("gemini".into());
        assert_eq!(validate_program(&program(vec![s]),&limits()).unwrap_err(),Refusal::DestinationNotAllowed);
    }
    #[test]
    fn effects_are_inert_and_default_refused() {
        let mut s=step("a",&[]);s.kind=TransformKind::EffectCandidate;
        assert_eq!(validate_program(&program(vec![s]),&limits()).unwrap_err(),Refusal::EffectCandidateDisabled);
    }
    #[test]
    fn source_taint_cannot_be_laundered_into_public() {
        let mut s=step("a",&[]);s.output_data_class=DataClass::Public;
        assert_eq!(validate_program(&program(vec![s]),&limits()).unwrap_err(),Refusal::DataClassDowngrade);
    }
    #[test]
    fn dependency_taint_cannot_be_downgraded() {
        let mut s=step("b",&["a"]);s.inputs.clear();s.output_data_class=DataClass::Public;
        assert_eq!(validate_program(&program(vec![step("a",&[]),s]),&limits()).unwrap_err(),Refusal::DataClassDowngrade);
    }
    #[test]
    fn malformed_sha_refused() {
        let mut s=step("a",&[]);s.inputs[0].digest="notahash".into();
        assert_eq!(validate_program(&program(vec![s]),&limits()).unwrap_err(),Refusal::InvalidDigest);
    }
    #[test]
    fn pure_translation_preserves_identity_and_dependencies() {
        let p=program(vec![step("publish",&["transform"]),step("transform",&["read"]),step("read",&[])]);
        let pure=to_pure_transform_program(&p,&limits()).unwrap();
        assert_eq!(pure.contract,"hqkg.typed-dag/1");
        assert_eq!(pure.interface,"hqkg.transform.pure/1");
        assert_eq!(pure.identity,ProgramIdentity{id:"mission".into(),revision:1,policy_revision:2});
        assert_eq!(pure.steps.iter().map(|s|s.id.as_str()).collect::<Vec<_>>(),vec!["read","transform","publish"]);
        assert_eq!(pure.steps[2].after,vec!["transform"]);
        assert!(pure.steps.iter().all(|s|s.engine=="vlang.pure"));
        assert!(pure.steps.iter().all(|s|s.operation=="evaluate"));
        assert!(pure.steps.iter().all(|s|s.input=="evaluate"));
        assert!(pure.steps.iter().all(|s|s.retry_io==0));
        assert_eq!(pure.steps[0].sources[0].provenance,"native-program/mission@1");
        // Authoring order must not change the validated plan.
        let reordered=program(vec![step("read",&[]),step("transform",&["read"]),step("publish",&["transform"])]);
        assert_eq!(pure,to_pure_transform_program(&reordered,&limits()).unwrap());
    }
    #[test]
    fn effect_candidates_never_become_pure_steps() {
        let mut s=step("publish",&[]);s.kind=TransformKind::EffectCandidate;
        let mut l=limits();l.allow_effect_candidates=true;
        let p=program(vec![s]);
        // The policy validator is untouched and still accepts it ...
        assert!(validate_program(&p,&l).is_ok());
        // ... but an effect is never executable as a pure transform.
        assert_eq!(to_pure_transform_program(&p,&l).unwrap_err(),Refusal::EffectCandidateDisabled);
    }
    #[test]
    fn unvalidated_programs_are_not_translated() {
        let cyclic=program(vec![step("a",&["b"]),step("b",&["a"])]);
        assert_eq!(to_pure_transform_program(&cyclic,&limits()).unwrap_err(),Refusal::CyclicDependency);
        let mut bad=step("a",&[]);bad.inputs[0].digest="nope".into();
        assert_eq!(to_pure_transform_program(&program(vec![bad]),&limits()).unwrap_err(),Refusal::InvalidDigest);
    }
    #[test]
    fn pure_contract_literals_match_the_hqkg_engine_contract() {
        assert_eq!(HQKG_PURE_ENGINE_SLOT,"vlang.pure");
        assert_eq!(HQKG_PURE_INTERFACE,"hqkg.transform.pure/1");
        assert_eq!(HQKG_DAG_CONTRACT,"hqkg.typed-dag/1");
        assert_eq!(TransformKind::EffectCandidate.pure_operation(),None);
        assert_eq!(TransformKind::SelectContext.pure_operation(),Some("select-context"));
    }
}
