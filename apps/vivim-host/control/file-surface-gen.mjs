// file-surface-gen.mjs — deterministic generator for the vlang file-surface corpus
// (ledger P2 Stage A). Parses ONLY structured header comments in the seeded
// files and emits apps/vivim-host/data/demo-baseline/file-surface.v1.json.
//
// STAGE A GRAMMAR — vlang structured header comments
// ===================================================
//
// Scope: the generator parses ONLY structured header comments of the seeded
// files (SEED_FILES below). Nothing else in a file is parsed; the file's raw
// bytes feed the sourceDigest only.
//
// Block comments recognized (Stage A):
//   JS/MJS:  /* ... */
//   HTML:    <!-- ... -->
//
// The header is the FIRST block comment in the file whose body, after
// stripping delimiters and trimming, starts with the exact token
// `@vlang:surface`. Exactly one header per file; a seeded file without one is
// an error (fail-closed).
//
// Header body, line by line (leading whitespace stripped):
//
//   @vlang:surface <path>            Opener line (required, first). <path>
//                                    must equal the seeded repo-relative path
//                                    (forward slashes) — mismatch is an error.
//   @vlang:surface-desc[: <text>]    One free-text line describing the
//                                    reprogrammable surface (what NL-driven
//                                    change this file accepts). Lines
//                                    accumulate in file order and are joined
//                                    with "\n" into the record's `surface`
//                                    field. An empty desc line is allowed.
//   @vlang:id[: <ids>]               One or more anchored comment ids,
//                                    whitespace-separated. Ids accumulate
//                                    across lines; duplicates keep the first
//                                    occurrence; output order = first
//                                    occurrence order; emitted as the
//                                    record's `commentIds` field.
//   @vlang:action[: <ids>]           Linked NLCL action ids from
//                                    apps/vivim-host/control/action-catalog.v1.json,
//                                    same accumulation rules as @vlang:id;
//                                    emitted as the record's `actionIds`
//                                    field. A bare `@vlang:action:` with no
//                                    tokens declares the empty set explicitly.
//                                    Stage A does NOT validate ids against the
//                                    catalog — declared ids are data; catalog
//                                    validation is a later stage.
//   # <text>                         Comment line — ignored.
//   anything else                    Ignored.
//
// Token grammar (ids and action ids):
//   ^[a-z0-9][a-z0-9._-]{0,79}$   lowercase start; then lowercase, digits,
//   dot, underscore, hyphen; max 80 chars. A token that fails this grammar is
//   an ERROR with the offending line number (typo detection). An optional
//   single ":" directly after a directive name is consumed as a separator
//   (cosmetic).
//
// Determinism contract:
//   - SEED_FILES is an explicit ordered list — no directory scans, no globbing.
//   - No timestamps, no environment values anywhere in the output.
//   - Object keys are emitted in a fixed literal order; JSON is 2-space
//     indented with a trailing newline.
//   - sourceDigest = lowercase hex sha256 of the file's raw bytes.
//   Reruns over unchanged inputs are byte-identical.

import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const GENERATOR_VERSION = 'file-surface-gen/1 stage-a';
const OUTPUT_SCHEMA = 'vivim.file-surface/1';
const ID_TOKEN = /^[a-z0-9][a-z0-9._-]{0,79}$/;

// Seeded corpus (ledger P2 Stage A): the demo surface files. Ordered — this
// order is the record order in the output. The two new walkthrough pages are
// not appended until they exist; extend this list when they land.
const SEED_FILES = [
  'apps/vivim-host/public/demo/controller.js',
  'apps/vivim-host/public/demo/demo.html',
  'apps/vivim-host/public/demo/poll-round.mjs'
];

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..', '..', '..');
const outputPath = join(repoRoot, 'apps', 'vivim-host', 'data', 'demo-baseline', 'file-surface.v1.json');

function die(message) {
  process.stderr.write('file-surface-gen: ' + message + '\n');
  process.exit(1);
}

// The two Stage A block-comment delimiters. Each entry: [opener, closer].
const BLOCK_DELIMS = [
  { opener: '/*', closer: '*/' },
  { opener: '<!--', closer: '-->' }
];

