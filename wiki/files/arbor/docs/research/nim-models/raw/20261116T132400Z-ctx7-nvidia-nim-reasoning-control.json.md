# File: docs/research/nim-models/raw/20261116T132400Z-ctx7-nvidia-nim-reasoning-control.json

> Generated 2026-11-19 · JSON · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | docs/research/nim-models/raw/20261116T132400Z-ctx7-nvidia-nim-reasoning-control.json |
| Language | JSON |
| Kind | config |
| Size | 4263 B |
| Lines | 13 |
| Hash | 0d5110c44895 |
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
  "query": "LLM NIM configuration: reasoning/thinking models — how to enable or disable reasoning (enable_thinking, reasoning_effort, chat_template_kwargs), max_model_len context window configuration, system prompt format, tensor parallel size, and list of Nemotron model NIMs with their context windows",
  "language": "python",
  "pulledAt": "2026-11-16T13:24:00Z",
  "response": "### Control Reasoning\n\nSource: https://docs.nvidia.com/nim/large-language-models/latest/get-started/advanced/get-started-nemotron-3.5-super-vl.html\n\nReasoning is on by default. Control it per request with these fields of `/v1/chat/completions`:\n\n| Field | Values | Effect |\n| --- | --- | --- |\n| `\"chat_template_kwargs\": {\"enable_thinking\": false}` | `true` (default), `false` | `false` turns reasoning off; the model answers directly. |\n| `\"reasoning_effort\"` | `\"low\"`, `\"medium\"`, `\"high\"` | `\"low\"` and `\"medium\"` select a shorter, efficient reasoning mode; `\"high\"` (or omitting the field) selects full reasoning. |\n\nDo not use `thinking_token_budget` to cap reasoning length. When the budget is reached, the model does not finish its answer: generation continues until `max_tokens` and the response ends with `finish_reason: \"length\"` and empty `content`. Use `reasoning_effort` or `enable_thinking` instead.\n\nRequest example (shorter reasoning):\ncurl http://localhost:8000/v1/chat/completions -H \"Content-Type: application/json\" -d '{\"model\": \"nvidia/nemotron-3.5-super-vl-120b-a12b\", \"messages\": [{\"role\": \"user\", \"content\": \"What time is 3 hours and 40 minutes after 2:45 pm?\"}], \"max_tokens\": 4096, \"reasoning_effort\": \"low\"}'\n\n--------------------------------\n\n### Interact with the API > Configure Reasoning\n\nSource: https://docs.nvidia.com/nim/large-language-models/latest/get-started/advanced/get-started-muse-spark-open.html\n\n`reasoning_effort` supports four reasoning levels: `low`, `medium`, `high`, and `xhigh`. When you omit `reasoning_effort`, the default is `xhigh`.\n\nTo disable reasoning, set `\"reasoning_effort\": \"none\"`, or pass `\"chat_template_kwargs\": {\"enable_thinking\": false}`. The model then answers directly, generates no reasoning tokens, and omits `reasoning_content` from the response.\n\nWhen reasoning is enabled, non-streaming Chat Completions responses include `reasoning_content`. Reasoning tokens count toward `max_tokens`, so allow enough tokens for both reasoning and the final answer. A small `max_tokens` value at the default `xhigh` effort can produce only reasoning and no answer text. `finish_reason` shows which case it is: `stop` for a normal answer or `length` if the token limit was reached.\n\nWith `temperature` set to `0` and `reasoning_effort` set to `xhigh`, some prompts can repeat the same reasoning until `max_tokens` is reached and return empty `content`. This is known behavior of greedy decoding with this model checkpoint, rather than evidence of a NIM or cache defect. The model card recommends `temperature` 1.0, `top_p` 1.0, and `top_k` disabled. For tests that require `temperature` 0, use `reasoning_effort` `medium` or lower.\n\nFor the Anthropic-compatible `/v1/messages` endpoint, omitting the `thinking` block disables reasoning. When reasoning is enabled, `output_config.effort` accepts the same four levels: `low`, `medium`, `high`, and `xhigh`.\n\n--------------------------------\n\n### Model Configuration > NIM_MAX_MODEL_LEN\n\nSource: https://docs.nvidia.com/nim/large-language-models/latest/reference/environment-variables.html\n\nNIM_MAX_MODEL_LEN: int | None — Overrides the maximum sequence length (context window) for the model. Values larger than the model's trained maximum may cause errors. Default: None (uses model's default from config). Example: NIM_MAX_MODEL_LEN=4096",
  "sourceUrls": [
    "https://docs.nvidia.com/nim/large-language-models/latest/get-started/advanced/get-started-nemotron-3.5-super-vl.html",
    "https://docs.nvidia.com/nim/large-language-models/latest/get-started/advanced/get-started-muse-spark-open.html",
    "https://docs.nvidia.com/nim/large-language-models/latest/reference/environment-variables.html"
  ]
}
```

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
