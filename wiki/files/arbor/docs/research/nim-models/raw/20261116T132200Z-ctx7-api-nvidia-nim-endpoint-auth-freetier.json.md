# File: docs/research/nim-models/raw/20261116T132200Z-ctx7-api-nvidia-nim-endpoint-auth-freetier.json

> Generated 2026-11-19 · JSON · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | docs/research/nim-models/raw/20261116T132200Z-ctx7-api-nvidia-nim-endpoint-auth-freetier.json |
| Language | JSON |
| Kind | config |
| Size | 4162 B |
| Lines | 10 |
| Hash | f4d5453dc49a |
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
  "query": "Hosted NVIDIA NIM API: base URL (integrate.api.nvidia.com), /v1/models list endpoint, /v1/chat/completions request format, API key (nvapi-) authentication header, free tier credits on build.nvidia.com, rate limits (RPM/TPM) per model and tier",
  "language": "curl",
  "pulledAt": "2026-11-16T13:22:00Z",
  "response": "### POST /v1/chat/completions\n\nSource: https://docs.api.nvidia.com/nim/docs/models\n\nThe primary endpoint for interacting with LLM models to generate chat completions.\n\n## POST /v1/chat/completions\n### Description\nThis endpoint provides access to top-tier LLM models for natural language tasks including chat, instruction following, question answering, summarization, creative text generation, and code generation.\n### Method\nPOST\n### Endpoint\nhttps://integrate.api.nvidia.com/v1/chat/completions\n\n--------------------------------\n\n### NGC & API Key questions > What is an NGC API key?\n\nSource: https://docs.api.nvidia.com/nim/docs/deployment\n\nWhether you are interacting with NIM through the Hosted API Endpoints, or pulling NIM from the NVIDIA NGC catalog to host locally or in cloud infrastructure, you will need an NGC API Key.\n\nThe API key is unique to you and tied to your account. It allows you to interact with NIM through the API and pull NIM microservices to another system. Here is how to generate a NGC API Key or Personal Key (https://docs.api.nvidia.com/nim/docs/authentication).\n\nNOTE: Personal keys allow you to configure an expiration date, revoke or delete the key using an action button, and rotate the key as needed.\n\nImportant: Keep your key secret and in a safe place.\n\n--------------------------------\n\n### Account a FAQ > How can developers register for the NVIDIA Developer Program and access NIM microservices?\n\nSource: https://docs.api.nvidia.com/nim/docs/product\n\nDevelopers can join the free NVIDIA Developer Program and access NIM at any time via the NVIDIA API catalog (https://build.nvidia.com/explore/discover) at build.nvidia.com. Users looking for enterprise-grade security, support, and API stability can select the option to access NIM via a free 90-day NVIDIA AI Enterprise Trial.\n\n--------------------------------\n\n### Account a FAQ > How do I access NVIDIA NIM via the NVIDIA Developer Program?\n\nSource: https://docs.api.nvidia.com/nim/docs/product\n\nMembers of the NVIDIA Developer Program have free access to NIM API endpoints for prototyping, and to downloadable NIM microservices for research, application development, and experimentation on up to 16 GPUs on any infrastructure—cloud, data center, or personal workstation. Access to NIM microservices is available through the duration of program membership.\n\n--------------------------------\n\n### API Catalog Quickstart Guide > Interacting with NIM through the API Endpoints > Interacting through Python\n\nSource: https://docs.api.nvidia.com/nim/docs/api-quickstart\n\n1. In the right hand pane of the model page (e.g. https://build.nvidia.com/meta/llama-3_1-8b-instruct), click Get API Key.\n2. Enter your email ID in the pop-up window, and click Next. By signing up, you will become a member of the Developer Program.\n3. Once account set up has been completed, you will be redirected back to the model page. A pop up window will show your new API Key. Click Copy Key.\n4. Click the Copy Code button ... replace \"API_KEY_REQUIRED_IF_EXECUTING_OUTSIDE_NGC\" with your API key.\n5. You can now run the code. Replace \"Write a limerick about the wonders of GPU computing.\" with your own request to send to the model.",
  "sourceUrls": ["https://docs.api.nvidia.com/nim/docs/models", "https://docs.api.nvidia.com/nim/docs/deployment", "https://docs.api.nvidia.com/nim/docs/authentication", "https://docs.api.nvidia.com/nim/docs/product", "https://docs.api.nvidia.com/nim/docs/api-quickstart", "https://build.nvidia.com/explore/discover"],
  "note": "Concrete RPM/TPM numbers were NOT in this response; see 20261116T133900Z (rate-limit attempt on per-model reference page) and 20261116T132600Z (pricing FAQ)."
}
```

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
