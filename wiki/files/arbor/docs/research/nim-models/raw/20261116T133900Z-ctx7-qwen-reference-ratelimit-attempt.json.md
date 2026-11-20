# File: docs/research/nim-models/raw/20261116T133900Z-ctx7-qwen-reference-ratelimit-attempt.json

> Generated 2026-11-19 · JSON · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | docs/research/nim-models/raw/20261116T133900Z-ctx7-qwen-reference-ratelimit-attempt.json |
| Language | JSON |
| Kind | config |
| Size | 2293 B |
| Lines | 10 |
| Hash | e636455b44eb |
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
  "libraryId": "/websites/api_nvidia_nim_reference_qwen-qwen3-5-397b-a17b",
  "query": "On this NVIDIA hosted API per-model reference page: rate limit section (RPM/TPM, per-key limits for the hosted NIM endpoint), error codes (429, retry-after), context length, supported request parameters (tools, response_format), model card link",
  "language": "curl",
  "pulledAt": "2026-11-16T13:39:00Z",
  "response": "### qwen / qwen3.5-397b-a17b > Model Architecture > Input\nSource: https://docs.api.nvidia.com/nim/reference/qwen-qwen3-5-397b-a17b/index\nText, Image, Video; unified multimodal early-fusion; ViT encoder + Hybrid MoE LM with Gated DeltaNet + global attention, fine-grained MoE (10 routed + 1 shared of 512 experts). Context: 262,144 tokens natively; extensible up to 1,010,000 via YaRN RoPE scaling.\n\n### Third-Party Community Consideration\nNot owned by NVIDIA; see non-NVIDIA model card https://huggingface.co/Qwen/Qwen3.5-397B-A17B\n\n### Output\nThinking mode by default (internal <think> tags, can be disabled). Natively supports tool/function calling, agentic workflows (Qwen-Agent, MCP), multi-turn. Recommended output context length (OSL) 32,768 for most queries; up to 81,920 for complex reasoning.\n\n### Inference\nSGLang recommended, tested on B200 TP=8, context 262,144, Qwen3 reasoning parser, MTP supported.\n\n### POST .../-infer (APIDOC)\nSource: https://docs.api.nvidia.com/nim/reference/qwen-qwen3-5-397b-a17b/-infer\nRequest body: messages (required), model (default \"qwen/qwen3.5-397b-a17b\"), chat_template_kwargs ({\"enable_thinking\": true/false}), tools (OpenAI-compatible), max_tokens (default 16384), seed, stream, temperature (recommended 0.6 thinking / 0.7 non-thinking), top_p (0.95/0.8), top_k (20), presence_penalty (0.0/1.5), repetition_penalty (1.0).",
  "sourceUrls": ["https://docs.api.nvidia.com/nim/reference/qwen-qwen3-5-397b-a17b/index", "https://docs.api.nvidia.com/nim/reference/qwen-qwen3-5-397b-a17b/-infer", "https://huggingface.co/Qwen/Qwen3.5-397B-A17B"],
  "note": "DEAD END for rate limits: per-model reference page documents context/params/tools but no RPM/TPM or 429 body. Concrete hosted-API rate-limit numbers remain [unverified]; empirical evidence = local model_usage rate_limited rows."
}
```

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
