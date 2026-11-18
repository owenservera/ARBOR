// Build canvas request flow, pure and browser-safe. The owner's words become a bounded design prompt;
// the settled reply is validated by the same compiler the Host uses before anything is previewed.
// Nothing here sends, applies or trusts a reply: a proposal is a draft until the owner taps Activate.
import { composeDesignContext } from './generative-ui/design-composer.mjs';
import { compileUiProposal } from './generative-ui/compiler.mjs';
import { createSurface, PROPOSAL_SCHEMA, validateSurface } from './generative-ui/catalog.mjs';
import { committedHostSurface } from './generative-ui/host-revision-guard.mjs';
import { createVecCompiler } from './vec/compiler.mjs';
import { compileVecUiRequest } from './vec/ui-adapter.mjs';
import { getUiComponent, resolveUiSourceIdentity } from './vec/ui-taxonomy/registry.mjs';

// Canonical first-party VEC engine, not a rewritten client-side compiler.
// Node resolves its source directly; the paired browser uses Host's fixed asset map.
const { compileUiConfiguration } = await import(
  typeof process !== 'undefined' && process.versions?.node
    ? '../../packages/vec-ui-engines/src/compiler.mjs'
    : './vec-engines/compiler.mjs'
).catch(() => ({ compileUiConfiguration: null }));

export const SUGGESTIONS = Object.freeze(['Set up everything for me', 'I need help researching', 'Make a simple AI workspace']);
export const BUILD_COMPONENTS = Object.freeze(['stack', 'grid', 'text', 'card', 'button', 'collection', 'timeline', 'chart']);
export const MAX_REQUEST = 400;

export function blankSurface() { return createSurface({ surfaceId: 'my-space' }); }

// Use only an authenticated caller's actual bootstrap projection. A blank
// document is a draft baseline solely when Host explicitly reports no revision.
export function buildSurfaceFromBootstrap(bootstrap) {
  if(!bootstrap||bootstrap.schema!=='vivim.bootstrap-phone/1'||
     bootstrap.state!=='ready'||!Object.hasOwn(bootstrap,'uiRevision'))return null;
  if(bootstrap.uiRevision===null)return blankSurface();
  const committed=committedHostSurface(bootstrap.uiRevision);
  if(!committed)return null;
  try{return validateSurface(committed,{refs:new Set()});}catch{return null;}
}

// Deterministic first, same canonical UI proposal and Host approval as the model path.
// The compiler is an inert preview boundary, not a new action dispatcher or publisher.
// Reviewed bindings to existing theme fields. These are preview mappings,
 // not a claim that every declared engine is installed or authorized.
export const THEME_BINDINGS = Object.freeze({
  background: Object.freeze({capabilityId:'vivim.ui-engine.color.background@1',field:'background',type:'color'}),
  accent: Object.freeze({capabilityId:'vivim.ui-engine.color.accent@1',field:'accent',type:'color'}),
  secondary: Object.freeze({capabilityId:'vivim.ui-engine.color.surface@1',field:'secondary',type:'color'}),
  'font-size': Object.freeze({capabilityId:'vivim.ui-engine.typography.size@1',field:'fontSizePx',type:'length',min:13,max:19}),
  radius: Object.freeze({capabilityId:'vivim.ui-engine.corners.radius@1',field:'radiusPx',type:'length',min:6,max:24}),
  'spacing-scale': Object.freeze({capabilityId:'vivim.ui-engine.spacing.scale@1',field:'spacingScale',type:'number',min:0.85,max:1.2})
});
const THEME_START = /^set my (?:app|shell)\b/i;
const THEME_PATTERN = /^set my (app|shell) ([a-z-]+) to (.+)$/i;
const COLOR = /^#[0-9a-fA-F]{6}$/;

