// @hq:context Pure release planning — conventional-commit classification, semver bump and changelog rendering.
// @hq:owner hq-agent
// @hq:task release-automation
//
// No filesystem, network or git access lives here. scripts/release.mjs owns the
// effects; this module owns the decisions, so every rule is unit-testable and
// the release path cannot change behaviour without a failing test.
//
// @hq:invariant a release is never inferred from a dirty tree, a missing tag or
// a commit type outside the declared set.

const CONVENTIONAL = /^(?<type>[a-zA-Z]+)(?:\((?<scope>[^)]+)\))?(?<bang>!)?:\s*(?<description>.+)$/;
const BREAKING_BODY = /^BREAKING[ -]CHANGE:\s*(.+)$/m;
const SEMVER = /^(\d+)\.(\d+)\.(\d+)(?:-[0-9A-Za-z.-]+)?$/;
const RELEASE_SUBJECT = /^release:\s*v?\d+\.\d+\.\d+/i;

/** Commit types that can justify a production release on their own. */
export const RELEASE_TYPES = Object.freeze(['feat', 'fix', 'perf', 'revert']);

/** Commit types that are recorded in a changelog but never trigger a release alone. */
export const NOTABLE_TYPES = Object.freeze(['feat', 'fix', 'perf', 'revert', 'refactor', 'docs', 'build', 'ci', 'test', 'chore', 'style']);

/**
 * Parse one conventional-commit subject plus its body.
 * Unknown shapes are preserved as `type: 'other'` rather than dropped, so the
 * changelog never silently loses a change.
 */
export function parseCommitSubject(subject, body = '') {
  const text = String(subject ?? '').trim();
  const normalizedBody = String(body ?? '');
  if (/^Merge (branch|pull request|remote-tracking)/i.test(text)) {
    return { type: 'merge', scope: null, breaking: false, description: text };
  }
  if (RELEASE_SUBJECT.test(text)) {
    return { type: 'release', scope: null, breaking: false, description: text };
  }
  const match = CONVENTIONAL.exec(text);
  const bodyBreaking = BREAKING_BODY.exec(normalizedBody);
  if (!match) {
    return {
      type: 'other',
      scope: null,
      breaking: Boolean(bodyBreaking),
      breakingNote: bodyBreaking ? bodyBreaking[1].trim() : null,
      description: text,
    };
  }
  const groups = match.groups ?? {};
  return {
    type: String(groups.type || '').toLowerCase(),
    scope: groups.scope ? groups.scope.trim() : null,
    breaking: Boolean(groups.bang) || Boolean(bodyBreaking),
    breakingNote: bodyBreaking ? bodyBreaking[1].trim() : null,
    description: String(groups.description || '').trim(),
  };
}

/**
 * Classify a list of commits into release evidence.
 * `bump` is the strongest signal present: breaking > feature > fix/perf/revert.
 */
export function classifyCommits(commits = []) {
  const parsed = commits.map((commit) => ({
    sha: String(commit.sha ?? ''),
    subject: String(commit.subject ?? ''),
    body: String(commit.body ?? ''),
    ...parseCommitSubject(commit.subject, commit.body),
  }));

  const relevant = parsed.filter((commit) => !['merge', 'release'].includes(commit.type));
  const breaking = relevant.filter((commit) => commit.breaking);
  const features = relevant.filter((commit) => commit.type === 'feat' && !commit.breaking);
  const fixes = relevant.filter((commit) => commit.type === 'fix' && !commit.breaking);
  const performance = relevant.filter((commit) => commit.type === 'perf' && !commit.breaking);
  const reverts = relevant.filter((commit) => commit.type === 'revert' && !commit.breaking);
  const other = relevant.filter((commit) => !['feat', 'fix', 'perf', 'revert'].includes(commit.type) && !commit.breaking);

  let bump = null;
  const reasons = [];
  if (breaking.length) {
    bump = 'major';
    reasons.push(`${breaking.length} breaking change(s)`);
  } else if (features.length) {
    bump = 'minor';
    reasons.push(`${features.length} feature commit(s)`);
  } else if (fixes.length || performance.length || reverts.length) {
    bump = 'patch';
    reasons.push(`${fixes.length + performance.length + reverts.length} fix/perf/revert commit(s)`);
  }

  return { bump, reasons, breaking, features, fixes, performance, reverts, other, parsed };
}

