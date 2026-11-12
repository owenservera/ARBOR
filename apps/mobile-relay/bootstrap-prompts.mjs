// Pinned bootstrap prompt templates (F02 visual signature, F01 recognition) and the tolerant
// JSON extractor for settled provider replies. Shared by the Host onboarding scheduler and the
// dev harness so the exact owner-approved text exists in exactly one place.
import { F01_SCHEMA } from './bootstrap-f01.mjs';

// Exact terse prompt packets from docs/design/BOOTSTRAP-V2-FAST-PROMPTS.md (F02)
// and the F01 template (generationId injected locally). No dossier, no files.
export const F02_PROMPT = [
  'You are helping initialize my private local-first VIVIM app. Use only what you genuinely recall about my aesthetic tastes from prior conversations, distinguishing explicit instructions from inference and task-specific design requests. Do not fabricate prior chats, favorite colors, or design preferences. If evidence is weak, set `provisional: true`; you may still suggest a polished theme as a **design proposal**, not a personal fact.',
  'Return **exactly one compact JSON object**, with keys `schema`, `pass`, `provisional`, `visual`, `preferences`, `dislikes`, `unknowns`. Use `schema:"vivim.bootstrap-f02/2"` and `pass:"F02"`. No Markdown.',
  '`visual` MUST contain exactly: `background`, `secondary`, `accent` (all hex colors `#RRGGBB`); `appearance` (`dark|light`); `texture` (`aurora|gradient|linen|geometry|solid`); `mood` (`serene|focused|warm|vibrant|cinematic|playful|minimal|understated`); `fontFamily` (`system|humanist|geometric|editorial|mono`); integer `fontSizePx` (13-19), integer `headingSizePx` (20-38), integer `radiusPx` (6-24), numeric `spacingScale` (0.85-1.2); `density` (`compact|comfortable|spacious`); `motion` (`still|slow`).',
  '`preferences` and `dislikes` are arrays of up to five records `{trait,basis,confidence,scope}`. Basis is `explicit|recurring|inferred`; confidence is a number between 0 and 1; scope is `global|work|personal|unknown`. `unknowns` is an array of up to six short strings. If no reliable memory exists, arrays may be empty and `provisional` must be true.',
  'Suggest a legible contrast-aware background and a restrained but distinct accent, without claiming a proposed hex color is something the user explicitly likes unless supported. Keep it brief.',
].join('\n\n');

export const F01_PROMPT = generationId => [
  'I am creating my private local-first personal VIVIM app. Based only on what you actually and reliably know about me through this ChatGPT experience, give a small useful starting profile. This is not a request to enumerate my entire ChatGPT chat history. Separate what I have explicitly stated from what you infer. Do not guess my real name, location, employment, family, private medical details, protected traits or credentials. If something is unknown or context-dependent, say so. Distinguish current work from historical projects, and stated hobbies from one-off questions.',
  `Return exactly one JSON object, no Markdown. \`schema\` must be \`"${F01_SCHEMA}"\`, \`generationId\` must equal \`"${generationId}"\`, \`passId\` must equal \`"F01"\`.`,
  'Include `communication` with optional `language`, `tone` and `responseStyle` if grounded. Include `focus` as zero to three bounded objects with `label`, `kind` (`project|interest|goal|practice`), `freshness` (`current|historical|unknown`), `basis` (`explicitly_stated|provider_memory_report|tentative_inference`), and a short `explanation`. Include `unknowns` as up to five high-value areas that were not reliably known. Include `suggestedCards` as zero to three safe titles linked to grounded focus items. Never claim a feature is activated or an AI account is ready based on memory.',
].join('\n\n');

const MERGED = [
  ['\u2018', "'"], ['\u2019', "'"], ['\u201c', '"'], ['\u201d', '"'], ['\u00a0', ' '],
];

// The prompt demands one compact JSON object, but models still wrap it in code
// fences or prose. Extract the first balanced object; give up on ambiguity.
export function extractJson(replyText) {
  const text = String(replyText ?? '');
  if (!text.trim()) return null;
  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  if (first === -1 || last <= first) return null;
  const body = text.slice(first, last + 1);
  const cleaned = MERGED.reduce((acc, [from, to]) => acc.split(from).join(to), body);
  try {
    const parsed = JSON.parse(cleaned);
    return (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) ? parsed : null;
  } catch {
    // Fenced/prettified reply: try to drop one outer code fence.
    const fence = text.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/i);
    if (fence) {
      try {
        const parsed = JSON.parse(fence[1]);
        return (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) ? parsed : null;
      } catch { /* leave null */ }
    }
    return null;
  }
}

export const PASS_TITLES = Object.freeze({
  F02: 'Your look and feel',
  F01: 'A first picture of you'
});
export function promptForPass(pass, generationId) {
  if (pass === 'F02') return F02_PROMPT;
  if (pass === 'F01') return F01_PROMPT(generationId);
  throw new Error('No pinned prompt for pass ' + pass);
}
