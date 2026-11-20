# File: native/hqkg/src/utility_adapter.rs

> Generated 2026-11-19 · Rust · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | native/hqkg/src/utility_adapter.rs |
| Language | Rust |
| Kind | source |
| Size | 8268 B |
| Lines | 197 |
| Hash | db79dcbc3a3f |
| Test | no |
| Generated | no |
| Component | native |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| MAX_INPUT_BYTES | const | 9 | no | const MAX_INPUT_BYTES: usize = 64 * 1024; |
| MAX_OUTPUT_BYTES | const | 10 | no | const MAX_OUTPUT_BYTES: usize = 64 * 1024; |
| MAX_STATEMENTS | const | 11 | no | const MAX_STATEMENTS: usize = 128; |
| MAX_VARIABLES | const | 12 | no | const MAX_VARIABLES: usize = 128; |
| MAX_VARIABLE_NAME | const | 13 | no | const MAX_VARIABLE_NAME: usize = 128; |
| MAX_NUMBERS | const | 14 | no | const MAX_NUMBERS: usize = 1024; |
| UtilityCompute | struct | 18 | yes | pub struct UtilityCompute { |
| number | method | 28 | no | fn number(s: &amp;str) -&gt; Result&lt;f64&gt; { |
| sum | method | 39 | no | fn sum(input: &amp;str) -&gt; Result&lt;String&gt; { |
| head_tail | method | 60 | no | fn head_tail(s: &amp;str) -&gt; Result&lt;(&amp;str, &amp;str)&gt; { |
| name | method | 71 | no | fn name(name: &amp;str) -&gt; Result&lt;()&gt; { |
| state_size | method | 80 | no | fn state_size(vars: &amp;BTreeMap&lt;String, String&gt;) -&gt; usize { |
| bound_output | method | 83 | no | fn bound_output(output: String) -&gt; Result&lt;String&gt; { |
| script | method | 93 | no | fn script(input: &amp;str) -&gt; Result&lt;String&gt; { |
| descriptor | method | 170 | no | fn descriptor(&amp;self) -&gt; EngineDescriptor { |
| execute | method | 178 | no | fn execute(&amp;self, request: &amp;EngineRequest) -&gt; Result&lt;EngineOutput&gt; { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| crate::engine::{ComputeEngine, EngineDescriptor, EngineOutput, EngineRequest} | use | 5 | external |
| crate::{Error, Result} | use | 6 | external |
| std::collections::BTreeMap | use | 7 | external |

## Dependents

_No dependents._

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 2 | owner | repos-hq | — | repos-hq |
| 3 | invariant | — | — | No sockets, SQL, filesystem access, external libraries, or persistent mutable state. |
| 4 | invariant | — | — | Use the existing ComputeEngine/EngineRegistry; never create a second scheduler. |

## Excerpt

```rust
//! Bounded std-only utility operations adapted from the attached engine_network prototype.
//! @hq:owner repos-hq
//! @hq:invariant No sockets, SQL, filesystem access, external libraries, or persistent mutable state.
//! @hq:invariant Use the existing ComputeEngine/EngineRegistry; never create a second scheduler.
use crate::engine::{ComputeEngine, EngineDescriptor, EngineOutput, EngineRequest};
use crate::{Error, Result};
use std::collections::BTreeMap;

const MAX_INPUT_BYTES: usize = 64 * 1024;
const MAX_OUTPUT_BYTES: usize = 64 * 1024;
const MAX_STATEMENTS: usize = 128;
const MAX_VARIABLES: usize = 128;
const MAX_VARIABLE_NAME: usize = 128;
const MAX_NUMBERS: usize = 1024;

/// A small deterministic, stateless text/number processor. Each execution
/// has its own script variables; there is no cross-request memory.
pub struct UtilityCompute {
    slot: String,
}
impl UtilityCompute {
    pub fn new(slot: &str) -> Result<Self> {
        if slot.is_empty() || slot.len() > 128 || slot.chars().any(char::is_control) {
            return Err(Error::Invalid("invalid utility engine slot".into()));
        }
        Ok(Self { slot: slot.into() })
    }
    fn number(s: &str) -> Result<f64> {
        let v = s
            .parse::<f64>()
            .map_err(|_| Error::Invalid(format!("invalid finite number: {s}")))?;
        if !v.is_finite() {
            return Err(Error::Invalid(
                "non-finite arithmetic is unsupported".into(),
            ));
        }
        Ok(v)
    }
    fn sum(input: &str) -> Result<String> {
        let mut total = 0.0f64;
        let mut count = 0usize;
        for raw in input
            .split(|c: char| c.is_ascii_whitespace() || c == ',')
            .filter(|s| !s.is_empty())
        {
            count += 1;
            if count > MAX_NUMBERS {
                return Err(Error::Invalid("numeric operand limit exceeded".into()));
            }
            total += Self::number(raw)?;
            if !total.is_finite() {
                return Err(Error::Invalid("numeric overflow".into()));
            }
        }
        if count == 0 {
            return Err(Error::Invalid("sum requires at least one number".into()));
        }
        Ok(total.to_string())
    }
    fn head_tail(s: &str) -> Result<(&str, &str)> {
        let split = s
            .find(char::is_whitespace)
            .ok_or_else(|| Error::Invalid("script command requires an argument".into()))?;
        let (head, rest) = s.split_at(split);
        let rest = rest.trim_start();
        if head.is_empty() || rest.is_empty() {
            return Err(Error::Invalid("script command requires an argument".into()));
        }
        Ok((head, rest))
    }
    fn name(name: &str) -> Result<()> {
        if name.is_empty()
            || name.len() > MAX_VARIABLE_NAME
            || !name.bytes().all(|b| b.is_ascii_alphanumeric() || b == b'_')
        {
            return Err(Error::Invalid("invalid script variable name".into()));
        }
        Ok(())
    }
    fn state_size(vars: &BTreeMap<String, String>) -> usize {
```

_First 80 of 198 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
