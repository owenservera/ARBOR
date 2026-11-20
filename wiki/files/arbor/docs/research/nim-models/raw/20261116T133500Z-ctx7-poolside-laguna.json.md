# File: docs/research/nim-models/raw/20261116T133500Z-ctx7-poolside-laguna.json

> Generated 2026-11-19 · JSON · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | docs/research/nim-models/raw/20261116T133500Z-ctx7-poolside-laguna.json |
| Language | JSON |
| Kind | config |
| Size | 1892 B |
| Lines | 10 |
| Hash | 6affd2147076 |
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
  "libraryId": "/websites/poolside_ai",
  "query": "Poolside Laguna models for coding: laguna-xs-2.1 and larger laguna models — parameter counts, context window, license, benchmarks, API model ids, availability as NVIDIA NIM on build.nvidia.com (poolside/laguna-xs-2.1), HuggingFace repo poolside/laguna-xs-2.1",
  "language": "python",
  "pulledAt": "2026-11-16T13:35:00Z",
  "response": "### Laguna XS 2.1\nSource: https://docs.poolside.ai/release-notes/models\nLaguna XS 2.1 is a 33B parameter Mixture-of-Experts model featuring 3B activated parameters per token. It is optimized for local execution on hardware like Macs with 36 GB of RAM and supports a 256K token context window. Key enhancements include native reasoning support with interleaved thinking, improved multilingual coding performance, and optimized memory usage through FP8 KV cache quantization.\n\n### Laguna S 2.1\nSource: https://docs.poolside.ai/release-notes/models and /release-notes/overview\n118B parameter MoE, 8B activated per token; designed for agentic coding and long-horizon tasks; 1M token context window; native reasoning with thinking modes; released under the OpenMDW-1.1 license; quantizations BF16, FP8, INT4, NVFP4, GGUF, MLX.\n\n### Laguna M.1\nSource: https://docs.poolside.ai/release-notes/overview\nOptimized for multi-step agentic coding workflows that involve tool use and validation; 256K context window; improved benchmark results.",
  "sourceUrls": ["https://docs.poolside.ai/release-notes/models", "https://docs.poolside.ai/release-notes/overview"],
  "note": "Laguna XS 2.1: 33B total / 3B active MoE, 256K context, local/edge-optimized, interleaved thinking [official-doc]. NIM id poolside/laguna-xs-2.1 confirmed by local provider_config (new-provider personalModelIds). No benchmark table surfaced -> [unverified]. Zero rows in local model_usage."
}
```

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