/** Parse and validate a semver string. */
export function parseVersion(version) {
  const match = SEMVER.exec(String(version ?? '').trim());
  if (!match) throw new Error(`invalid semver: ${version}`);
  return { major: Number(match[1]), minor: Number(match[2]), patch: Number(match[3]) };
}

/** Compute the next version for a bump, discarding any prerelease suffix. */
export function nextVersion(currentVersion, bump) {
  const { major, minor, patch } = parseVersion(currentVersion);
  switch (bump) {
    case 'major': return `${major + 1}.0.0`;
    case 'minor': return `${major}.${minor + 1}.0`;
    case 'patch': return `${major}.${minor}.${patch + 1}`;
    default: throw new Error(`unknown bump: ${bump}`);
  }
}

/** Compare two semver strings: -1, 0 or 1. */
export function compareVersions(left, right) {
  const a = parseVersion(left);
  const b = parseVersion(right);
  for (const key of ['major', 'minor', 'patch']) {
    if (a[key] !== b[key]) return a[key] < b[key] ? -1 : 1;
  }
  return 0;
}

/**
 * Decide whether a release should happen.
 * `auto` refuses to invent a baseline: with no tag the first release must be an
 * explicit owner/CI decision, never an accident of accumulated history.
 */
export function buildReleasePlan({ currentVersion, lastTag = null, commits = [], requestedBump = 'auto' }) {
  const requested = String(requestedBump ?? 'auto').toLowerCase();
  if (!['auto', 'patch', 'minor', 'major'].includes(requested)) {
    throw new Error(`invalid bump: ${requestedBump} (expected auto|patch|minor|major)`);
  }
  parseVersion(currentVersion);
  const classified = classifyCommits(commits);

  if (requested !== 'auto') {
    return {
      action: 'release',
      bump: requested,
      version: nextVersion(currentVersion, requested),
      previousVersion: currentVersion,
      reasons: [`explicit ${requested} bump requested`],
      classified,
    };
  }

  if (!lastTag) {
    return {
      action: 'none',
      reason: 'no_baseline_tag',
      message: 'No version tag exists. Run an explicit bump (workflow_dispatch) to establish the first release baseline.',
      previousVersion: currentVersion,
      classified,
    };
  }

  if (!classified.bump) {
    return {
      action: 'none',
      reason: 'no_release_commits',
      message: 'No feat/fix/perf/revert/breaking commits since the last tag.',
      previousVersion: currentVersion,
      classified,
    };
  }

  return {
    action: 'release',
    bump: classified.bump,
    version: nextVersion(currentVersion, classified.bump),
    previousVersion: currentVersion,
    reasons: classified.reasons,
    classified,
  };
}

function bullet(commit) {
  const scope = commit.scope ? `**${commit.scope}:** ` : '';
  const sha = commit.sha ? ` (${commit.sha.slice(0, 7)})` : '';
  const note = commit.breaking && commit.breakingNote ? ` — ${commit.breakingNote}` : '';
  return `- ${scope}${commit.description}${note}${sha}`;
}

function dedupe(lines) {
  return [...new Set(lines)];
}

/** Render one Keep-a-Changelog section. */
export function renderChangelogSection({ version, date, classified }) {
  const sections = [
    ['Breaking Changes', classified.breaking],
    ['Features', classified.features],
    ['Bug Fixes', classified.fixes],
    ['Performance Improvements', classified.performance],
    ['Reverts', classified.reverts],
    ['Other Changes', classified.other],
  ];
  const lines = [`## [${version}] - ${date}`, ''];
  let wrote = false;
  for (const [title, commits] of sections) {
    const bullets = dedupe(commits.map(bullet));
    if (!bullets.length) continue;
    wrote = true;
    lines.push(`### ${title}`, '', ...bullets, '');
  }
  if (!wrote) lines.push('- No user-facing changes.', '');
  return lines.join('\n').trimEnd() + '\n';
}

const CHANGELOG_PREAMBLE = [
  '# Changelog',
  '',
  'All notable changes to HQ are documented here. The format follows',
  '[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and versions follow',
  '[Semantic Versioning](https://semver.org/spec/v2.0.0.html).',
  '',
].join('\n');

