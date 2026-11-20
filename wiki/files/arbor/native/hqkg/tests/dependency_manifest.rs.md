# File: native/hqkg/tests/dependency_manifest.rs

> Generated 2026-11-19 · Rust · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | native/hqkg/tests/dependency_manifest.rs |
| Language | Rust |
| Kind | source |
| Size | 1643 B |
| Lines | 30 |
| Hash | 73d84d96be84 |
| Test | yes |
| Generated | no |
| Component | native |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| inert_example_parses_without_granting_production_authority | function | 4 | no | fn inert_example_parses_without_granting_production_authority() { |
| untrusted_ready_flag_does_not_grant_authority | function | 15 | no | fn untrusted_ready_flag_does_not_grant_authority() { |
| unknown_schema_and_cycle_fail | function | 22 | no | fn unknown_schema_and_cycle_fail() { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| hqkg::adapters::dependency_manifest::parse_manifest | use | 2 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```rust
#![cfg(feature = "importer")]
use hqkg::adapters::dependency_manifest::parse_manifest;
#[test]
fn inert_example_parses_without_granting_production_authority() {
    let source = include_str!(
        "../../graph-kernel-integration/contracts/module-dependencies.example.v1.json"
    );
    let parsed = parse_manifest(source.as_bytes()).unwrap();
    assert_eq!(parsed.id, "language:spell");
    assert_eq!(parsed.dependencies.len(), 3);
    assert!(!parsed.declared_production_ready);
    assert!(!parsed.unapproved_engine_policy().production_ready);
}
#[test]
fn untrusted_ready_flag_does_not_grant_authority() {
    let s = r#"{"schema":"hqkg.module-dependencies/1","module":{"id":"m","slot":"m","interface":"test.v1","version":"1.0.0","production_ready":true},"requirements":[]}"#;
    let p = parse_manifest(s.as_bytes()).unwrap();
    assert!(p.declared_production_ready);
    assert!(!p.unapproved_engine_policy().production_ready);
}
#[test]
fn unknown_schema_and_cycle_fail() {
    let body = r#"{"schema":"hqkg.module-dependencies/1","module":{"id":"m","slot":"m","interface":"test.v1","version":"1.0.0","production_ready":false},"requirements":[{"id":"a","kind":"Engine","min_inclusive":"1.0.0","max_exclusive":"2.0.0","required":false,"expected_sha256":null,"after":["b"]},{"id":"b","kind":"Dataset","min_inclusive":"1.0.0","max_exclusive":"2.0.0","required":false,"expected_sha256":null,"after":["a"]}]}"#;
    assert!(parse_manifest(body.as_bytes()).is_err());
    assert!(parse_manifest(
        body.replace("hqkg.module-dependencies/1", "other/7")
            .as_bytes()
    )
    .is_err());
}
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
