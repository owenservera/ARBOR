# File: apps/vivim-host/onboarding/studio-port.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/onboarding/studio-port.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 2309 B |
| Lines | 37 |
| Hash | dec641a8cada |
| Test | no |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| CODE | const | 3 | no | const CODE = /^[A-Z][A-Z0-9_]{0,79}$/; |
| enc | const | 4 | no | const enc = encodeURIComponent; |
| createStudioPort | function | 6 | yes | export function createStudioPort({ url, token = null, fetchImpl = fetch, timeoutMs = 30000 } = {}) { |
| base | variable | 7 | no | let base; |
| request | function | 12 | no | async function request(route, body) { |
| headers | const | 13 | no | const headers = { ...(body === undefined ? {} : { &#39;content-type&#39;: &#39;application/json&#39; }), ...(token ? { &#39;x-studio-token&#39;: token } : {}) }; |
| response | const | 14 | no | const response = await fetchImpl(base.origin + &#39;/api/v1&#39; + route, { method: body === undefined ? &#39;GET&#39; : &#39;POST&#39;, redirect: &#39;error&#39;, signal: AbortSignal.timeout(timeoutMs), headers, ...(body === undef… |
| result | variable | 18 | no | let result; |
| code | const | 21 | no | const code = typeof result?.code === &#39;string&#39; &amp;&amp; CODE.test(result.code) ? result.code : &#39;STUDIO_HTTP_ERROR&#39;; |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [apps/vivim-host/server.mjs](../server.mjs.md) | ./onboarding/studio-port.mjs |
| [apps/vivim-host/test/onboarding.test.mjs](../test/onboarding.test.mjs.md) | ../onboarding/studio-port.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Loopback HTTP port to the Studio conversation API. Studio stays the only browser owner and
// send-once journal; this file only speaks its documented routes and never touches CDP or Chrome.
const CODE = /^[A-Z][A-Z0-9_]{0,79}$/;
const enc = encodeURIComponent;

export function createStudioPort({ url, token = null, fetchImpl = fetch, timeoutMs = 30000 } = {}) {
  let base;
  try { base = new URL(url); } catch { throw new TypeError('Studio URL must be a loopback HTTP origin'); }
  if (base.protocol !== 'http:' || !['127.0.0.1', 'localhost', '[::1]'].includes(base.hostname) || base.origin !== url || base.username || base.password)
    throw new TypeError('Studio URL must be a loopback HTTP origin');

  async function request(route, body) {
    const headers = { ...(body === undefined ? {} : { 'content-type': 'application/json' }), ...(token ? { 'x-studio-token': token } : {}) };
    const response = await fetchImpl(base.origin + '/api/v1' + route, {
      method: body === undefined ? 'GET' : 'POST', redirect: 'error', signal: AbortSignal.timeout(timeoutMs), headers,
      ...(body === undefined ? {} : { body: JSON.stringify(body) })
    });
    let result;
    try { result = await response.json(); } catch { throw Object.assign(new Error('STUDIO_INVALID_RESPONSE'), { code: 'STUDIO_INVALID_RESPONSE' }); }
    if (!response.ok) {
      const code = typeof result?.code === 'string' && CODE.test(result.code) ? result.code : 'STUDIO_HTTP_ERROR';
      throw Object.assign(new Error(code), { code, status: response.status });
    }
    return result;
  }

  return {
    origin: base.origin,
    // A listing succeeds only when the Studio owner process is up and answering.
    reachable: async () => { try { await request('/conversations'); return true; } catch { return false; } },
    sites: async () => (await request('/conversation-targets')).sites ?? [],
    create: async ({ site = 'chatgpt' } = {}) => (await request('/conversations/create', { site })).conversation,
    submit: async (id, body) => request(`/conversations/${enc(id)}/turns`, body),
    get: async id => (await request(`/conversations/${enc(id)}`)).conversation,
    finish: async (id, { closeTab = false } = {}) => request(`/conversations/${enc(id)}/finish`, { closeTab })
  };
}
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
