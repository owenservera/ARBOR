# File: studio/bin/lib/capabilities.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/bin/lib/capabilities.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 1285 B |
| Lines | 27 |
| Hash | 1769c7e3e526 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| capability | function | 4 | yes | export async function capability(relativePath, names, label) { |
| mod | variable | 5 | no | let mod; |
| unavailable | function | 15 | yes | export function unavailable(label, details) { |
| stageProgress | function | 22 | yes | export function stageProgress(out, session) { |
| event | const | 24 | no | const event = typeof stage === &#39;object&#39; &amp;&amp; stage !== null ? stage : { stage, ...(typeof detail === &#39;object&#39; ? detail : { status: detail }) }; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./ui.mjs | import | 1 | [studio/bin/lib/ui.mjs](./ui.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/bin/commands/capture.mjs](../commands/capture.mjs.md) | ../lib/capabilities.mjs |
| [studio/bin/commands/knowledge.mjs](../commands/knowledge.mjs.md) | ../lib/capabilities.mjs |
| [studio/bin/commands/mirror.mjs](../commands/mirror.mjs.md) | ../lib/capabilities.mjs |
| [studio/bin/commands/platform.mjs](../commands/platform.mjs.md) | ../lib/capabilities.mjs |
| [studio/bin/commands/replay.mjs](../commands/replay.mjs.md) | ../lib/capabilities.mjs |
| [studio/bin/commands/sessions.mjs](../commands/sessions.mjs.md) | ../lib/capabilities.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
import { CliError } from './ui.mjs';

// Keep optional/in-progress engines out of the CLI's startup import graph.
export async function capability(relativePath, names, label) {
  let mod;
  try { mod = await import(new URL(relativePath, import.meta.url)); }
  catch (error) {
    if (!['ERR_MODULE_NOT_FOUND', 'MODULE_NOT_FOUND', 'ENOENT'].includes(error.code)) throw error;
    throw unavailable(label, error.message);
  }
  for (const name of names) if (typeof mod[name] !== 'function') throw unavailable(label, `Missing export ${name}.`);
  return mod;
}

export function unavailable(label, details) {
  return new CliError(`${label} is not available in this build.`, {
    exit: 5, code: 'CAPABILITY_UNAVAILABLE', details,
    hint: 'Install or finish the corresponding Capture Studio engine module, then retry.',
  });
}

export function stageProgress(out, session) {
  return (stage, detail) => {
    const event = typeof stage === 'object' && stage !== null ? stage : { stage, ...(typeof detail === 'object' ? detail : { status: detail }) };
    out.info(`[${session}] ${event.stage ?? event.name ?? event.id ?? 'derive'}${event.status ?? event.state ? `: ${event.status ?? event.state}` : ''}${event.message ? ` — ${event.message}` : ''}`);
  };
}
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
