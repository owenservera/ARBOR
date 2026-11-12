/**
 * @hq:context Git and GitHub repository context bundle with default config and
 *   switchable protocols (git local-only | github opt-in | none).
 * @hq:owner owner
 * @hq:invariant Local-first: the `git` protocol never touches the network.
 *   `github` is opt-in because it shells out to a tool that does.
 * @hq:invariant Same repo state + same task => same digest. No timestamps in
 *   the digestible payload.
 * @hq:see docs/DCB-PROTOCOL.md
 * @hq:see hq/CONTRACT.md
 */

// hq/lib/git-context.mjs — the repository-aware slice of a context bundle.
//
// A normal DCB answers "what code and docs matter for this task". This module
// answers the other half: where the repo *is* — branch, divergence, working
// tree, recent history, and (when explicitly enabled) the GitHub surface:
// pull requests, issues and checks.
//
// Config precedence: DEFAULT_GIT_CONFIG < .hq/config.json `git` block < call args.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { join } from 'node:path';

export const GIT_CONTEXT_SCHEMA = 'hq.git-context/1';

export const DEFAULT_GIT_CONFIG = Object.freeze({
  // 'git'     local only: branch, divergence, status, log. No network.
  // 'github'  opt-in: adds PRs, issues, checks via the `gh` CLI.
  // 'none'    disabled entirely.
  protocol: 'git',
  remote: 'origin',
  includeCommits: 10,
  includeDirty: true,
  includeBranches: true,
  includePrs: 5,
  includeIssues: 5,
  includeChecks: true,
  maxTokens: 1200,
  github: { cli: 'gh', repo: null },
});

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/** Merge one config layer into `merged`, key by key. Nested objects merge
 *  recursively instead of replacing the whole object, so a later layer that
 *  sets one nested key never deletes its siblings (e.g. `context.dirty` survives
 *  a later layer that only sets `context.commits`). */
function mergeLayer(into, layer) {
  for (const [key, value] of Object.entries(layer)) {
    if (value === undefined) continue;
    if (isPlainObject(into[key]) && isPlainObject(value)) {
      into[key] = mergeLayer({ ...into[key] }, value);
    } else {
      into[key] = value;
    }
  }
  return into;
}

export function resolveGitConfig(...layers) {
  const merged = { ...DEFAULT_GIT_CONFIG, github: { ...DEFAULT_GIT_CONFIG.github } };
  for (const layer of layers) {
    if (!layer || typeof layer !== 'object') continue;
    mergeLayer(merged, layer);
  }
  const allowed = new Set(['git', 'github', 'none']);
  if (!allowed.has(merged.protocol)) {
    throw new Error(`hq: unknown git protocol "${merged.protocol}" (expected ${[...allowed].join(' | ')})`);
  }
  merged.includeCommits = clampInt(merged.includeCommits, 0, 100, 10);
  merged.includePrs = clampInt(merged.includePrs, 0, 50, 5);
  merged.includeIssues = clampInt(merged.includeIssues, 0, 50, 5);
  merged.maxTokens = clampInt(merged.maxTokens, 128, 24000, 1200);
  return merged;
}

// Read the `git` block from <root>/.hq/config.json without importing the registry.
export function gitConfigFromWorkspace(root) {
  const p = join(root, '.hq', 'config.json');
  if (!existsSync(p)) return {};
  try {
    const cfg = JSON.parse(readFileSync(p, 'utf8'));
    return cfg && typeof cfg.git === 'object' && cfg.git ? cfg.git : {};
  } catch {
    return {};
  }
}

function clampInt(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.trunc(n)));
}

function defaultRun(cwd, args) {
  const res = Bun.spawnSync({ cmd: args, cwd, stdout: 'pipe', stderr: 'pipe' });
  return { code: res.exitCode, out: res.stdout.toString(), err: res.stderr.toString() };
}

// ---------------------------------------------------------------- git state

