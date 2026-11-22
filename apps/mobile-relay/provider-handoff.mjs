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
  const record = Array.isArray(projection) ? projection.find(p => p?.id === id) : null;
  const signedIn = record?.signedIn === true;
  // A browser login alone is not a usable relay. Match the existing Send
  // admission rule and preserve the draft when the Host worker is offline.
  const queueConsumerReady = signedIn && record?.queueConsumerReady === true;
  return Object.freeze({
    id, label: LABELS[id],
    status: queueConsumerReady ? 'ready' : signedIn ? 'relay-offline' : 'unverified',
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
    projection.some(p => p?.id === providerId && p?.signedIn === true &&
      p?.queueConsumerReady === true);
}

const PRIMARY_CONNECTIONS=Object.freeze(['chatgpt','claude','gemini','qwen','zai','deepseek']);
// A known account may be selected for a LOCAL DRAFT before login. This is never a send.
export function listProviderConnections(projection) {
  const records=Array.isArray(projection)?projection:[];
  return PRIMARY_CONNECTIONS.map(id=>{
    const source=records.find(p=>p?.id===id) ?? null;
    const signedIn=source?.signedIn===true;
    const queueConsumerReady=signedIn&&source?.queueConsumerReady===true;
    return Object.freeze({...source,id,label:LABELS[id],signedIn,queueConsumerReady,
      connectionState:queueConsumerReady?'ready':signedIn?'relay-offline':'unverified'});
  });
}
export function canRetargetProviderDraft(conversation,hasHistory=false) {
  return !!conversation && conversation.sent!==true && hasHistory!==true;
}
