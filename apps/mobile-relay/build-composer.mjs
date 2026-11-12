// Build canvas request flow, pure and browser-safe. The owner's words become a bounded design prompt;
// the settled reply is validated by the same compiler the Host uses before anything is previewed.
// Nothing here sends, applies or trusts a reply: a proposal is a draft until the owner taps Activate.
import { composeDesignContext } from './generative-ui/design-composer.mjs';
import { compileUiProposal } from './generative-ui/compiler.mjs';
import { createSurface, PROPOSAL_SCHEMA } from './generative-ui/catalog.mjs';

export const SUGGESTIONS = Object.freeze(['Set up everything for me', 'I need help researching', 'Make a simple AI workspace']);
export const BUILD_COMPONENTS = Object.freeze(['stack', 'grid', 'text', 'card', 'button', 'collection', 'timeline', 'chart']);
export const MAX_REQUEST = 400;

export function blankSurface() { return createSurface({ surfaceId: 'my-space' }); }

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
