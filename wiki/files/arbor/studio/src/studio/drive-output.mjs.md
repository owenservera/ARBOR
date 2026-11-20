# File: studio/src/studio/drive-output.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/studio/drive-output.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 963 B |
| Lines | 22 |
| Hash | 3ec1a55538e0 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| extractDriveJson | function | 12 | yes | export function extractDriveJson(stdout) { |
| raw | const | 13 | no | const raw = String(stdout ?? &#39;&#39;); |
| start | const | 14 | no | const start = raw.indexOf(&#39;{&#39;); |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [studio/bin/commands/chat.mjs](../../bin/commands/chat.mjs.md) | ../../src/studio/drive-output.mjs |
| [studio/src/studio/system-wrap.mjs](./system-wrap.mjs.md) | ./drive-output.mjs |

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 2 | context | — | — | Extract the JSON result from a drive run whose stdout also carries progress lines. |
| 3 | owner | atlas | — | atlas |
| 4 | task | — | — | VC-14 |
| 5 | invariant | — | — | a stdout with no JSON object is an error, never an empty result. |

## Excerpt

```javascript
/**
 * @hq:context Extract the JSON result from a drive run whose stdout also carries progress lines.
 * @hq:owner atlas
 * @hq:task VC-14
 * @hq:invariant a stdout with no JSON object is an error, never an empty result.
 */
// `studio drive` writes human progress lines ("tab …", "sent via enter") before its JSON result.
// A bare JSON.parse of the whole stream therefore failed on every noisy run, which the channel
// reported as an empty reply. This extracts the object instead of assuming a clean stream.

/** Return the parsed result object, or throw when stdout carries none. */
export function extractDriveJson(stdout) {
  const raw = String(stdout ?? '');
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end <= start) throw new Error('DRIVE_OUTPUT_NO_JSON');
  try {
    return JSON.parse(raw.slice(start, end + 1));
  } catch {
    throw new Error('DRIVE_OUTPUT_INVALID_JSON');
  }
}
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
