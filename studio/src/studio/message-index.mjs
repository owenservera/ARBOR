/**
 * @hq:context Header/footer index codec V1 (co-designed with ChatGPT 2026-11-04): indices, not words.
 * @hq:owner atlas
 * @hq:task VC-12
 * @hq:see docs/chatgpt-channel/INDEX-V0.md
 * @hq:invariant a line that does not parse is reported, never guessed into a valid message.
 * @hq:invariant these lines are DESCRIPTIVE, never authoritative: only the harness may assert
 *              local verification, and encodeFooter refuses to do so without that authority.
 */
// The compression is the index: each field is a small integer pointing into a table both ends hold.
// V1 changes over V0, all of them ChatGPT's: a replay id distinct from the message id, a causal
// parent, four kinds instead of six (execution is an action, not an intent), an explicit cost slot,
// and a receipt reference binding a footer to its trace. ASCII brackets are emitted so no terminal
// encoding can corrupt the frame; the pretty brackets are accepted on read.

export const KIND = { ask: 0, work: 1, reply: 2, event: 3 };
export const STATUS = { ok: 0, partial: 1, fail: 2, uncertain: 3, refused: 4 };
export const EFFORT = { instant: 0, medium: 1, high: 2 };
export const EVIDENCE = { claim: 0, observation: 1, verified: 2 };

const invert = (table) => Object.fromEntries(Object.entries(table).map(([k, v]) => [v, k]));
const KIND_BY_CODE = invert(KIND);
const STATUS_BY_CODE = invert(STATUS);
const EFFORT_BY_CODE = invert(EFFORT);
const EVIDENCE_BY_CODE = invert(EVIDENCE);

const FRAME_RE = /^(?:\[\[|⟦)\s*(.+?)\s*(?:\]\]|⟧)$/;

/** Strip brackets and split into fields. Pipe is canonical; whitespace is accepted on read. */
function unwrap(line) {
  const m = FRAME_RE.exec(String(line ?? '').trim());
  if (!m) throw new Error('INDEX_NOT_A_FRAME');
  const body = m[1];
  const parts = (body.includes('|') ? body.split('|') : body.split(/\s+/)).map((p) => p.trim());
  const head = /^([HF])(\d+)$/.exec(parts[0] ?? '');
  if (!head) throw new Error('INDEX_NOT_A_FRAME');
  return { type: head[1], version: Number(head[2]), fields: parts.slice(1) };
}

/** Resolve a field written as an index or as its word. Unknown values are an error. */
function resolve(table, codeTable, value, field) {
  const raw = String(value ?? '').trim().toLowerCase();
  if (raw in table) return table[raw];
  if (/^\d+$/.test(raw) && Number(raw) in codeTable) return Number(raw);
  throw new Error(`INDEX_BAD_${field.toUpperCase()}: "${value}"`);
}

const dash = (v) => (v === null || v === undefined || v === '' ? '-' : String(v));

/** Encode the header that opens a message. */
export function encodeHeader({ id, rid, parent, src, dst, kind, thread, effort, version = 1 }) {
  if (!id) throw new Error('INDEX_ID_REQUIRED');
  if (!rid) throw new Error('INDEX_RID_REQUIRED');
  if (!src || !dst) throw new Error('INDEX_PARTIES_REQUIRED');
  const k = resolve(KIND, KIND_BY_CODE, kind, 'kind');
  const e = resolve(EFFORT, EFFORT_BY_CODE, effort ?? 'medium', 'effort');
  return `[[H${version}|${id}|${rid}|${dash(parent)}|${src}|${dst}|${k}|${dash(thread)}|${e}]]`;
}

/**
 * Encode the footer that closes a message. `verified` is refused unless the caller holds local
 * harness authority; an agent may only ever submit a claim or an observation.
 */
export function encodeFooter({ status, evidence = 'claim', turns = 0, ms = 0, costMicroUsd = null, receipt = null, hash = '', version = 1, harnessVerified = false }) {
  const s = resolve(STATUS, STATUS_BY_CODE, status, 'status');
  const ev = resolve(EVIDENCE, EVIDENCE_BY_CODE, evidence, 'evidence');
  if (ev === EVIDENCE.verified && harnessVerified !== true) {
    throw new Error('INDEX_VERIFICATION_NOT_AUTHORIZED');
  }
  const h = String(hash ?? '').replace(/^sha256:/i, '').slice(0, 16);
  if (h && !/^[0-9a-f]{16}$/i.test(h)) throw new Error('INDEX_BAD_HASH');
  const t = Number.isInteger(turns) && turns >= 0 ? turns : 0;
  const m = Number.isFinite(ms) && ms >= 0 ? Math.round(ms) : 0;
  const c = Number.isInteger(costMicroUsd) && costMicroUsd >= 0 ? costMicroUsd : null;
  return `[[F${version}|${s}|${ev}|${t}|${m}|${dash(c)}|${dash(receipt)}|${dash(h)}]]`;
}

