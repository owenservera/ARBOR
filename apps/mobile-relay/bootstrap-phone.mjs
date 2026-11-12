// grokbot-authored. Pure, browser-safe ESM. No DOM, no node imports, no network, no throw on bad input.
// Reads the phone-facing bootstrap projection from a host /status payload, caches it locally
// (scoped by worldId, inside one storage blob), and exposes small trusted helpers for app.js
// and visual-bootstrap.mjs. Every string from the host is treated as untrusted display text:
// callers must use textContent, never innerHTML, and must never evaluate it.

export const PROJECTION_SCHEMA = 'vivim.bootstrap-phone/1';
export const PROJECTION_CACHE_KEY = 'vivim.bootstrap.projection.v1';
const CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const CACHE_MAX_WORLDS = 5;
const ID = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,95}$/;
const BAD_VALUE = /url\(|javascript:|expression\(|[;<>]/i;
const THEME_CSS_KEYS = new Set(['--bg','--s1','--s2','--bd','--tx','--mu','--ac','--ac2',
  '--vivim-background-image','--vivim-font-family','--vivim-base-font-size',
  '--vivim-heading-font-size','--vivim-corner-radius','--vivim-spacing-scale','--vivim-accent-ink','--vivim-appearance']);

const isPlainObject = v => !!v && typeof v === 'object' && !Array.isArray(v);

// Tolerates missing snapshot, missing personalAgent, wrong schema, non-object input.
// Tries the current top-level location first, then falls back to the older nested one.
export function readProjection(statusPayload) {
  if (!isPlainObject(statusPayload)) return null;
  const snapshot = statusPayload.snapshot;
  if (!isPlainObject(snapshot)) return null;
  let projection = snapshot.bootstrap;
  if (!isPlainObject(projection)) {
    const personalAgent = snapshot.personalAgent;
    projection = isPlainObject(personalAgent) ? personalAgent.bootstrap : null;
  }
  if (!isPlainObject(projection)) return null;
  if (projection.schema !== PROJECTION_SCHEMA) return null;
  if (typeof projection.worldId !== 'string' || !ID.test(projection.worldId)) return null;
  if (typeof projection.observedAt !== 'string') return null;
  return projection;
}

// One fixed storage key; worldId scoping happens inside the single JSON blob, so callers
// never need to know the live worldId before the first network round trip.
export function cacheKey(_worldId) {
  return PROJECTION_CACHE_KEY;
}

function looksLikeProjection(p) {
  return isPlainObject(p) && p.schema === PROJECTION_SCHEMA
    && typeof p.worldId === 'string' && ID.test(p.worldId)
    && typeof p.observedAt === 'string' && Number.isFinite(Date.parse(p.observedAt));
}

function safeParse(raw) {
  if (typeof raw !== 'string' || !raw) return null;
  try { const v = JSON.parse(raw); return isPlainObject(v) ? v : null; } catch { return null; }
}

function readBlob(storage) {
  if (!storage || typeof storage.getItem !== 'function') return { v: 1, worlds: {} };
  let raw = null;
  try { raw = storage.getItem(PROJECTION_CACHE_KEY); } catch { raw = null; }
  const parsed = safeParse(raw);
  if (!parsed || !isPlainObject(parsed.worlds)) return { v: 1, worlds: {} };
  return parsed;
}

// Never throws. Silently does nothing if projection or storage is unusable.
export function cacheProjection(storage, projection) {
  if (!storage || typeof storage.setItem !== 'function') return false;
  if (!looksLikeProjection(projection)) return false;
  const blob = readBlob(storage);
  const prior = blob.worlds[projection.worldId]?.projection;
  // An out-of-order relay response must never roll back approved personalization.
  if (looksLikeProjection(prior) && Number.isSafeInteger(prior.revision)) {
    if (!Number.isSafeInteger(projection.revision) || projection.revision < prior.revision) return false;
    if (projection.revision === prior.revision && Date.parse(projection.observedAt) < Date.parse(prior.observedAt)) return false;
  }
  if (Date.parse(projection.observedAt) > Date.now() + 120000) return false;
  blob.worlds[projection.worldId] = { observedAt: projection.observedAt, projection };
  const entries = Object.entries(blob.worlds)
    .filter(([, v]) => isPlainObject(v) && typeof v.observedAt === 'string' && Number.isFinite(Date.parse(v.observedAt)))
    .sort((a, b) => Date.parse(b[1].observedAt) - Date.parse(a[1].observedAt))
    .slice(0, CACHE_MAX_WORLDS);
  blob.worlds = Object.fromEntries(entries);
  blob.v = 1;
  try { storage.setItem(PROJECTION_CACHE_KEY, JSON.stringify(blob)); return true; } catch { return false; }
}

// Never throws. Ignores expired (>7 days by observedAt) and malformed entries;
// returns the freshest valid cached projection across all worlds, or null.
export function readCachedProjection(storage) {
  const blob = readBlob(storage);
  const now = Date.now();
  let best = null, bestAt = -Infinity;
  for (const entry of Object.values(blob.worlds)) {
    if (!isPlainObject(entry)) continue;
    if (!looksLikeProjection(entry.projection)) continue;
    const at = Date.parse(entry.observedAt);
    if (!Number.isFinite(at)) continue;
    if (now - at > CACHE_MAX_AGE_MS || at > now + 120000) continue;
    if (at > bestAt) { bestAt = at; best = entry.projection; }
  }
  return best;
}

// CSS custom-property pairs only: `--`-prefixed names, string values, length-capped,
// and blocked from url(), javascript:, expression(), `;`, `<`, `>`.
export function cssEntries(projection) {
  if (!isPlainObject(projection) || !isPlainObject(projection.cssVariables)) return [];
  const out = [];
  for (const [name, value] of Object.entries(projection.cssVariables)) {
    if (!THEME_CSS_KEYS.has(name)) continue;
    if (typeof value !== 'string' || !value.length || value.length > 400) continue;
    if (BAD_VALUE.test(value)) continue;
    out.push([name, value]);
  }
  return out;
}

const PHASE_LABELS = Object.freeze({
  connecting: 'Connecting',
  learning: 'Learning your style',
  shaping: 'Shaping your look',
  deepening: 'Refining details',
  blocked: 'Paused',
  uncertain: 'Finding footing'
});

export function phaseLabel(phase) {
  return PHASE_LABELS[phase] || 'Setting up';
}

export function undoCommand() {
  return { text: 'undo-theme', kind: 'command', consumer: 'bootstrap', mode: 'bootstrap', action: 'undo-theme' };
}
