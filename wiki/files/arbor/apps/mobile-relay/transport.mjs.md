# File: apps/mobile-relay/transport.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | apps/mobile-relay/transport.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 7094 B |
| Lines | 105 |
| Hash | 8a3890cbcb6f |
| Test | no |
| Generated | no |
| Component | mobile-relay |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| CLOUD | const | 1 | no | const CLOUD = &#39;https://vivim-mobile-relay.vercel.app&#39;; |
| DIRECT_ONLY | const | 3 | no | const DIRECT_ONLY = typeof window !== &#39;undefined&#39; &amp;&amp; new URLSearchParams(window.location.search).get(&#39;connection&#39;) === &#39;direct&#39;; |
| MODE | const | 4 | no | const MODE = &#39;vivim.connection.mode.v1&#39;, DIRECT = &#39;vivim.connection.direct.v1&#39;, PENDING = &#39;vivim.connection.uncertain.v1&#39;; |
| directOrigin | function | 6 | yes | export function directOrigin(value) { |
| u | const | 8 | no | const u = new URL(value); |
| loopback | const | 9 | no | const loopback = [&#39;localhost&#39;, &#39;127.0.0.1&#39;, &#39;[::1]&#39;].includes(u.hostname); |
| createTransport | function | 17 | yes | export function createTransport({ fetchImpl, location, storage, navigate = url =&gt; location.assign(url) }) { |
| get | function | 18 | no | const get = key =&gt; { try { return storage.getItem(key); } catch { return null; } }; |
| put | function | 19 | no | const put = (key, value) =&gt; { try { storage.setItem(key, value); } catch {} }; |
| remove | function | 20 | no | const remove = key =&gt; { try { storage.removeItem(key); } catch {} }; |
| incomingMode | const | 21 | no | const incomingMode = new URLSearchParams(location.search \|\| &#39;&#39;).get(&#39;connection&#39;); |
| direct | const | 23 | no | const direct = !!directOrigin(location.origin) &amp;&amp; location.pathname.startsWith(&#39;/mobile/&#39;); |
| cloudOrigin | const | 25 | no | const cloudOrigin = direct ? CLOUD : location.origin; |
| mode | function | 26 | no | const mode = () =&gt; DIRECT_ONLY \|\| direct ? &#39;direct&#39; : ([&#39;auto&#39;, &#39;direct&#39;, &#39;cloud&#39;].includes(get(MODE)) ? get(MODE) : &#39;auto&#39;); |
| pending | function | 27 | no | const pending = () =&gt; get(PENDING) === &#39;1&#39;; |
| navigating | variable | 28 | no | let navigating = false; |
| deviceSession | variable | 30 | no | let deviceSession = null; |
| setDeviceSession | function | 31 | no | function setDeviceSession(value) { |
| origin | const | 40 | no | const origin = directOrigin(address \|\| get(DIRECT)); |
| destination | const | 43 | no | const destination = next === &#39;direct&#39; \|\| (next === &#39;auto&#39; &amp;&amp; !direct &amp;&amp; origin) |
| request | function | 52 | no | async function request(path, options = {}) { |
| method | const | 53 | no | const method = (options.method \|\| &#39;GET&#39;).toUpperCase(), mutation = ![&#39;GET&#39;, &#39;HEAD&#39;].includes(method); |
| fallback | function | 56 | no | const fallback = () =&gt; { |
| response | variable | 66 | no | let response; |
| body | variable | 78 | no | let body = null; |
| deviceHeaders | function | 92 | no | const deviceHeaders = () =&gt; direct &amp;&amp; deviceSession &amp;&amp; deviceSession.expiresAt &gt; Date.now() |
| transport | const | 98 | yes | export const transport = typeof window === &#39;undefined&#39; ? null : createTransport({ fetchImpl: (...args) =&gt; fetch(...args), location: window.location, storage: window.localStorage }); |
| url | const | 102 | no | const url = new URL(window.location.href); |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [apps/mobile-relay/app.js](./app.js.md) | ./transport.mjs |
| [apps/mobile-relay/control-phone.mjs](./control-phone.mjs.md) | ./transport.mjs |
| [apps/mobile-relay/generative-ui/phone-surface.mjs](./generative-ui/phone-surface.mjs.md) | ../transport.mjs |
| [apps/mobile-relay/test/transport.test.mjs](./test/transport.test.mjs.md) | ../transport.mjs |
| [apps/mobile-relay/visual-bootstrap.mjs](./visual-bootstrap.mjs.md) | ./transport.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
const CLOUD = 'https://vivim-mobile-relay.vercel.app';
// A phone served from a Direct Host never navigates to Cloud implicitly.
const DIRECT_ONLY = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('connection') === 'direct';
const MODE = 'vivim.connection.mode.v1', DIRECT = 'vivim.connection.direct.v1', PENDING = 'vivim.connection.uncertain.v1';

export function directOrigin(value) {
  try {
    const u = new URL(value);
    const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(u.hostname);
    if (u.username || u.password || u.pathname !== '/' || u.search || u.hash) return null;
    if (!(u.protocol === 'https:' && u.hostname.endsWith('.ts.net') && u.hostname.length > 7) &&
        !(loopback && (u.protocol === 'http:' || u.protocol === 'https:'))) return null;
    return u.origin;
  } catch { return null; }
}

export function createTransport({ fetchImpl, location, storage, navigate = url => location.assign(url) }) {
  const get = key => { try { return storage.getItem(key); } catch { return null; } };
  const put = (key, value) => { try { storage.setItem(key, value); } catch {} };
  const remove = key => { try { storage.removeItem(key); } catch {} };
  const incomingMode = new URLSearchParams(location.search || '').get('connection');
  if (['auto', 'direct', 'cloud'].includes(incomingMode)) put(MODE, incomingMode);
  const direct = !!directOrigin(location.origin) && location.pathname.startsWith('/mobile/');
  if (direct) put(DIRECT, location.origin);
  const cloudOrigin = direct ? CLOUD : location.origin;
  const mode = () => DIRECT_ONLY || direct ? 'direct' : (['auto', 'direct', 'cloud'].includes(get(MODE)) ? get(MODE) : 'auto');
  const pending = () => get(PENDING) === '1';
  let navigating = false;
  // Ephemeral only: never persist a device bearer session in localStorage.
  let deviceSession = null;
  function setDeviceSession(value) {
    if (value == null) { deviceSession = null; return; }
    if (!direct || !/^[a-f0-9]{32}$/.test(value.grantId || '') || !/^[a-f0-9]{32}$/.test(value.sessionId || '') ||
        !Number.isFinite(value.expiresAt) || value.expiresAt <= Date.now()) throw new Error('Invalid device session');
    deviceSession = { grantId: value.grantId, sessionId: value.sessionId, expiresAt: value.expiresAt };
  }
  function select(next, address, acknowledge = false) {
    if (!['auto', 'direct', 'cloud'].includes(next)) throw new Error('Invalid connection mode');
    if ((DIRECT_ONLY || direct) && next === 'cloud') throw new Error('Cloud mode is disabled on this Direct Host');
    const origin = directOrigin(address || get(DIRECT));
    if (address && !origin) throw new Error('Enter an HTTPS Tailscale origin without a path, or a loopback development origin.');
    if (next === 'direct' && !origin) throw new Error('Enter your Tailscale PC address first.');
    const destination = next === 'direct' || (next === 'auto' && !direct && origin)
      ? origin + '/mobile/?connection=' + next
      : next === 'cloud' ? cloudOrigin + '/mobile?connection=cloud' : null;
    if (destination && new URL(destination).origin !== location.origin && pending() && !acknowledge)
      throw new Error('A send may still be pending on this connection. Check it here before switching.');
    if (origin) put(DIRECT, origin);
    put(MODE, next);
    if (destination && new URL(destination).origin !== location.origin) navigate(destination);
  }
  async function request(path, options = {}) {
    const method = (options.method || 'GET').toUpperCase(), mutation = !['GET', 'HEAD'].includes(method);
    if (mutation && pending()) throw Object.assign(new Error('A previous send is uncertain; check this connection before sending again.'), { uncertain: true });
    if (mutation) put(PENDING, '1');
    const fallback = () => {
      if (!mutation && path === 'session' && !DIRECT_ONLY && !direct && mode() === 'auto' && !pending() && !navigating) {
        navigating = true; navigate(CLOUD + '/mobile?connection=auto');
      }
    };
    if (direct && (!deviceSession || deviceSession.expiresAt <= Date.now())) {
      deviceSession = null;
      if (mutation) remove(PENDING);
      throw Object.assign(new Error('Approve this phone on your PC and establish a device session before sending.'), { status: 401 });
    }
    let response;
    try {
      response = await fetchImpl((direct ? '/mobile/api/relay?path=' : '/api/relay?path=') + encodeURIComponent(path), {
        credentials: 'same-origin', cache: 'no-store', ...options,
        headers: { 'content-type': 'application/json', ...(direct ? { 'x-vivim-grant-id': deviceSession.grantId, 'x-vivim-device-session': deviceSession.sessionId } : {}), ...(options.headers || {}) }
      });
    } catch (error) {
      fallback();
      if (mutation) throw Object.assign(new Error('Send uncertain; check this connection before switching or sending again.'), { cause: error, uncertain: true });
      throw Object.assign(new Error('Connection unavailable'), { cause: error });
    }
    if (response.status >= 500) fallback();
    let body = null;
    try { if (response.status !== 204) body = await response.json(); }
    catch {
```

_First 80 of 106 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
