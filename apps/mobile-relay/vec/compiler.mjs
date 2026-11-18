// VEC core/0.1: one pure compilation boundary, three owner-preserving adapters.
// Source text is NOT an execution or grant token. Only a trusted caller supplies the domain
// and adapters; no input may install a compiler, authorize an action or select a publisher.
// @hq:type vivim.vec-compile@0.1
export const VEC_COMPILE_SCHEMA = 'vivim.vec-compile/0.1';
export const VEC_DOMAINS = Object.freeze(['wiki', 'command', 'ui']);
export const VEC_PRODUCTS = Object.freeze({
  wiki: 'wiki-projection',
  command: 'command-plan',
  ui: 'ui-revision-proposal'
});
// Canonical proposal schemas, not new runtime types. They also anchor the existing
// HQ source-comment index. A source identity is never an execution credential.
const PRODUCT_SCHEMAS = Object.freeze({
  wiki: 'hq.wiki-program/1', command: 'vivim.command-intent/0.1', ui: 'vivim.ui-proposal/1'
});
function semanticId(schema) {
  const at = schema.lastIndexOf('/');
  return schema.slice(0, at) + '@' + schema.slice(at + 1);
}
const STATES = new Set(['candidate', 'clarification_required', 'unsupported', 'refused']);
const plain = value => value !== null && typeof value === 'object' && !Array.isArray(value) &&
  (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
const fail = (domain, outcome, code) => ({
  schema: VEC_COMPILE_SCHEMA, domain, product: VEC_PRODUCTS[domain] ?? null,
  outcome, code, authorization: 'none', executed: false, persisted: false
});

/** Register only trusted first-party adapters; wiki and command keep their incumbent
 * owners until source parity is independently established. No fallback silently runs. */
export function createVecCompiler({ adapters = {} } = {}) {
  if (!plain(adapters) || Object.keys(adapters).some(k => !VEC_DOMAINS.includes(k) || typeof adapters[k] !== 'function'))
    throw new TypeError('VEC_INVALID_ADAPTERS');
  const installed = Object.freeze({ ...adapters });
  return Object.freeze({
    compile({ domain, text, context = {} } = {}) {
      if (!VEC_DOMAINS.includes(domain)) return fail(null, 'refused', 'UNKNOWN_DOMAIN');
      if (typeof text !== 'string' || !text.trim() || text.length > 4096 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(text))
        return fail(domain, 'refused', 'INVALID_INPUT');
      if (!plain(context)) return fail(domain, 'refused', 'INVALID_CONTEXT');
      if (!Object.hasOwn(installed, domain))
        return { ...fail(domain, 'unsupported', 'LEGACY_OWNER_NOT_MIGRATED'), legacyOwner:
          PRODUCT_SCHEMAS[domain] };
      try {
        const result = installed[domain]({ ...context, text });
        if (!plain(result) || !STATES.has(result.outcome)) return fail(domain, 'refused', 'ADAPTER_INVALID_RESULT');
        // Explicitly overwrite any caller-supplied "authorized", "persisted" or "executed" claim.
        const { outcome, code, proposal, preview, summary, detail } = result;
        // Emit only identities of actual first-party, schema-matching candidates.
        // Never forward source IDs (or authority flags) supplied by an adapter.
        const sourceSemanticIds = outcome === 'candidate' && plain(proposal) &&
          proposal.schema === PRODUCT_SCHEMAS[domain]
          ? [semanticId(VEC_COMPILE_SCHEMA), semanticId(PRODUCT_SCHEMAS[domain])] : null;
        return { ...fail(domain, outcome, code ?? 'NONE'),
          ...(sourceSemanticIds ? { sourceSemanticIds } : {}),
          ...(proposal === undefined ? {} : { proposal }),
          ...(preview === undefined ? {} : { preview }),
          ...(summary === undefined ? {} : { summary }),
          ...(detail === undefined ? {} : { detail }) };
      } catch {
        return fail(domain, 'refused', 'ADAPTER_FAILURE');
      }
    }
  });
}
