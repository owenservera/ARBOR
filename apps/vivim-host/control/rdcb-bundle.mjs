// rdcb-bundle.mjs — deterministic, source-revision-pinned RDCB v1 bundle module.
//
// Importable and pure: no CLI, no file I/O, no process.exit, no Math.random,
// no provider access. Compose a single vivim.rdcb/1 bundle on top of the
// existing file-surface registry (vivim.file-surface/1) and NLCL action
// catalog (vivim.control-action-catalog/1) — no second graph authority.
//
// Contract reuse (same conventions as control/rdcb-gen.mjs):
//   - schema vivim.rdcb/1, inherits hq.context-bundle/1,
//     protocol hq.dcb-protocol/1
//   - edit.pre budget: maxTokens 5000, reserved 800,
//     capacity = maxTokens - reserved - 80
//   - estimator utf8-bytes/3; generatedAt pinned by default and excluded
//     from the digest so identical inputs yield identical bytes/digest
//   - status computed, not asserted: fresh when the source sha256 equals the
//     file-surface sourceDigest, else stale (selective invalidation signal,
//     drifted paths recorded in reprogramming.surfaceDrift)
//   - fail closed on unknown actionIds, missing surface record, or unmapped
//     extension
//
// Source-revision pin: source.sha256 is the sha256 of the exact source bytes
// the bundle was composed from, so each bundle is pinned to that source
// revision.
import { createHash } from 'node:crypto';

export const BUNDLE_SCHEMA = 'vivim.rdcb/1';
export const INHERITS = 'hq.context-bundle/1';
export const PROTOCOL = 'hq.dcb-protocol/1';
export const TRIGGER = 'edit.pre';
export const AUDIENCE = 'agent';
export const PROJECT = 'arbor';
export const SOURCE_AUTHORITY = 'project_observed';
export const BUNDLE_AUTHORITY = 'read_only_projection';
export const BUDGET_MAX_TOKENS = 5000;
export const BUDGET_RESERVED = 800;
export const CAPACITY_SLACK = 80;
export const TOKENS_PER_BYTE = 3;
// Pinned default timestamp for determinism — not "today".
export const PINNED_NOW = '2026-11-14T00:00:00.000Z';

const FILE_SURFACE_REF = 'apps/vivim-host/data/demo-baseline/file-surface.v1.json';
const ACTION_CATALOG_REF = 'apps/vivim-host/control/action-catalog.v1.json';
const LANG_BY_EXT = { '.js': 'javascript', '.mjs': 'javascript', '.html': 'html' };

export function sha256Hex(data) {
  return createHash('sha256').update(data).digest('hex');
}

export function estimateTokens(text) {
  return Math.ceil(Buffer.byteLength(text, 'utf8') / TOKENS_PER_BYTE);
}

// Locate the first block comment whose body starts with @vlang:surface and
// return it verbatim (delimiters included) with 1-based [startLine, endLine].
export function surfaceHeaderExcerpt(text) {
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
        const endLine =
          startLine + text.slice(start, end + closer.length).split('\n').length - 1;
        found.push({ lines: [startLine, endLine], text: text.slice(start, end + closer.length) });
      }
      at = end + closer.length;
    }
  }
  if (found.length === 0) throw new Error('no @vlang:surface header block comment found');
  found.sort((a, b) => a.lines[0] - b.lines[0]);
  return found[0];
}

function die(message) {
  throw new Error('rdcb-bundle: ' + message);
}

