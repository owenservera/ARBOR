// hq/lib/freshness.mjs — index freshness walk, shared by check/verify/watch/refresh.
//
// CONTRACT: freshness must be judged against the same file universe the indexer
// walks — the configured cap (config.maxFileBytes) and the configured ignores.
// A wider walk reports files the indexer can never take as forever-new, so
// strict mode can never pass; a narrower one hides real drift (regression
// fixtures: hq/test/check-freshness-parity.test.mjs).
//
// A row the walk did not return is not proof of deletion either: discoverFiles
// drops files over `maxFileBytes` without a trace, so a source that grew past the
// cap (or a cap lowered since the last index) is indistinguishable from a removed
// file unless the filesystem is asked. The indexer keeps such rows and calls the
// run incomplete (hq/lib/indexer.mjs isWalkOmitted); freshness reports them with
// the same vocabulary so a live source is never named `deleted` and the strict
// gate can still tell "gone" from "the bounded walk could not see it".
import { statSync } from 'node:fs';
import { join } from 'node:path';
import { DEFAULT_MAX_FILE_BYTES, discoverFiles } from './walk.mjs';

/** discoverFiles' own default, so the classification uses the cap that was walked. */
function effectiveCap(value) {
  const cap = Number(value);
  return Number.isFinite(cap) && cap > 0 ? cap : DEFAULT_MAX_FILE_BYTES;
}

/**
 * classifyOmission — why is an indexed row absent from the bounded walk?
 *
 * @param {{path:string}} row              indexed file row
 * @param {string} projectRoot             absolute project root
 * @param {number} cap                     the cap the walk was bounded by
 * @returns {'deleted'|'over_file_cap'|'ignored'}
 */
function classifyOmission(row, projectRoot, cap) {
  let size;
  try {
    size = statSync(join(projectRoot, row.path)).size;
  } catch {
    return 'deleted'; // the filesystem proves it is gone
  }
  if (size > cap) return 'over_file_cap'; // live source, outside the bounded walk
  return 'ignored'; // live source, inside the cap, excluded by an ignore rule
}

/**
 * collectStaleFiles — diff the index rows against the on-disk file universe.
 *
 * @param {object} db        open HQ database
 * @param {object} config    workspace config (maxFileBytes, ignores)
 * @param {Array}  projects  project summaries (name + path) to check
 * @param {string|number} [capOverride] `--max-file-bytes` override
 * @returns {Promise<Array<{project:string, path:string, reason:'new'|'changed'|'deleted'|'over_file_cap'|'ignored'}>>}
 */
export async function collectStaleFiles({ db, config, projects, capOverride }) {
  const stale = [];
  const walkCap = effectiveCap(capOverride || config.maxFileBytes);
  const walkIgnores = Array.isArray(config.ignores) ? config.ignores : [];
  for (const project of projects) {
    // One round-trip per space, not one prepared statement per file.
    const rows = db.prepare('SELECT path, size, mtime_ms FROM files WHERE project_id = (SELECT id FROM projects WHERE name = ?)').all(project.name);
    const map = new Map(rows.map((r) => [r.path, r]));
    const seen = new Set();
    for (const entry of discoverFiles(project.path, { maxFileBytes: walkCap, extraIgnores: walkIgnores })) {
      seen.add(entry.rel);
      const row = map.get(entry.rel);
      if (!row) stale.push({ project: project.name, path: entry.rel, reason: 'new' });
      else if (row.size !== entry.size || Math.abs(row.mtime_ms - entry.mtimeMs) > 1) stale.push({ project: project.name, path: entry.rel, reason: 'changed' });
    }
    for (const row of rows) {
      if (seen.has(row.path)) continue;
      stale.push({ project: project.name, path: row.path, reason: classifyOmission(row, project.path, walkCap) });
    }
  }
  return stale;
}
