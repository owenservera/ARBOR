// @ts-check
/**
 * @hq:context Action domains, second group — the five object vocabularies (approval, revocation, task, inbox, bot) that the registry lane composes into action ids, each object named after a thing that a module in this repo already holds.
 * @hq:owner hq-agent
 * @hq:task action-domains
 * @hq:invariant each domain lists exactly ten objects, and an object name is unique inside its domain: an action id is `domain.object`, so a duplicate would silently overwrite a registry row
 * @hq:invariant object names are lowercase-hyphenated and purpose is one sentence, because the router matches an object as an exact token and only the purpose by substring
 * @hq:invariant the order of DOMAINS is approval, revocation, task, inbox, bot — a consumer may index the array, never reorder it
 * @hq:invariant this table describes objects only: it declares no verb, resolves no handler, mutates nothing, and is not authority to run anything
 * @hq:why the objects are read off the modules rather than invented: `hq/lib/approvals.mjs` owns request/decision/queue/expiry, `revocations.mjs` owns subject/kind/reason/ledger, `task-lifecycle.mjs` owns the MOVES table, `comms-roof.mjs` owns probeInboxes, and the playbook `bots.mjs` owns the roster and lane surface — a domain that names nothing real would route to a dead handler
 * @hq:see hq/lib/actions/verbs.mjs
 * @hq:see hq/lib/action-router.mjs
 * @hq:see doc:docs/CANON-DECISIONS.md
 */

/**
 * One thing a domain acts on, named so `domain.object` reads as a noun phrase.
 *
 * @typedef {object} DomainObject
 * @property {string} name Lowercase, hyphenated, unique inside its domain.
 * @property {string} purpose One sentence: what this object is, in this codebase.
 */

/**
 * One product domain and the ten objects it exposes.
 *
 * @typedef {object} Domain
 * @property {string} name Lowercase, hyphenated.
 * @property {string} purpose One sentence: what the domain is for.
 * @property {ReadonlyArray<Readonly<DomainObject>>} objects Exactly ten.
 */

/**
 * The five domains in registry order. Frozen at both levels so a caller cannot
 * append an eleventh object to a domain that the ten-object convention closed.
 *
 * @type {ReadonlyArray<Readonly<Domain>>}
 */
