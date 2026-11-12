// hq/lib/home.mjs — offline HTML home page for the Owner persona.
//
// renderHome is pure and self-contained: one read-only import for the VIVIM
// vocabulary, no network, no writes. The caller supplies every fact, including
// `generatedAt`, which is the only clock this module reads. Same input in,
// byte-identical HTML out.
//
// The My Media Library section is the one exception: when the caller does not
// supply `media` facts, the VIVIM media store is read read-only from disk
// (never written, never contacted). A missing or corrupt store renders as a
// clean empty state and never throws. Callers pass `media` (a snapshot) or
// `mediaStore` (a store directory) to stay fully hermetic.

import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { memoryTierLabel } from './nomenclature.mjs';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const ATTENTION_LABELS = {
  dirty: 'Uncommitted changes',
  staleindex: 'Stale index',
  'stale-index': 'Stale index',
  'stale_index': 'Stale index',
  aheadbehind: 'Out of sync',
  'ahead-behind': 'Out of sync',
  'ahead_behind': 'Out of sync',
  missingdocs: 'Missing docs',
  'missing-docs': 'Missing docs',
  'missing_docs': 'Missing docs',
  staledocs: 'Docs out of date',
  'stale-docs': 'Docs out of date',
  'stale_docs': 'Docs out of date',
  todos: 'Open todo',
  todo: 'Open todo',
};

const ATTENTION_LIMIT = 24;
const ACTION_LIMIT = 12;
const RECENT_LIMIT = 30;
const NOTE_LIMIT = 40;
const NOTE_TEXT_LIMIT = 800;
const LANGUAGE_LIMIT = 6;

const MEDIA_ROWS_LIMIT = 25;
const MEDIA_LIBRARY_STATES = ['dispatched', 'folder-detected', 'complete', 'seeded'];
const MEDIA_STORE_DEFAULT = 'C:/VIVIM/channel/vivim/torrent-store';

