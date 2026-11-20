# File: apps/vivim-host/control/heldout.v1.json

> Generated 2026-11-19 · JSON · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/control/heldout.v1.json |
| Language | JSON |
| Kind | config |
| Size | 9854 B |
| Lines | 511 |
| Hash | 483085739ece |
| Test | no |
| Generated | no |
| Component | vivim-host |

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
 "schema": "vivim.control-heldout/1",
 "note": "Held-out phrasings written BEFORE the first scoring run and not used to tune the parser. Used by the UTC maturity scorer (LNG-03..06). Replace/extend with real owner phrasing from an opt-in miss log (LRN-04) when it exists. Do not tune against these cases; add new unseen ones instead.",
 "cases": [
  {
   "text": "can you switch my theme over to ember",
   "tags": [
    "paraphrase"
   ],
   "note": "",
   "outcome": "candidate",
   "actionId": "ui.theme.set_preset",
   "args": {
    "preset": "ember"
   }
  },
  {
   "text": "I'd like the dusk look please",
   "tags": [
    "paraphrase"
   ],
   "note": "",
   "outcome": "candidate",
   "actionId": "ui.theme.set_preset",
   "args": {
    "preset": "dusk"
   }
  },
  {
   "text": "make everything ink",
   "tags": [
    "paraphrase"
   ],
   "note": "",
   "outcome": "candidate",
   "actionId": "ui.theme.set_preset",
   "args": {
    "preset": "ink"
   }
  },
  {
   "text": "switch to the grove theme",
   "tags": [
    "paraphrase"
   ],
   "note": "",
   "outcome": "candidate",
   "actionId": "ui.theme.set_preset",
   "args": {
    "preset": "grove"
   }
  },
  {
   "text": "go back to my previous theme",
   "tags": [
    "paraphrase"
   ],
   "note": "",
   "outcome": "candidate",
   "actionId": "ui.theme.undo",
   "args": {}
  },
  {
   "text": "put my theme back how it was",
   "tags": [
    "paraphrase"
   ],
   "note": "",
   "outcome": "candidate",
   "actionId": "ui.theme.undo",
   "args": {}
  },
  {
   "text": "what theme am I using",
   "tags": [
    "paraphrase"
   ],
   "note": "",
   "outcome": "candidate",
   "actionId": "ui.theme.show",
```

_First 80 of 511 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
