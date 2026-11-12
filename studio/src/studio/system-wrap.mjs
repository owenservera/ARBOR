/**
 * @hq:context The wrap: one manifest of every subsystem, and one verifier that proves consistency.
 * @hq:owner atlas
 * @hq:task VC-30
 * @hq:invariant a subsystem that is not in the manifest does not exist to the system.
 * @hq:invariant verifySystem never reports ok:true while a check could not run.
 */
// The whole node in one place: what exists, who owns it, what it promises, how to call it, and the
// checks that prove the promises still hold. Everything else in the tree is an implementation detail
// of one of these entries.

export const MANIFEST_VERSION = 1;

export const SUBSTRATES = [
  {
    id: 'atoms',
    label: 'Atomic browser capabilities',
    owner: 'atlas',
    entry: 'studio/src/studio/browser-atoms.mjs',
    cli: ['studio atoms status', 'studio atoms list', 'studio atoms show', 'studio atoms plan', 'studio atoms run'],
    provides: '2103 atomic capabilities from 22 families, each declaring primitive, effect and args',
    invariants: ['ATOM_COUNT', 'ATOM_UNIQUE', 'ATOM_PRIMITIVE_HANDLED'],
  },
  {
    id: 'roles',
    label: 'Manager roles',
    owner: 'atlas',
    entry: 'studio/src/studio/atom-roles.mjs',
    cli: ['studio atoms roles'],
    provides: 'four managers (browser, tab, account, provider) owning an exclusive partition',
    invariants: ['ROLE_EXCLUSIVE', 'SEND_ONLY_PROVIDER', 'NO_SECRET_ARGS'],
  },
  {
    id: 'state',
    label: 'Live state variables',
    owner: 'atlas',
    entry: 'studio/src/studio/state-vars.mjs',
    cli: ['studio state vars', 'studio state live', 'studio state coverage', 'studio state show'],
    provides: '34 variables across 6 scopes, at least 3 bound to every atom',
    invariants: ['STATE_VAR_KNOWN', 'STATE_MIN_THREE'],
  },
  {
    id: 'channel',
    label: 'Agent to ChatGPT channel',
    owner: 'atlas',
    entry: 'studio/src/studio/chat-channel.mjs',
    cli: ['studio chat ask', 'studio chat work', 'studio chat revoke', 'studio chat stats'],
    provides: 'replay-safe send with scopes, budget, revocation and receipts',
    invariants: ['CHANNEL_IDEMPOTENT', 'CHANNEL_NO_AUTO_RETRY'],
  },
  {
    id: 'encoding',
    label: 'Header/footer index encoding',
    owner: 'atlas',
    entry: 'studio/src/studio/message-index.mjs',
    cli: ['studio chat stats'],
    provides: 'self-referential, determinate frame language with its own vocabulary frames',
    invariants: ['ENCODING_SELFCHECK'],
  },
  {
    id: 'capabilities',
    label: 'Channel capability list',
    owner: 'channel-manager',
    entry: 'studio/src/studio/capability-index.mjs',
    cli: [],
    provides: '100-item list encoded as frames; state derived from receipts, never asserted',
    invariants: ['CAP_DETERMINISTIC'],
  },
  {
    id: 'transport',
    label: 'Browser transport',
    owner: 'browser-manager',
    entry: 'studio/bin/commands/chat.mjs',
    cli: ['studio drive', 'studio launch'],
    provides: 'the only path to a live page; drive-backed with attachment confirmation',
    invariants: ['TRANSPORT_JSON_EXTRACTED'],
  },
];

