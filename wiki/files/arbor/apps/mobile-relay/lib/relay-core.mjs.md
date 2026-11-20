# File: apps/mobile-relay/lib/relay-core.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/mobile-relay/lib/relay-core.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 8703 B |
| Lines | 111 |
| Hash | b62179a3cd28 |
| Test | no |
| Generated | no |
| Component | mobile-relay |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| COOKIE | const | 6 | yes | export const COOKIE = &#39;vivim_relay&#39;; |
| MAX_TEXT | const | 7 | no | const MAX_TEXT = 4000, MAX_RESULT = 60000, MAX_STATUS = 32000; |
| KINDS | const | 8 | no | const KINDS = [&#39;command&#39;, &#39;intent&#39;, &#39;stage&#39;], CONSUMERS = [&#39;grokbot&#39;, &#39;harness&#39;, &#39;bootstrap&#39;]; |
| THEME_PRESETS | const | 10 | no | const THEME_PRESETS = [&#39;lab&#39;,&#39;tide&#39;,&#39;dusk&#39;,&#39;ember&#39;,&#39;grove&#39;,&#39;ink&#39;,&#39;dawn&#39;]; |
| STATUSES | const | 11 | no | const STATUSES = [&#39;claimed&#39;, &#39;done&#39;, &#39;failed&#39;]; |
| eq | function | 12 | no | const eq = (a, b) =&gt; { const x = createHash(&#39;sha256&#39;).update(String(a)).digest(), y = createHash(&#39;sha256&#39;).update(String(b)).digest(); return timingSafeEqual(x, y); }; |
| sessionValue | function | 13 | yes | export const sessionValue = pair =&gt; createHmac(&#39;sha256&#39;, pair).update(&#39;vivim-relay-session/1&#39;).digest(&#39;base64url&#39;); |
| cookies | function | 14 | no | const cookies = h =&gt; Object.fromEntries(String(h \|\| &#39;&#39;).split(&#39;;&#39;).map(s =&gt; s.trim().split(&#39;=&#39;)).filter(p =&gt; p[0]).map(([k, ...v]) =&gt; [k, v.join(&#39;=&#39;)])); |
| fail | function | 15 | no | const fail = (status, error) =&gt; Object.assign(new Error(error), { status }); |
| idOk | function | 16 | no | const idOk = id =&gt; typeof id === &#39;string&#39; &amp;&amp; /^cmd-[0-9a-f]{16}$/.test(id); |
| createRelay | function | 18 | yes | export function createRelay({ store, env, now = () =&gt; new Date().toISOString() }) { |
| pair | const | 19 | no | const pair = env.VIVIM_RELAY_PAIR_SECRET, host = env.VIVIM_RELAY_HOST_SECRET; |
| isPhone | function | 20 | no | const isPhone = req =&gt; !!pair &amp;&amp; !!cookies(req.headers.cookie)[COOKIE] &amp;&amp; eq(cookies(req.headers.cookie)[COOKIE], sessionValue(pair)); |
| isHost | function | 21 | no | const isHost = req =&gt; !!host &amp;&amp; typeof req.headers.authorization === &#39;string&#39; &amp;&amp; req.headers.authorization.startsWith(&#39;Bearer &#39;) &amp;&amp; eq(req.headers.authorization.slice(7), host); |
| latest | function | 22 | no | const latest = async () =&gt; { |
| out | const | 23 | no | const out = new Map(); |
| one | function | 27 | no | const one = async id =&gt; (await latest()).find(r =&gt; r.id === id) \|\| null; |
| r | const | 39 | no | const r = await one(body?.id); if (!r) throw fail(404, &#39;Unknown command&#39;); |
| result | const | 42 | no | const result = body.result == null ? null : String(body.result); |
| t | const | 44 | no | const t = now(), next = { ...r, status: body.status, result: result ?? r.result, updatedAt: t, rev: r.rev + 1, |
| raw | const | 50 | no | const raw = JSON.stringify(body ?? {}); if (raw.length &gt; MAX_STATUS) throw fail(413, &#39;Status too large&#39;); |
| extra | const | 62 | no | const extra = chatFields(body); // grokbot-authored: relay-chat structured fields |
| t | const | 63 | no | const t = now(), rec = { ...extra, schema: &#39;vivim.bridge-command/1&#39;, id: &#39;cmd-&#39; + randomBytes(8).toString(&#39;hex&#39;), kind, text: text.trim(), ...(stage ? { stage } : {}), |
| m | const | 67 | no | const m = path.match(/^commands\\/([^/]+)$/); |
| chatFields | function | 75 | no | function chatFields(b) { |
| o | const | 76 | no | const o = {}, re = (v, r) =&gt; typeof v === &#39;string&#39; &amp;&amp; r.test(v); |
| allowed | const | 82 | no | const allowed = new Set([&#39;text&#39;,&#39;kind&#39;,&#39;consumer&#39;,&#39;mode&#39;,&#39;action&#39;,&#39;preset&#39;,&#39;proposal&#39;]); |
| memoryStore | function | 107 | yes | export function memoryStore() { |
| cmds | const | 108 | no | const cmds = [], st = []; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 4 | external |
| ../../vivim-host/control/bootstrap-actions.mjs | import | 9 | [apps/vivim-host/control/bootstrap-actions.mjs](../../vivim-host/control/bootstrap-actions.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [apps/mobile-relay/api/relay.mjs](../api/relay.mjs.md) | ../lib/relay-core.mjs |
| [apps/mobile-relay/test/a02-verify-no-change.test.mjs](../test/a02-verify-no-change.test.mjs.md) | ../lib/relay-core.mjs |
| [apps/mobile-relay/test/bootstrap-actions-allowlist.test.mjs](../test/bootstrap-actions-allowlist.test.mjs.md) | ../lib/relay-core.mjs |
| [apps/mobile-relay/test/relay-core.test.mjs](../test/relay-core.test.mjs.md) | ../lib/relay-core.mjs |
| [apps/vivim-host/direct-phone.mjs](../../vivim-host/direct-phone.mjs.md) | ../mobile-relay/lib/relay-core.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// grokbot-authored. Outbound-only mobile relay core (storage-agnostic, unit-testable).
// Phone: pairing secret -> HttpOnly Secure cookie (HMAC of PAIR secret, never the secret itself).
// Box agent: Authorization: Bearer <HOST secret>. Commands are append-only revisions, never overwritten.
import { createHash, createHmac, timingSafeEqual, randomBytes } from 'node:crypto';

export const COOKIE = 'vivim_relay';
const MAX_TEXT = 4000, MAX_RESULT = 60000, MAX_STATUS = 32000;
const KINDS = ['command', 'intent', 'stage'], CONSUMERS = ['grokbot', 'harness', 'bootstrap'];
import { BOOTSTRAP_ACTIONS } from '../../vivim-host/control/bootstrap-actions.mjs';
const THEME_PRESETS = ['lab','tide','dusk','ember','grove','ink','dawn'];
const STATUSES = ['claimed', 'done', 'failed'];
const eq = (a, b) => { const x = createHash('sha256').update(String(a)).digest(), y = createHash('sha256').update(String(b)).digest(); return timingSafeEqual(x, y); };
export const sessionValue = pair => createHmac('sha256', pair).update('vivim-relay-session/1').digest('base64url');
const cookies = h => Object.fromEntries(String(h || '').split(';').map(s => s.trim().split('=')).filter(p => p[0]).map(([k, ...v]) => [k, v.join('=')]));
const fail = (status, error) => Object.assign(new Error(error), { status });
const idOk = id => typeof id === 'string' && /^cmd-[0-9a-f]{16}$/.test(id);

export function createRelay({ store, env, now = () => new Date().toISOString() }) {
  const pair = env.VIVIM_RELAY_PAIR_SECRET, host = env.VIVIM_RELAY_HOST_SECRET;
  const isPhone = req => !!pair && !!cookies(req.headers.cookie)[COOKIE] && eq(cookies(req.headers.cookie)[COOKIE], sessionValue(pair));
  const isHost = req => !!host && typeof req.headers.authorization === 'string' && req.headers.authorization.startsWith('Bearer ') && eq(req.headers.authorization.slice(7), host);
  const latest = async () => {
    const out = new Map();
    for (const r of await store.listCommands()) { const p = out.get(r.id); if (!p || r.rev > p.rev) out.set(r.id, r); }
    return [...out.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  };
  const one = async id => (await latest()).find(r => r.id === id) || null;

  return async function route({ method, path, req, body }) {
    if (path === 'pair' && method === 'POST') {
      if (!pair || typeof body?.secret !== 'string' || !eq(body.secret, pair)) throw fail(401, 'Invalid pairing secret');
      return { status: 200, body: { paired: true }, cookie: `${COOKIE}=${sessionValue(pair)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=2592000` };
    }
    if (path === 'session' && method === 'GET') return { status: 200, body: { paired: isPhone(req) } };
    if (path.startsWith('host/')) {
      if (!isHost(req)) throw fail(401, 'Unauthorized');
      if (path === 'host/pending' && method === 'GET') return { status: 200, body: { commands: (await latest()).filter(r => r.status === 'queued') } };
      if (path === 'host/update' && method === 'POST') {
        const r = await one(body?.id); if (!r) throw fail(404, 'Unknown command');
        if (!STATUSES.includes(body.status)) throw fail(400, 'Invalid status');
        if (r.status === 'done' || r.status === 'failed') return { status: 200, body: r };
        const result = body.result == null ? null : String(body.result);
        if (result && result.length > MAX_RESULT) throw fail(413, 'Result too large');
        const t = now(), next = { ...r, status: body.status, result: result ?? r.result, updatedAt: t, rev: r.rev + 1,
          claimedBy: typeof body.by === 'string' && CONSUMERS.includes(body.by) ? body.by : (r.claimedBy ?? 'grokbot'),
          ...(body.status === 'claimed' ? { claimedAt: t } : { doneAt: t }) };
        await store.putCommand(next); return { status: 200, body: next };
      }
      if (path === 'host/status' && method === 'POST') {
        const raw = JSON.stringify(body ?? {}); if (raw.length > MAX_STATUS) throw fail(413, 'Status too large');
        await store.putStatus({ at: now(), snapshot: body }); return { status: 204 };
      }
      throw fail(404, 'Not found');
    }
    if (!isPhone(req)) throw fail(401, 'Not paired');
    if (path === 'commands' && method === 'GET') return { status: 200, body: { commands: (await latest()).slice(0, 50) } };
    if (path === 'commands' && method === 'POST') {
      const { text, kind = 'command', consumer = 'grokbot', stage } = body ?? {};
      if (typeof text !== 'string' || !text.trim() || text.length > MAX_TEXT) throw fail(400, 'text must be 1-4000 characters');
      if (!KINDS.includes(kind) || !CONSUMERS.includes(consumer)) throw fail(400, 'Invalid kind or consumer');
      if (stage !== undefined && (typeof stage !== 'string' || !/^[a-z0-9-]{1,64}$/.test(stage))) throw fail(400, 'Invalid stage');
      const extra = chatFields(body); // grokbot-authored: relay-chat structured fields
      const t = now(), rec = { ...extra, schema: 'vivim.bridge-command/1', id: 'cmd-' + randomBytes(8).toString('hex'), kind, text: text.trim(), ...(stage ? { stage } : {}),
        consumer, status: 'queued', createdAt: t, updatedAt: t, claimedBy: null, claimedAt: null, result: null, doneAt: null, rev: 1, origin: 'relay' };
      await store.putCommand(rec); return { status: 201, body: rec };
    }
    const m = path.match(/^commands\/([^/]+)$/);
    if (m && method === 'GET') { if (!idOk(m[1])) throw fail(400, 'Bad id'); const r = await one(m[1]); if (!r) throw fail(404, 'Unknown command'); return { status: 200, body: r }; }
    if (path === 'status' && method === 'GET') return { status: 200, body: (await store.latestStatus()) ?? { at: null, snapshot: null } };
    throw fail(404, 'Not found');
  };
}

// grokbot-authored. Optional Relay Chat fields; strict validation, absent fields omitted.
function chatFields(b) {
  const o = {}, re = (v, r) => typeof v === 'string' && r.test(v);
  if (b.mode === 'bootstrap') {
    // The Host worker validates local actions and grants again; personalize remains
    // a recognized command shape but the scheduler is a disabled draft.
    if (b.consumer !== 'bootstrap' || b.kind !== 'command' ||
```

_First 80 of 112 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
