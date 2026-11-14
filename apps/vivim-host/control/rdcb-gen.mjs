// rdcb-gen.mjs — deterministic RDCB v1 bundle generator (ledger P3, Stage B).
// Emits Reprogramming Dynamic Context Bundles for the Stage A seeded corpus
// (the files carrying @vlang:surface headers) under
// apps/vivim-host/data/demo-baseline/rdcb/.
//
// FORMAT — inherits hq.context-bundle/1 (docs/DCB-PROTOCOL.md lives in
// repos_hq: C:/0-BlackBoxProject-0/repos_hq/docs/DCB-PROTOCOL.md; the ARBOR
// docs/ tree has no local copy — bundle shape follows that normative spec,
// §6 Output). Schema: vivim.rdcb/1, one bundle per seeded file. Inherited
// keys: schema, protocol, trigger, task, audience, project, generatedAt,
// status, budget, sources, omissions, symbols, decisions, canon, sessions,
// labels, authority, digest. ADDED reprogramming-specific keys ONLY:
//
//   bundle.inherits         "hq.context-bundle/1" — explicit inheritance mark.
//   bundle.reprogramming    { corpusScope, vlangExecution, fileSurfaceRegistry,
//                             nlclCatalog } — provenance of the composition:
//                             the file-surface registry ref + record count and
//                             the NLCL action-catalog ref + schema + version.
//   source.excerpt          { kind, lines, text } — the source excerpt the
//                             file-surface record anchors. v1 anchors ONE
//                             excerpt per file: the @vlang:surface header block
//                             verbatim (delimiters included). Per-comment-id
//                             body excerpts are NOT emitted in v1 — the
//                             commentIds have no on-disk body anchors yet
//                             (verified 2026-11-14: ids appear only in the
//                             header), and anchoring them would require vlang
//                             execution, which is out of scope ("format +
//                             generator only", no vlang EXECUTION in v1).
//   source.fileSurface      { ref, surface, commentIds } — the referenced
//                             vivim.file-surface/1 record (minus its digest
//                             fields, which the source carries as sha256).
//   source.nlclActionIds    the record's actionIds, VALIDATED against
//                             apps/vivim-host/control/action-catalog.v1.json
//                             (Stage A declared them without validation; the
//                             catalog check is the later stage it anticipated).
//                             Unknown id => fail-closed error.
//
// Inherited fields RDCB v1 does NOT populate (no honest source for them):
// docFamily / docRole / sourceClass / autoExposeReason (217/133 registry not
// consulted), symbols / decisions / canon / sessions stay empty arrays, and
// score stays at the protocol base score 1 (no scorer run). They are kept as
// keys only where the shape carries them, so a bundle is shape-complete.
//
// DETERMINISM CONTRACT (protocol §9 + file-surface-gen Stage A conventions):
//   - SEED_FILES is an explicit ordered list — no directory scans, no globbing.
//   - generatedAt is PINNED to the directive date by default so reruns over
//     unchanged inputs are byte-identical (protocol §2 "now — pinned timestamp
//     for determinism"). Pass --now <iso> to override; the pinned default is
//     still what the digest excludes (protocol §6: "digest excludes
//     generatedAt").
//   - No environment values, no Math.random, no locale-dependent formatting.
//   - budget: trigger "edit.pre" default maxTokens 5000, reserved 800
//     (protocol §1, §2); capacity = maxTokens - reserved - 80 (protocol §5).
//   - estimatedTokens = ceil(utf8 byte length / 3) (protocol estimator
//     "utf8-bytes/3").
//   - status is COMPUTED, not asserted: "fresh" when every seeded file's
//     current sha256 equals its file-surface record sourceDigest, else
//     "stale" (protocol §7) with the drifted paths recorded in omissions
//     alongside their reason.
//   - Object keys in fixed literal order; JSON 2-space indent, trailing
//     newline. Top-level digest = sha256 of the canonical JSON of the bundle
//     minus generatedAt and minus its own digest field.

import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const GENERATOR_VERSION = 'rdcb-gen/1 stage-b';
const BUNDLE_SCHEMA = 'vivim.rdcb/1';
const INHERITS = 'hq.context-bundle/1';
const PROTOCOL = 'hq.dcb-protocol/1';
const TRIGGER = 'edit.pre';
const AUDIENCE = 'agent';
const PROJECT = 'arbor';
const AUTHORITY = 'project_observed';
const BUDGET_MAX_TOKENS = 5000;   // protocol §1 edit.pre default
const BUDGET_RESERVED = 800;      // protocol §2 reservedForOutput default
const CAPACITY_SLACK = 80;        // protocol §5: capacity = budget - reserved - 80
const TOKENS_PER_BYTE = 3;        // protocol estimator "utf8-bytes/3"
// Pinned default timestamp (owner directive date 2026-11-14). Not "today" —
// a fixed constant, so the emitted bytes do not move between runs.
const PINNED_NOW = '2026-11-14T00:00:00.000Z';

