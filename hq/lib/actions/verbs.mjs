// @ts-check
/**
 * @hq:context Action verbs — the closed ten-verb vocabulary (list, show, create, update, delete, validate, repair, export, watch, dispatch) with the risk, mutation, actor and approval facts that gate each one.
 * @hq:owner hq-agent
 * @hq:task action-verbs
 * @hq:invariant the ten verbs are closed and ordered: list, show, create, update, delete, validate, repair, export, watch, dispatch — a consumer may index the array, never extend it
 * @hq:invariant approval is true exactly when risk is 'high': a destructive or exfiltrating action is approved before it runs, never after
 * @hq:invariant mutates is false only for the read-only verbs list, show, validate and watch; every other verb changes state
 * @hq:invariant the app actor may read and may produce work (create, dispatch) but may never update, repair, delete or export
 * @hq:why one stated table instead of predicates: the registry, approval and dispatch lanes must agree on the same facts, so the facts live in one place and are read, not re-derived
 * @hq:see doc:docs/CANON-DECISIONS.md
 */

/**
 * @typedef {'low'|'medium'|'high'} VerbRisk
 * @typedef {'user'|'agent'|'app'} VerbActor
 * @typedef {{
 *   verb: string,
 *   purpose: string,
 *   risk: VerbRisk,
 *   mutates: boolean,
 *   actors: VerbActor[],
 *   approval: boolean,
 * }} Verb
 */

/**
 * Risk ladder: a verb that only reads is low; a verb that writes but can be
 * repeated or reversed is medium; a verb that destroys, rewrites or exfiltrates
 * is high. Approval follows the ladder: only high-risk verbs require it.
 *
 * @type {ReadonlyArray<Readonly<Verb>>}
 */
export const VERBS = Object.freeze([
  Object.freeze({
    verb: 'list',
    purpose: 'Read every matching object without changing any of them.',
    risk: /** @type {VerbRisk} */ ('low'),
    mutates: false,
    actors: /** @type {VerbActor[]} */ (['user', 'agent', 'app']),
    approval: false,
  }),
  Object.freeze({
    verb: 'show',
    purpose: 'Read one object in full without changing it.',
    risk: /** @type {VerbRisk} */ ('low'),
    mutates: false,
    actors: /** @type {VerbActor[]} */ (['user', 'agent', 'app']),
    approval: false,
  }),
  Object.freeze({
    verb: 'create',
    purpose: 'Write a new object into existence.',
    risk: /** @type {VerbRisk} */ ('medium'),
    mutates: true,
    actors: /** @type {VerbActor[]} */ (['user', 'agent', 'app']),
    approval: false,
  }),
  Object.freeze({
    verb: 'update',
    purpose: 'Change the stored fields of an existing object.',
    risk: /** @type {VerbRisk} */ ('medium'),
    mutates: true,
    actors: /** @type {VerbActor[]} */ (['user', 'agent']),
    approval: false,
  }),
  Object.freeze({
    verb: 'delete',
    purpose: 'Remove an object permanently.',
    risk: /** @type {VerbRisk} */ ('high'),
    mutates: true,
    actors: /** @type {VerbActor[]} */ (['user', 'agent']),
    approval: true,
  }),
  Object.freeze({
    verb: 'validate',
    purpose: 'Check an object against its rules and report what fails.',
    risk: /** @type {VerbRisk} */ ('low'),
    mutates: false,
    actors: /** @type {VerbActor[]} */ (['user', 'agent', 'app']),
    approval: false,
  }),
  Object.freeze({
    verb: 'repair',
    purpose: 'Rewrite a broken object so it satisfies its rules again.',
    risk: /** @type {VerbRisk} */ ('high'),
    mutates: true,
    actors: /** @type {VerbActor[]} */ (['user', 'agent']),
    approval: true,
  }),
  Object.freeze({
    verb: 'export',
    purpose: 'Copy an object out of the system to a destination outside it.',
    risk: /** @type {VerbRisk} */ ('high'),
    mutates: true,
    actors: /** @type {VerbActor[]} */ (['user', 'agent']),
    approval: true,
  }),
  Object.freeze({
    verb: 'watch',
    purpose: 'Observe an object over time and report changes without acting on them.',
    risk: /** @type {VerbRisk} */ ('low'),
    mutates: false,
    actors: /** @type {VerbActor[]} */ (['user', 'agent', 'app']),
    approval: false,
  }),
  Object.freeze({
    verb: 'dispatch',
    purpose: 'Hand an object to a worker to act on it.',
    risk: /** @type {VerbRisk} */ ('medium'),
    mutates: true,
    actors: /** @type {VerbActor[]} */ (['user', 'agent', 'app']),
    approval: false,
  }),
]);