/** Insert a new section above the newest existing release section. */
export function mergeChangelog(existing, section) {
  const text = String(existing ?? '').replace(/\r\n/g, '\n');
  const body = section.replace(/\r\n/g, '\n').trimEnd() + '\n';
  if (!text.trim()) return `${CHANGELOG_PREAMBLE}${body}`;

  const lines = text.split('\n');
  const firstRelease = lines.findIndex((line, index) => index > 0 && /^##\s/.test(line));
  if (firstRelease === -1) {
    const base = text.trimEnd();
    return `${base}\n\n${body}`;
  }
  const head = lines.slice(0, firstRelease).join('\n').trimEnd();
  const tail = lines.slice(firstRelease).join('\n').trimEnd();
  return `${head}\n\n${body}\n${tail}\n`;
}

/**
 * Smallest demonstrable end-to-end releasable scope (AII scenario HQ-086).
 *
 * Given release candidates, each `{id, gates, dependsOn}`, and a set of
 * passing gate names, a candidate is releasable when every one of its gates
 * passes and every dependency it names is itself releasable (transitively,
 * cycle-protected). The minimal end-to-end scope is the releasable candidate
 * whose transitive dependency closure is smallest (fewest candidates), ties
 * broken by id; that closure is the scope. Pure, read-only, deterministic.
 * Existing exports and behavior unchanged; additive only.
 *
 * @param {Array<{id: string, gates: string[]|null, dependsOn: string[]|null}>} [candidates]
 * @param {{passingGates?: Iterable<string>}} [opts]
 * @returns {{releasable: string[], scope: string[], basis: string|null}}
 */
export function minimalReleasableScope(candidates = [], { passingGates = new Set() } = {}) {
  const gates = new Set(passingGates);
  /** @type {Map<string, {id: string, gates: string[], dependsOn: string[]}>} */
  const byId = new Map();
  for (const c of candidates) {
    const id = String(c.id ?? '');
    if (!id) continue;
    byId.set(id, {
      id,
      gates: Array.isArray(c.gates) ? c.gates.slice() : [],
      dependsOn: Array.isArray(c.dependsOn) ? c.dependsOn.slice() : [],
    });
  }

  const releasableCache = new Map();
  const visiting = new Set();

  /** @param {string} id @returns {boolean} */
  function isReleasable(id) {
    if (releasableCache.has(id)) return releasableCache.get(id);
    if (visiting.has(id)) return false; // cycle => not releasable
    const c = byId.get(id);
    if (!c) { releasableCache.set(id, false); return false; }
    visiting.add(id);
    let ok = true;
    for (const g of c.gates) if (!gates.has(g)) { ok = false; break; }
    if (ok) for (const dep of c.dependsOn) { if (!isReleasable(dep)) { ok = false; break; } }
    visiting.delete(id);
    releasableCache.set(id, ok);
    return ok;
  }

  /** @param {string} id @param {Set<string>} out */
  function closure(id, out = new Set()) {
    if (out.has(id)) return out;
    const c = byId.get(id);
    if (!c) return out;
    out.add(id);
    for (const dep of c.dependsOn) closure(dep, out);
    return out;
  }

  const releasable = [...byId.keys()].filter((id) => isReleasable(id)).sort();
  let best = null;
  for (const id of releasable) {
    const cl = closure(id);
    if (best === null || cl.size < best.size || (cl.size === best.size && id < best.basis)) {
      best = { id, size: cl.size, scope: [...cl].sort() };
    }
  }

  return {
    releasable,
    scope: best ? best.scope : [],
    basis: best ? best.id : null,
  };
}

/**
 * Parse `git log --format=%H%x00%s%x00%b%x1e` output.
 * NUL separates fields, 0x1e separates records, so multiline bodies survive.
 */
export function parseGitLog(raw) {
  return String(raw ?? '')
    .split('\x1e')
    .map((record) => record.replace(/^\n/, ''))
    .filter((record) => record.trim())
    .map((record) => {
      const [sha = '', subject = '', ...body] = record.split('\x00');
      return { sha: sha.trim(), subject: subject.trim(), body: body.join('\x00').trim() };
    });
}
