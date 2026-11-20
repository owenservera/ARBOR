# File: apps/mobile-relay/ux/model.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/mobile-relay/ux/model.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 18620 B |
| Lines | 408 |
| Hash | 04b6a2b6f5ca |
| Test | no |
| Generated | no |
| Component | mobile-relay |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| TABS | const | 10 | yes | export const TABS = Object.freeze([&#39;today&#39;, &#39;talk&#39;, &#39;build&#39;, &#39;world&#39;, &#39;wiki&#39;, &#39;me&#39;, &#39;control&#39;]); |
| WORLD_EMPTY | const | 13 | yes | export const WORLD_EMPTY = &#39;Nothing here yet — build something in Build.&#39;; |
| NOT_AVAILABLE | const | 14 | yes | export const NOT_AVAILABLE = &#39;Not available yet — the Host did not send this to the phone.&#39;; |
| LIVE_STATE_LABELS | const | 17 | yes | export const LIVE_STATE_LABELS = Object.freeze({ created: &#39;Intent recorded&#39;, remote_queued: &#39;Queued on PC&#39;, claimed: &#39;Claimed by worker — not sent&#39;, send_authorized: &#39;Send authorized — not observed&#39;, |
| IN_FLIGHT | const | 31 | no | const IN_FLIGHT = new Set([&#39;created&#39;, &#39;remote_queued&#39;, &#39;claimed&#39;, &#39;send_authorized&#39;, &#39;waiting_reply&#39;]); |
| NEEDS_REVIEW | const | 33 | no | const NEEDS_REVIEW = new Set([&#39;uncertain&#39;, &#39;failed_after_send&#39;]); |
| plain | function | 35 | no | const plain = v =&gt; !!v &amp;&amp; typeof v === &#39;object&#39; &amp;&amp; !Array.isArray(v); |
| str | function | 36 | no | const str = v =&gt; (typeof v === &#39;string&#39; ? v.trim() : &#39;&#39;); |
| clip | function | 37 | no | const clip = (v, n) =&gt; { |
| s | const | 38 | no | const s = String(v ?? &#39;&#39;).replace(/\\s+/g, &#39; &#39;).trim(); |
| when | function | 41 | no | const when = v =&gt; Date.parse(str(v)) \|\| 0; |
| pick | function | 42 | no | const pick = (o, k) =&gt; (plain(o) &amp;&amp; plain(o[k]) ? o[k] : null); |
| list | function | 43 | no | const list = v =&gt; (Array.isArray(v) ? v : []); |
| snapshotOf | function | 45 | yes | export function snapshotOf(status) { |
| surfaceItems | function | 55 | no | function surfaceItems(revision, sources = []) { |
| tree | const | 56 | no | const tree = plain(revision?.surface?.tree) ? revision.surface.tree |
| out | const | 58 | no | const out = []; |
| walk | function | 60 | no | const walk = (node, depth) =&gt; { |
| props | const | 63 | no | const props = plain(node.props) ? node.props : {}; |
| children | const | 64 | no | const children = list(node.children); |
| title | const | 76 | no | const title = clip(str(src.title), 90); |
| detail | const | 77 | no | const detail = clip(str(src.detail), 160); |
| item | const | 79 | no | const item = { title, detail }; |
| itemTitle | function | 85 | no | function itemTitle(type, props) { |
| itemDetail | function | 90 | no | function itemDetail(type, props) { |
| liveRunning | function | 102 | no | function liveRunning(live) { |
| out | const | 103 | no | const out = []; |
| messages | const | 106 | no | const messages = list(conversation.messages); |
| last | const | 107 | no | const last = messages[messages.length - 1]; |
| state | const | 109 | no | const state = str(last.state); |
| liveReview | function | 124 | no | function liveReview(live) { |
| out | const | 125 | no | const out = []; |
| state | const | 130 | no | const state = str(message.state); |
| bridgeCounts | function | 145 | no | function bridgeCounts(bridge) { |
| count | function | 147 | no | const count = v =&gt; (Number.isFinite(v) ? v : null); |
| queued | const | 148 | no | const queued = count(bridge.queued), claimed = count(bridge.claimed); |
| done | const | 149 | no | const done = count(bridge.done), failed = count(bridge.failed); |
| commandLabel | function | 154 | yes | export function commandLabel(c) { |
| mode | const | 155 | no | const mode = str(c.mode), consumer = str(c.consumer), kind = str(c.kind); |
| target | const | 156 | no | const target = plain(c.target) ? c.target : null; |
| provider | const | 158 | no | const provider = target ? str(target.provider) : &#39;&#39;; |
| action | const | 162 | no | const action = str(c.action); |
| receipts | function | 171 | no | function receipts(commands) { |
| rows | const | 172 | no | const rows = []; |
| at | const | 175 | no | const at = str(c.updatedAt) \|\| str(c.createdAt); |
| worldModel | function | 194 | yes | export function worldModel(status, commands, ctx = {}) { |
| snap | const | 195 | no | const snap = snapshotOf(status); |
| bootstrap | const | 196 | no | const bootstrap = pick(snap, &#39;bootstrap&#39;); |
| live | const | 197 | no | const live = pick(snap, &#39;live&#39;); |
| bridge | const | 198 | no | const bridge = pick(snap, &#39;bridge&#39;); |
| modelSources | const | 199 | no | const modelSources = [&#39;snapshot.bootstrap.uiRevision&#39;, &#39;snapshot.live.conversations&#39;, &#39;snapshot.bridge&#39;, &#39;commands&#39;]; |
| gaps | const | 200 | no | const gaps = []; |
| extraSources | const | 201 | no | const extraSources = plain(ctx) &amp;&amp; Array.isArray(ctx.builtSources) ? ctx.builtSources : []; |
| revision | const | 203 | no | const revision = plain(bootstrap?.uiRevision) ? bootstrap.uiRevision : null; |
| built | const | 204 | no | const built = surfaceItems(revision, extraSources); |
| running | const | 205 | no | const running = live ? liveRunning(live) : []; |
| queue | const | 206 | no | const queue = bridgeCounts(bridge); |
| commandRows | const | 210 | no | const commandRows = receipts(commands); |
| inQueue | const | 211 | no | const inQueue = commandRows.filter(r =&gt; r.status === &#39;queued&#39; \|\| r.status === &#39;claimed&#39;); |
| revisionMeta | const | 213 | no | const revisionMeta = revision ? { |
| emptyMessage | const | 221 | no | const emptyMessage = revision |
| meModel | function | 246 | yes | export function meModel(status, commands, ctx = {}) { |
| snap | const | 247 | no | const snap = snapshotOf(status); |
| personal | const | 248 | no | const personal = pick(snap, &#39;personalAgent&#39;); |
| bootstrap | const | 249 | no | const bootstrap = pick(snap, &#39;bootstrap&#39;); |
| manifest | const | 250 | no | const manifest = pick(snap, &#39;manifest&#39;); |
| gaps | const | 251 | no | const gaps = []; |
| identity | const | 253 | no | const identity = []; |
| devices | const | 264 | no | const devices = []; |
| permissions | const | 273 | no | const permissions = []; |
| scopes | const | 274 | no | const scopes = Array.isArray(ctx.scopes) ? ctx.scopes.filter(s =&gt; typeof s === &#39;string&#39;) : null; |
| providers | const | 277 | no | const providers = list(manifest?.providers); |
| signedIn | const | 279 | no | const signedIn = providers.filter(p =&gt; plain(p) &amp;&amp; p.signedIn === true).map(p =&gt; str(p.id) \|\| str(p.label)).filter(Boolean); |
| rows | const | 286 | no | const rows = receipts(commands); |
| live | const | 287 | no | const live = pick(snapshotOf(status), &#39;live&#39;); |
| activity | const | 288 | no | const activity = { |
| todayModel | function | 310 | yes | export function todayModel(status, commands, ctx = {}) { |
| snap | const | 311 | no | const snap = snapshotOf(status); |
| live | const | 312 | no | const live = pick(snap, &#39;live&#39;); |
| world | const | 313 | no | const world = worldModel(status, commands); |
| gaps | const | 314 | no | const gaps = []; |
| connection | const | 316 | no | const connection = { |
| attention | const | 323 | no | const attention = []; |
| reviewItems | const | 324 | no | const reviewItems = liveReview(live); |
| commandRows | const | 343 | no | const commandRows = receipts(commands); |
| actionableCommands | const | 347 | no | const actionableCommands = commandRows.filter(r =&gt; r.status === &#39;queued&#39; \|\| r.status === &#39;claimed&#39; \|\| r.status === &#39;failed&#39;); |
| running | const | 363 | no | const running = []; |
| mission | const | 371 | no | const mission = selectTodayMission({ commands: actionableCommands, live: world.running, reviews: str(live?.state) === &#39;needs-review&#39; ? [...reviewItems, { id: &#39;timeline&#39;, state: &#39;needs-review&#39; }] : re… |
| next | const | 374 | no | const next = nextAction({ attention, running, world, snap, commandRows: actionableCommands }); |
| nextAction | function | 392 | no | function nextAction({ attention, running, world, snap, commandRows }) { |
| first | const | 393 | no | const first = attention.find(a =&gt; a.action &amp;&amp; a.action.tab); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./mission-experience.mjs | import | 2 | [apps/mobile-relay/ux/mission-experience.mjs](./mission-experience.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [apps/mobile-relay/app.js](../app.js.md) | ./ux/model.mjs |
| [apps/mobile-relay/test/mission-experience.test.mjs](../test/mission-experience.test.mjs.md) | ../ux/model.mjs |
| [apps/mobile-relay/test/mobile-orphan-exposure.test.mjs](../test/mobile-orphan-exposure.test.mjs.md) | ../ux/model.mjs |
| [apps/mobile-relay/test/ux-surfaces.test.mjs](../test/ux-surfaces.test.mjs.md) | ../ux/model.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Phone surfaces: Today, World and Me (DEC-MOBILE-001 — one VIVIM phone, one authoritative path).
import { selectTodayMission } from './mission-experience.mjs';
// Pure derivations over what the Host actually returned — the /status snapshot and the command
// list — plus facts this phone already knows about itself. No DOM, no network, no timers.
//
// House rule for this file: a row exists only when a Host field (or a fact the phone really
// knows) produced it. When the Host returned nothing, the surface says so plainly instead of
// inventing a row. Nothing here sends, approves or claims that an effect happened.

export const TABS = Object.freeze(['today', 'talk', 'build', 'world', 'wiki', 'me', 'control']);

// The honest empty states. They name the missing thing instead of filling the screen.
export const WORLD_EMPTY = 'Nothing here yet — build something in Build.';
export const NOT_AVAILABLE = 'Not available yet — the Host did not send this to the phone.';

// The canonical phone labels for a live message state. Same wording the Talk thread uses.
export const LIVE_STATE_LABELS = Object.freeze({
  created: 'Intent recorded',
  remote_queued: 'Queued on PC',
  claimed: 'Claimed by worker — not sent',
  send_authorized: 'Send authorized — not observed',
  waiting_reply: 'Send observed — awaiting reply',
  reply_observed: 'Reply observed — delivery unconfirmed',
  delivered: 'Delivery acknowledged',
  uncertain: 'Send uncertain — inspect original receipt',
  failed_before_send: 'Failed before send',
  failed_after_send: 'Possible send — review required'
});

// A send that is genuinely still in flight.
const IN_FLIGHT = new Set(['created', 'remote_queued', 'claimed', 'send_authorized', 'waiting_reply']);
// A send whose outcome the Host cannot confirm. Never retried, never claimed as sent.
const NEEDS_REVIEW = new Set(['uncertain', 'failed_after_send']);

const plain = v => !!v && typeof v === 'object' && !Array.isArray(v);
const str = v => (typeof v === 'string' ? v.trim() : '');
const clip = (v, n) => {
  const s = String(v ?? '').replace(/\s+/g, ' ').trim();
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
};
const when = v => Date.parse(str(v)) || 0;
const pick = (o, k) => (plain(o) && plain(o[k]) ? o[k] : null);
const list = v => (Array.isArray(v) ? v : []);

export function snapshotOf(status) {
  if (!plain(status)) return null;
  return plain(status.snapshot) ? status.snapshot : null;
}

/* ---------------- shared readings ---------------- */

// The Host-committed vivim.ui-surface/1 component tree, flattened into "things that exist".
// `sources` are durable journal entries and approved Wiki revisions, flattened into built items
// with title/detail alongside the Host-committed surface tree items.
function surfaceItems(revision, sources = []) {
  const tree = plain(revision?.surface?.tree) ? revision.surface.tree
    : plain(revision?.tree) ? revision.tree : null;
  const out = [];
  if (tree) {
    const walk = (node, depth) => {
      if (!plain(node) || depth > 7 || out.length >= 64) return;
      const type = str(node.type);
      const props = plain(node.props) ? node.props : {};
      const children = list(node.children);
      if (type === 'stack' || type === 'grid') {
        for (const child of children) walk(child, depth + 1);
        return;
      }
      out.push({ id: str(node.id), kind: type, title: itemTitle(type, props), detail: itemDetail(type, props) });
      // A card owns its children; do not list them twice.
    };
    walk(tree, 0);
  }
  for (const src of sources) {
    if (!plain(src)) continue;
    const title = clip(str(src.title), 90);
    const detail = clip(str(src.detail), 160);
    if (!title) continue;
    const item = { title, detail };
    if (src.jumpTarget) item.jumpTarget = src.jumpTarget;
```

_First 80 of 409 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
