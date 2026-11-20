# File: core/programmability/src/lineage.rs

> Generated 2026-11-19 · Rust · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | core/programmability/src/lineage.rs |
| Language | Rust |
| Kind | source |
| Size | 4459 B |
| Lines | 79 |
| Hash | 199cb8ca8fd3 |
| Test | no |
| Generated | no |
| Component | core |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| SCHEMA | const | 8 | yes | pub const SCHEMA:&amp;str=&quot;vivim.native-transform-lineage/1&quot;; |
| opaque | function | 9 | no | fn opaque(kind:&amp;str,key:&amp;str)-&gt;String { |
| project | function | 19 | yes | pub(crate) fn project(program:&amp;Program, validated:&amp;ValidatedProgram)-&gt;Value { |
| tests | module | 59 | no | mod tests { |
| no_user_content_or_grants_are_exported | function | 63 | no | fn no_user_content_or_grants_are_exported() { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| std::collections::{BTreeMap,BTreeSet} | use | 3 | external |
| serde_json::{json,Value} | use | 4 | external |
| sha2::{Digest,Sha256} | use | 5 | external |
| crate::{Program,ValidatedProgram} | use | 6 | external |
| super::* | use | 60 | external |
| crate::{DataClass,TransformKind,TransformStep,Risk,SourceRef} | use | 61 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```rust
//! Pure graph read-model derived from a validated transformation DAG.
//! No graph writer, persistence, identity authority, permission or effect execution.
use std::collections::{BTreeMap,BTreeSet};
use serde_json::{json,Value};
use sha2::{Digest,Sha256};
use crate::{Program,ValidatedProgram};

pub const SCHEMA:&str="vivim.native-transform-lineage/1";
fn opaque(kind:&str,key:&str)->String {
    let mut hasher=Sha256::new();
    hasher.update(kind.as_bytes());
    hasher.update([0]);
    hasher.update(key.as_bytes());
    let digest=hasher.finalize();
    format!("cl-{:x}",digest)
}
/// Only call this after validate_program succeeded on the SAME program/policy.
/// The output is a non-authoritative, metadata-only projection.
pub(crate) fn project(program:&Program, validated:&ValidatedProgram)->Value {
    let mut nodes=BTreeMap::<String,Value>::new();
    let mut edges=BTreeSet::<(String,String,String)>::new();
    let pid=opaque("native-program",&format!("{}@{}",program.id,program.revision));
    let policy=opaque("native-policy",&format!("{}@{}",program.policy_id,program.policy_revision));
    nodes.insert(pid.clone(),json!({"id":pid,"kind":"native-program",
        "revision":program.revision,"authority":"candidate_only"}));
    nodes.insert(policy.clone(),json!({"id":policy,"kind":"native-policy",
        "revision":program.policy_revision,"authority":"caller_supplied_unverified"}));
    edges.insert((pid.clone(),"governed_by".into(),policy));
    let by_id:BTreeMap<_,_>=program.steps.iter().map(|s|(s.id.as_str(),s)).collect();
    for step_id in &validated.ordered_step_ids {
        let step=by_id[step_id.as_str()];
        let sid=opaque("native-step",&format!("{}@{}:{}",program.id,program.revision,step_id));
        nodes.insert(sid.clone(),json!({"id":sid,"kind":"native-transformation",
            "authority":"candidate_only","executionAuthorized":false,
            "effectPerformed":false,"inputCount":step.inputs.len(),
            "outputClass":format!("{:?}",step.output_data_class).to_lowercase(),
            "risk":format!("{:?}",step.risk)}));
        edges.insert((pid.clone(),"contains".into(),sid.clone()));
        for dep in &step.dependencies {
            let did=opaque("native-step",&format!("{}@{}:{}",program.id,program.revision,dep));
            edges.insert((sid.clone(),"depends_on".into(),did));
        }
        for source in &step.inputs {
            let source_id=opaque("native-source",&format!("{}@{}:{}",source.source_id,
                source.revision,source.digest));
            nodes.insert(source_id.clone(),json!({"id":source_id,"kind":"source-reference",
                "revision":source.revision,"dataClass":format!("{:?}",source.data_class).to_lowercase(),
                "sourceAuthenticated":false}));
            edges.insert((sid.clone(),"references".into(),source_id));
        }
    }
    json!({"schema":SCHEMA,"authority":"read_only_projection",
        "nodes":nodes.into_values().collect::<Vec<_>>(),
        "edges":edges.into_iter().map(|(from,kind,to)|json!({"from":from,"kind":kind,"to":to}))
            .collect::<Vec<_>>(),
        "effectPerformed":false,"executionAuthorized":false})
}
#[cfg(test)]
mod tests {
    use super::*;
    use crate::{DataClass,TransformKind,TransformStep,Risk,SourceRef};
    #[test]
    fn no_user_content_or_grants_are_exported() {
        let program=Program{id:"my-secret-program".into(),revision:1,policy_id:"private-policy".into(),
            policy_revision:2,steps:vec![TransformStep{id:"begin".into(),
                kind:TransformKind::SelectContext,dependencies:vec![],
                inputs:vec![SourceRef{source_id:"personal.source".into(),revision:3,
                    digest:"a".repeat(64),data_class:DataClass::Private}],
                output_data_class:DataClass::Private,risk:Risk::R0,destination:None}]};
        let verified=ValidatedProgram{schema:crate::SCHEMA,program_id:program.id.clone(),
            program_revision:1,policy_revision:2,ordered_step_ids:vec!["begin".into()],
            execution_authorized:false,effect_performed:false};
        let out=project(&program,&verified).to_string();
        assert!(!out.contains("my-secret-program"));
        assert!(!out.contains("personal.source"));
        assert!(!out.contains("private-policy"));
        assert!(out.contains("read_only_projection"));
    }
}
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
