# File: docs/research/nim-models/raw/20261116T134100Z-local-model-usage-aggregates.json

> Generated 2026-11-19 · JSON · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | docs/research/nim-models/raw/20261116T134100Z-local-model-usage-aggregates.json |
| Language | JSON |
| Kind | config |
| Size | 52920 B |
| Lines | 2443 |
| Hash | 5ede2e422a9e |
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
 "type": "local-db",
 "source": "bun:sqlite readonly C:\\Users\\VIVIM.inc/.zcode/cli/db/db.sqlite",
 "table": "model_usage",
 "pulledAt": "2026-11-16T14:38:46.185Z",
 "method": "bun model-usage-query.mjs (read-only SELECTs; started_at epoch ms; model_id stored WITHOUT provider prefix)",
 "aggregates": {
  "tables": [
   {
    "name": "dwf_actor"
   },
   {
    "name": "dwf_event"
   },
   {
    "name": "dwf_node"
   },
   {
    "name": "dwf_run"
   },
   {
    "name": "input_history"
   },
   {
    "name": "local_setting"
   },
   {
    "name": "message"
   },
   {
    "name": "model_usage"
   },
   {
    "name": "part"
   },
   {
    "name": "permission"
   },
   {
    "name": "schema_migration"
   },
   {
    "name": "session"
   },
   {
    "name": "session_entry"
   },
   {
    "name": "session_input"
   },
   {
    "name": "session_purge"
   },
   {
    "name": "session_runtime_presence"
   },
   {
    "name": "session_target"
   },
   {
    "name": "session_task_link"
   },
   {
    "name": "sqlite_sequence"
   },
   {
    "name": "todo"
   },
   {
    "name": "tool_usage"
   },
   {
    "name": "turn_usage"
   },
   {
    "name": "workflow_activity"
   },
   {
    "name": "workflow_definition"
   },
```

_First 80 of 2443 lines._

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