export function gitState({ cwd = process.cwd(), config, run = defaultRun } = {}) {
  const cfg = config || DEFAULT_GIT_CONFIG;
  const g = (...args) => {
    const r = run(cwd, ['git', ...args]);
    return r.code === 0 ? r.out.trim() : null;
  };
  const root = g('rev-parse', '--show-toplevel');
  if (!root) return { ok: false, reason: 'not_a_repo', cwd };
  const repo = root;
  const branch = g('rev-parse', '--abbrev-ref', 'HEAD') || 'HEAD';
  const head = g('rev-parse', 'HEAD');
  const remote = g('remote', 'get-url', cfg.remote);
  const upstream = `origin/${branch}`;
  const counts = g('rev-list', '--left-right', '--count', `${upstream}...HEAD`);
  const [behind, ahead] = (counts || '0\t0').split(/\s+/).map((n) => Number(n) || 0);

  const porcelain = g('status', '--porcelain') || '';
  const dirty = porcelain
    ? porcelain.split(/\r?\n/).filter(Boolean).map((line) => ({ status: line.slice(0, 2).trim(), path: line.slice(3).trim() }))
    : [];

  const log = cfg.includeCommits > 0
    ? (g('log', `-${cfg.includeCommits}`, '--pretty=format:%h%x09%an%x09%ad%x09%s', '--date=short') || '')
      .split(/\r?\n/).filter(Boolean)
      .map((line) => {
        const [sha, author, date, ...subject] = line.split('\t');
        return { sha, author, date, subject: subject.join('\t') };
      })
    : [];

  const branches = cfg.includeBranches
    ? (g('for-each-ref', '--format=%(refname:short)%09%(committerdate:short)', 'refs/heads') || '')
      .split(/\r?\n/).filter(Boolean).map((line) => {
        const [name, date] = line.split('\t');
        return { name, date };
      })
    : [];

  return { ok: true, repo, branch, head, remote, upstream, ahead, behind, dirty, log, branches };
}

// ---------------------------------------------------------------- github state

export function githubState({ cwd = process.cwd(), config, run = defaultRun } = {}) {
  const cfg = config || DEFAULT_GIT_CONFIG;
  if (cfg.protocol !== 'github') return { ok: false, reason: 'protocol_not_github' };
  const cli = cfg.github.cli || 'gh';
  const call = (args) => {
    const r = run(cwd, [cli, ...args]);
    return r.code === 0 ? r.out : null;
  };
  const repoArg = cfg.github.repo ? ['--repo', cfg.github.repo] : [];

  const prRaw = cfg.includePrs > 0 ? call(['pr', 'list', ...repoArg, '--limit', String(cfg.includePrs), '--json', 'number,title,state,isDraft,author,updatedAt']) : null;
  const issueRaw = cfg.includeIssues > 0 ? call(['issue', 'list', ...repoArg, '--limit', String(cfg.includeIssues), '--json', 'number,title,state,author,updatedAt']) : null;
  const checkRaw = cfg.includeChecks ? call(['pr', 'checks', ...repoArg, '--json', 'name,state']) : null;

  const parse = (raw) => {
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  };

  return {
    ok: Boolean(prRaw || issueRaw || checkRaw),
    reason: prRaw || issueRaw || checkRaw ? null : 'gh_unavailable',
    prs: parse(prRaw) || [],
    issues: parse(issueRaw) || [],
    checks: parse(checkRaw) || [],
  };
}

// ---------------------------------------------------------------- bundle

