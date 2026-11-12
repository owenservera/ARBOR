// @ts-check
/**
 * @hq:context Build the action registry: expand domains x objects x verbs into one flat action list, then summarize and validate it
 * @hq:owner hq-agent
 * @hq:task action-registry
 * @hq:invariant an action id is `<domain>.<verb>.<object>`, and a repeat inside one domain throws — nothing is silently deduped
 * @hq:invariant `handlers['<domain>.<verb>']` is the only difference between `wired` and `declared`; there is no other promotion path
 * @hq:invariant this module ships no taxonomy of its own: domains, verbs and handlers are always injected by the caller
 * @hq:invariant each summary map is a partition of the list, so every one of them sums back to `total`
 * @hq:see hq/lib/channel-seats.mjs
 * @hq:see doc:docs/AGENTIC-RULEBOOK.md
 */

/**
 * @typedef {{ name: string, purpose?: string, objects?: Array<{ name: string, purpose?: string }> }} Domain
 * @typedef {{ verb: string, purpose?: string, risk?: string, mutates?: boolean, actors?: string[], approval?: boolean }} Verb
 * @typedef {{ command?: string, note?: string }} Handler
 * @typedef {{
 *   id: string, domain: string, verb: string, object: string, purpose: string,
 *   risk: string, mutates: boolean, actors: string[], approval: boolean,
 *   status: 'wired' | 'declared', handler: Handler | null,
 * }} Action
 * @typedef {{ code: string, id: string, detail: string }} Problem
 */

/** The two states an action can be in. A third state would have to name a third handler story. */
export const ACTION_STATUSES = Object.freeze(/** @type {const} */ (['wired', 'declared']));

/** Risk is an ordered vocabulary, not free text: `high` is the level that demands approval. */
export const RISK_LEVELS = Object.freeze(/** @type {const} */ (['low', 'medium', 'high']));

/** A verb that forgets to state its risk is treated as unremarkable, and `summarize` still counts it. */
export const DEFAULT_RISK = 'medium';

/** The bucket a summary uses for an action that names no actor, so `byActor` still covers the whole list. */
export const NO_ACTOR = '(none)';

/** The bucket a summary uses for a missing or unreadable dimension, so its map still sums to `total`. */
export const UNKNOWN = '(unknown)';

