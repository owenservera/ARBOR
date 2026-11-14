// Node-compatible watcher for the demo feedback inbox.
// Reads demo/ui-demo/feedback/inbox.json, remembers the current round count,
// polls every 2s; when a new round appears prints ONLY that round's JSON to stdout
// and exits 0; on timeout exits 2.
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const inboxPath = path.join(here, 'feedback', 'inbox.json');
const POLL_MS = 2000;
const TIMEOUT_MS = Number(process.env.VIVIM_POLL_TIMEOUT_MS || 30000);

let seen = 0;
try {
  seen = JSON.parse(readFileSync(inboxPath, 'utf8') || '[]').length;
} catch { seen = 0; }
const start = Date.now();

function tick() {
  let arr = [];
  try { arr = JSON.parse(readFileSync(inboxPath, 'utf8') || '[]'); } catch { arr = []; }
  if (arr.length > seen) {
    // Print only the newly appeared round's JSON, then exit.
    process.stdout.write(JSON.stringify(arr[arr.length - 1]) + '\n');
    process.exit(0);
  }
  if (Date.now() - start >= TIMEOUT_MS) {
    process.exit(2);
  }
  setTimeout(tick, POLL_MS);
}
tick();
