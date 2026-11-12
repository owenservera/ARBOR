// hq/lib/freshness.mjs — index freshness walk, shared by check/verify/watch/refresh.
//
// CONTRACT: freshness must be judged against the same file universe the indexer
// walks — the configured cap (config.maxFileBytes) and the configured ignores.
// A wider walk reports files the indexer can never take as forever-new, so
// strict mode can never pass; a narrower one hides real drift (regression
// fixtures: hq/test/check-freshness-parity.test.mjs).
import { discoverFiles } from './walk.mjs';

/**
 * collectStaleFiles — diff the index rows against the on-disk file universe.
 *
 * @param {object} db        open HQ database
 * @param {object} config    workspace config (maxFileBytes, ignores)
 * @param {Array}  projects  project summaries (name + path) to check
 * @param {string|number} [capOverride] `--max-file-bytes` override
 * @returns {Promise<Array<{project:string, path:string, reason:'new'|'changed'|'deleted'}>>}
 */
export async function collectStaleFiles({ db, config, projects, capOverride }) {
  const stale = [];
  const walkCap = Number(capOverride || config.maxFileBytes);
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
    for (const row of rows) if (!seen.has(row.path)) stale.push({ project: project.name, path: row.path, reason: 'deleted' });
  }
  return stale;
}