// Compose ONE bundle for ONE source. Pure in (bytes, surface record,
// catalogIds): the caller owns reading files and the registry/catalog, so this
// module never touches the disk, the network, or a provider.
export function composeBundle({
  relPath,
  bytes,
  now = PINNED_NOW,
  surface,
  catalogIds,
  catalogMeta
} = {}) {
  if (!relPath || typeof relPath !== 'string') die('relPath required');
  if (!surface || surface.path !== relPath) {
    die(`no file-surface record for ${relPath}`);
  }
  if (!catalogIds || typeof catalogIds.has !== 'function') die('catalogIds set required');

  const text = Buffer.isBuffer(bytes) ? bytes.toString('utf8') : String(bytes);
  const excerpt = surfaceHeaderExcerpt(text);

  // Source-revision pin: sha256 of the exact source bytes.
  const currentDigest = sha256Hex(text);

  // Selective invalidation: fresh only when the pinned source revision matches
  // the file-surface registry's sourceDigest; otherwise stale (source drift).
  const stale = surface.sourceDigest !== currentDigest;

  // Fail closed: every declared actionId must be catalogued.
  for (const actionId of surface.actionIds ?? []) {
    if (!catalogIds.has(actionId)) {
      die(`actionIds entry ${JSON.stringify(actionId)} not found in ${ACTION_CATALOG_REF}`);
    }
  }

  const ext = relPath.slice(relPath.lastIndexOf('.'));
  const lang = LANG_BY_EXT[ext];
  if (!lang) die(`unmapped extension ${JSON.stringify(ext)}`);

  const estimatedTokens = estimateTokens(excerpt.text);
  const capacity = BUDGET_MAX_TOKENS - BUDGET_RESERVED - CAPACITY_SLACK;
  if (estimatedTokens > capacity) {
    die(`excerpt estimatedTokens ${estimatedTokens} exceeds capacity ${capacity}`);
  }

  const catalogSchema = (catalogMeta && catalogMeta.schema) || 'vivim.control-action-catalog/1';
  const catalogVersion = catalogMeta && typeof catalogMeta.version !== 'undefined' ? catalogMeta.version : null;

  const fileSurface = {
    ref: FILE_SURFACE_REF,
    surface: surface.surface,
    commentIds: surface.commentIds
  };

  const source = {
    ref: `${PROJECT}:${relPath}`,
    project: PROJECT,
    path: relPath,
    kind: 'code',
    lang,
    sha256: currentDigest,
    lines: excerpt.lines,
    estimatedTokens,
    score: 1,
    reason: 'rdcb|file-surface|vlang-surface-header',
    authority: SOURCE_AUTHORITY,
    excerpt: { kind: 'vlang-surface-header', lines: excerpt.lines, text: excerpt.text },
    fileSurface,
    nlclActionIds: [...(surface.actionIds ?? [])],
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
    task: `RDCB v1 — reprogramming context for ${relPath}`,
    audience: AUDIENCE,
    project: PROJECT,
    generatedAt: now,
    status: stale ? 'stale' : 'fresh',
    budget,
    reprogramming: {
      corpusScope: 'vlang-surface-headers',
      vlangExecution: false,
      fileSurfaceRegistry: {
        ref: FILE_SURFACE_REF,
        schema: surface.schema ?? 'vivim.file-surface/1',
        generatorVersion: surface.generatorVersion ?? null,
        recordCount: surface.recordCount ?? 1
      },
      nlclCatalog: { ref: ACTION_CATALOG_REF, schema: catalogSchema, version: catalogVersion },
      surfaceDrift: stale ? [relPath] : []
    },
    sources: [source],
    omissions: [],
    symbols: [],
    decisions: [],
    canon: [],
    sessions: [],
    labels: { aperture: 'Reprogram', evidence: 'file-surface.v1 + action-catalog.v1' },
    authority: BUNDLE_AUTHORITY,
    digest: ''
  };

  // Protocol §6/§9: digest excludes generatedAt (and itself).
  const forDigest = { ...bundle, digest: undefined };
  delete forDigest.generatedAt;
  bundle.digest = sha256Hex(JSON.stringify(forDigest));
  return bundle;
}

// Compose a source against a loaded file-surface registry + catalog.
//
// registry: { byPath: Map<path, record>, schema?, generatorVersion?, recordCount? }
// catalog:  { ids: Set<string>, schema?, version? }
export function composeBundleFromRegistry({ relPath, bytes, now = PINNED_NOW, registry, catalog } = {}) {
  if (!registry || !registry.byPath || !(registry.byPath instanceof Map)) die('registry.byPath Map required');
  const record = registry.byPath.get(relPath);
  if (!record) die(`no file-surface record for ${relPath}`);
  const catalogIds = catalog && catalog.ids ? catalog.ids : new Set();
  const catalogMeta = catalog ? { schema: catalog.schema, version: catalog.version } : undefined;
  return composeBundle({
    relPath,
    bytes,
    now,
    surface: record,
    catalogIds,
    catalogMeta
  });
}
