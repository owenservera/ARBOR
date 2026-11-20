# File: apps/vivim-host/control/corpus.v1.json

> Generated 2026-11-19 · JSON · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/control/corpus.v1.json |
| Language | JSON |
| Kind | config |
| Size | 6036 B |
| Lines | 280 |
| Hash | 9ac9e409a5ad |
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
 "schema": "vivim.control-corpus/1",
 "note": "Golden semantic corpus for UTC02. Sources: UTC-V1 examples, Omega NCLL gap-narrowing design, AION SEMANTIC-CONTRACT E2/E3.",
 "cases": [
  {
   "text": "Set my theme to dusk",
   "outcome": "candidate",
   "note": "plain",
   "actionId": "ui.theme.set_preset",
   "args": {
    "preset": "dusk"
   }
  },
  {
   "text": "Use ink theme",
   "outcome": "candidate",
   "note": "plain",
   "actionId": "ui.theme.set_preset",
   "args": {
    "preset": "ink"
   }
  },
  {
   "text": "change my theme to grove",
   "outcome": "candidate",
   "note": "plain",
   "actionId": "ui.theme.set_preset",
   "args": {
    "preset": "grove"
   }
  },
  {
   "text": "theme ember",
   "outcome": "candidate",
   "note": "terse",
   "actionId": "ui.theme.set_preset",
   "args": {
    "preset": "ember"
   }
  },
  {
   "text": "/theme ember",
   "outcome": "candidate",
   "note": "symbolic",
   "actionId": "ui.theme.set_preset",
   "args": {
    "preset": "ember"
   }
  },
  {
   "text": "sett theme to ember",
   "outcome": "candidate",
   "note": "fuzzy verb",
   "actionId": "ui.theme.set_preset",
   "args": {
    "preset": "ember"
   }
  },
  {
   "text": "!set theme to ember",
   "outcome": "candidate",
   "note": "force modifier is meaning only",
   "actionId": "ui.theme.set_preset",
   "args": {
    "preset": "ember"
   }
  },
  {
   "text": "Undo my theme",
   "outcome": "candidate",
   "note": "plain",
   "actionId": "ui.theme.undo",
   "args": {}
  },
  {
   "text": "revert the theme",
   "outcome": "candidate",
   "note": "synonym",
   "actionId": "ui.theme.undo",
   "args": {}
```

_First 80 of 280 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
