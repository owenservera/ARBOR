// Core agent role types for fleets and swarms. Pure data + validation: no I/O.
// stepRole maps a role onto studio's STEP_ROLES (src/studio/orchestrator-patterns.mjs) where one fits;
// test/agents/roles.test.mjs checks the mapping against studio so drift is caught there, not at runtime.
// No role may ever merge: limits.mayMerge is always false and validateRole refuses anything else.
export const ACTIONS = Object.freeze(['plan', 'ask', 'write_code', 'review', 'run_tests', 'research', 'synthesize', 'record']);

const err = (code, message) => Object.assign(new Error(message), { code });
const MODEL_REF = /^([a-z][a-z0-9_-]*):([A-Za-z0-9][A-Za-z0-9._-]*)(?:@([^@\x00-\x1f\x7f]+))?$/;

// Optional effort is preserved for the model picker; the provider must be a fixed identity.
export function parseModelRef(spec) {
  const m = typeof spec === 'string' ? MODEL_REF.exec(spec.trim()) : null;
  const suffix = typeof spec === 'string' && spec.includes('@') ? spec.slice(spec.indexOf('@') + 1) : '';
  if (!m || /[\x00-\x1f\x7f]/.test(suffix) || (m[3] !== undefined && !m[3].trim())) throw err('MODEL_INVALID', `Model must look like provider:model or provider:model@effort (got ${JSON.stringify(spec)}).`);
  if (m[1] === 'auto') throw err('MODEL_INVALID', 'Model provider "auto" is not allowed here; name a provider.');
  return { provider: m[1], model: m[2], ...(m[3] !== undefined ? { effort: m[3].trim() } : {}) };
}

const strings = (v) => Array.isArray(v) && v.every((x) => typeof x === 'string' && x.length > 0);

export function validateRole(role) {
  const bad = (why) => { throw err('ROLE_INVALID', `Role ${role?.id ?? '?'}: ${why}`); };
  if (!role || typeof role !== 'object' || Array.isArray(role)) bad('must be an object');
  if (typeof role.id !== 'string' || !/^[a-z][a-z0-9-]*$/.test(role.id)) bad('id must be lowercase letters, digits or dashes');
  if (!strings(role.aliases)) bad('aliases must be an array of strings');
  if (typeof role.purpose !== 'string' || !role.purpose.trim()) bad('purpose required');
  const acts = role.allowedActions;
  if (!strings(acts) || !acts.length || acts.some((a) => !ACTIONS.includes(a)) || new Set(acts).size !== acts.length) bad('allowedActions must be a non-empty unique subset of ' + ACTIONS.join(', '));
  try { parseModelRef(role.defaultModel); } catch (e) { bad(e.message); }
  if (!strings(role.inputs) || !strings(role.outputs)) bad('inputs and outputs must be arrays of strings');
  const l = role.limits;
  if (!l || typeof l !== 'object') bad('limits required');
  if (!Number.isSafeInteger(l.maxSendsPerTask) || l.maxSendsPerTask < 1 || l.maxSendsPerTask > 50) bad('limits.maxSendsPerTask must be 1..50');
  if (typeof l.mayWriteFiles !== 'boolean') bad('limits.mayWriteFiles must be boolean');
  if (l.mayMerge !== false) bad('limits.mayMerge must be false (no agent has merge authority)');
  if (role.stepRole !== null && typeof role.stepRole !== 'string') bad('stepRole must be a string or null');
  return role;
}

