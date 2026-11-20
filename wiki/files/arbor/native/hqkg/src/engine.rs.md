# File: native/hqkg/src/engine.rs

> Generated 2026-11-19 · Rust · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | native/hqkg/src/engine.rs |
| Language | Rust |
| Kind | source |
| Size | 13718 B |
| Lines | 394 |
| Hash | 3a426c178fe0 |
| Test | no |
| Generated | no |
| Component | native |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| PURE_INTERFACE | const | 10 | yes | pub const PURE_INTERFACE: &amp;str = &quot;hqkg.transform.pure/1&quot;; |
| PURE_ENGINE_SLOT | const | 12 | yes | pub const PURE_ENGINE_SLOT: &amp;str = &quot;vlang.pure&quot;; |
| PURE_OPERATIONS | const | 15 | yes | pub const PURE_OPERATIONS: &amp;[&amp;str] = &amp;[ |
| EngineDescriptor | struct | 25 | yes | pub struct EngineDescriptor { |
| EngineRequest | struct | 42 | yes | pub struct EngineRequest { |
| EngineOutput | struct | 47 | yes | pub struct EngineOutput { |
| ComputeEngine | trait | 50 | yes | pub trait ComputeEngine: Send + Sync { |
| descriptor | function | 51 | no | fn descriptor(&amp;self) -&gt; EngineDescriptor; |
| execute | function | 52 | no | fn execute(&amp;self, request: &amp;EngineRequest) -&gt; Result&lt;EngineOutput&gt;; |
| Generation | struct | 54 | no | struct Generation { |
| EngineLease | struct | 59 | yes | pub struct EngineLease { |
| generation | method | 63 | yes | pub fn generation(&amp;self) -&gt; u64 { |
| descriptor | method | 66 | yes | pub fn descriptor(&amp;self) -&gt; &amp;EngineDescriptor { |
| execute | method | 69 | yes | pub fn execute(&amp;self, request: &amp;EngineRequest) -&gt; Result&lt;EngineOutput&gt; { |
| SwapReceipt | struct | 80 | yes | pub struct SwapReceipt { |
| EngineRegistry | struct | 86 | yes | pub struct EngineRegistry { |
| pin | method | 93 | yes | pub fn pin(&amp;self, slot: &amp;str) -&gt; Result&lt;EngineLease&gt; { |
| install | method | 107 | yes | pub fn install( &amp;self, engine: Arc&lt;dyn ComputeEngine&gt;, expected: Option&lt;u64&gt;, ) -&gt; Result&lt;SwapReceipt&gt; { |
| active_generation | method | 159 | yes | pub fn active_generation(&amp;self, slot: &amp;str) -&gt; Result&lt;Option&lt;u64&gt;&gt; { |
| PureTransformEngine | struct | 174 | yes | pub struct PureTransformEngine { |
| implementation | method | 183 | yes | pub fn implementation(&amp;self) -&gt; &amp;str { |
| descriptor | method | 188 | no | fn descriptor(&amp;self) -&gt; EngineDescriptor { |
| execute | method | 196 | no | fn execute(&amp;self, request: &amp;EngineRequest) -&gt; Result&lt;EngineOutput&gt; { |
| install_pure_engine | function | 218 | yes | pub fn install_pure_engine( registry: &amp;EngineRegistry, implementation: &amp;str, expected: Option&lt;u64&gt;, ) -&gt; Result&lt;SwapReceipt&gt; { |
| decode_fields | function | 230 | no | fn decode_fields(data: &amp;str) -&gt; Result&lt;Vec&lt;&amp;str&gt;&gt; { |
| fnv1a_hex | function | 257 | no | fn fnv1a_hex(bytes: &amp;[u8]) -&gt; String { |
| CancellationToken | struct | 269 | yes | pub struct CancellationToken { |
| cancel | method | 276 | yes | pub fn cancel(&amp;self) { |
| is_cancelled | method | 279 | yes | pub fn is_cancelled(&amp;self) -&gt; bool { |
| Task | struct | 284 | yes | pub struct Task { |
| Budget | struct | 292 | yes | pub struct Budget { |
| TaskReceipt | struct | 307 | yes | pub struct TaskReceipt { |
| Scheduler | struct | 314 | yes | pub struct Scheduler&lt;&#39;a&gt; { |
| run | function | 323 | yes | pub fn run(&amp;self, tasks: &amp;[Task], budget: Budget) -&gt; Result&lt;Vec&lt;TaskReceipt&gt;&gt; { |
| run_cancellable | function | 329 | yes | pub fn run_cancellable( &amp;self, tasks: &amp;[Task], budget: Budget, cancel: &amp;CancellationToken, |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| crate::{Error, Result} | use | 2 | external |
| std::collections::{BTreeMap, BTreeSet} | use | 3 | external |
| std::sync::atomic::{AtomicBool, Ordering} | use | 4 | external |
| std::sync::{Arc, RwLock} | use | 5 | external |
| std::time::Instant | use | 6 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```rust
//! Generational in-process engine slots: existing leases remain valid after replacement.
use crate::{Error, Result};
use std::collections::{BTreeMap, BTreeSet};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, RwLock};
use std::time::Instant;

/// Marker interface of a trusted, deterministic, effect-free transform engine.
/// This is a Rust integration contract, not a sandbox and not a grant.
pub const PURE_INTERFACE: &str = "hqkg.transform.pure/1";
/// Registry slot occupied by the native VLANG pure transform engine.
pub const PURE_ENGINE_SLOT: &str = "vlang.pure";
/// Operations the pure engine serves: one per pure `TransformKind` of
/// core/programmability. Effect candidates are deliberately absent.
pub const PURE_OPERATIONS: &[&str] = &[
    "normalize",
    "select-context",
    "interpret",
    "compile",
    "evaluate",
    "project",
];

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct EngineDescriptor {
    pub slot: String,
    pub implementation: String,
    pub interface: String,
    pub capabilities: BTreeSet<String>,
}
impl EngineDescriptor {
    pub fn new(slot: &str, implementation: &str, interface: &str, ops: &[&str]) -> Self {
        Self {
            slot: slot.into(),
            implementation: implementation.into(),
            interface: interface.into(),
            capabilities: ops.iter().map(|s| s.to_string()).collect(),
        }
    }
}
#[derive(Clone, Debug)]
pub struct EngineRequest {
    pub operation: String,
    pub data: String,
}
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct EngineOutput {
    pub data: String,
}
pub trait ComputeEngine: Send + Sync {
    fn descriptor(&self) -> EngineDescriptor;
    fn execute(&self, request: &EngineRequest) -> Result<EngineOutput>;
}
struct Generation {
    generation: u64,
    desc: EngineDescriptor,
    engine: Arc<dyn ComputeEngine>,
}
pub struct EngineLease {
    inner: Arc<Generation>,
}
impl EngineLease {
    pub fn generation(&self) -> u64 {
        self.inner.generation
    }
    pub fn descriptor(&self) -> &EngineDescriptor {
        &self.inner.desc
    }
    pub fn execute(&self, request: &EngineRequest) -> Result<EngineOutput> {
        if !self.inner.desc.capabilities.contains(&request.operation) {
            return Err(Error::Unsupported(format!(
                "operation {} not supported by {}",
                request.operation, self.inner.desc.slot
            )));
        }
        self.inner.engine.execute(request)
    }
}
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct SwapReceipt {
```

_First 80 of 395 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