/** Parse one frame line. Returns {type, ...fields} carrying both indices and their words. */
export function parseFrame(line) {
  const { type, version, fields } = unwrap(line);
  if (type === 'H') {
    if (fields.length !== 8) throw new Error('INDEX_BAD_HEADER_ARITY');
    const [id, rid, parent, src, dst, kind, thread, effort] = fields;
    const k = resolve(KIND, KIND_BY_CODE, kind, 'kind');
    const e = resolve(EFFORT, EFFORT_BY_CODE, effort, 'effort');
    return {
      type: 'header', version, id, rid, parent: parent === '-' ? null : parent, src, dst,
      thread: thread === '-' ? null : thread,
      kind: k, kindName: KIND_BY_CODE[k], effort: e, effortName: EFFORT_BY_CODE[e],
    };
  }
  if (fields.length !== 7) throw new Error('INDEX_BAD_FOOTER_ARITY');
  const [status, evidence, turns, ms, cost, receipt, hash] = fields;
  const s = resolve(STATUS, STATUS_BY_CODE, status, 'status');
  const ev = resolve(EVIDENCE, EVIDENCE_BY_CODE, evidence, 'evidence');
  if (hash !== '-' && !/^[0-9a-f]{16}$/i.test(hash)) throw new Error('INDEX_BAD_HASH');
  return {
    type: 'footer', version, status: s, statusName: STATUS_BY_CODE[s],
    evidence: ev, evidenceName: EVIDENCE_BY_CODE[ev],
    turns: Number(turns), ms: Number(ms), costMicroUsd: cost === '-' ? null : Number(cost),
    receipt: receipt === '-' ? null : receipt, hash: hash === '-' ? '' : hash,
  };
}

/** Frame a body: header line, body, footer line. */
export function frameMessage(header, body, footer) {
  return `${encodeHeader(header)}\n${String(body ?? '').trim()}\n${encodeFooter(footer)}`;
}

/** Read a framed message back. Throws when the frame is missing or out of order. */
export function readMessage(text) {
  const lines = String(text ?? '').split('\n').map((l) => l.trim()).filter((l) => l.length);
  if (lines.length < 2) throw new Error('INDEX_NOT_FRAMED');
  const header = parseFrame(lines[0]);
  const footer = parseFrame(lines[lines.length - 1]);
  if (header.type !== 'header' || footer.type !== 'footer') throw new Error('INDEX_BAD_FRAME_ORDER');
  return { header, footer, body: lines.slice(1, -1).join('\n') };
}

/**
 * Self-reference: the vocabulary is itself frames. A `V` frame binds one word to one code in one
 * table, so the language can carry its own dictionary and decode itself from it. No table is
 * privileged; rebuilding the tables from these frames must reproduce the parser's behaviour exactly.
 *   ⟦V1|<table>|<code>|<word>⟧
 */
export const VOCABULARY = [
  ...Object.entries(KIND).map(([word, code]) => ({ table: 'kind', code, word })),
  ...Object.entries(STATUS).map(([word, code]) => ({ table: 'status', code, word })),
  ...Object.entries(EFFORT).map(([word, code]) => ({ table: 'effort', code, word })),
  ...Object.entries(EVIDENCE).map(([word, code]) => ({ table: 'evidence', code, word })),
];

const V_RE = /^(?:\[\[|⟦)V(\d+)\|([^|⟧\]]+)\|(\d+)\|([^|⟧\]]+)(?:\]\]|⟧)$/;

export function encodeVocab({ table, code, word, version = 1 }) {
  if (!table || !word) throw new Error('VOCAB_FIELDS_REQUIRED');
  if (!Number.isInteger(code) || code < 0) throw new Error('VOCAB_BAD_CODE');
  return `[[V${version}|${table}|${code}|${word}]]`;
}

export function parseVocab(line) {
  const m = V_RE.exec(String(line ?? '').trim());
  if (!m) throw new Error('VOCAB_NOT_A_FRAME');
  return { type: 'vocabulary', version: Number(m[1]), table: m[2], code: Number(m[3]), word: m[4] };
}

/** The whole dictionary as frames. */
export function encodeVocabulary(vocabulary = VOCABULARY) {
  return vocabulary.map((v) => encodeVocab(v));
}

/** Build word->code maps from vocabulary frames alone. This is the language reading itself. */
export function tablesFromVocabulary(lines) {
  const tables = {};
  for (const line of lines) {
    const { table, code, word } = parseVocab(line);
    (tables[table] ??= {})[word] = code;
  }
  return tables;
}

/**
 * Determinism check: the tables rebuilt from the vocabulary frames must equal the compiled ones,
 * and every vocabulary frame must survive a round trip through the rebuilt tables.
 */
export function selfCheck() {
  const built = tablesFromVocabulary(encodeVocabulary());
  const expected = { kind: KIND, status: STATUS, effort: EFFORT, evidence: EVIDENCE };
  for (const [name, table] of Object.entries(expected)) {
    const a = JSON.stringify(table);
    const b = JSON.stringify(built[name] ?? {});
    if (a !== b) return { ok: false, reason: `table mismatch: ${name}`, built: built[name], expected: table };
  }
  const round = encodeVocabulary(VOCABULARY.map((v) => ({ ...v })));
  const rebuilt = tablesFromVocabulary(round);
  for (const [name, table] of Object.entries(expected)) {
    for (const [word, code] of Object.entries(table)) {
      if (rebuilt[name]?.[word] !== code) return { ok: false, reason: `round-trip lost ${name}.${word}` };
    }
  }
  return { ok: true, tables: Object.keys(built), entries: round.length };
}
