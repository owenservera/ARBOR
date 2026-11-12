// @hq:context Read-only release readiness — version, pending bump, bundle and gate evidence.
// @hq:owner hq-agent
// @hq:task release-automation
//
// This module never mutates anything: it answers "is this checkout releasable
// right now?" from the working tree, git history and the last quality-gate
// report. Executing a release stays with scripts/release.mjs and its gates.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { buildReleasePlan, compareVersions, parseGitLog, parseVersion } from './release-plan.mjs';

export const RELEASE_STATUS_SCHEMA = 'hq.release-status/1';

function git(root, args) {
  const result = spawnSync('git', args, { cwd: root, encoding: 'utf8', windowsHide: true });
  return result.status === 0 ? String(result.stdout ?? '').trim() : null;
}

function readJson(path) {
  try { return JSON.parse(readFileSync(path, 'utf8')); } catch { return null; }
}

function latestTag(root, prefix) {
  const tag = git(root, ['describe', '--tags', '--abbrev=0', '--match', `${prefix}[0-9]*`]);
  return tag || null;
}

function commitsSince(root, baseRef) {
  if (!baseRef) return [];
  const raw = git(root, ['log', '--no-merges', '--format=%H%x00%s%x00%b%x1e', `${baseRef}..HEAD`]);
  return raw ? parseGitLog(raw) : [];
}

function firstReleaseBase(root) {
  return git(root, ['log', '-1', '--format=%H', '--', 'package.json']) || null;
}

/**
 * Build the release-readiness report.
 * `releasable` is deliberately conservative: a dirty tree, a non-main branch or
 * a missing baseline tag all make an automatic release ineligible.
 */
export function releaseStatus({ root, prefix = 'v', branch = 'main' } = {}) {
  const pkg = readJson(join(root, 'package.json'));
  const version = pkg?.version ? String(pkg.version) : null;
  let versionValid = true;
  if (version) {
    try { parseVersion(version); } catch { versionValid = false; }
  }

  const isRepo = git(root, ['rev-parse', '--is-inside-work-tree']) === 'true';
  const currentBranch = isRepo ? git(root, ['rev-parse', '--abbrev-ref', 'HEAD']) : null;
  const dirtyRaw = isRepo ? git(root, ['status', '--porcelain']) : null;
  const clean = isRepo ? dirtyRaw === '' : null;
  const lastTag = isRepo ? latestTag(root, prefix) : null;
  const baseRef = lastTag ?? (isRepo ? firstReleaseBase(root) : null);
  const commits = commitsSince(root, baseRef);

  let plan = null;
  if (versionValid && version) {
    plan = buildReleasePlan({ currentVersion: version, lastTag, commits, requestedBump: 'auto' });
  }

  const bundleManifest = readJson(join(root, 'dist', 'hq-single', 'BUNDLE.json'));
  const bundleVersion = bundleManifest?.version ? String(bundleManifest.version) : null;
  const bundle = bundleManifest
    ? {
        present: true,
        version: bundleVersion,
        digest: bundleManifest.digest ?? null,
        matchesPackageVersion: Boolean(version && bundleVersion && compareVersionsSafe(bundleVersion, version) === 0),
      }
    : { present: false, version: null, digest: null, matchesPackageVersion: false };

  const gate = readJson(join(root, '.hq', 'quality-gate.json'));
  const head = isRepo ? git(root, ['rev-parse', 'HEAD']) : null;
  const qualityGate = gate
    ? {
        present: true,
        ok: gate.ok === true,
        profile: gate.profile ?? null,
        finishedAt: gate.finishedAt ?? null,
        commit: gate.git?.sha ?? null,
        matchesHead: Boolean(head && gate.git?.sha && head === gate.git.sha),
        failed: Array.isArray(gate.steps)
          ? gate.steps.filter((step) => step.status === 'failed').map((step) => step.id)
          : [],
      }
    : { present: false, ok: null, profile: null, finishedAt: null, commit: null, matchesHead: false, failed: [] };

  const workflows = ['ci.yml', 'release.yml'].filter((name) => existsSync(join(root, '.github', 'workflows', name)));

  let reason = null;
  let releasable = false;
  if (!version) reason = 'no_package_version';
  else if (!versionValid) reason = 'invalid_package_version';
  else if (!isRepo) reason = 'not_a_git_repository';
  else if (currentBranch !== branch) reason = `branch_is_${currentBranch ?? 'detached'}`;
  else if (dirtyRaw !== '') reason = 'working_tree_dirty';
  else if (!lastTag) reason = 'no_baseline_tag';
  else if (plan?.action !== 'release') reason = plan?.reason ?? 'no_release_commits';
  else if (workflows.length < 2) reason = 'missing_release_workflows';
  else releasable = true;

  return {
    schema: RELEASE_STATUS_SCHEMA,
    root,
    branch: currentBranch,
    expectedBranch: branch,
    version,
    lastTag,
    baseRef,
    commitsSinceBase: commits.length,
    bump: plan?.bump ?? null,
    nextVersion: plan?.version ?? null,
    releasable,
    reason,
    clean,
    bundle,
    qualityGate,
    workflows,
    readOnly: true,
  };
}

function compareVersionsSafe(left, right) {
  try { return compareVersions(left, right); } catch { return null; }
}