/** Every check the system can make about itself. Each is independently runnable and reportable. */
export const CHECKS = {
  ATOM_COUNT: {
    what: 'each family holds exactly its declared size (generated: 100; capability families: FAMILY_SIZES)',
    async run() {
      const { loadRegistry, FAMILIES, PER_FAMILY, FAMILY_SIZES } = await import('./browser-atoms.mjs');
      const reg = await loadRegistry();
      const expected = FAMILIES.reduce((n, f) => n + (FAMILY_SIZES[f] ?? PER_FAMILY), 0);
      return { ok: reg.count === expected && reg.complete, detail: `${reg.count}/${expected} atoms, complete=${reg.complete}` };
    },
  },
  ATOM_UNIQUE: {
    what: 'no atom id appears twice',
    async run() {
      const { loadRegistry } = await import('./browser-atoms.mjs');
      const reg = await loadRegistry();
      return { ok: reg.unique === reg.count, detail: `${reg.unique} unique of ${reg.count}` };
    },
  },
  ATOM_PRIMITIVE_HANDLED: {
    what: 'every primitive an atom names has a dispatcher handler',
    async run() {
      const { loadRegistry } = await import('./browser-atoms.mjs');
      const { PRIMITIVE_HANDLERS } = await import('./atom-dispatch.mjs');
      const reg = await loadRegistry();
      const prims = [...new Set(reg.atoms.map((a) => a.primitive))];
      const missing = prims.filter((p) => typeof PRIMITIVE_HANDLERS[p] !== 'function');
      return { ok: missing.length === 0, detail: `${prims.length} primitives, missing: ${missing.join(',') || 'none'}` };
    },
  },
  ROLE_EXCLUSIVE: {
    what: 'every atom has exactly one owning manager and the partition covers all atoms',
    async run() {
      const { loadRegistry } = await import('./browser-atoms.mjs');
      const { validateRoles } = await import('./atom-roles.mjs');
      const reg = await loadRegistry();
      const check = validateRoles(reg.atoms);
      return { ok: check.ok && check.total === reg.count, detail: JSON.stringify(check.counts) };
    },
  },
  SEND_ONLY_PROVIDER: {
    what: 'no provider-send is held outside the provider role',
    async run() {
      const { loadRegistry } = await import('./browser-atoms.mjs');
      const { roleOf } = await import('./atom-roles.mjs');
      const reg = await loadRegistry();
      const bad = reg.atoms.filter((a) => a.effect === 'provider-send' && roleOf(a) !== 'provider');
      return { ok: bad.length === 0, detail: bad.length ? bad.map((a) => a.id).join(',') : 'none outside provider' };
    },
  },
  NO_SECRET_ARGS: {
    what: 'no atom declares a credential-shaped argument',
    async run() {
      const { loadRegistry } = await import('./browser-atoms.mjs');
      const reg = await loadRegistry();
      const bad = reg.atoms.filter((a) => (a.args ?? []).some((x) => /^(password|token|secret|credential|cookie|apikey|api_key)$/i.test(x.name)));
      return { ok: bad.length === 0, detail: bad.length ? bad.slice(0, 5).map((a) => a.id).join(',') : 'none' };
    },
  },
  STATE_VAR_KNOWN: {
    what: 'every state variable an atom binds exists in the registry',
    async run() {
      const { loadRegistry } = await import('./browser-atoms.mjs');
      const { stateVarsFor, USED_VARS } = await import('./state-bind.mjs');
      const { getVar } = await import('./state-vars.mjs');
      const reg = await loadRegistry();
      const unknown = new Set();
      for (const atom of reg.atoms) {
        for (const v of stateVarsFor(atom)) {
          if (!USED_VARS.has(v)) unknown.add(`not-declared:${v}`);
          try { getVar(v); } catch { unknown.add(v); }
        }
      }
      return { ok: unknown.size === 0, detail: unknown.size ? [...unknown].slice(0, 5).join(',') : 'all known' };
    },
  },
  STATE_MIN_THREE: {
    what: 'every atom binds at least three live state variables',
    async run() {
      const { loadRegistry } = await import('./browser-atoms.mjs');
      const { stateVarsFor } = await import('./state-bind.mjs');
      const reg = await loadRegistry();
      const thin = reg.atoms.filter((a) => stateVarsFor(a).length < 3);
      return { ok: thin.length === 0, detail: thin.length ? `${thin.length} atoms below 3, e.g. ${thin[0].id}` : 'min >= 3 everywhere' };
    },
  },
  CHANNEL_IDEMPOTENT: {
    what: 'a duplicate requestId performs no second transport call',
    async run() {
      const { createChatChannel } = await import('./chat-channel.mjs');
      let calls = 0;
      const receipts = new Map();
      const store = {
        async get(id) { return receipts.get(id) ?? null; },
        async put(r) { if (!receipts.has(r.requestId)) receipts.set(r.requestId, { ...r }); },
        async isRevoked() { return false; },
        async revoke() {},
      };
      const transport = {
        async createThread() { return { threadId: 't' }; },
        async send() { calls += 1; return { effect: 'OK', reply: 'ok', threadId: 't', journalKey: 'k' }; },
      };
      const channel = createChatChannel({ transport, store });
      const input = { scope: 'chatgpt.send', taskId: 'wrap', thread: 'new', prompt: 'p', requestId: 'wrap-1' };
      await channel.run(input);
      await channel.run(input);
      return { ok: calls === 1, detail: `transport calls: ${calls}` };
    },
  },
  CHANNEL_NO_AUTO_RETRY: {
    what: 'an UNCERTAIN turn is terminal and never retried',
    async run() {
      const { createChatChannel } = await import('./chat-channel.mjs');
      let calls = 0;
      const store = { async get() { return null; }, async put() {}, async isRevoked() { return false; }, async revoke() {} };
      const transport = { async createThread() { return { threadId: 't' }; }, async send() { calls += 1; throw new Error('timeout'); } };
      const channel = createChatChannel({ transport, store });
      const { receipt } = await channel.run({ scope: 'chatgpt.send', taskId: 'w', thread: 'new', prompt: 'p', requestId: 'w2', maxTurns: 3 });
      return { ok: receipt.effect === 'UNCERTAIN' && calls === 1, detail: `effect=${receipt.effect} calls=${calls}` };
    },
  },
  ENCODING_SELFCHECK: {
    what: 'the frame language rebuilds its own vocabulary deterministically',
    async run() {
      const { selfCheck } = await import('./message-index.mjs');
      const r = selfCheck();
      return { ok: r.ok === true, detail: r.ok ? `${r.entries} vocabulary frames` : String(r.reason) };
    },
  },
  CAP_DETERMINISTIC: {
    what: 'the capability list is regenerable from frames plus lexicon',
    async run() {
      const mod = await import('./capability-index.mjs');
      const entries = mod.parseCapabilityDoc(await (await import('node:fs/promises')).readFile('C:/0-BlackBoxProject-0/repos_hq/docs/integration/CHANNEL-CAPABILITIES.md', 'utf8'));
      const frames = entries.map((e) => mod.parseCapability( mod.encodeCapability({ num: e.num, domain: e.domain, state: e.state })));
      const lexicon = new Map(entries.map((e) => [e.num, e.text]));
      const rebuilt = mod.renderCapabilityRows(frames, lexicon);
      const original = entries.map((e) => `| ${e.num} | ${e.text} | ${e.state} |`).join('\n');
      return { ok: rebuilt === original, detail: `${entries.length} rows round-tripped ${rebuilt === original ? 'identically' : 'WITH DIFFERENCES'}` };
    },
  },
  TRANSPORT_JSON_EXTRACTED: {
    what: 'drive stdout with progress lines still yields its JSON result',
    async run() {
      const { extractDriveJson } = await import('./drive-output.mjs');
      try {
        const parsed = extractDriveJson('tab x\nsent via enter\n{"ok":true,"reply":"hi"}');
        return { ok: parsed.ok === true && parsed.reply === 'hi', detail: 'noisy stdout parsed' };
      } catch (e) { return { ok: false, detail: String(e.message) }; }
    },
  },
};

