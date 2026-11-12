// @ts-check
/**
 * @hq:context Domain catalog, part four — the memory, wiki, kernel, workspace and ops domains, each with exactly ten objects and one sentence saying what the object is for.
 * @hq:owner hq-agent
 * @hq:task domain-catalog
 * @hq:invariant the five domains appear in this order: memory, wiki, kernel, workspace, ops — a consumer may index the array, never reorder or extend it
 * @hq:invariant every domain carries exactly ten objects; every object name is lowercase-hyphenated and unique inside its domain, so `domain:object` is a stable address
 * @hq:invariant a purpose states what an object is for; it never promises an effect, an approval or an execution that HQ does not own
 * @hq:why one stated table instead of a registry query: the action, approval and registry lanes must agree on the same domain and object names, so the names live in one place and are read, not re-derived
 * @hq:see hq/lib/memory.mjs
 * @hq:see hq/lib/wiki.mjs
 * @hq:see hq/lib/kernel/store.mjs
 * @hq:see hq/lib/registry.mjs
 */

/**
 * @typedef {{ name: string, purpose: string }} DomainObject
 * @typedef {{ name: string, purpose: string, objects: ReadonlyArray<Readonly<DomainObject>> }} Domain
 */

/**
 * The catalog is closed like the verb table: a domain is exactly ten objects,
 * an object is exactly a name and a purpose, and the address of an object is
 * the pair `domain:object`. Anything a lane needs beyond that is looked up in
 * the module that owns the object, never inferred from this table.
 *
 * @type {ReadonlyArray<Readonly<Domain>>}
 */
