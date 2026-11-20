# File: docs/research/nim-models/raw/20261116T132700Z-ctx7-nvidia-nim-supervl-api-supportmatrix.json

> Generated 2026-11-19 · JSON · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | docs/research/nim-models/raw/20261116T132700Z-ctx7-nvidia-nim-supervl-api-supportmatrix.json |
| Language | JSON |
| Kind | config |
| Size | 3906 B |
| Lines | 14 |
| Hash | c9339c309fb1 |
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
  "libraryId": "/websites/nvidia_nim",
  "query": "List of Nemotron 3 family model get-started/advanced pages in NIM LLM docs: nemotron-3-ultra-550b-a55b, nemotron-3.5-super-vl-120b-a12b, nemotron-3.5-lightning-30b-a3b, nemotron-3-nano-omni-30b-a3b-reasoning, nemotron-3.5-bolt-e4b — for each: context window / max sequence length, vision support, reasoning support, recommended system prompt format, max output tokens | and support matrix / per-model context windows",
  "language": "python",
  "pulledAt": "2026-11-16T13:27:00Z",
  "response": "### POST /v1/chat/completions\n\nSource: https://docs.nvidia.com/nim/large-language-models/latest/get-started/advanced/get-started-nemotron-3.5-super-vl.html\n\nSends a chat completion request to the Nemotron-3.5-Super-VL model. Supports text, image, and video inputs. Reasoning is on by default and can be controlled via request fields.\n\nParameters (Request Body):\n- **model** (string) - Required - e.g. \"nvidia/nemotron-3.5-super-vl-120b-a12b\"\n- **messages** (array) - Required - role/content; content can be a string or an array of content parts for multimodal input.\n- **max_tokens** (integer) - Optional - Default is model-specific.\n- **chat_template_kwargs** (object) - Optional - Set {\"enable_thinking\": false} to disable reasoning.\n- **reasoning_effort** (string) - Optional - \"low\", \"medium\", \"high\". Default \"high\" (full reasoning).\n\nResponse 200: object \"chat.completion\"; choices[].message has role, content, refusal, annotations, audio, function_call, reasoning; usage includes completion_tokens_details.reasoning_tokens.\n\nError Handling: If `max_tokens` is too small with reasoning enabled, the response may end with `finish_reason: \"length\"` and empty `content`. Do not use `thinking_token_budget` to cap reasoning length.\n\n--------------------------------\n\n### Get Started with NVIDIA-Nemotron-3.5-Super-VL-120B-A12B\n\nSource: https://docs.nvidia.com/nim/large-language-models/latest/get-started/advanced/get-started-nemotron-3.5-super-vl.html\n\nNVIDIA-Nemotron-3.5-Super-VL-120B-A12B is a vision language model built on the Nemotron-H hybrid Mamba-2 and Transformer architecture with a RADIO vision encoder. It accepts text, image, and video input and returns text; it does not accept audio input. Refer to the Support Matrix for NIMs (https://docs.nvidia.com/nim/large-language-models/latest/reference/support-matrix.html#support-matrix) for supported profiles and GPUs.\n\n--------------------------------\n\n### Support Matrix for NIMs\n\nSource: https://docs.nvidia.com/nim/large-language-models/latest/reference/support-matrix.html\n\nLists supported models, deployment profiles, verified hardware SKUs for NIM LLM and VLM, organized by LLMs / VLMs / Model-Free NIM. Profile strings follow naming convention (backend engine, precision, TP, PP, LoRA). The list of NIM Certified models is on the NGC Catalog (https://catalog.ngc.nvidia.com/search?resourceType=container&productNames=nvaie_supported&nvidia_nim=nimmcro_nvidia_nim). nemotron-3-nano profiles shown: BF16/FP8/NVFP4 x TP1/TP2/TP4/TP8 (+LoRA variants).\n\n--------------------------------\n\n### NIM_MAX_MODEL_LEN example\n\nSource: https://docs.nvidia.com/nim/vision-language-models/2.1.2/environment-variables.html\n\nOverrides the maximum sequence length (context window) for the model. Values larger than the model's trained maximum may cause errors. NIM_MAX_MODEL_LEN=4096",
  "sourceUrls": [
    "https://docs.nvidia.com/nim/large-language-models/latest/get-started/advanced/get-started-nemotron-3.5-super-vl.html",
    "https://docs.nvidia.com/nim/large-language-models/latest/get-started/advanced/index.html",
    "https://docs.nvidia.com/nim/large-language-models/latest/reference/support-matrix.html",
    "https://docs.nvidia.com/nim/vision-language-models/2.1.2/environment-variables.html"
  ]
}
```

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
