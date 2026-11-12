// @ts-check
/**
 * @hq:context One thread list over the three places a conversation is written down — live sessions,
 *   bot-inbox threads and channel receipts — joined by CNP Nid so one conversation is one row.
 * @hq:owner channel-manager
 * @hq:task thread-index
 * @hq:invariant read-only: inputs are rows somebody else probed; this module reads one registry file and nothing else
 * @hq:invariant a missing, unreadable or wrongly shaped registry is `identity: 'unknown'`, never a throw
 * @hq:invariant one conversation is one row: two sources resolving to the same Nid merge, never duplicate
 * @hq:invariant a placeholder or missing thread id is never a conversation key, so it can never merge two records
 * @hq:invariant messages is the largest single-source count for the conversation, never a sum across overlapping views
 * @hq:why The owner asked for one list instead of three panels. The join must stay honest: rows merge only on
 *   a name the CNP registry proves, and a row with no proof stays separate and says `unknown`.
 * @hq:see hq/lib/comms-roof.mjs
 * @hq:see hq/lib/cnp.mjs
 */
import { existsSync, readFileSync } from 'node:fs';

/** @typedef {'session' | 'inbox' | 'receipt'} ThreadKind */
/** @typedef {'stored' | 'named' | 'unknown'} ThreadIdentity */
/**
 * @typedef {Object} ThreadRow
 * @property {string} key             stable row key: `nid:<nid>` when the conversation is named, else `<kind>:<id>`
 * @property {ThreadKind} kind        the strictest evidence behind the row: receipt > inbox > session
 * @property {string} title           the best human name any contributing source offered
 * @property {string[]} source        every feed the row was built from, strongest first
 * @property {string | null} lastSeenAt ISO-8601 of the newest record, or null when no source dates it
 * @property {number} messages        the largest single-source message count, 0 when the source does not count
 * @property {string} [nid]           the CNP/1 stem, present only when the registry (or the record) named it
 * @property {ThreadIdentity} identity
 */

const SOURCE_OF_KIND = /** @type {Record<ThreadKind, string>} */ ({ session: 'sessions', inbox: 'inbox', receipt: 'receipts' });
const KIND_RANK = /** @type {Record<ThreadKind, number>} */ ({ session: 1, inbox: 2, receipt: 3 });
const IDENTITY_RANK = /** @type {Record<ThreadIdentity, number>} */ ({ unknown: 0, stored: 1, named: 2 });
const SOURCE_ORDER = ['receipts', 'inbox', 'sessions'];

/**
 * A thread id that names a tab, not a conversation. Same test the roof and CNP use,
 * so a placeholder can never become a merge key here.
 * @param {unknown} value
 */
export function isPlaceholderThreadId(value) {
  if (typeof value !== 'string') return true;
  const raw = value.trim();
  if (!raw) return true;
  return /live-tab$/i.test(raw) || /^(new|t\d+)$/i.test(raw) || /-new$/i.test(raw);
}

/** @param {unknown} value */
function text(value) {
  if (typeof value !== 'string') return null;
  const s = value.trim();
  return s ? s : null;
}

