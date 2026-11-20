# File: docs/research/nim-models/raw/20261116T134200Z-local-provider-config-masked.json

> Generated 2026-11-19 · JSON · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | docs/research/nim-models/raw/20261116T134200Z-local-provider-config-masked.json |
| Language | JSON |
| Kind | config |
| Size | 4047 B |
| Lines | 144 |
| Hash | 09554b0575c1 |
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
 "type": "local-config",
 "source": "C:\\Users\\VIVIM.inc/.zcode/v2/provider_config.json",
 "pulledAt": "2026-11-16T14:38:46.501Z",
 "note": "secrets masked; only new-provider* entries extracted; providerOrder=[\"openrouter-2\",\"new-provider-4\",\"new-provider-3\",\"codex-oauth\",\"minimax-m-plan\",\"opencode-zen-chat-2\",\"new-provider\",\"openrouter\",\"new-provider-2\",\"minimax\",\"kilocode-free\",\"zai-standard-api\",\"claude-code-oauth\",\"grok-build-oauth\",\"openai\",\"ccr-router\",\"minimax-m-plan-cn\",\"cpa-free\",\"deepseek\",\"new-provider-5\"]",
 "providers": [
  {
   "providerId": "new-provider-2",
   "providerName": "Hugging Face",
   "enabled": true,
   "config": {
    "group": "standard-personal",
    "access": {
     "type": "api-key",
     "apiKey": "hf_XEB***(len 37)"
    },
    "api": {
     "type": "openai-chat-completions",
     "baseUrl": "https://router.huggingface.co/v1"
    },
    "personalModelIds": [],
    "modelOrder": []
   }
  },
  {
   "providerId": "new-provider",
   "providerName": "NVIDIA NIM",
   "enabled": true,
   "config": {
    "group": "standard-personal",
    "access": {
     "type": "api-key",
     "apiKey": "nvapi-***(len 70)"
    },
    "api": {
     "type": "openai-chat-completions",
     "baseUrl": "https://integrate.api.nvidia.com/v1"
    },
    "personalModelIds": [
     "nvidia/nemotron-3-ultra-550b-a55b",
     "nvidia/nemotron-3.5-super-vl-120b-a12b",
     "nvidia/nemotron-3.5-lightning-30b-a3b",
     "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning",
     "nvidia/nemotron-3.5-bolt-e4b",
     "poolside/laguna-xs-2.1",
     "minimaxai/minimax-m3.1-flash",
     "stepfun-ai/step-5-preview",
     "mistralai/mistral-large-4-1t-a52b",
     "meta/muse-glimmer-30b"
    ],
    "modelOrder": [
     "nvidia/nemotron-3-ultra-550b-a55b",
     "nvidia/nemotron-3.5-super-vl-120b-a12b",
     "nvidia/nemotron-3.5-lightning-30b-a3b",
     "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning",
     "nvidia/nemotron-3.5-bolt-e4b",
     "poolside/laguna-xs-2.1",
     "minimaxai/minimax-m3.1-flash",
     "stepfun-ai/step-5-preview",
     "mistralai/mistral-large-4-1t-a52b",
     "meta/muse-glimmer-30b"
    ]
   }
  },
  {
   "providerId": "new-provider-3",
   "providerName": "FREEllmAPI",
   "config": {
    "group": "standard-personal",
    "access": {
     "type": "api-key",
     "apiKey": "freell***(len 59)"
    },
    "api": {
     "type": "openai-chat-completions",
     "baseUrl": "http://127.0.0.1:31415/v1"
    },
    "personalModelIds": [
     "auto",
     "auto:smart",
```

_First 80 of 144 lines._

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
