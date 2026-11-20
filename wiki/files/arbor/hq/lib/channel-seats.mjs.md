# File: hq/lib/channel-seats.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/lib/channel-seats.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 14194 B |
| Lines | 358 |
| Hash | bf9417eaa18f |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| SEATS_SCHEMA | const | 16 | yes | export const SEATS_SCHEMA = &#39;vivim.channel-seats/1&#39;; |
| WAKE_SCHEMA | const | 17 | yes | export const WAKE_SCHEMA = &#39;vivim.channel-wake/1&#39;; |
| DEFAULT_CHANNEL_ROOT | const | 18 | yes | export const DEFAULT_CHANNEL_ROOT = &#39;C:/VIVIM/channel&#39;; |
| DEFAULT_IDLE_MINUTES | const | 19 | yes | export const DEFAULT_IDLE_MINUTES = 5; |
| WAKE_MARKER | const | 22 | yes | export const WAKE_MARKER = &#39;MANAGER-WAKE&#39;; |
| SECRET_PATTERNS | const | 24 | no | const SECRET_PATTERNS = [ |
| seatsPath | function | 35 | yes | export function seatsPath(root = DEFAULT_CHANNEL_ROOT) { |
| dispatchDir | function | 39 | yes | export function dispatchDir(root = DEFAULT_CHANNEL_ROOT) { |
| loadSeats | function | 47 | yes | export function loadSeats(root = DEFAULT_CHANNEL_ROOT) { |
| file | const | 48 | no | const file = seatsPath(root); |
| doc | const | 50 | no | const doc = JSON.parse(readFileSync(file, &#39;utf8&#39;)); |
| roster | function | 61 | yes | export function roster(doc) { |
| seats | const | 62 | no | const seats = Array.isArray(doc.seats) ? doc.seats : []; |
| manager | const | 63 | no | const manager = doc.manager; |
| resolveSeat | function | 78 | yes | export function resolveSeat(doc, id) { |
| want | const | 79 | no | const want = String(id ?? &#39;&#39;).trim().toLowerCase(); |
| classifySeat | function | 91 | yes | export function classifySeat(seat, live, { idleMinutes = DEFAULT_IDLE_MINUTES } = {}) { |
| age | const | 94 | no | const age = Number(live.ageMinutes); |
| promptCarriesSecret | function | 106 | yes | export function promptCarriesSecret(text) { |
| wakeId | function | 110 | yes | export function wakeId(seatId, at = nowISO()) { |
| buildWakeText | function | 115 | yes | export function buildWakeText({ id, prompt }) { |
| buildWakeRecord | function | 124 | yes | export function buildWakeRecord({ seat, prompt, reason, at = nowISO(), root }) { |
| id | const | 125 | no | const id = wakeId(seat.id, at); |
| guardWake | function | 152 | yes | export function guardWake(record, { state, force = false, idleMinutes = DEFAULT_IDLE_MINUTES } = {}) { |
| prompt | const | 153 | no | const prompt = String(record?.prompt ?? &#39;&#39;).trim(); |
| deny | function | 168 | no | function deny(code, detail) { |
| journalIntent | function | 176 | yes | export function journalIntent(root, record) { |
| dir | const | 177 | no | const dir = dispatchDir(root); |
| file | const | 179 | no | const file = join(dir, `${record.id}.intent.json`); |
| journalResult | function | 184 | yes | export function journalResult(root, record, result) { |
| dir | const | 185 | no | const dir = dispatchDir(root); |
| file | const | 187 | no | const file = join(dir, `${record.id}.result.json`); |
| wakeSeat | function | 205 | yes | export function wakeSeat({ root = DEFAULT_CHANNEL_ROOT, seatId, prompt, reason = null, |
| doc | const | 220 | no | const doc = loadSeats(root); |
| seat | const | 221 | no | const seat = resolveSeat(doc, seatId); |
| live | const | 231 | no | const live = seat.session ? safeProbe(probe, seat.session) : null; |
| cls | const | 232 | no | const cls = classifySeat(seat, live, { idleMinutes }); |
| verdict | const | 233 | no | const verdict = guardWake(record, { state: cls.state, force, idleMinutes }); |
| intentPath | const | 243 | no | const intentPath = journalIntent(root, record); |
| answer | const | 244 | no | const answer = send(seat.session, record.text); |
| accepted | const | 245 | no | const accepted = answer?.accepted === true; |
| pending | const | 246 | no | const pending = answer?.pending === true; |
| resultPath | const | 247 | no | const resultPath = journalResult(root, record, { accepted, pending, transport: answer?.transport ?? &#39;unknown&#39;, reply: answer?.reply ?? null, |
| verifySeat | function | 279 | yes | export function verifySeat({ root = DEFAULT_CHANNEL_ROOT, seatId, id = null, confirm } = {}) { |
| doc | const | 281 | no | const doc = loadSeats(root); |
| seat | const | 282 | no | const seat = resolveSeat(doc, seatId); |
| wake | const | 285 | no | const wake = id \|\| latestIntent(root, seat.id); |
| proof | const | 287 | no | const proof = confirm(seat.session, wake); |
| latestIntent | function | 301 | yes | export function latestIntent(root, seatId) { |
| dir | const | 302 | no | const dir = dispatchDir(root); |
| files | const | 304 | no | const files = readdirSync(dir) |
| doc | const | 310 | no | const doc = JSON.parse(readFileSync(join(dir, f), &#39;utf8&#39;)); |
| safeProbe | function | 317 | no | function safeProbe(probe, sessionId) { |
| renderSeatTable | function | 325 | yes | export function renderSeatTable(doc, probe, { idleMinutes = DEFAULT_IDLE_MINUTES } = {}) { |
| rows | const | 326 | no | const rows = roster(doc).map((seat) =&gt; { const live = seat.session ? safeProbe(probe, seat.session) : null; const cls = classifySeat(seat, live, { idleMinutes }); return { seat: seat.id, site: seat.s… |
| live | const | 327 | no | const live = seat.session ? safeProbe(probe, seat.session) : null; |
| cls | const | 328 | no | const cls = classifySeat(seat, live, { idleMinutes }); |
| width | const | 331 | no | const width = Math.max(6, ...rows.map((r) =&gt; String(r.seat).length)); |
| lines | const | 332 | no | const lines = [&#39;SEAT&#39;.padEnd(width) + &#39; STATE AGE SITE&#39;]; |
| lateReplyFor | function | 347 | yes | export function lateReplyFor(root, wakeId, reader) { |
| file | const | 350 | no | const file = join(dispatchDir(root), `${wakeId}.result.json`); |
| doc | const | 352 | no | const doc = JSON.parse(readFileSync(file, &#39;utf8&#39;)); |
| replyFile | const | 353 | no | const replyFile = doc?.answer?.replyFile; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 12 | external |
| node:path | import | 13 | external |
| ./util.mjs | import | 14 | [hq/lib/util.mjs](./util.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [hq/aii/fixtures/HQ-032-running-executable-version.mjs](../aii/fixtures/HQ-032-running-executable-version.mjs.md) | ../../lib/channel-seats.mjs |
| [hq/bin/autonomy.mjs](../bin/autonomy.mjs.md) | ../lib/channel-seats.mjs |
| [hq/bin/hq.mjs](../bin/hq.mjs.md) | ../lib/channel-seats.mjs |
| [hq/bin/hq.mjs](../bin/hq.mjs.md) | ../lib/channel-seats.mjs |
| [hq/lib/channel-broker.mjs](./channel-broker.mjs.md) | ./channel-seats.mjs |
| [hq/lib/comms-roof.mjs](./comms-roof.mjs.md) | ./channel-seats.mjs |
| [hq/lib/mcp-team-tools.mjs](./mcp-team-tools.mjs.md) | ./channel-seats.mjs |
| [hq/lib/team-panel.mjs](./team-panel.mjs.md) | ./channel-seats.mjs |

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 3 | context | — | — | Channel seat transport — resolve a channel seat, classify it idle or active, and wake it through ACP with a journaled record |
| 4 | owner | channel-manager | — | channel-manager |
| 5 | task | — | — | channel-wake |
| 6 | invariant | — | — | a wake is a management act, never a provider send: nothing here writes C:/VIVIM/channel/receipts |
| 7 | invariant | — | — | an unknown seat is DENIED before a transport is spawned |
| 8 | invariant | — | — | the intent record is on disk before the effect, and is never rewritten |
| 9 | see | — | doc:docs/integration/STREAM-BOUNDARIES.md | doc:docs/integration/STREAM-BOUNDARIES.md |
| 10 | see | — | doc:docs/SYNC-BUS.md | doc:docs/SYNC-BUS.md |

## Excerpt

```javascript
// @ts-check
/**
 * @hq:context Channel seat transport — resolve a channel seat, classify it idle or active, and wake it through ACP with a journaled record
 * @hq:owner channel-manager
 * @hq:task channel-wake
 * @hq:invariant a wake is a management act, never a provider send: nothing here writes C:/VIVIM/channel/receipts
 * @hq:invariant an unknown seat is DENIED before a transport is spawned
 * @hq:invariant the intent record is on disk before the effect, and is never rewritten
 * @hq:see doc:docs/integration/STREAM-BOUNDARIES.md
 * @hq:see doc:docs/SYNC-BUS.md
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { nowISO, sha256 } from './util.mjs';

export const SEATS_SCHEMA = 'vivim.channel-seats/1';
export const WAKE_SCHEMA = 'vivim.channel-wake/1';
export const DEFAULT_CHANNEL_ROOT = 'C:/VIVIM/channel';
export const DEFAULT_IDLE_MINUTES = 5;

/** The token a woken seat must echo back, so a wake can be proven rather than assumed. */
export const WAKE_MARKER = 'MANAGER-WAKE';

const SECRET_PATTERNS = [
  /sk-[A-Za-z0-9_-]{16,}/,
  /ghp_[A-Za-z0-9]{20,}/,
  /github_pat_[A-Za-z0-9_]{20,}/,
  /xox[baprs]-[A-Za-z0-9-]{10,}/,
  /\bbearer\s+[A-Za-z0-9._-]{20,}/i,
  /\bapi[_-]?key\s*[:=]\s*\S{8,}/i,
  /\bpassword\s*[:=]\s*\S{4,}/i,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
];

export function seatsPath(root = DEFAULT_CHANNEL_ROOT) {
  return join(root, 'seats.json');
}

export function dispatchDir(root = DEFAULT_CHANNEL_ROOT) {
  return join(root, 'dispatch');
}

/**
 * Read the seat registry. Throws rather than returning an empty roster: a
 * manager with no seats reads exactly like a manager whose seats are all gone.
 */
export function loadSeats(root = DEFAULT_CHANNEL_ROOT) {
  const file = seatsPath(root);
  if (!existsSync(file)) throw new Error(`no seat registry at ${file}`);
  const doc = JSON.parse(readFileSync(file, 'utf8'));
  if (doc.schema !== SEATS_SCHEMA) throw new Error(`seat registry schema is ${doc.schema}, expected ${SEATS_SCHEMA}`);
  if (!Array.isArray(doc.seats) || !doc.seats.length) throw new Error(`seat registry at ${file} lists no seats`);
  return doc;
}

/**
 * Who can be woken. The manager is a wakeable target too — it runs its team —
 * so it joins the roster when the registry gives it a session. It is added here
 * rather than duplicated into `seats` so a seat's `site` stays a site.
 */
export function roster(doc) {
  const seats = Array.isArray(doc.seats) ? doc.seats : [];
  const manager = doc.manager;
  if (manager?.session && !seats.some((s) => s.id === manager.id)) {
    return [...seats, {
      id: manager.id,
      title: manager.title ?? manager.id,
      session: manager.session,
      site: null,
      role: 'manager',
      canonical: false,
      scopes: [],
    }];
  }
  return seats;
}

export function resolveSeat(doc, id) {
  const want = String(id ?? '').trim().toLowerCase();
  if (!want) return null;
```

_First 80 of 359 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
