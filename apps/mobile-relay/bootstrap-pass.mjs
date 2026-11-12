// Trusted validator for the five deeper bootstrap passes (D03–D07).
// Schema `vivim.bootstrap-output/1`. The provider proposes typed data; the Host
// decides what becomes durable. No SQL, code, HTML, URLs or owner-confirmation
// claims survive validation.
export const PASS_SCHEMA = 'vivim.bootstrap-output/1';
export const DEEP_PASSES = Object.freeze(['D03', 'D04', 'D05', 'D06', 'D07']);
const CONTROL = /[\u0000-\u001f\u007f]/;
const URLISH = /(?:https?:\/\/|www\.|javascript:|data:text\/html|<script|<\/|;\s*drop\s+table)/i;
const ID = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,95}$/;
const FIELD_NAME = /^[a-z][a-z0-9_]{1,31}$/;
const MAX_OBS = 12, MAX_ASSERT = 12, MAX_UNKNOWNS = 8, MAX_VIEWS = 3, MAX_SCHEMAS = 2, MAX_AREAS = 12;
const BASIS = ['explicitly_stated', 'provider_memory_report', 'tentative_inference'];
const FRESHNESS = ['current', 'historical', 'unknown'];
const COVERAGE = ['covered', 'partial', 'unknown'];
const FIELD_TYPES = ['text', 'number', 'date', 'boolean', 'enum', 'reference'];
const VIEW_KINDS = ['card', 'collection', 'timeline', 'mode'];

// Contract per pass: which assertion sections and observation categories are legal.
export const PASS_CONTRACT = Object.freeze({
  D03: { sections: ['interest', 'taste', 'hobby'], categories: ['interest', 'taste', 'hobby'] },
  D04: { sections: ['role', 'project', 'goal', 'responsibility'], categories: ['role', 'project', 'goal'] },
  D05: { sections: ['routine', 'workflow', 'skill', 'tool'], categories: ['routine', 'skill', 'tool'] },
  D06: { sections: ['relationship', 'value', 'boundary'], categories: ['relationship', 'value'] },
  D07: { sections: ['contradiction', 'confidence', 'coverage'], categories: ['contradiction', 'gap'] }
});

function fail(reason) { throw new TypeError('Invalid bootstrap pass output: ' + reason); }
function object(value, allowed, name) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(name + ' must be an object');
  for (const key of Object.keys(value)) if (!allowed.includes(key)) fail('unsupported ' + name + ' field: ' + key);
  return value;
}
function bounded(value, max, name) {
  if (!Array.isArray(value) || value.length > max) fail(name + ' must be an array of at most ' + max);
  return value;
}
function text(value, limit, name) {
  if (typeof value !== 'string') fail(name + ' must be text');
  const v = value.trim();
  if (!v || v.length > limit) fail(name + ' length');
  if (CONTROL.test(v)) fail(name + ' control characters');
  if (URLISH.test(v)) fail(name + ' must not contain links, markup, scripts or SQL');
  return v;
}
function ratio(value, name) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 1) fail(name + ' must be 0..1');
  return value;
}