function sha256(text) {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

function estimateTokens(text) {
  return Math.max(1, Math.ceil(Buffer.byteLength(text, 'utf8') / 3));
}

function source({ ref, kind, title, text, reason }) {
  return { ref, kind, title, text, sha256: sha256(text), estimatedTokens: estimateTokens(text), reason };
}

export function composeGitContext({ cwd = process.cwd(), task = '', config, state, github, budgetTokens } = {}) {
  const cfg = resolveGitConfig(config);
  if (cfg.protocol === 'none') {
    return {
      schema: GIT_CONTEXT_SCHEMA, protocol: 'none', task, sources: [], text: '',
      budget: { maxTokens: cfg.maxTokens, used: 0 }, digest: sha256(JSON.stringify({ schema: GIT_CONTEXT_SCHEMA, task, sources: [] })),
    };
  }

  const git = state || gitState({ cwd, config: cfg });
  if (!git.ok) {
    return { schema: GIT_CONTEXT_SCHEMA, protocol: cfg.protocol, task, sources: [], text: '', reason: git.reason, budget: { maxTokens: cfg.maxTokens, used: 0 }, digest: sha256(JSON.stringify({ schema: GIT_CONTEXT_SCHEMA, task, reason: git.reason })) };
  }

  const sources = [];
  sources.push(source({
    ref: 'git:branch',
    kind: 'state',
    title: `Branch ${git.branch}`,
    reason: 'repository state',
    text: [
      `branch: ${git.branch}`,
      `head: ${git.head}`,
      `remote: ${git.remote || 'none'}`,
      `divergence: ahead ${git.ahead}, behind ${git.behind}`,
    ].join('\n'),
  }));

  if (cfg.includeDirty) {
    sources.push(source({
      ref: 'git:status',
      kind: 'state',
      title: git.dirty.length ? `${git.dirty.length} uncommitted change(s)` : 'Working tree clean',
      reason: 'uncommitted work',
      text: git.dirty.length ? git.dirty.map((d) => `${d.status}\t${d.path}`).join('\n') : '(clean)',
    }));
  }

  if (cfg.includeCommits > 0 && git.log.length) {
    sources.push(source({
      ref: 'git:log',
      kind: 'history',
      title: `Last ${git.log.length} commit(s)`,
      reason: 'recent history',
      text: git.log.map((c) => `${c.sha}\t${c.date}\t${c.author}\t${c.subject}`).join('\n'),
    }));
  }

  if (cfg.includeBranches && git.branches.length > 1) {
    sources.push(source({
      ref: 'git:branches',
      kind: 'state',
      title: `${git.branches.length} local branch(es)`,
      reason: 'branch landscape',
      text: git.branches.map((b) => `${b.name}\t${b.date}`).join('\n'),
    }));
  }

  const gh = github || (cfg.protocol === 'github' ? githubState({ cwd, config: cfg }) : null);
  if (gh?.ok) {
    if (gh.prs.length) {
      sources.push(source({
        ref: 'github:prs', kind: 'work', title: `${gh.prs.length} pull request(s)`, reason: 'github protocol',
        text: gh.prs.map((p) => `#${p.number}\t${p.state}${p.isDraft ? ' (draft)' : ''}\t${p.title}\t${p.author?.login || ''}`).join('\n'),
      }));
    }
    if (gh.issues.length) {
      sources.push(source({
        ref: 'github:issues', kind: 'work', title: `${gh.issues.length} issue(s)`, reason: 'github protocol',
        text: gh.issues.map((i) => `#${i.number}\t${i.state}\t${i.title}\t${i.author?.login || ''}`).join('\n'),
      }));
    }
    if (gh.checks.length) {
      sources.push(source({
        ref: 'github:checks', kind: 'validation', title: `${gh.checks.length} check(s)`, reason: 'github protocol',
        text: gh.checks.map((c) => `${c.name}\t${c.state}`).join('\n'),
      }));
    }
  }

  // Budget: keep priority order, drop what does not fit, and say why.
  const max = clampInt(budgetTokens ?? cfg.maxTokens, 128, 24000, cfg.maxTokens);
  const selected = [];
  const omitted = [];
  let used = 0;
  for (const s of sources) {
    if (used + s.estimatedTokens <= max && selected.length < 12) {
      selected.push(s);
      used += s.estimatedTokens;
    } else {
      omitted.push({ ref: s.ref, reason: 'budget' });
    }
  }

  const text = selected.map((s) => `SOURCE { ref: ${s.ref}, kind: ${s.kind} }\n${s.text}`).join('\n\n');
  const digest = sha256(JSON.stringify({
    schema: GIT_CONTEXT_SCHEMA,
    protocol: cfg.protocol,
    task,
    sources: selected.map((s) => ({ ref: s.ref, sha256: s.sha256 })),
  }));

  return {
    schema: GIT_CONTEXT_SCHEMA,
    protocol: cfg.protocol,
    task,
    repo: git.repo,
    branch: git.branch,
    ahead: git.ahead,
    behind: git.behind,
    dirty: git.dirty.length,
    sources: selected,
    omitted,
    text,
    budget: { maxTokens: max, used },
    digest,
  };
}

// ---------------------------------------------------------------- repository identity

/**
 * normalizeRemoteUrl — deterministic normalization of a Git remote URL so two
 * identities pointing at the same repository can be recognized even when one is
 * `https://github.com/owenservera/repos-hq.git` and another is
 * `github.com:owenservera/repos-hq` (with or without trailing `.git`).
 *
 * Read-only: never touches the network, only the local string value.
 */
export function normalizeRemoteUrl(url) {
  if (url == null || typeof url !== 'string') return null;
  let u = String(url).trim();
  if (!u.length) return null;

  // Strip trailing .git
  if (u.endsWith('.git')) u = u.slice(0, -4);

  // Convert scp-style `host:owner/repo` to `https://host/owner/repo`
  if (/^[^@]+:[^/]+\/[^/]+$/.test(u) && !u.includes('://')) {
    const [host, rest] = u.split(':');
    u = `https://${host}/${rest}`;
  }

  // Lowercase host; keep path case as GitHub serves it. The final lowering
  // must touch the HOST only: lowercasing the whole URL once erased path case
  // (owner/repo), contradicting the comment above. The URL branch therefore
  // returns directly with only the hostname lowered.
  try {
    const parsed = new URL(u);
    parsed.hostname = parsed.hostname.toLowerCase();
    if (parsed.pathname.endsWith('/')) parsed.pathname = parsed.pathname.slice(0, -1);
    return parsed.toString();
  } catch {
    // Non-URL shapes fall back to string normalization. There is no parsed
    // host to isolate here, so the whole value (host and path) stays
    // lowercased exactly as before — the fallback equivalence classes are
    // unchanged.
    return u.replace(/\/$/, '').toLowerCase();
  }
}

/**
 * resolveRepoRoot — returns the realpath of the git toplevel for `cwd`, or null.
 */
export function resolveRepoRoot({ cwd = process.cwd(), run = defaultRun } = {}) {
  const r = run(cwd, ['git', 'rev-parse', '--show-toplevel']);
  if (r.code !== 0 || !r.out.trim()) return null;
  try { return realpathSync(r.out.trim()); } catch { return r.out.trim(); }
}

/**
 * detectRepositoryDuplicates — given a list of repository identities
 *   [{ name, path, remote?, head? }]
 * returns duplicate pairs keyed by a shared normalized remote URL or a shared
 * realpath checkout. Each pair is { a, b, kind: 'remote' | 'checkout', key }.
 *
 * This is the engine hook for HQ-003 (same repository treated as two projects).
 * It reads only local git state (remote URL + HEAD) and realpaths; no network.
 */
export function detectRepositoryDuplicates(identities = [], { run = defaultRun } = {}) {
  const norm = (u) => normalizeRemoteUrl(u);

  // Group by normalized remote URL.
  const byRemote = new Map();
  // Group by realpath checkout.
  const byCheckout = new Map();

  const resolved = identities.map((id) => {
    const entry = { ...id };
    try {
      const root = resolveRepoRoot({ cwd: id.path, run });
      entry.resolvedRoot = root;
    } catch { entry.resolvedRoot = null; }
    return entry;
  });

  for (const id of resolved) {
    const remoteKey = id.remote != null ? norm(id.remote) : null;
    if (remoteKey) {
      if (!byRemote.has(remoteKey)) byRemote.set(remoteKey, []);
      byRemote.get(remoteKey).push(id);
    }
    if (id.resolvedRoot) {
      const checkoutKey = id.resolvedRoot.toLowerCase();
      if (!byCheckout.has(checkoutKey)) byCheckout.set(checkoutKey, []);
      byCheckout.get(checkoutKey).push(id);
    }
  }

  const pairs = [];
  const seen = new Set();
  const addPair = (a, b, kind, key) => {
    const sig = `${String(a.name)}\u0000${String(b.name)}\u0000${kind}\u0000${key}`;
    if (seen.has(sig)) return;
    seen.add(sig);
    pairs.push({ a, b, kind, key });
  };

  for (const [, members] of byRemote) {
    for (let i = 0; i < members.length; i++) {
      for (let j = i + 1; j < members.length; j++) {
        addPair(members[i], members[j], 'remote', members[i].remote);
      }
    }
  }
  for (const [, members] of byCheckout) {
    for (let i = 0; i < members.length; i++) {
      for (let j = i + 1; j < members.length; j++) {
        addPair(members[i], members[j], 'checkout', members[i].resolvedRoot);
      }
    }
  }

  return { ok: true, identities: resolved, pairs };
}
