# File: studio/src/studio/relay-agent.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/studio/relay-agent.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 4591 B |
| Lines | 60 |
| Hash | 939b54e882af |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| createRelayAgent | function | 6 | yes | export function createRelayAgent({ store, root, url, hostSecret, fetchImpl = fetch, statusFn = async () =&gt; null, bootstrapFn = async () =&gt; null, log = () =&gt; {}, wakeUrl = null, wakeKey = null, manife… |
| stateFile | const | 9 | no | const stateFile = path.join(root, &#39;bridge&#39;, &#39;relay-state.json&#39;); |
| pushed | const | 10 | no | const pushed = existsSync(stateFile) ? JSON.parse(readFileSync(stateFile, &#39;utf8&#39;)).pushed ?? {} : {}; |
| save | function | 11 | no | const save = () =&gt; { mkdirSync(path.dirname(stateFile), { recursive: true, mode: 0o700 }); writeFileSync(stateFile, JSON.stringify({ pushed }), { mode: 0o600 }); }; |
| call | function | 12 | no | const call = async (p, body) =&gt; { |
| r | const | 13 | no | const r = await fetchImpl(`${url}/api/relay?path=${encodeURIComponent(p)}`, { method: body ? &#39;POST&#39; : &#39;GET&#39;, redirect: &#39;error&#39;, headers: { authorization: `Bearer ${hostSecret}`, ...(body ? { &#39;content… |
| woken | const | 18 | no | const woken = new Set(); |
| wake | function | 20 | no | const wake = async c =&gt; { |
| r | const | 24 | no | const r = await fetchImpl(wakeUrl, { method: &#39;POST&#39;, redirect: &#39;error&#39;, signal: AbortSignal.timeout(5000), headers: { &#39;content-type&#39;: &#39;application/json&#39;, ...(wakeKey ? { authorization: `Bearer ${wake… |
| cycle | variable | 31 | no | let cycle = 0; |
| syncOnce | function | 32 | no | async function syncOnce({ withStatus = cycle % 5 === 0 } = {}) { |
| out | const | 34 | no | const out = { pulled: 0, pushed: 0, status: false, woken: 0 }; |
| local | const | 35 | no | const local = new Map(store.list({ limit: 200 }).items.map(r =&gt; [r.id, r])); |
| snap | variable | 51 | no | let snap; try { snap = await statusFn(); } catch (e) { snap = { error: &#39;studio unreachable&#39; }; } |
| bootstrap | variable | 53 | no | let bootstrap; try { bootstrap = await bootstrapFn(); } catch { bootstrap = null; } |
| counts | const | 54 | no | const counts = {}; for (const r of local.values()) if (r.transport !== &#39;direct&#39;) counts[r.status] = (counts[r.status] ?? 0) + 1; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 3 | external |
| node:path | import | 4 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/bin/commands/relay.mjs](../../bin/commands/relay.mjs.md) | ../../src/studio/relay-agent.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// grokbot-authored. Outbound-only relay agent: the box polls the Vercel relay (no inbound ports).
// Pulls phone commands into the local bridge store, pushes claim/reply transitions and a status snapshot.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';

export function createRelayAgent({ store, root, url, hostSecret, fetchImpl = fetch, statusFn = async () => null, bootstrapFn = async () => null, log = () => {}, wakeUrl = null, wakeKey = null, manifestFn = async () => null }) {
  if (!/^https:\/\/[a-z0-9.-]+(:\d+)?$/i.test(url ?? '') && !/^http:\/\/127\.0\.0\.1:\d+$/.test(url ?? '')) throw new Error('relay url must be https://<host> (no path)');
  if (typeof hostSecret !== 'string' || hostSecret.length < 32) throw new Error('host secret missing or too short');
  const stateFile = path.join(root, 'bridge', 'relay-state.json');
  const pushed = existsSync(stateFile) ? JSON.parse(readFileSync(stateFile, 'utf8')).pushed ?? {} : {};
  const save = () => { mkdirSync(path.dirname(stateFile), { recursive: true, mode: 0o700 }); writeFileSync(stateFile, JSON.stringify({ pushed }), { mode: 0o600 }); };
  const call = async (p, body) => {
    const r = await fetchImpl(`${url}/api/relay?path=${encodeURIComponent(p)}`, { method: body ? 'POST' : 'GET', redirect: 'error',
      headers: { authorization: `Bearer ${hostSecret}`, ...(body ? { 'content-type': 'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined });
    if (!r.ok) throw new Error(`relay ${p}: HTTP ${r.status}`);
    return r.status === 204 ? null : r.json();
  };
  const woken = new Set();
  // Best-effort wake of the Grok Bot routine: metadata only (never command text), never the URL/key in logs.
  const wake = async c => {
    if (!wakeUrl || woken.has(c.id)) return false;
    woken.add(c.id);
    try {
      const r = await fetchImpl(wakeUrl, { method: 'POST', redirect: 'error', signal: AbortSignal.timeout(5000),
        headers: { 'content-type': 'application/json', ...(wakeKey ? { authorization: `Bearer ${wakeKey}` } : {}) },
        body: JSON.stringify({ event: 'phone-command', id: c.id, kind: c.kind, createdAt: c.createdAt }) });
      if (!r.ok) { log(`wake failed ${c.id}: HTTP ${r.status}`); return false; }
      log(`wake sent ${c.id}`); return true;
    } catch (e) { log(`wake failed ${c.id}: ${e?.name ?? 'Error'}`); return false; }
  };
  let cycle = 0;
  async function syncOnce({ withStatus = cycle % 5 === 0 } = {}) {
    cycle++;
    const out = { pulled: 0, pushed: 0, status: false, woken: 0 };
    const local = new Map(store.list({ limit: 200 }).items.map(r => [r.id, r]));
    for (const c of (await call('host/pending')).commands ?? []) {
      if (local.has(c.id)) continue;
      try { const r = store.create({ text: c.text, kind: c.kind, consumer: c.consumer, stage: c.stage, id: c.id, origin: 'relay',
          chat: Object.fromEntries(['mode', 'conversationId', 'newChat', 'target', 'attachments', 'action', 'preset'].filter(k => c[k] !== undefined).map(k => [k, c[k]])) }); local.set(r.id, r); out.pulled++; log(`pulled ${c.id}`);
        if (r.consumer === 'grokbot' && await wake({ id: r.id, kind: r.kind, createdAt: c.createdAt ?? r.createdAt })) out.woken++; }
      catch (e) { log(`skip ${c.id}: ${e.message}`); }
    }
    for (const r of local.values()) {
      if (r.origin !== 'relay' || r.transport === 'direct' || r.status === 'queued' || (pushed[r.id] ?? 0) >= r.rev) continue;
      await call('host/update', { id: r.id, status: r.status, result: r.result, by: r.claimedBy });
      pushed[r.id] = r.rev; out.pushed++; log(`pushed ${r.id} ${r.status}`);
    }
    if (out.pushed) save();
    // Publish immediately after a command state transition; don't wait for the 5-cycle cadence.
    if (withStatus || out.pushed > 0) {
      let snap; try { snap = await statusFn(); } catch (e) { snap = { error: 'studio unreachable' }; }
      // Bounded personalization projection from the local Host; null keeps old phone clients unchanged.
      let bootstrap; try { bootstrap = await bootstrapFn(); } catch { bootstrap = null; }
      const counts = {}; for (const r of local.values()) if (r.transport !== 'direct') counts[r.status] = (counts[r.status] ?? 0) + 1;
      await call('host/status', { agent: 'vivim-relay-agent/1', bridge: counts, personalAgent: snap, ...(bootstrap ? { bootstrap } : {}), manifest: await manifestFn().catch(() => null) }); out.status = true;
    }
    return out;
  }
  return { syncOnce };
}
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