export function parseBootstrapPass(source) {
  let raw = source;
  if (typeof source === 'string') {
    if (source.length > 20000) fail('oversized response');
    try { raw = JSON.parse(source); } catch { fail('expected one JSON object, no Markdown fences'); }
  }
  object(raw, ['schema', 'generationId', 'passId', 'observations', 'assertions', 'unknowns', 'viewProposals', 'schemaProposals', 'coverage'], 'response');
  if (raw.schema !== PASS_SCHEMA) fail('schema');
  if (!DEEP_PASSES.includes(raw.passId)) fail('passId must be D03–D07');
  if (typeof raw.generationId !== 'string' || !ID.test(raw.generationId)) fail('generationId');
  const contract = PASS_CONTRACT[raw.passId];

  const observations = bounded(raw.observations ?? [], MAX_OBS, 'observations').map((o, i) => {
    object(o, ['category', 'text', 'confidence', 'sensitive'], 'observations[' + i + ']');
    if (!contract.categories.includes(o.category)) fail('observation category not allowed for ' + raw.passId);
    if (o.sensitive !== undefined && typeof o.sensitive !== 'boolean') fail('observation sensitive flag');
    return {
      category: o.category, text: text(o.text, 240, 'observation text'),
      confidence: ratio(o.confidence, 'observation confidence'),
      sensitive: o.category === 'relationship' || o.category === 'value' ? true : o.sensitive === true
    };
  });

  const assertions = bounded(raw.assertions ?? [], MAX_ASSERT, 'assertions').map((a, i) => {
    object(a, ['section', 'label', 'value', 'basis', 'confidence', 'scope', 'freshness'], 'assertions[' + i + ']');
    if (!contract.sections.includes(a.section)) fail('assertion section not allowed for ' + raw.passId);
    if (!BASIS.includes(a.basis)) fail('assertion basis');
    if (!FRESHNESS.includes(a.freshness)) fail('assertion freshness');
    const scope = a.scope ?? 'unknown';
    if (!['global', 'work', 'personal', 'unknown'].includes(scope)) fail('assertion scope');
    return {
      section: a.section, label: text(a.label, 80, 'assertion label'),
      value: text(a.value, 240, 'assertion value'), basis: a.basis,
      confidence: ratio(a.confidence, 'assertion confidence'), scope, freshness: a.freshness
    };
  });

  const unknowns = bounded(raw.unknowns ?? [], MAX_UNKNOWNS, 'unknowns').map((u, i) => text(u, 140, 'unknowns[' + i + ']'));

  const viewProposals = bounded(raw.viewProposals ?? [], MAX_VIEWS, 'viewProposals').map((v, i) => {
    object(v, ['kind', 'title', 'reason'], 'viewProposals[' + i + ']');
    if (!VIEW_KINDS.includes(v.kind)) fail('view kind');
    return { kind: v.kind, title: text(v.title, 64, 'view title'), reason: text(v.reason, 200, 'view reason') };
  });

  const schemaProposals = bounded(raw.schemaProposals ?? [], MAX_SCHEMAS, 'schemaProposals').map((s, i) => {
    object(s, ['type', 'fields', 'reason'], 'schemaProposals[' + i + ']');
    if (typeof s.type !== 'string' || !/^[a-z][a-z0-9_]{1,31}$/.test(s.type)) fail('schema type');
    const fields = bounded(s.fields, 8, 'schema fields').map((f, j) => {
      object(f, ['name', 'type'], 'schema field[' + j + ']');
      if (typeof f.name !== 'string' || !FIELD_NAME.test(f.name)) fail('schema field name');
      if (!FIELD_TYPES.includes(f.type)) fail('schema field type');
      return { name: f.name, type: f.type };
    });
    if (s.type === 'sql' || s.type === 'script' || s.type === 'javascript') fail('executable schema type');
    return { type: s.type, fields, reason: text(s.reason, 200, 'schema reason'), executable: false, consent: 'required' };
  });

  const coverage = object(raw.coverage ?? { areas: [] }, ['areas'], 'coverage');
  const areas = bounded(coverage.areas ?? [], MAX_AREAS, 'coverage areas').map((a, i) => {    object(a, ['name', 'state'], 'coverage area[' + i + ']');
    if (!COVERAGE.includes(a.state)) fail('coverage state');
    return { name: text(a.name, 64, 'coverage area'), state: a.state };
  });

  return { schema: PASS_SCHEMA, generationId: raw.generationId, passId: raw.passId,
    observations, assertions, unknowns, viewProposals, schemaProposals, coverage: { areas } };
}

// Deterministic row ids so a replay of the same provider payload is idempotent.
function digest(worldId, passId, kind, label) {
  const value = [worldId, passId, kind, label.toLowerCase()].join('\u0000');
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) { hash ^= value.charCodeAt(i); hash = Math.imul(hash, 0x01000193) >>> 0; }
  return hash.toString(16).padStart(8, '0');
}

export function compilePassOutput(input, { worldId, requestId } = {}) {
  if (typeof worldId !== 'string' || !ID.test(worldId)) fail('trusted world scope required');
  if (typeof requestId !== 'string' || !ID.test(requestId)) fail('trusted request id required');
  const out = parseBootstrapPass(input);
  const p = out.passId;
  return {
    ...out, worldId, requestId,
    observations: out.observations.map(o => ({ id: 'obs-' + digest(worldId, p, o.category, o.text), ...o })),
    assertions: out.assertions.map(a => ({
      id: 'clm-' + digest(worldId, 'claim', a.section, a.label), ...a,
      status: a.basis === 'explicitly_stated' ? 'owner-reported' : a.basis === 'tentative_inference' ? 'tentative' : 'provider-reported'
    })),
    schemaProposals: out.schemaProposals.map(s => ({ id: 'sch-' + digest(worldId, p, 'schema', s.type), ...s })),
    viewProposals: out.viewProposals.map(v => ({ id: 'viw-' + digest(worldId, p, 'view', v.title), ...v }))
  };
}
