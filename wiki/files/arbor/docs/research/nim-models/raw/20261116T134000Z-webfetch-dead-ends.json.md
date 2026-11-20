# File: docs/research/nim-models/raw/20261116T134000Z-webfetch-dead-ends.json

> Generated 2026-11-19 · JSON · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | docs/research/nim-models/raw/20261116T134000Z-webfetch-dead-ends.json |
| Language | JSON |
| Kind | config |
| Size | 2435 B |
| Lines | 23 |
| Hash | 3131a282c2bc |
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
  "type": "webfetch-dead-ends",
  "pulledAt": "2026-11-16T13:40:00Z",
  "attempts": [
    { "url": "https://docs.nvidia.com/nim/large-language-models/latest/introduction.html", "result": "empty page (only --- separators; JS-rendered). NIM doc content was instead obtained via context7 /websites/nvidia_nim.", "tier": "dead-end" },
    { "url": "https://huggingface.co/api/models?author=nvidia&search=nemotron&limit=100", "result": "timeout 60s" },
    { "url": "https://huggingface.co/api/models?author=nvidia&search=nemotron&limit=50&full=false", "result": "timeout 60s" },
    { "url": "https://huggingface.co/api/models?author=poolside&limit=30&full=false", "result": "timeout 60s" },
    { "url": "https://huggingface.co/api/models?author=minimaxai&limit=30&full=false", "result": "returned empty list [] (author filter mismatch)" },
    { "url": "https://huggingface.co/api/models?author=stepfun-ai&limit=30&full=false", "result": "timeout 60s" },
    { "url": "https://huggingface.co/api/models?search=laguna&limit=20&full=false", "result": "timeout 60s" },
    { "url": "https://huggingface.co/api/models?search=minimax&limit=30&full=false", "result": "timeout 60s" },
    { "url": "https://huggingface.co/api/models?search=step-5&limit=20&full=false", "result": "timeout 60s" },
    { "url": "https://huggingface.co/api/models/poolside/laguna-xs-2.1", "result": "timeout 60s" },
    { "url": "https://huggingface.co/api/models/stepfun-ai/step-5-preview", "result": "timeout 60s" },
    { "url": "https://huggingface.co/api/models/minimaxai/MiniMax-M3.1-Flash", "result": "timeout 60s" },
    { "url": "https://huggingface.co/api/models/meta/muse-glimmer-30b", "result": "HTTP 401 Unauthorized (gated/private or nonexistent); treat meta/muse-glimmer-30b card as [unverified-source-skipped]" },
    { "url": "https://huggingface.co/api/models/nvidia/NVIDIA-Nemotron-3.5-Super-VL-120B-A12B-BF16", "result": "timeout 60s" },
    { "url": "https://build.nvidia.com/nvidia/nemotron-3-ultra-550b-a55b", "result": "timeout 60s (JS app)" },
    { "url": "https://docs.mistral.ai/models/", "result": "timeout 60s; Mistral content obtained via context7 /mistralai/platform-docs-public instead" }
  ],
  "note": "Recorded per owner canon: dead ends are evidence of where the answer is not. HF/build.nvidia.com direct fetches were unreliable from this host (60s timeouts); context7 mirrors of the same official docs were used instead."
}
```

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
