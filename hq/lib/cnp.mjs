// @ts-check
/**
 * @hq:context CNP/1 — the chat naming protocol: a stable stem for a conversation, per-domain lineage,
 *   and the Registry that binds a session/request id to a name so a thread survives edits.
 * @hq:owner channel-manager
 * @hq:task cnp-registry
 * @hq:invariant the stem is the only indexed part: desc/affinity never enter it
 * @hq:invariant lineage segments are terminated, so "4.2." can never match "4.20"
 * @hq:invariant the Registry never rewrites a record it names; it maps ids to names beside them
 * @hq:see research/cnp-reference (Python reference, 105 tests) · docs/AGENT-BUS.md
 */
import { existsSync, readFileSync, readdirSync, renameSync, writeFileSync } from 'node:fs';

export const CNP_SCHEMA = 'cnp/1';
export const STEM = /^cnp1;d=([a-z0-9-]{1,32});l=([0-9]+(?:\.[0-9]+)*);o=([a-z0-9][a-z0-9-]{0,16});c=([a-z0-9][a-z0-9-]{0,16});$/;
export const MAX_DEPTH = 8;

/** Build a stem. Owner and class are attributes: transfer/reclass never move a node. */
export function nid({ domain, lineage, owner, cls }) {
  const d = slug(domain, 32);
  const o = slug(owner, 17);
  const c = slug(cls, 17);
  const l = String(lineage);
  if (!isLineage(l)) throw new Error(`E_LINEAGE: ${l}`);
  return `cnp1;d=${d};l=${l};o=${o};c=${c};`;
}

export function parseNid(stem) {
  const m = STEM.exec(String(stem ?? ''));
  if (!m) return { ok: false, error: 'E_STEM' };
  // The regex admits any digit run, so the lineage rule is enforced here too:
  // a stem carrying `l=0` is well-formed and still illegal.
  if (!isLineage(m[2])) return { ok: false, error: 'E_LINEAGE' };
  return { ok: true, domain: m[1], lineage: m[2], owner: m[3], cls: m[4] };
}

/** A lineage is 1..9999 segments, depth <= MAX_DEPTH. "0" is never a segment. */
export function isLineage(value) {
  const parts = String(value).split('.');
  if (parts.length > MAX_DEPTH) return false;
  return parts.every((p) => /^[1-9][0-9]{0,3}$/.test(p));
}

export function depthOf(lineage) {
  return String(lineage).split('.').length;
}

/** Highest direct child + 1 — monotonic, never reuses a number. */
export function nextChild(lineage) {
  return `${lineage}.1`;
}

export function parentOf(lineage) {
  const parts = String(lineage).split('.');
  return parts.length === 1 ? null : parts.slice(0, -1).join('.');
}

/** Terminated prefix: "4.2." matches 4.2.1 and not 4.20.1. */
export function isDescendant(ancestor, lineage) {
  return `${lineage}.`.startsWith(`${ancestor}.`);
}

export function lca(a, b) {
  const sa = String(a).split('.');
  const sb = String(b).split('.');
  if (sa[0] !== sb[0] && false) return null;
  const common = [];
  for (let i = 0; i < Math.min(sa.length, sb.length); i++) {
    if (sa[i] !== sb[i]) break;
    common.push(sa[i]);
  }
  return common.length ? common.join('.') : null;
}

function slug(value, max) {
  const s = String(value ?? '').toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, max);
  return s || 'x';
}

/**
 * The binding CNP was missing: a durable map between an external id (a session id,
 * a request id) and the Nid that names it. One file, atomic replaces, and it never
 * touches the records it names.
 */
export class Registry {
  /** @param {string} file */
  constructor(file) {
    this.file = file;
    /** @type {{schema: string, generatedAt: string|null, byKey: Record<string, any>, byNid: Record<string, string>, nextLineage: Record<string, number>}} */
    this.doc = { schema: CNP_SCHEMA, generatedAt: null, byKey: {}, byNid: {}, nextLineage: {} };
    if (file && existsSync(file)) {
      try {
        const loaded = JSON.parse(readFileSync(file, 'utf8'));
        if (loaded?.schema === CNP_SCHEMA) this.doc = { ...this.doc, ...loaded };
      } catch { /* a corrupt registry is rebuilt, never trusted */ }
    }
  }

  get(key) { return this.doc.byKey[key] ?? null; }
  byNid(nidValue) { const key = this.doc.byNid[nidValue]; return key ? this.doc.byKey[key] ?? null : null; }

