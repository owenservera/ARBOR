# File: contracts/chronos/staged-contract.v1.json

> Generated 2026-11-19 · JSON · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | contracts/chronos/staged-contract.v1.json |
| Language | JSON |
| Kind | config |
| Size | 1090 B |
| Lines | 15 |
| Hash | 7c466a042762 |
| Test | no |
| Generated | no |
| Component | contracts |

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
  "schema": "vivim.chronos.contract/1",
  "status": "staged_not_activated",
  "rust": {"interface": "vivim.chronos/1", "slot": "utility:chronos", "compute": "read_only"},
  "readModels": {
    "conversation": "vivim.chronos.conversation-read/1",
    "supervisor": "vivim.chronos.supervisor-read/1",
    "tierflow": "vivim.chronos.visual-read/1"
  },
  "time": {"wall": "utc_epoch_milliseconds_i64", "duration": "monotonic_for_runtime_wall_for_unverified_projection", "timezone": "iana_not_yet_implemented", "interval": "fixed_duration_only"},
  "subjects": ["task", "conversation", "session", "automation", "agent", "workflow", "device", "data"],
  "operations": ["now", "duration", "deadline", "next", "window", "elapsed", "freshness", "heartbeat", "retry", "due"],
  "nonAuthority": {"dueIsGrant": false, "timelineIsReceipt": false, "uiCanExecute": false, "timeReadCanSend": false},
  "requireProductionGates": ["persisted_schedule_CAS", "host_scoped_grants", "cross_process_claims", "crash_uncertain_reconcile", "timezone_DST", "windows_host_e2e", "physical_android"]
}
```

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
