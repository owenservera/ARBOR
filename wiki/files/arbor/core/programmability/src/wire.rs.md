# File: core/programmability/src/wire.rs

> Generated 2026-11-19 · Rust · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | core/programmability/src/wire.rs |
| Language | Rust |
| Kind | source |
| Size | 8099 B |
| Lines | 170 |
| Hash | 32d263442bfe |
| Test | no |
| Generated | no |
| Component | core |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| Request | struct | 12 | no | struct Request { schema: String, program: WireProgram, policy: WirePolicy } |
| WireProgram | struct | 15 | no | struct WireProgram { id:String, revision:u64, policy_id:String, policy_revision:u64, |
| WirePolicy | struct | 19 | no | struct WirePolicy { id:String, revision:u64, max_risk:String, |
| WireStep | struct | 24 | no | struct WireStep { id:String, kind:String, dependencies:Vec&lt;String&gt;, inputs:Vec&lt;WireSource&gt;, |
| WireSource | struct | 28 | no | struct WireSource { source_id:String, revision:u64, digest:String, data_class:String } |
| risk | function | 34 | no | fn risk(s:&amp;str)-&gt;Option&lt;Risk&gt;{Some(match s{ &quot;R0&quot;=&gt;Risk::R0,&quot;R1&quot;=&gt;Risk::R1,&quot;R2&quot;=&gt;Risk::R2, &quot;R3&quot;=&gt;Risk::R3,_=&gt;return None, })} |
| kind | function | 38 | no | fn kind(s:&amp;str)-&gt;Option&lt;TransformKind&gt;{Some(match s{ &quot;normalize&quot;=&gt;TransformKind::Normalize, &quot;select_context&quot;=&gt;TransformKind::SelectContext, &quot;interpret&quot;=&gt;TransformKind::Interpret, &quot;compile&quot;=&gt;Transform… |
| parse | function | 47 | no | fn parse(req: Request)-&gt;Result&lt;(Program,PolicyLimits),&amp;&#39;static str&gt;{ |
| name | function | 86 | no | fn name(refusal:&amp;Refusal)-&gt;&amp;&#39;static str {match refusal{ |
| refuse | function | 106 | no | fn refuse(reason:&amp;str)-&gt;Value {json!({ &quot;schema&quot;:crate::SCHEMA,&quot;outcome&quot;:&quot;refused&quot;,&quot;reasonCode&quot;:reason, &quot;executionAuthorized&quot;:false,&quot;effectPerformed&quot;:false })} |
| validate_json | function | 112 | yes | pub fn validate_json(input:&amp;str)-&gt;Value { |
| tests | module | 132 | no | mod tests { |
| wire | function | 134 | no | fn wire()-&gt;Value {json!({ &quot;schema&quot;:&quot;vivim.native-program/1&quot;, &quot;program&quot;:{&quot;id&quot;:&quot;mission&quot;,&quot;revision&quot;:1,&quot;policy_id&quot;:&quot;owner-policy&quot;, &quot;policy_revision&quot;:1,&quot;steps&quot;:[{&quot;id&quot;:&quot;read&quot;,&quot;kind&quot;:&quot;evaluate&quot;, &quot;dependenc… |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| std::collections::BTreeSet | use | 4 | external |
| serde::Deserialize | use | 5 | external |
| serde_json::{json, Value} | use | 6 | external |
| crate::{DataClass, PolicyLimits, Program, Refusal, Risk, SourceRef, | use | 7 | external |
| super::* | use | 133 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```rust
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
```

_First 80 of 171 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
