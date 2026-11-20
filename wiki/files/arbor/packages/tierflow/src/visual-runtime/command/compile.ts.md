# File: packages/tierflow/src/visual-runtime/command/compile.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../../projects/arbor.md) |
| Path | packages/tierflow/src/visual-runtime/command/compile.ts |
| Language | TypeScript |
| Kind | source |
| Size | 7442 B |
| Lines | 110 |
| Hash | 1f94badafb98 |
| Test | no |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| CompileContext | type | 5 | yes | export type CompileContext = { |
| MAX_INPUT_BYTES | const | 11 | no | const MAX_INPUT_BYTES = 4096; |
| dangerousText | const | 12 | no | const dangerousText = /(?:!\\s*(?:run\|use\|design)\\b\|\\b(?:sudo\|powershell\|cmd\\.exe\|bash\\s+-c\|sh\\s+-c\|argv\|send\\s+to\\s+provider)\\b\|[;&amp;\|`]\|\\b(?:and\\s+then\|after\\s+that)\\b)/i; |
| decodeText | function | 13 | no | function decodeText(text: string): { semanticId: string; args: Record&lt;string,string&gt; } \| null { |
| semanticId | const | 17 | no | const semanticId = match[1]!; |
| args | const | 18 | no | const args: Record&lt;string,string&gt; = Object.create(null); |
| rest | variable | 19 | no | let rest = text.slice(match[0].length); |
| m | const | 21 | no | const m = /^ ([a-z][a-z0-9_]{0,39})=(&quot;(?:[^&quot;\\\\\\u0000-\\u001f]\|\\\\(?:[&quot;\\\\\\/bfnrt]\|u[0-9a-fA-F]{4}))*&quot;)/.exec(rest); |
| value | variable | 23 | no | let value: unknown; |
| toExactText | function | 32 | yes | export function toExactText(semanticId: string, args: Readonly&lt;Record&lt;string,string&gt;&gt;): string \| null { |
| checkedInput | function | 36 | no | function checkedInput(value: unknown): value is CommandInput { |
| comparePins | function | 53 | no | function comparePins(expected: VersionPins \| undefined, current: VersionPins): boolean { |
| validContext | function | 56 | no | function validContext(value: unknown): value is CompileContext { |
| compileVisualCommand | function | 62 | yes | export function compileVisualCommand(input: unknown, context: unknown): Compilation { |
| selected | variable | 68 | no | let selected: { semanticId: string; args: Record&lt;string,string&gt; } \| null = null; |
| text | const | 70 | no | const text = input.text!; |
| aliases | const | 75 | no | const aliases = context.rows.filter(row =&gt; row.textAliases?.includes(text)); |
| crosswalk | const | 84 | no | const crosswalk = resolveCrosswalk(selected.semanticId, context.rows, context.descriptors); |
| command | const | 98 | no | const command: VisualCommand = { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./ir.ts | import | 1 | [packages/tierflow/src/visual-runtime/command/ir.ts](./ir.ts.md) |
| ./crosswalk.ts | import | 3 | [packages/tierflow/src/visual-runtime/command/crosswalk.ts](./crosswalk.ts.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [packages/tierflow/src/visual-runtime/command/wave3-descriptor-proof.ts](./wave3-descriptor-proof.ts.md) | ./compile.ts |
| [packages/tierflow/src/visual-runtime/experience/wave3-journey-fixture.ts](../experience/wave3-journey-fixture.ts.md) | ../command/compile.ts |
| [packages/tierflow/src/visual-runtime/final-wave/lane-a/normalize.ts](../final-wave/lane-a/normalize.ts.md) | ../../command/compile.ts |
| [packages/tierflow/src/visual-runtime/integration-2/compose.ts](../integration-2/compose.ts.md) | ../command/compile.ts |
| [packages/tierflow/tests/visual-runtime/command-negative.test.ts](../../../tests/visual-runtime/command-negative.test.ts.md) | ../../src/visual-runtime/command/compile.ts |
| [packages/tierflow/tests/visual-runtime/command.test.ts](../../../tests/visual-runtime/command.test.ts.md) | ../../src/visual-runtime/command/compile.ts |
| [packages/tierflow/tests/visual-runtime/final-wave/lane-a/normalize.test.ts](../../../tests/visual-runtime/final-wave/lane-a/normalize.test.ts.md) | ../../../../src/visual-runtime/command/compile.ts |
| [packages/tierflow/tests/visual-runtime/integration-2/real-a-h.test.ts](../../../tests/visual-runtime/integration-2/real-a-h.test.ts.md) | ../../../src/visual-runtime/command/compile.ts |
| [packages/tierflow/tests/visual-runtime/integration-3.test.ts](../../../tests/visual-runtime/integration-3.test.ts.md) | ../../src/visual-runtime/command/compile.ts |
| [packages/tierflow/tests/visual-runtime/wave3-e-experience.test.ts](../../../tests/visual-runtime/wave3-e-experience.test.ts.md) | ../../src/visual-runtime/command/compile.ts |
| [packages/tierflow/tests/visual-runtime/wave3-g-command.test.ts](../../../tests/visual-runtime/wave3-g-command.test.ts.md) | ../../src/visual-runtime/command/compile.ts |

## Annotations

_No annotations._

## Excerpt

```typescript
import { ACTION_ID, DIGEST, SEMANTIC_ID, VISUAL_COMMAND_SCHEMA, onlyKeys, safeRecord, validArgs, validPins, refusal,
  type CommandInput, type Compilation, type VersionPins, type VisualCommand } from './ir.ts';
import { checkArguments, resolveCrosswalk, validRow, type ActionDescriptor, type CrosswalkRow } from './crosswalk.ts';

export type CompileContext = {
  /** Supplied by a trusted integration broker; not derived from owner input/AI. */
  rows: readonly CrosswalkRow[];
  descriptors: readonly ActionDescriptor[];
  currentVersions: VersionPins;
};
const MAX_INPUT_BYTES = 4096;
const dangerousText = /(?:!\s*(?:run|use|design)\b|\b(?:sudo|powershell|cmd\.exe|bash\s+-c|sh\s+-c|argv|send\s+to\s+provider)\b|[;&|`]|\b(?:and\s+then|after\s+that)\b)/i;
function decodeText(text: string): { semanticId: string; args: Record<string,string> } | null {
  // Closed canonical grammar: /semantic.id@1 key="JSON string" key2="JSON string".
  const match = /^\/([a-z0-9][a-z0-9._-]{0,94}@\d+(?:\.\d+)*)/.exec(text);
  if (!match) return null;
  const semanticId = match[1]!;
  const args: Record<string,string> = Object.create(null);
  let rest = text.slice(match[0].length);
  while (rest.length) {
    const m = /^ ([a-z][a-z0-9_]{0,39})=("(?:[^"\\\u0000-\u001f]|\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4}))*")/.exec(rest);
    if (!m || Object.hasOwn(args, m[1]!)) return null;
    let value: unknown;
    try { value = JSON.parse(m[2]!); } catch { return null; }
    if (typeof value !== 'string') return null;
    args[m[1]!] = value;
    rest = rest.slice(m[0].length);
  }
  return { semanticId, args };
}
/** Safe human-accessible representation; never a shell command. */
export function toExactText(semanticId: string, args: Readonly<Record<string,string>>): string | null {
  if (!SEMANTIC_ID.test(semanticId) || !validArgs(args)) return null;
  return '/' + semanticId + Object.keys(args).sort().map(k => ' ' + k + '=' + JSON.stringify(args[k])).join('');
}
function checkedInput(value: unknown): value is CommandInput {
  if (!onlyKeys(value, ['commandId','source','text','selection','aiProposal','expectedVersions']) ||
    typeof value.commandId !== 'string' || !/^[A-Za-z0-9._:-]{1,80}$/.test(value.commandId) ||
    !onlyKeys(value.source, ['surface','inputDigest']) ||
    !['text','touch','keyboard'].includes(value.source.surface as string) ||
    typeof value.source.inputDigest !== 'string' || !DIGEST.test(value.source.inputDigest) ||
    (value.expectedVersions !== undefined && !validPins(value.expectedVersions)) ||
    (value.text !== undefined && (typeof value.text !== 'string' || value.text.length > 2048)) ||
    (value.selection !== undefined && (!onlyKeys(value.selection, ['semanticId','args']) ||
      typeof value.selection.semanticId !== 'string' || !SEMANTIC_ID.test(value.selection.semanticId) ||
      !validArgs(value.selection.args))) ||
    (value.aiProposal !== undefined && (!onlyKeys(value.aiProposal, ['semanticId','args']) ||
      typeof value.aiProposal.semanticId !== 'string' || !SEMANTIC_ID.test(value.aiProposal.semanticId) ||
      !validArgs(value.aiProposal.args)))) return false;
  return (value.source.surface === 'text' && typeof value.text === 'string' && value.selection === undefined) ||
    (value.source.surface !== 'text' && value.text === undefined && value.selection !== undefined && value.aiProposal === undefined);
}
function comparePins(expected: VersionPins | undefined, current: VersionPins): boolean {
  return !expected || Object.entries(expected).every(([k,v]) => current[k as keyof VersionPins] === v);
}
function validContext(value: unknown): value is CompileContext {
  return onlyKeys(value, ['rows','descriptors','currentVersions']) &&
    Array.isArray(value.rows) && Array.isArray(value.descriptors) && value.rows.length <= 64 && value.descriptors.length <= 64 &&
    validPins(value.currentVersions) && value.rows.every(validRow);
}
/** Pure compilation: no KB reads, Host calls, side effects, approvals or executor fallback. */
export function compileVisualCommand(input: unknown, context: unknown): Compilation {
  if (!checkedInput(input)) return refusal('INVALID_INPUT');
  // Guard size before parsing/selection; safeInput ensures own data-only fields.
  if (new TextEncoder().encode(JSON.stringify(input)).length > MAX_INPUT_BYTES) return refusal('INPUT_TOO_LARGE');
  if (!validContext(context)) return refusal('INVALID_CONTEXT');
  if (!comparePins(input.expectedVersions, context.currentVersions)) return refusal('STALE_SOURCE_VERSION');
  let selected: { semanticId: string; args: Record<string,string> } | null = null;
  if (input.source.surface === 'text') {
    const text = input.text!;
    if (dangerousText.test(text) || /\b(?:do not|don't|never|not|without|instead of)\b/i.test(text))
      return refusal('UNSAFE_OR_COMPOUND_TEXT');
    selected = decodeText(text);
    if (!selected) {
      const aliases = context.rows.filter(row => row.textAliases?.includes(text));
      if (aliases.length > 1) return refusal('AMBIGUOUS_TEXT', 'clarification_required');
      if (aliases.length === 1) selected = { semanticId: aliases[0]!.semanticRef.id, args: Object.create(null) };
    }
    if (!selected) return refusal('UNKNOWN_TEXT', 'clarification_required');
  } else {
```

_First 80 of 111 lines._

---

[HQ wiki](../../../../../../../index.md) · [Symbols](../../../../../../../symbols.md) · [Dependency graph](../../../../../../../graph.md) · [Documentation](../../../../../../../docs.md) · [Changes](../../../../../../../changes.md) · [Open tasks](../../../../../../../todos.md) · [Deprecated](../../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../../protocol.md) · [Glossary](../../../../../../../glossary.md) · [Using HQ](../../../../../../../context.md) · [Capabilities](../../../../../../../capabilities.md) · [Search index](../../../../../../../search.json) · [Browser view](../../../../../../../index.html)
