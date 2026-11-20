# File: studio/families/article.json

> Generated 2026-11-19 · JSON · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | studio/families/article.json |
| Language | JSON |
| Kind | config |
| Size | 1750 B |
| Lines | 33 |
| Hash | 4cea453c350e |
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
  "name": "article",
  "version": 2,
  "description": "Mostly static structured pages: articles, docs and product pages with headings, text and media.",
  "members": [],
  "detect": [
    { "signal": "headings_outline", "minHeadings": 2, "weight": 0.3, "label": "a heading outline" },
    { "signal": "media", "weight": 0.25, "label": "images, video or downloads" },
    { "signal": "static_long_text", "weight": 0.35, "label": "long text without streaming" },
    { "signal": "text_length", "minChars": 2000, "weight": 0.15, "label": "a long body of text" },
    { "signal": "streaming_transport", "not": true, "weight": 0.15, "label": "no streaming transport", "whyNot": "no SSE/NDJSON/WebSocket stream was observed" },
    { "signal": "many_small_updates", "minEvents": 40, "maxAvgBytes": 400, "not": true, "weight": 0.05, "label": "not an update stream", "whyNot": "no high-frequency small-update traffic" }
  ],
  "entities": {
    "page": {
      "fields": {
        "title": { "type": "string", "names": ["title", "headline", "name"] },
        "url": { "type": "url", "names": ["url", "canonical", "permalink"] },
        "author": { "type": "string", "names": ["author", "byline", "author.name"] },
        "published_at": { "type": "time", "names": ["published_at", "datePublished", "created_at", "date"] },
        "blocks": { "type": "blocks" }
      }
    },
    "media_item": {
      "embeddedIn": "page",
      "fields": {
        "kind": { "type": "enum", "values": ["image", "video", "audio", "file"] },
        "url": { "type": "url", "names": ["url", "src", "href", "download_url"] },
        "caption": { "type": "text", "names": ["caption", "alt", "title", "description"] }
      }
    }
  }
}
```

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