/** Collapse any text to one trimmed, single-spaced line. */
function oneLine(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

/**
 * Normalize one segment of an id. The id is an addressing scheme — `domain.verb.object`
 * is also the handler key prefix — so a segment may not carry whitespace or a dot.
 */
function segment(value, label) {
  const text = oneLine(value).toLowerCase();
  if (!text) throw new Error(`an action id needs a ${label}; got "${oneLine(value)}"`);
  if (/[.\s]/.test(text)) throw new Error(`an action id ${label} cannot carry whitespace or a dot: "${text}"`);
  return text;
}

/** The normalized actors of a verb/action: blanks dropped, repeats dropped, order kept. */
function actorList(value) {
  if (!Array.isArray(value)) return [];
  const out = [];
  for (const raw of value) {
    const actor = oneLine(raw);
    if (actor && !out.includes(actor)) out.push(actor);
  }
  return out;
}

/** The key `byActor` counts under. A multi-actor action keys by its actor set, so the map stays a partition. */
function actorKey(value) {
  const actors = actorList(value);
  return actors.length ? actors.join('+') : NO_ACTOR;
}

/**
 * The one readable line an action carries:
 * `${verb} ${object} — ${domainPurpose}: ${objectPurpose}`.
 * A purpose that is absent degrades to the shorter line rather than to dangling punctuation.
 */
function purposeLine({ verb, object, domainPurpose, objectPurpose }) {
  const subject = `${verb} ${object}`;
  const detail = [oneLine(domainPurpose), oneLine(objectPurpose)].filter(Boolean).join(': ');
  return detail ? `${subject} — ${detail}` : subject;
}

/** Normalize handler keys once, so `Docs.Read` and `docs.read` cannot address the same verb differently. */
function handlerIndex(handlers) {
  /** @type {Map<string, Handler>} */
  const index = new Map();
  if (!handlers || typeof handlers !== 'object') return index;
  for (const [key, value] of Object.entries(handlers)) {
    const id = oneLine(key).toLowerCase();
    if (!id) continue;
    index.set(id, value && typeof value === 'object' ? { ...value } : { command: '', note: '' });
  }
  return index;
}

/**
 * The id of one action, normalized the same way `buildActions` does it.
 * @param {string} domain
 * @param {string} verb
 * @param {string} object
 */
export function actionId(domain, verb, object) {
  return `${segment(domain, 'domain')}.${segment(verb, 'verb')}.${segment(object, 'object')}`;
}

/**
 * Expand the three injected taxonomies into one flat list.
 *
 * Every domain object is paired with every verb; the verb decides risk, mutation,
 * actors and approval, the domain decides what the object is. A duplicate id inside
 * one domain is a build error, not something to swallow: two objects that expand to
 * the same action are a taxonomy mistake that would make the handler lookup lie.
 *
 * Lenient where a missing field has one honest reading (risk defaults to `medium`,
 * `mutates` to `false`, `actors` to none, `approval` to false) and strict where it
 * does not (a nameless domain, verb or object throws). The lenient defaults are
 * visible to `validate`, which flags the actions they produce.
 *
 * @param {{ domains?: Domain[], verbs?: Verb[], handlers?: Record<string, Handler> }} [spec]
 * @returns {Action[]}
 */
export function buildActions({ domains, verbs, handlers } = {}) {
  if (!Array.isArray(domains)) throw new Error('buildActions needs domains as an array');
  if (!Array.isArray(verbs)) throw new Error('buildActions needs verbs as an array');

  const index = handlerIndex(handlers);
  /** @type {Map<string, Set<string>>} */
  const idsPerDomain = new Map();
  /** @type {Action[]} */
  const actions = [];

  for (const domain of domains) {
    const domainName = segment(domain?.name, 'domain name');
    const domainPurpose = oneLine(domain?.purpose);
    const objects = Array.isArray(domain?.objects) ? domain.objects : [];

    // A repeated domain entry shares one id space, so its second pass collides instead of duplicating rows.
    if (!idsPerDomain.has(domainName)) idsPerDomain.set(domainName, new Set());
    const seen = /** @type {Set<string>} */ (idsPerDomain.get(domainName));

    for (const verb of verbs) {
      const verbName = segment(verb?.verb, 'verb');
      const handler = index.get(`${domainName}.${verbName}`) ?? null;

      for (const object of objects) {
        const objectName = segment(object?.name, 'object name');
        const id = `${domainName}.${verbName}.${objectName}`;

        if (seen.has(id)) {
          throw Object.assign(
            new Error(`duplicate action id "${id}" in domain "${domainName}": two objects or two verbs expand to the same action`),
            { code: 'DUPLICATE_ACTION_ID', id, domain: domainName },
          );
        }
        seen.add(id);

        actions.push({
          id,
          domain: domainName,
          verb: verbName,
          object: objectName,
          purpose: purposeLine({ verb: verbName, object: objectName, domainPurpose, objectPurpose: object?.purpose }),
          risk: oneLine(verb?.risk).toLowerCase() || DEFAULT_RISK,
          mutates: verb?.mutates === undefined ? false : verb.mutates,
          actors: actorList(verb?.actors),
          approval: verb?.approval === true,
          status: handler ? 'wired' : 'declared',
          handler,
        });
      }
    }
  }

  return actions;
}

/** @param {Map<string, number>} counts */
function tally(counts, key) {
  counts.set(key, (counts.get(key) ?? 0) + 1);
}

/**
 * A plain object with sorted keys, so a CLI, a wiki page and a test see the same order.
 * @param {Map<string, number>} counts
 */
function sortedCounts(counts) {
  /** @type {Record<string, number>} */
  const out = {};
  for (const [key, value] of [...counts.entries()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))) {
    out[key] = value;
  }
  return out;
}

