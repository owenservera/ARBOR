# File: harness/src/share/feed-publisher.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | harness/src/share/feed-publisher.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 1457 B |
| Lines | 18 |
| Hash | d481502b86b8 |
| Test | no |
| Generated | no |
| Component | harness |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| TYPES | const | 2 | no | const TYPES=new Set([&#39;request.created&#39;,&#39;request.approved&#39;,&#39;request.completed&#39;,&#39;request.blocked&#39;,&#39;build.started&#39;,&#39;build.completed&#39;,&#39;review.completed&#39;,&#39;fleet.started&#39;,&#39;fleet.completed&#39;,&#39;system.status&#39;]… |
| publicEvent | function | 3 | yes | export function publicEvent(input) { |
| e | const | 5 | no | const e={type:input.type,at:input.at \|\| new Date().toISOString()}; |
| publishFeedEvent | function | 11 | yes | export async function publishFeedEvent(input,{endpoint=process.env.VIVIM_SHARE_FEED_URL,token=process.env.VIVIM_FEED_PUBLISH_TOKEN,fetcher=fetch}={}) { |
| url | const | 13 | no | const url=new URL(endpoint); |
| result | const | 15 | no | const result=await fetcher(url,{method:&#39;POST&#39;,headers:{&#39;authorization&#39;:`Bearer ${token}`,&#39;content-type&#39;:&#39;application/json&#39;},body:JSON.stringify(publicEvent(input)),signal:AbortSignal.timeout(10000)}); |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [harness/bin/share-feed.mjs](../../bin/share-feed.mjs.md) | ../src/share/feed-publisher.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Outbound-only operational event publisher. Does not inspect browser or conversation bodies.
const TYPES=new Set(['request.created','request.approved','request.completed','request.blocked','build.started','build.completed','review.completed','fleet.started','fleet.completed','system.status']);
export function publicEvent(input) {
  if(!input || !TYPES.has(input.type)) throw Error('Invalid public event type');
  const e={type:input.type,at:input.at || new Date().toISOString()};
  if(input.provider && /^[a-z0-9_-]{1,32}$/.test(input.provider)) e.provider=input.provider;
  if(input.status && /^[a-z0-9_-]{1,32}$/.test(input.status)) e.status=input.status;
  if(typeof input.durationMs==='number' && Number.isFinite(input.durationMs) && input.durationMs>=0) e.durationMs=Math.floor(input.durationMs);
  return e;
}
export async function publishFeedEvent(input,{endpoint=process.env.VIVIM_SHARE_FEED_URL,token=process.env.VIVIM_FEED_PUBLISH_TOKEN,fetcher=fetch}={}) {
  if(!endpoint || !token) throw Error('Feed URL and token required');
  const url=new URL(endpoint);
  if(url.protocol!=='https:') throw Error('Feed requires HTTPS');
  const result=await fetcher(url,{method:'POST',headers:{'authorization':`Bearer ${token}`,'content-type':'application/json'},body:JSON.stringify(publicEvent(input)),signal:AbortSignal.timeout(10000)});
  if(!result.ok) throw Error(`Feed publish HTTP ${result.status}`);
  return {published:true};
}
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
