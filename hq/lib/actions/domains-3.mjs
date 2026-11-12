// @ts-check
/**
 * @hq:context Registry domain catalogue, part 3 — the five transport and intelligence domains (anet, acp, mcp, index, context) with exactly ten lowercase-hyphenated objects each.
 * @hq:owner hq-agent
 * @hq:task domains-3
 * @hq:invariant DOMAINS is ordered anet, acp, mcp, index, context and every domain carries exactly ten objects
 * @hq:invariant every object name is unique inside its domain, lowercase-hyphenated, and the array is read-only: a consumer indexes it, never extends it in place
 * @hq:invariant a purpose is one sentence stating what the object is, not what it might become
 * @hq:why one stated catalogue instead of a live probe: the registry lane needs a stable vocabulary for these objects before separate implementations drift on their naming
 * @hq:see doc:docs/COMMS-SYSTEM.md
 * @hq:see doc:hq/lib/mcp.mjs
 */

/**
 * @typedef {{ name: string, purpose: string }} DomainObject
 * @typedef {{
 *   name: string,
 *   purpose: string,
 *   objects: ReadonlyArray<DomainObject>,
 * }} Domain
 */

/**
 * The five domains, in registry order. Each object is a noun the domain
 * actually exposes on this host, not a speculative capability: anet is the
 * only cross-machine channel, ACP wake is dead here, MCP advertises tools
 * only, and the index holds files/symbols/imports rather than embeddings.
 *
 * @type {ReadonlyArray<Domain>}
 */
