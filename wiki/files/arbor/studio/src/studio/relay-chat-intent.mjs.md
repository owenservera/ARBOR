# File: studio/src/studio/relay-chat-intent.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/studio/relay-chat-intent.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 2070 B |
| Lines | 32 |
| Hash | 13008e97814f |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| RELAY_CHAT_PROVIDERS | const | 4 | yes | export const RELAY_CHAT_PROVIDERS = Object.freeze([&#39;chatgpt&#39;,&#39;claude&#39;,&#39;qwen&#39;,&#39;zai&#39;]); |
| PREFIX | const | 5 | no | const PREFIX = /^@([a-z]+)(?::([\\w.-]+))?(?:@([\\w.-]+))?\\s+([\\s\\S]+)$/; |
| parseRelayChatIntent | function | 7 | yes | export function parseRelayChatIntent(command) { |
| prefix | const | 13 | no | const prefix = match; |
| target | const | 18 | no | const target = command.target ?? null; |
| provider | const | 26 | no | const provider = target?.provider ?? prefix?.[1] ?? &#39;chatgpt&#39;; |
| model | const | 27 | no | const model = target ? target.model ?? null : prefix?.[2] ?? null; |
| effort | const | 28 | no | const effort = target ? target.effort ?? null : prefix?.[3] ?? null; |
| prompt | const | 29 | no | const prompt = prefix ? prefix[4] : command.text; |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [studio/bin/lib/relay-chat-studio.mjs](../../bin/lib/relay-chat-studio.mjs.md) | ../../src/studio/relay-chat-intent.mjs |
| [studio/bin/relay-chat-mvp.mjs](../../bin/relay-chat-mvp.mjs.md) | ../src/studio/relay-chat-intent.mjs |
| [studio/src/studio/relay-journal-correlation.mjs](./relay-journal-correlation.mjs.md) | ./relay-chat-intent.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
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
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
