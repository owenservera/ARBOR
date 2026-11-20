# File: docs/research/nim-models/raw/20261116T132500Z-ctx7-nvidia-nim-known-issues-toolcalling.json

> Generated 2026-11-19 · JSON · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | docs/research/nim-models/raw/20261116T132500Z-ctx7-nvidia-nim-known-issues-toolcalling.json |
| Language | JSON |
| Kind | config |
| Size | 3992 B |
| Lines | 14 |
| Hash | 53190a14fe12 |
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
  "query": "Tool calling / function calling and structured output on NIM LLM: tools and tool_choice parameters in /v1/chat/completions, parallel_tool_calls, response_format with json_schema type and guided_json, json_object mode; any documented limitations, incompatibilities, or known issues with structured output or tool-call argument serialization on NIM endpoints",
  "language": "python",
  "pulledAt": "2026-11-16T13:25:00Z",
  "response": "### Known Issues\n\nSource: https://docs.nvidia.com/nim/large-language-models/latest/get-started/advanced/get-started-nemotron-3.5-super-vl.html\n\n- **`json_object` output can omit the fields you ask for.** `\"response_format\": {\"type\": \"json_object\"}` guarantees valid JSON, not a particular shape; the model can return `{}` or leave out a requested field. When the response must contain specific fields, use `\"response_format\": {\"type\": \"json_schema\", ...}` with those fields listed as `required`.\n\n- **Forced tool choice returns arguments for tools that take none.** When a tool's `parameters` declare no properties (`\"properties\": {}`) and the request forces the call with `\"tool_choice\": \"required\"` or a named function, the returned `arguments` can contain invented keys instead of `{}`, and frameworks that validate arguments reject the call before running the tool. This comes from vLLM. For tools without parameters, use `\"tool_choice\": \"auto\"`, which returns `{}`.\n\n--------------------------------\n\n### Function Calling with tool_choice and tools\n\nSource: https://docs.nvidia.com/nim/vision-language-models/2.1.2/function-calling.html (and latest: .../vision-language-models/latest/function-calling.html)\n\nEnables the model to call external functions by providing a list of tools and controlling tool selection via the tool_choice parameter.\n\nRequest Body:\n- **tool_choice** (string or object) - Required - One of: \"none\", \"auto\", \"required\", or a named tool choice {\"type\":\"function\",\"function\":{\"name\": ...}}. Requires that tools is also set.\n- **tools** (array of tool objects) - Required - The list of tool objects that define the functions the model can call. Requires that tool_choice is also set.\n\ntool_choice Options:\n- \"none\" - Disables the use of tools (tool_calls will be empty in the response). The API only guarantees that tool_calls is empty; it does not guarantee that tool-related text does not appear in message.content.\n- \"auto\" - Enables the model to decide whether to use tools and which ones to use.\n- \"required\" - Forces the model to generate one or more tool calls based on the specified tool list.\n- Named tool choice - Forces the model to use a specific tool. Format: {\"type\": \"function\", \"function\": {\"name\": \"name of the tool goes here\"}} (type optional, defaults to function).\n\nNotes:\n- tool_choice can only be set when tools is also set.\n- To minimize tool-related output when tools are not needed, omit the tools parameter entirely instead of passing tools with tool_choice: \"none\".\n- A 400 (Bad Request) response can occur when a tool call does not complete because max_tokens is too small. If you receive a 400 error when using tools, try increasing max_tokens.\n- Function calling is not supported on some models. Refer to the model card for more information.",
  "sourceUrls": [
    "https://docs.nvidia.com/nim/large-language-models/latest/get-started/advanced/get-started-nemotron-3.5-super-vl.html",
    "https://docs.nvidia.com/nim/vision-language-models/latest/function-calling.html",
    "https://docs.nvidia.com/nim/vision-language-models/2.1.2/function-calling.html"
  ],
  "note": "Load-bearing for guidebook section 4: json_object can omit fields -> prefer json_schema with required; forced tool_choice invents args for no-param tools (vLLM origin); 400 on small max_tokens with tools; function calling not supported on some models."
}
```

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
