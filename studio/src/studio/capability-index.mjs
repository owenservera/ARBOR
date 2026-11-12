/**
 * @hq:context Capability index: encodes the 100-item channel list as frames over a lexicon.
 * @hq:owner atlas
 * @hq:task VC-13
 * @hq:see docs/integration/CHANNEL-CAPABILITIES.md
 * @hq:invariant the document is a pure function of (frames, lexicon): decode(encode(doc)) === doc.
 * @hq:invariant a frame carries state, never prose; the prose lives once, in the lexicon.
 */
// The list is the objective; the encoding is the superpower. A capability frame is
//   [[C1|<num>|<domain>|<state>|<evidence>]]
// where num indexes the lexicon entry (the capability sentence) and state is N/P/Y as 0/1/2.
// Determinism means the markdown table can be regenerated from frames alone — no rewriting by hand.

export const CAP_STATE = { N: 0, P: 1, Y: 2 };
const CAP_STATE_BY_CODE = Object.fromEntries(Object.entries(CAP_STATE).map(([k, v]) => [v, k]));

const CAP_RE = /^(?:\[\[|⟦)C(\d+)\|(\d+)\|(\d+)\|(\d+)\|([^|⟧\]]+)(?:\]\]|⟧)$/;

/** Encode one capability frame. `evidence` is a short ref or '-' for none. */
export function encodeCapability({ num, domain, state, evidence = '-', version = 1 }) {
  const n = Number(num);
  const d = Number(domain);
  if (!Number.isInteger(n) || n < 1) throw new Error('CAP_BAD_NUM');
  if (!Number.isInteger(d) || d < 1) throw new Error('CAP_BAD_DOMAIN');
  const raw = String(state ?? '').trim().toUpperCase();
  const s = raw in CAP_STATE ? CAP_STATE[raw] : (/^[012]$/.test(raw) ? Number(raw) : NaN);
  if (!Number.isInteger(s)) throw new Error(`CAP_BAD_STATE: "${state}"`);
  const ev = String(evidence ?? '-').replace(/\|/g, '/').trim() || '-';
  return `[[C${version}|${n}|${d}|${s}|${ev}]]`;
}

/** Parse one capability frame back into data. */
export function parseCapability(line) {
  const m = CAP_RE.exec(String(line ?? '').trim());
  if (!m) throw new Error('CAP_NOT_A_FRAME');
  const version = Number(m[1]);
  const state = Number(m[4]);
  if (!(state in CAP_STATE_BY_CODE)) throw new Error(`CAP_BAD_STATE: "${m[4]}"`);
  return {
    type: 'capability', version, num: Number(m[2]), domain: Number(m[3]),
    state, stateName: CAP_STATE_BY_CODE[state], evidence: m[5] === '-' ? null : m[5],
  };
}

/**
 * Read the markdown list into entries. Only the numbered capability rows are entries; everything
 * else in the document is structure this module must not touch.
 */
export function parseCapabilityDoc(markdown) {
  const lines = String(markdown ?? '').split('\n');
  const entries = [];
  let domain = 0;
  let domainTitle = '';
  for (const line of lines) {
    const heading = /^## (\d+) · (.+?)\s*$/.exec(line.trim());
    if (heading) {
      domain = Number(heading[1]);
      domainTitle = heading[2];
      continue;
    }
    const row = /^\|\s*(\d+)\s*\|\s*(.+?)\s*\|\s*([NPY?])\s*\|\s*$/.exec(line.trim());
    if (!row) continue;
    entries.push({
      num: Number(row[1]), domain, domainTitle, text: row[2], state: row[3],
    });
  }
  return entries;
}

/** Render one markdown row, exactly as the document formats it. */
export function renderCapabilityRow(entry) {
  return `| ${entry.num} | ${entry.text} | ${entry.state} |`;
}

