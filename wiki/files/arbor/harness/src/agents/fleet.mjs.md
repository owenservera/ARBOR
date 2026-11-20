# File: harness/src/agents/fleet.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | harness/src/agents/fleet.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 10057 B |
| Lines | 168 |
| Hash | 7e082a8939e7 |
| Test | no |
| Generated | no |
| Component | harness |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| err | function | 13 | no | const err = (code, message) =&gt; Object.assign(new Error(message), { code }); |
| NAME | const | 14 | no | const NAME = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/; |
| PENDING | const | 16 | no | const PENDING = new Set([&#39;pending_approval&#39;, &#39;approved&#39;, &#39;sent&#39;, &#39;observed&#39;]); |
| httpsUrl | function | 18 | no | function httpsUrl(v) { try { return new URL(v).protocol === &#39;https:&#39;; } catch { return false; } } |
| parseFleetConfig | function | 20 | yes | export function parseFleetConfig(input) { |
| cfg | variable | 21 | no | let cfg = input; |
| name | const | 24 | no | const name = cfg.name ?? &#39;fleet&#39;; |
| seen | const | 27 | no | const seen = new Set(); |
| agents | const | 28 | no | const agents = cfg.agents.map((a, i) =&gt; { if (!a \|\| typeof a !== &#39;object&#39;) throw err(&#39;FLEET_INVALID&#39;, `Agent #${i + 1} must be an object.`); if (typeof a.name !== &#39;string&#39; \|\| !NAME.test(a.name)) thro… |
| role | const | 33 | no | const role = getRole(a.role); |
| model | const | 35 | no | const model = a.model ?? role.defaultModel; |
| threadUrl | const | 37 | no | const threadUrl = a.threadUrl ?? null; |
| planFleet | function | 45 | yes | export function planFleet(config) { |
| cfg | const | 46 | no | const cfg = parseFleetConfig(config); |
| r | const | 50 | no | const r = getRole(a.role); |
| createFleet | function | 57 | yes | export function createFleet({ config, router, journal = null, append = null, store = null, waitMs = 120000, now = () =&gt; new Date().toISOString() } = {}) { |
| cfg | const | 58 | no | const cfg = parseFleetConfig(config); |
| state | const | 61 | no | const state = new Map(cfg.agents.map((a) =&gt; [a.name, { ...a, inFlight: null, lastStatus: null, lastRequestId: null, sendsByTask: new Map(), inFlightAt: null, lastPrompt: null }])); |
| loaded | variable | 63 | no | let loaded = null; |
| load | function | 64 | no | const load = () =&gt; (loaded ??= (async () =&gt; { if (!store) return; let saved = {}; try { saved = JSON.parse(await readFile(store, &#39;utf8&#39;)); } catch (e) { if (e.code !== &#39;ENOENT&#39;) throw e; } for (const… |
| saved | variable | 66 | no | let saved = {}; |
| s | const | 71 | no | const s = state.get(name); |
| saving | variable | 80 | no | let saving = Promise.resolve(); |
| save | function | 81 | no | const save = () =&gt; (saving = saving.catch(() =&gt; {}).then(async () =&gt; { if (!store) return; const threads = Object.fromEntries([...state.values()].filter((s) =&gt; s.threadUrl).map((s) =&gt; [s.name, s.thre… |
| threads | const | 83 | no | const threads = Object.fromEntries([...state.values()].filter((s) =&gt; s.threadUrl).map((s) =&gt; [s.name, s.threadUrl])); |
| inFlight | const | 84 | no | const inFlight = Object.fromEntries([...state.values()].filter((s) =&gt; s.inFlight &amp;&amp; s.inFlight !== &#39;pending&#39;).map((s) =&gt; [s.name, { requestId: s.inFlight, prompt: s.lastPrompt, startedAt: s.inFlightA… |
| tmp | const | 85 | no | const tmp = `${store}.${randomUUID()}.tmp`; |
| view | function | 98 | no | const view = (s) =&gt; ({ name: s.name, role: s.role, model: s.model, threadUrl: s.threadUrl, busy: !!s.inFlight, requestId: s.inFlight &amp;&amp; s.inFlight !== &#39;pending&#39; ? s.inFlight : null, lastStatus: s.las… |
| agentOf | function | 100 | no | function agentOf(name) { const s = state.get(name); if (!s) throw err(&#39;FLEET_UNKNOWN_AGENT&#39;, `No agent named ${JSON.stringify(name)}.`); return s; } |
| remember | function | 101 | no | async function remember(s, r) { |
| refresh | function | 105 | no | async function refresh(s) { |
| id | const | 107 | no | const id = s.inFlight; |
| r | const | 108 | no | const r = await router.result(id); |
| role | const | 127 | no | const role = getRole(roleOrName); |
| ofRole | const | 129 | no | const ofRole = [...state.values()].filter((s) =&gt; s.role === role.id); |
| idle | const | 131 | no | const idle = ofRole.find((s) =&gt; !s.inFlight); |
| s | const | 135 | no | const s = agentOf(agent); |
| n | const | 143 | no | const n = s.sendsByTask.get(task) ?? 0, max = getRole(s.role).limits.maxSendsPerTask; |
| asked | const | 148 | no | const asked = await router.ask({ provider: s.model, threadUrl: s.threadUrl ?? &#39;new&#39;, prompt }); |
| r | const | 152 | no | const r = await router.wait(asked.requestId, waitMs); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs/promises | import | 8 | external |
| node:path | import | 9 | external |
| node:crypto | import | 10 | external |
| ./roles.mjs | import | 11 | [harness/src/agents/roles.mjs](./roles.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [harness/src/agents/cli.mjs](./cli.mjs.md) | ./fleet.mjs |
| [harness/test/agents/fleet.test.mjs](../../test/agents/fleet.test.mjs.md) | ../../src/agents/fleet.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// AGENT FLEET: a named, persistent set of configured agents { name, role, model, threadUrl }.
// Safety rules enforced here (approvals themselves are applied by router.ask):
//   - at most ONE in-flight send per agent (FLEET_BUSY otherwise), checked synchronously so it is race-free
//   - every send goes through router.ask, then router.wait; nothing is ever resent
//   - every send is recorded as { agent, requestId, at } via the injected append function
//   - optional per-task cap from the role's limits.maxSendsPerTask (FLEET_LIMIT)
//   - the thread URL a reply came back on is persisted per agent in the store file
import { readFile, writeFile, rename, mkdir, rm } from 'node:fs/promises';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
import { getRole, parseModelRef } from './roles.mjs';

const err = (code, message) => Object.assign(new Error(message), { code });
const NAME = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;
// router.wait keeps waiting on these; anything else is final for that request.
const PENDING = new Set(['pending_approval', 'approved', 'sent', 'observed']);

function httpsUrl(v) { try { return new URL(v).protocol === 'https:'; } catch { return false; } }

export function parseFleetConfig(input) {
  let cfg = input;
  if (typeof input === 'string') { try { cfg = JSON.parse(input); } catch (e) { throw err('FLEET_INVALID', 'Fleet config is not valid JSON: ' + e.message); } }
  if (!cfg || typeof cfg !== 'object' || Array.isArray(cfg)) throw err('FLEET_INVALID', 'Fleet config must be an object.');
  const name = cfg.name ?? 'fleet';
  if (typeof name !== 'string' || !NAME.test(name)) throw err('FLEET_INVALID', 'Fleet name must be 1-64 letters, digits, dot, dash or underscore.');
  if (!Array.isArray(cfg.agents) || !cfg.agents.length) throw err('FLEET_INVALID', 'Fleet needs a non-empty agents array.');
  const seen = new Set();
  const agents = cfg.agents.map((a, i) => {
    if (!a || typeof a !== 'object') throw err('FLEET_INVALID', `Agent #${i + 1} must be an object.`);
    if (typeof a.name !== 'string' || !NAME.test(a.name)) throw err('FLEET_INVALID', `Agent #${i + 1} needs a valid name.`);
    if (seen.has(a.name)) throw err('FLEET_INVALID', `Duplicate agent name: ${a.name}`);
    seen.add(a.name);
    const role = getRole(a.role);
    if (!role) throw err('FLEET_INVALID', `Agent ${a.name}: unknown role ${JSON.stringify(a.role)}.`);
    const model = a.model ?? role.defaultModel;
    try { parseModelRef(model); } catch (e) { throw err('FLEET_INVALID', `Agent ${a.name}: ${e.message}`); }
    const threadUrl = a.threadUrl ?? null;
    if (threadUrl !== null && !httpsUrl(threadUrl)) throw err('FLEET_INVALID', `Agent ${a.name}: threadUrl must be an https URL or null.`);
    return Object.freeze({ name: a.name, role: role.id, model: model.trim(), threadUrl });
  });
  return Object.freeze({ name, agents: Object.freeze(agents) });
}

// Dry run: what the fleet looks like and what each agent may do. Never sends.
export function planFleet(config) {
  const cfg = parseFleetConfig(config);
  return {
    fleet: cfg.name, dryRun: true, sends: 0,
    agents: cfg.agents.map((a) => {
      const r = getRole(a.role);
      return { name: a.name, role: a.role, stepRole: r.stepRole, provider: parseModelRef(a.model).provider, model: a.model,
        thread: a.threadUrl ?? 'new', allowedActions: [...r.allowedActions], limits: { ...r.limits } };
    }),
  };
}

export function createFleet({ config, router, journal = null, append = null, store = null, waitMs = 120000, now = () => new Date().toISOString() } = {}) {
  const cfg = parseFleetConfig(config);
  if (!router || typeof router.ask !== 'function' || typeof router.wait !== 'function') throw err('FLEET_INVALID', 'createFleet needs a router with ask() and wait().');
  const record = append ?? (typeof journal?.append === 'function' ? (e) => journal.append(e) : null);
  const state = new Map(cfg.agents.map((a) => [a.name, { ...a, inFlight: null, lastStatus: null, lastRequestId: null, sendsByTask: new Map(), inFlightAt: null, lastPrompt: null }]));

  let loaded = null;
  const load = () => (loaded ??= (async () => {
    if (!store) return;
    let saved = {};
    try { saved = JSON.parse(await readFile(store, 'utf8')); } catch (e) { if (e.code !== 'ENOENT') throw e; }
    for (const [name, url] of Object.entries(saved?.threads ?? {})) { const s = state.get(name); if (s && httpsUrl(url)) s.threadUrl = url; }
    // Restore in-flight sends so agents are busy after a restart; refresh() reconciles them.
    for (const [name, entry] of Object.entries(saved?.inFlight ?? {})) {
      const s = state.get(name);
      if (s && entry && entry.requestId) {
        s.inFlight = entry.requestId;
        s.lastRequestId = entry.requestId;
        s.inFlightAt = entry.startedAt ?? null;
        s.lastPrompt = entry.prompt ?? null;
      }
    }
  })());
  let saving = Promise.resolve();
```

_First 80 of 169 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