const STYLE = `
*,*::before,*::after{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--bg);color:var(--ink);font-family:system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;font-size:16px;line-height:1.55}
:root{
  color-scheme:light dark;
  --bg:#f7f6f2;
  --panel:#fffefb;
  --ink:#1f1d19;
  --muted:#5c584f;
  --line:#e3ded2;
  --line-strong:#cfc8b8;
  --accent:#2f6b52;
  --track:#ece8dd;
  --warn:#98501c;
  --warn-soft:#fbeee2;
  --info:#31577f;
  --info-soft:#e8eff7;
  --good:#2c6b46;
  --good-soft:#e6f2ea;
  --muted-soft:#efece4;
  --focus:#6b3fbf;
  --shadow:0 1px 2px rgba(31,29,25,.06);
  --radius:14px;
  --gap:clamp(12px,2vw,20px);
}
@media (prefers-color-scheme:dark){
  :root{
    color-scheme:dark;
    --bg:#141416;
    --panel:#1c1c20;
    --ink:#edece8;
    --muted:#a9a59b;
    --line:#2e2e34;
    --line-strong:#45454d;
    --accent:#8bc9a8;
    --track:#2b2b31;
    --warn:#e6b083;
    --warn-soft:#3a2a1c;
    --info:#a8c6ea;
    --info-soft:#1f2b3a;
    --good:#96d6b0;
    --good-soft:#1e3328;
    --muted-soft:#26262b;
    --focus:#c3a6ff;
    --shadow:none;
  }
}
h1,h2,h3,p,ul,ol,dl,dd,figure{margin:0}
ul,ol{padding:0;list-style:none}
code{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:.9em;overflow-wrap:anywhere}
a{color:var(--accent)}
:focus-visible{outline:2px solid var(--focus);outline-offset:2px;border-radius:6px}
.wrap{width:100%;max-width:1180px;margin:0 auto;padding:clamp(16px,4vw,40px)}
.skip{position:absolute;left:-9999px;top:0;background:var(--panel);color:var(--ink);padding:10px 14px;border-radius:8px;border:1px solid var(--line-strong)}
.skip:focus{position:fixed;left:16px;top:16px;z-index:20}
.top{display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:var(--gap)}
.top-title{min-width:0}
.eyebrow{font-size:.76rem;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);font-weight:700}
h1{font-size:clamp(1.6rem,4vw,2.35rem);line-height:1.15;letter-spacing:-.02em;overflow-wrap:anywhere}
.world-name{margin-top:2px;font-weight:650;color:var(--muted);overflow-wrap:anywhere}
.root{margin-top:6px;color:var(--muted);font-size:.82rem}
.top-meta{display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px;font-size:.84rem;color:var(--muted)}
.badge{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--good);color:var(--good);background:var(--good-soft);border-radius:999px;padding:3px 11px;font-weight:650;font-size:.78rem}
.badge::before{content:"";width:7px;height:7px;border-radius:50%;background:currentColor}
.section{margin-top:clamp(26px,4.5vw,44px)}
.section-head{display:flex;flex-wrap:wrap;align-items:baseline;gap:4px 12px;justify-content:space-between}
h2{font-size:clamp(1.2rem,2.4vw,1.5rem);letter-spacing:-.01em}
h3{font-size:1.02rem;line-height:1.3;overflow-wrap:anywhere}
.hint{color:var(--muted);font-size:.86rem}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin-top:14px}
.stat{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:12px 14px}
.stat dt{font-size:.76rem;letter-spacing:.04em;text-transform:uppercase;color:var(--muted);font-weight:650}
.stat dd{margin:2px 0 0;font-size:1.45rem;font-weight:650;font-variant-numeric:tabular-nums}
.cards{display:grid;grid-template-columns:1fr;gap:12px;margin-top:14px}
.card{background:var(--panel);border:1px solid var(--line);border-radius:var(--radius);padding:16px;box-shadow:var(--shadow);transition:border-color .15s ease}
.card:hover{border-color:var(--line-strong)}
.card-head{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:6px 10px}
.kicker{font-size:.72rem;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);font-weight:700;margin-bottom:2px}
.detail{margin-top:6px;color:var(--muted);font-size:.9rem;overflow-wrap:anywhere}
.where{margin-top:8px;font-size:.8rem;color:var(--muted)}
.pill{display:inline-flex;align-items:center;border-radius:999px;padding:2px 9px;font-size:.73rem;font-weight:650;white-space:nowrap;border:1px solid transparent}
.pill--warn{background:var(--warn-soft);color:var(--warn);border-color:var(--warn)}
.pill--info{background:var(--info-soft);color:var(--info);border-color:var(--info)}
.pill--good{background:var(--good-soft);color:var(--good);border-color:var(--good)}
.pill--muted{background:var(--muted-soft);color:var(--muted);border-color:var(--line-strong)}
.actions{display:grid;gap:10px;margin-top:14px}
.action{background:var(--panel);border:1px solid var(--line);border-left:3px solid var(--accent);border-radius:10px;padding:11px 14px}
.action .reason{margin-top:3px;color:var(--muted);font-size:.88rem;overflow-wrap:anywhere}
.projects{display:grid;grid-template-columns:1fr;gap:14px;margin-top:14px}
.project{display:flex;flex-direction:column;gap:10px;min-width:0}
.project .path{color:var(--muted);font-size:.82rem}
.facts{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px 14px;font-size:.85rem}
.facts dt{font-size:.72rem;letter-spacing:.05em;text-transform:uppercase;color:var(--muted);font-weight:650}
.facts dd{margin:1px 0 0;overflow-wrap:anywhere}
.commit-subject{display:block}
.commit-date{display:block;color:var(--muted);font-size:.8rem}
.description{color:var(--muted);font-size:.9rem;overflow-wrap:anywhere}
.langs{display:grid;gap:6px;margin-top:2px}
.lang{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:2px 10px;font-size:.82rem;align-items:baseline}
.lang-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.lang-count{color:var(--muted);font-variant-numeric:tabular-nums}
.lang-track{grid-column:1 / -1;height:5px;border-radius:999px;background:var(--track);overflow:hidden}
.lang-fill{display:block;height:100%;border-radius:inherit;background:var(--accent)}
.lang-more{font-size:.78rem;color:var(--muted)}
.tags{display:flex;flex-wrap:wrap;gap:6px}
.tag{border:1px solid var(--line-strong);border-radius:999px;padding:1px 9px;font-size:.76rem;color:var(--muted)}
.timeline{position:relative;margin:16px 0 0 6px;border-left:2px solid var(--line);display:grid}
.event{position:relative;padding:0 0 18px 20px}
.event:last-child{padding-bottom:0}
.event::before{content:"";position:absolute;left:-6px;top:6px;width:10px;height:10px;border-radius:50%;background:var(--panel);border:2px solid var(--accent)}
.event time{font-size:.78rem;color:var(--muted);font-variant-numeric:tabular-nums}
.event h3{margin-top:1px}
.event-meta{margin-top:3px;font-size:.8rem;color:var(--muted);overflow-wrap:anywhere}
.note-groups{display:grid;gap:18px;margin-top:14px}
.note-group h3{display:flex;align-items:baseline;gap:8px}
.count{font-size:.78rem;font-weight:600;color:var(--muted)}
.notes{display:grid;gap:8px;margin-top:8px}
.note{background:var(--panel);border:1px solid var(--line);border-left:3px solid var(--accent);border-radius:10px;padding:11px 14px}
.note-text{white-space:pre-wrap;overflow-wrap:anywhere}
.note-meta{margin-top:5px;font-size:.78rem;color:var(--muted);overflow-wrap:anywhere}
.empty{margin-top:12px;border:1px dashed var(--line-strong);border-radius:12px;padding:16px;color:var(--muted)}
.more{margin-top:10px;font-size:.82rem;color:var(--muted)}
.footer{margin-top:clamp(32px,6vw,56px);padding-top:18px;border-top:1px solid var(--line);display:flex;flex-wrap:wrap;gap:8px 20px;justify-content:space-between;font-size:.84rem;color:var(--muted)}
.privacy{color:var(--ink);font-weight:650}
@media (min-width:768px){
  .cards{grid-template-columns:repeat(2,minmax(0,1fr))}
  .projects{grid-template-columns:repeat(2,minmax(0,1fr))}
}
@media (min-width:1280px){
  .projects{grid-template-columns:repeat(3,minmax(0,1fr))}
  .cards{grid-template-columns:repeat(3,minmax(0,1fr))}
}
@media (prefers-reduced-motion:reduce){
  *{transition:none !important;animation:none !important;scroll-behavior:auto !important}
}
`;

