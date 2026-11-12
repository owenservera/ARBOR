// @ts-check
/**
 * @hq:context The words an operator actually uses, mapped onto the registry's vocabulary, so
 *   `hq do "rename a conversation"` can reach `thread.update.title` without knowing either word.
 * @hq:owner channel-manager
 * @hq:task action-map
 * @hq:invariant expansion is symmetric: if X lists Y, Y lists X
 * @hq:invariant an unknown token returns itself — never empty, never a throw
 * @hq:see doc:docs/AGENT-BUS.md
 */

/** registry word → the words people say instead. Reverse links are derived, not typed twice. */
export const ALIASES = Object.freeze({
  thread: ['conversation', 'chat', 'dialog', 'dialogue', 'discussion'],
  session: ['conversation', 'thread', 'window', 'tab'],
  seat: ['agent-session', 'teammate', 'worker', 'agent', 'participant'],
  message: ['msg', 'note', 'ping', 'text'],
  inbox: ['mailbox', 'queue', 'mail'],
  wake: ['nudge', 'poke', 'start', 'resume', 'kick', 'activate'],
  prompt: ['instruction', 'ask', 'request'],
  reply: ['answer', 'response'],
  approval: ['approve', 'sign-off', 'consent', 'gate', 'authorize', 'permission'],
  revocation: ['revoke', 'cancel', 'withdraw', 'disable'],
  task: ['job', 'work-item', 'ticket', 'chore'],
  evidence: ['receipt', 'proof', 'record', 'log', 'audit'],
  outcome: ['result', 'consequence'],
  decision: ['ruling', 'verdict', 'call'],
  index: ['reindex', 'catalogue', 'catalog', 'inventory'],
  context: ['bundle', 'briefing', 'digest', 'brief'],
  memory: ['knowledge', 'recollection', 'note'],
  wiki: ['docs', 'documentation', 'pages'],
  health: ['doctor', 'status', 'diagnostic', 'diagnose'],
  delete: ['remove', 'drop', 'purge', 'destroy'],
  list: ['ls', 'enumerate', 'inventory'],
  show: ['get', 'read', 'inspect', 'view', 'display'],
  create: ['add', 'new', 'open', 'make', 'register'],
  update: ['edit', 'change', 'set', 'rename', 'modify', 'patch'],
  export: ['dump', 'download', 'extract', 'copy-out'],
  watch: ['monitor', 'tail', 'follow', 'observe'],
  dispatch: ['send', 'fire', 'hand-off', 'handoff', 'route', 'delegate', 'wake', 'start', 'run', 'invoke'],
  validate: ['check', 'verify', 'confirm', 'audit'],
  repair: ['fix', 'heal', 'recover', 'restore'],
  name: ['title', 'label', 'rename'],
  heartbeat: ['liveness', 'pulse', 'alive'],
  peer: ['agent', 'node', 'participant'],
  bot: ['robot', 'assistant', 'helper'],
});

const INDEX = (() => {
  /** @type {Map<string, Set<string>>} */
  const map = new Map();
  const add = (a, b) => {
    if (a === b) return;
    if (!map.has(a)) map.set(a, new Set());
    map.get(a).add(b);
  };
  for (const [word, synonyms] of Object.entries(ALIASES)) {
    for (const s of synonyms) { add(word, s); add(s, word); }
  }
  return map;
})();

/**
 * The token plus everything it is a synonym of, in both directions.
 * @param {string} token
 * @returns {string[]}
 */
export function expand(token) {
  const t = String(token ?? '').toLowerCase().trim();
  if (!t) return [];
  const direct = INDEX.get(t);
  return direct ? [t, ...[...direct].sort()] : [t];
}

/** Every registry word and every synonym, for diagnostics. */
export function vocabulary() {
  return [...INDEX.keys()].sort();
}