const FILE_SURFACE_REL = 'apps/vivim-host/data/demo-baseline/file-surface.v1.json';
const ACTION_CATALOG_REL = 'apps/vivim-host/control/action-catalog.v1.json';
const RDCB_DIR_REL = 'apps/vivim-host/data/demo-baseline/rdcb';

// Same seeded corpus as file-surface-gen.mjs stage-a (ledger P2): ordered,
// explicit, extended only when new @vlang:surface files land.
const SEED_FILES = [
  'apps/vivim-host/public/demo/controller.js',
  'apps/vivim-host/public/demo/demo.html',
  'apps/vivim-host/public/demo/poll-round.mjs'
];

const LANG_BY_EXT = { '.js': 'javascript', '.mjs': 'javascript', '.html': 'html' };

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..', '..', '..');

function die(message) {
  process.stderr.write('rdcb-gen: ' + message + '\n');
  process.exit(1);
}

function sha256Hex(data) {
  return createHash('sha256').update(data).digest('hex');
}

function estimateTokens(text) {
  return Math.ceil(Buffer.byteLength(text, 'utf8') / TOKENS_PER_BYTE);
}

// Locate the FIRST block comment whose body starts with the exact token
// `@vlang:surface` and return it VERBATIM (delimiters included) with its
// 1-based [startLine, endLine]. Same opener set as file-surface-gen.mjs
// stage-a: /* */ and <!-- -->. A seeded file without the header is fatal.
function surfaceHeaderExcerpt(relPath, text) {
  const delims = [
    { opener: '/*', closer: '*/' },
    { opener: '<!--', closer: '-->' }
  ];
  const found = [];
  for (const { opener, closer } of delims) {
    let at = 0;
    for (;;) {
      const start = text.indexOf(opener, at);
      if (start === -1) break;
      const end = text.indexOf(closer, start + opener.length);
      if (end === -1) break;
      const body = text.slice(start + opener.length, end);
      if (body.trimStart().startsWith('@vlang:surface')) {
        const startLine = text.slice(0, start).split('\n').length;
        const endLine = startLine + text.slice(start, end + closer.length).split('\n').length - 1;
        found.push({
          lines: [startLine, endLine],
          text: text.slice(start, end + closer.length)
        });
      }
      at = end + closer.length;
    }
  }
  if (found.length === 0) {
    die(relPath + ': no @vlang:surface header block comment found');
  }
  // Earliest header wins; exactly one header is the seeded invariant.
  found.sort((a, b) => a.lines[0] - b.lines[0]);
  return found[0];
}

function readRepoFile(relPath) {
  try {
    return readFileSync(join(repoRoot, ...relPath.split('/')));
  } catch (err) {
    die(relPath + ': unreadable: ' + err.message);
  }
}

// Load the Stage A registry and index its records by path. The registry must
// be current with the generator that produced it (same schema, one record per
// seed); a missing record is fatal — RDCB composes ON TOP of file-surface.
function loadFileSurface() {
  const bytes = readRepoFile(FILE_SURFACE_REL);
  let doc;
  try {
    doc = JSON.parse(bytes.toString('utf8'));
  } catch (err) {
    die(FILE_SURFACE_REL + ': invalid JSON: ' + err.message);
  }
  if (doc.schema !== 'vivim.file-surface/1') {
    die(FILE_SURFACE_REL + ': expected schema vivim.file-surface/1, got ' + JSON.stringify(doc.schema));
  }
  const byPath = new Map();
  for (const rec of doc.files) {
    if (byPath.has(rec.path)) die(FILE_SURFACE_REL + ': duplicate record for ' + rec.path);
    byPath.set(rec.path, rec);
  }
  return { doc, byPath };
}

// Load the NLCL action catalog and validate the actionIds each file-surface
// record declares (Stage A deferred this check to a later stage; this is it).
function loadActionCatalog() {
  const bytes = readRepoFile(ACTION_CATALOG_REL);
  let doc;
  try {
    doc = JSON.parse(bytes.toString('utf8'));
  } catch (err) {
    die(ACTION_CATALOG_REL + ': invalid JSON: ' + err.message);
  }
  if (doc.schema !== 'vivim.control-action-catalog/1') {
    die(ACTION_CATALOG_REL + ': expected schema vivim.control-action-catalog/1, got ' + JSON.stringify(doc.schema));
  }
  const ids = new Set((doc.actions ?? []).map(a => a.id).filter(Boolean));
  return { doc, ids };
}

