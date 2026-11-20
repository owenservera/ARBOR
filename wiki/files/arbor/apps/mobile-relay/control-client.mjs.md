# File: apps/mobile-relay/control-client.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | apps/mobile-relay/control-client.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 5917 B |
| Lines | 116 |
| Hash | 6da8fdbbe30e |
| Test | no |
| Generated | no |
| Component | mobile-relay |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| createControlClient | function | 4 | yes | export function createControlClient({ transport, fetchImpl = (...args) =&gt; fetch(...args) } = {}) { |
| directReady | function | 8 | no | async function directReady(signal) { |
| response | const | 11 | no | const response = await fetchImpl(&#39;/mobile/connection.json&#39;, { method: &#39;GET&#39;, credentials: &#39;same-origin&#39;, cache: &#39;no-store&#39;, ...(signal?{signal}:{}) }); |
| data | const | 15 | no | const data = await response.json(); |
| call | function | 22 | no | async function call(path, body) { |
| signal | const | 23 | no | const signal=path===&#39;interpret&#39;&amp;&amp;body?.composer===true?AbortSignal.timeout(5000):undefined; |
| device | const | 27 | no | const device = transport.deviceHeaders(); |
| writing | const | 31 | no | const writing = body !== undefined; |
| response | variable | 39 | no | let response; |
| data | variable | 56 | no | let data; |
| validatePlan | function | 76 | no | function validatePlan(plan) { |
| target | const | 94 | no | const target = validatePlan(plan); |
| receipt | const | 95 | no | const receipt = await call(&#39;execute&#39;, target); |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [apps/mobile-relay/app.js](./app.js.md) | ./control-client.mjs |
| [apps/mobile-relay/control-chat.mjs](./control-chat.mjs.md) | ./control-client.mjs |
| [apps/mobile-relay/control-phone.mjs](./control-phone.mjs.md) | ./control-client.mjs |
| [apps/mobile-relay/test/universal-control-chat.test.mjs](./test/universal-control-chat.test.mjs.md) | ../control-client.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// One client for both the Control tab and Talk's VIVIM mode.
// The Host's existing dispatcher remains the only action planner and effect writer.
// No cloud fallback, no inferred grant, no implicit approval or retry after uncertainty.
export function createControlClient({ transport, fetchImpl = (...args) => fetch(...args) } = {}) {
  if (!transport || typeof transport.deviceHeaders !== 'function')
    throw new TypeError('A Direct-capable VIVIM transport is required');

  async function directReady(signal) {
    if (transport.direct !== true) return false;
    try {
      const response = await fetchImpl('/mobile/connection.json', {
        method: 'GET', credentials: 'same-origin', cache: 'no-store', ...(signal?{signal}:{})
      });
      if (!response.ok) return false;
      const data = await response.json();
      return data?.direct === true && data?.directOnly === true && data?.cloudEnabled === false;
    } catch {
      return false;
    }
  }

  async function call(path, body) {
    const signal=path==='interpret'&&body?.composer===true?AbortSignal.timeout(5000):undefined;
    if (!await directReady(signal)) throw Object.assign(
      new Error('Direct connection to your paired PC is required. Nothing was sent.'),
      { code: 'DIRECT_REQUIRED' });
    const device = transport.deviceHeaders();
    if (!device) throw Object.assign(
      new Error('Approve this phone on the PC before using private control.'),
      { code: 'DEVICE_GRANT_REQUIRED' });
    const writing = body !== undefined;
    if (!['catalog', 'language', 'world', 'lexicon', 'recent', 'programs', 'interpret', 'plan', 'execute'].includes(path) &&
        !/^plans\/ctl-[a-f0-9]{16}$/.test(path))
      throw new TypeError('Unknown control operation');
    if (writing && !['interpret', 'plan', 'execute'].includes(path)) throw new TypeError('Invalid control method');
    if (!writing && ['interpret', 'plan', 'execute'].includes(path)) throw new TypeError('Control body required');

    // For a mutating operation a lost response is UNCERTAIN, never safe to re-issue.
    let response;
    try {
      response = await fetchImpl('/mobile/api/control/' + path, {
        method: writing ? 'POST' : 'GET', credentials: 'same-origin', cache: 'no-store',
        headers: { ...device, ...(writing ? {
          'content-type': 'application/json', 'x-vivim-control': '1'
        } : {}) },
        ...(writing ? { body: JSON.stringify(body) } : {}),
        ...(signal?{signal}:{})
      });
    } catch {
      throw Object.assign(new Error(path === 'execute'
        ? 'Outcome uncertain. Check the PC receipt; VIVIM will not retry automatically.'
        : 'The PC could not be reached. No control action was executed.'), {
          code: path === 'execute' ? 'CONTROL_UNCERTAIN' : 'CONTROL_CONNECTION_UNAVAILABLE'
        });
    }
    let data;
    try { data = await response.json(); }
    catch {
      throw Object.assign(new Error(path === 'execute'
        ? 'Execution response was unreadable. Check the PC before another action.'
        : 'The PC returned an unreadable response.'), {
          code: path === 'execute' ? 'CONTROL_UNCERTAIN' : 'CONTROL_RESPONSE_INVALID'
        });
    }
    if (path === 'execute' && response.status >= 500) {
      throw Object.assign(new Error('Outcome uncertain. Check the PC receipt; nothing is automatically repeated.'), {
        code: 'CONTROL_UNCERTAIN'
      });
    }
    if (!response.ok) throw Object.assign(
      new Error(String(data?.error || data?.code || 'PC refused the control request').slice(0, 160)),
      { code: data?.code || 'CONTROL_REFUSED', status: response.status });
    return data;
  }

  function validatePlan(plan) {
    if (!plan || plan.outcome !== 'approval_required' ||
        typeof plan.planId !== 'string' || !/^ctl-[a-f0-9]{16}$/.test(plan.planId) ||
        typeof plan.planDigest !== 'string' || !/^[a-f0-9]{64}$/.test(plan.planDigest) ||
        typeof plan.expiresAt !== 'string' || !Number.isFinite(Date.parse(plan.expiresAt)))
```

_First 80 of 117 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