const DEFS = [
  { id: 'planner', aliases: ['orchestrator', 'lead'], purpose: 'Breaks a task into steps and decides which agent does each one.',
    allowedActions: ['plan', 'ask'], defaultModel: 'chatgpt:gpt-6', inputs: ['task', 'fleet status'], outputs: ['plan'],
    limits: { maxSendsPerTask: 3, mayWriteFiles: false, mayMerge: false }, stepRole: 'agent' },
  { id: 'builder', aliases: ['coder', 'implementer'], purpose: 'Writes the code or content a plan step asks for.',
    allowedActions: ['write_code', 'ask'], defaultModel: 'claude:opus-5.5', inputs: ['plan step', 'context files'], outputs: ['patch', 'notes'],
    limits: { maxSendsPerTask: 6, mayWriteFiles: true, mayMerge: false }, stepRole: 'answer' },
  { id: 'reviewer', aliases: ['critic'], purpose: 'Finds concrete problems in a draft or patch; never rewrites it.',
    allowedActions: ['review', 'ask'], defaultModel: 'gemini:gemini-3-pro', inputs: ['draft or patch'], outputs: ['findings'],
    limits: { maxSendsPerTask: 3, mayWriteFiles: false, mayMerge: false }, stepRole: 'critique' },
  { id: 'verifier', aliases: ['tester', 'checker'], purpose: 'Runs or designs tests and reports pass/fail with evidence.',
    allowedActions: ['run_tests', 'review'], defaultModel: 'deepseek:deepseek-v3.2', inputs: ['patch', 'test command'], outputs: ['verdict', 'test report'],
    limits: { maxSendsPerTask: 3, mayWriteFiles: false, mayMerge: false }, stepRole: 'verify' },
  { id: 'researcher', aliases: ['analyst'], purpose: 'Gathers facts, prior art and references for a task.',
    allowedActions: ['research', 'ask'], defaultModel: 'gemini:gemini-3-pro', inputs: ['question'], outputs: ['findings', 'sources'],
    limits: { maxSendsPerTask: 4, mayWriteFiles: false, mayMerge: false }, stepRole: 'answer' },
  { id: 'synthesizer', aliases: ['judge'], purpose: 'Combines or judges several answers into one final answer.',
    allowedActions: ['synthesize', 'review'], defaultModel: 'claude:opus-5.5', inputs: ['answers'], outputs: ['final answer', 'verdict'],
    limits: { maxSendsPerTask: 2, mayWriteFiles: false, mayMerge: false }, stepRole: 'synthesize' },
  { id: 'performance-optimizer', aliases: ['perf', 'optimizer'], purpose: 'Measures and improves network, mobile bootstrap, context and host performance without bypassing safety gates.',
    allowedActions: ['plan', 'research', 'ask', 'write_code', 'run_tests', 'review', 'record'],
    defaultModel: 'chatgpt:gpt-6', inputs: ['traces', 'benchmarks', 'hot paths', 'constraints'],
    outputs: ['baseline', 'focused patch', 'performance receipt'],
    limits: { maxSendsPerTask: 3, mayWriteFiles: true, mayMerge: false }, stepRole: 'answer' },
  { id: 'scribe', aliases: ['memory', 'recorder'], purpose: 'Records decisions and outcomes as durable notes.',
    allowedActions: ['record'], defaultModel: 'deepseek:deepseek-v3.2', inputs: ['decisions', 'results'], outputs: ['notes'],
    limits: { maxSendsPerTask: 2, mayWriteFiles: true, mayMerge: false }, stepRole: null },
];

function deepFreeze(o) { for (const v of Object.values(o)) if (v && typeof v === 'object') deepFreeze(v); return Object.freeze(o); }

const names = new Set();
for (const r of DEFS) {
  validateRole(r);
  for (const n of [r.id, ...r.aliases]) { if (names.has(n)) throw err('ROLE_INVALID', `Duplicate role name or alias: ${n}`); names.add(n); }
}
export const ROLES = deepFreeze(Object.fromEntries(DEFS.map((r) => [r.id, r])));
export const ROLE_IDS = Object.freeze(Object.keys(ROLES));

export function getRole(idOrAlias) {
  if (typeof idOrAlias !== 'string') return null;
  const key = idOrAlias.trim().toLowerCase();
  if (Object.hasOwn(ROLES, key)) return ROLES[key];
  return Object.values(ROLES).find((r) => r.aliases.includes(key)) ?? null;
}
