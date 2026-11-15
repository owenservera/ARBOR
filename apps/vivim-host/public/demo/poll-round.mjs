/* @vlang:surface apps/vivim-host/public/demo/poll-round.mjs
   @vlang:surface-desc: One-shot CLI poll of the demo feedback inbox — the reprogrammable
   @vlang:surface-desc: surface is the CLI contract only: filter flags (--last, --since) and
   @vlang:surface-desc: their semantics, stdout JSON formatting, and validation/exit messages.
   @vlang:surface-desc: NL-driven change accepts none of: network fetch (disk read only, C9),
   @vlang:surface-desc: drift of the {round, approveAll, verdicts, receivedAt} entry schema
   @vlang:surface-desc: shared with POST /demo/feedback, or watcher/daemon modes (one-shot by
   @vlang:surface-desc: design). node:fs only; no other imports.
   @vlang:surface-desc: NLCL linkage: no action in control/action-catalog.v1.json v7 targets
   @vlang:surface-desc: this file yet — actionIds stays empty until one is catalogued.
   @vlang:id: arg-parser round-entry-schema output-format exit-codes
   @vlang:action: */

// Demo feedback inbox poll — one-shot CLI, disk read only (C9).
// Usage: bun apps/vivim-host/public/demo/poll-round.mjs [--last N | --since ROUND]
// Reads apps/vivim-host/public/demo/journal.jsonl from disk (never fetches),
// selects the {round, approveAll, verdicts, receivedAt} feedback entries and
// ignores the other typed records that share that product journal,
// prints matching rounds as JSON to stdout.
//   --last N   print the last N rounds (after --since filter, if given)
//   --since ROUND print rounds with round >= ROUND (inclusive)
// Exit 0 on success; exit 1 if the journal is missing, unreadable or invalid,
// or the arguments are invalid. node:fs only. No watcher, no network.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const journalPath = join(here, 'journal.jsonl');

function fail(message) {
  process.stderr.write(String(message === undefined || message === null ? 'poll-round failed' : message) + '\n');
  process.exit(1);
}

function isPlainObject(v) { return !!v && typeof v === 'object' && !Array.isArray(v); }
function isRoundEntry(v) {
  return isPlainObject(v)
    && (typeof v.round === 'string' || typeof v.round === 'number')
    && typeof v.approveAll === 'boolean'
    && Array.isArray(v.verdicts)
    && typeof v.receivedAt === 'string';
}

const args = process.argv.slice(2);
let last = null;
let since = null;
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--last') {
    if (i + 1 >= args.length) fail('Missing value for --last');
    last = Number(args[++i]);
    if (!Number.isInteger(last) || last < 0) fail('Invalid --last value (expected a non-negative integer)');
  } else if (a === '--since') {
    if (i + 1 >= args.length) fail('Missing value for --since');
    since = String(args[++i]);
    if (since.length === 0) fail('Invalid --since value (expected a round id)');
  } else {
    fail('Unknown argument: ' + a);
  }
}

let raw;
try { raw = readFileSync(journalPath, 'utf8'); } catch (err) { fail('Missing or unreadable journal: ' + journalPath); }
const lines = raw.split(/\r?\n/).filter(line => line.trim().length > 0);
let arr;
try { arr = lines.map(line => JSON.parse(line)); } catch (err) { fail('Journal line is not JSON: ' + journalPath); }
// The demo journal is the SHARED product journal: it also carries chat-send,
// wiki-edit, gate-decision and gate-execution records. This is a feedback-inbox
// poller, so it selects the round entries it understands instead of rejecting a
// journal that also holds other typed records.
let out = arr.filter(isRoundEntry);
if (out.length !== arr.length) {
  process.stderr.write('poll-round: ignored ' + (arr.length - out.length) +
    ' non-feedback journal record(s)\n');
}

if (since !== null) out = out.filter(v => String(v.round) >= String(since));
if (last !== null) out = out.slice(Math.max(0, out.length - last));

process.stdout.write(JSON.stringify(out, null, 2) + '\n');
process.exit(0);
