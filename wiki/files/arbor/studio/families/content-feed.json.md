# File: studio/families/content-feed.json

> Generated 2026-11-19 · JSON · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | studio/families/content-feed.json |
| Language | JSON |
| Kind | config |
| Size | 2652 B |
| Lines | 40 |
| Hash | e119d3cfb4da |
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
  "name": "content-feed",
  "version": 2,
  "description": "Paginated or infinite-scroll lists of items such as posts, results or products.",
  "members": [],
  "detect": [
    { "signal": "pagination", "weight": 0.4, "label": "the same endpoint is fetched page by page" },
    { "signal": "collection_with", "fields": ["title|name|headline", "url|href|link|permalink", "time|date|created|published"], "weight": 0.3, "label": "items with title, link and date" },
    { "signal": "scroll_then_fetch", "weight": 0.3, "label": "scrolling loads more data" },
    { "signal": "cursor_pagination", "weight": 0.3, "label": "cursor or continuation token paging" },
    { "signal": "collection", "minItems": 5, "weight": 0.2, "label": "repeated item records" },
    { "signal": "identity_graph", "minLinks": 1, "weight": 0.1, "label": "items reference a parent (author, board, channel)" },
    { "signal": "streaming_text", "minRevisions": 8, "minChars": 400, "not": true, "weight": 0.05, "label": "not a single streamed document", "whyNot": "no long document was assembled from deltas" }
  ],
  "entities": {
    "item": {
      "key": "id",
      "openFields": true,
      "fields": {
        "id": { "type": "id", "required": true, "names": ["id", "uuid", "slug", "key"] },
        "title": { "type": "string", "required": true, "names": ["title", "name", "headline", "label"], "prefer": "longest" },
        "url": { "type": "url", "names": ["url", "href", "link", "permalink"] },
        "published_at": { "type": "time", "names": ["published_at", "created_at", "date", "time", "timestamp"] },
        "author": { "type": "string", "names": ["author", "author.name", "user", "by"] },
        "summary": { "type": "text", "names": ["summary", "excerpt", "description", "snippet", "body"] },
        "media_url": { "type": "url", "names": ["image", "image_url", "thumbnail", "thumbnail_url", "cover"] },
        "score": { "type": "number", "names": ["score", "votes", "likes", "rating", "points"] },
        "comments": { "type": "number", "names": ["comments", "comment_count", "replies", "reply_count"] },
        "parent_id": { "type": "id", "names": ["parent_id", "channel_id", "board_id", "subreddit_id", "group_id"] }
      }
    },
    "page": {
      "fields": {
        "cursor": { "type": "string", "names": ["cursor", "next_cursor", "end_cursor", "next_page_token", "continuation"] },
        "has_more": { "type": "boolean", "names": ["has_more", "hasMore", "has_next_page", "more"] },
        "total": { "type": "number", "names": ["total", "total_count", "count", "num_results"] }
      }
    }
  }
}
```

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
