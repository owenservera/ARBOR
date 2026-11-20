# File: hq/lib/comment-wiki-bridge.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/lib/comment-wiki-bridge.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 12729 B |
| Lines | 194 |
| Hash | 8b6d5882110f |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| COMMENT_PROGRAM_SCHEMA | const | 12 | yes | export const COMMENT_PROGRAM_SCHEMA = &#39;hq.comment-program/0.1&#39;; |
| COMMAND_INTENT_SCHEMA | const | 13 | yes | export const COMMAND_INTENT_SCHEMA = &#39;vivim.command-intent/0.1&#39;; |
| EVENT_TYPES | const | 14 | no | const EVENT_TYPES = new Set([&#39;click&#39;, &#39;submit&#39;, &#39;change&#39;]); |
| MAX_DOCUMENT_BYTES | const | 15 | no | const MAX_DOCUMENT_BYTES = 262144; |
| SAFE_KEYS | const | 16 | no | const SAFE_KEYS = new Set([&#39;schema&#39;, &#39;compilerVersion&#39;, &#39;sourceMap&#39;, &#39;config&#39;, &#39;bindings&#39;, &#39;diagnostics&#39;]); |
| SECRET_SEGMENTS | const | 17 | no | const SECRET_SEGMENTS = /^(?:\\.env.*\|.*\\.env\|.*\\.(?:pem\|p12\|keystore)\|cookies\|login data\|session\\.json\|storage-state\\.json\|release-profile\\.json)$/i; |
| BANNED_KEYS | const | 18 | no | const BANNED_KEYS = /^(?:__proto__\|prototype\|constructor\|command\|exec\|shell\|script\|eval\|spawn\|token\|secret\|password\|provider\|sudo\|grant\|permissions)$/i; |
| UNSAFE_VALUE | const | 19 | no | const UNSAFE_VALUE = /(?:https?:\\/\\/\|file:\\/\\/\|\\$\\{\|\\b(?:eval\|exec\|shell\|sudo\|spawn\|publish\|privilege)\\b)/i; |
| cmp | function | 20 | no | const cmp = (a, b) =&gt; a &lt; b ? -1 : a &gt; b ? 1 : 0; |
| obj | function | 21 | no | const obj = (value) =&gt; value !== null &amp;&amp; typeof value === &#39;object&#39; &amp;&amp; !Array.isArray(value) &amp;&amp; (Object.getPrototypeOf(value) === Object.prototype \|\| Object.getPrototypeOf(value) === null); |
| string | function | 22 | no | const string = (value) =&gt; typeof value === &#39;string&#39; &amp;&amp; value.trim().length &gt; 0; |
| posInt | function | 23 | no | const posInt = (value) =&gt; Number.isSafeInteger(value) &amp;&amp; value &gt; 0; |
| error | function | 24 | no | const error = (errors, code, path) =&gt; errors.push({ code, path }); |
| canonical | function | 25 | no | function canonical(value) { |
| digest | function | 30 | no | function digest(value) { return createHash(&#39;sha256&#39;).update(JSON.stringify(canonical(value))).digest(&#39;hex&#39;); } |
| safePath | function | 31 | no | function safePath(path) { |
| safeData | function | 36 | no | function safeData(value, depth = 0) { |
| readInput | function | 46 | no | function readInput(input, errors) { |
| lookupAction | function | 53 | no | function lookupAction(binding, options) { |
| row | const | 54 | no | const row = options.lookupSemantic |
| plainId | const | 58 | no | const plainId = binding.actionId.slice(0, binding.actionId.lastIndexOf(&#39;@&#39;)); |
| action | const | 59 | no | const action = Array.isArray(options.actions) ? options.actions.find((a) =&gt; a?.id === plainId) : null; |
| validateCommentProgram | function | 67 | yes | export function validateCommentProgram(input, options = {}) { |
| errors | const | 68 | no | const errors = []; |
| m | const | 69 | no | const m = readInput(input, errors); |
| sm | const | 74 | no | const sm = m.sourceMap; |
| configValidation | const | 78 | no | const configValidation = validateProgramConfig(m.config); |
| ids | const | 86 | no | const ids = new Set(); |
| b | const | 88 | no | const b = m.bindings[i]; const path = `bindings[${i}]`; |
| key | const | 99 | no | const key = `${b.id}\\0${b.event}`; |
| previewCommentProgram | function | 110 | yes | export function previewCommentProgram(db, input, options = {}) { |
| checked | const | 111 | no | const checked = validateCommentProgram(input, { ...options, db }); |
| wiki | const | 114 | no | const wiki = previewProgram(db, m.config); |
| active | const | 115 | no | const active = getActiveProgram(db, m.config.id); |
| activateCommentProgram | function | 124 | yes | export function activateCommentProgram(db, input, options = {}) { |
| preview | const | 126 | no | const preview = previewCommentProgram(db, input, options); |
| receipt | const | 132 | no | const receipt = { schema: &#39;hq.comment-wiki-receipt/0.1&#39;, manifestDigest: preview.manifestDigest, |
| rollbackCommentProgram | function | 139 | yes | export function rollbackCommentProgram(db, { id, toVersion, ownerConfirmed, expectedRevision } = {}) { |
| active | const | 141 | no | const active = getActiveProgram(db, id); |
| target | const | 143 | no | const target = listProgramVersions(db, { id, limit: 1000 }).find((x) =&gt; x.version === toVersion); |
| activeBindings | function | 148 | no | function activeBindings(db, id) { |
| active | const | 149 | no | const active = getActiveProgram(db, id); |
| intent | function | 153 | no | function intent(binding, action, provenance, context) { |
| denied | function | 161 | no | const denied = (reason) =&gt; ({ schema: COMMAND_INTENT_SCHEMA, outcome: &#39;refused&#39;, refusal: { reason } }); |
| resolveWikiGesture | function | 164 | yes | export function resolveWikiGesture(db, { programId, bindingId, event } = {}, options = {}) { |
| bindings | const | 165 | no | const bindings = activeBindings(db, programId); |
| binding | const | 167 | no | const binding = bindings.find((b) =&gt; b.id === bindingId &amp;&amp; b.event === event); |
| action | const | 169 | no | const action = lookupAction(binding, { ...options, db }); |
| resolveWikiNaturalLanguage | function | 175 | yes | export function resolveWikiNaturalLanguage(db, { programId, text } = {}, options = {}) { |
| bindings | const | 176 | no | const bindings = activeBindings(db, programId); |
| registered | const | 182 | no | const registered = bindings.map((b) =&gt; ({ binding: b, action: lookupAction(b, { ...options, db }) })) |
| unique | const | 184 | no | const unique = new Map(registered.map(({ action }) =&gt; [action.id, action])); |
| routed | const | 185 | no | const routed = route([...unique.values()], text, { limit: unique.size \|\| 1 }); |
| top | const | 187 | no | const top = routed.matches[0]; |
| candidates | const | 190 | no | const candidates = registered.filter(({ action }) =&gt; action.id === top.action.id); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 3 | external |
| ./annotation-v2.mjs | import | 4 | [hq/lib/annotation-v2.mjs](./annotation-v2.mjs.md) |
| ./semantic-registry.mjs | import | 5 | [hq/lib/semantic-registry.mjs](./semantic-registry.mjs.md) |
| ./action-router.mjs | import | 6 | [hq/lib/action-router.mjs](./action-router.mjs.md) |
| ./wiki-program.mjs | import | 7 | [hq/lib/wiki-program.mjs](./wiki-program.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [hq/lib/wiki-runtime/rust-comment-adapter.mjs](./wiki-runtime/rust-comment-adapter.mjs.md) | ../comment-wiki-bridge.mjs |
| [hq/test/comment-program-integration.test.mjs](../test/comment-program-integration.test.mjs.md) | ../lib/comment-wiki-bridge.mjs |
| [hq/test/comment-wiki-bridge.test.mjs](../test/comment-wiki-bridge.test.mjs.md) | ../lib/comment-wiki-bridge.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Sprint 02 / Lane 3: pure, fail-closed Rust comment-program -> HQ wiki bridge.
// This is not an effect dispatcher. Only the existing Host/Studio action owner may execute.
import { createHash } from 'node:crypto';
import { isVersionedId } from './annotation-v2.mjs';
import { getSemanticId } from './semantic-registry.mjs';
import { route } from './action-router.mjs';
import {
  validateProgramConfig, previewProgram, activateProgram, rollbackProgram,
  getActiveProgram, listProgramVersions,
} from './wiki-program.mjs';

export const COMMENT_PROGRAM_SCHEMA = 'hq.comment-program/0.1';
export const COMMAND_INTENT_SCHEMA = 'vivim.command-intent/0.1';
const EVENT_TYPES = new Set(['click', 'submit', 'change']);
const MAX_DOCUMENT_BYTES = 262144;
const SAFE_KEYS = new Set(['schema', 'compilerVersion', 'sourceMap', 'config', 'bindings', 'diagnostics']);
const SECRET_SEGMENTS = /^(?:\.env.*|.*\.env|.*\.(?:pem|p12|keystore)|cookies|login data|session\.json|storage-state\.json|release-profile\.json)$/i;
const BANNED_KEYS = /^(?:__proto__|prototype|constructor|command|exec|shell|script|eval|spawn|token|secret|password|provider|sudo|grant|permissions)$/i;
const UNSAFE_VALUE = /(?:https?:\/\/|file:\/\/|\$\{|\b(?:eval|exec|shell|sudo|spawn|publish|privilege)\b)/i;
const cmp = (a, b) => a < b ? -1 : a > b ? 1 : 0;
const obj = (value) => value !== null && typeof value === 'object' && !Array.isArray(value) && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
const string = (value) => typeof value === 'string' && value.trim().length > 0;
const posInt = (value) => Number.isSafeInteger(value) && value > 0;
const error = (errors, code, path) => errors.push({ code, path });
function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (obj(value)) return Object.fromEntries(Object.keys(value).sort(cmp).map((k) => [k, canonical(value[k])]));
  return value;
}
function digest(value) { return createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex'); }
function safePath(path) {
  return string(path) && path.length <= 512 && !path.includes('\\') && !path.startsWith('/')
    && !/^[a-z]:/i.test(path) && !path.includes('\0') && !path.includes('//')
    && path.split('/').every((p) => p !== '' && p !== '.' && p !== '..' && !SECRET_SEGMENTS.test(p));
}
function safeData(value, depth = 0) {
  if (depth > 8) return false;
  if (value === null || typeof value === 'boolean') return true;
  if (typeof value === 'number') return Number.isFinite(value);
  if (typeof value === 'string') return value.length <= 1024 && !UNSAFE_VALUE.test(value);
  if (Array.isArray(value)) return value.length <= 32 && value.every((v) => safeData(v, depth + 1));
  if (obj(value)) return Object.keys(value).length <= 32 && Object.entries(value).every(([k, v]) =>
    /^[a-zA-Z][a-zA-Z0-9_-]{0,63}$/.test(k) && !BANNED_KEYS.test(k) && safeData(v, depth + 1));
  return false;
}
function readInput(input, errors) {
  if (typeof input !== 'string') return input;
  if (Buffer.byteLength(input, 'utf8') > MAX_DOCUMENT_BYTES) {
    error(errors, 'oversized_manifest', ''); return null;
  }
  try { return JSON.parse(input); } catch { error(errors, 'invalid_json', ''); return null; }
}
function lookupAction(binding, options) {
  const row = options.lookupSemantic
    ? options.lookupSemantic(binding.actionId)
    : options.db ? getSemanticId(options.db, binding.actionId) : null;
  if (!row || row.id !== binding.actionId || row.kind !== 'action' || row.status !== 'current') return null;
  const plainId = binding.actionId.slice(0, binding.actionId.lastIndexOf('@'));
  const action = Array.isArray(options.actions) ? options.actions.find((a) => a?.id === plainId) : null;
  if (!action || action.status !== 'wired' || !obj(action.handler) || action.mutates !== false && action.mutates !== true
      || !['low', 'medium', 'high'].includes(action.risk) || !Array.isArray(action.actors) || !action.actors.length
      || (action.risk === 'high' && action.approval !== true)) return null;
  return action;
}

/** Validate untrusted compiler output, including real semantic/action registry resolution. */
export function validateCommentProgram(input, options = {}) {
  const errors = [];
  const m = readInput(input, errors);
  if (!obj(m)) { if (!errors.length) error(errors, 'invalid_manifest', ''); return { ok: false, errors }; }
  for (const k of Object.keys(m)) if (!SAFE_KEYS.has(k)) error(errors, 'unknown_key', k);
  if (m.schema !== COMMENT_PROGRAM_SCHEMA) error(errors, 'invalid_schema', 'schema');
  if (!string(m.compilerVersion) || !/^\d+\.\d+\.\d+(?:[-+][a-zA-Z0-9.-]+)?$/.test(m.compilerVersion)) error(errors, 'invalid_compiler_version', 'compilerVersion');
  const sm = m.sourceMap;
  if (!obj(sm) || Object.keys(sm).some((k) => !['path', 'lineStart', 'lineEnd', 'digest'].includes(k))
      || !safePath(sm?.path) || !posInt(sm?.lineStart) || !posInt(sm?.lineEnd)
      || sm.lineEnd < sm.lineStart || !/^[a-f0-9]{64}$/.test(sm.digest ?? '')) error(errors, 'invalid_source_map', 'sourceMap');
  const configValidation = validateProgramConfig(m.config);
  for (const e of configValidation.errors) error(errors, e.code, `config${e.path ? '.' + e.path : ''}`);
  if (!obj(m.config) || !string(m.config.id) || !string(m.config.source)) error(errors, 'missing_config_fields', 'config');
```

_First 80 of 195 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