// Compose ONE bundle for ONE seeded file. Every value below is either read
// from disk or derived by a fixed function of disk bytes — nothing inferred.
function composeBundle({ relPath, bytes, now, registry, registryDoc, catalog, catalogDoc }) {
  const excerpt = surfaceHeaderExcerpt(relPath, bytes.toString('utf8'));
  const record = registry.byPath.get(relPath);
  if (!record) {
    die(relPath + ': no file-surface record — regenerate file-surface.v1.json first');
  }

  const currentDigest = sha256Hex(bytes);
  const stale = record.sourceDigest !== currentDigest;

  // Stage A declared actionIds without catalog validation; fail closed here.
  for (const actionId of record.actionIds) {
    if (!catalog.ids.has(actionId)) {
      die(relPath + ': actionIds entry ' + JSON.stringify(actionId) + ' not found in ' + ACTION_CATALOG_REL);
    }
  }

  const ext = relPath.slice(relPath.lastIndexOf('.'));
  const lang = LANG_BY_EXT[ext];
  if (!lang) die(relPath + ': unmapped extension ' + JSON.stringify(ext));

  const estimatedTokens = estimateTokens(excerpt.text);
  const capacity = BUDGET_MAX_TOKENS - BUDGET_RESERVED - CAPACITY_SLACK;
  if (estimatedTokens > capacity) {
    die(relPath + ': excerpt estimatedTokens ' + estimatedTokens + ' exceeds capacity ' + capacity);
  }

  const fileSurface = {
    ref: FILE_SURFACE_REL,
    surface: record.surface,
    commentIds: record.commentIds
  };

  const source = {
    ref: PROJECT + ':' + relPath,
    project: PROJECT,
    path: relPath,
    kind: 'code',
    lang,
    sha256: currentDigest,
    lines: excerpt.lines,
    estimatedTokens,
    score: 1,
    reason: 'rdcb|file-surface|vlang-surface-header',
    authority: AUTHORITY,
    excerpt: { kind: 'vlang-surface-header', lines: excerpt.lines, text: excerpt.text },
    fileSurface,
    nlclActionIds: record.actionIds,
    digest: sha256Hex(excerpt.text)
  };

  const budget = {
    maxTokens: BUDGET_MAX_TOKENS,
    reserved: BUDGET_RESERVED,
    capacity,
    used: estimatedTokens,
    estimator: 'utf8-bytes/3'
  };

  const bundle = {
    schema: BUNDLE_SCHEMA,
    protocol: PROTOCOL,
    inherits: INHERITS,
    trigger: TRIGGER,
    task: 'RDCB v1 — reprogramming context for ' + relPath,
    audience: AUDIENCE,
    project: PROJECT,
    generatedAt: now,
    status: stale ? 'stale' : 'fresh',
    budget,
    reprogramming: {
      corpusScope: 'vlang-surface-headers',
      vlangExecution: false,
      fileSurfaceRegistry: {
        ref: FILE_SURFACE_REL,
        schema: registryDoc.schema,
        generatorVersion: registryDoc.generatorVersion,
        recordCount: registry.byPath.size
      },
      nlclCatalog: {
        ref: ACTION_CATALOG_REL,
        schema: catalogDoc.schema,
        version: catalogDoc.version
      },
      surfaceDrift: stale ? [relPath] : []
    },
    sources: [source],
    omissions: [],
    symbols: [],
    decisions: [],
    canon: [],
    sessions: [],
    labels: { aperture: 'Reprogram', evidence: 'file-surface.v1 + action-catalog.v1' },
    authority: 'read_only_projection',
    digest: ''
  };

  // Protocol §6/§9: digest excludes generatedAt (and itself) so identical
  // inputs produce identical digests. Key order is the literal order above.
  const forDigest = { ...bundle, digest: undefined };
  delete forDigest.generatedAt;
  bundle.digest = sha256Hex(JSON.stringify(forDigest));
  return bundle;
}

function parseNowArg(argv) {
  const flagIndex = argv.indexOf('--now');
  if (flagIndex === -1) return PINNED_NOW;
  const value = argv[flagIndex + 1];
  if (!value || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) {
    die('--now expects an ISO timestamp like ' + PINNED_NOW + ', got ' + JSON.stringify(value ?? ''));
  }
  return value;
}

function main() {
  const now = parseNowArg(process.argv.slice(2));
  const registry = loadFileSurface();
  const catalog = loadActionCatalog();

  const outDir = join(repoRoot, ...RDCB_DIR_REL.split('/'));
  mkdirSync(outDir, { recursive: true });

  let written = 0;
  for (const relPath of SEED_FILES) {
    const bytes = readRepoFile(relPath);
    const bundle = composeBundle({ relPath, bytes, now, registry, registryDoc: registry.doc, catalog, catalogDoc: catalog.doc });
    const base = relPath.slice(relPath.lastIndexOf('/') + 1).replace(/\.[^.]+$/, '');
    const outPath = join(outDir, base + '.rdcb.v1.json');
    writeFileSync(outPath, JSON.stringify(bundle, null, 2) + '\n');
    process.stdout.write(
      'wrote ' + outPath + ' status=' + bundle.status +
      ' used=' + bundle.budget.used + '/' + bundle.budget.capacity +
      ' digest=' + bundle.digest + '\n'
    );
    written++;
  }
  process.stdout.write('rdcb-gen: wrote ' + written + ' bundle(s) to ' + outDir + '\n');
}

main();
