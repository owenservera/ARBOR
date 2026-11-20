# File: studio/src/agents/personal-agent-memory-search.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/agents/personal-agent-memory-search.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 3241 B |
| Lines | 57 |
| Hash | 3904e13fa895 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| MEMORY_SEARCH_TIERS | const | 3 | yes | export const MEMORY_SEARCH_TIERS = Object.freeze([&#39;CANON&#39;, &#39;Immediate&#39;, &#39;Curated&#39;]); |
| bad | function | 4 | no | const bad = (message, code = &#39;PERSONAL_AGENT_MEMORY_SEARCH_INVALID&#39;, status = 400) =&gt; |
| normalize | function | 6 | no | const normalize = value =&gt; String(value).toLocaleLowerCase(&#39;en-US&#39;); |
| MAX_PREVIEW | const | 7 | no | const MAX_PREVIEW = 240; |
| searchPersonalAgentMemory | function | 9 | yes | export function searchPersonalAgentMemory(state, { query, tier = &#39;all&#39;, limit = 20 } = {}) { |
| search | const | 21 | no | const search = normalize(query.trim()); |
| tiers | const | 22 | no | const tiers = tier === &#39;all&#39; ? MEMORY_SEARCH_TIERS : [tier]; |
| hits | const | 23 | no | const hits = []; |
| order | variable | 24 | no | let order = 0; |
| entries | const | 26 | no | const entries = state.memory?.[currentTier] ?? []; |
| key | const | 35 | no | const key = normalize(entry.key), text = normalize(entry.text); |
| keyAt | const | 36 | no | const keyAt = key.indexOf(search), textAt = text.indexOf(search); |
| rank | const | 38 | no | const rank = key === search ? 0 : keyAt === 0 ? 1 : keyAt &gt;= 0 ? 2 : 3; |
| start | const | 39 | no | const start = textAt &lt; 0 ? 0 : Math.max(0, textAt - 60); |
| part | const | 40 | no | const part = entry.text.slice(start, start + MAX_PREVIEW); |
| preview | const | 41 | no | const preview = (start ? &#39;…&#39; : &#39;&#39;) + part + (start + part.length &lt; entry.text.length ? &#39;…&#39; : &#39;&#39;); |
| limited | const | 50 | no | const limited = hits.slice(0, limit).map(({ rank, order, ...item }) =&gt; item); |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [studio/src/agents/personal-agent-service.mjs](./personal-agent-service.mjs.md) | ./personal-agent-memory-search.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Local-only, explicit Personal Agent memory search. Never indexes conversations or calls a provider.
// Matches bounded user-authored memory; response previews stay private to the authenticated Studio.
export const MEMORY_SEARCH_TIERS = Object.freeze(['CANON', 'Immediate', 'Curated']);
const bad = (message, code = 'PERSONAL_AGENT_MEMORY_SEARCH_INVALID', status = 400) =>
  Object.assign(new Error(message), { code, status });
const normalize = value => String(value).toLocaleLowerCase('en-US');
const MAX_PREVIEW = 240;

export function searchPersonalAgentMemory(state, { query, tier = 'all', limit = 20 } = {}) {
  if (typeof query !== 'string' || query.trim().length < 2 || query.trim().length > 120 ||
      /[\u0000-\u001f\u007f]/u.test(query)) {
    throw bad('Memory search query must be 2..120 characters on one line');
  }
  if (tier !== 'all' && !MEMORY_SEARCH_TIERS.includes(tier)) {
    throw bad('Unknown memory search tier');
  }
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 50) {
    throw bad('Memory search limit must be an integer from 1 to 50');
  }
  if (!state || typeof state !== 'object') throw bad('Memory state unavailable', 'PERSONAL_AGENT_MEMORY_SEARCH_STATE', 500);
  const search = normalize(query.trim());
  const tiers = tier === 'all' ? MEMORY_SEARCH_TIERS : [tier];
  const hits = [];
  let order = 0;
  for (const currentTier of tiers) {
    const entries = state.memory?.[currentTier] ?? [];
    if (!Array.isArray(entries) || entries.length > 500) {
      throw bad('Memory tier unavailable or inconsistent', 'PERSONAL_AGENT_MEMORY_SEARCH_STATE', 500);
    }
    for (const entry of entries) {
      if (typeof entry?.key !== 'string' || typeof entry?.text !== 'string' ||
          entry.key.length > 64 || entry.text.length > 8000 || entry.source !== 'user-authored') {
        throw bad('Memory record has invalid provenance or content', 'PERSONAL_AGENT_MEMORY_SEARCH_STATE', 500);
      }
      const key = normalize(entry.key), text = normalize(entry.text);
      const keyAt = key.indexOf(search), textAt = text.indexOf(search);
      if (keyAt < 0 && textAt < 0) continue;
      const rank = key === search ? 0 : keyAt === 0 ? 1 : keyAt >= 0 ? 2 : 3;
      const start = textAt < 0 ? 0 : Math.max(0, textAt - 60);
      const part = entry.text.slice(start, start + MAX_PREVIEW);
      const preview = (start ? '…' : '') + part + (start + part.length < entry.text.length ? '…' : '');
      hits.push({ tier: currentTier, key: entry.key, preview, source: entry.source,
        updatedAt: typeof entry.updatedAt === 'string' ? entry.updatedAt : null,
        match: keyAt >= 0 ? 'key' : 'text', rank, order: order++ });
    }
  }
  hits.sort((a, b) => a.rank - b.rank ||
    String(b.updatedAt ?? '').localeCompare(String(a.updatedAt ?? '')) ||
    a.order - b.order);
  const limited = hits.slice(0, limit).map(({ rank, order, ...item }) => item);
  return {
    tier, total: hits.length, shown: limited.length, truncated: hits.length > limited.length,
    items: limited,
    scope: 'private-user-authored-local-memory',
    execution: 'read-only-local-search; no provider, model, browser or conversation access',
  };
}
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