/** Rebuild the numbered rows of a document from frames plus the lexicon the frames index. */
export function renderCapabilityRows(frames, lexicon) {
  return frames
    .map((f) => {
      const text = lexicon.get(f.num);
      if (!text) throw new Error(`CAP_LEXICON_MISSING: ${f.num}`);
      return renderCapabilityRow({ num: f.num, text, state: f.stateName });
    })
    .join('\n');
}

/** Count states across frames — the list's health in one line. */
export function summariseCapabilities(frames) {
  const byState = { N: 0, P: 0, Y: 0 };
  const byDomain = {};
  for (const f of frames) {
    byState[f.stateName] = (byState[f.stateName] ?? 0) + 1;
    byDomain[f.domain] = (byDomain[f.domain] ?? 0) + 1;
  }
  return { total: frames.length, byState, byDomain };
}

/**
 * Evidence frame: the only thing allowed to move a capability off N.
 *   [[E1|<cap>|<site>|<outcome>|<receipt8>]]
 * outcome: 0 fail · 1 partial · 2 pass. A capability's state is the best outcome any real receipt
 * proves, so `Y` cannot be typed in — it has to be earned by evidence naming a receipt.
 */
export const EVIDENCE_OUTCOME = { fail: 0, partial: 1, pass: 2 };
const OUTCOME_BY_CODE = Object.fromEntries(Object.entries(EVIDENCE_OUTCOME).map(([k, v]) => [v, k]));
const EV_RE = /^(?:\[\[|⟦)E(\d+)\|(\d+)\|([^|⟧\]]+)\|(\d+)\|([^|⟧\]]+)(?:\]\]|⟧)$/;

export function encodeEvidence({ cap, site, outcome, receipt, version = 1 }) {
  const c = Number(cap);
  if (!Number.isInteger(c) || c < 1) throw new Error('EV_BAD_CAP');
  const raw = String(outcome ?? '').trim().toLowerCase();
  const o = raw in EVIDENCE_OUTCOME ? EVIDENCE_OUTCOME[raw] : (/^[012]$/.test(raw) ? Number(raw) : NaN);
  if (!Number.isInteger(o)) throw new Error(`EV_BAD_OUTCOME: "${outcome}"`);
  const r = String(receipt ?? '').replace(/^sha256:/i, '').slice(0, 8);
  if (!r) throw new Error('EV_RECEIPT_REQUIRED');
  const s = String(site ?? '').replace(/\|/g, '/');
  if (!s) throw new Error('EV_SITE_REQUIRED');
  return `[[E${version}|${c}|${s}|${o}|${r}]]`;
}

export function parseEvidence(line) {
  const m = EV_RE.exec(String(line ?? '').trim());
  if (!m) throw new Error('EV_NOT_A_FRAME');
  const outcome = Number(m[4]);
  if (!(outcome in OUTCOME_BY_CODE)) throw new Error(`EV_BAD_OUTCOME: "${m[4]}"`);
  return {
    type: 'evidence', version: Number(m[1]), cap: Number(m[2]), site: m[3],
    outcome, outcomeName: OUTCOME_BY_CODE[outcome], receipt: m[5],
  };
}

/**
 * Derive a capability's state from its evidence. No evidence means N — absence is never progress.
 * A pass at any site proves the capability somewhere, which is what the list's `now` column means.
 */
export function deriveCapabilityState(evidence) {
  if (!Array.isArray(evidence) || evidence.length === 0) {
    return { state: 'N', best: null, sites: [], receipts: [] };
  }
  const parsed = evidence.map((e) => (typeof e === 'string' ? parseEvidence(e) : e));
  let best = 0;
  for (const e of parsed) best = Math.max(best, e.outcome);
  return {
    state: OUTCOME_BY_CODE[best] === 'pass' ? 'Y' : OUTCOME_BY_CODE[best] === 'partial' ? 'P' : 'N',
    best: OUTCOME_BY_CODE[best],
    sites: [...new Set(parsed.map((e) => e.site))],
    receipts: [...new Set(parsed.map((e) => e.receipt))],
  };
}