export const DOMAINS = Object.freeze([
  Object.freeze({
    name: 'anet',
    purpose: 'The only cross-machine channel: a joined node addressing peers by AID under a closed inbound policy.',
    objects: Object.freeze([
      Object.freeze({
        name: 'identity',
        purpose: 'The key pair and control token under ~/.anet that let a node sign and act, never read or copied by HQ.',
      }),
      Object.freeze({
        name: 'aid',
        purpose: 'The anet agent identifier (bafyreic…ernejqme) that is the only address anet can deliver to.',
      }),
      Object.freeze({
        name: 'node',
        purpose: 'One running anet agent, joined to a hub or not, that peers can address.',
      }),
      Object.freeze({
        name: 'hub',
        purpose: 'The relay a node joins so messages cross machines instead of only local pipes.',
      }),
      Object.freeze({
        name: 'peer',
        purpose: 'Another agent node, carrying our allow, trust or deny state and its spending limits.',
      }),
      Object.freeze({
        name: 'card',
        purpose: 'The public agent card a node advertises so peers can see what it is and does.',
      }),
      Object.freeze({
        name: 'task',
        purpose: 'A unit of delegated work held on the hub and fetched with `anet task get`.',
      }),
      Object.freeze({
        name: 'delegation',
        purpose: 'An `anet delegate` request that hands a task to a peer and returns its handle.',
      }),
      Object.freeze({
        name: 'autoreply',
        purpose: 'The exec policy (`exec/opencode`) that answers inbound messages when no session of ours is running.',
      }),
      Object.freeze({
        name: 'inbound-policy',
        purpose: 'The closed, open or approve gate that decides which inbound messages are accepted.',
      }),
    ]),
  }),
  Object.freeze({
    name: 'acp',
    purpose: 'The agent client protocol surface whose wake path is broken on this host and replaced by CLI resume.',
    objects: Object.freeze([
      Object.freeze({
        name: 'server',
        purpose: 'The zcode-acp-server endpoint that accepts JSON-RPC requests over a session pipe.',
      }),
      Object.freeze({
        name: 'session',
        purpose: 'One attached agent conversation, identified by the server session id.',
      }),
      Object.freeze({
        name: 'prompt',
        purpose: 'A `session/prompt` turn that requires an attached session before it will run.',
      }),
      Object.freeze({
        name: 'attach',
        purpose: 'Binding a client to an existing session id so a prompt has somewhere to land.',
      }),
      Object.freeze({
        name: 'resume',
        purpose: '`session/resume` or `load`, which needs a cwd and times out on this host.',
      }),
      Object.freeze({
        name: 'cancel',
        purpose: '`session/cancel`, stopping an in-flight turn without discarding the session.',
      }),
      Object.freeze({
        name: 'capability',
        purpose: 'One method a server advertises it can serve, such as the `session/send` this one lacks.',
      }),
      Object.freeze({
        name: 'transport',
        purpose: 'The stdio pipe that carries ACP frames between client and server.',
      }),
      Object.freeze({
        name: 'protocol-version',
        purpose: 'The ACP revision both sides agree to speak before any method is called.',
      }),
      Object.freeze({
        name: 'handshake',
        purpose: 'The initialize exchange that settles capabilities and protocol version.',
      }),
    ]),
  }),
  Object.freeze({
    name: 'mcp',
    purpose: 'The stdio JSON-RPC bridge that exposes the read-only index to a harness as tools.',
    objects: Object.freeze([
      Object.freeze({
        name: 'tool',
        purpose: 'One named, schema-typed read operation a client may call, such as hq_search.',
      }),
      Object.freeze({
        name: 'resource',
        purpose: 'A URI-addressed readable item some MCP servers expose beside their tools.',
      }),
      Object.freeze({
        name: 'prompt',
        purpose: 'A server-defined message template a client may request by name.',
      }),
      Object.freeze({
        name: 'server',
        purpose: 'The process answering JSON-RPC on stdio, here `hq` 1.0.0 advertising tools only.',
      }),
      Object.freeze({
        name: 'client',
        purpose: 'The host session that initializes, lists tools and calls them.',
      }),
      Object.freeze({
        name: 'protocol-version',
        purpose: 'The dated MCP revision negotiated, defaulting to 2025-11-25.',
      }),
      Object.freeze({
        name: 'tool-listing',
        purpose: 'The `tools/list` reply that carries every tool and its inputSchema.',
      }),
      Object.freeze({
        name: 'invocation',
        purpose: 'One `tools/call` name-and-arguments pair returning text content or an isError result.',
      }),
      Object.freeze({
        name: 'error-code',
        purpose: 'A JSON-RPC code — -32600 invalid request, -32601 method not found, -32602 invalid params.',
      }),
      Object.freeze({
        name: 'ping',
        purpose: 'A liveness request answered with an empty result, proving the server is still listening.',
      }),
    ]),
  }),
  Object.freeze({
    name: 'index',
    purpose: 'The content-addressed SQLite map of every space, from which search, graph and context read.',
    objects: Object.freeze([
      Object.freeze({
        name: 'file',
        purpose: 'One indexed file row with path, language, sha256, size, mtime and owning project.',
      }),
      Object.freeze({
        name: 'symbol',
        purpose: 'A function, class or constant extracted from a file with its line span.',
      }),
      Object.freeze({
        name: 'project',
        purpose: 'A registered repository root that owns its files, symbols and instructions.',
      }),
      Object.freeze({
        name: 'space',
        purpose: 'A working tree HQ walks under git-aware ignore, size and binary bounds.',
      }),
      Object.freeze({
        name: 'refresh',
        purpose: 'An incremental content-addressed pass (`hq index`) that rewrites only files whose hash changed.',
      }),
      Object.freeze({
        name: 'freshness',
        purpose: 'Whether the index still matches disk, reported by `hq check`.',
      }),
      Object.freeze({
        name: 'import',
        purpose: 'A module edge from an importer to an imported specifier, resolved or unresolved.',
      }),
      Object.freeze({
        name: 'dependency',
        purpose: 'The forward and reverse answers over import edges, read by `hq deps` and `hq impact`.',
      }),
      Object.freeze({
        name: 'orphan',
        purpose: 'An indexed reference that resolves to nothing, such as an `@hq:see` path with no file.',
      }),
      Object.freeze({
        name: 'content-hash',
        purpose: 'The sha256 that makes indexing incremental and bundle digests reproducible.',
      }),
    ]),
  }),
  Object.freeze({
    name: 'context',
    purpose: 'The deterministic projection that turns one task into a budgeted, verifiable slice of the index.',
    objects: Object.freeze([
      Object.freeze({
        name: 'bundle',
        purpose: 'The task-scoped, budgeted, verifiable object `hq context` emits as hq.context-bundle/1.',
      }),
      Object.freeze({
        name: 'budget',
        purpose: 'The maxTokens, reserved, capacity and used accounting that bounds a bundle.',
      }),
      Object.freeze({
        name: 'trigger',
        purpose: 'The task phrase or path pattern that makes an instruction or skill mandatory for routing.',
      }),
      Object.freeze({
        name: 'receipt',
        purpose: 'The stored evidence row — kind, task, sources, digest, bytes — proving which bytes were selected.',
      }),
      Object.freeze({
        name: 'selection',
        purpose: 'The candidates chosen by the knapsack under capacity and maxFiles.',
      }),
      Object.freeze({
        name: 'ranking',
        purpose: 'The score and reason each candidate carries before selection decides.',
      }),
      Object.freeze({
        name: 'omission',
        purpose: 'A candidate left out of the bundle with the reason `budget` or `unreadable`.',
      }),
      Object.freeze({
        name: 'verification',
        purpose: 'Re-reading the selected lines from disk and comparing digests without trusting retained text.',
      }),
      Object.freeze({
        name: 'handoff',
        purpose: 'The session bundle `hq handoff` writes for whoever continues the work.',
      }),
      Object.freeze({
        name: 'memory-tier',
        purpose: 'The now, later or canon tier a note occupies, where only canon needs owner confirmation.',
      }),
    ]),
  }),
]);
