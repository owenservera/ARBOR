# File: docs/research/nim-models/raw/20261116T132900Z-ctx7-nemotron-family-specs.json

> Generated 2026-11-19 · JSON · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | docs/research/nim-models/raw/20261116T132900Z-ctx7-nemotron-family-specs.json |
| Language | JSON |
| Kind | config |
| Size | 4555 B |
| Lines | 15 |
| Hash | 513d9fd43ad9 |
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
  "libraryId": "/nvidia-nemo/nemotron",
  "query": "Nemotron 3 / Nemotron 3.5 model family overview: list all models — Nemotron-3-Ultra-550B-A55B, Nemotron-3.5-Super-VL-120B-A12B, Nemotron-3.5-Lightning-30B-A3B, Nemotron-3-Nano-Omni-30B-A3B-Reasoning, Nemotron-3.5-Bolt-E4B — for each: total/active parameter count, architecture, context window length, modalities, license, HuggingFace model id, key benchmark scores",
  "language": "python",
  "pulledAt": "2026-11-16T13:29:00Z",
  "response": "### Nemotron 3.5 Super VL model card (spec table)\n\nSource: https://github.com/nvidia-nemo/nemotron/blob/main/src/nemotron/recipes/super35/README.md\n\n| Parameters | 120B total, 12B active |\n| Language model | Hybrid Mamba-Transformer with latent Mixture-of-Experts, initialized from Nemotron 3 Super |\n| Vision | C-RADIO encoder + vision-language projector; the Megatron-Bridge implementation adds a temporal video embedder (the Nemotron Omni image/video stack, no audio) |\n| Speculative decoding | One recursively shared MTP head |\n| Context | Up to 1M tokens |\n| Released checkpoints | Base BF16, post-trained BF16, NVFP4 |\n| Hugging Face ids | `nvidia/NVIDIA-Nemotron-3.5-Super-VL-120B-A12B-{Base-BF16,BF16,NVFP4}` |\n\n--------------------------------\n\n### Nemotron 3 Ultra Quick Reference > 1. Identity\n\nSource: https://github.com/nvidia-nemo/nemotron/blob/main/skills/nemotron-ultra/context/quick-reference.md\n\n- **Model**: Nemotron 3 Ultra 550B-A55B\n- **Developer**: NVIDIA\n- **Family**: largest / most capable Nemotron 3 model\n- **Active / total params**: 55B active / 550B total (MoE)\n- **Architecture**: hybrid Mamba-Attention MoE (Mamba-2 + Attention + LatentMoE)\n- **Context length**: up to 1M (1,048,576) tokens\n- **Pretraining**: 20T text tokens (NVFP4)\n- **Post-training**: SFT → RLVR → MOPD warmup → MOPD (×2) → MTP Boosting\n- **Announced**: GTC San Jose 2026; full release expected 1H 2026 (base-only first)\n- **Best for**: agentic workflows, tool use, software engineering, long-context reasoning, code, math\n\n--------------------------------\n\n### Nemotron 3 Nano Quick Reference > 1. Model Identity\n\nSource: https://github.com/nvidia-nemo/nemotron/blob/main/skills/nemotron-nano3/context/quick-reference.md\n\n| Family | NVIDIA Nemotron |\n| Model | Nemotron 3 Nano 30B-A3B |\n| Architecture | Hybrid Mamba-Transformer with sparse MoE |\n| Total params | 31.6B |\n| Active params | 3.2B per forward pass; 3.6B including embeddings |\n| Pretraining tokens | 25T |\n| Public context claim | up to 1M tokens |\n| HF default context | 256k in public config examples |\n| License | NVIDIA Nemotron Open Model License |\n\n--------------------------------\n\n### Nemotron 3 Nano Omni\n\nSource: https://github.com/nvidia-nemo/nemotron/blob/main/README.md\n\n**Model Specifications**:\n- 30B total / 3B active parameters (A3B MoE)\n- Hybrid architecture: Mamba layers (sequence/memory efficiency) + transformer layers (reasoning), with a unified text decoder\n- Native modalities: text, image, video, audio\n- Vision encoder: C-RADIOv4-H · Audio encoder: NVIDIA Parakeet · Video pipeline: 3D convolutions + Efficient Video Sampling (EVS)\n- Context length: progressively scaled 16K → 49K → 262K\n- Best-in-class on MMlongbench-Doc, OCRBenchV2; leading on WorldSense, DailyOmni, VoiceBench\n- Up to ~9.2× greater video-reasoning system capacity, ~7.4× on multi-document workloads vs. comparable open omni models\n- License: NVIDIA Nemotron Open Model License (enterprise-friendly, on-prem and any deployment)\n\n--------------------------------\n\n### Nemotron-3.5 Lightning Notebooks > Overview\n\nSource: https://github.com/nvidia-nemo/nemotron/blob/main/usage-cookbook/Nemotron-3.5-Lightning/README.md\n\nNemotron-3.5 Lightning is a 30B total / 3B active-parameter hybrid Mamba-Transformer MoE model for fast reasoning, coding, and agentic workflows. It is sized for single-node deployment, while supporting long-context use and structured tool calling.",
  "sourceUrls": [
    "https://github.com/nvidia-nemo/nemotron/blob/main/src/nemotron/recipes/super35/README.md",
    "https://github.com/nvidia-nemo/nemotron/blob/main/skills/nemotron-ultra/context/quick-reference.md",
    "https://github.com/nvidia-nemo/nemotron/blob/main/skills/nemotron-nano3/context/quick-reference.md",
    "https://github.com/nvidia-nemo/nemotron/blob/main/README.md",
    "https://github.com/nvidia-nemo/nemotron/blob/main/usage-cookbook/Nemotron-3.5-Lightning/README.md"
  ]
}
```

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
