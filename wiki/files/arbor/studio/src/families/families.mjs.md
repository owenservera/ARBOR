# File: studio/src/families/families.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/families/families.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 40305 B |
| Lines | 654 |
| Hash | 6348369e4fd8 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| FamilyStore | class | 17 | yes | export class FamilyStore extends VersionedStore { |
| constructor | method | 18 | yes | constructor(dir) { super(dir, { builtinDir: path.join(TOOL_ROOT, &#39;families&#39;), kind: &#39;family&#39;, normalize: (f) =&gt; ({ members: [], detect: [], entities: {}, ...f }) }); } |
| addMember | method | 20 | yes | addMember(name, profileName) { |
| f | const | 21 | no | const f = this.load(name); |
| register | method | 27 | yes | register(name, { description = &#39;&#39;, entities = {}, fromProfile, detect = [] } = {}) { |
| ROLEISH | const | 36 | no | const ROLEISH = /(^\|\\.)(role\|sender\|from\|speaker\|author)$/i; |
| STREAMING_SET | const | 37 | no | const STREAMING_SET = new Set(STREAMING_TRANSPORTS); |
| MAX_SAMPLES | const | 38 | no | const MAX_SAMPLES = 400; |
| MAX_COLLECTION_ITEMS | const | 39 | no | const MAX_COLLECTION_ITEMS = 200; |
| DISCRIMINATOR_KEYS | const | 40 | no | const DISCRIMINATOR_KEYS = [&#39;type&#39;, &#39;event&#39;, &#39;kind&#39;, &#39;op&#39;, &#39;action&#39;, &#39;name&#39;, &#39;object&#39;, &#39;method&#39;, &#39;topic&#39;]; |
| leafWalk | function | 42 | no | function leafWalk(v, p, out, depth = 0) { |
| keys | const | 47 | no | const keys = Object.keys(v); |
| collectArrays | function | 53 | no | function collectArrays(v, p, out, depth = 0) { |
| objs | const | 56 | no | const objs = v.filter((x) =&gt; x &amp;&amp; typeof x === &#39;object&#39; &amp;&amp; !Array.isArray(x)); |
| g | const | 58 | no | const g = out.get(p) ?? { path: p, observations: 0, items: 0, samples: [], fields: new Map() }; |
| discriminatorsOf | function | 72 | no | function discriminatorsOf(json) { |
| out | const | 73 | no | const out = []; |
| gatherEvidence | function | 79 | yes | export function gatherEvidence(reducer, { domInspect = null, domTurns = null, phases = null } = {}) { |
| tp | variable | 81 | no | let tp = phases ? performance.now() : 0; |
| mark | const | 82 | no | const mark = phases ? (k) =&gt; { const n = performance.now(); phases[k] = (phases[k] ?? 0) + (n - tp); tp = n; } : null; |
| summary | const | 83 | no | const summary = reducer.summary(); |
| leaves | const | 85 | no | const leaves = {}; |
| assembled | const | 86 | no | const assembled = []; |
| samples | const | 87 | no | const samples = []; |
| arrays | const | 88 | no | const arrays = new Map(); |
| eventTypeCounts | const | 89 | no | const eventTypeCounts = new Map(); |
| appProtocols | const | 90 | no | const appProtocols = new Set(); |
| transports | const | 91 | no | const transports = new Set(); |
| transportDetails | const | 92 | no | const transportDetails = new Set(); |
| deltaDialects | const | 93 | no | const deltaDialects = new Set(); |
| channels | const | 94 | no | const channels = new Set(); |
| frameTypes | const | 95 | no | const frameTypes = new Set(); |
| methods | const | 96 | no | const methods = new Set(); |
| statuses | const | 97 | no | const statuses = new Set(); |
| mimes | const | 98 | no | const mimes = new Set(); |
| paths | const | 99 | no | const paths = []; |
| queryKeys | const | 100 | no | const queryKeys = new Set(); |
| requestJsonKeys | const | 101 | no | const requestJsonKeys = new Set(); |
| heartbeats | variable | 102 | no | let heartbeats = 0, graphql = null, rpc = null, eventBytes = 0, eventCount = 0; |
| j | const | 106 | no | const j = e.jsonNested?.json !== undefined ? e.jsonNested.json : e.json; |
| texts | const | 125 | no | const texts = s._delta.texts(1); |
| u | const | 143 | no | const u = new URL(s.url); |
| roleValues | const | 150 | no | const roleValues = new Set(); |
| fieldNames | const | 153 | no | const fieldNames = new Set(Object.keys(leaves).map((p) =&gt; p.split(&#39;.&#39;).pop().replace(/\\[\\*\\]$/, &#39;&#39;))); |
| numericChanging | const | 155 | no | const numericChanging = Object.entries(leaves).filter(([, vals]) =&gt; vals.length &gt;= 3 &amp;&amp; vals.every((v) =&gt; typeof v === &#39;number&#39;) &amp;&amp; new Set(vals).size &gt; 1).map(([p]) =&gt; p); |
| enumsByField | const | 157 | no | const enumsByField = new Map(); |
| strs | const | 159 | no | const strs = vals.filter((v) =&gt; typeof v === &#39;string&#39; &amp;&amp; v.length &lt;= 32); |
| distinct | const | 161 | no | const distinct = new Set(strs.map((s) =&gt; s.toLowerCase())); |
| name | const | 163 | no | const name = p.split(&#39;.&#39;).pop().replace(/\\[\\*\\]$/, &#39;&#39;).toLowerCase(); |
| set | const | 164 | no | const set = enumsByField.get(name) ?? new Set(); |
| collections | const | 170 | no | const collections = [...arrays.values()].map((g) =&gt; ({ path: g.path, observations: g.observations, items: g.items, avgItems: +(g.items / Math.max(1, g.observations)).toFixed(1), fields: [...g.fields.… |
| textLength | const | 176 | no | const textLength = domInspect?.textLength ?? 0; |
| longestAssembled | const | 177 | no | const longestAssembled = assembled.reduce((a, x) =&gt; Math.max(a, x.longest), 0); |
| hasStreaming | const | 178 | no | const hasStreaming = summary.streams.some((s) =&gt; STREAMING_SET.has(s.transport)); |
| lower | function | 197 | no | const lower = (x) =&gt; String(x ?? &#39;&#39;).toLowerCase(); |
| anyFieldName | function | 198 | no | const anyFieldName = (ev, names) =&gt; { |
| have | const | 199 | no | const have = [...ev.fieldNames].map(lower); |
| want | const | 201 | no | const want = lower(n); |
| hit | const | 202 | no | const hit = have.find((h) =&gt; h === want \|\| h.endsWith(&#39;_&#39; + want) \|\| h.startsWith(want + &#39;_&#39;) \|\| h === want.replace(/_/g, &#39;&#39;)); |
| allFieldGroups | function | 207 | no | const allFieldGroups = (ev, groups) =&gt; { |
| have | const | 208 | no | const have = [...ev.fieldNames].map(lower); |
| found | const | 209 | no | const found = []; |
| hit | const | 211 | no | const hit = alts.split(&#39;\|&#39;).map(lower).find((a) =&gt; have.some((n) =&gt; n === a \|\| n.endsWith(&#39;_&#39; + a) \|\| n.startsWith(a + &#39;_&#39;))); |
| matchesAny | function | 217 | no | const matchesAny = (set, wanted) =&gt; { for (const w of wanted ?? []) if (set?.has(w)) return w; return null; }; |
| SIGNALS | const | 219 | no | const SIGNALS = { |
| st | const | 226 | no | const st = ev.streams.find((x) =&gt; x.startedT &gt;= a.t &amp;&amp; x.startedT &lt;= a.t + 3000 &amp;&amp; STREAMING_SET.has(x.transport)); |
| min | const | 235 | no | const min = s.minItems ?? 3; |
| best | const | 236 | no | const best = (ev.collections ?? []).find((c) =&gt; c.fields.length &gt;= 2 &amp;&amp; c.items &gt;= min); |
| dom | const | 237 | no | const dom = (ev.domInspect?.proposals ?? []).find((x) =&gt; x.kind === &#39;collection&#39; &amp;&amp; x.count &gt;= min); |
| arr | const | 241 | no | const arr = Object.keys(ev.leaves).filter((p) =&gt; /\\[\\*\\]\\.[^.[\\]]+$/.test(p)); |
| by | const | 246 | no | const by = new Map(); |
| hit | const | 250 | no | const hit = [...by].find(([, set]) =&gt; set.size &gt;= 2); |
| sc | const | 254 | no | const sc = ev.actions.filter((a) =&gt; a.kind === &#39;scroll&#39;); |
| hit | const | 255 | no | const hit = sc.find((a) =&gt; ev.streams.some((x) =&gt; x.startedT &gt;= a.t - 300 &amp;&amp; x.startedT &lt;= a.t + 2500 &amp;&amp; x.policy === &#39;body&#39;)); |
| want | const | 267 | no | const want = s.any ?? s.transports ?? (s.name ? [s.name] : []); |
| hit | const | 268 | no | const hit = matchesAny(ev.transports, want) ?? matchesAny(ev.transportDetails, want); |
| re | variable | 278 | no | let re; try { re = new RegExp(pat, &#39;i&#39;); } catch { continue; } |
| hit | const | 279 | no | const hit = (ev.paths ?? []).find((p) =&gt; re.test(p)); |
| names | const | 303 | no | const names = (s.names ?? []).map(lower); |
| lt | const | 305 | no | const lt = lower(t); |
| set | const | 312 | no | const set = ev.enumsByField?.get(lower(s.field)); |
| hits | const | 314 | no | const hits = (s.values ?? []).map(lower).filter((v) =&gt; set.has(v)); |
| n | const | 319 | no | const n = anyFieldName(ev, [&#39;cursor&#39;, &#39;next_cursor&#39;, &#39;end_cursor&#39;, &#39;page_info&#39;, &#39;has_more&#39;, &#39;next_page_token&#39;, &#39;continuation&#39;]); |
| q | const | 321 | no | const q = [&#39;cursor&#39;, &#39;after&#39;, &#39;before&#39;, &#39;page_token&#39;, &#39;continuation&#39;].find((x) =&gt; ev.queryKeys.has(x)); |
| t | const | 326 | no | const t = anyFieldName(ev, [&#39;timestamp&#39;, &#39;ts&#39;, &#39;time&#39;, &#39;at&#39;, &#39;updated_at&#39;, &#39;date&#39;, &#39;epoch&#39;]); |
| c | const | 330 | no | const c = (ev.collections ?? []).find((x) =&gt; { const f = x.fields.map(lower); return f.includes(&#39;type&#39;) &amp;&amp; (f.includes(&#39;text&#39;) \|\| f.includes(&#39;content&#39;) \|\| f.includes(&#39;value&#39;)) &amp;&amp; x.items &gt;= (s.minIte… |
| f | const | 331 | no | const f = x.fields.map(lower); |
| blocky | const | 335 | no | const blocky = ev.assembled.find((a) =&gt; (a.blocks ?? 0) &gt;= (s.minItems ?? 2)); |
| n | const | 339 | no | const n = anyFieldName(ev, [&#39;tool_use&#39;, &#39;tool_call&#39;, &#39;tool_calls&#39;, &#39;function_call&#39;, &#39;tool_result&#39;, &#39;tool_name&#39;]); |
| t | const | 341 | no | const t = [...(ev.eventTypeCounts?.keys() ?? [])].find((x) =&gt; /tool\|function_call/i.test(x)); |
| g | const | 345 | no | const g = allFieldGroups(ev, [&#39;citation\|citations\|source\|sources\|reference\|references&#39;, &#39;url\|uri\|href\|link&#39;]); |
| q | const | 349 | no | const q = [&#39;q&#39;, &#39;query&#39;, &#39;search&#39;, &#39;term&#39;, &#39;keyword&#39;, &#39;kw&#39;].find((x) =&gt; ev.queryKeys.has(x)) ?? anyFieldName(ev, [&#39;query&#39;, &#39;search_query&#39;, &#39;searchterm&#39;, &#39;term&#39;, &#39;keywords&#39;]); |
| results | const | 351 | no | const results = (ev.collections ?? []).find((c) =&gt; c.items &gt;= (s.minResults ?? 3)); |
| n | const | 355 | no | const n = anyFieldName(ev, [&#39;duration&#39;, &#39;duration_ms&#39;, &#39;bitrate&#39;, &#39;codec&#39;, &#39;resolution&#39;, &#39;playback_url&#39;, &#39;hls&#39;, &#39;dash&#39;, &#39;manifest&#39;, &#39;poster&#39;, &#39;thumbnail_url&#39;]); |
| m | const | 357 | no | const m = [...ev.mimes].find((x) =&gt; /^(video\|audio)\\//.test(x) \|\| /mpegurl\|dash\\+xml\|mp2t\|mp4/i.test(x)); |
| n | const | 361 | no | const n = anyFieldName(ev, [&#39;unread&#39;, &#39;unread_count&#39;, &#39;read_at&#39;, &#39;seen&#39;, &#39;seen_at&#39;, &#39;notification&#39;, &#39;notification_id&#39;, &#39;badge&#39;]); |
| n | const | 365 | no | const n = anyFieldName(ev, [&#39;presence&#39;, &#39;online&#39;, &#39;is_online&#39;, &#39;typing&#39;, &#39;is_typing&#39;, &#39;cursor&#39;, &#39;selection&#39;, &#39;awareness&#39;, &#39;last_seen&#39;, &#39;participants&#39;]); |
| t | const | 367 | no | const t = [...(ev.eventTypeCounts?.keys() ?? [])].find((x) =&gt; /presence\|typing\|cursor\|awareness\|join\|leave/i.test(x)); |
| ws | const | 371 | no | const ws = ev.streams.filter((x) =&gt; x.kind === &#39;ws&#39;); |
| hit | const | 372 | no | const hit = ws.find((x) =&gt; (x.frames ?? 0) &gt;= (s.minFrames ?? 4)); |
| dirs | const | 374 | no | const dirs = new Set(); |
| by | const | 379 | no | const by = new Map(); |
| k | const | 382 | no | const k = `${st.method ?? &#39;GET&#39;} ${templateUrl(st.url)}`; |
| hit | const | 385 | no | const hit = [...by].find(([, n]) =&gt; n &gt;= (s.minRequests ?? 2)); |
| parents | const | 389 | no | const parents = [&#39;parent_id&#39;, &#39;conversation_id&#39;, &#39;thread_id&#39;, &#39;channel_id&#39;, &#39;board_id&#39;, &#39;project_id&#39;, &#39;owner_id&#39;, &#39;item_id&#39;, &#39;post_id&#39;]; |
| hit | const | 390 | no | const hit = parents.filter((p) =&gt; anyFieldName(ev, [p])); |
| len | const | 395 | no | const len = Math.max(ev.textLength ?? 0, ev.longestAssembled ?? 0); |
| signalNames | function | 400 | yes | export function signalNames() { return Object.keys(SIGNALS).sort(); } |
| detectFamilies | function | 402 | yes | export function detectFamilies(families, evidence) { |
| out | const | 403 | no | const out = []; |
| rawOf | const | 404 | no | const rawOf = new WeakMap(); |
| hits | const | 406 | no | const hits = []; |
| missing | const | 407 | no | const missing = []; |
| score | variable | 408 | no | let score = 0; |
| maxPositive | variable | 409 | no | let maxPositive = 0; |
| weight | const | 413 | no | const weight = s.weight ?? 0; |
| why | variable | 415 | no | let why = null; |
| fired | const | 417 | no | const fired = s.not ? !why : !!why; |
| hitNames | const | 421 | no | const hitNames = new Set(hits.map((h) =&gt; h.signal)); |
| unmet | const | 424 | no | const unmet = (f.requires ?? []).filter((r) =&gt; !hitNames.has(r)); |
| anyList | const | 425 | no | const anyList = f.requiresAny ?? []; |
| anyUnmet | const | 426 | no | const anyUnmet = anyList.length &amp;&amp; !anyList.some((r) =&gt; hitNames.has(r)); |
| raw | const | 427 | no | const raw = Math.max(0, score); |
| max | const | 429 | no | const max = maxPositive \|\| 1; |
| rec | const | 430 | no | const rec = { family: f.name, score: +final.toFixed(2), coverage: +(raw / max).toFixed(2), evidence: hits }; |
| UUIDISH | const | 447 | no | const UUIDISH = /^[0-9a-f]{8}-[0-9a-f]{4}-\|^[A-Za-z0-9_-]{10,}$/i; |
| typeScore | function | 448 | no | const typeScore = (spec, vals) =&gt; { |
| v | const | 449 | no | const v = vals.filter((x) =&gt; x !== null &amp;&amp; x !== undefined); |
| strs | const | 451 | no | const strs = v.filter((x) =&gt; typeof x === &#39;string&#39;); |
| nameScore | function | 464 | no | const nameScore = (spec, p, fieldName) =&gt; { |
| clean | const | 465 | no | const clean = p.replace(/^\\$\\.?/, &#39;&#39;).replace(/\\[\\*\\]/g, &#39;&#39;); |
| last | const | 466 | no | const last = clean.split(&#39;.&#39;).pop(); |
| names | const | 467 | no | const names = spec.names ?? [fieldName]; |
| best | variable | 468 | no | let best = 0; |
| proposeMapping | function | 478 | yes | export function proposeMapping(entitySpec, samples) { |
| leaves | const | 479 | no | const leaves = {}; |
| fields | const | 481 | no | const fields = {}; |
| cands | const | 484 | no | const cands = []; |
| ns | const | 486 | no | const ns = nameScore(spec, p, name); |
| ts | const | 488 | no | const ts = typeScore(spec, vals); |
| score | variable | 490 | no | let score = ns * 0.6 + ts * 0.4; |
| required | const | 498 | no | const required = Object.entries(entitySpec.fields ?? {}).filter(([, s]) =&gt; s.required).map(([n]) =&gt; n); |
| confidence | const | 499 | no | const confidence = required.length ? required.reduce((a, n) =&gt; a + (fields[n]?.score ?? 0), 0) / required.length : Object.values(fields).reduce((a, f) =&gt; a + f.score, 0) / Math.max(1, Object.keys(fie… |
| missing | const | 500 | no | const missing = required.filter((n) =&gt; !fields[n]); |
| applyMapping | function | 505 | yes | export function applyMapping(mapping, obj) { |
| rec | const | 506 | no | const rec = {}; |
| vals | variable | 509 | no | let vals = select(obj, m.path); |
| v | variable | 511 | no | let v = vals.length &lt;= 1 ? vals[0] : (m.join !== undefined &amp;&amp; vals.every((x) =&gt; typeof x === &#39;string&#39;) ? vals.join(m.join) : vals); |
| proposeFamilyLink | function | 523 | yes | export function proposeFamilyLink(family, evidence) { |
| proposals | const | 524 | no | const proposals = []; |
| spec | const | 529 | no | const spec = family.entities?.message; |
| byEndpoint | const | 531 | no | const byEndpoint = new Map(); |
| m | const | 534 | no | const m = proposeMapping(spec, docs); |
| candidates | const | 545 | no | const candidates = []; |
| m | const | 548 | no | const m = proposeMapping(spec, c.samples); |
| m | const | 558 | no | const m = proposeMapping(spec, evidence.samples); |
| byEndpoint | const | 565 | no | const byEndpoint = new Map(); |
| m | const | 568 | no | const m = proposeMapping(spec, docs); |
| endpointPattern | function | 579 | yes | export function endpointPattern(endpoint) { |
| p | const | 580 | no | const p = endpoint.replace(/^[A-Z]+ /, &#39;&#39;); |
| _endpointRe | const | 586 | no | const _endpointRe = new WeakMap(); |
| familyRecordsFromEvent | function | 587 | yes | export function familyRecordsFromEvent(profile, ev, stream, session) { |
| out | const | 588 | no | const out = []; |
| json | const | 590 | no | const json = ev.jsonNested?.json !== undefined ? ev.jsonNested.json : ev.json; |
| re | variable | 595 | no | let re = _endpointRe.get(fm); |
| matchesEventType | function | 607 | no | function matchesEventType(wanted, ev, json) { |
| want | const | 608 | no | const want = String(wanted).toLowerCase(); |
| extractFamilyRecords | function | 618 | yes | export function extractFamilyRecords(profile, reducer, { session, domTurns = [], eventRecords } = {}) { |
| out | const | 619 | no | const out = {}; |
| push | function | 621 | no | const push = (entity, rec) =&gt; { (out[`family-${profile.family}-${entity}`] ??= []).push(rec); }; |
| re | const | 625 | no | const re = new RegExp(fm.source.endpoint); |
| rec | const | 628 | no | const rec = applyMapping(fm, s._delta.doc); |
| json | const | 636 | no | const json = e.jsonNested?.json !== undefined ? e.jsonNested.json : e.json; |
| msgs | const | 644 | no | const msgs = out[`family-${profile.family}-message`] ?? []; |
| net | const | 645 | no | const net = msgs.filter((m) =&gt; m._provenance.source === &#39;network&#39;), dom = msgs.filter((m) =&gt; m._provenance.source === &#39;dom&#39;); |
| norm | function | 646 | no | const norm = (t) =&gt; String(t ?? &#39;&#39;).replace(/\\s+/g, &#39; &#39;).trim().toLowerCase(); |
| probe | const | 648 | no | const probe = norm(n.text).slice(0, 80); |
| d | const | 650 | no | const d = dom.find((x) =&gt; norm(x.text).includes(probe)); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:path | import | 10 | external |
| ../config.mjs | import | 11 | [studio/src/config.mjs](../config.mjs.md) |
| ../store/versioned.mjs | import | 12 | [studio/src/store/versioned.mjs](../store/versioned.mjs.md) |
| ../shapes/extract.mjs | import | 13 | [studio/src/shapes/extract.mjs](../shapes/extract.mjs.md) |
| ../shapes/infer.mjs | import | 14 | [studio/src/shapes/infer.mjs](../shapes/infer.mjs.md) |
| ../replay/reducer.mjs | import | 15 | [studio/src/replay/reducer.mjs](../replay/reducer.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/bin/lib/context.mjs](../../bin/lib/context.mjs.md) | ../../src/families/families.mjs |
| [studio/src/capture/campaign.mjs](../capture/campaign.mjs.md) | ../families/families.mjs |
| [studio/src/families/build.mjs](./build.mjs.md) | ./families.mjs |
| [studio/src/families/core.mjs](./core.mjs.md) | ./families.mjs |
| [studio/src/mcp/runtime.mjs](../mcp/runtime.mjs.md) | ../families/families.mjs |
| [studio/src/replay/derive.mjs](../replay/derive.mjs.md) | ../families/families.mjs |
| [studio/src/shapes/infer.mjs](../shapes/infer.mjs.md) | ../families/families.mjs |
| [studio/src/studio/server.mjs](../studio/server.mjs.md) | ../families/families.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Provider families: shared data models that many sites map into (ai-chat, data-table, ...).
// A family is DATA (entities, fields, hints, detection signals); nothing here names a specific
// website, endpoint or selector. Sites join a family through their profile's familyMappings.
//
// Detection is evidence-driven: gatherEvidence() collects everything the detectors may look at
// (wire transports, app protocols, delta dialects, JSON leaf paths, event type names, enum values,
// collections, URL shapes, user actions, rendered DOM), and each family lists weighted signals
// over that evidence. A signal may be negated with `not: true`, carry a negative weight, or be
// listed in the family's `requires` so a family cannot match without it.
import path from 'node:path';
import { TOOL_ROOT } from '../config.mjs';
import { VersionedStore } from '../store/versioned.mjs';
import { select } from '../shapes/extract.mjs';
import { templateUrl } from '../shapes/infer.mjs';
import { STREAMING_TRANSPORTS } from '../replay/reducer.mjs';

export class FamilyStore extends VersionedStore {
  constructor(dir) { super(dir, { builtinDir: path.join(TOOL_ROOT, 'families'), kind: 'family', normalize: (f) => ({ members: [], detect: [], entities: {}, ...f }) }); }

  addMember(name, profileName) {
    const f = this.load(name);
    if (f.members.includes(profileName)) return f;
    return this.save(name, { ...f, members: [...f.members, profileName] }, `member added: ${profileName}`);
  }

  // Register a brand-new family from accepted record rules (user-defined shared model).
  register(name, { description = '', entities = {}, fromProfile, detect = [] } = {}) {
    if (this.has(name)) throw new Error(`Family "${name}" already exists.`);
    return this.save(name, { name, description, members: fromProfile ? [fromProfile] : [], detect, entities }, `registered${fromProfile ? ` from ${fromProfile}` : ''}`);
  }
}

// ---------------------------------------------------------------------------------------------
// Evidence: everything the detectors may look at, gathered once from a reducer (+ optional DOM).
// ---------------------------------------------------------------------------------------------
const ROLEISH = /(^|\.)(role|sender|from|speaker|author)$/i;
const STREAMING_SET = new Set(STREAMING_TRANSPORTS);
const MAX_SAMPLES = 400;
const MAX_COLLECTION_ITEMS = 200;
const DISCRIMINATOR_KEYS = ['type', 'event', 'kind', 'op', 'action', 'name', 'object', 'method', 'topic'];

function leafWalk(v, p, out, depth = 0) {
  if (depth > 9) return;
  if (v === null || typeof v !== 'object') { (out[p] ??= []).length < 50 && out[p].push(v); return; }
  if (Array.isArray(v)) { for (const x of v.slice(0, 30)) leafWalk(x, `${p}[*]`, out, depth + 1); return; }
  // Objects keyed by indices ({"0":…,"1":…}) are collections, not fixed fields.
  const keys = Object.keys(v);
  if (keys.length && keys.every((k) => /^\d+(\.\d+)*$/.test(k))) { for (const k of keys.slice(0, 30)) leafWalk(v[k], `${p}[*]`, out, depth + 1); return; }
  for (const [k, x] of Object.entries(v)) leafWalk(x, `${p}.${k}`, out, depth + 1);
}

// Arrays of objects, grouped by the path they live at, with bounded item samples.
function collectArrays(v, p, out, depth = 0) {
  if (depth > 8 || v === null || typeof v !== 'object') return;
  if (Array.isArray(v)) {
    const objs = v.filter((x) => x && typeof x === 'object' && !Array.isArray(x));
    if (objs.length) {
      const g = out.get(p) ?? { path: p, observations: 0, items: 0, samples: [], fields: new Map() };
      g.observations++; g.items += objs.length;
      for (const o of objs.slice(0, 30)) {
        if (g.samples.length < MAX_COLLECTION_ITEMS) g.samples.push(o);
        for (const k of Object.keys(o)) g.fields.set(k, (g.fields.get(k) ?? 0) + 1);
      }
      out.set(p, g);
    }
    for (const x of v.slice(0, 20)) collectArrays(x, `${p}[*]`, out, depth + 1);
    return;
  }
  for (const [k, x] of Object.entries(v)) collectArrays(x, `${p}.${k}`, out, depth + 1);
}

function discriminatorsOf(json) {
  const out = [];
  if (!json || typeof json !== 'object' || Array.isArray(json)) return out;
  for (const k of DISCRIMINATOR_KEYS) { const v = json[k]; if (typeof v === 'string' && v.length <= 64) out.push(v); }
  return out;
}

export function gatherEvidence(reducer, { domInspect = null, domTurns = null, phases = null } = {}) {
  // Optional per-sub-phase wall time (the caller's phase object; never part of the returned evidence).
```

_First 80 of 655 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
