// VIVIM universal API: a derived, owner-scoped description of existing Host
// operations. Never registers actions, grants permission or performs effects.
// @hq:context Machine-readable API surface derived from the canonical Host catalog.
// @hq:invariant Discovery is not authorization or live acceptance.
const BASE = '/api/host/control';
const json = schema => ({ 'application/json': { schema } });
const response = (description, schema = { type: 'object' }) => ({ description, content: json(schema) });
const closed = (properties, required = Object.keys(properties)) => ({ type: 'object', properties, required, additionalProperties: false });
const planId = { type: 'string', pattern: '^ctl-[a-f0-9]{16}$' };
const planDigest = { type: 'string', pattern: '^[a-f0-9]{64}$' };
const mutationHeaders = [
  { name: 'Origin', in: 'header', required: true, schema: { type: 'string' }, description: 'Exact local Host origin.' },
  { name: 'x-vivim-control', in: 'header', required: true, schema: { type: 'string', const: '1' } }
];
function responses(description) {
  return { '200': response(description), '401': response('Owner authorization required'),
    '403': response('Origin, authorization or policy refused'), default: response('Host-defined error or conflict') };
}
function read(operationId, description, parameters) {
  return { operationId, description, ...(parameters ? { parameters } : {}), responses: responses(description) };
}
function post(operationId, description, schema) {
  return { ...read(operationId, description, mutationHeaders),
    requestBody: { required: true, content: json(schema) } };
}
function argumentSchema(spec) {
  if (spec.type === 'enum') return { type: 'string', enum: [...spec.values] };
  if (spec.type === 'string') return { type: 'string', minLength: spec.min, maxLength: spec.max,
    pattern: '^\\S(?:[\\s\\S]*\\S)?$' };
  throw new TypeError('Unsupported Host argument descriptor');
}
function typedSchema(a) {
  const args = closed(Object.fromEntries(Object.entries(a.args).map(([key, spec]) => [key, argumentSchema(spec)])));
  return closed({ actionId: { type: 'string', const: a.actionId }, args },
    Object.keys(a.args).length ? ['actionId', 'args'] : ['actionId']);
}
export function buildUniversalApi(discovery) {
  if (discovery?.schema !== 'vivim.control-discovery/1' || !Array.isArray(discovery.actions))
    throw new TypeError('Expected canonical Host discovery');
  const actions = discovery.actions;
  const typed = actions.map(typedSchema);
  const input = { oneOf: [closed({ text: { type: 'string', minLength: 1, maxLength: 1000 } }), ...typed] };
  return {
    openapi: '3.1.1',
    info: { title: 'VIVIM / ARBOR Universal API', version: '0.1.0',
      description: 'Local owner API derived from the existing Host action catalog. Readiness does not grant access. R0 plans may read; changes require exact owner-approved plans. This contract describes the text and typed subset; other specialized Host surfaces retain their existing contracts.' },
    servers: [{ url: '/' }],
    security: [{ ownerToken: [] }],
    components: { securitySchemes: { ownerToken: { type: 'http', scheme: 'bearer',
      description: 'Existing local Host owner capability, not a provider token.' } } },
    paths: {
      [BASE + '/openapi.json']: { get: read('vivimDescribeApi', 'Discover this owner-scoped API contract') },
      [BASE + '/catalog']: { get: read('vivimDiscoverCapabilities', 'Discover canonical Host capability readiness') },
      [BASE + '/interpret']: { post: post('vivimInterpret', 'Resolve text without performing a requested effect',
        closed({ text: { type: 'string', maxLength: 1000 } })) },
      [BASE + '/plan']: { post: post('vivimPlan', 'Plan typed or natural-language actions; authorized R0 reads may return results. Mutation previews are not execution.', input) },
      [BASE + '/execute']: { post: post('vivimApproveAndExecute', 'Owner approval of an exact plan; inspect existing receipt if outcome is uncertain. Never automatically retry.', closed({ planId, planDigest })) },
      [BASE + '/plans/{planId}']: { get: read('vivimInspectPlan', 'Inspect original plan and receipt without executing', [{ name: 'planId', in: 'path', required: true, schema: planId }]) }
    },
    'x-vivim': { authority: 'existing-host-dispatcher', catalogVersion: discovery.version,
      scope: 'typed-action-catalog-only', coverage: discovery.coverage,
      capabilities: actions.map(a => ({ id: a.actionId, title: a.title, category: a.category,
        risk: a.risk, readiness: a.readiness, executable: a.executable, available: a.available,
        liveAcceptance: a.liveAcceptance, reversible: a.reversible, args: typedSchema(a).properties.args,
        ...(a.precondition ? { precondition: a.precondition } : {}) })) }
  };
}