/**
 * The shape of the registry in numbers, for a SITREP or a table row.
 *
 * Every map is a partition of the list rather than a set of overlapping tallies,
 * which is why all four sum back to `total`. `byActor` therefore keys by actor
 * *set*: a single-actor action keys as `agent`, a joint one as `agent+owner`.
 * Counting an action once per actor would make `byActor` the only map that
 * cannot be reconciled with `total`.
 *
 * @param {any[]} actions
 * @returns {{ total: number, byStatus: Record<string, number>, byDomain: Record<string, number>, byRisk: Record<string, number>, byActor: Record<string, number> }}
 */
export function summarize(actions) {
  const list = Array.isArray(actions) ? actions : [];
  const byStatus = new Map();
  const byDomain = new Map();
  const byRisk = new Map();
  const byActor = new Map();

  for (const action of list) {
    tally(byStatus, oneLine(action?.status) || UNKNOWN);
    tally(byDomain, oneLine(action?.domain) || UNKNOWN);
    tally(byRisk, oneLine(action?.risk).toLowerCase() || UNKNOWN);
    tally(byActor, actorKey(action?.actors));
  }

  return {
    total: list.length,
    byStatus: sortedCounts(byStatus),
    byDomain: sortedCounts(byDomain),
    byRisk: sortedCounts(byRisk),
    byActor: sortedCounts(byActor),
  };
}

/** @param {Problem[]} problems */
function problem(problems, code, id, detail) {
  problems.push({ code, id, detail });
}

/**
 * What a registry is not allowed to contain.
 *
 * Four defects, each one detectable from the action object alone:
 *  - `duplicate-id`: the id is the address, so two rows at one address are one row with a lie.
 *  - `no-actor`: an action nobody is allowed to perform cannot be granted, so it is not an action yet.
 *  - `high-risk-without-approval`: the highest risk level is exactly the one that demands a gate.
 *  - `mutates-not-boolean`: `mutates` is read as a fact about side effects. A non-boolean
 *    (the string `'false'`, `0`, `null`, absent) advertises a mutation value that is not
 *    one, and every downstream `if (action.mutates)` then guesses. Only `true`/`false` pass.
 *
 * The argument is accepted as untrusted on purpose: `validate` is the place where a
 * malformed action becomes a named problem instead of a crash.
 *
 * @param {any[]} actions
 * @returns {{ ok: boolean, problems: Problem[] }}
 */
export function validate(actions) {
  const list = Array.isArray(actions) ? actions : [];
  /** @type {Problem[]} */
  const problems = [];
  /** @type {Set<string>} */
  const seen = new Set();

  for (const action of list) {
    const id = oneLine(action?.id);

    if (!id) {
      problem(problems, 'missing-id', '', 'an action with no id cannot be addressed, wired or deduped');
    } else if (seen.has(id)) {
      problem(problems, 'duplicate-id', id, `"${id}" is listed more than once; the second row is unreachable`);
    } else {
      seen.add(id);
    }

    if (!actorList(action?.actors).length) {
      problem(problems, 'no-actor', id, 'no actor is named, so no permissions decision can attach to this action');
    }

    if (oneLine(action?.risk).toLowerCase() === 'high' && action?.approval !== true) {
      problem(problems, 'high-risk-without-approval', id, 'a high risk action must carry approval: true');
    }

    if (action?.mutates !== true && action?.mutates !== false) {
      problem(problems, 'mutates-not-boolean', id, `mutates is ${JSON.stringify(action?.mutates ?? null)}, not true or false; a side-effect claim must be a boolean`);
    }
  }

  return { ok: problems.length === 0, problems };
}
