# File: native/hqkg/src/web_memory.rs

> Generated 2026-11-19 · Rust · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | native/hqkg/src/web_memory.rs |
| Language | Rust |
| Kind | source |
| Size | 33044 B |
| Lines | 905 |
| Hash | 16d58dccae60 |
| Test | no |
| Generated | no |
| Component | native |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| INPUT_SCHEMA | const | 9 | yes | pub const INPUT_SCHEMA: &amp;str = &quot;vivim.browser-companion/1&quot;; |
| QUERY_SCHEMA | const | 10 | yes | pub const QUERY_SCHEMA: &amp;str = &quot;vivim.web-memory-query/1&quot;; |
| ACK_SCHEMA | const | 11 | yes | pub const ACK_SCHEMA: &amp;str = &quot;vivim.browser-companion-ack/1&quot;; |
| REVOCATION_SCHEMA | const | 13 | yes | pub const REVOCATION_SCHEMA: &amp;str = &quot;vivim.web-memory-revocation/1&quot;; |
| VISIT_PREFIX | const | 15 | yes | pub const VISIT_PREFIX: &amp;str = &quot;web:visit:&quot;; |
| REVOCATION_PREFIX | const | 17 | yes | pub const REVOCATION_PREFIX: &amp;str = &quot;web:revocation:&quot;; |
| VISIT_SOURCE | const | 19 | yes | pub const VISIT_SOURCE: &amp;str = &quot;vivim.browser-companion&quot;; |
| MAX_BATCH | const | 20 | yes | pub const MAX_BATCH: usize = 32; |
| MAX_BODY | const | 21 | yes | pub const MAX_BODY: usize = 64 * 1024; |
| MAX_REASON | const | 23 | yes | pub const MAX_REASON: usize = 240; |
| field | function | 25 | no | fn field&lt;&#39;a&gt;(v: &amp;&#39;a Value, key: &amp;str, max: usize) -&gt; Result&lt;&amp;&#39;a str&gt; { |
| uuid | function | 35 | no | fn uuid(s: &amp;str) -&gt; bool { |
| valid_site | function | 45 | yes | pub fn valid_site(s: &amp;str) -&gt; bool { |
| private_site | function | 62 | no | fn private_site(host: &amp;str) -&gt; bool { |
| safe_path | function | 85 | no | fn safe_path(path: &amp;str) -&gt; bool { |
| SECRET | const | 138 | no | const SECRET: &amp;[&amp;str] = &amp;[ |
| valid_url | function | 185 | yes | pub fn valid_url(host: &amp;str, s: &amp;str) -&gt; bool { |
| valid_time | function | 207 | yes | pub fn valid_time(s: &amp;str) -&gt; bool { |
| sha | function | 245 | no | fn sha(text: &amp;str) -&gt; String { |
| event_digest | function | 248 | no | fn event_digest(v: &amp;Visit) -&gt; String { |
| Visit | struct | 265 | yes | pub struct Visit { |
| parse_batch | function | 275 | yes | pub fn parse_batch(raw: &amp;[u8]) -&gt; Result&lt;Vec&lt;Visit&gt;&gt; { |
| visit_id | function | 336 | no | fn visit_id(v: &amp;Visit) -&gt; String { |
| web_key | function | 342 | no | fn web_key(installation: &amp;str, event: &amp;str) -&gt; String { |
| visit_node_id | function | 345 | no | fn visit_node_id(installation: &amp;str, event: &amp;str) -&gt; String { |
| revocation_node_id | function | 348 | no | fn revocation_node_id(installation: &amp;str, event: &amp;str) -&gt; String { |
| matches_existing | function | 352 | no | fn matches_existing(node: &amp;Node, v: &amp;Visit) -&gt; bool { |
| site_node | function | 361 | no | fn site_node(site: &amp;str) -&gt; Node { |
| visit_node | function | 366 | no | fn visit_node(v: &amp;Visit, cursor: u64) -&gt; Node { |
| RevocationRequest | struct | 387 | yes | pub struct RevocationRequest { |
| RevocationReceipt | struct | 402 | yes | pub struct RevocationReceipt { |
| json | method | 413 | yes | pub fn json(&amp;self) -&gt; Value { |
| revocation_node | function | 426 | no | fn revocation_node(installation: &amp;str, event: &amp;str, reason: Option&lt;&amp;str&gt;) -&gt; Node { |
| valid_reason | function | 443 | no | fn valid_reason(reason: &amp;str) -&gt; Result&lt;()&gt; { |
| Receipt | struct | 450 | yes | pub struct Receipt { |
| json | method | 458 | yes | pub fn json(&amp;self) -&gt; Value { |
| WebMemory | struct | 464 | yes | pub struct WebMemory { |
| open | method | 474 | yes | pub fn open(journal: Journal) -&gt; Result&lt;Self&gt; { |
| graph | method | 516 | yes | pub fn graph(&amp;self) -&gt; &amp;Graph { |
| bytes | method | 519 | yes | pub fn bytes(&amp;self) -&gt; u64 { |
| cursor | method | 522 | yes | pub fn cursor(&amp;self) -&gt; u64 { |
| accept | method | 526 | yes | pub fn accept(&amp;mut self, visits: &amp;[Visit]) -&gt; Result&lt;Receipt&gt; { |
| revoke | method | 638 | yes | pub fn revoke(&amp;mut self, req: &amp;RevocationRequest) -&gt; Result&lt;RevocationReceipt&gt; { |
| resolve_revocation_target | method | 724 | no | fn resolve_revocation_target( &amp;self, req: &amp;RevocationRequest, ) -&gt; Result&lt;Option&lt;(String, String, String)&gt;&gt; { |
| query | method | 794 | yes | pub fn query(&amp;self, q: &amp;Query) -&gt; Result&lt;Value&gt; { |
| Query | struct | 899 | yes | pub struct Query { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| crate::{Edge, Error, Graph, Journal, Node, NodeKind, Result} | use | 4 | external |
| serde_json::{json, Value} | use | 5 | external |
| sha2::{Digest, Sha256} | use | 6 | external |
| std::collections::{BTreeMap, BTreeSet} | use | 7 | external |

## Dependents

_No dependents._

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 1 | context | — | — | Incremental, source-grounded, metadata-only web observations in the existing HQKG graph. |
| 2 | owner | repos-hq | — | repos-hq |
| 3 | invariant | — | — | Acknowledgements follow durable writes; this module never controls a browser. |

## Excerpt

```rust
//! @hq:context Incremental, source-grounded, metadata-only web observations in the existing HQKG graph.
//! @hq:owner repos-hq
//! @hq:invariant Acknowledgements follow durable writes; this module never controls a browser.
use crate::{Edge, Error, Graph, Journal, Node, NodeKind, Result};
use serde_json::{json, Value};
use sha2::{Digest, Sha256};
use std::collections::{BTreeMap, BTreeSet};

pub const INPUT_SCHEMA: &str = "vivim.browser-companion/1";
pub const QUERY_SCHEMA: &str = "vivim.web-memory-query/1";
pub const ACK_SCHEMA: &str = "vivim.browser-companion-ack/1";
/// Durable tombstone schema written beside a revoked visit.
pub const REVOCATION_SCHEMA: &str = "vivim.web-memory-revocation/1";
/// Node id prefix of an observed web visit.
pub const VISIT_PREFIX: &str = "web:visit:";
/// Node id prefix of a revocation tombstone.
pub const REVOCATION_PREFIX: &str = "web:revocation:";
/// Ownership marker every browser-companion visit carries.
pub const VISIT_SOURCE: &str = "vivim.browser-companion";
pub const MAX_BATCH: usize = 32;
pub const MAX_BODY: usize = 64 * 1024;
/// Upper bound for the operator-supplied revocation reason.
pub const MAX_REASON: usize = 240;

fn field<'a>(v: &'a Value, key: &str, max: usize) -> Result<&'a str> {
    let s = v
        .get(key)
        .and_then(Value::as_str)
        .ok_or_else(|| Error::Invalid(format!("missing {key}")))?;
    if s.is_empty() || s.len() > max || s.chars().any(char::is_control) {
        return Err(Error::Invalid(format!("invalid {key}")));
    }
    Ok(s)
}
fn uuid(s: &str) -> bool {
    s.len() == 36
        && s.bytes().enumerate().all(|(i, c)| {
            if [8, 13, 18, 23].contains(&i) {
                c == b'-'
            } else {
                c.is_ascii_hexdigit()
            }
        })
}
pub fn valid_site(s: &str) -> bool {
    if s.len() > 253 || !s.contains('.') || s.ends_with(".local") || s.ends_with(".internal") {
        return false;
    }
    let labels = s.split('.').collect::<Vec<_>>();
    labels
        .last()
        .map_or(false, |x| x.bytes().any(|c| c.is_ascii_lowercase()))
        && labels.iter().all(|p| {
            !p.is_empty()
                && p.len() <= 63
                && !p.starts_with('-')
                && !p.ends_with('-')
                && p.bytes()
                    .all(|b| b.is_ascii_lowercase() || b.is_ascii_digit() || b == b'-')
        })
}
fn private_site(host: &str) -> bool {
    const PRIVATE: &[&str] = &[
        "chatgpt.com",
        "openai.com",
        "claude.ai",
        "google.com",
        "whatsapp.com",
        "facebook.com",
        "instagram.com",
        "x.com",
        "twitter.com",
        "paypal.com",
        "stripe.com",
        "github.com",
    ];
    PRIVATE
        .iter()
        .any(|x| host == *x || host.ends_with(&format!(".{x}")))
        || host.starts_with("mail.")
```

_First 80 of 906 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
