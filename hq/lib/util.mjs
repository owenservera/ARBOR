// hq/lib/util.mjs — deterministic primitives shared by every HQ module.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

export const nowISO = () => new Date().toISOString();

export function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

export function sha256File(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

// canonical — recursively sort object keys so digests are stable across runs.
export function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') {
    const out = {};
    for (const k of Object.keys(value).sort()) out[k] = canonical(value[k]);
    return out;
  }
  return value;
}

export function canonicalJson(value) {
  return JSON.stringify(canonical(value), null, 2) + '\n';
}

export function digestOf(value) {
  return sha256(canonicalJson(value));
}

// tokenize — lowercase word/number/identifier tokens, 2+ chars, deduped, sorted.
// Deterministic: the sorted order is part of the contract used by scoring.
export function tokenize(text) {
  const raw = String(text ?? '').toLowerCase().match(/[\p{L}\p{N}_$.-]{2,}/gu) ?? [];
  return [...new Set(raw)].sort();
}

// estimateTokens — deliberately conservative, tokenizer-free estimate.
export function estimateTokens(text) {
  const s = String(text ?? '');
  if (!s) return 0;
  return Math.max(1, Math.ceil(Buffer.byteLength(s, 'utf8') / 3));
}

export function clamp(n, lo, hi) {
  return Math.min(hi, Math.max(lo, n));
}

export function toPosix(p) {
  return String(p ?? '').replace(/\\/g, '/');
}

// globToRegExp — supports **, *, ?, and {a,b} alternation.
export function globToRegExp(glob) {
  let g = toPosix(glob);
  let re = '';
  for (let i = 0; i < g.length; i++) {
    const c = g[i];
    if (c === '*') {
      if (g[i + 1] === '*') {
        i++;
        if (g[i + 1] === '/') { i++; re += '(?:.*/)?'; }
        else re += '.*';
      } else re += '[^/]*';
    } else if (c === '?') {
      re += '[^/]';
    } else if (c === '{') {
      const end = g.indexOf('}', i);
      if (end === -1) { re += '\\{'; continue; }
      const parts = g.slice(i + 1, end).split(',');
      re += '(?:' + parts.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')';
      i = end;
    } else if (c === '[') {
      const end = g.indexOf(']', i);
      if (end === -1) { re += '\\['; continue; }
      re += g.slice(i, end + 1);
      i = end;
    } else if ('\\^$+?.()|[]{}'.includes(c)) {
      re += '\\' + c;
    } else {
      re += c;
    }
  }
  return new RegExp('^' + re + '$');
}

export function matchesAny(path, globs) {
  if (!Array.isArray(globs)) return false;
  const p = toPosix(path);
  for (const g of globs) {
    try { if (globToRegExp(g).test(p)) return true; } catch { /* ignore malformed glob */ }
  }
  return false;
}

export function formatBytes(n) {
  if (!Number.isFinite(n)) return '?';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function formatNumber(n) {
  return Number(n || 0).toLocaleString('en-US');
}

export function truncate(s, n) {
  const str = String(s ?? '');
  return str.length <= n ? str : str.slice(0, Math.max(0, n - 1)) + '…';
}

export function uniqueBy(arr, fn) {
  const seen = new Set();
  const out = [];
  for (const item of arr) {
    const key = fn(item);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

export function groupBy(arr, fn) {
  const out = {};
  for (const item of arr) {
    const key = fn(item);
    (out[key] = out[key] || []).push(item);
  }
  return out;
}

// safeJsonParse — returns fallback instead of throwing.
export function safeJsonParse(text, fallback = null) {
  try { return JSON.parse(text); } catch { return fallback; }
}

export function uniqueSorted(values) {
  return [...new Set(values)].sort();
}
