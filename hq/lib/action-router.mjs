// @ts-check
/**
 * @hq:context Action router — rank registered actions against one plain-English sentence by exact token weight, and refuse rather than guess when nothing scores
 * @hq:owner hq-agent
 * @hq:task action-router
 * @hq:invariant never a fabricated best guess: a total score of 0 returns NO_MATCH with an empty matches list
 * @hq:invariant an object/verb/domain hit is an exact token, never a substring, so `listen` cannot select `list`; only the purpose line is matched by substring
 * @hq:invariant the caller supplies the actions: this module builds none, resolves no handler, calls no transport, and writes nothing
 * @hq:invariant status is reported, never used to hide a match — whether a `declared` action may run is the caller's decision, not the router's
 * @hq:why ties break on the action id: the same sentence must rank the same way twice, or `hq do` becomes a coin flip
 * @hq:why apostrophes are removed before splitting so a contraction yields `dont`, not a bare `t` that would substring-hit almost every purpose line
 * @hq:see hq/lib/channel-seats.mjs
 */

/** Weights are the whole ranking policy, named once so a caller can read a score without opening this file. */
export const WEIGHTS = Object.freeze({ object: 3, verb: 2, domain: 2, purpose: 1 });

export const DEFAULT_LIMIT = 5;

/** The one failure code. There is deliberately no second fallback code. */
export const NO_MATCH = 'NO_MATCH';

/** Dropped before scoring: they carry no selection signal and would match nearly every action. */
export const STOPWORDS = Object.freeze(new Set([
  'the', 'a', 'an', 'to', 'for', 'of', 'my', 'please', 'can', 'you', 'me', 'it', 'all', 'and', 'or', 'in', 'on',
]));

/**
 * An action is handed in, never constructed here. `handler` is opaque to the
 * router — naming it in a match is not authority to run it.
 *
 * @typedef {object} Action
 * @property {string} id
 * @property {string} domain
 * @property {string} verb
 * @property {string} object
 * @property {string} purpose
 * @property {string} risk
 * @property {boolean} mutates
 * @property {string[]} actors
 * @property {string} approval
 * @property {'wired'|'declared'} status
 * @property {any} handler
 *
 * @typedef {{ action: any, score: number, why: string[] }} ActionMatch
 *
 * @typedef {object} RouteResult
 * @property {boolean} ok
 * @property {'NO_MATCH'} [code]
 * @property {string} query
 * @property {string[]} tokens
 * @property {ActionMatch[]} matches
 */

/**
 * Lowercase word tokens, punctuation gone, stopwords dropped. Duplicates are
 * kept here (tokenization is faithful); scoring de-duplicates.
 *
 * @param {any} text
 * @returns {string[]}
 */
export function tokenize(text) {
  const raw = String(text ?? '')
    .toLowerCase()
    .replace(/['\u2019]/g, '')
    .split(/[^\p{L}\p{N}]+/u);
  /** @type {string[]} */
  const tokens = [];
  for (const word of raw) {
    if (!word || STOPWORDS.has(word)) continue;
    tokens.push(word);
  }
  return tokens;
}

/**
 * One action's score against already-tokenized text.
 *
 * @param {any} action
 * @param {string[]|string} tokens
 * @returns {number}
 */
export function scoreAction(action, tokens) {
  return explainAction(action, tokens).score;
}

/**
 * The score with its evidence. `why` is what makes a match inspectable instead
 * of a bare number: one entry per field hit, exact fields as `field:token`,
 * the purpose line as `purpose~token` because that one is a substring test.
 *
 * @param {any} action
 * @param {string[]|string} tokens
 * @returns {{ score: number, why: string[] }}
 */
function explainAction(action, tokens) {
  const query = Array.isArray(tokens) ? tokens : tokenize(tokens);
  const objects = wordSet(action?.object);
  const verbs = wordSet(action?.verb);
  const domains = wordSet(action?.domain);
  const purpose = String(action?.purpose ?? '').toLowerCase();
  const seen = new Set();
  /** @type {string[]} */
  const why = [];
  let score = 0;

  for (const raw of query) {
    const token = String(raw ?? '').toLowerCase();
    if (!token || STOPWORDS.has(token) || seen.has(token)) continue;
    seen.add(token);
    if (objects.has(token)) {
      score += WEIGHTS.object;
      why.push(`object:${token} +${WEIGHTS.object}`);
    }
    if (verbs.has(token)) {
      score += WEIGHTS.verb;
      why.push(`verb:${token} +${WEIGHTS.verb}`);
    }
    if (domains.has(token)) {
      score += WEIGHTS.domain;
      why.push(`domain:${token} +${WEIGHTS.domain}`);
    }
    if (purpose.includes(token)) {
      score += WEIGHTS.purpose;
      why.push(`purpose~${token} +${WEIGHTS.purpose}`);
    }
  }
  return { score, why };
}

/**
 * Rank every action, best first, ties broken by id.
 *
 * A non-array is a caller bug and throws: routing "nothing" would look exactly
 * like a sentence the registry cannot answer, and the caller would learn to
 * read a defect as a NO_MATCH.
 *
 * @param {Action[]} actions
 * @param {string} text
 * @param {{ limit?: number }} [options]
 * @returns {RouteResult}
 */
export function route(actions, text, { limit = DEFAULT_LIMIT } = {}) {
  if (!Array.isArray(actions)) throw new TypeError('route needs an array of registered actions');

  const query = String(text ?? '').trim();
  const tokens = tokenize(query);
  /** @type {ActionMatch[]} */
  const scored = [];
  for (const action of actions) {
    const { score, why } = explainAction(action, tokens);
    if (score > 0) scored.push({ action, score, why });
  }
  if (!scored.length) return { ok: false, code: NO_MATCH, query, tokens, matches: [] };

  scored.sort(compareMatches);
  return { ok: true, query, tokens, matches: scored.slice(0, normalizeLimit(limit)) };
}

/**
 * One line for a table or a prompt: `id · risk · actors · wired|declared · purpose`.
 * A missing status reads `declared`: nothing has proven it wired.
 *
 * @param {any} action
 * @returns {string}
 */
export function describe(action) {
  const id = text(action?.id) || 'unnamed';
  const risk = text(action?.risk) || 'unknown';
  const actors = Array.isArray(action?.actors) && action.actors.length
    ? action.actors.map((a) => text(a)).filter(Boolean).join(',')
    : 'none';
  const status = text(action?.status).toLowerCase() || 'declared';
  const purpose = text(action?.purpose);
  const parts = [id, risk, actors, status];
  if (purpose) parts.push(purpose);
  return parts.join(' · ');
}

/** @param {ActionMatch} a @param {ActionMatch} b */
function compareMatches(a, b) {
  if (b.score !== a.score) return b.score - a.score;
  const x = String(a.action?.id ?? '');
  const y = String(b.action?.id ?? '');
  return x < y ? -1 : x > y ? 1 : 0;
}

/** @param {any} limit */
function normalizeLimit(limit) {
  const n = Number(limit);
  if (!Number.isFinite(n) || n < 1) return DEFAULT_LIMIT;
  return Math.floor(n);
}

/** The exact words of one field; a phrase field contributes each of its words. */
function wordSet(value) {
  const set = new Set();
  for (const word of tokenize(value)) set.add(word);
  return set;
}

/** @param {any} value */
function text(value) {
  return String(value ?? '').trim();
}