// Reviewed VEC capabilities map to the existing Host set-theme operation.
// A descriptive engine capability grants neither execution nor write authority.
export function compileVecThemeRequest({ text, surface } = {}) {
  const refuse = code => ({ outcome: 'refused', code });
  const matched = THEME_PATTERN.exec(typeof text === 'string' ? text.trim().replace(/\s+/g, ' ') : '');
  if (!matched) return refuse('UNSUPPORTED_THEME_REQUEST');
  const scope=matched[1].toLowerCase()==='shell'?'shell':'build';
  const property = matched[2].toLowerCase();
  const binding=Object.hasOwn(THEME_BINDINGS,property)?THEME_BINDINGS[property]:null;
  if(!binding)return refuse('UNSUPPORTED_THEME_PROPERTY');
  const {capabilityId,field,type,min,max}=binding;
  const raw=matched[3].trim();
  let value=raw;
  if(type==='color'){
    if(!COLOR.test(raw))return refuse('INVALID_THEME_COLOR');
  }else if(type==='length'){
    if(!/^\d{1,2}px$/.test(raw))return refuse('INVALID_THEME_LENGTH');
    const number=Number(raw.slice(0,-2));
    if(number<min||number>max)return refuse('INVALID_THEME_LENGTH');
    value={value:number,unit:'px'};
  }else{
    if(!/^\d(?:\.\d{1,3})?$/.test(raw))return refuse('INVALID_THEME_SCALE');
    value=Number(raw);if(value<min||value>max)return refuse('INVALID_THEME_SCALE');
  }
  if (typeof compileUiConfiguration !== 'function') return refuse('VEC_ENGINE_UNAVAILABLE');
  let current;
  try { current = validateSurface(surface, { refs: new Set() }); }
  catch { return refuse('INVALID_OR_UNAVAILABLE_SURFACE'); }
  const source = resolveUiSourceIdentity({ schema: 'vivim.ui-surface/1',
    nativeType: current.tree.type });
  if (current.tree.id !== 'root' || source.outcome !== 'mapped' ||
      source.source.status !== 'source-closed' ||
      getUiComponent(source.component.id) !== source.component)
    return refuse('UI_COMPONENT_ADAPTER_NOT_INSTALLED');
  // Classify the actual root instance by the reviewed canonical descriptor.
  const typed = compileUiConfiguration({
    component: { ...source.component, id: current.tree.id },
    sourceSchema: 'vivim.ui-surface/1', baseRevision: current.revision,
    changes: [{ capabilityId, value }]
  });
  if (typed.outcome !== 'candidate' || typed.changes?.length !== 1 ||
      typed.changes[0].capabilityId !== capabilityId)
    return refuse(typed.code ?? 'VEC_CONFIGURATION_REFUSED');
  const checked=typed.changes[0].value;
  if(type==='color'&&!COLOR.test(checked))return refuse('INVALID_THEME_COLOR');
  if(type==='length'&&(checked?.unit!=='px'||!Number.isInteger(checked.value)||checked.value<min||checked.value>max))
    return refuse('INVALID_THEME_LENGTH');
  if(type==='number'&&(!Number.isFinite(checked)||checked<min||checked>max))return refuse('INVALID_THEME_SCALE');
  const setting=type==='length'?checked.value:checked;
  const display=type==='length'?setting+'px':String(setting);
  const proposal = {
    schema: PROPOSAL_SCHEMA, surfaceId: current.surfaceId, baseRevision: current.revision,
    operations: [{ opId: 'vec.theme.1', type: 'set-theme',
      theme: scope==='shell'?{...current.theme,shell:{...current.theme.shell,[field]:setting}}:{ ...current.theme, [field]: setting } }],
    explanation: 'Set '+(scope==='shell'?'all application tabs (shell)':'Build app')+' ' + property + ' to ' + display + '.',
    assumptions: [], unknowns: []
  };
  try {
    const preview = compileUiProposal({ proposal, surface: current, approvedRefs: [], audience: 'phone' });
    return { outcome: 'candidate', code: 'VEC_THEME_PREVIEW', proposal, preview,
      summary: { explanation: preview.notes.explanation, changes: preview.operations,
        unknowns: preview.notes.unknowns },
      detail: { capabilityId, property, scope, value: setting, valueType:type,
        baseRevision: current.revision, targetRevision: current.revision + 1 } };
  } catch { return refuse('VEC_THEME_PREVIEW_REJECTED'); }
}

// Discovery uses the actual current revision and the same compiler, not a
// separate grammar or an assertion of effect authority.
export function themeDraftCandidates(surface){
  if(!surface)return [];
  return Object.entries(THEME_BINDINGS).flatMap(([property,binding])=>{
    const value=surface.theme?.[binding.field];
    const raw=binding.type==='length'?value+'px':String(value);
    const text='set my app '+property+' to '+raw;
    const shellValue=surface.theme?.shell?.[binding.field]??value;
    const shellText='set my shell '+property+' to '+(binding.type==='length'?shellValue+'px':String(shellValue));
    return [text,shellText].filter(draft=>compileVecThemeRequest({text:draft,surface}).outcome==='candidate');
  });
}

const vec = createVecCompiler({ adapters: {
  ui: args => THEME_START.test(String(args.text ?? '').trim())
    ? compileVecThemeRequest(args) : compileVecUiRequest(args)
} });
export function resolveBuildRequest({ request, surface = blankSurface() } = {}) {
  return vec.compile({ domain: 'ui', text: request, context: { surface } });
}

