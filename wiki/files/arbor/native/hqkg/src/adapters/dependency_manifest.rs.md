# File: native/hqkg/src/adapters/dependency_manifest.rs

> Generated 2026-11-19 · Rust · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | native/hqkg/src/adapters/dependency_manifest.rs |
| Language | Rust |
| Kind | source |
| Size | 6716 B |
| Lines | 180 |
| Hash | 935d07a80238 |
| Test | no |
| Generated | no |
| Component | native |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| SCHEMA | const | 11 | no | const SCHEMA: &amp;str = &quot;hqkg.module-dependencies/1&quot;; |
| MAX_MANIFEST_BYTES | const | 12 | no | const MAX_MANIFEST_BYTES: usize = 256 * 1024; |
| MAX_REQUIREMENTS | const | 13 | no | const MAX_REQUIREMENTS: usize = 1024; |
| ModuleManifest | struct | 16 | yes | pub struct ModuleManifest { |
| object | function | 25 | no | fn object&lt;&#39;a&gt;(value: &amp;&#39;a Value) -&gt; Result&lt;&amp;&#39;a Map&lt;String, Value&gt;&gt; { |
| text | function | 30 | no | fn text&lt;&#39;a&gt;(map: &amp;&#39;a Map&lt;String, Value&gt;, key: &amp;str) -&gt; Result&lt;&amp;&#39;a str&gt; { |
| valid_id | function | 35 | no | fn valid_id(s: &amp;str) -&gt; bool { |
| bool_key | function | 38 | no | fn bool_key(m: &amp;Map&lt;String, Value&gt;, key: &amp;str) -&gt; Result&lt;bool&gt; { |
| kind | function | 43 | no | fn kind(s: &amp;str) -&gt; ResourceKind { |
| parse_manifest | function | 53 | yes | pub fn parse_manifest(input: &amp;[u8]) -&gt; Result&lt;ModuleManifest&gt; { |
| unapproved_engine_policy | method | 174 | yes | pub fn unapproved_engine_policy(&amp;self) -&gt; EnginePolicy { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| crate::control::{ | use | 4 | external |
| crate::{Error, Result} | use | 7 | external |
| serde_json::{Map, Value} | use | 8 | external |
| std::collections::BTreeMap | use | 9 | external |

## Dependents

_No dependents._

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 1 | context | — | — | Optional versioned JSON manifest adapter for HQKG&#39;s std-only dependency protocol. |
| 2 | owner | repos-hq | — | repos-hq |
| 3 | invariant | — | — | Parsing untrusted metadata does not approve runtime execution or install anything. |

## Excerpt

```rust
//! @hq:context Optional versioned JSON manifest adapter for HQKG's std-only dependency protocol.
//! @hq:owner repos-hq
//! @hq:invariant Parsing untrusted metadata does not approve runtime execution or install anything.
use crate::control::{
    resolve_dependencies, Dependency, EnginePolicy, ResourceKind, Version, VersionRange,
};
use crate::{Error, Result};
use serde_json::{Map, Value};
use std::collections::BTreeMap;

const SCHEMA: &str = "hqkg.module-dependencies/1";
const MAX_MANIFEST_BYTES: usize = 256 * 1024;
const MAX_REQUIREMENTS: usize = 1024;

#[derive(Clone, Debug)]
pub struct ModuleManifest {
    pub id: String,
    pub slot: String,
    pub interface: String,
    pub version: Version,
    /// Declared, untrusted; this flag does NOT authorize production.
    pub declared_production_ready: bool,
    pub dependencies: Vec<Dependency>,
}
fn object<'a>(value: &'a Value) -> Result<&'a Map<String, Value>> {
    value
        .as_object()
        .ok_or_else(|| Error::Invalid("expected JSON object".into()))
}
fn text<'a>(map: &'a Map<String, Value>, key: &str) -> Result<&'a str> {
    map.get(key)
        .and_then(Value::as_str)
        .ok_or_else(|| Error::Invalid(format!("required string: {key}")))
}
fn valid_id(s: &str) -> bool {
    !s.is_empty() && s.len() <= 256 && !s.chars().any(char::is_control)
}
fn bool_key(m: &Map<String, Value>, key: &str) -> Result<bool> {
    m.get(key)
        .and_then(Value::as_bool)
        .ok_or_else(|| Error::Invalid(format!("required boolean: {key}")))
}
fn kind(s: &str) -> ResourceKind {
    match s {
        "Engine" => ResourceKind::Engine,
        "Database" => ResourceKind::Database,
        "Dataset" => ResourceKind::Dataset,
        "Capability" => ResourceKind::Capability,
        "Schema" => ResourceKind::Schema,
        other => ResourceKind::Other(other.into()),
    }
}
pub fn parse_manifest(input: &[u8]) -> Result<ModuleManifest> {
    if input.is_empty() || input.len() > MAX_MANIFEST_BYTES {
        return Err(Error::Invalid("manifest size outside safe bounds".into()));
    }
    let parsed: Value = serde_json::from_slice(input)
        .map_err(|e| Error::Invalid(format!("invalid dependency manifest JSON: {e}")))?;
    let top = object(&parsed)?;
    if text(top, "schema")? != SCHEMA {
        return Err(Error::Unsupported(
            "unknown dependency-manifest schema".into(),
        ));
    }
    let module = object(
        top.get("module")
            .ok_or_else(|| Error::Invalid("missing module".into()))?,
    )?;
    let id = text(module, "id")?.to_owned();
    let slot = text(module, "slot")?.to_owned();
    let interface = text(module, "interface")?.to_owned();
    for v in [&id, &slot, &interface] {
        if !valid_id(v) {
            return Err(Error::Invalid("invalid manifest module identifier".into()));
        }
    }
    let version = Version::parse(text(module, "version")?)?;
    let declared_production_ready = bool_key(module, "production_ready")?;
    let records = top
        .get("requirements")
```

_First 80 of 181 lines._

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