/**
 * Run every check. A check that throws is reported as failed with its error, never skipped —
 * a verifier that silently drops an unrunnable check is worse than no verifier.
 */
export async function verifySystem({ only = null } = {}) {
  const ids = only ? Object.keys(CHECKS).filter((k) => only.includes(k)) : Object.keys(CHECKS);
  const checks = [];
  for (const id of ids) {
    const def = CHECKS[id];
    try {
      const r = await def.run();
      checks.push({ id, what: def.what, ok: r.ok === true, detail: String(r.detail ?? '') });
    } catch (error) {
      checks.push({ id, what: def.what, ok: false, detail: `THREW: ${String(error?.message ?? error)}` });
    }
  }
  const failed = checks.filter((c) => !c.ok);
  return {
    schema: 'vivim.system-verify/1',
    version: MANIFEST_VERSION,
    ok: failed.length === 0,
    total: checks.length,
    passed: checks.length - failed.length,
    failed: failed.map((c) => c.id),
    checks,
  };
}

/** The manifest as a whole-system summary an operator can read. */
export function manifestSummary() {
  return {
    schema: 'vivim.system-manifest/1',
    version: MANIFEST_VERSION,
    substrates: SUBSTRATES.map((s) => ({ id: s.id, label: s.label, owner: s.owner, entry: s.entry, cli: s.cli })),
    invariantCount: Object.keys(CHECKS).length,
    invariants: Object.entries(CHECKS).map(([id, def]) => ({ id, what: def.what })),
  };
}
