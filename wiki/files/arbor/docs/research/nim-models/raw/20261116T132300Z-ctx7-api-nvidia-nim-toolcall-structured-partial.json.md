# File: docs/research/nim-models/raw/20261116T132300Z-ctx7-api-nvidia-nim-toolcall-structured-partial.json

> Generated 2026-11-19 · JSON · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | docs/research/nim-models/raw/20261116T132300Z-ctx7-api-nvidia-nim-toolcall-structured-partial.json |
| Language | JSON |
| Kind | config |
| Size | 1349 B |
| Lines | 10 |
| Hash | c66dc135064d |
| Test | no |
| Generated | no |
| Component | docs |

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
  "type": "context7-query-docs",
  "libraryId": "/websites/api_nvidia_nim",
  "query": "Tool calling / function calling support on NVIDIA NIM chat completions: tools parameter, tool_choice, parallel tool calls; structured output via response_format json_schema (guided_json / guided_decoding); known limitations or bugs with response_format and tool call arguments on NIM endpoints",
  "language": "python",
  "pulledAt": "2026-11-16T13:23:00Z",
  "response": "### POST /v1/chat/completions\n\nSource: https://docs.api.nvidia.com/nim/docs/models\n\nThe primary endpoint for interacting with LLM models to generate chat completions.\n\n## POST /v1/chat/completions\n### Description\nThis endpoint provides access to top-tier LLM models for natural language tasks including chat, instruction following, question answering, summarization, creative text generation, and code generation.\n### Method\nPOST\n### Endpoint\nhttps://integrate.api.nvidia.com/v1/chat/completions",
  "sourceUrls": ["https://docs.api.nvidia.com/nim/docs/models"],
  "note": "PARTIAL / weak match: this small library (64 snippets) only returned the generic endpoint stub, no tool-calling/structured-output detail. The load-bearing tool-calling + known-issues content came from /websites/nvidia_nim — see 20261116T132500Z. Recorded per canon (dead ends are evidence too)."
}
```

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
