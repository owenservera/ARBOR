// Trusted deterministic compiler for ChatGPT F01 "recognise me" replies.
// Bounded, dependency-free, no DOM/network/storage effect: the Host assigns claim
// ids, provenance and revisions after this returns. A provider statement is never
// owner confirmation.
export const F01_SCHEMA = 'vivim.bootstrap-fast/1';
export const F01_PROFILE_SCHEMA = 'vivim.bootstrap-profile/1';
const KINDS = ['project', 'interest', 'goal', 'practice'];
const FRESHNESS = ['current', 'historical', 'unknown'];
const BASIS = ['explicitly_stated', 'provider_memory_report', 'tentative_inference'];
const MAX_FOCUS = 3;
const MAX_UNKNOWNS = 5;
const MAX_CARDS = 3;
const MAX_BOUNDARIES = 8;
const CONTROL = /[\u0000-\u001f\u007f]/;
const URLISH = /(?:https?:\/\/|www\.|javascript:|data:text\/html|<script|<\/)/i;
const NAME_ONLY = /^[A-Z][a-z]+ [A-Z][a-z]+$/;

function fail(reason) { throw new TypeError('Invalid F01 recognition: ' + reason); }
function text(value, limit, name, { allowName = false } = {}) {
  if (typeof value !== 'string') fail(name + ' must be text');
  const v = value.trim();
  if (!v || v.length > limit) fail(name + ' length');
  if (CONTROL.test(v)) fail(name + ' control characters');
  if (URLISH.test(v)) fail(name + ' must not contain links, markup or scripts');
  if (!allowName && NAME_ONLY.test(v)) fail(name + ' looks like an unverified personal name');
  return v;
}
function object(value, allowed, name) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(name + ' must be an object');
  for (const key of Object.keys(value)) if (!allowed.includes(key)) fail('unsupported ' + name + ' field: ' + key);
}
function bounded(value, max, name) {
  if (!Array.isArray(value) || value.length > max) fail(name + ' must be an array of at most ' + max);
  return value;
}

// `blocks` is optional and additive: the documented F01 prompt omits it and stays valid.
const ROOT = ['schema', 'generationId', 'passId', 'communication', 'focus', 'unknowns', 'suggestedCards', 'boundaries'];
const COMMUNICATION = ['language', 'tone', 'responseStyle'];

export function parseF01Response(source) {
  let raw = source;
  if (typeof source === 'string') {
    if (source.length > 12000) fail('oversized response');
    try { raw = JSON.parse(source); } catch { fail('expected one JSON object, no Markdown fences'); }
  }
  object(raw, ROOT, 'response');
  if (raw.schema !== F01_SCHEMA) fail('schema');
  if (raw.passId !== 'F01') fail('passId');
  if (typeof raw.generationId !== 'string' || !/^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,95}$/.test(raw.generationId)) fail('generationId');

  const communication = {};
  if (raw.communication !== undefined) {
    object(raw.communication, COMMUNICATION, 'communication');
    if (raw.communication.language !== undefined) communication.language = text(raw.communication.language, 48, 'language');
    if (raw.communication.tone !== undefined) communication.tone = text(raw.communication.tone, 80, 'tone');
    if (raw.communication.responseStyle !== undefined) communication.responseStyle = text(raw.communication.responseStyle, 120, 'responseStyle');
  }

  const focus = bounded(raw.focus ?? [], MAX_FOCUS, 'focus').map((item, i) => {
    object(item, ['label', 'kind', 'freshness', 'basis', 'explanation'], 'focus[' + i + ']');
    if (!KINDS.includes(item.kind)) fail('focus kind');
    if (!FRESHNESS.includes(item.freshness)) fail('focus freshness');
    if (!BASIS.includes(item.basis)) fail('focus basis');
    return {
      label: text(item.label, 80, 'focus label'),
      kind: item.kind,
      freshness: item.freshness,
      basis: item.basis,
      explanation: text(item.explanation, 200, 'focus explanation')
    };
  });

  const unknowns = bounded(raw.unknowns ?? [], MAX_UNKNOWNS, 'unknowns')
    .map((u, i) => text(u, 120, 'unknowns[' + i + ']'));

  const labels = new Set(focus.map(f => f.label.toLowerCase()));
  const suggestedCards = bounded(raw.suggestedCards ?? [], MAX_CARDS, 'suggestedCards').map((card, i) => {
    object(card, ['title', 'focus'], 'suggestedCards[' + i + ']');
    const title = text(card.title, 64, 'card title');
    if (card.focus !== undefined) {
      const link = text(card.focus, 80, 'card focus');
      // A card may only exist for a grounded focus item; no invented project names.
      if (!labels.has(link.toLowerCase())) fail('card must reference a returned focus label');
    }
    return { title, ...(card.focus !== undefined ? { focus: card.focus } : {}) };
  });

  // Optional owner-facing boundaries: only an explicit statement may become a hard NO.
  const boundaries = bounded(raw.boundaries ?? [], MAX_BOUNDARIES, 'boundaries').map((b, i) => {
    object(b, ['trait', 'basis', 'hard'], 'boundaries[' + i + ']');
    if (!BASIS.includes(b.basis)) fail('boundary basis');
    if (typeof b.hard !== 'boolean') fail('boundary hard flag');
    if (b.hard && b.basis !== 'explicitly_stated') fail('only an explicit statement becomes a hard NO');
    return { trait: text(b.trait, 120, 'boundary'), basis: b.basis, hard: b.hard };
  });

  return {
    schema: F01_SCHEMA, generationId: raw.generationId, passId: 'F01',
    communication, focus, unknowns, suggestedCards, boundaries
  };
}