// ---------- value normalization and escaping ----------

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function escapeHtml(value) {
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

// Canonical one-line text: whitespace collapsed, trimmed, ellipsis on overflow.
function clip(value, max) {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim();
  if (text.length <= max) return text;
  return text.slice(0, Math.max(0, max - 1)).trimEnd() + '…';
}

// Multi-line-safe cap, used for notes so the owner's line breaks survive.
function clipText(value, max) {
  const text = String(value ?? '');
  if (text.length <= max) return text;
  return text.slice(0, Math.max(0, max - 1)) + '…';
}

function toCount(value) {
  if (value === true) return 1;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

function pickCount(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : fallback;
}

function fmtCount(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '0';
  const rounded = Math.trunc(n);
  const grouped = String(Math.abs(rounded)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return (rounded < 0 ? '-' : '') + grouped;
}

function plural(n, one, many) {
  return `${fmtCount(n)} ${n === 1 ? one : many}`;
}

const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?)?\s*(Z|[+-]\d{2}:?\d{2})?$/;

// parseDate — ISO-8601 strings are read as UTC (or their explicit offset), so
// the display never depends on the machine timezone. Non-ISO values fall back
// to the platform parser; invalid input yields null.
function parseDate(value) {
  if (value instanceof Date) {
    const ms = value.getTime();
    return Number.isFinite(ms) ? new Date(ms) : null;
  }
  if (typeof value === 'number') {
    const d = new Date(value);
    return Number.isFinite(d.getTime()) ? d : null;
  }
  if (typeof value !== 'string') return null;
  const text = value.trim();
  if (!text) return null;
  const match = ISO_RE.exec(text);
  if (!match) {
    const d = new Date(text);
    return Number.isFinite(d.getTime()) ? d : null;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4] ?? 0);
  const minute = Number(match[5] ?? 0);
  const second = Number(match[6] ?? 0);
  const millis = Number((match[7] ?? '0').padEnd(3, '0').slice(0, 3));
  let stamp = Date.UTC(year, month - 1, day, hour, minute, second, millis);
  const zone = match[8];
  if (zone && zone !== 'Z') {
    const sign = zone[0] === '-' ? -1 : 1;
    const digits = zone.slice(1).replace(':', '');
    const offset = Number(digits.slice(0, 2)) * 60 + Number(digits.slice(2, 4));
    stamp -= sign * offset * 60000;
  }
  return Number.isFinite(stamp) ? new Date(stamp) : null;
}

function formatDate(value) {
  const d = parseDate(value);
  if (!d) return clip(value, 60);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

function formatDateTime(value) {
  const d = parseDate(value);
  if (!d) return clip(value, 60);
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  return `${formatDate(d)}, ${hh}:${mm} UTC`;
}

function isoAttr(value) {
  const d = parseDate(value);
  return d ? d.toISOString() : '';
}

// ---------- derived view models ----------

function normalizeLanguages(languages) {
  const rows = asArray(languages)
    .map((entry) => {
      const item = entry && typeof entry === 'object' ? entry : {};
      return { lang: clip(item.lang ?? item.name, 40), count: toCount(item.count) };
    })
    .filter((row) => row.lang && row.count > 0);
  rows.sort((a, b) => (b.count - a.count) || (a.lang < b.lang ? -1 : a.lang > b.lang ? 1 : 0));
  return rows;
}

function normalizeTags(tags) {
  const list = Array.isArray(tags) ? tags : (tags ? [tags] : []);
  return list
    .map((tag) => clip(tag, 32))
    .filter(Boolean)
    .slice(0, 8);
}

function humanKind(kind) {
  const key = clip(kind, 40);
  if (!key) return 'Heads up';
  const mapped = ATTENTION_LABELS[key] || ATTENTION_LABELS[key.toLowerCase()];
  if (mapped) return mapped;
  const spaced = key
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .toLowerCase();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function projectStatus(project) {
  const dirty = toCount(project.dirty);
  const ahead = toCount(project.ahead);
  const behind = toCount(project.behind);
  if (dirty > 0) return { tone: 'warn', label: 'Uncommitted changes' };
  if (ahead > 0 && behind > 0) return { tone: 'info', label: `${fmtCount(ahead)} ahead, ${fmtCount(behind)} behind` };
  if (ahead > 0) return { tone: 'info', label: `Ahead by ${fmtCount(ahead)}` };
  if (behind > 0) return { tone: 'info', label: `Behind by ${fmtCount(behind)}` };
  if (project.branch || project.head || project.lastCommit) return { tone: 'good', label: 'Up to date' };
  return { tone: 'muted', label: 'Not tracked yet' };
}

// ---------- section renderers ----------

function renderStats(items) {
  return `<dl class="stats">${items.map(([label, value]) =>
    `<div class="stat"><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(fmtCount(value))}</dd></div>`,
  ).join('')}</dl>`;
}

// Capability counts are optional: without scanned tables the caller supplies
// nothing and the section disappears entirely.
function normalizeCapabilitySummary(value) {
  const source = value && typeof value === 'object' ? value : null;
  if (!source || source.available === false) return null;
  const counts = source.counts && typeof source.counts === 'object' ? source.counts : {};
  return {
    sources: toCount(source.sources ?? source.sourceCount),
    packages: toCount(source.packages ?? source.packageCount ?? source.sourcePackages ?? counts.packages),
    proposed: toCount(source.proposed ?? source.proposedContracts ?? counts.proposed),
    approved: toCount(source.approved ?? source.approvedContracts ?? counts.approved),
  };
}

function renderCapabilitySummary(summary) {
  if (!summary) return '';
  const approvedLine = summary.approved === 0
    ? '0 approved. HQ executes nothing from this registry.'
    : `${plural(summary.approved, 'contract is', 'contracts are')} approved; everything else stays a candidate.`;
  return [
    '<section class="section" aria-labelledby="capabilities-heading">',
    '<div class="section-head">',
    '<h2 id="capabilities-heading">Capabilities</h2>',
    '<p class="hint">What HQ found in scanned dependency trees. Candidates only.</p>',
    '</div>',
    renderStats([
      ['Sources', summary.sources],
      ['Packages', summary.packages],
      ['Proposed contracts', summary.proposed],
    ]),
    `<p class="empty">${escapeHtml(approvedLine)}</p>`,
    '</section>',
  ].join('\n');
}

// ---------- My Media Library (read-only VIVIM media store) ----------

function readMediaCollection(path) {
  try {
    const parsed = JSON.parse(readFileSync(path, 'utf8'));
    if (!parsed || typeof parsed !== 'object') return [];
    if (Array.isArray(parsed.entries)) return parsed.entries;
    if (Array.isArray(parsed)) return parsed;
    return [];
  } catch {
    return [];
  }
}

function loadMediaSnapshot(storeDir) {
  const dir = typeof storeDir === 'string' && storeDir.trim() ? storeDir : MEDIA_STORE_DEFAULT;
  try {
    if (!existsSync(dir) || !statSync(dir).isDirectory()) return { storeFound: false };
  } catch {
    return { storeFound: false };
  }
  return {
    storeFound: true,
    library: { entries: readMediaCollection(join(dir, 'library.json')) },
    releases: { entries: readMediaCollection(join(dir, 'releases.json')) },
    wanted: { entries: readMediaCollection(join(dir, 'wanted.json')) },
    favorites: { entries: readMediaCollection(join(dir, 'favorites.json')) },
  };
}

// mediaEpisodeLabel — "next: S06E06 · 12 Nov 2026" for shows with an upcoming
// airing in the releases store, "no upcoming episode" otherwise.
function mediaEpisodeLabel(release) {
  const source = release && typeof release === 'object' ? release : null;
  const next = source && source.next && typeof source.next === 'object' ? source.next : null;
  const season = toCount(next?.season);
  const number = toCount(next?.number);
  if (!season || !number) return 'no upcoming episode';
  const code = `S${String(season).padStart(2, '0')}E${String(number).padStart(2, '0')}`;
  const air = formatDate(next.airstamp);
  return air ? `next: ${code} · ${air}` : `next: ${code}`;
}

// normalizeMedia — turns a media store snapshot ({storeFound, library,
// releases, wanted, favorites} collections) into the owner view model. Every
// field is coerced defensively; a corrupt snapshot yields zeros, not throws.
function normalizeMedia(value) {
  const source = value && typeof value === 'object' ? value : {};
  if (source.storeFound === false) {
    return {
      storeFound: false,
      trackedCount: 0, libraryTotal: 0, onDiskCount: 0, favoritesCount: 0,
      byState: { dispatched: 0, 'folder-detected': 0, complete: 0, seeded: 0 },
      rows: [], rowsHidden: 0, shows: [], favorites: [],
    };
  }
  const libraryEntries = asArray(source.library?.entries ?? source.library);
  const releaseEntries = asArray(source.releases?.entries ?? source.releases);
  const wantedEntries = asArray(source.wanted?.entries ?? source.wanted);
  const favoriteEntries = asArray(source.favorites?.entries ?? source.favorites);

  const byState = { dispatched: 0, 'folder-detected': 0, complete: 0, seeded: 0 };
  const rows = libraryEntries.map((raw) => {
    const entry = raw && typeof raw === 'object' ? raw : {};
    const state = clip(entry.state, 24).toLowerCase() || 'seeded';
    if (state in byState) byState[state] += 1;
    return { title: clip(entry.title, 120), state, visits: toCount(entry.provenance?.visitCount) };
  }).filter((row) => row.title);
  rows.sort((a, b) => (b.visits - a.visits) || (a.title < b.title ? -1 : a.title > b.title ? 1 : 0));
  const shownRows = rows.slice(0, MEDIA_ROWS_LIMIT);

  const releaseByName = new Map();
  for (const raw of releaseEntries) {
    const entry = raw && typeof raw === 'object' ? raw : {};
    const key = clip(entry.title, 80).toLowerCase();
    if (key && !releaseByName.has(key)) releaseByName.set(key, entry);
  }
  const shows = wantedEntries.map((raw) => {
    const entry = raw && typeof raw === 'object' ? raw : {};
    const fallbackTitle = clip(entry.title, 90);
    const release = fallbackTitle ? releaseByName.get(fallbackTitle.toLowerCase()) : null;
    const name = release && clip(release.name, 90) ? clip(release.name, 90) : fallbackTitle;
    return { title: name || 'Tracked show', nextLabel: mediaEpisodeLabel(release) };
  });

  const favorites = favoriteEntries.map((raw) => {
    const entry = raw && typeof raw === 'object' ? raw : { title: raw };
    return { title: clip(entry.title ?? entry.id, 120) };
  }).filter((row) => row.title);

  const libraryTotal = libraryEntries.length;
  return {
    storeFound: true,
    trackedCount: wantedEntries.length,
    libraryTotal,
    onDiskCount: Math.max(0, libraryTotal - byState.seeded),
    favoritesCount: favorites.length,
    byState,
    rows: shownRows,
    rowsHidden: rows.length - shownRows.length,
    shows,
    favorites,
  };
}

// loadMediaLibrary — read-only store read for tests and diagnostics; returns
// the same view model the My Media Library section renders.
export function loadMediaLibrary(storeDir) {
  return normalizeMedia(loadMediaSnapshot(storeDir));
}

function renderMediaShow(show) {
  const source = show && typeof show === 'object' ? show : { title: show };
  const title = clip(source.title, 90) || 'Tracked show';
  const nextLabel = clip(source.nextLabel, 80) || 'no upcoming episode';
  const upcoming = nextLabel !== 'no upcoming episode';
  return `<article class="card">
    <div class="card-head">
      <h3>${escapeHtml(title)}</h3>
      <span class="pill pill--${upcoming ? 'info' : 'muted'}">${escapeHtml(nextLabel)}</span>
    </div>
  </article>`;
}

function renderMediaRow(row) {
  const source = row && typeof row === 'object' ? row : { title: row };
  const title = clip(source.title, 120) || '(untitled)';
  const state = clip(source.state, 24) || 'seeded';
  const visits = toCount(source.visits);
  const meta = [state, visits > 0 ? plural(visits, 'visit', 'visits') : ''].filter(Boolean);
  return `<li class="note">
    <p class="note-text">${escapeHtml(title)}</p>
    ${meta.length ? `<p class="note-meta">${escapeHtml(meta.join(' · '))}</p>` : ''}
  </li>`;
}

function renderMediaLibrary(media) {
  const data = media && typeof media === 'object' ? media : {};
  if (!data.storeFound) {
    return [
      '<section class="section" aria-labelledby="media-heading">',
      '<div class="section-head">',
      '<h2 id="media-heading">My Media Library</h2>',
      '<p class="hint">Tracked shows, the on-disk library, and favorites.</p>',
      '</div>',
      '<p class="empty">No media library on this machine yet. Track shows with hq media.</p>',
      '</section>',
    ].join('\n');
  }

  const shows = asArray(data.shows);
  const rows = asArray(data.rows);
  const favorites = asArray(data.favorites).map((raw) => {
    const favorite = raw && typeof raw === 'object' ? raw : { title: raw };
    return clip(favorite.title, 120);
  }).filter(Boolean);

  const stateTags = MEDIA_LIBRARY_STATES.map((state) =>
    `<li class="tag">${escapeHtml(`${fmtCount(toCount(data.byState?.[state]))} ${state}`)}</li>`,
  ).join('');

  return [
    '<section class="section" aria-labelledby="media-heading">',
    '<div class="section-head">',
    '<h2 id="media-heading">My Media Library</h2>',
    '<p class="hint">Tracked shows, the on-disk library, and favorites.</p>',
    '</div>',
    renderStats([
      ['Tracked', toCount(data.trackedCount)],
      ['In library', toCount(data.libraryTotal)],
      ['On disk', toCount(data.onDiskCount)],
      ['Favorites', toCount(data.favoritesCount)],
    ]),
    shows.length
      ? `<div class="cards">${shows.map(renderMediaShow).join('')}</div>`
      : '<p class="empty">No shows tracked yet. Add one with hq media.</p>',
    `<div class="note-groups"><div class="note-group" data-group="library">`,
    `<h3>Library <span class="count">${escapeHtml(fmtCount(toCount(data.libraryTotal)))}</span></h3>`,
    `<ul class="tags" aria-label="Library rows by state">${stateTags}</ul>`,
    rows.length
      ? `<ul class="notes">${rows.map(renderMediaRow).join('')}</ul>`
      : '<p class="empty">No titles in the library yet.</p>',
    toCount(data.rowsHidden) > 0
      ? `<p class="more">${escapeHtml(`and ${plural(toCount(data.rowsHidden), 'more title is', 'more titles are')} not shown here.`)}</p>`
      : '',
    '</div>',
    '<div class="note-group" data-group="favorites">',
    `<h3>Favorites <span class="count">${escapeHtml(fmtCount(favorites.length))}</span></h3>`,
    favorites.length
      ? `<ul class="notes">${favorites.map((title) =>
        `<li class="note"><p class="note-text">${escapeHtml(title)}</p></li>`,
      ).join('')}</ul>`
      : '<p class="empty">no favorites yet — add with hq media</p>',
    '</div></div>',
    '</section>',
  ].filter((line) => line !== '').join('\n');
}

function renderAttention(item, index) {
  const source = item && typeof item === 'object' ? item : { title: item };
  const kind = humanKind(source.kind);
  const title = clip(source.title, 120) || kind;
  const detail = clip(source.detail, 300);
  const project = clip(source.project, 80);
  return `<li class="card attention" data-kind="${escapeHtml(clip(source.kind, 40))}">
    <p class="kicker">${escapeHtml(kind)}</p>
    <h3>${escapeHtml(title)}</h3>
    ${detail ? `<p class="detail">${escapeHtml(detail)}</p>` : ''}
    ${project ? `<p class="where">${escapeHtml(project)}</p>` : ''}
  </li>`;
}

function renderAction(action) {
  const source = action && typeof action === 'object' ? action : { title: action };
  const kind = humanKind(source.kind);
  const title = clip(source.title, 120) || kind;
  const reason = clip(source.reason, 240);
  return `<li class="action">
    <p class="kicker">${escapeHtml(kind)}</p>
    <h3>${escapeHtml(title)}</h3>
    ${reason ? `<p class="reason">${escapeHtml(reason)}</p>` : ''}
  </li>`;
}

function renderLanguages(languages, projectName) {
  const rows = normalizeLanguages(languages);
  if (!rows.length) return '';
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  const shown = rows.slice(0, LANGUAGE_LIMIT);
  const items = shown.map((row) => {
    const percent = Math.max(2, Math.round((row.count / total) * 100));
    return `<li class="lang">
      <span class="lang-name">${escapeHtml(row.lang)}</span>
      <span class="lang-count">${escapeHtml(fmtCount(row.count))}</span>
      <span class="lang-track" aria-hidden="true"><span class="lang-fill" style="width:${percent}%"></span></span>
    </li>`;
  }).join('');
  const extra = rows.length - shown.length;
  return `<ul class="langs" aria-label="Languages in ${escapeHtml(projectName)}">${items}</ul>${
    extra > 0 ? `<p class="lang-more">and ${plural(extra, 'more language', 'more languages')}</p>` : ''
  }`;
}

function renderTags(tags, projectName) {
  const rows = normalizeTags(tags);
  if (!rows.length) return '';
  return `<ul class="tags" aria-label="Tags for ${escapeHtml(projectName)}">${rows.map((tag) =>
    `<li class="tag">${escapeHtml(tag)}</li>`,
  ).join('')}</ul>`;
}

function renderProject(project, index) {
  const source = project && typeof project === 'object' ? project : {};
  const name = clip(source.name, 80) || `Project ${index + 1}`;
  const path = clip(source.path, 160);
  const branch = clip(source.branch, 80);
  const tags = normalizeTags(source.tags);
  const description = clip(source.description, 280);
  const files = toCount(source.files);
  const symbols = toCount(source.symbols);
  const last = source.lastCommit && typeof source.lastCommit === 'object' ? source.lastCommit : {};
  const subject = clip(last.subject, 140);
  const dateLabel = formatDate(last.date);
  const status = projectStatus(source);
  const facts = [];

  facts.push(`<div><dt>Branch</dt><dd>${escapeHtml(branch || 'Not recorded')}</dd></div>`);
  if (subject || dateLabel) {
    facts.push(`<div><dt>Last commit</dt><dd>${
      subject ? `<span class="commit-subject">${escapeHtml(subject)}</span>` : ''
    }${dateLabel ? `<span class="commit-date">${escapeHtml(dateLabel)}</span>` : ''}</dd></div>`);
  }
  facts.push(`<div><dt>Size</dt><dd>${escapeHtml(`${plural(files, 'file', 'files')} · ${plural(symbols, 'symbol', 'symbols')}`)}</dd></div>`);

  return `<article class="card project" aria-labelledby="project-${index}-title">
    <div class="card-head">
      <h3 id="project-${index}-title">${escapeHtml(name)}</h3>
      <span class="pill pill--${status.tone}">${escapeHtml(status.label)}</span>
    </div>
    ${path ? `<p class="path"><code>${escapeHtml(path)}</code></p>` : ''}
    <dl class="facts">${facts.join('')}</dl>
    ${description ? `<p class="description">${escapeHtml(description)}</p>` : ''}
    ${renderLanguages(source.languages, name)}
    ${renderTags(tags, name)}
  </article>`;
}

function renderEvent(commit) {
  const source = commit && typeof commit === 'object' ? commit : {};
  const subject = clip(source.subject, 140) || 'Commit';
  const dateLabel = formatDate(source.date);
  const iso = isoAttr(source.date);
  const project = clip(source.project, 80);
  const author = clip(source.author, 60);
  const sha = clip(source.sha, 12);
  const meta = [project, author, sha].filter(Boolean);
  return `<li class="event">
    ${dateLabel ? `<time${iso ? ` datetime="${escapeHtml(iso)}"` : ''}>${escapeHtml(dateLabel)}</time>` : ''}
    <h3>${escapeHtml(subject)}</h3>
    ${meta.length ? `<p class="event-meta">${escapeHtml(meta.join(' · '))}</p>` : ''}
  </li>`;
}

function renderNote(note) {
  const source = note && typeof note === 'object' ? note : { text: note };
  const text = clipText(source.text, NOTE_TEXT_LIMIT) || '(empty note)';
  const project = clip(source.project, 80);
  const dateLabel = formatDate(source.updatedAt);
  const meta = [project, dateLabel].filter(Boolean);
  return `<li class="note">
    <p class="note-text">${escapeHtml(text)}</p>
    ${meta.length ? `<p class="note-meta">${escapeHtml(meta.join(' · '))}</p>` : ''}
  </li>`;
}

function noteTier(tier) {
  const key = String(tier ?? '').trim().toLowerCase();
  if (key === 'canon') return 'canon';
  if (key === 'later') return 'later';
  return 'now';
}

// ---------- public entry point ----------

export function renderHome(input = {}) {
  const data = input && typeof input === 'object' ? input : {};
  const workspace = data.workspace && typeof data.workspace === 'object' ? data.workspace : {};
  const brief = data.brief && typeof data.brief === 'object' ? data.brief : {};
  const stats = brief.stats && typeof brief.stats === 'object' ? brief.stats : {};
  const projectList = asArray(data.projects);
  const attention = asArray(brief.needsAttention);
  const nextActions = asArray(brief.nextActions);
  const recentCommits = asArray(data.recent);
  const noteList = asArray(data.notes);
  const capabilitySummary = normalizeCapabilitySummary(data.capabilities ?? data.capabilityStatus);
  const media = normalizeMedia(data.media !== undefined ? data.media : loadMediaSnapshot(data.mediaStore));

  const wsName = clip(workspace.name, 80);
  const wsRoot = clip(workspace.root, 240);

  const totalFiles = projectList.reduce((sum, project) => sum + toCount(project?.files), 0);
  const totalSymbols = projectList.reduce((sum, project) => sum + toCount(project?.symbols), 0);
  const dirtyCount = projectList.filter((project) => toCount(project?.dirty) > 0).length;

  const statItems = [
    ['Projects', pickCount(stats.projects, projectList.length)],
    ['Files', pickCount(stats.files, totalFiles)],
    ['Symbols', pickCount(stats.symbols, totalSymbols)],
    ['Commits', pickCount(stats.commits, recentCommits.length)],
    ['Uncommitted work', pickCount(stats.dirty, dirtyCount)],
    ['Needs attention', pickCount(stats.attention, attention.length)],
  ];

  const generatedLabel = formatDateTime(data.generatedAt);
  const generatedIso = isoAttr(data.generatedAt);
  const generatedHtml = generatedLabel
    ? `Generated ${generatedIso
      ? `<time datetime="${escapeHtml(generatedIso)}">${escapeHtml(generatedLabel)}</time>`
      : `<span>${escapeHtml(generatedLabel)}</span>`}`
    : 'Generated locally';

  const shownAttention = attention.slice(0, ATTENTION_LIMIT);
  const attentionOverflow = attention.length - shownAttention.length;
  const shownActions = nextActions.slice(0, ACTION_LIMIT);
  const actionOverflow = nextActions.length - shownActions.length;
  const shownRecent = recentCommits.slice(0, RECENT_LIMIT);
  const recentOverflow = recentCommits.length - shownRecent.length;

  const notesByTier = { now: [], later: [], canon: [] };
  for (const note of noteList) {
    if (notesByTier[noteTier(note?.tier)] !== undefined) {
      notesByTier[noteTier(note?.tier)].push(note);
    }
  }
  let noteTotal = 0;
  const noteGroups = [
    ['now'],
    ['later'],
    ['canon'],
  ].map(([tier]) => {
    const label = memoryTierLabel(tier);
    const items = notesByTier[tier].slice(0, NOTE_LIMIT - noteTotal);
    noteTotal += items.length;
    return { tier, label, items, hidden: notesByTier[tier].length - items.length };
  }).filter((group) => group.items.length > 0);

  const html = [
    '<!doctype html>',
    '<html lang="en">',
    '<head>',
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    '<meta name="color-scheme" content="light dark">',
    `<title>${escapeHtml(wsName ? `My World — ${wsName}` : 'My World — HQ home')}</title>`,
    `<style>${STYLE}</style>`,
    '</head>',
    '<body>',
    '<a class="skip" href="#main">Skip to content</a>',
    '<header class="top wrap">',
    '<div class="top-title">',
    '<p class="eyebrow">Local workspace</p>',
    '<h1>My World</h1>',
    wsName ? `<p class="world-name">${escapeHtml(wsName)}</p>` : '',
    wsRoot ? `<p class="root">Workspace folder <code>${escapeHtml(wsRoot)}</code></p>` : '',
    '</div>',
    '<div class="top-meta">',
    '<span class="badge">Local only</span>',
    `<p class="generated">${generatedHtml}</p>`,
    '</div>',
    '</header>',
    '<main id="main" class="wrap" tabindex="-1">',

    '<section class="section" aria-labelledby="summary-heading">',
    '<div class="section-head">',
    '<h2 id="summary-heading">Progress Report</h2>',
    '<p class="hint">A quick count of what is in this workspace.</p>',
    '</div>',
    renderStats(statItems),
    '</section>',

    renderCapabilitySummary(capabilitySummary),

    '<section class="section" aria-labelledby="attention-heading">',
    '<div class="section-head">',
    '<h2 id="attention-heading">Needs attention</h2>',
    '<p class="hint">Things HQ noticed while reading your folders.</p>',
    '</div>',
    shownAttention.length
      ? `<ul class="cards">${shownAttention.map(renderAttention).join('')}</ul>`
      : '<p class="empty">Nothing needs your attention right now.</p>',
    attentionOverflow > 0
      ? `<p class="more">${escapeHtml(`${plural(attentionOverflow, 'more item is', 'more items are')} not shown here.`)}</p>`
      : '',
    '</section>',

    '<section class="section" aria-labelledby="actions-heading">',
    '<div class="section-head">',
    '<h2 id="actions-heading">What to do next</h2>',
    '<p class="hint">Small steps that keep things tidy.</p>',
    '</div>',
    shownActions.length
      ? `<ul class="actions">${shownActions.map(renderAction).join('')}</ul>`
      : '<p class="empty">No suggestions right now.</p>',
    actionOverflow > 0
      ? `<p class="more">${escapeHtml(`${plural(actionOverflow, 'more suggestion is', 'more suggestions are')} not shown here.`)}</p>`
      : '',
    '</section>',

    '<section class="section" aria-labelledby="projects-heading">',
    '<div class="section-head">',
    '<h2 id="projects-heading">My Spaces</h2>',
    `<p class="hint">${escapeHtml(`${plural(projectList.length, 'project', 'projects')} tracked locally.`)}</p>`,
    '</div>',
    projectList.length
      ? `<div class="projects">${projectList.map(renderProject).join('')}</div>`
      : '<p class="empty">No spaces are tracked yet.</p>',
    '</section>',

    '<section class="section" aria-labelledby="recent-heading">',
    '<div class="section-head">',
    '<h2 id="recent-heading">Activity Record</h2>',
    '<p class="hint">Newest commits first.</p>',
    '</div>',
    shownRecent.length
      ? `<ol class="timeline" aria-label="Recent commits">${shownRecent.map(renderEvent).join('')}</ol>`
      : '<p class="empty">No recent commits yet.</p>',
    recentOverflow > 0
      ? `<p class="more">${escapeHtml(`${plural(recentOverflow, 'older commit is', 'older commits are')} not shown here.`)}</p>`
      : '',
    '</section>',

    '<section class="section" aria-labelledby="notes-heading">',
    '<div class="section-head">',
    '<h2 id="notes-heading">Memory</h2>',
    '<p class="hint">Personal memory, grouped by how soon it matters.</p>',
    '</div>',
    noteGroups.length
      ? `<div class="note-groups">${noteGroups.map((group) => `<div class="note-group" data-tier="${group.tier}">
    <h3>${escapeHtml(group.label)} <span class="count">${escapeHtml(fmtCount(group.items.length))}</span></h3>
    <ul class="notes">${group.items.map(renderNote).join('')}</ul>
    ${group.hidden > 0 ? `<p class="more">${escapeHtml(`${plural(group.hidden, 'more note is', 'more notes are')} not shown here.`)}</p>` : ''}
  </div>`).join('')}</div>`
      : '<p class="empty">No memories yet. Add one when something matters.</p>',
    '</section>',

    renderMediaLibrary(media),

    '</main>',
    '<footer class="footer wrap">',
    '<p class="privacy">Everything here stays on this machine. HQ never sends your data.</p>',
    '<p class="fine">Built from local files and git history. Nothing is uploaded.</p>',
    '</footer>',
    '</body>',
    '</html>',
  ];

  return html.filter((line) => line !== '').join('\n') + '\n';
}
