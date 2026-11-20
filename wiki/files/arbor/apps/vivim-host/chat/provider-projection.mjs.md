# File: apps/vivim-host/chat/provider-projection.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/chat/provider-projection.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 1012 B |
| Lines | 20 |
| Hash | a9b0de3e5361 |
| Test | no |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| CHAT_PROVIDER_SCHEMA | const | 1 | yes | export const CHAT_PROVIDER_SCHEMA=&#39;vivim.chat-provider-projection/1&#39;; |
| PROVIDER_ID | const | 2 | no | const PROVIDER_ID=/^[a-z][a-z0-9_-]{1,31}$/; |
| projectChatProviders | function | 3 | yes | export function projectChatProviders(records,now=Date.now()){ |
| rows | const | 4 | no | const rows=Array.isArray(records)?records:[]; |
| seen | const | 5 | no | const seen=new Set(),providers=[]; |
| check | const | 10 | no | const check=value.check; |
| observed | const | 11 | no | const observed=Date.parse(check?.observedAt??&#39;&#39;); |
| verified | const | 12 | no | const verified=check?.state===&#39;ready&#39;&amp;&amp;check?.verified===true&amp;&amp; |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [apps/vivim-host/direct-phone.mjs](../direct-phone.mjs.md) | ./chat/provider-projection.mjs |
| [apps/vivim-host/test/chat-provider-projection.test.mjs](../test/chat-provider-projection.test.mjs.md) | ../chat/provider-projection.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
export const CHAT_PROVIDER_SCHEMA='vivim.chat-provider-projection/1';
const PROVIDER_ID=/^[a-z][a-z0-9_-]{1,31}$/;
export function projectChatProviders(records,now=Date.now()){
  const rows=Array.isArray(records)?records:[];
  const seen=new Set(),providers=[];
  for(const value of rows.slice(0,24)){
    if(!value||typeof value.id!=='string'||!PROVIDER_ID.test(value.id)||
       seen.has(value.id))continue;
    seen.add(value.id);
    const check=value.check;
    const observed=Date.parse(check?.observedAt??'');
    const verified=check?.state==='ready'&&check?.verified===true&&
      Number.isFinite(observed)&&observed<=now&&now-observed<=45000;
    providers.push({id:value.id,
      label:typeof value.label==='string'?value.label.slice(0,64):value.id,
      signedIn:verified,models:[],thinkingLevels:[],newChat:true,attachments:false});
  }
  return {schema:CHAT_PROVIDER_SCHEMA,updatedAt:new Date(now).toISOString(),
    verification:'explicit-Studio-owner-check',providers};
}
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