export const DOMAINS = Object.freeze([
  Object.freeze({
    name: 'approval',
    purpose: 'Owner consent for an agent action: one append-only queue where a request is asked once and decided once.',
    objects: Object.freeze([
      Object.freeze({
        name: 'request',
        purpose: 'The ask: the action an agent would perform and the target it would touch, with the requesting agent named.',
      }),
      Object.freeze({
        name: 'decision',
        purpose: 'The single allow-or-deny line for one request, refused as ALREADY_DECIDED once a decision exists.',
      }),
      Object.freeze({
        name: 'queue',
        purpose: 'The append-only JSONL the caller names, one JSON object per line, where a request and a decision are new lines and never a rewrite.',
      }),
      Object.freeze({
        name: 'expiry',
        purpose: 'The expiry derived from an explicit ISO stamp or a minute TTL and evaluated at read time, so a request that went stale cannot be approved afterwards.',
      }),
      Object.freeze({
        name: 'approver',
        purpose: 'The `by` recorded on the decision, left null when the decider does not name itself.',
      }),
      Object.freeze({
        name: 'note',
        purpose: 'The optional free text carried on the decision, so the reason sits beside the verdict it explains.',
      }),
      Object.freeze({
        name: 'scope',
        purpose: 'The boundary a grant covers when it is deliberately narrower than the whole target.',
      }),
      Object.freeze({
        name: 'policy',
        purpose: 'The stated rules: an action and a target are mandatory, the verdict is only allow or deny, and one request takes exactly one decision.',
      }),
      Object.freeze({
        name: 'escalation',
        purpose: 'An expired request, which the module answers by telling the caller to enqueue the action again rather than approve a stale one.',
      }),
      Object.freeze({
        name: 'audit',
        purpose: 'The read-time fold that counts each state and reports unreadable lines and decisions naming no request, so a silent drop is visible.',
      }),
    ]),
  }),
  Object.freeze({
    name: 'revocation',
    purpose: 'Withdrawing a scope, seat or send: an append-only ledger that says what was taken away, on whose word, why, and from when.',
    objects: Object.freeze([
      Object.freeze({
        name: 'subject',
        purpose: 'What is revoked, named as the one thing the row takes away, and refused as NO_SUBJECT when blank.',
      }),
      Object.freeze({
        name: 'kind',
        purpose: 'Which class of thing is taken away: a scope, a seat or a send, and nothing else.',
      }),
      Object.freeze({
        name: 'reason',
        purpose: 'The mandatory stated why, refused as NO_REASON when blank, because an unauditable revocation is not a revocation.',
      }),
      Object.freeze({
        name: 'ledger',
        purpose: 'The append-only revocations.jsonl kept inside the directory the caller hands over, with no default location written by omission.',
      }),
      Object.freeze({
        name: 'window',
        purpose: 'The time bound: a revocation applies from its recorded `at` and never to a moment before it.',
      }),
      Object.freeze({
        name: 'supersession',
        purpose: 'A later row for the same subject and kind is the word in force, while the earlier row stays on disk unrewritten.',
      }),
      Object.freeze({
        name: 'check',
        purpose: 'The effect-boundary question answered by `isRevoked`: was this subject revoked by the moment in hand.',
      }),
      Object.freeze({
        name: 'replay',
        purpose: 'Reading the ledger back newest-first with counts by kind, so both "what stands now" and "what was ever revoked" are answerable.',
      }),
      Object.freeze({
        name: 'secret-guard',
        purpose: 'The credential-shape scan that refuses a reason as SECRET_IN_REASON and sends the revoker to name where the credential lives instead.',
      }),
      Object.freeze({
        name: 'attribution',
        purpose: 'The `by` carried on the row and left null when nobody claims it, so a revoker is optional while a reason is not.',
      }),
    ]),
  }),
  Object.freeze({
    name: 'task',
    purpose: 'A typed task between agents: opened, claimed, worked and closed, with the current state derived from the tail of one append-only ledger.',
    objects: Object.freeze([
      Object.freeze({
        name: 'task',
        purpose: 'One opened unit of work: an id, a title, the target that may claim it, and who opened it.',
      }),
      Object.freeze({
        name: 'transition',
        purpose: 'One appended move from the state the ledger implies to a legal next state, carrying the mover and an optional note.',
      }),
      Object.freeze({
        name: 'evidence',
        purpose: 'The proof entries a transition carries, counted across the whole trail so a task cannot reach done on a claim.',
      }),
      Object.freeze({
        name: 'claim',
        purpose: 'The target named at open, which states who is allowed to pick the task up.',
      }),
      Object.freeze({
        name: 'state-machine',
        purpose: 'The single MOVES table: open to claimed, claimed to working or failed, working to done or failed, with done and failed terminal.',
      }),
      Object.freeze({
        name: 'ledger',
        purpose: 'The append-only JSONL the caller names, where the last transition is the current state and no row is ever patched in place.',
      }),
      Object.freeze({
        name: 'outcome',
        purpose: 'The two terminal states, done and failed, which have no legal move out of them.',
      }),
      Object.freeze({
        name: 'abort',
        purpose: 'A task ended failed from claimed or working, closing it without ever claiming a done.',
      }),
      Object.freeze({
        name: 'refusal',
        purpose: 'A coded rejection that writes nothing: an illegal move, a missing title or target, or a closure with no evidence.',
      }),
      Object.freeze({
        name: 'view',
        purpose: 'The per-task fold with its current state, newest activity first, and counts by state that a filter never narrows.',
      }),
    ]),
  }),
  Object.freeze({
    name: 'inbox',
    purpose: 'Each bot\'s message file: the messages, threads and groups a project\'s .zcode/bots/inbox holds, plus the two ledgers that sit beside it.',
    objects: Object.freeze([
      Object.freeze({
        name: 'inbox',
        purpose: 'One JSONL file per bot inside a project\'s .zcode/bots/inbox, listed with its message count and its newest stamp.',
      }),
      Object.freeze({
        name: 'message',
        purpose: 'One appended row carrying a timestamp and the thread it belongs to, read as data and never as an instruction.',
      }),
      Object.freeze({
        name: 'thread',
        purpose: 'The grouping key inside a bot\'s inbox, counted per thread with the newest message that thread holds.',
      }),
      Object.freeze({
        name: 'group',
        purpose: 'A named set of members from .zcode/bots/groups.json, with the purpose it was created for.',
      }),
      Object.freeze({
        name: 'delivery',
        purpose: 'The delivered.jsonl ledger beside the inboxes, which is a record of the inbox and is never counted as a bot.',
      }),
      Object.freeze({
        name: 'receipt',
        purpose: 'The receipts.jsonl ledger beside it, likewise excluded from the roster so no agent is invented.',
      }),
      Object.freeze({
        name: 'read-state',
        purpose: 'Where a bot has read up to and which message ids it has acknowledged, so a routine can state what it consumed.',
      }),
      Object.freeze({
        name: 'project',
        purpose: 'The workspace whose inbox is being read, naming every item and thread so two projects may safely share a bot name.',
      }),
      Object.freeze({
        name: 'unreadable',
        purpose: 'A per-bot inbox reported with an unreadable count instead of thrown away, so a broken file is visible rather than absent.',
      }),
      Object.freeze({
        name: 'retention',
        purpose: 'The seven-day recent count and the newest stamp that say whether an inbox is still alive or has gone quiet.',
      }),
    ]),
  }),
  Object.freeze({
    name: 'bot',
    purpose: 'A named teammate in the playbook roster: a job, a routing role, the lane it compiles to, and the routines that schedule it.',
    objects: Object.freeze([
      Object.freeze({
        name: 'bot',
        purpose: 'One roster file at playbook/bots/<name>.md holding title, description, job, model or role, skills and approval boundary.',
      }),
      Object.freeze({
        name: 'role',
        purpose: 'The routing role a bot names instead of a model, resolved to a lane at build time or against live health at run time.',
      }),
      Object.freeze({
        name: 'routine',
        purpose: 'A declared id with a cron, a draft-or-act mode, a task, and the approval scope an act-mode run may use.',
      }),
      Object.freeze({
        name: 'ladder',
        purpose: 'The ordered lanes a role falls through, so a cooled home lane moves the run on instead of failing it.',
      }),
      Object.freeze({
        name: 'lane',
        purpose: 'The concrete provider and model a bot compiles to, reported with its home lane and the healthy set it resolved against.',
      }),
      Object.freeze({
        name: 'health',
        purpose: 'Which lanes are serving right now, asked of the router, where an unreachable answer is unknown and never treated as healthy.',
      }),
      Object.freeze({
        name: 'compile',
        purpose: 'The byte-stable bot-<name>.md agent definition generated from the roster file, which is the only thing an installer reads.',
      }),
      Object.freeze({
        name: 'template',
        purpose: 'A bot exported to a file so the roster entry can be kept and imported again as a new teammate under a new name.',
      }),
      Object.freeze({
        name: 'ownership',
        purpose: 'The exactly-one-main rule: one Bot owns the roster as Main Bot and every other entry is a teammate.',
      }),
      Object.freeze({
        name: 'schedule',
        purpose: 'The runs a cron makes due or missed inside the lookback window, each with a run id and the self-contained prompt to hand an agent.',
      }),
    ]),
  }),
]);
