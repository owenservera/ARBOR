//! Strict JSON wire adapter for desktop and future Android native bindings.
//! A successful response is an inert validation result, never an effect permit.
//! Caller-provided policy constraints are NOT authenticated grants.
use std::collections::BTreeSet;
use serde::Deserialize;
use serde_json::{json, Value};
use crate::{DataClass, PolicyLimits, Program, Refusal, Risk, SourceRef,
            TransformKind, TransformStep, validate_program};

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct Request { schema: String, program: WireProgram, policy: WirePolicy }
#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct WireProgram { id:String, revision:u64, policy_id:String, policy_revision:u64,
                     steps:Vec<WireStep> }
#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct WirePolicy { id:String, revision:u64, max_risk:String,
                    max_input_class:String, max_output_class:String,
                    allowed_destinations:Vec<String>, allow_effect_candidates:bool }
#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct WireStep { id:String, kind:String, dependencies:Vec<String>, inputs:Vec<WireSource>,
                  output_data_class:String, risk:String, destination:Option<String> }
#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct WireSource { source_id:String, revision:u64, digest:String, data_class:String }
fn class(s:&str)->Option<DataClass>{Some(match s{
    "public"=>DataClass::Public,"internal"=>DataClass::Internal,
    "private"=>DataClass::Private,"sensitive"=>DataClass::Sensitive,
    "secret"=>DataClass::Secret,_=>return None,
})}
fn risk(s:&str)->Option<Risk>{Some(match s{
    "R0"=>Risk::R0,"R1"=>Risk::R1,"R2"=>Risk::R2,
    "R3"=>Risk::R3,_=>return None,
})}
fn kind(s:&str)->Option<TransformKind>{Some(match s{
    "normalize"=>TransformKind::Normalize,
    "select_context"=>TransformKind::SelectContext,
    "interpret"=>TransformKind::Interpret,
    "compile"=>TransformKind::Compile,
    "evaluate"=>TransformKind::Evaluate,
    "project"=>TransformKind::Project,
    "effect_candidate"=>TransformKind::EffectCandidate,_=>return None,
})}
fn parse(req: Request)->Result<(Program,PolicyLimits),&'static str>{
    if req.schema!=crate::SCHEMA {return Err("SCHEMA_UNSUPPORTED");}
    let p=req.policy;
    if p.allowed_destinations.len()>64 {return Err("TOO_MANY_DESTINATIONS");}
    let limits=PolicyLimits{
        id:p.id,revision:p.revision,
        max_risk:risk(&p.max_risk).ok_or("INVALID_RISK")?,
        max_input_class:class(&p.max_input_class).ok_or("INVALID_CLASS")?,
        max_output_class:class(&p.max_output_class).ok_or("INVALID_CLASS")?,
        allowed_destinations:p.allowed_destinations.into_iter().collect::<BTreeSet<_>>(),
        allow_effect_candidates:p.allow_effect_candidates,
    };
    let mut steps=Vec::new();
    if req.program.steps.len()>crate::MAX_STEPS{return Err("TOO_MANY_STEPS");}
    for s in req.program.steps {
        if s.inputs.len()>crate::MAX_INPUTS{return Err("TOO_MANY_INPUTS");}
        if s.dependencies.len()>crate::MAX_DEPENDENCIES{return Err("TOO_MANY_DEPENDENCIES");}
        let mut inputs=Vec::new();
        for i in s.inputs{
            inputs.push(SourceRef{
                source_id:i.source_id,revision:i.revision,digest:i.digest,
                data_class:class(&i.data_class).ok_or("INVALID_CLASS")?,
            })
        }
        steps.push(TransformStep{
            id:s.id,
            kind:kind(&s.kind).ok_or("INVALID_TRANSFORM")?,
            dependencies:s.dependencies,inputs,
            output_data_class:class(&s.output_data_class).ok_or("INVALID_CLASS")?,
            risk:risk(&s.risk).ok_or("INVALID_RISK")?,
            destination:s.destination,
        });
    }
    Ok((Program{
        id:req.program.id,revision:req.program.revision,
        policy_id:req.program.policy_id,policy_revision:req.program.policy_revision,
        steps,
    },limits))
}
fn name(refusal:&Refusal)->&'static str {match refusal{
    Refusal::InvalidId=>"INVALID_ID",
    Refusal::InvalidRevision=>"INVALID_REVISION",
    Refusal::InvalidDigest=>"INVALID_DIGEST",
    Refusal::EmptyProgram=>"EMPTY_PROGRAM",
    Refusal::TooManySteps=>"TOO_MANY_STEPS",
    Refusal::TooManyInputs=>"TOO_MANY_INPUTS",
    Refusal::TooManyDependencies=>"TOO_MANY_DEPENDENCIES",
    Refusal::DuplicateStep=>"DUPLICATE_STEP",
    Refusal::MissingDependency=>"MISSING_DEPENDENCY",
    Refusal::CyclicDependency=>"CYCLIC_DEPENDENCY",
    Refusal::PolicyStale=>"POLICY_STALE",
    Refusal::RiskExceedsPolicy=>"RISK_EXCEEDS_POLICY",
    Refusal::InputClassExceedsPolicy=>"INPUT_CLASS_EXCEEDS_POLICY",
    Refusal::OutputClassExceedsPolicy=>"OUTPUT_CLASS_EXCEEDS_POLICY",
    Refusal::DataClassDowngrade=>"DATA_CLASS_DOWNGRADE",
    Refusal::DestinationNotAllowed=>"DESTINATION_NOT_ALLOWED",
    Refusal::SecretExternalDisclosure=>"SECRET_EXTERNAL_DISCLOSURE",
    Refusal::EffectCandidateDisabled=>"EFFECT_CANDIDATE_DISABLED",
}}
fn refuse(reason:&str)->Value {json!({
    "schema":crate::SCHEMA,"outcome":"refused","reasonCode":reason,
    "executionAuthorized":false,"effectPerformed":false
})}
/// Decode the same bounded strict wire for trusted local native callers.
pub fn decode_json(input:&str)->Result<(Program,PolicyLimits),&'static str>{
    if input.len()>65_536{return Err("INPUT_TOO_LARGE")}
    let raw:Request=serde_json::from_str(input).map_err(|_|"INVALID_WIRE")?;
    parse(raw)
}
/// Byte-limited, strict schema, deterministic output. Never handles grant tokens.
/// The Host must supply CURRENT authenticated policy and separately admit each effect.
pub fn validate_json(input:&str)->Value {
    let (program,policy)=match decode_json(input){
        Ok(v)=>v,Err(e)=>return refuse(e),
    };
    match validate_program(&program,&policy){
        Ok(v)=>json!({
            "schema":v.schema,"outcome":"compiled",
            "programId":v.program_id,"programRevision":v.program_revision,
            "policyRevision":v.policy_revision,"orderedStepIds":v.ordered_step_ids,
            "lineage":crate::lineage::project(&program,&v),
            "executionAuthorized":false,"effectPerformed":false
        }),
        Err(e)=>refuse(name(&e)),
    }
}
#[cfg(test)]
mod tests {
    use super::*;
    fn wire()->Value {json!({
        "schema":"vivim.native-program/1",
        "program":{"id":"mission","revision":1,"policy_id":"owner-policy",
          "policy_revision":1,"steps":[{"id":"read","kind":"evaluate",
          "dependencies":[],"inputs":[],"output_data_class":"public",
          "risk":"R0","destination":null}]},
        "policy":{"id":"owner-policy","revision":1,"max_risk":"R0",
          "max_input_class":"private","max_output_class":"private",
          "allowed_destinations":[],"allow_effect_candidates":false}
    })}
    #[test] fn valid_wire_compiles_inertly(){
        let v=validate_json(&wire().to_string());
        assert_eq!(v["outcome"],"compiled");
        assert_eq!(v["executionAuthorized"],false);
        assert_eq!(v["orderedStepIds"][0],"read");
        assert_eq!(v["lineage"]["schema"],"vivim.native-transform-lineage/1");
        assert_eq!(v["lineage"]["executionAuthorized"],false);
    }
    #[test] fn strict_fields_fail_closed(){
        let mut w=wire();w["approval"]=json!(true);
        assert_eq!(validate_json(&w.to_string())["reasonCode"],"INVALID_WIRE");
    }
    #[test] fn stale_policy_fails_closed(){
        let mut w=wire();w["program"]["policy_revision"]=json!(2);
        assert_eq!(validate_json(&w.to_string())["reasonCode"],"POLICY_STALE");
    }
    #[test] fn no_secret_to_public_laundering(){
        let mut w=wire();w["program"]["steps"][0]["inputs"]=json!([{
          "source_id":"private-ref","revision":1,"digest":"a".repeat(64),
          "data_class":"private"
        }]);
        assert_eq!(validate_json(&w.to_string())["reasonCode"],"DATA_CLASS_DOWNGRADE");
    }
    #[test] fn overlarge_input_is_refused(){
        assert_eq!(validate_json(&"x".repeat(65_537))["reasonCode"],"INPUT_TOO_LARGE");
    }
}
