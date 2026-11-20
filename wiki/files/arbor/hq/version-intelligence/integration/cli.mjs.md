# File: hq/version-intelligence/integration/cli.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/version-intelligence/integration/cli.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 1404 B |
| Lines | 30 |
| Hash | 8854f8015251 |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| MAX_STDIN | const | 7 | no | const MAX_STDIN = 4000000; |
| main | function | 8 | no | async function main() { |
| length | variable | 13 | no | let length = 0, bytes = &#39;&#39;; |
| input | const | 19 | no | const input = JSON.parse(bytes); |
| result | const | 24 | no | const result = await runHviTool(input, { authorize: async () =&gt; true }); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./index.mjs | import | 6 | [hq/version-intelligence/integration/index.mjs](./index.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
#!/usr/bin/env node
/**
 * G1 operator-only synthetic-data CLI. Never reads Git credentials or HEAD.
 * Usage: node hq/version-intelligence/integration/cli.mjs --synthetic-stdin
 */
import { runHviTool, HVI_TOOL_REQUEST_SCHEMA } from './index.mjs';
const MAX_STDIN = 4000000;
async function main() {
  if (process.argv.length !== 3 || process.argv[2] !== '--synthetic-stdin') {
    process.stderr.write('HVI_TOOL_SOURCE_UNAUTHORIZED: only --synthetic-stdin is enabled before Host H integration\n');
    process.exitCode = 2; return;
  }
  let length = 0, bytes = '';
  for await (const chunk of process.stdin) {
    length += chunk.length;
    if (length > MAX_STDIN) throw Object.assign(new Error('HVI_TOOL_RESOURCE_LIMIT'), { code: 'RESOURCE_LIMIT' });
    bytes += chunk.toString('utf8');
  }
  const input = JSON.parse(bytes);
  if (input.schema !== HVI_TOOL_REQUEST_SCHEMA ||
      !input.sourceManifests?.every(m => m.pin?.repoIdentity?.startsWith('synthetic/'))) {
    throw Object.assign(new Error('HVI_TOOL_SOURCE_UNAUTHORIZED'), { code: 'SOURCE_UNAUTHORIZED' });
  }
  const result = await runHviTool(input, { authorize: async () => true });
  process.stdout.write(JSON.stringify({ ...result, provenance: 'SYNTHETIC_ONLY' }) + '\n');
}
main().catch(e => {
  process.stderr.write('HVI_TOOL_' + String(e.code || 'INVALID_INPUT') + '\n');
  process.exitCode = 1;
});
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
