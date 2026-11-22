// One explicit, draft-only handoff from the unified VIVIM composer to the
// EXISTING Studio-backed provider composer. This module has no network/effects.
const ALIASES = Object.freeze({
  chatgpt: 'chatgpt', gpt: 'chatgpt',
  claude: 'claude', gemini: 'gemini', qwen: 'qwen',
  deepseek: 'deepseek', zai: 'zai', 'z.ai': 'zai',
  kimi: 'kimi', minimax: 'minimax', grok: 'grok',
  lmarena: 'lmarena', 'duck-ai': 'duck-ai'
});
const LABELS = Object.freeze({
  chatgpt: 'ChatGPT', claude: 'Claude', gemini: 'Gemini', qwen: 'Qwen',
  deepseek: 'DeepSeek', zai: 'Z.ai', kimi: 'Kimi', minimax: 'MiniMax',
  grok: 'Grok', lmarena: 'LM Arena', 'duck-ai': 'Duck.ai'
});

// Deliberately only explicit commands, not ordinary questions mentioning an AI.
// The result can select a verified provider and stage text; it NEVER sends.
export function resolveProviderHandoff(input, projection) {
  if (typeof input !== 'string') return null;
  const text = input.trim();
  if (!text || text.length > 1000) return null;
  const match =
    /^(?:\/ai\s+|@)([a-z][a-z0-9._-]{1,30})(?:(?::\s*|\s+)([\s\S]*))?$/i.exec(text) ||
    /^(?:chat\s+with|talk\s+to|ask)\s+([a-z][a-z0-9._-]{1,30})(?::\s*([\s\S]*))?$/i.exec(text);
  if (!match) return null;
  const id = ALIASES[match[1].toLowerCase()];
  if (!id) return null;
  const verified = Array.isArray(projection) &&
    projection.some(p => p?.id === id && p.signedIn === true);
  return Object.freeze({
    id, label: LABELS[id], status: verified ? 'ready' : 'unverified',
    draft: (match[2] || '').trim(), sendsAutomatically: false
  });
}

// This gate is pure and has no effect authority. It is checked both when
// painting Send and immediately before the existing relay-chat queue call.
export function canSendVerifiedProvider({paired,direct,sessionApproved,target,providerId,projection,text,sending}) {
  return paired === true && direct === true && sessionApproved === true &&
    target === 'harness' && sending !== true &&
    typeof providerId === 'string' && typeof text === 'string' && !!text.trim() &&
    Array.isArray(projection) &&
    projection.some(p => p?.id === providerId && p?.signedIn === true);
}