/** @param {unknown} value */
function isRecord(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Accept a bare array, or the probe object that carries one, so callers can pass
 * `probeInboxes()` itself and not be punished for it.
 * @param {unknown} input
 * @param {...string} keys
 * @returns {any[]}
 */
function listOf(input, ...keys) {
  if (Array.isArray(input)) return input;
  if (isRecord(input)) {
    for (const key of keys) {
      const value = (/** @type {any} */ (input))[key];
      if (Array.isArray(value)) return value;
    }
  }
  return [];
}

/**
 * The CNP registry, reduced to a key → Nid map. Never throws: an absent file, a
 * corrupt file or a foreign shape all mean "nothing is named", which is a fact to
 * report, not an error to raise.
 * @param {string | null | undefined} registryFile
 * @returns {{ file: string, byKey: Map<string, string> } | null}
 */
export function loadRegistry(registryFile) {
  if (typeof registryFile !== 'string' || !registryFile.trim()) return null;
  /** @type {any} */
  let doc = null;
  try {
    if (!existsSync(registryFile)) return null;
    doc = JSON.parse(readFileSync(registryFile, 'utf8'));
  } catch {
    return null;
  }
  if (!isRecord(doc)) return null;
  // `Registry` writes { schema, generatedAt, byKey, byNid, nextLineage }; a hand
  // written or older file may be the bare map. Metadata keys are skipped in that
  // case so `schema: 'cnp/1'` cannot masquerade as a name.
  const bare = doc.byKey && typeof doc.byKey === 'object' && !Array.isArray(doc.byKey);
  const source = bare ? doc.byKey : doc;
  const META = new Set(['schema', 'generatedAt', 'byKey', 'byNid', 'nextLineage']);
  /** @type {Map<string, string>} */
  const byKey = new Map();
  for (const [key, value] of Object.entries(source)) {
    if (!bare && META.has(key)) continue;
    const nid = typeof value === 'string' ? value : (isRecord(value) ? (/** @type {any} */ (value)).nid : null);
    const clean = text(nid);
    if (clean) byKey.set(key, clean);
  }
  return { file: registryFile, byKey };
}

/**
 * Every key a record could be named under, widest first. The registry is written by
 * CNP (`<receiptId>`, `thread:<raw id>`), so both are tried before giving up.
 * @param {ThreadKind} kind
 * @param {any} record
 * @returns {string[]}
 */
function keysFor(kind, record) {
  /** @type {string[]} */
  const keys = [];
  /** @param {unknown} value */
  const push = (value) => {
    const clean = text(value);
    if (clean && !keys.includes(clean)) keys.push(clean);
  };
  const id = record?.id ?? null;
  if (kind === 'session') {
    push(`session:${id}`);
    push(id);
    push(`thread:${id}`);
  } else if (kind === 'inbox') {
    push(`inbox:${id}`);
    push(`thread:${id}`);
    push(id);
    push(`thread:${record?.thread}`);
    push(record?.thread);
  } else {
    push(record?.receiptId);
    push(id);
    push(`receipt:${record?.receiptId ?? id}`);
    const raw = record?.threadId;
    if (!isPlaceholderThreadId(raw)) {
      push(`thread:${raw}`);
      push(raw);
    }
  }
  return keys;
}

/**
 * The Nid that names this record, if any. A name the record already carries wins
 * (the roof's evidence probe resolves it); otherwise the registry is consulted.
 * @param {ThreadKind} kind
 * @param {any} record
 * @param {{ byKey: Map<string, string> } | null} registry
 */
function nidFor(kind, record, registry) {
  const declared = text(record?.resolvedNid) ?? text(record?.nid);
  if (declared) return declared;
  if (!registry) return null;
  for (const key of keysFor(kind, record)) {
    const hit = registry.byKey.get(key);
    if (hit) return hit;
  }
  return null;
}

/**
 * The newest of several timestamps, compared as instants but returned verbatim so a
 * caller can see which record it came from.
 * @param {unknown[]} values
 * @returns {string | null}
 */
function pickTime(values) {
  /** @type {string | null} */
  let best = null;
  let bestAt = Number.NEGATIVE_INFINITY;
  for (const value of values) {
    const raw = text(value);
    if (!raw) continue;
    const at = Date.parse(raw);
    if (Number.isNaN(at)) continue;
    if (at > bestAt) { bestAt = at; best = raw; }
  }
  return best;
}

/**
 * @param {any} record
 * @param {number} fallback
 */
function countOf(record, fallback) {
  for (const key of ['messages', 'messageCount', 'count']) {
    const value = record?.[key];
    if (typeof value === 'number' && Number.isFinite(value) && value >= 0) return Math.trunc(value);
  }
  return fallback;
}

/**
 * @param {any} record
 * @returns {string | null}
 */
function sessionLastSeen(record) {
  const explicit = pickTime([record?.lastSeenAt, record?.updatedAt, record?.ts, record?.newest, record?.createdAt]);
  if (explicit) return explicit;
  // probeThreads reports an age, not a timestamp. Turning it into one keeps every
  // row on one clock, which is what makes the merged list sortable.
  const age = record?.ageMinutes;
  if (typeof age === 'number' && Number.isFinite(age) && age >= 0) return new Date(Date.now() - age * 60000).toISOString();
  return null;
}

/**
 * @typedef {Object} Contribution
 * @property {ThreadKind} kind
 * @property {string} title      display name
 * @property {number} titleRank  0 = a bare id, 1 = a receipt's thread, 2 = a session title, 3 = an inbox thread name
 * @property {ThreadIdentity} identity
 * @property {string | null} lastSeenAt
 * @property {number} messages
 * @property {string | null} id  the source's own id, for the key when nothing names the row
 */

/**
 * @param {any} record
 * @returns {Contribution}
 */
function fromSession(record) {
  const id = text(record?.id);
  const name = text(record?.title);
  return {
    kind: 'session',
    title: name ?? id ?? '(unnamed session)',
    titleRank: name ? 2 : 0,
    identity: name ? 'stored' : 'unknown',
    lastSeenAt: sessionLastSeen(record),
    messages: countOf(record, 0),
    id,
  };
}

/**
 * @param {any} record
 * @returns {Contribution}
 */
function fromInbox(record) {
  const id = text(record?.id);
  const name = text(record?.thread) ?? text(record?.title);
  return {
    kind: 'inbox',
    title: name ?? id ?? '(unnamed inbox thread)',
    titleRank: name ? 3 : 0,
    identity: name ? 'stored' : 'unknown',
    lastSeenAt: pickTime([record?.newest, record?.lastSeenAt, record?.ts, record?.lastMessageAt]),
    messages: countOf(record, 0),
    id,
  };
}

/**
 * @param {any} record
 * @returns {Contribution}
 */
function fromReceipt(record) {
  const id = text(record?.receiptId) ?? text(record?.id);
  const raw = text(record?.threadId);
  const real = raw && !isPlaceholderThreadId(raw) ? raw : null;
  return {
    kind: 'receipt',
    title: real ?? id ?? '(unnamed receipt)',
    titleRank: real ? 1 : 0,
    identity: real ? 'stored' : 'unknown',
    lastSeenAt: pickTime([record?.createdAt, record?.ts, record?.at]),
    messages: countOf(record, 1),      // one receipt is one recorded effect on the thread
    id,
  };
}

const BUILDERS = { session: fromSession, inbox: fromInbox, receipt: fromReceipt };

/**
 * Build one thread list from the three raw feeds.
 *
 * A row's key is the conversation's Nid when one is proven, so two feeds naming the
 * same Nid collapse into one row automatically. Where nothing is proven the row is
 * keyed by its own source id and stays separate — an unproven merge would invent a
 * conversation, which is worse than a duplicate.
 *
 * @param {{ sessions?: unknown, inboxThreads?: unknown, evidence?: unknown, registryFile?: string | null }} [input]
 * @returns {{ threads: ThreadRow[], counts: { total: number, session: number, inbox: number, receipt: number, named: number, stored: number, unknown: number, merged: number } }}
 */
export function buildIndex({ sessions = [], inboxThreads = [], evidence = [], registryFile = null } = {}) {
  const registry = loadRegistry(registryFile);
  const feeds = /** @type {Array<[ThreadKind, any[]]>} */ ([
    ['session', listOf(sessions, 'sessions', 'threads', 'items')],
    ['inbox', listOf(inboxThreads, 'threads', 'items')],
    ['receipt', listOf(evidence, 'items', 'receipts')],
  ]);

  /** @type {Map<string, ThreadRow & { titleRank: number }>} */
  const rows = new Map();
  let ordinal = 0;

  for (const [kind, records] of feeds) {
    for (const record of records) {
      ordinal += 1;
      if (!isRecord(record)) continue;
      const part = BUILDERS[kind](record);
      const nid = nidFor(kind, record, registry);
      const key = nid ? `nid:${nid}` : `${kind}:${part.id ?? `#${ordinal}`}`;
      const identity = nid ? 'named' : part.identity;
      /** @type {ThreadRow & { titleRank: number }} */
      const incoming = {
        key,
        kind,
        title: part.title,
        source: [SOURCE_OF_KIND[kind]],
        lastSeenAt: part.lastSeenAt,
        messages: part.messages,
        identity,
        titleRank: part.titleRank,
      };
      if (nid) incoming.nid = nid;

      const current = rows.get(key);
      if (!current) { rows.set(key, incoming); continue; }

      // Merge. The strictest evidence names the row: a receipt proves an effect on
      // the provider surface, an inbox thread proves a message, a session proves a
      // conversation existed.
      if (KIND_RANK[incoming.kind] > KIND_RANK[current.kind]) current.kind = incoming.kind;
      current.source = [...new Set([...current.source, ...incoming.source])]
        .sort((a, b) => SOURCE_ORDER.indexOf(a) - SOURCE_ORDER.indexOf(b));
      if (incoming.titleRank > current.titleRank) {
        current.title = incoming.title;
        current.titleRank = incoming.titleRank;
      }
      current.lastSeenAt = pickTime([current.lastSeenAt, incoming.lastSeenAt]);
      current.messages = Math.max(current.messages, incoming.messages);
      if (incoming.nid) current.nid = incoming.nid;
      if (IDENTITY_RANK[incoming.identity] > IDENTITY_RANK[current.identity]) current.identity = incoming.identity;
      if (current.nid) current.identity = 'named';
    }
  }

  const threads = [...rows.values()]
    .map((row) => {
      /** @type {ThreadRow} */
      const out = {
        key: row.key,
        kind: row.kind,
        title: row.title,
        source: row.source,
        lastSeenAt: row.lastSeenAt,
        messages: row.messages,
        identity: row.identity,
      };
      if (row.nid) out.nid = row.nid;
      return out;
    })
    .sort((a, b) => {
      const at = a.lastSeenAt ? Date.parse(a.lastSeenAt) : Number.NEGATIVE_INFINITY;
      const bt = b.lastSeenAt ? Date.parse(b.lastSeenAt) : Number.NEGATIVE_INFINITY;
      if (at !== bt) return bt - at;                       // newest first; undated rows last
      return a.key < b.key ? -1 : a.key > b.key ? 1 : 0;
    });

  const counts = { total: threads.length, session: 0, inbox: 0, receipt: 0, named: 0, stored: 0, unknown: 0, merged: 0 };
  for (const thread of threads) {
    counts[thread.kind] += 1;
    counts[thread.identity] += 1;
    if (thread.source.length > 1) counts.merged += 1;
  }
  return { threads, counts };
}

/**
 * The list as text: one line per conversation, the counts on the header line so the
 * reader sees how much of the join is proven.
 * @param {{ threads: ThreadRow[], counts: ReturnType<typeof buildIndex>['counts'] }} index
 */
export function renderIndex(index) {
  const c = index.counts;
  const L = [];
  L.push(`THREADS (${c.total}) · ${c.receipt} receipt, ${c.inbox} inbox, ${c.session} session · ${c.named} named, ${c.stored} stored, ${c.unknown} unknown${c.merged ? `, ${c.merged} merged` : ''}`);
  for (const t of index.threads) {
    const seen = t.lastSeenAt ? t.lastSeenAt.slice(0, 16).replace('T', ' ') : '-';
    L.push(`  ${seen.padEnd(17)} ${t.kind.padEnd(8)} ${t.title.slice(0, 36).padEnd(38)} ${t.source.join('+')}`);
  }
  if (!index.threads.length) L.push('  (no threads read)');
  return L.join('\n');
}
