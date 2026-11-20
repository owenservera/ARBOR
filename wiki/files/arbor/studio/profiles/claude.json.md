# File: studio/profiles/claude.json

> Generated 2026-11-19 · JSON · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | studio/profiles/claude.json |
| Language | JSON |
| Kind | config |
| Size | 1061 B |
| Lines | 47 |
| Hash | 1153b050ba3d |
| Test | no |
| Generated | no |
| Component | studio |

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
  "name": "claude",
  "version": 1,
  "description": "Starting profile for claude.ai, linked to the ai-chat family. Scope and capture policy only; shapes and family field mappings are discovered live and confirmed by the user. UNVERIFIED against the live site.",
  "match": {
    "hosts": [
      "claude.ai",
      "*.claude.ai"
    ]
  },
  "scope": {
    "origins": [
      "claude.ai",
      "*.claude.ai"
    ],
    "thirdParty": "ignore"
  },
  "family": "ai-chat",
  "capture": {
    "bodyResourceTypes": [
      "Fetch",
      "XHR",
      "EventSource",
      "Document",
      "Other"
    ],
    "exclude": [
      "\\.(png|jpe?g|gif|webp|svg|woff2?|ttf|css)(\\?|$)"
    ],
    "websockets": true,
    "wsSentFrames": false,
    "requestBodies": false
  },
  "dom": {
    "enabled": true,
    "roots": [
      "main",
      "body"
    ]
  },
  "decode": {
    "delta": "auto"
  },
  "notes": [
    "No endpoint names are assumed; the studio proposes the family field mapping from observed data."
  ]
}
```

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