// Collect every block comment body with its absolute body start line. Scan is
// plain string search — Stage A headers are plain comments at the top of the
// file, and the corpus is small and trusted (it is the seeded repo itself).
function blockComments(text) {
  const out = [];
  for (const { opener, closer } of BLOCK_DELIMS) {
    let at = 0;
    for (;;) {
      const start = text.indexOf(opener, at);
      if (start === -1) break;
      const end = text.indexOf(closer, start + opener.length);
      if (end === -1) break;
      const line = text.slice(0, start).split('\n').length;
      out.push({ line, body: text.slice(start + opener.length, end) });
      at = end + closer.length;
    }
  }
  // Earliest comment wins; ties (same opener position) are impossible since
  // openers are distinct and non-overlapping by construction of the scan.
  return out.sort((a, b) => a.line - b.line);
}

function parseHeader(relPath, text) {
  const header = blockComments(text).find(c => c.body.trimStart().startsWith('@vlang:surface'));
  if (!header) die(relPath + ': no @vlang:surface header block comment found');

  const allLines = header.body.split('\n');
  const lines = allLines.slice(allLines.findIndex(l => l.trim().length > 0)); // skip blank lines after opener delimiter
  const first = lines[0].trim();
  const openerPrefix = '@vlang:surface';
  if (first !== openerPrefix && !first.startsWith(openerPrefix + ' ')) {
    die(relPath + ': header must open with "@vlang:surface <path>"');
  }
  const openerPath = first.slice(openerPrefix.length).trim();
  if (openerPath !== relPath) {
    die(relPath + ': header opener path ' + JSON.stringify(openerPath) + ' !== seeded path');
  }

  const desc = [];
  const commentIds = [];
  const actionIds = [];
  const seen = { commentIds: new Set(), actionIds: new Set() };

  lines.slice(1).forEach((raw, i) => {
    const lineNo = header.line + i + 1;
    const line = raw.trim();
    if (line.length === 0 || line.startsWith('#')) return;
    if (!line.startsWith('@vlang:')) return; // non-directive line — ignored
    const m = line.match(/^@vlang:([a-z-]+):?\s*([\s\S]*)$/);
    if (!m) die(relPath + ':' + lineNo + ': malformed @vlang directive');
    const [, name, valueRaw] = m;
    const value = valueRaw.trim();
    if (name === 'surface-desc') {
      desc.push(value);
      return;
    }
    if (name === 'id' || name === 'action') {
      const bucket = name === 'id' ? commentIds : actionIds;
      const seenIds = seen[name === 'id' ? 'commentIds' : 'actionIds'];
      if (value.length === 0) return; // explicit empty declaration
      for (const token of value.split(/\s+/)) {
        if (!ID_TOKEN.test(token)) {
          die(relPath + ':' + lineNo + ': token ' + JSON.stringify(token) + ' fails the id grammar ' + ID_TOKEN);
        }
        if (!seenIds.has(token)) {
          seenIds.add(token);
          bucket.push(token);
        }
      }
      return;
    }
    die(relPath + ':' + lineNo + ': unknown @vlang directive: ' + name);
  });

  return { surface: desc.join('\n'), commentIds, actionIds };
}

function buildRecord(relPath) {
  const abs = join(repoRoot, ...relPath.split('/'));
  let bytes;
  try {
    bytes = readFileSync(abs);
  } catch (err) {
    die(relPath + ': unreadable: ' + err.message);
  }
  const parsed = parseHeader(relPath, bytes.toString('utf8'));
  return {
    path: relPath,
    surface: parsed.surface,
    commentIds: parsed.commentIds,
    actionIds: parsed.actionIds,
    generatorVersion: GENERATOR_VERSION,
    sourceDigest: createHash('sha256').update(bytes).digest('hex')
  };
}

function main() {
  const files = SEED_FILES.map(buildRecord);
  const doc = {
    schema: OUTPUT_SCHEMA,
    generatorVersion: GENERATOR_VERSION,
    files
  };
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, JSON.stringify(doc, null, 2) + '\n');
  process.stdout.write('wrote ' + outputPath + ' (' + files.length + ' files)\n');
}

main();