// Stable per-world claim ids keep re-ingestion idempotent without trusting the model.
export function claimId(worldId, section, label) {
  const value = worldId + '\u0000' + section + '\u0000' + label.toLowerCase();
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return 'clm-' + hash.toString(16).padStart(8, '0');
}

// Provider basis maps onto how much local trust the claim earns. Nothing is 'confirmed'.
export function providerStatus(basis) {
  return basis === 'explicitly_stated' ? 'owner-reported' : basis === 'tentative_inference' ? 'tentative' : 'provider-reported';
}

export function compileF01Profile(input, { worldId, requestId } = {}) {
  if (typeof worldId !== 'string' || !/^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,95}$/.test(worldId)) fail('trusted world scope required');
  if (typeof requestId !== 'string' || !/^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,95}$/.test(requestId)) fail('trusted request id required');
  const profile = parseF01Response(input);
  const claims = [];
  for (const item of profile.focus) {
    claims.push({
      id: claimId(worldId, 'focus', item.label), section: 'focus', label: item.label,
      kind: item.kind, freshness: item.freshness, basis: item.basis,
      status: providerStatus(item.basis), confidence: item.basis === 'explicitly_stated' ? 0.9 : item.basis === 'provider_memory_report' ? 0.6 : 0.3,
      scope: item.kind === 'practice' || item.kind === 'goal' ? 'personal' : 'unknown',
      statement: item.explanation, preference: null
    });
  }
  for (const [key, value] of Object.entries(profile.communication)) {
    claims.push({
      id: claimId(worldId, 'communication', key), section: 'communication', label: key,
      kind: 'preference', freshness: 'current', basis: 'provider_memory_report',
      status: 'provider-reported', confidence: 0.55, scope: 'global',
      statement: value, preference: { key: 'communication.' + key, value, polarity: 'want', hard: false }
    });
  }
  for (const boundary of profile.boundaries) {
    claims.push({
      id: claimId(worldId, 'boundary', boundary.trait), section: 'boundary', label: boundary.trait,
      kind: 'preference', freshness: 'current', basis: boundary.basis,
      status: providerStatus(boundary.basis), confidence: boundary.basis === 'explicitly_stated' ? 0.92 : 0.4,
      scope: 'global', statement: boundary.trait,
      preference: { key: 'boundary.' + boundary.trait.toLowerCase(), value: boundary.trait, polarity: 'avoid', hard: false }
    });
  }
  const cards = profile.suggestedCards.map((card, i) => ({
    id: claimId(worldId, 'card', card.title), title: card.title,
    ...(card.focus ? { focus: card.focus } : {}), rank: i, source: 'F01'
  }));
  return {
    schema: F01_PROFILE_SCHEMA, worldId, requestId, passId: 'F01',
    claims, cards, unknowns: profile.unknowns,
    communication: profile.communication,
    // ChatGPT can report a remembered prohibition, not impersonate fresh owner confirmation.
    hardNos: [], recalledHardNos: profile.boundaries.filter(b => b.hard).map(b => b.trait)
  };
}