export function buildDesignPrompt({ request, surface = blankSurface(), taskId }) {
  const text = String(request ?? '').trim().replace(/\s+/g, ' ');
  if (!text) throw new Error('Say what you would like to create.');
  if (text.length > MAX_REQUEST) throw new Error(`Keep it under ${MAX_REQUEST} characters.`);
  const context = composeDesignContext({
    surface, baseRevision: surface.revision, userRequest: text, deviceClass: 'phone',
    allowedComponents: BUILD_COMPONENTS, constraints: ['Presentation only', 'Keep Talk untouched', 'No code, links or HTML'],
    sessionId: 'build-' + (taskId ?? Date.now().toString(36)), taskId: taskId ?? 'task-' + Date.now().toString(36)
  });
  return [
    'You are the design assistant inside my private VIVIM app. I describe what I want in plain words. Answer with ONE JSON object that changes my app screen.',
    'Rules:',
    '- Reply with exactly one JSON object and nothing else: no Markdown, no code fence, no commentary.',
    `- Keys: schema ("${PROPOSAL_SCHEMA}"), surfaceId ("${surface.surfaceId}"), baseRevision (${surface.revision}), operations, explanation (one plain sentence), assumptions (array), unknowns (array).`,
    '- operations: 1 to 12 items. Insert: {"opId","type":"insert","parentId":"root","component":{"id","type","props"}}. Change: {"opId","type":"replace-props","componentId","props"}. Remove: {"opId","type":"remove","componentId"}.',
    '- Component types: stack{direction,gap}, grid{columns 1-4,gap}, text{value,variant body|heading|muted}, card{title,description}, button{label,intent:"preview-only"}, collection{title,items[{label,detail}]}, timeline{title,items[{label,detail}]}, chart{title,items[{label,value}]}. Gaps are sm, md or lg. At most 16 items.',
    '- Ids start with a letter and use letters, digits, dot, dash or colon. Text is plain: no links, no HTML. Titles under 80 characters.',
    '- Do not invent facts about me. Anything you would need to know goes in "unknowns".',
    'My design context:',
    JSON.stringify(context)
  ].join('\n');
}

// First balanced JSON object in a reply, string-aware, so prose or a code fence around it is tolerated.
export function extractObject(text) {
  const source = String(text ?? '');
  for (let start = source.indexOf('{'); start !== -1; start = source.indexOf('{', start + 1)) {
    let depth = 0, inString = false, escaped = false;
    for (let i = start; i < source.length; i++) {
      const ch = source[i];
      if (inString) { if (escaped) escaped = false; else if (ch === '\\') escaped = true; else if (ch === '"') inString = false; continue; }
      if (ch === '"') inString = true; else if (ch === '{') depth++; else if (ch === '}' && --depth === 0) {
        try { const value = JSON.parse(source.slice(start, i + 1)); if (value && typeof value === 'object' && !Array.isArray(value)) return value; } catch { /* try the next opening brace */ }
        break;
      }
    }
  }
  return null;
}

export function previewReply({ reply, surface = blankSurface() }) {
  const proposal = extractObject(reply);
  if (!proposal) return { ok: false, reason: 'The answer did not contain a design VIVIM could read. Nothing was changed.' };
  try {
    const preview = compileUiProposal({ proposal, surface, approvedRefs: [], audience: 'phone' });
    return { ok: true, proposal, preview, summary: { explanation: preview.notes.explanation, changes: preview.operations, unknowns: preview.notes.unknowns } };
  } catch (error) {
    const stale = /stale|revision/i.test(String(error?.message));
    return { ok: false, reason: stale ? 'Your app changed while the AI was answering, so this suggestion is out of date. Ask again.' : 'VIVIM could not safely use that suggestion. Nothing was changed.' };
  }
}

// Provider and Studio failures in the owner's words. The code is kept for support only.
export function failureText(result) {
  const code = /^[A-Z][A-Z0-9_]{2,60}/.exec(String(result ?? ''))?.[0] ?? null;
  const known = {
    DRAFT_PRESENT: 'ChatGPT has an unsent draft open on your PC. Clear it there, then ask again. Nothing was sent.',
    UNSUPPORTED_STUDIO_TARGET: 'Building from your phone works with ChatGPT today. Choose ChatGPT as your main AI on your PC.',
    STUDIO_CONVERSATION_BLOCKED: 'Your AI could not take this request right now. Nothing was sent.',
    STUDIO_PRIOR_OUTCOME_UNCERTAIN: 'VIVIM is not sure the last message went through, so it will not send another yet. Check your PC.'
  };
  return (code && known[code]) || 'That did not go through. Your app is unchanged.';
}
