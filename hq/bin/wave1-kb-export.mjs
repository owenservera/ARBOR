#!/usr/bin/env node
/** Wave 1 Lane B export: strictly read-only source DB, stdout data-only JSON. */
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { exportWave1KbSemantic } from '../lib/wave1-kb-read.mjs';
const argv = process.argv.slice(2);
function get(flag) { const i = argv.indexOf(flag); return i < 0 ? null : argv[i+1]; }
function main() {
  const dbPath = get('--db'), manifestPath = get('--manifest');
  if (!dbPath || !manifestPath || !get('--project-id') || !get('--project-name') || !get('--root') || !get('--revision')) {
    throw new Error('Usage: node hq/bin/wave1-kb-export.mjs --db PATH --manifest verified-sources.json --project-id N --project-name NAME --root ROOT-ID --revision 40HEX [--limit N]');
  }
  if (!existsSync(dbPath) || !existsSync(manifestPath)) throw new Error('missing source database or source manifest (never created)');
  const manifest = JSON.parse(readFileSync(manifestPath,'utf8'));
  const projectId = Number(get('--project-id'));
  const limit = get('--limit') == null ? 200 : Number(get('--limit'));
  const db = new DatabaseSync(resolve(dbPath), { readOnly: true });
  try {
    db.exec('PRAGMA query_only=ON');
    const result = exportWave1KbSemantic(db, { projectId, projectName:get('--project-name'), rootId:get('--root'),
      sourceRevision:get('--revision'), sourceManifest:manifest.sources, limit });
    process.stdout.write(JSON.stringify(result, null, 2)+'\n');
  } finally { db.close(); }
}
try { main(); } catch (error) { console.error(`wave1-kb-export: ${error.code ?? 'BLOCKED'}: ${error.message}`); process.exitCode=2; }
