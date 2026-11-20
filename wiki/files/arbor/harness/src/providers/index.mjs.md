# File: harness/src/providers/index.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | harness/src/providers/index.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 4912 B |
| Lines | 55 |
| Hash | cccde11674e2 |
| Test | no |
| Generated | no |
| Component | harness |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| providers | const | 15 | no | const providers = [chatgpt, claude, deepseek, grok, qwen, zai, gemini, kimi]; |
| fail | function | 16 | no | function fail(code, message) { const error = new Error(message); error.code = code; throw error; } |
| validateProfile | function | 17 | yes | export function validateProfile(p) { |
| url | variable | 20 | no | let url; try { url = new URL(p.url); } catch { fail(&#39;INVALID_URL&#39;, &#39;Invalid provider URL&#39;); } |
| m | const | 31 | no | const m = p.models; |
| listProviders | function | 47 | yes | export const listProviders = () =&gt; [...providers]; |
| getProvider | function | 48 | yes | export const getProvider = id =&gt; providers.find(p =&gt; p.id === id) ?? null; |
| providerForUrl | function | 49 | yes | export function providerForUrl(input) { |
| url | const | 51 | no | const url = new URL(input); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./chatgpt.mjs | import | 1 | [harness/src/providers/chatgpt.mjs](./chatgpt.mjs.md) |
| ./claude.mjs | import | 2 | [harness/src/providers/claude.mjs](./claude.mjs.md) |
| ./deepseek.mjs | import | 3 | [harness/src/providers/deepseek.mjs](./deepseek.mjs.md) |
| ./grok.mjs | import | 4 | [harness/src/providers/grok.mjs](./grok.mjs.md) |
| ./qwen.mjs | import | 5 | [harness/src/providers/qwen.mjs](./qwen.mjs.md) |
| ./zai.mjs | import | 6 | [harness/src/providers/zai.mjs](./zai.mjs.md) |
| ./gemini.mjs | import | 7 | [harness/src/providers/gemini.mjs](./gemini.mjs.md) |
| ./kimi.mjs | import | 8 | [harness/src/providers/kimi.mjs](./kimi.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [harness/scripts/signin-check.mjs](../../scripts/signin-check.mjs.md) | ../src/providers/index.mjs |
| [harness/src/onboarding/compare-runner.mjs](../onboarding/compare-runner.mjs.md) | ../providers/index.mjs |
| [harness/test/core/models.test.mjs](../../test/core/models.test.mjs.md) | ../../src/providers/index.mjs |
| [harness/test/providers/providers.test.mjs](../../test/providers/providers.test.mjs.md) | ../../src/providers/index.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
import chatgpt from './chatgpt.mjs';
import claude from './claude.mjs';
import deepseek from './deepseek.mjs';
import grok from './grok.mjs';
import qwen from './qwen.mjs';
import zai from './zai.mjs';
import gemini from './gemini.mjs';
import kimi from './kimi.mjs';

// Every imported profile MUST appear here. An imported-but-unregistered profile is silently
// unreachable: it validates, it exports, and `getProvider`/`providerForUrl` never see it.
// This array is the ONLY list of reachable providers, so it is maintained explicitly (order is
// meaningful) and the invariant is pinned by a test: every profile module in this directory is
// registered here. See test/providers/providers.test.mjs.
const providers = [chatgpt, claude, deepseek, grok, qwen, zai, gemini, kimi];
function fail(code, message) { const error = new Error(message); error.code = code; throw error; }
export function validateProfile(p) {
  if (!p || typeof p !== 'object' || !['id', 'label', 'url'].every(k => typeof p[k] === 'string' && p[k].trim())) fail('INVALID_PROFILE', 'Missing profile identity');
  if (!Array.isArray(p.hosts) || !p.hosts.length || p.hosts.some(h => typeof h !== 'string' || !/^[a-z0-9.-]+$/.test(h))) fail('INVALID_HOSTS', 'Invalid hosts');
  let url; try { url = new URL(p.url); } catch { fail('INVALID_URL', 'Invalid provider URL'); }
  if (url.protocol !== 'https:' || !p.hosts.includes(url.hostname) || url.username || url.password || url.port) fail('INVALID_URL', 'Provider URL must match its HTTPS host');
  if (p.threadPattern !== null && (!(p.threadPattern instanceof RegExp) || !p.threadPattern.source.includes('?<id>'))) fail('INVALID_THREAD_PATTERN', 'Expected a named thread id or null');
  if (!['enter', 'button'].includes(p.send?.strategy)) fail('INVALID_SEND_STRATEGY', 'Unsupported send strategy');
  for (const selectors of [p.composer?.selectors, p.send?.buttonSelectors, p.assistant?.containerSelectors, p.assistant?.streamingSelectors, p.preflight?.authWallSelectors]) {
    if (!Array.isArray(selectors) || !selectors.length || selectors.some(s => typeof s !== 'string' || !s.trim())) fail('INVALID_SELECTORS', 'Selectors must be nonempty string arrays');
  }
  if (p.user !== undefined && (!Array.isArray(p.user?.selectors) || !p.user.selectors.length || p.user.selectors.some(s => typeof s !== 'string' || !s.trim()))) fail('INVALID_SELECTORS', 'user.selectors must be a nonempty string array');
  if (p.assistant?.excludeSelectors !== undefined && (!Array.isArray(p.assistant.excludeSelectors) || p.assistant.excludeSelectors.some(x => typeof x !== 'string' || !x.trim()))) fail('INVALID_SELECTORS', 'assistant.excludeSelectors must be a string array');
  if (p.user?.lineSelector !== undefined && (typeof p.user.lineSelector !== 'string' || !p.user.lineSelector.trim())) fail('INVALID_SELECTORS', 'user.lineSelector must be a nonempty string');
  if (p.models !== undefined) {
    const m = p.models;
    if (!m || typeof m.triggerSelector !== 'string' || !m.triggerSelector.trim()) fail('INVALID_MODELS', 'models.triggerSelector must be a nonempty string');
    for (const list of [m.ignore, m.tiers?.strong, m.tiers?.fast]) if (list !== undefined && (!Array.isArray(list) || list.some(x => { try { new RegExp(x); return typeof x !== 'string'; } catch { return true; } }))) fail('INVALID_MODELS', 'models regex lists must be valid regex strings');
    if (m.submenuText !== undefined && (typeof m.submenuText !== 'string' || !m.submenuText.trim())) fail('INVALID_MODELS', 'models.submenuText must be a nonempty string');
  }
  if (p.send?.foreground !== undefined && typeof p.send.foreground !== 'boolean') fail('INVALID_SEND_STRATEGY', 'send.foreground must be a boolean');
  if (!['measured', 'seeded-unverified'].includes(p.status)) fail('INVALID_STATUS', 'Invalid status');
  // `strengths` is optional. A profile that omits it is defaulted to an empty list instead of
  // throwing, so one incomplete provider (e.g. a seeded, unmeasured profile that declares no
  // strengths) cannot kill the whole registry at import time. An explicitly invalid value
  // (wrong type, blank entries) is still a hard error.
  if (p.strengths === undefined) { if (Object.isExtensible(p)) p.strengths = []; }
  else if (!Array.isArray(p.strengths) || p.strengths.some(s => typeof s !== 'string' || !s.trim())) fail('INVALID_STRENGTHS', 'strengths must be an array of nonempty strings');
  return p;
}
providers.forEach(validateProfile);
export const listProviders = () => [...providers];
export const getProvider = id => providers.find(p => p.id === id) ?? null;
export function providerForUrl(input) {
  try {
    const url = new URL(input);
    if (url.protocol !== 'https:' || url.username || url.password || url.port) return null;
    return providers.find(p => p.hosts.includes(url.hostname)) ?? null;
  } catch { return null; }
}
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
