// @ts-check
/**
 * @hq:context Thread resume — turn the name a conversation was given back into the session that carries it.
 * @hq:owner channel-manager
 * @hq:task cnp-registry
 * @hq:invariant read-only: nothing here assigns, saves, or repairs a Registry
 * @hq:invariant a name that does not resolve is refused with a code; it is never snapped to a nearby stem
 * @hq:invariant a receipt joins a conversation by lookup beside the ledger; the ledger is never rewritten
 * @hq:see hq/lib/cnp.mjs (Registry, parseNid) · doc:docs/AGENT-BUS.md
 */
import { existsSync } from 'node:fs';
import { Registry, parseNid } from './cnp.mjs';

/**
 * Keys that name a ledger row or a raw thread id rather than a resumable session.
 * cnp.mjs writes `thread:<raw>` for a stored thread, and a caller that binds a
 * receipt by a prefixed key gets the same treatment: neither carries a session.
 */
const SYNTHETIC_KEY = /^(thread|receipt):/;

/**
 * A CNP receipt id is a bare sha256 digest (`resolveChannelThreads` keys the
 * registry by `receiptId`), so a digest names evidence, not a conversation seat.
 * The live registry at C:/VIVIM/channel/threads.json is keyed only by digests —
 * without this rule every receipt would read as a resumable session.
 */
const RECEIPT_DIGEST = /^[0-9a-f]{64}$/;

/**
 * @param {string|undefined} registryFile
 * @returns {Registry|null} null when the file is simply not there; a wrong path is a
 *   data condition, while a missing argument is a programming error.
 */
function open(registryFile) {
  if (typeof registryFile !== 'string' || !registryFile.trim()) {
    throw new Error('a registryFile path is required');
  }
  if (!existsSync(registryFile)) return null;
  return new Registry(registryFile);
}

/**
 * The session a name actually carries. The Registry stores an id, not a fact about
 * what that id is: a session id, a receipt digest, or a synthetic `thread:` key.
 * A key that is neither synthetic nor a digest is the session it was bound to.
 *
 * @param {any} entry
 * @returns {string|null}
 */
function sessionOf(entry) {
  const key = typeof entry?.key === 'string' ? entry.key.trim() : '';
  if (!key || SYNTHETIC_KEY.test(key) || RECEIPT_DIGEST.test(key)) return null;
  if (parseNid(key).ok) return null;   // the name is the key: there is nothing behind it
  return key;
}

/**
 * Resume by name: a Nid stem or a raw registry key. Returns the session to resume
 * (null when the name is real but names evidence rather than a session) plus the
 * Nid and the entry, so a caller never has to parse the registry itself.
 *
 * @param {{registryFile?: string, name?: string}} [opts]
 * @returns {{ok: true, session: string|null, nid: string, entry: any}
 *   | {ok: false, code: 'NO_REGISTRY'|'UNKNOWN_NAME', detail: string}}
 */
export function resolveByName({ registryFile, name } = {}) {
  const registry = open(registryFile);
  if (!registry) {
    return {
      ok: false,
      code: 'NO_REGISTRY',
      detail: `no registry at ${registryFile}; run \`hq threads resolve --write\` first`,
    };
  }
  const want = String(name ?? '').trim();
  const stem = parseNid(want);
  const entry = (stem.ok ? registry.byNid(want) : null) ?? registry.get(want);
  if (!entry || typeof entry.nid !== 'string' || !entry.nid) {
    return { ok: false, code: 'UNKNOWN_NAME', detail: unknownDetail(want, stem, registryFile) };
  }
  return { ok: true, session: sessionOf(entry), nid: entry.nid, entry };
}

/**
 * @param {string} want
 * @param {{ok: boolean, error?: string}} stem
 * @param {string|undefined} registryFile
 */
function unknownDetail(want, stem, registryFile) {
  if (!want) return 'a name is required';
  if (!stem.ok && want.startsWith('cnp1;')) {
    return `"${want}" is not a well-formed CNP stem (${stem.error ?? 'E_STEM'})`;
  }
  return `"${want}" is not a name in ${registryFile}`;
}

/**
 * The Nid bound to a session id, or null. A session is bound by key — the same way
 * `Registry.assign` binds one — so this is a lookup, never a scan for a guess.
 *
 * @param {{registryFile?: string, sessionId?: string}} [opts]
 * @returns {string|null}
 */
export function resolveSession({ registryFile, sessionId } = {}) {
  const registry = open(registryFile);
  if (!registry) return null;
  const want = String(sessionId ?? '').trim();
  if (!want) return null;
  return registry.get(want)?.nid ?? null;
}

/**
 * Every name in the registry, newest first. Ties on `boundAt` (binds inside one
 * millisecond are common — the live registry has many) are broken by insertion
 * order, which is also the order the lineages were handed out.
 *
 * @param {{registryFile?: string}} [opts]
 * @returns {{key: string, nid: string}[]}
 */
export function names({ registryFile } = {}) {
  const registry = open(registryFile);
  if (!registry) return [];
  const rows = Object.keys(registry.doc.byKey).map((key, index) => {
    const entry = registry.doc.byKey[key];
    return { key, nid: entry?.nid ?? null, boundAt: entry?.boundAt ?? null, index };
  });
  return rows
    .filter((r) => typeof r.nid === 'string' && r.nid !== '')
    .sort((a, b) => String(b.boundAt ?? '').localeCompare(String(a.boundAt ?? '')) || b.index - a.index)
    .map(({ key, nid }) => ({ key, nid: String(nid) }));
}

/**
 * The Nid for a receipt id — how a receipt joins a conversation. The ledger is
 * never touched; the mapping was written beside it by `resolveChannelThreads`,
 * which keys the registry by `receiptId`.
 *
 * @param {{registryFile?: string, receiptId?: string}} [opts]
 * @returns {string|null}
 */
export function fromReceipt({ registryFile, receiptId } = {}) {
  const registry = open(registryFile);
  if (!registry) return null;
  const want = String(receiptId ?? '').trim();
  if (!want) return null;
  return registry.get(want)?.nid ?? null;
}