export const DOMAINS = Object.freeze([
  Object.freeze({
    name: 'memory',
    purpose: 'Notes held at three tiers, the rules that promote or retire them, and the provenance that survives every move.',
    objects: Object.freeze([
      Object.freeze({
        name: 'note',
        purpose: 'One recorded memory unit, addressed by its tier, key and content hash.',
      }),
      Object.freeze({
        name: 'tier',
        purpose: 'The now, later or canon rung that decides how far a note may travel.',
      }),
      Object.freeze({
        name: 'promotion',
        purpose: 'The single-step move of a note up one tier under that tier\'s rule.',
      }),
      Object.freeze({
        name: 'index',
        purpose: 'The stored lookup that lists and filters notes by tier, project and text.',
      }),
      Object.freeze({
        name: 'retention',
        purpose: 'The rule that decides how long an active note stays worth keeping.',
      }),
      Object.freeze({
        name: 'recall',
        purpose: 'The deterministic match of stored notes to a task or query.',
      }),
      Object.freeze({
        name: 'core-memory',
        purpose: 'The owner-confirmed canon tier that no agent may demote.',
      }),
      Object.freeze({
        name: 'owner-confirmation',
        purpose: 'The explicit owner act a canon promotion requires and that no agent can supply.',
      }),
      Object.freeze({
        name: 'provenance',
        purpose: 'The origin, evidence and confidence that travel with a note through every tier.',
      }),
      Object.freeze({
        name: 'prune',
        purpose: 'The archival pass that retires a note no longer earning its place while keeping its record.',
      }),
    ]),
  }),
  Object.freeze({
    name: 'wiki',
    purpose: 'The generated code and documentation wiki: pages built from one index state, with their links, freshness and orphan evidence.',
    objects: Object.freeze([
      Object.freeze({
        name: 'page',
        purpose: 'One generated markdown page or browser view with its own file name.',
      }),
      Object.freeze({
        name: 'generation',
        purpose: 'The single deterministic build that turns one index state into the whole wiki.',
      }),
      Object.freeze({
        name: 'staleness',
        purpose: 'The measured gap between the current index and the last generation.',
      }),
      Object.freeze({
        name: 'family',
        purpose: 'A group of pages of one kind, such as index, symbols, graph or docs.',
      }),
      Object.freeze({
        name: 'index',
        purpose: 'The page that lists every page with its purpose and link.',
      }),
      Object.freeze({
        name: 'link',
        purpose: 'A relative reference from one generated page to another.',
      }),
      Object.freeze({
        name: 'orphan',
        purpose: 'A page that no other page links to and that the index would not lead anyone to.',
      }),
      Object.freeze({
        name: 'render',
        purpose: 'The sorted and escaped conversion of a loaded model into page text.',
      }),
      Object.freeze({
        name: 'diff',
        purpose: 'The comparison of two generations of the same page.',
      }),
      Object.freeze({
        name: 'publish',
        purpose: 'The write of a finished build into the wiki output directory.',
      }),
    ]),
  }),
  Object.freeze({
    name: 'kernel',
    purpose: 'The durable revisioned store outside .hq/, its schemas and migrations, and the connectors that observe external sources into it.',
    objects: Object.freeze([
      Object.freeze({
        name: 'store',
        purpose: 'The durable revisioned database that lives outside .hq/ and survives an index reset.',
      }),
      Object.freeze({
        name: 'revision',
        purpose: 'One accepted mutation, appended with its ordinal, hash and provenance and never rewritten.',
      }),
      Object.freeze({
        name: 'connector',
        purpose: 'A registered read-only observer that reads one external source through a cursor.',
      }),
      Object.freeze({
        name: 'conversation',
        purpose: 'A chat thread imported as a typed kernel object with its source pointer intact.',
      }),
      Object.freeze({
        name: 'schema',
        purpose: 'The versioned declaration that says which fields a kernel object may carry.',
      }),
      Object.freeze({
        name: 'migration',
        purpose: 'The tested path from one kernel schema version to the next.',
      }),
      Object.freeze({
        name: 'integrity',
        purpose: 'The hash chain and ordinal sequence that prove no revision was rewritten or dropped.',
      }),
      Object.freeze({
        name: 'backup',
        purpose: 'A consistent copy of the store taken through SQLite rather than the file system.',
      }),
      Object.freeze({
        name: 'rebuild',
        purpose: 'The regeneration of a derived projection from durable kernel data.',
      }),
      Object.freeze({
        name: 'window',
        purpose: 'The bounded observation span, in time or rows, that one connector run reads.',
      }),
    ]),
  }),
  Object.freeze({
    name: 'workspace',
    purpose: 'The registered spaces a workspace contains, where each one lives, who may touch what, and the boundaries between them.',
    objects: Object.freeze([
      Object.freeze({
        name: 'project',
        purpose: 'One registered repository or folder in the workspace.',
      }),
      Object.freeze({
        name: 'space',
        purpose: 'The owner-facing name for a registered project.',
      }),
      Object.freeze({
        name: 'registry',
        purpose: 'The versioned projects list that maps a space name to its location.',
      }),
      Object.freeze({
        name: 'path',
        purpose: 'The workspace-relative or absolute location a project resolves to.',
      }),
      Object.freeze({
        name: 'scope',
        purpose: 'The declared set of files or objects one run may read or write.',
      }),
      Object.freeze({
        name: 'ownership',
        purpose: 'The agent or seat that currently holds a shared reference.',
      }),
      Object.freeze({
        name: 'git-state',
        purpose: 'The branch, head and working-tree facts recorded for one space.',
      }),
      Object.freeze({
        name: 'claim',
        purpose: 'A declared hold on a shared reference taken before it is edited.',
      }),
      Object.freeze({
        name: 'boundary',
        purpose: 'The line that separates one space\'s files from another\'s.',
      }),
      Object.freeze({
        name: 'inventory',
        purpose: 'The counted list of spaces, files, languages and symbols the index holds.',
      }),
    ]),
  }),
  Object.freeze({
    name: 'ops',
    purpose: 'Installing, checking, updating and reporting on HQ itself as a local product.',
    objects: Object.freeze([
      Object.freeze({
        name: 'install',
        purpose: 'The placement of HQ and its tool bundle onto a machine.',
      }),
      Object.freeze({
        name: 'shim',
        purpose: 'The thin launcher that binds the hq command to the installed bundle.',
      }),
      Object.freeze({
        name: 'health',
        purpose: 'The aggregate verdict on whether the local system can do its work.',
      }),
      Object.freeze({
        name: 'doctor',
        purpose: 'The diagnostic pass that names the cause behind a failed check.',
      }),
      Object.freeze({
        name: 'update',
        purpose: 'The advance of an installed copy to a newer version without losing state.',
      }),
      Object.freeze({
        name: 'rollback',
        purpose: 'The return of an update to the version and state it replaced.',
      }),
      Object.freeze({
        name: 'permission',
        purpose: 'What an actor may do, held apart from what it is able to do.',
      }),
      Object.freeze({
        name: 'secret-scan',
        purpose: 'The scan that refuses credential-shaped content before it is stored.',
      }),
      Object.freeze({
        name: 'schedule',
        purpose: 'The timing that decides when automatic work such as indexing or sync runs.',
      }),
      Object.freeze({
        name: 'report',
        purpose: 'The evidence summary written for the owner after a run.',
      }),
    ]),
  }),
]);
