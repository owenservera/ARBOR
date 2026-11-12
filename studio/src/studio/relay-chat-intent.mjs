// Shared, pure interpretation of a phone relay-chat command. This is NOT a
// permission grant, provider send or runtime dispatcher. One definition of the
// prompt bytes is essential for journal digest attribution after a worker restart.
export const RELAY_CHAT_PROVIDERS = Object.freeze(['chatgpt','claude','qwen','zai']);
const PREFIX = /^@([a-z]+)(?::([\w.-]+))?(?:@([\w.-]+))?\s+([\s\S]+)$/;

export function parseRelayChatIntent(command) {
  if (!command || typeof command.text !== 'string' || !command.text.trim())
    throw Object.assign(new TypeError('Invalid relay-chat text'), {code:'RELAY_CHAT_TEXT_INVALID'});
  const match = PREFIX.exec(command.text);
  if (match && !RELAY_CHAT_PROVIDERS.includes(match[1]))
    throw Object.assign(new Error('Unsupported relay provider prefix'), {code:'RELAY_CHAT_TARGET_INVALID'});
  const prefix = match;
  if (command.target != null &&
      (typeof command.target !== 'object' || Array.isArray(command.target) ||
       !RELAY_CHAT_PROVIDERS.includes(command.target.provider)))
    throw Object.assign(new Error('Unsupported explicit relay provider'), {code:'RELAY_CHAT_TARGET_INVALID'});
  const target = command.target ?? null;
  // Explicit target and a conflicting textual provider are ambiguous. Never
  // infer that the owner authorized changing the destination.
  if (target && prefix && (
      prefix[1] !== target.provider ||
      (prefix[2] ?? null) !== (target.model ?? null) ||
      (prefix[3] ?? null) !== (target.effort ?? null)))
    throw Object.assign(new Error('Relay target disagrees with text prefix'), {code:'RELAY_CHAT_PROVIDER_CONFLICT'});
  const provider = target?.provider ?? prefix?.[1] ?? 'chatgpt';
  const model = target ? target.model ?? null : prefix?.[2] ?? null;
  const effort = target ? target.effort ?? null : prefix?.[3] ?? null;
  const prompt = prefix ? prefix[4] : command.text;
  if (!prompt.trim()) throw Object.assign(new TypeError('Empty relay prompt'), {code:'RELAY_CHAT_TEXT_INVALID'});
  return {provider, model, effort, prompt};
}
