# File: docs/research/nim-models/raw/20261116T133400Z-ctx7-mistral-large-4.json

> Generated 2026-11-19 · JSON · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | docs/research/nim-models/raw/20261116T133400Z-ctx7-mistral-large-4.json |
| Language | JSON |
| Kind | config |
| Size | 3303 B |
| Lines | 15 |
| Hash | 01e0e5198bb6 |
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

````json
{
  "type": "context7-query-docs",
  "libraryId": "/mistralai/platform-docs-public",
  "query": "Mistral models list and model cards: all chat model ids with context window and capabilities; is there a 'mistral-large-4' or 1T-parameter model (mistral-large-4-1t-a52b)? | mistral-large-4-0 full model card details: params, architecture, benchmarks, license, structured output",
  "language": "python",
  "pulledAt": "2026-11-16T13:34:00Z",
  "response": "### Mistral Large 4 model card definition\nSource: https://github.com/mistralai/platform-docs-public/blob/main/src/schema/models/models/mistral-large-4-0.ts\n```typescript\nexport default {\n  name: 'Mistral Large 4',\n  slug: 'mistral-large-4-0',\n  slugAliases: ['mistral-large', 'mistral-large-4'],\n  releaseDate: '2026-10-06',\n  version: '26.10',\n  frontier: true,\n  class: 'Generalist',\n  type: 'Open',\n  status: 'PublicPreview',\n  contextLength: '1M',\n  pricing: { type: 'custom', free: false,\n    input: [ { type: 'range', price: 0.68, denominator: '/M Tokens', label: 'Input', originalPrice: 1.36 }, { price: 0.07, label: 'Cached input', originalPrice: 0.14 } ],\n    output: [ { price: 2.09, denominator: '/M Tokens', originalPrice: 4.18 } ] },\n  identifiers: { apiNames: ['mistral-large-4', 'mistral-large-4-0'] },\n  capabilities: {\n    input: ['text', 'image'],\n    output: ['reasoning', 'text'],\n    features: ['structured-outputs', 'function-calling', 'document-qna', 'prefix', 'chat-completions', 'batching', 'agents-conversations', 'connectors'],\n  },\n} as const;\n```\n\n### Changelog 2026-10-06\nSource: https://github.com/mistralai/platform-docs-public/blob/main/changelog/en/2026-10-06.mdx\n- Mistral Large 4 (`mistral-large-4`) is now available in Public Preview. Open-weight, general-purpose multimodal model with a Mixture-of-Experts architecture and a 1M context window. Open weights coming soon. Launch pricing 50% off for 2 weeks.\n\n### Reasoning support\nSource: .../src/content/en/docs/studio/conversations/reasoning/page.mdx\n- `mistral-large-4-0`: supports adjustable reasoning via the `reasoning_effort` parameter; no extra configuration required.\n\n### response_format Parameter\nSource: .../src/content/en/api/endpoint/beta/conversations/page.mdx\nSupports text, json_object, and json_schema modes. json_schema guarantees the message is JSON and follows the provided schema.\n\n### List Models with Python SDK (v1)\nSource: .../src/content/en/api/endpoint/models/page.mdx\n`mistral.models.list()` with MISTRAL_API_KEY.",
  "sourceUrls": [
    "https://github.com/mistralai/platform-docs-public/blob/main/src/schema/models/models/mistral-large-4-0.ts",
    "https://github.com/mistralai/platform-docs-public/blob/main/changelog/en/2026-10-06.mdx",
    "https://github.com/mistralai/platform-docs-public/blob/main/src/content/en/docs/studio/conversations/reasoning/page.mdx",
    "https://github.com/mistralai/platform-docs-public/blob/main/src/content/en/api/endpoint/beta/conversations/page.mdx"
  ],
  "note": "NIM id 'mistralai/mistral-large-4-1t-a52b' implies ~1T total / 52B active params — the exact param split was not confirmed in these pulls -> [unverified] in guidebook; 1M context, MoE, text+image in, reasoning+text out, structured-outputs + function-calling confirmed [model-card]."
}
````

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
