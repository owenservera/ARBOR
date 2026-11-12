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

function num(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function plural(count, singular, pluralForm) {
  return `${count} ${count === 1 ? singular : (pluralForm || `${singular}s`)}`;
}

/** A shell command is a command; anything else is guidance and is labelled as such. */
function looksLikeCommand(text) {
  return /^(bun|node|npm|npx|git|cd|pwsh|powershell)\b/.test(String(text ?? '').trim());
}

function healthStyle(state) {
  return HEALTH_STYLE[String(state ?? '').toLowerCase()] || HEALTH_STYLE.unknown;
}

function severityStyle(severity) {
  return SEVERITY_STYLE[String(severity ?? '').toLowerCase()] || SEVERITY_STYLE.unknown;
}

function chip(kind, label, style) {
  const cls = kind === 'health' ? 'chip chip-health' : kind === 'severity' ? 'chip chip-severity' : 'chip';
  return `<span class="${cls}" data-${kind}="${escapeHtml(String(label).toLowerCase())}" style="--chip-dot:${style.dot};--chip-ink:${style.ink};--chip-bg:${style.bg};">${escapeHtml(label)}</span>`;
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

// No @import, no <link>, no webfont fetch: the stacks below degrade to the fonts the machine
// already has. Colours are semantic tokens; the ink variants are the AA-safe shades of the same
// hues, so no text ever sits below 4.5:1 on its background.
const CSS = `
*,*::before,*::after{box-sizing:border-box}
[hidden]{display:none !important}
html{-webkit-text-size-adjust:100%}
body{
  margin:0;
  background:var(--color-secondary);
  color:var(--color-text);
  font-family:var(--font-display);
  font-size:16px;
  line-height:1.6;
}
a{color:var(--primary-ink)}
h1,h2,h3{margin:0;line-height:1.25;font-weight:700}
p{margin:0}
ul,ol{margin:0;padding:0;list-style:none}
dl,dd,dt{margin:0}
:root{
  --color-primary:#FF5701;
  --color-secondary:#F6F6F1;
  --color-success:#16A34A;
  --color-warning:#D97706;
  --color-danger:#DC2626;
  --color-surface:#FFFFFF;
  --color-text:#111827;
  --primary-ink:#9A3800;
  --success-ink:#0E7A33;
  --warning-ink:#92400E;
  --danger-ink:#B91C1C;
  --success-bg:#E7F6EC;
  --warning-bg:#FDF1DF;
  --danger-bg:#FCEBEB;
  --text-muted:#4B5563;
  --border:#E3E3DC;
  --focus:#9A3800;
  --font-display:"Playfair Display","Iowan Old Style","Palatino Linotype",Palatino,Georgia,"Times New Roman",serif;
  --font-mono:"JetBrains Mono","Cascadia Mono","Cascadia Code",Consolas,"SF Mono",Menlo,"Liberation Mono",monospace;
  --s1:8px; --s2:16px; --s3:24px; --s4:32px; --s5:40px;
  --radius:10px;
}
.shell{width:100%;max-width:1200px;margin:0 auto;padding:var(--s3)}
.skip-link{position:absolute;left:-9999px;top:0;background:var(--color-surface);color:var(--primary-ink);padding:var(--s1) var(--s2);z-index:10;border-radius:0 0 var(--radius) 0}
.skip-link:focus{left:0}
:focus-visible{outline:3px solid var(--focus);outline-offset:2px}
.visually-hidden{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}
.masthead{background:var(--color-surface);border-bottom:1px solid var(--border)}
.masthead .shell{padding-top:var(--s4);padding-bottom:var(--s4)}
.eyebrow{font-family:var(--font-mono);font-size:14px;letter-spacing:.08em;text-transform:uppercase;color:var(--text-muted);margin-bottom:var(--s1)}
h1{font-size:32px;letter-spacing:-.01em}
.verdict{font-size:18px;margin-top:var(--s2);max-width:70ch}
.verdict .mark{color:var(--primary-ink);font-weight:700}
.stats{display:flex;flex-wrap:wrap;gap:var(--s2);margin-top:var(--s3)}
.stat{background:var(--color-secondary);border:1px solid var(--border);border-radius:var(--radius);padding:var(--s1) var(--s2);min-width:120px}
.stat dt{font-family:var(--font-mono);font-size:14px;letter-spacing:.06em;text-transform:uppercase;color:var(--text-muted)}
.stat dd{font-family:var(--font-mono);font-size:24px;font-weight:700;line-height:1.3}
.toolbar{display:flex;flex-wrap:wrap;align-items:end;gap:var(--s2);background:var(--color-surface);border:1px solid var(--border);border-radius:var(--radius);padding:var(--s2);margin:var(--s3) 0}
.field{display:flex;flex-direction:column;gap:var(--s1);flex:1 1 260px;min-width:220px}
.field-label{font-family:var(--font-mono);font-size:14px;letter-spacing:.06em;text-transform:uppercase;color:var(--text-muted)}
input[type="search"]{
  font-family:var(--font-display);font-size:16px;color:var(--color-text);
  background:var(--color-surface);border:1px solid var(--border);border-radius:var(--radius);
  padding:var(--s1) var(--s2);min-height:44px;width:100%;
}
input[type="search"]::placeholder{color:var(--text-muted);opacity:1}
.btn{
  font-family:var(--font-mono);font-size:14px;font-weight:700;
  min-height:44px;min-width:44px;padding:var(--s1) var(--s2);
  border-radius:var(--radius);border:1px solid var(--primary-ink);
  background:var(--color-primary);color:#1A0E05;cursor:pointer;
  transition:transform .12s ease,box-shadow .12s ease;
}
.btn:hover{box-shadow:0 2px 0 var(--primary-ink)}
.btn:active{transform:translateY(1px)}
.btn.quiet{background:var(--color-surface);color:var(--primary-ink);border-color:var(--border)}
.btn.is-copied{background:var(--success-bg);border-color:var(--success-ink);color:var(--success-ink)}
.filter-status{font-family:var(--font-mono);font-size:14px;color:var(--text-muted);flex:1 1 100%}
.panel{margin:var(--s4) 0 0}
.panel > h2{font-size:24px;display:flex;align-items:baseline;gap:var(--s1);margin-bottom:var(--s2)}
.panel > h2 .count{font-family:var(--font-mono);font-size:14px;font-weight:700;color:var(--text-muted);border:1px solid var(--border);border-radius:999px;padding:0 var(--s1)}
.grid{display:grid;gap:var(--s2);grid-template-columns:repeat(auto-fill,minmax(260px,1fr))}
.card{background:var(--color-surface);border:1px solid var(--border);border-radius:var(--radius);padding:var(--s2)}
.card h3{font-size:18px;word-break:break-word}
.card h3.provider-key{font-family:var(--font-mono);font-size:14px;font-weight:700;line-height:1.4;overflow-wrap:anywhere;word-break:normal;margin-bottom:var(--s1)}
.card .sub{font-size:14px;color:var(--text-muted);margin-top:var(--s1)}
.card-head{display:flex;align-items:flex-start;justify-content:space-between;gap:var(--s1)}
.facts{display:grid;grid-template-columns:repeat(auto-fit,minmax(88px,1fr));gap:var(--s1) var(--s2);margin-top:var(--s2)}
.facts dt{font-family:var(--font-mono);font-size:14px;letter-spacing:.05em;text-transform:uppercase;color:var(--text-muted)}
.facts dd{font-family:var(--font-mono);font-size:16px;word-break:break-word}
.facts dd.slug{font-size:14px;overflow-wrap:anywhere}
.roster{background:var(--color-surface);border:1px solid var(--border);border-radius:var(--radius);padding:var(--s2)}
.roster-summary{cursor:pointer;min-height:44px;padding:var(--s1) 0;font-family:var(--font-mono);font-size:14px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:var(--primary-ink)}
.roster-summary::marker{color:var(--primary-ink)}
.roster[open] .roster-summary{margin-bottom:var(--s2)}
.chip{
  display:inline-flex;align-items:center;gap:var(--s1);
  font-family:var(--font-mono);font-size:14px;font-weight:700;white-space:nowrap;
  color:var(--chip-ink,var(--text-muted));background:var(--chip-bg,var(--surface-alt));
  border:1px solid var(--chip-dot,var(--border));border-radius:999px;padding:2px var(--s1);
}
.chip::before{content:"";width:8px;height:8px;border-radius:50%;background:var(--chip-dot,var(--text-muted));flex:none}
.rows{display:flex;flex-direction:column;gap:var(--s2)}
.row{background:var(--color-surface);border:1px solid var(--border);border-left:4px solid var(--row-accent,var(--border));border-radius:var(--radius);padding:var(--s2)}
.row .row-head{display:flex;flex-wrap:wrap;align-items:center;gap:var(--s1);justify-content:space-between}
.row .kind{font-family:var(--font-mono);font-size:14px;font-weight:700;letter-spacing:.04em;text-transform:uppercase}
.row .detail{margin-top:var(--s1);font-size:16px}
.row .fix{margin-top:var(--s1);font-size:16px;color:var(--color-text)}
.row .fix b{color:var(--primary-ink)}
.moves li{background:var(--color-surface);border:1px solid var(--border);border-radius:var(--radius);padding:var(--s2)}
.move-head{display:flex;flex-wrap:wrap;gap:var(--s1);align-items:center;justify-content:space-between}
.move-head .target{font-family:var(--font-mono);font-size:14px;color:var(--text-muted);word-break:break-all}
.command{display:block;font-family:var(--font-mono);font-size:14px;background:var(--color-secondary);border:1px solid var(--border);border-radius:var(--radius);padding:var(--s1) var(--s2);margin:var(--s1) 0;overflow-x:auto;white-space:pre-wrap;word-break:break-word}
.reason{font-size:16px;color:var(--text-muted)}
.empty-state{background:var(--color-surface);border:1px dashed var(--border);border-radius:var(--radius);padding:var(--s3);color:var(--text-muted);font-size:16px}
.foot{border-top:1px solid var(--border);margin-top:var(--s4);padding-top:var(--s2);padding-bottom:var(--s4);font-family:var(--font-mono);font-size:14px;color:var(--text-muted)}
@media (max-width:520px){
  .shell{padding:var(--s2)}
  h1{font-size:24px}
  .verdict{font-size:16px}
  .panel > h2{font-size:18px}
  .grid{grid-template-columns:1fr}
  .stats{gap:var(--s1)}
  .stat{min-width:0;flex:1 1 44%}
}
@media (prefers-contrast:more){
  :root{--border:#6B6B60;--text-muted:#33372E}
  .card,.row,.toolbar,.moves li,.stat{border-width:2px}
}
@media (prefers-reduced-motion:reduce){
  *,*::before,*::after{animation:none !important;transition:none !important;scroll-behavior:auto !important}
}
@media print{
  .toolbar,.skip-link{display:none}
  body{background:#fff}
}
`;

// ---------------------------------------------------------------------------
// Sections
// ---------------------------------------------------------------------------

function renderVerdict(opts) {
  const { teamName, agents, seats, activeSeats, withProtocol, unavailable, tasks } = opts;
  const providerWord = unavailable.length
    ? `<span class="mark">${plural(unavailable.length, 'provider')} unavailable</span>`
    : '<span class="mark">all providers available</span>';
  const line = `${escapeHtml(teamName)} — ${plural(agents.length, 'agent')} · ${activeSeats} of ${seats.length} seats active · ${withProtocol} of ${agents.length} agents carry the ${PROTOCOL_SKILL} · ${providerWord}`;
  const stat = (label, value) => `<div class="stat"><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`;
  const stats = [
    stat('Open tasks', tasks.tasks === null || tasks.tasks === undefined ? '—' : String(tasks.tasks)),
    stat('Blocked', tasks.blocked === null || tasks.blocked === undefined ? '—' : String(tasks.blocked)),
    stat('Defects', String(opts.defectCount)),
    stat('Live sessions', String(opts.liveSessions)),
  ].join('');
  return { line, stats };
}

function renderAgents(agents) {
  if (!agents.length) {
    return '<p class="empty-state">No agent definitions were found. Point HQ at an agents directory and the roster appears here.</p>';
  }
  const cards = agents.map((a) => {
    const name = a.name || a.file || 'unnamed';
    const protocol = Array.isArray(a.skills) && a.skills.includes(PROTOCOL_SKILL);
    const ctx7 = Array.isArray(a.requiredMcpServers) && a.requiredMcpServers.includes('context7');
    const haystack = [name, a.file, a.model, a.thoughtLevel, (a.skills || []).join(' '), protocol ? PROTOCOL_SKILL : ''].filter(Boolean).join(' ');
    return `<article class="card" data-filter-item data-filter-text="${escapeHtml(haystack)}">
      <div class="card-head">
        <h3>${escapeHtml(name)}</h3>
        <span class="chip" style="--chip-dot:${protocol ? 'var(--color-success)' : 'var(--color-warning)'};--chip-ink:${protocol ? 'var(--success-ink)' : 'var(--warning-ink)'};--chip-bg:${protocol ? 'var(--success-bg)' : 'var(--warning-bg)'}">${protocol ? 'Protocol' : 'No protocol'}</span>
      </div>
      <p class="sub">${escapeHtml(a.file || '')}</p>
      <dl class="facts">
        <div><dt>Model</dt><dd class="slug">${escapeHtml(a.model || 'inherit')}</dd></div>
        <div><dt>Think</dt><dd>${escapeHtml(a.thoughtLevel || '—')}</dd></div>
        <div><dt>Tools</dt><dd>${escapeHtml(String((a.tools || []).length))}</dd></div>
        <div><dt>Context7</dt><dd>${ctx7 ? 'yes' : 'no'}</dd></div>
      </dl>
    </article>`;
  }).join('');
  // A long roster is reference material, not the headline: it folds away so the seats, the
  // providers, the defects and the next moves stay on the first screen.
  const open = agents.length <= 8 ? ' open' : '';
  return `<details class="roster" id="roster"${open}>
      <summary class="roster-summary">Agent roster · ${escapeHtml(String(agents.length))} definitions</summary>
      <div class="grid" data-filter-group="agents">${cards}</div>
      <p class="empty-state" data-filter-empty hidden>No agent matches that filter.</p>
    </details>`;
}

function renderSeats(seats) {
  if (!seats.length) {
    return '<p class="empty-state">No seats are registered, so nothing can be woken from this page.</p>';
  }
  const cards = seats.map((s) => {
    const active = s.state === 'ACTIVE';
    const style = active
      ? { dot: 'var(--color-success)', ink: 'var(--success-ink)', bg: 'var(--success-bg)' }
      : { dot: 'var(--color-warning)', ink: 'var(--warning-ink)', bg: 'var(--warning-bg)' };
    const age = s.ageMinutes === null || s.ageMinutes === undefined ? '—' : `${s.ageMinutes}m`;
    const ageLabel = active ? 'Active' : 'Idle';
    return `<article class="card">
      <div class="card-head">
        <h3>${escapeHtml(s.id || 'seat')}</h3>
        <span class="chip" style="--chip-dot:${style.dot};--chip-ink:${style.ink};--chip-bg:${style.bg}">${escapeHtml(s.state || 'UNKNOWN')}</span>
      </div>
      <p class="sub">${escapeHtml(s.title || 'No title')}</p>
      <dl class="facts">
        <div><dt>${escapeHtml(ageLabel)}</dt><dd>${escapeHtml(age)}</dd></div>
        <div><dt>Messages</dt><dd>${escapeHtml(String(num(s.messages, 0)))}</dd></div>
        <div><dt>Site</dt><dd>${escapeHtml(s.site || '—')}</dd></div>
      </dl>
    </article>`;
  }).join('');
  return `<div class="grid">${cards}</div>`;
}

function renderProviders(health) {
  if (!health.size) {
    return '<p class="empty-state">No provider calls were observed in the last five hours, so no provider can be cleared for work.</p>';
  }
  const rows = [...health.entries()]
    .sort((a, b) => num(b[1]?.completed) - num(a[1]?.completed))
    .map(([key, h]) => {
      const state = String(h?.health?.state || 'unknown').toLowerCase();
      const style = healthStyle(state);
      const reliability = h?.health?.reliability;
      const relText = reliability === null || reliability === undefined
        ? '—'
        : `${Math.round(Number(reliability) * 100)}%`;
      const reasons = Array.isArray(h?.health?.reasons) ? h.health.reasons.filter(Boolean) : [];
      return `<article class="card">
        <h3 class="provider-key">${escapeHtml(key)}</h3>
        ${chip('health', style.label, style)}
        <dl class="facts">
          <div><dt>Done</dt><dd>${escapeHtml(String(num(h?.completed, 0)))}</dd></div>
          <div><dt>Errors</dt><dd>${escapeHtml(String(num(h?.error, 0)))}</dd></div>
          <div><dt>Latency</dt><dd>${escapeHtml(String(Math.round(num(h?.avgLatencyMs, 0))))}ms</dd></div>
          <div><dt>Reliable</dt><dd>${escapeHtml(relText)}</dd></div>
        </dl>
        ${reasons.length ? `<p class="sub">${escapeHtml(reasons.join(' · '))}</p>` : ''}
      </article>`;
    }).join('');
  return `<div class="grid">${rows}</div>`;
}

function renderDefects(defects, nextMoves) {
  if (!defects.length) {
    return '<p class="empty-state">No defects were found. Every definition parsed and every grant is reachable.</p>';
  }
  const items = defects
    .slice()
    .sort((a, b) => (SEVERITY_ORDER[String(a?.severity).toLowerCase()] ?? 3) - (SEVERITY_ORDER[String(b?.severity).toLowerCase()] ?? 3))
    .map((d) => {
      const style = severityStyle(d.severity);
      const match = nextMoves.find((m) => m && m.reason && m.reason === d.detail);
      const fix = match ? match.action : (FIX_BY_KIND[d.kind] || 'Open the definition and repair the frontmatter.');
      const haystack = [d.kind, d.agent, d.detail, d.evidence, d.severity].filter(Boolean).join(' ');
      return `<li class="row" data-filter-item data-filter-text="${escapeHtml(haystack)}" style="--row-accent:${style.dot}">
        <div class="row-head">
          <span class="kind">${escapeHtml(d.kind || 'defect')}</span>
          ${chip('severity', style.label, style)}
        </div>
        <p class="detail">${escapeHtml(d.agent || 'unknown agent')} — ${escapeHtml(d.detail || '')}</p>
        <p class="fix"><b>Fix:</b> ${escapeHtml(fix)}</p>
      </li>`;
    }).join('');
  return `<ul class="rows" data-filter-group="defects">${items}</ul>
    <p class="empty-state" data-filter-empty${defects.length ? ' hidden' : ''}>No defect matches that filter.</p>`;
}

function renderMoves(nextMoves) {
  if (!nextMoves.length) {
    return '<p class="empty-state">Nothing to do right now. The team is clean and no lane is waiting.</p>';
  }
  const items = nextMoves.map((m) => {
    const action = String(m?.action || '');
    const isCommand = looksLikeCommand(action);
    const label = isCommand ? 'Copy command' : 'Copy action';
    const command = isCommand
      ? `<code class="command">${escapeHtml(action)}</code>`
      : `<p class="detail">${escapeHtml(action)}</p>`;
    return `<li>
      <div class="move-head">
        <span class="kind">${escapeHtml(m?.kind || 'move')}</span>
        <button type="button" class="btn" data-copy="${escapeHtml(action)}" data-copy-label="${escapeHtml(label)}" aria-label="${escapeHtml(`${label} for ${m?.target || 'this move'}`)}">${escapeHtml(label)}</button>
      </div>
      <p class="target">${escapeHtml(m?.target || '')}</p>
      ${command}
      <p class="reason">${escapeHtml(m?.reason || '')}</p>
    </li>`;
  }).join('');
  return `<ol class="rows moves">${items}</ol>`;
}

// ---------------------------------------------------------------------------
// Inline script
// ---------------------------------------------------------------------------

// The `type` attribute is explicit on purpose: it keeps the literal sequence "<script>" out of the
// generated document, so a whole-document "no unescaped <script> anywhere" check stays meaningful.
const SCRIPT = `
(function () {
  var reduceMotion = false;
  try {
    reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (e) { reduceMotion = false; }

  var input = document.getElementById('team-filter');
  var clear = document.getElementById('filter-clear');
  var status = document.getElementById('filter-status');
  var groups = Array.prototype.slice.call(document.querySelectorAll('[data-filter-group]'));

  function countGroup(name) {
    var group = document.querySelector('[data-filter-group="' + name + '"]');
    if (!group) return { name: name, visible: 0, total: 0 };
    var items = group.querySelectorAll('[data-filter-item]');
    var visible = 0;
    for (var i = 0; i < items.length; i++) { if (!items[i].hidden) visible++; }
    return { name: name, visible: visible, total: items.length };
  }

  function phrase(group) {
    if (group.total === 0) return 'no ' + group.name;
    return group.visible + ' of ' + group.total + ' ' + group.name;
  }

  function applyFilter() {
    var q = (input && input.value ? input.value : '').trim().toLowerCase();
    var roster = document.getElementById('roster');
    if (roster && q !== '' && !roster.open) roster.open = true;
    for (var g = 0; g < groups.length; g++) {
      var group = groups[g];
      var items = group.querySelectorAll('[data-filter-item]');
      var visible = 0;
      for (var i = 0; i < items.length; i++) {
        var hay = (items[i].getAttribute('data-filter-text') || '').toLowerCase();
        var hit = q === '' || hay.indexOf(q) !== -1;
        items[i].hidden = !hit;
        if (hit) visible++;
      }
      var empty = group.parentNode ? group.parentNode.querySelector('[data-filter-empty]') : null;
      if (empty && empty.getAttribute('data-filter-empty') !== 'true') {
        empty.hidden = visible !== 0;
      }
    }
    if (status) {
      var a = countGroup('agents');
      var d = countGroup('defects');
      status.textContent = 'Showing ' + a.visible + ' of ' + a.total + ' agents and ' + d.visible + ' of ' + d.total + ' defects.';
    }
  }

  if (input) {
    input.addEventListener('input', applyFilter);
    input.addEventListener('search', applyFilter);
  }
  if (clear) {
    clear.addEventListener('click', function () {
      if (input) { input.value = ''; input.focus(); }
      applyFilter();
    });
  }
  applyFilter();

  function legacyCopy(text, done) {
    var area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', 'readonly');
    area.style.position = 'fixed';
    area.style.top = '-1000px';
    document.body.appendChild(area);
    area.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    document.body.removeChild(area);
    done(ok);
  }

  document.addEventListener('click', function (event) {
    var target = event.target;
    if (!target || typeof target.closest !== 'function') return;
    var button = target.closest('[data-copy]');
    if (!button) return;
    var text = button.getAttribute('data-copy') || '';
    var original = button.getAttribute('data-copy-label') || 'Copy';
    var live = document.getElementById('copy-status');

    function finish(ok) {
      button.textContent = ok ? 'Copied' : 'Copy failed';
      if (!reduceMotion) button.classList.add('is-copied');
      if (live) {
        live.textContent = ok
          ? (original + ' copied to the clipboard.')
          : 'The clipboard is unavailable. Select the command and copy it manually.';
      }
      window.setTimeout(function () {
        button.textContent = original;
        button.classList.remove('is-copied');
      }, 1800);
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { finish(true); }, function () { legacyCopy(text, finish); });
    } else {
      legacyCopy(text, finish);
    }
  });
})();
`;

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

/**
 * Render the team snapshot as one self-contained HTML page.
 *
 * @param {Object} snapshot  A snapshot shaped like {@link import('./team-panel.mjs').buildTeamSnapshot}.
 * @param {{teamName?: string, title?: string}} [opts]
 * @returns {string} a complete HTML document.
 */
export function renderDashboard(snapshot, opts = {}) {
  const s = snapshot && typeof snapshot === 'object' ? snapshot : {};
  const teamName = String(opts.teamName ?? s.teamName ?? s.team?.name ?? 'My AI Team');
  const agents = asArray(s.agents);
  const seats = asArray(s.seats);
  const defects = asArray(s.defects);
  const nextMoves = asArray(s.nextMoves);
  const health = asMap(s.providerHealth);
  const tasks = s.tasks && typeof s.tasks === 'object' ? s.tasks : {};
  const liveSessions = s.liveSessions instanceof Map ? s.liveSessions.size : Object.keys(s.liveSessions || {}).length;

  const activeSeats = seats.filter((x) => x?.state === 'ACTIVE').length;
  const withProtocol = agents.filter((a) => Array.isArray(a?.skills) && a.skills.includes(PROTOCOL_SKILL)).length;
  const unavailable = [...health.entries()]
    .filter(([, h]) => UNAVAILABLE_HEALTH.has(String(h?.health?.state || '').toLowerCase()))
    .map(([key]) => key);

  const { line, stats } = renderVerdict({
    teamName, agents, seats, activeSeats, withProtocol, unavailable, tasks,
    defectCount: defects.length, liveSessions,
  });

  const title = opts.title ? String(opts.title) : `Team Dashboard — ${teamName}`;
  const eyebrow = teamName.toLowerCase() === 'my ai team' ? 'My AI Team' : `My AI Team · ${teamName}`;
  const generated = s.generatedAt ? new Date(s.generatedAt) : null;
  const stamp = generated && !Number.isNaN(generated.getTime())
    ? generated.toISOString().replace('T', ' ').replace(/\.\d+Z$/, ' UTC')
    : 'unknown';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="generator" content="hq team-dashboard">
<title>${escapeHtml(title)}</title>
<style>${CSS}</style>
</head>
<body>
<a class="skip-link" href="#main">Skip to the dashboard</a>
<header class="masthead">
  <div class="shell">
    <p class="eyebrow">${escapeHtml(eyebrow)}</p>
    <h1>Team dashboard</h1>
    <p class="verdict">${line}</p>
    <dl class="stats">${stats}</dl>
  </div>
</header>
<main id="main" class="shell">
  <div class="toolbar">
    <label class="field" for="team-filter">
      <span class="field-label">Filter agents and defects</span>
      <input id="team-filter" type="search" placeholder="name, kind or detail" autocomplete="off" spellcheck="false" aria-controls="agents defects">
    </label>
    <button type="button" class="btn quiet" id="filter-clear">Clear filter</button>
    <p class="filter-status" id="filter-status" role="status" aria-live="polite">Showing every agent and every defect.</p>
  </div>

  <section class="panel" id="agents" aria-labelledby="h-agents">
    <h2 id="h-agents">Agents <span class="count">${escapeHtml(String(agents.length))}</span></h2>
    ${renderAgents(agents)}
  </section>

  <section class="panel" id="seats" aria-labelledby="h-seats">
    <h2 id="h-seats">Seats <span class="count">${escapeHtml(String(seats.length))}</span></h2>
    ${renderSeats(seats)}
  </section>

  <section class="panel" id="providers" aria-labelledby="h-providers">
    <h2 id="h-providers">Providers <span class="count">${escapeHtml(String(health.size))}</span></h2>
    ${renderProviders(health)}
  </section>

  <section class="panel" id="defects" aria-labelledby="h-defects">
    <h2 id="h-defects">Defects <span class="count">${escapeHtml(String(defects.length))}</span></h2>
    ${renderDefects(defects, nextMoves)}
  </section>

  <section class="panel" id="moves" aria-labelledby="h-moves">
    <h2 id="h-moves">Next moves <span class="count">${escapeHtml(String(nextMoves.length))}</span></h2>
    ${renderMoves(nextMoves)}
  </section>
</main>
<p id="copy-status" class="visually-hidden" role="status" aria-live="polite"></p>
<footer class="shell foot">
  <p>Generated ${escapeHtml(stamp)} · read-only view · HQ never sends, approves or executes from this page.</p>
</footer>
<script type="text/javascript">${SCRIPT}</script>
</body>
</html>
`;
}
