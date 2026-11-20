# File: harness/src/core/pinchtab.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | harness/src/core/pinchtab.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 7515 B |
| Lines | 162 |
| Hash | b624f61cbc31 |
| Test | no |
| Generated | no |
| Component | harness |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| DENIED_PORT | const | 17 | no | const DENIED_PORT = 9222; |
| REQUIRED_HOST | const | 18 | no | const REQUIRED_HOST = &#39;127.0.0.1&#39;; |
| coded | function | 20 | no | function coded(code, message) { |
| validateBaseUrl | function | 25 | no | function validateBaseUrl(baseUrl) { |
| u | variable | 26 | no | let u; |
| port | const | 28 | no | const port = Number(u.port \|\| 80); |
| requireString | function | 35 | no | function requireString(value, code, message) { |
| enc | function | 40 | no | const enc = value =&gt; encodeURIComponent(String(value)); |
| connectPinchtab | function | 43 | yes | export async function connectPinchtab({ baseUrl, instanceId, token, fetchImpl = fetch } = {}) { |
| origin | const | 44 | no | const origin = validateBaseUrl(baseUrl); |
| request | function | 49 | no | async function request(method, path, body) { |
| headers | const | 50 | no | const headers = { Authorization: `Bearer ${token}`, Accept: &#39;application/json&#39; }; |
| res | variable | 56 | no | let res; |
| tabsPath | const | 66 | no | const tabsPath = `/instances/${enc(instanceId)}/tabs`; |
| openPath | const | 67 | no | const openPath = `/instances/${enc(instanceId)}/tabs/open`; |
| listTabs | function | 69 | no | async function listTabs() { |
| list | const | 70 | no | const list = await (await request(&#39;GET&#39;, tabsPath)).json(); |
| pageFor | function | 76 | no | function pageFor(tabId) { |
| tabPath | const | 77 | no | const tabPath = `/tabs/${enc(tabId)}`; |
| action | function | 78 | no | const action = body =&gt; request(&#39;POST&#39;, `${tabPath}/action`, body).then(() =&gt; undefined); |
| evaluate | function | 79 | no | async function evaluate(expression) { |
| body | const | 81 | no | const body = await (await request(&#39;POST&#39;, `${tabPath}/evaluate`, { expression, awaitPromise: true })).json(); |
| body | const | 118 | no | const body = await (await request(&#39;POST&#39;, openPath, { url })).json(); |
| verifyAttachedInstance | function | 129 | yes | export async function verifyAttachedInstance({ baseUrl, instanceId, token, expectPort = 9333, fetchImpl = fetch } = {}) { |
| origin | const | 130 | no | const origin = validateBaseUrl(baseUrl); |
| res | variable | 134 | no | let res; |
| body | variable | 145 | no | let body; |
| refused | function | 147 | no | const refused = () =&gt; coded(&#39;PINCHTAB_INSTANCE_NOT_ON_EXPECTED_CDP&#39;, &#39;PinchTab instance is not attached and running on the expected CDP endpoint&#39;); |
| cdpOnExpectedEndpoint | function | 155 | no | function cdpOnExpectedEndpoint(cdpUrl, expectPort) { |
| u | variable | 157 | no | let u; |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [harness/src/interface/deps.mjs](../interface/deps.mjs.md) | ../core/pinchtab.mjs |
| [harness/test/core/pinchtab.test.mjs](../../test/core/pinchtab.test.mjs.md) | ../../src/core/pinchtab.mjs |
| [harness/test/core/pinchtab.test.mjs](../../test/core/pinchtab.test.mjs.md) | ../../src/core/pinchtab.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// PinchTab adapter: same Browser/Page shape as src/core/cdp.mjs, but drives Chrome
// through a locally running PinchTab HTTP server instead of raw CDP.
//
// Routes used (all documented in sources/pinchtab/docs/reference):
//   GET  /instances/{id}/tabs            tab list for one instance (bare array)
//   POST /instances/{id}/tabs/open       body {url}; answers {tabId,url,title}
//   POST /tabs/{tabId}/evaluate          body {expression, awaitPromise}; answers {result}
//   POST /tabs/{tabId}/action            kinds: keyboard-inserttext, press, click
//
// Binding: every tab id reaches this adapter only through the instance-scoped list
// or open route, and attach() accepts only an exact id from that list. Per-tab
// routes are addressed as /tabs/{id}/... as documented.
//
// Safety: exactly one HTTP attempt per request (no retries). No approval logic here;
// callers (router/send) decide when a method runs.

const DENIED_PORT = 9222;
const REQUIRED_HOST = '127.0.0.1';

function coded(code, message) {
  return Object.assign(new Error(message), { code });
}

// Accepts only http://127.0.0.1:<port> with port != 9222. Returns the origin.
function validateBaseUrl(baseUrl) {
  let u;
  try { u = new URL(baseUrl); } catch { throw coded('PINCHTAB_HOST_REFUSED', 'PinchTab baseUrl refused'); }
  const port = Number(u.port || 80);
  if (u.protocol !== 'http:' || u.hostname !== REQUIRED_HOST || port === DENIED_PORT) {
    throw coded('PINCHTAB_HOST_REFUSED', 'PinchTab baseUrl refused');
  }
  return u.origin;
}

function requireString(value, code, message) {
  if (typeof value !== 'string' || value.trim() === '') throw coded(code, message);
  return value;
}

const enc = value => encodeURIComponent(String(value));

// Opens a PinchTab-backed Browser. Performs no network I/O until a method is called.
export async function connectPinchtab({ baseUrl, instanceId, token, fetchImpl = fetch } = {}) {
  const origin = validateBaseUrl(baseUrl);
  requireString(token, 'PINCHTAB_TOKEN_REQUIRED', 'PinchTab token is required');
  requireString(instanceId, 'PINCHTAB_INSTANCE_REQUIRED', 'PinchTab instanceId is required');

  // Exactly one attempt. Errors never carry the body, the token, or the underlying message.
  async function request(method, path, body) {
    const headers = { Authorization: `Bearer ${token}`, Accept: 'application/json' };
    const init = { method, headers };
    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
      init.body = JSON.stringify(body);
    }
    let res;
    try {
      res = await fetchImpl(origin + path, init);
    } catch {
      throw coded('PINCHTAB_REQUEST_FAILED', 'PinchTab request failed (no response)');
    }
    if (res.status >= 400) throw coded('PINCHTAB_REQUEST_FAILED', `PinchTab request failed (HTTP ${res.status})`);
    return res;
  }

  const tabsPath = `/instances/${enc(instanceId)}/tabs`;
  const openPath = `/instances/${enc(instanceId)}/tabs/open`;

  async function listTabs() {
    const list = await (await request('GET', tabsPath)).json();
    return (Array.isArray(list) ? list : [])
      .filter(t => t && (t.instanceId === undefined || t.instanceId === instanceId))
      .map(({ id, url, title }) => ({ id, url, title, type: 'page' }));
  }

  function pageFor(tabId) {
    const tabPath = `/tabs/${enc(tabId)}`;
    const action = body => request('POST', `${tabPath}/action`, body).then(() => undefined);
    async function evaluate(expression) {
      requireString(expression, 'PINCHTAB_BAD_ARGUMENT', 'expression must be a non-empty string');
```

_First 80 of 163 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
