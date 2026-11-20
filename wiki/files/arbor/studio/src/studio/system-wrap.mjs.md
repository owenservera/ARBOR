# File: studio/src/studio/system-wrap.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/studio/system-wrap.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 12410 B |
| Lines | 270 |
| Hash | bc6fb18ef0c5 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| MANIFEST_VERSION | const | 12 | yes | export const MANIFEST_VERSION = 1; |
| SUBSTRATES | const | 14 | yes | export const SUBSTRATES = [ |
| CHECKS | const | 81 | yes | export const CHECKS = { |
| reg | const | 86 | no | const reg = await loadRegistry(); |
| expected | const | 87 | no | const expected = FAMILIES.reduce((n, f) =&gt; n + (FAMILY_SIZES[f] ?? PER_FAMILY), 0); |
| reg | const | 95 | no | const reg = await loadRegistry(); |
| reg | const | 104 | no | const reg = await loadRegistry(); |
| prims | const | 105 | no | const prims = [...new Set(reg.atoms.map((a) =&gt; a.primitive))]; |
| missing | const | 106 | no | const missing = prims.filter((p) =&gt; typeof PRIMITIVE_HANDLERS[p] !== &#39;function&#39;); |
| reg | const | 115 | no | const reg = await loadRegistry(); |
| check | const | 116 | no | const check = validateRoles(reg.atoms); |
| reg | const | 125 | no | const reg = await loadRegistry(); |
| bad | const | 126 | no | const bad = reg.atoms.filter((a) =&gt; a.effect === &#39;provider-send&#39; &amp;&amp; roleOf(a) !== &#39;provider&#39;); |
| reg | const | 134 | no | const reg = await loadRegistry(); |
| bad | const | 135 | no | const bad = reg.atoms.filter((a) =&gt; (a.args ?? []).some((x) =&gt; /^(password\|token\|secret\|credential\|cookie\|apikey\|api_key)$/i.test(x.name))); |
| reg | const | 145 | no | const reg = await loadRegistry(); |
| unknown | const | 146 | no | const unknown = new Set(); |
| reg | const | 161 | no | const reg = await loadRegistry(); |
| thin | const | 162 | no | const thin = reg.atoms.filter((a) =&gt; stateVarsFor(a).length &lt; 3); |
| calls | variable | 170 | no | let calls = 0; |
| receipts | const | 171 | no | const receipts = new Map(); |
| store | const | 172 | no | const store = { |
| transport | const | 178 | no | const transport = { |
| channel | const | 182 | no | const channel = createChatChannel({ transport, store }); |
| input | const | 183 | no | const input = { scope: &#39;chatgpt.send&#39;, taskId: &#39;wrap&#39;, thread: &#39;new&#39;, prompt: &#39;p&#39;, requestId: &#39;wrap-1&#39; }; |
| calls | variable | 193 | no | let calls = 0; |
| store | const | 194 | no | const store = { async get() { return null; }, async put() {}, async isRevoked() { return false; }, async revoke() {} }; |
| transport | const | 195 | no | const transport = { async createThread() { return { threadId: &#39;t&#39; }; }, async send() { calls += 1; throw new Error(&#39;timeout&#39;); } }; |
| channel | const | 196 | no | const channel = createChatChannel({ transport, store }); |
| r | const | 205 | no | const r = selfCheck(); |
| mod | const | 212 | no | const mod = await import(&#39;./capability-index.mjs&#39;); |
| entries | const | 213 | no | const entries = mod.parseCapabilityDoc(await (await import(&#39;node:fs/promises&#39;)).readFile(&#39;C:/0-BlackBoxProject-0/repos_hq/docs/integration/CHANNEL-CAPABILITIES.md&#39;, &#39;utf8&#39;)); |
| frames | const | 214 | no | const frames = entries.map((e) =&gt; mod.parseCapability( mod.encodeCapability({ num: e.num, domain: e.domain, state: e.state }))); |
| lexicon | const | 215 | no | const lexicon = new Map(entries.map((e) =&gt; [e.num, e.text])); |
| rebuilt | const | 216 | no | const rebuilt = mod.renderCapabilityRows(frames, lexicon); |
| original | const | 217 | no | const original = entries.map((e) =&gt; `\| ${e.num} \| ${e.text} \| ${e.state} \|`).join(&#39;\\n&#39;); |
| parsed | const | 226 | no | const parsed = extractDriveJson(&#39;tab x\\nsent via enter\\n{&quot;ok&quot;:true,&quot;reply&quot;:&quot;hi&quot;}&#39;); |
| verifySystem | function | 237 | yes | export async function verifySystem({ only = null } = {}) { |
| ids | const | 238 | no | const ids = only ? Object.keys(CHECKS).filter((k) =&gt; only.includes(k)) : Object.keys(CHECKS); |
| checks | const | 239 | no | const checks = []; |
| r | const | 243 | no | const r = await def.run(); |
| failed | const | 249 | no | const failed = checks.filter((c) =&gt; !c.ok); |
| manifestSummary | function | 262 | yes | export function manifestSummary() { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./browser-atoms.mjs | dynamic | 85 | [studio/src/studio/browser-atoms.mjs](./browser-atoms.mjs.md) |
| ./browser-atoms.mjs | dynamic | 94 | [studio/src/studio/browser-atoms.mjs](./browser-atoms.mjs.md) |
| ./browser-atoms.mjs | dynamic | 102 | [studio/src/studio/browser-atoms.mjs](./browser-atoms.mjs.md) |
| ./atom-dispatch.mjs | dynamic | 103 | [studio/src/studio/atom-dispatch.mjs](./atom-dispatch.mjs.md) |
| ./browser-atoms.mjs | dynamic | 113 | [studio/src/studio/browser-atoms.mjs](./browser-atoms.mjs.md) |
| ./atom-roles.mjs | dynamic | 114 | [studio/src/studio/atom-roles.mjs](./atom-roles.mjs.md) |
| ./browser-atoms.mjs | dynamic | 123 | [studio/src/studio/browser-atoms.mjs](./browser-atoms.mjs.md) |
| ./atom-roles.mjs | dynamic | 124 | [studio/src/studio/atom-roles.mjs](./atom-roles.mjs.md) |
| ./browser-atoms.mjs | dynamic | 133 | [studio/src/studio/browser-atoms.mjs](./browser-atoms.mjs.md) |
| ./browser-atoms.mjs | dynamic | 142 | [studio/src/studio/browser-atoms.mjs](./browser-atoms.mjs.md) |
| ./state-bind.mjs | dynamic | 143 | [studio/src/studio/state-bind.mjs](./state-bind.mjs.md) |
| ./state-vars.mjs | dynamic | 144 | [studio/src/studio/state-vars.mjs](./state-vars.mjs.md) |
| ./browser-atoms.mjs | dynamic | 159 | [studio/src/studio/browser-atoms.mjs](./browser-atoms.mjs.md) |
| ./state-bind.mjs | dynamic | 160 | [studio/src/studio/state-bind.mjs](./state-bind.mjs.md) |
| ./chat-channel.mjs | dynamic | 169 | [studio/src/studio/chat-channel.mjs](./chat-channel.mjs.md) |
| ./chat-channel.mjs | dynamic | 192 | [studio/src/studio/chat-channel.mjs](./chat-channel.mjs.md) |
| ./message-index.mjs | dynamic | 204 | [studio/src/studio/message-index.mjs](./message-index.mjs.md) |
| ./capability-index.mjs | dynamic | 212 | [studio/src/studio/capability-index.mjs](./capability-index.mjs.md) |
| node:fs/promises | dynamic | 213 | external |
| ./drive-output.mjs | dynamic | 224 | [studio/src/studio/drive-output.mjs](./drive-output.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/bin/commands/wrap.mjs](../../bin/commands/wrap.mjs.md) | ../../src/studio/system-wrap.mjs |

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 2 | context | — | — | The wrap: one manifest of every subsystem, and one verifier that proves consistency. |
| 3 | owner | atlas | — | atlas |
| 4 | task | — | — | VC-30 |
| 5 | invariant | — | — | a subsystem that is not in the manifest does not exist to the system. |
| 6 | invariant | — | — | verifySystem never reports ok:true while a check could not run. |

## Excerpt

```javascript
/**
 * @hq:context The wrap: one manifest of every subsystem, and one verifier that proves consistency.
 * @hq:owner atlas
 * @hq:task VC-30
 * @hq:invariant a subsystem that is not in the manifest does not exist to the system.
 * @hq:invariant verifySystem never reports ok:true while a check could not run.
 */
// The whole node in one place: what exists, who owns it, what it promises, how to call it, and the
// checks that prove the promises still hold. Everything else in the tree is an implementation detail
// of one of these entries.

export const MANIFEST_VERSION = 1;

export const SUBSTRATES = [
  {
    id: 'atoms',
    label: 'Atomic browser capabilities',
    owner: 'atlas',
    entry: 'studio/src/studio/browser-atoms.mjs',
    cli: ['studio atoms status', 'studio atoms list', 'studio atoms show', 'studio atoms plan', 'studio atoms run'],
    provides: '2103 atomic capabilities from 22 families, each declaring primitive, effect and args',
    invariants: ['ATOM_COUNT', 'ATOM_UNIQUE', 'ATOM_PRIMITIVE_HANDLED'],
  },
  {
    id: 'roles',
    label: 'Manager roles',
    owner: 'atlas',
    entry: 'studio/src/studio/atom-roles.mjs',
    cli: ['studio atoms roles'],
    provides: 'four managers (browser, tab, account, provider) owning an exclusive partition',
    invariants: ['ROLE_EXCLUSIVE', 'SEND_ONLY_PROVIDER', 'NO_SECRET_ARGS'],
  },
  {
    id: 'state',
    label: 'Live state variables',
    owner: 'atlas',
    entry: 'studio/src/studio/state-vars.mjs',
    cli: ['studio state vars', 'studio state live', 'studio state coverage', 'studio state show'],
    provides: '34 variables across 6 scopes, at least 3 bound to every atom',
    invariants: ['STATE_VAR_KNOWN', 'STATE_MIN_THREE'],
  },
  {
    id: 'channel',
    label: 'Agent to ChatGPT channel',
    owner: 'atlas',
    entry: 'studio/src/studio/chat-channel.mjs',
    cli: ['studio chat ask', 'studio chat work', 'studio chat revoke', 'studio chat stats'],
    provides: 'replay-safe send with scopes, budget, revocation and receipts',
    invariants: ['CHANNEL_IDEMPOTENT', 'CHANNEL_NO_AUTO_RETRY'],
  },
  {
    id: 'encoding',
    label: 'Header/footer index encoding',
    owner: 'atlas',
    entry: 'studio/src/studio/message-index.mjs',
    cli: ['studio chat stats'],
    provides: 'self-referential, determinate frame language with its own vocabulary frames',
    invariants: ['ENCODING_SELFCHECK'],
  },
  {
    id: 'capabilities',
    label: 'Channel capability list',
    owner: 'channel-manager',
    entry: 'studio/src/studio/capability-index.mjs',
    cli: [],
    provides: '100-item list encoded as frames; state derived from receipts, never asserted',
    invariants: ['CAP_DETERMINISTIC'],
  },
  {
    id: 'transport',
    label: 'Browser transport',
    owner: 'browser-manager',
    entry: 'studio/bin/commands/chat.mjs',
    cli: ['studio drive', 'studio launch'],
    provides: 'the only path to a live page; drive-backed with attachment confirmation',
    invariants: ['TRANSPORT_JSON_EXTRACTED'],
  },
];

/** Every check the system can make about itself. Each is independently runnable and reportable. */
```

_First 80 of 271 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
