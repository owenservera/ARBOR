# File: native/hqkg/tests/control.rs

> Generated 2026-11-19 · Rust · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | native/hqkg/tests/control.rs |
| Language | Rust |
| Kind | source |
| Size | 6406 B |
| Lines | 199 |
| Hash | 61c0e715e801 |
| Test | yes |
| Generated | no |
| Component | native |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| v | function | 9 | no | fn v(s: &amp;str) -&gt; Version { |
| req | function | 12 | no | fn req(id: &amp;str, required: bool) -&gt; Dependency { |
| resource | function | 25 | no | fn resource(id: &amp;str) -&gt; Resource { |
| semantic_versions_ranges_and_cycles | function | 36 | no | fn semantic_versions_ranges_and_cycles() { |
| reject_missing_and_unpinned_data_in_production | function | 54 | no | fn reject_missing_and_unpinned_data_in_production() { |
| cas_configuration_and_immutable_history | function | 64 | no | fn cas_configuration_and_immutable_history() { |
| telemetry_ring_percentiles_and_quarantine | function | 100 | no | fn telemetry_ring_percentiles_and_quarantine() { |
| Echo | struct | 139 | no | struct Echo; |
| descriptor | method | 141 | no | fn descriptor(&amp;self) -&gt; EngineDescriptor { |
| execute | method | 144 | no | fn execute(&amp;self, r: &amp;EngineRequest) -&gt; Result&lt;EngineOutput&gt; { |
| supervisor_tracks_runtime_pins_health_and_mode | function | 154 | no | fn supervisor_tracks_runtime_pins_health_and_mode() { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| hqkg::control::* | use | 1 | external |
| hqkg::{ | use | 2 | external |
| std::collections::BTreeMap | use | 6 | external |
| std::sync::Arc | use | 7 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```rust
use hqkg::control::*;
use hqkg::{
    ComputeEngine, EngineDescriptor, EngineOutput, EngineRegistry, EngineRequest, Error, Graph,
    Result,
};
use std::collections::BTreeMap;
use std::sync::Arc;

fn v(s: &str) -> Version {
    Version::parse(s).unwrap()
}
fn req(id: &str, required: bool) -> Dependency {
    Dependency {
        id: id.into(),
        kind: ResourceKind::Dataset,
        version: VersionRange {
            min_inclusive: v("1.0.0"),
            max_exclusive: Some(v("2.0.0")),
        },
        required,
        expected_sha256: None,
        after: vec![],
    }
}
fn resource(id: &str) -> Resource {
    Resource {
        id: id.into(),
        kind: ResourceKind::Dataset,
        version: v("1.2.3"),
        ready: true,
        sha256: Some("a".repeat(64)),
        generation: None,
    }
}
#[test]
fn semantic_versions_ranges_and_cycles() {
    assert_eq!(v("1.2.3").label(), "1.2.3");
    for invalid in ["1.2", "1.2.3-beta", "01.2.3", "-1.2.3", "1.2.4294967296"] {
        assert!(Version::parse(invalid).is_err());
    }
    let mut resources = BTreeMap::new();
    resources.insert("corpus".into(), resource("corpus"));
    let mut first = req("corpus", true);
    let mut second = req("stemmer", false);
    second.after.push("corpus".into());
    let x = resolve_dependencies(&[first.clone(), second.clone()], &resources, true).unwrap();
    assert_eq!(x.order, vec!["corpus", "stemmer"]);
    assert_eq!(x.pinned.len(), 1);
    assert_eq!(x.omitted_optional, vec!["stemmer"]);
    first.after.push("stemmer".into());
    assert!(resolve_dependencies(&[first, second], &resources, true).is_err());
}
#[test]
fn reject_missing_and_unpinned_data_in_production() {
    let mut resources = BTreeMap::new();
    assert!(resolve_dependencies(&[req("corpus", true)], &resources, true).is_err());
    let mut r = resource("corpus");
    r.sha256 = None;
    resources.insert("corpus".into(), r);
    assert!(resolve_dependencies(&[req("corpus", true)], &resources, true).is_err());
    assert!(resolve_dependencies(&[req("corpus", true)], &resources, false).is_ok());
}
#[test]
fn cas_configuration_and_immutable_history() {
    let mut c = CoreConfig::default();
    assert_eq!(c.mode, Mode::Production);
    assert!(c
        .patch(
            1,
            ConfigPatch {
                allow_experimental: Some(true),
                ..Default::default()
            }
        )
        .is_err());
    c.patch(
        1,
        ConfigPatch {
            mode: Some(Mode::Development),
            ..Default::default()
```

_First 80 of 200 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
