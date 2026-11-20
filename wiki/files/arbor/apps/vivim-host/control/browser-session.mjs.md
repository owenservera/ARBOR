# File: apps/vivim-host/control/browser-session.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/control/browser-session.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 2767 B |
| Lines | 63 |
| Hash | 74384cc8c09d |
| Test | no |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| UI_COOKIE | const | 8 | yes | export const UI_COOKIE = &#39;vivim_control_ui&#39;; |
| random | function | 9 | no | const random = () =&gt; randomBytes(32).toString(&#39;hex&#39;); |
| fail | function | 10 | no | const fail = (code, status = 403) =&gt; { throw Object.assign(new Error(code), { code, status }); }; |
| CODE | const | 11 | no | const CODE = /^[a-f0-9]{64}$/; |
| createControlBrowserSessions | function | 13 | yes | export function createControlBrowserSessions({ now = () =&gt; Date.now(), codeTtlMs = 60_000, sessionTtlMs = 15 * 60_000 } = {}) { |
| codes | const | 18 | no | const codes = new Map(); |
| sessions | const | 19 | no | const sessions = new Map(); |
| prune | function | 20 | no | function prune() { |
| time | const | 21 | no | const time = now(); |
| issue | function | 25 | no | function issue() { |
| code | const | 29 | no | const code = random(), expiresAt = now() + codeTtlMs; |
| exchange | function | 33 | no | function exchange(code) { |
| sessionId | const | 39 | no | const sessionId = random(), csrf = random(), expiresAt = now() + sessionTtlMs; |
| get | function | 43 | no | function get(req) { |
| cookie | const | 45 | no | const cookie = String(req.headers.cookie \|\| &#39;&#39;).split(&#39;;&#39;).map(x =&gt; x.trim()) |
| sid | const | 47 | no | const sid = cookie?.slice(UI_COOKIE.length + 1) ?? &#39;&#39;; |
| state | const | 49 | no | const state = sessions.get(sid); |
| authorized | function | 52 | no | function authorized(req, { mutate = false } = {}) { |
| session | const | 53 | no | const session = get(req); |
| revoke | function | 58 | no | function revoke(req) { |
| session | const | 59 | no | const session = get(req); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 6 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [apps/vivim-host/server.mjs](../server.mjs.md) | ./control/browser-session.mjs |
| [apps/vivim-host/test/control-browser-session.test.mjs](../test/control-browser-session.test.mjs.md) | ../control/browser-session.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// One-time, owner-authorized local browser sessions for the VIVIM desktop UI.
// The native desktop process (or authenticated local CLI) presents the protected owner
// capability to issue a code. A code is short-lived, single-use and delivered to the
// browser only in a URL fragment. The browser exchanges it for an HttpOnly cookie +
// CSRF proof. The long-lived owner capability never enters HTML, JavaScript or URLs.
import { randomBytes } from 'node:crypto';

export const UI_COOKIE = 'vivim_control_ui';
const random = () => randomBytes(32).toString('hex');
const fail = (code, status = 403) => { throw Object.assign(new Error(code), { code, status }); };
const CODE = /^[a-f0-9]{64}$/;

export function createControlBrowserSessions({
  now = () => Date.now(),
  codeTtlMs = 60_000,
  sessionTtlMs = 15 * 60_000
} = {}) {
  const codes = new Map();
  const sessions = new Map();
  function prune() {
    const time = now();
    for (const [code, expires] of codes) if (time >= expires) codes.delete(code);
    for (const [sid, state] of sessions) if (time >= state.expiresAt) sessions.delete(sid);
  }
  function issue() {
    prune();
    // Protect long-lived installations against unbounded state.
    if (codes.size >= 32) fail('CONTROL_UI_CAPACITY', 429);
    const code = random(), expiresAt = now() + codeTtlMs;
    codes.set(code, expiresAt);
    return { code, expiresAt, ttlMs: codeTtlMs };
  }
  function exchange(code) {
    prune();
    if (typeof code !== 'string' || !CODE.test(code)) fail('CONTROL_UI_CODE_INVALID');
    if (!codes.has(code)) fail('CONTROL_UI_CODE_UNKNOWN');
    codes.delete(code); // consume once, even if session is at capacity
    if (sessions.size >= 32) fail('CONTROL_UI_CAPACITY', 429);
    const sessionId = random(), csrf = random(), expiresAt = now() + sessionTtlMs;
    sessions.set(sessionId, { csrf, expiresAt });
    return { sessionId, csrf, expiresAt, maxAge: Math.floor(sessionTtlMs / 1000) };
  }
  function get(req) {
    prune();
    const cookie = String(req.headers.cookie || '').split(';').map(x => x.trim())
      .find(x => x.startsWith(UI_COOKIE + '='));
    const sid = cookie?.slice(UI_COOKIE.length + 1) ?? '';
    if (!CODE.test(sid)) return null;
    const state = sessions.get(sid);
    return state ? { sessionId: sid, ...state } : null;
  }
  function authorized(req, { mutate = false } = {}) {
    const session = get(req);
    if (!session) return false;
    if (mutate && req.headers['x-vivim-ui-csrf'] !== session.csrf) return false;
    return true;
  }
  function revoke(req) {
    const session = get(req);
    if (session) sessions.delete(session.sessionId);
  }
  return { issue, exchange, authorized, revoke, get };
}
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
