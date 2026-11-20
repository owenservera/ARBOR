# File: hq/lib/release-plan.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/lib/release-plan.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 12332 B |
| Lines | 321 |
| Hash | d0ea276ad243 |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| CONVENTIONAL | const | 12 | no | const CONVENTIONAL = /^(?&lt;type&gt;[a-zA-Z]+)(?:\\((?&lt;scope&gt;[^)]+)\\))?(?&lt;bang&gt;!)?:\\s*(?&lt;description&gt;.+)$/; |
| BREAKING_BODY | const | 13 | no | const BREAKING_BODY = /^BREAKING[ -]CHANGE:\\s*(.+)$/m; |
| SEMVER | const | 14 | no | const SEMVER = /^(\\d+)\\.(\\d+)\\.(\\d+)(?:-[0-9A-Za-z.-]+)?$/; |
| RELEASE_SUBJECT | const | 15 | no | const RELEASE_SUBJECT = /^release:\\s*v?\\d+\\.\\d+\\.\\d+/i; |
| RELEASE_TYPES | const | 18 | yes | export const RELEASE_TYPES = Object.freeze([&#39;feat&#39;, &#39;fix&#39;, &#39;perf&#39;, &#39;revert&#39;]); |
| NOTABLE_TYPES | const | 21 | yes | export const NOTABLE_TYPES = Object.freeze([&#39;feat&#39;, &#39;fix&#39;, &#39;perf&#39;, &#39;revert&#39;, &#39;refactor&#39;, &#39;docs&#39;, &#39;build&#39;, &#39;ci&#39;, &#39;test&#39;, &#39;chore&#39;, &#39;style&#39;]); |
| parseCommitSubject | function | 28 | yes | export function parseCommitSubject(subject, body = &#39;&#39;) { |
| text | const | 29 | no | const text = String(subject ?? &#39;&#39;).trim(); |
| normalizedBody | const | 30 | no | const normalizedBody = String(body ?? &#39;&#39;); |
| bodyBreaking | const | 38 | no | const bodyBreaking = BREAKING_BODY.exec(normalizedBody); |
| groups | const | 48 | no | const groups = match.groups ?? {}; |
| classifyCommits | function | 62 | yes | export function classifyCommits(commits = []) { |
| parsed | const | 63 | no | const parsed = commits.map((commit) =&gt; ({ sha: String(commit.sha ?? &#39;&#39;), subject: String(commit.subject ?? &#39;&#39;), body: String(commit.body ?? &#39;&#39;), ...parseCommitSubject(commit.subject, commit.body), |
| relevant | const | 70 | no | const relevant = parsed.filter((commit) =&gt; ![&#39;merge&#39;, &#39;release&#39;].includes(commit.type)); |
| breaking | const | 71 | no | const breaking = relevant.filter((commit) =&gt; commit.breaking); |
| features | const | 72 | no | const features = relevant.filter((commit) =&gt; commit.type === &#39;feat&#39; &amp;&amp; !commit.breaking); |
| fixes | const | 73 | no | const fixes = relevant.filter((commit) =&gt; commit.type === &#39;fix&#39; &amp;&amp; !commit.breaking); |
| performance | const | 74 | no | const performance = relevant.filter((commit) =&gt; commit.type === &#39;perf&#39; &amp;&amp; !commit.breaking); |
| reverts | const | 75 | no | const reverts = relevant.filter((commit) =&gt; commit.type === &#39;revert&#39; &amp;&amp; !commit.breaking); |
| other | const | 76 | no | const other = relevant.filter((commit) =&gt; ![&#39;feat&#39;, &#39;fix&#39;, &#39;perf&#39;, &#39;revert&#39;].includes(commit.type) &amp;&amp; !commit.breaking); |
| bump | variable | 78 | no | let bump = null; |
| reasons | const | 79 | no | const reasons = []; |
| parseVersion | function | 95 | yes | export function parseVersion(version) { |
| nextVersion | function | 102 | yes | export function nextVersion(currentVersion, bump) { |
| compareVersions | function | 113 | yes | export function compareVersions(left, right) { |
| a | const | 114 | no | const a = parseVersion(left); |
| b | const | 115 | no | const b = parseVersion(right); |
| buildReleasePlan | function | 127 | yes | export function buildReleasePlan({ currentVersion, lastTag = null, commits = [], requestedBump = &#39;auto&#39; }) { |
| requested | const | 128 | no | const requested = String(requestedBump ?? &#39;auto&#39;).toLowerCase(); |
| classified | const | 133 | no | const classified = classifyCommits(commits); |
| bullet | function | 176 | no | function bullet(commit) { |
| scope | const | 177 | no | const scope = commit.scope ? `**${commit.scope}:** ` : &#39;&#39;; |
| sha | const | 178 | no | const sha = commit.sha ? ` (${commit.sha.slice(0, 7)})` : &#39;&#39;; |
| note | const | 179 | no | const note = commit.breaking &amp;&amp; commit.breakingNote ? ` — ${commit.breakingNote}` : &#39;&#39;; |
| dedupe | function | 183 | no | function dedupe(lines) { |
| renderChangelogSection | function | 188 | yes | export function renderChangelogSection({ version, date, classified }) { |
| sections | const | 189 | no | const sections = [ |
| lines | const | 197 | no | const lines = [`## [${version}] - ${date}`, &#39;&#39;]; |
| wrote | variable | 198 | no | let wrote = false; |
| bullets | const | 200 | no | const bullets = dedupe(commits.map(bullet)); |
| CHANGELOG_PREAMBLE | const | 209 | no | const CHANGELOG_PREAMBLE = [ |
| mergeChangelog | function | 219 | yes | export function mergeChangelog(existing, section) { |
| text | const | 220 | no | const text = String(existing ?? &#39;&#39;).replace(/\\r\\n/g, &#39;\\n&#39;); |
| body | const | 221 | no | const body = section.replace(/\\r\\n/g, &#39;\\n&#39;).trimEnd() + &#39;\\n&#39;; |
| lines | const | 224 | no | const lines = text.split(&#39;\\n&#39;); |
| firstRelease | const | 225 | no | const firstRelease = lines.findIndex((line, index) =&gt; index &gt; 0 &amp;&amp; /^##\\s/.test(line)); |
| base | const | 227 | no | const base = text.trimEnd(); |
| head | const | 230 | no | const head = lines.slice(0, firstRelease).join(&#39;\\n&#39;).trimEnd(); |
| tail | const | 231 | no | const tail = lines.slice(firstRelease).join(&#39;\\n&#39;).trimEnd(); |
| minimalReleasableScope | function | 250 | yes | export function minimalReleasableScope(candidates = [], { passingGates = new Set() } = {}) { |
| gates | const | 251 | no | const gates = new Set(passingGates); |
| byId | const | 253 | no | const byId = new Map(); |
| id | const | 255 | no | const id = String(c.id ?? &#39;&#39;); |
| releasableCache | const | 264 | no | const releasableCache = new Map(); |
| visiting | const | 265 | no | const visiting = new Set(); |
| isReleasable | function | 268 | no | function isReleasable(id) { |
| c | const | 271 | no | const c = byId.get(id); |
| ok | variable | 274 | no | let ok = true; |
| closure | function | 283 | no | function closure(id, out = new Set()) { |
| c | const | 285 | no | const c = byId.get(id); |
| releasable | const | 292 | no | const releasable = [...byId.keys()].filter((id) =&gt; isReleasable(id)).sort(); |
| best | variable | 293 | no | let best = null; |
| cl | const | 295 | no | const cl = closure(id); |
| parseGitLog | function | 312 | yes | export function parseGitLog(raw) { |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [hq/aii/fixtures/HQ-081-remaining-release-work.mjs](../aii/fixtures/HQ-081-remaining-release-work.mjs.md) | ../../lib/release-plan.mjs |
| [hq/aii/fixtures/HQ-086-minimal-releasable-scope.mjs](../aii/fixtures/HQ-086-minimal-releasable-scope.mjs.md) | ../../lib/release-plan.mjs |
| [hq/lib/release-status.mjs](./release-status.mjs.md) | ./release-plan.mjs |

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 1 | context | — | — | Pure release planning — conventional-commit classification, semver bump and changelog rendering. |
| 2 | owner | hq-agent | — | hq-agent |
| 3 | task | — | — | release-automation |
| 9 | invariant | — | — | a release is never inferred from a dirty tree, a missing tag or |

## Excerpt

```javascript
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
```

_First 80 of 322 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
