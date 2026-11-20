# File: harness/package.json

> Generated 2026-11-19 · JSON · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../projects/arbor.md) |
| Path | harness/package.json |
| Language | JSON |
| Kind | config |
| Size | 424 B |
| Lines | 13 |
| Hash | cd66d53dfd1e |
| Test | no |
| Generated | no |
| Component | harness |

## Symbols

_No symbols._

## Imports

_No imports._

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```json
{
  "name": "web-harness",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "description": "One local interface over the user's own signed-in AI webapps (ChatGPT, Claude, DeepSeek, Qwen, Z.ai, Gemini).",
  "engines": { "node": ">=22" },
  "bin": { "wh": "bin/wh.mjs", "wh-mcp": "bin/wh-mcp.mjs" },
  "scripts": {
    "test": "node --test \"test/**/*.test.mjs\"",
    "wh": "node bin/wh.mjs"
  }
}
```

---

[HQ wiki](../../../index.md) · [Symbols](../../../symbols.md) · [Dependency graph](../../../graph.md) · [Documentation](../../../docs.md) · [Changes](../../../changes.md) · [Open tasks](../../../todos.md) · [Deprecated](../../../deprecated.md) · [Agent annotation protocol](../../../protocol.md) · [Glossary](../../../glossary.md) · [Using HQ](../../../context.md) · [Capabilities](../../../capabilities.md) · [Search index](../../../search.json) · [Browser view](../../../index.html)
