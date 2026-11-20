# File: apps/vivim-host/public/host.js

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/public/host.js |
| Language | JavaScript |
| Kind | source |
| Size | 11301 B |
| Lines | 189 |
| Hash | 516f7eb01e22 |
| Test | no |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| $ | function | 2 | no | const $ = id =&gt; document.getElementById(id); |
| names | const | 3 | no | const names = { relay: &#39;Vercel Relay Worker&#39;, chatWorker: &#39;AI Chat Worker&#39;, harness: &#39;AI Harness&#39;, chrome: &#39;VIVIM Chrome&#39; }; |
| stages | const | 4 | no | const stages = [ |
| stateLabel | const | 12 | no | const stateLabel = { online:&#39;Online&#39;, stale:&#39;Stale&#39;, blocked:&#39;Blocked&#39;, unknown:&#39;Not verified&#39; }; |
| latest | variable | 13 | no | let latest = null; |
| selectedId | variable | 14 | no | let selectedId = null; |
| activeView | variable | 15 | no | let activeView = &#39;control&#39;; |
| node | function | 16 | no | function node(tag, className = &#39;&#39;, value = null) { |
| e | const | 17 | no | const e = document.createElement(tag); |
| pill | function | 22 | no | function pill(label, state = &#39;unknown&#39;) { return node(&#39;span&#39;, &#39;pill &#39; + (stateLabel[state] ? state : &#39;unknown&#39;), label); } |
| timeAgo | function | 23 | no | function timeAgo(ts) { |
| ms | const | 24 | no | const ms = Date.now() - Date.parse(ts \|\| &#39;&#39;); |
| card | function | 31 | no | function card(title, item) { |
| box | const | 32 | no | const box = node(&#39;article&#39;, &#39;card&#39;); |
| head | const | 33 | no | const head = node(&#39;div&#39;, &#39;card-head&#39;); |
| renderStrip | function | 41 | no | function renderStrip(snapshot) { |
| wrap | const | 42 | no | const wrap = $(&#39;connection-strip&#39;); wrap.replaceChildren(); |
| overview | const | 43 | no | const overview = [ |
| box | const | 50 | no | const box = node(&#39;div&#39;, &#39;connection-item&#39;); |
| renderDiagnosis | function | 55 | no | function renderDiagnosis(snapshot) { |
| d | const | 56 | no | const d = snapshot.diagnosis \|\| {}; |
| severity | const | 57 | no | const severity = [&#39;info&#39;,&#39;warning&#39;,&#39;neutral&#39;,&#39;unknown&#39;].includes(d.severity) ? d.severity : &#39;unknown&#39;; |
| renderCards | function | 64 | no | function renderCards(snapshot) { |
| cards | const | 65 | no | const cards = $(&#39;cards&#39;); cards.replaceChildren(card(&#39;Local Host&#39;, snapshot.host \|\| { state:&#39;unknown&#39; })); |
| activityTitle | function | 68 | no | function activityTitle(r) { |
| names | const | 69 | no | const names = { |
| renderActivity | function | 77 | no | function renderActivity(snapshot) { |
| journey | const | 78 | no | const journey = snapshot.journey \|\| { state: &#39;not_observed&#39;, recent: [] }; |
| all | const | 79 | no | const all = Array.isArray(journey.recent) ? journey.recent : []; |
| list | const | 81 | no | const list = $(&#39;activity&#39;); list.replaceChildren(); |
| empty | const | 83 | no | const empty = node(&#39;div&#39;, &#39;activity-empty&#39;); |
| row | const | 91 | no | const row = node(&#39;button&#39;, &#39;activity-item&#39; + (r.id === selectedId ? &#39; selected&#39; : &#39;&#39;)); |
| main | const | 94 | no | const main = node(&#39;div&#39;, &#39;activity-main&#39;); |
| info | const | 96 | no | const info = node(&#39;div&#39;); |
| selected | const | 102 | no | const selected = all.find(r =&gt; r.id === selectedId) \|\| all[0]; |
| renderDetail | function | 105 | no | function renderDetail(r) { |
| box | const | 106 | no | const box = $(&#39;activity-detail&#39;); box.replaceChildren(); |
| head | const | 107 | no | const head = node(&#39;div&#39;, &#39;detail-head&#39;); |
| evidence | const | 109 | no | const evidence = r.evidence \|\| {}; |
| list | const | 110 | no | const list = node(&#39;ol&#39;, &#39;stage-list&#39;); |
| value | const | 112 | no | const value = evidence[field]; |
| li | const | 113 | no | const li = node(&#39;li&#39;, value === true ? &#39;stage-confirmed&#39; : &#39;stage-unverified&#39;); |
| caveat | const | 118 | no | const caveat = node(&#39;p&#39;, &#39;detail-caveat&#39;, &#39;A claimed command is not proof of an AI send. A cloud acknowledgement is not proof the phone displayed the reply.&#39;); |
| render | function | 121 | no | function render(snapshot) { |
| old | const | 124 | no | const old = $(&#39;host-pill&#39;); |
| next | const | 125 | no | const next = pill(&#39;Host reachable&#39;, &#39;online&#39;); next.id = &#39;host-pill&#39;; old.replaceWith(next); |
| refresh | function | 128 | no | async function refresh() { |
| button | const | 129 | no | const button = $(&#39;refresh&#39;); if (button.disabled) return; |
| r | const | 132 | no | const r = await fetch(&#39;/api/host/status&#39;, { cache:&#39;no-store&#39;, credentials:&#39;same-origin&#39;, signal: AbortSignal.timeout(5000) }); |
| p | const | 139 | no | const p = $(&#39;host-pill&#39;); p.textContent = &#39;Host status unavailable&#39;; p.className = &#39;pill blocked&#39;; |
| copy | const | 147 | no | const copy = { |
| control | const | 160 | no | const control = view === &#39;control&#39;; |
| title | const | 163 | no | const title = control ? &#39;Host Control&#39; : view.charAt(0).toUpperCase() + view.slice(1); |
| row | const | 171 | no | const row = e.target.closest(&#39;[data-command-id]&#39;); |
| report | const | 179 | no | const report = JSON.stringify({ schema:&#39;vivim.host-diagnostic-report/1&#39;, observedAt:latest.observedAt, services:Object.fromEntries(Object.entries(latest.services \|\| {}).map(([k,v]) =&gt; [k, { state:v.s… |

## Imports

_No imports._

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// Metadata-only Host Control UI. All API-supplied text is inserted with textContent.
const $ = id => document.getElementById(id);
const names = { relay: 'Vercel Relay Worker', chatWorker: 'AI Chat Worker', harness: 'AI Harness', chrome: 'VIVIM Chrome' };
const stages = [
  ['cloudPulled', 'Received from cloud'],
  ['locallyQueued', 'Saved on this PC'],
  ['consumerClaimed', 'Claimed by a worker'],
  ['localTerminal', 'Local result recorded'],
  ['cloudUpdateAccepted', 'Cloud update acknowledged'],
  ['phoneDisplayed', 'Shown on your phone']
];
const stateLabel = { online:'Online', stale:'Stale', blocked:'Blocked', unknown:'Not verified' };
let latest = null;
let selectedId = null;
let activeView = 'control';
function node(tag, className = '', value = null) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (value !== null && value !== undefined) e.textContent = String(value);
  return e;
}
function pill(label, state = 'unknown') { return node('span', 'pill ' + (stateLabel[state] ? state : 'unknown'), label); }
function timeAgo(ts) {
  const ms = Date.now() - Date.parse(ts || '');
  if (!Number.isFinite(ms) || ms < -2000) return 'time unknown';
  if (ms < 5000) return 'just now';
  if (ms < 60000) return Math.floor(ms / 1000) + 's ago';
  if (ms < 3600000) return Math.floor(ms / 60000) + 'm ago';
  return new Date(ts).toLocaleString();
}
function card(title, item) {
  const box = node('article', 'card');
  const head = node('div', 'card-head');
  head.append(node('h3', '', title), pill(stateLabel[item.state] || 'Not verified', item.state));
  box.append(head, node('p', 'card-explanation', item.reason || item.evidence || 'No direct evidence observed yet.'));
  if (item.lastHeartbeatAt) box.append(node('p', 'card-foot', 'Last verified cycle · ' + timeAgo(item.lastHeartbeatAt)));
  else box.append(node('p', 'card-foot', 'No verified heartbeat'));
  if (item.nextAction) box.append(node('p', 'card-tip', item.nextAction));
  return box;
}
function renderStrip(snapshot) {
  const wrap = $('connection-strip'); wrap.replaceChildren();
  const overview = [
    { name: 'This PC', state: snapshot.host?.state || 'unknown' },
    { name: 'Cloud relay worker', state: snapshot.services?.relay?.state || 'unknown' },
    { name: 'Chat worker', state: snapshot.services?.chatWorker?.state || 'unknown' },
    { name: 'Chrome', state: snapshot.services?.chrome?.state || 'unknown' }
  ];
  for (const it of overview) {
    const box = node('div', 'connection-item');
    box.append(node('span', 'connection-indicator ' + it.state), node('span', 'connection-name', it.name), node('strong', '', stateLabel[it.state] || 'Not verified'));
    wrap.append(box);
  }
}
function renderDiagnosis(snapshot) {
  const d = snapshot.diagnosis || {};
  const severity = ['info','warning','neutral','unknown'].includes(d.severity) ? d.severity : 'unknown';
  $('diagnosis').className = 'diagnosis ' + severity;
  $('diagnosis-label').textContent = d.code ? 'DIAGNOSIS · ' + d.code.replaceAll('_', ' ') : 'CURRENT DIAGNOSIS';
  $('diagnosis-title').textContent = d.title || 'No diagnosis available';
  $('diagnosis-detail').textContent = d.detail || 'Waiting for local evidence.';
  $('diagnosis-action').textContent = d.nextAction || 'No action required.';
}
function renderCards(snapshot) {
  const cards = $('cards'); cards.replaceChildren(card('Local Host', snapshot.host || { state:'unknown' }));
  for (const [key, title] of Object.entries(names)) cards.append(card(title, snapshot.services?.[key] || { state:'unknown' }));
}
function activityTitle(r) {
  const names = {
    waiting_for_consumer:'Waiting for worker', processing_locally:'Processing locally',
    cloud_update_accepted:'Cloud accepted update', waiting_for_cloud_update:'Awaiting cloud receipt',
    failure_reported_to_cloud:'Failure reported', failure_waiting_for_cloud:'Failure pending sync',
    send_outcome_uncertain:'Uncertain send'
  };
  return names[r.currentStage] || r.status || 'Unknown stage';
}
function renderActivity(snapshot) {
  const journey = snapshot.journey || { state: 'not_observed', recent: [] };
  const all = Array.isArray(journey.recent) ? journey.recent : [];
  $('bridge-count').textContent = journey.state === 'observed' ? all.length + ' recent' : 'Not observed';
```

_First 80 of 189 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
