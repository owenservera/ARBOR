# File: harness/docs/swarm.example.json

> Generated 2026-11-19 · JSON · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | harness/docs/swarm.example.json |
| Language | JSON |
| Kind | config |
| Size | 226 B |
| Lines | 7 |
| Hash | 1379c56d8227 |
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
  "task": "Summarize the release notes into three bullets",
  "pattern": "parallel",
  "members": ["chatgpt:gpt-6", "gemini:gemini-3-pro", "claude:opus-5.5"],
  "judge": "qwen:qwen-max",
  "budget": { "maxSends": 6 }
}
```

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