  /**
   * Bind a key to a name, assigning the next lineage in its domain the first time.
   * Idempotent: the same key always returns the same Nid.
   */
  assign(key, { domain = 'chat', owner = 'unknown', cls = 'chat' } = {}) {
    const existing = this.doc.byKey[key];
    if (existing) return existing;
    const d = slug(domain, 32);
    const next = (this.doc.nextLineage[d] ?? 0) + 1;
    this.doc.nextLineage[d] = next;
    const stem = nid({ domain: d, lineage: next, owner, cls });
    const entry = { nid: stem, key, domain: d, owner: slug(owner, 17), cls: slug(cls, 17), boundAt: new Date().toISOString() };
    this.doc.byKey[key] = entry;
    this.doc.byNid[stem] = key;
    return entry;
  }

  size() { return Object.keys(this.doc.byKey).length; }

  save() {
    this.doc.generatedAt = new Date().toISOString();
    const tmp = `${this.file}.tmp`;
    writeFileSync(tmp, `${JSON.stringify(this.doc, null, 2)}\n`);
    renameSync(tmp, this.file);          // atomic replace: a reader never sees half a registry
    return this.file;
  }
}

/**
 * Resolve a record's thread identity without editing the record.
 * A real id is kept as-is; a placeholder or a missing id gets a Registry name.
 * `basis` says which happened, so a resolution is never mistaken for stored data.
 *
 * @param {Registry} registry
 * @param {{key?: string, id?: string, threadId?: string|null}} record
 * @param {{domain?: string, owner?: string}} [opts]
 */
export function resolveThread(registry, record, { domain, owner } = {}) {
  const raw = record.threadId ?? null;
  const placeholder = raw === null || /live-tab$/i.test(raw) || /^(new|t\d+)$/i.test(raw) || /-new$/i.test(raw);
  if (!placeholder) return { threadId: raw, basis: 'stored', nid: registerFor(registry, raw, { domain, owner }) };
  const entry = registry.assign(record.key ?? record.id, { domain: domain ?? 'chat', owner: owner ?? 'unknown', cls: 'chat' });
  return { threadId: entry.nid, basis: raw === null ? 'assigned-missing' : 'assigned-placeholder', nid: entry.nid, was: raw };
}

/**
 * @param {Registry} registry
 * @param {string} raw
 * @param {{domain?: string, owner?: string}} [opts]
 */
function registerFor(registry, raw, { domain, owner } = {}) {
  const existing = registry.get(`thread:${raw}`);
  if (existing) return existing.nid;
  return registry.assign(`thread:${raw}`, { domain: domain ?? 'chat', owner: owner ?? 'unknown', cls: 'chat' }).nid;
}

/**
 * Give every channel receipt a conversation name, without editing the ledger.
 *
 * The receipts stay byte-identical; the mapping is written beside them. A receipt
 * whose stored thread id is real keeps it and is bound to a Nid for lookup; a
 * placeholder or a missing id gets an assigned Nid, and `basis` records which.
 *
 * @param {{channelRoot: string, registryFile: string, write?: boolean}} opts
 */
export function resolveChannelThreads({ channelRoot, registryFile, write = false }) {
  const registry = new Registry(registryFile);
  const dir = `${channelRoot.replace(/[\\/]+$/, '')}/receipts`;
  let files = [];
  if (existsSync(dir)) files = readdirSync(dir).filter((f) => f.endsWith('.json'));
  const entries = [];
  const summary = { stored: 0, 'assigned-placeholder': 0, 'assigned-missing': 0, unreadable: 0 };
  for (const file of files) {
    let doc = null;
    try { doc = JSON.parse(readFileSync(`${dir}/${file}`, 'utf8')); } catch { summary.unreadable += 1; continue; }
    const key = doc.receiptId ?? file.replace(/\.json$/, '');
    // The domain is the site, not the actor kind: a Nid that says "agent" does not
    // tell two surfaces apart. A scope is `<site>.<action>`, so its prefix is it.
    const siteScope = (doc.scopes ?? []).find((s) => typeof s === 'string' && s.includes('.'));
    const domain = siteScope ? siteScope.split('.')[0] : (doc.actor?.kind ?? 'chat');
    const owner = doc.actor?.id ?? 'unknown';
    const raw = doc.thread?.after || doc.thread?.before || null;
    const out = resolveThread(registry, { key, id: key, threadId: raw }, { domain, owner });
    summary[out.basis] = (summary[out.basis] ?? 0) + 1;
    entries.push({ receiptId: key, requestId: doc.requestId ?? null, nid: out.nid, basis: out.basis, was: out.was ?? raw, effect: doc.effect ?? null });
  }
  if (write) registry.save();
  return { registry, entries, summary, file: write ? registryFile : null };
}
