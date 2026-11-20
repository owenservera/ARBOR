# File: hq/lib/team-dashboard.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/lib/team-dashboard.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 31485 B |
| Lines | 629 |
| Hash | 4633c7614b94 |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| UNAVAILABLE_HEALTH | const | 18 | yes | export const UNAVAILABLE_HEALTH = new Set([&#39;capped&#39;, &#39;budget-blocked&#39;, &#39;broken&#39;]); |
| HEALTH_STYLE | const | 21 | no | const HEALTH_STYLE = { |
| FIX_BY_KIND | const | 31 | no | const FIX_BY_KIND = { |
| SEVERITY_STYLE | const | 41 | no | const SEVERITY_STYLE = { |
| SEVERITY_ORDER | const | 48 | no | const SEVERITY_ORDER = { high: 0, medium: 1, low: 2 }; |
| escapeHtml | function | 59 | yes | export function escapeHtml(value) { |
| asArray | function | 72 | no | function asArray(value) { |
| asMap | function | 76 | no | function asMap(value) { |
| num | function | 82 | no | function num(value, fallback = 0) { |
| n | const | 83 | no | const n = Number(value); |
| plural | function | 87 | no | function plural(count, singular, pluralForm) { |
| looksLikeCommand | function | 92 | no | function looksLikeCommand(text) { |
| healthStyle | function | 96 | no | function healthStyle(state) { |
| severityStyle | function | 100 | no | function severityStyle(severity) { |
| chip | function | 104 | no | function chip(kind, label, style) { |
| cls | const | 105 | no | const cls = kind === &#39;health&#39; ? &#39;chip chip-health&#39; : kind === &#39;severity&#39; ? &#39;chip chip-severity&#39; : &#39;chip&#39;; |
| CSS | const | 116 | no | const CSS = ` |
| renderVerdict | function | 256 | no | function renderVerdict(opts) { |
| providerWord | const | 258 | no | const providerWord = unavailable.length |
| line | const | 261 | no | const line = `${escapeHtml(teamName)} — ${plural(agents.length, &#39;agent&#39;)} · ${activeSeats} of ${seats.length} seats active · ${withProtocol} of ${agents.length} agents carry the ${PROTOCOL_SKILL} · $… |
| stat | function | 262 | no | const stat = (label, value) =&gt; `&lt;div class=&quot;stat&quot;&gt;&lt;dt&gt;${escapeHtml(label)}&lt;/dt&gt;&lt;dd&gt;${escapeHtml(value)}&lt;/dd&gt;&lt;/div&gt;`; |
| stats | const | 263 | no | const stats = [ |
| renderAgents | function | 272 | no | function renderAgents(agents) { |
| cards | const | 276 | no | const cards = agents.map((a) =&gt; { const name = a.name \|\| a.file \|\| &#39;unnamed&#39;; const protocol = Array.isArray(a.skills) &amp;&amp; a.skills.includes(PROTOCOL_SKILL); const ctx7 = Array.isArray(a.requiredMcpSe… |
| name | const | 277 | no | const name = a.name \|\| a.file \|\| &#39;unnamed&#39;; |
| protocol | const | 278 | no | const protocol = Array.isArray(a.skills) &amp;&amp; a.skills.includes(PROTOCOL_SKILL); |
| ctx7 | const | 279 | no | const ctx7 = Array.isArray(a.requiredMcpServers) &amp;&amp; a.requiredMcpServers.includes(&#39;context7&#39;); |
| haystack | const | 280 | no | const haystack = [name, a.file, a.model, a.thoughtLevel, (a.skills \|\| []).join(&#39; &#39;), protocol ? PROTOCOL_SKILL : &#39;&#39;].filter(Boolean).join(&#39; &#39;); |
| open | const | 297 | no | const open = agents.length &lt;= 8 ? &#39; open&#39; : &#39;&#39;; |
| renderSeats | function | 305 | no | function renderSeats(seats) { |
| cards | const | 309 | no | const cards = seats.map((s) =&gt; { const active = s.state === &#39;ACTIVE&#39;; const style = active ? { dot: &#39;var(--color-success)&#39;, ink: &#39;var(--success-ink)&#39;, bg: &#39;var(--success-bg)&#39; } : { dot: &#39;var(--color-… |
| active | const | 310 | no | const active = s.state === &#39;ACTIVE&#39;; |
| style | const | 311 | no | const style = active |
| age | const | 314 | no | const age = s.ageMinutes === null \|\| s.ageMinutes === undefined ? &#39;—&#39; : `${s.ageMinutes}m`; |
| ageLabel | const | 315 | no | const ageLabel = active ? &#39;Active&#39; : &#39;Idle&#39;; |
| renderProviders | function | 332 | no | function renderProviders(health) { |
| rows | const | 336 | no | const rows = [...health.entries()] |
| state | const | 339 | no | const state = String(h?.health?.state \|\| &#39;unknown&#39;).toLowerCase(); |
| style | const | 340 | no | const style = healthStyle(state); |
| reliability | const | 341 | no | const reliability = h?.health?.reliability; |
| relText | const | 342 | no | const relText = reliability === null \|\| reliability === undefined |
| reasons | const | 345 | no | const reasons = Array.isArray(h?.health?.reasons) ? h.health.reasons.filter(Boolean) : []; |
| renderDefects | function | 361 | no | function renderDefects(defects, nextMoves) { |
| items | const | 365 | no | const items = defects |
| style | const | 369 | no | const style = severityStyle(d.severity); |
| fix | const | 371 | no | const fix = match ? match.action : (FIX_BY_KIND[d.kind] \|\| &#39;Open the definition and repair the frontmatter.&#39;); |
| haystack | const | 372 | no | const haystack = [d.kind, d.agent, d.detail, d.evidence, d.severity].filter(Boolean).join(&#39; &#39;); |
| renderMoves | function | 386 | no | function renderMoves(nextMoves) { |
| items | const | 390 | no | const items = nextMoves.map((m) =&gt; { const action = String(m?.action \|\| &#39;&#39;); const isCommand = looksLikeCommand(action); const label = isCommand ? &#39;Copy command&#39; : &#39;Copy action&#39;; const command = isCo… |
| action | const | 391 | no | const action = String(m?.action \|\| &#39;&#39;); |
| isCommand | const | 392 | no | const isCommand = looksLikeCommand(action); |
| label | const | 393 | no | const label = isCommand ? &#39;Copy command&#39; : &#39;Copy action&#39;; |
| command | const | 394 | no | const command = isCommand |
| SCRIPT | const | 416 | no | const SCRIPT = ` |
| reduceMotion | variable | 418 | no | var reduceMotion = false; |
| input | variable | 423 | no | var input = document.getElementById(&#39;team-filter&#39;); |
| clear | variable | 424 | no | var clear = document.getElementById(&#39;filter-clear&#39;); |
| status | variable | 425 | no | var status = document.getElementById(&#39;filter-status&#39;); |
| groups | variable | 426 | no | var groups = Array.prototype.slice.call(document.querySelectorAll(&#39;[data-filter-group]&#39;)); |
| countGroup | function | 428 | no | function countGroup(name) { |
| group | variable | 429 | no | var group = document.querySelector(&#39;[data-filter-group=&quot;&#39; + name + &#39;&quot;]&#39;); |
| items | variable | 431 | no | var items = group.querySelectorAll(&#39;[data-filter-item]&#39;); |
| visible | variable | 432 | no | var visible = 0; |
| phrase | function | 437 | no | function phrase(group) { |
| applyFilter | function | 442 | no | function applyFilter() { |
| q | variable | 443 | no | var q = (input &amp;&amp; input.value ? input.value : &#39;&#39;).trim().toLowerCase(); |
| roster | variable | 444 | no | var roster = document.getElementById(&#39;roster&#39;); |
| group | variable | 447 | no | var group = groups[g]; |
| items | variable | 448 | no | var items = group.querySelectorAll(&#39;[data-filter-item]&#39;); |
| visible | variable | 449 | no | var visible = 0; |
| hay | variable | 451 | no | var hay = (items[i].getAttribute(&#39;data-filter-text&#39;) \|\| &#39;&#39;).toLowerCase(); |
| hit | variable | 452 | no | var hit = q === &#39;&#39; \|\| hay.indexOf(q) !== -1; |
| empty | variable | 456 | no | var empty = group.parentNode ? group.parentNode.querySelector(&#39;[data-filter-empty]&#39;) : null; |
| a | variable | 462 | no | var a = countGroup(&#39;agents&#39;); |
| d | variable | 463 | no | var d = countGroup(&#39;defects&#39;); |
| legacyCopy | function | 480 | no | function legacyCopy(text, done) { |
| area | variable | 481 | no | var area = document.createElement(&#39;textarea&#39;); |
| ok | variable | 488 | no | var ok = false; |
| target | variable | 495 | no | var target = event.target; |
| button | variable | 497 | no | var button = target.closest(&#39;[data-copy]&#39;); |
| text | variable | 499 | no | var text = button.getAttribute(&#39;data-copy&#39;) \|\| &#39;&#39;; |
| original | variable | 500 | no | var original = button.getAttribute(&#39;data-copy-label&#39;) \|\| &#39;Copy&#39;; |
| live | variable | 501 | no | var live = document.getElementById(&#39;copy-status&#39;); |
| finish | function | 503 | no | function finish(ok) { |
| renderDashboard | function | 537 | yes | export function renderDashboard(snapshot, opts = {}) { |
| s | const | 538 | no | const s = snapshot &amp;&amp; typeof snapshot === &#39;object&#39; ? snapshot : {}; |
| teamName | const | 539 | no | const teamName = String(opts.teamName ?? s.teamName ?? s.team?.name ?? &#39;My AI Team&#39;); |
| agents | const | 540 | no | const agents = asArray(s.agents); |
| seats | const | 541 | no | const seats = asArray(s.seats); |
| defects | const | 542 | no | const defects = asArray(s.defects); |
| nextMoves | const | 543 | no | const nextMoves = asArray(s.nextMoves); |
| health | const | 544 | no | const health = asMap(s.providerHealth); |
| tasks | const | 545 | no | const tasks = s.tasks &amp;&amp; typeof s.tasks === &#39;object&#39; ? s.tasks : {}; |
| liveSessions | const | 546 | no | const liveSessions = s.liveSessions instanceof Map ? s.liveSessions.size : Object.keys(s.liveSessions \|\| {}).length; |
| activeSeats | const | 548 | no | const activeSeats = seats.filter((x) =&gt; x?.state === &#39;ACTIVE&#39;).length; |
| withProtocol | const | 549 | no | const withProtocol = agents.filter((a) =&gt; Array.isArray(a?.skills) &amp;&amp; a.skills.includes(PROTOCOL_SKILL)).length; |
| unavailable | const | 550 | no | const unavailable = [...health.entries()] |
| title | const | 559 | no | const title = opts.title ? String(opts.title) : `Team Dashboard — ${teamName}`; |
| eyebrow | const | 560 | no | const eyebrow = teamName.toLowerCase() === &#39;my ai team&#39; ? &#39;My AI Team&#39; : `My AI Team · ${teamName}`; |
| generated | const | 561 | no | const generated = s.generatedAt ? new Date(s.generatedAt) : null; |
| stamp | const | 562 | no | const stamp = generated &amp;&amp; !Number.isNaN(generated.getTime()) |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./team-panel.mjs | import | 15 | [hq/lib/team-panel.mjs](./team-panel.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [hq/lib/canvas.mjs](./canvas.mjs.md) | ./team-dashboard.mjs |
| [hq/lib/pmo.mjs](./pmo.mjs.md) | ./team-dashboard.mjs |

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 2 | context | — | — | The visual roof over the team snapshot: one page that says what is running and what to do. |
| 3 | owner | hq-agent | — | hq-agent |
| 4 | task | — | — | team-dashboard |
| 5 | invariant | — | — | read-only; the dashboard renders a snapshot and never fetches or mutates anything. |
| 6 | see | — | hq/lib/team-panel.mjs | hq/lib/team-panel.mjs |
| 7 | why | — | — | The text panel answers &quot;who is on the team&quot;; this answers the same question in one page a |

## Excerpt

```javascript
/**
 * @hq:context The visual roof over the team snapshot: one page that says what is running and what to do.
 * @hq:owner hq-agent
 * @hq:task team-dashboard
 * @hq:invariant read-only; the dashboard renders a snapshot and never fetches or mutates anything.
 * @hq:see hq/lib/team-panel.mjs
 * @hq:why The text panel answers "who is on the team"; this answers the same question in one page a
 *        person can read in ten seconds, with the command to run already attached to each move.
 *
 * The output is ONE self-contained HTML document: inline CSS, inline JS, no network requests of any
 * kind. Fonts are requested from the local stack only (Playfair Display / JetBrains Mono when the
 * machine already has them, otherwise a graceful serif / monospace fallback) — nothing is fetched
 * from a CDN, so the page renders identically offline.
 */
import { PROTOCOL_SKILL } from './team-panel.mjs';

/** Provider health states that mean "do not fan out lanes onto this". */
export const UNAVAILABLE_HEALTH = new Set(['capped', 'budget-blocked', 'broken']);

/** Colour + wording per provider health state. `dot` is the raw token, `ink` is the AA-safe shade. */
const HEALTH_STYLE = {
  healthy: { label: 'Healthy', dot: 'var(--color-success)', ink: 'var(--success-ink)', bg: 'var(--success-bg)' },
  capped: { label: 'Capped', dot: 'var(--color-danger)', ink: 'var(--danger-ink)', bg: 'var(--danger-bg)' },
  'budget-blocked': { label: 'Budget blocked', dot: 'var(--color-danger)', ink: 'var(--danger-ink)', bg: 'var(--danger-bg)' },
  broken: { label: 'Broken', dot: 'var(--color-danger)', ink: 'var(--danger-ink)', bg: 'var(--danger-bg)' },
  unproven: { label: 'Unproven', dot: 'var(--color-warning)', ink: 'var(--warning-ink)', bg: 'var(--warning-bg)' },
  unknown: { label: 'Unknown', dot: 'var(--text-muted)', ink: 'var(--text-muted)', bg: 'var(--surface-alt)' },
};

/** The one-line repair for each defect kind the panel knows about. */
const FIX_BY_KIND = {
  'no-frontmatter': 'Add YAML frontmatter to the definition.',
  'missing-name': 'Add name: to the frontmatter.',
  'agent-not-registered': 'Start a new session so the agent type registers.',
  'nonexistent-tool': 'Remove the nonexistent tools from the grant.',
  'context7-unreachable': 'Add the Context7 MCP tools to the grant.',
  'no-protocol-grant': `Grant the shared ${PROTOCOL_SKILL} skill.`,
  'thought-level': 'Set thoughtLevel: max on the pinned model.',
};

const SEVERITY_STYLE = {
  high: { label: 'High', dot: 'var(--color-danger)', ink: 'var(--danger-ink)', bg: 'var(--danger-bg)' },
  medium: { label: 'Medium', dot: 'var(--color-warning)', ink: 'var(--warning-ink)', bg: 'var(--warning-bg)' },
  low: { label: 'Low', dot: 'var(--color-success)', ink: 'var(--success-ink)', bg: 'var(--success-bg)' },
  unknown: { label: 'Unrated', dot: 'var(--text-muted)', ink: 'var(--text-muted)', bg: 'var(--surface-alt)' },
};

const SEVERITY_ORDER = { high: 0, medium: 1, low: 2 };

/**
 * Escape a value for HTML text or a quoted attribute.
 *
 * Every interpolated snapshot value goes through here: seat titles, agent names and defect details
 * are arbitrary strings, and an unescaped one is an injection.
 *
 * @param {unknown} value
 * @returns {string}
 */
export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (ch) => {
    switch (ch) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      case "'": return '&#39;';
      default: return ch;
    }
  });
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asMap(value) {
  if (value instanceof Map) return value;
  if (value && typeof value === 'object') return new Map(Object.entries(value));
  return new Map();
}
```

_First 80 of 630 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
