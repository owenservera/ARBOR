# File: hq/aii/fixtures/HQ-031-machine-snapshot.json

> Generated 2026-11-19 · JSON · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/aii/fixtures/HQ-031-machine-snapshot.json |
| Language | JSON |
| Kind | config |
| Size | 1514 B |
| Lines | 21 |
| Hash | 65c9cd755268 |
| Test | yes |
| Generated | no |
| Component | hq |

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
  "schema": "hq.machine-snapshot/1",
  "generatedAt": "2026-11-11T00:00:00Z",
  "platform": "win32",
  "processes": [
    { "pid": 0, "name": "System Idle Process", "executablePath": null, "session": "Services", "memUsage": "8 K" },
    { "pid": 4, "name": "System", "executablePath": null, "session": "", "memUsage": "424 K" },
    { "pid": 3412, "name": "bun.exe", "executablePath": null, "session": "Console", "memUsage": "12 456 K" },
    { "pid": 778, "name": "svchost.exe", "executablePath": null, "session": "Services", "memUsage": "11 236 K" },
    { "pid": 5920, "name": "explorer.exe", "executablePath": null, "session": "Console", "memUsage": "45 102 K" }
  ],
  "services": [
    { "name": "Schedule", "state": "Running", "startMode": "Auto", "pathName": "C:\\WINDOWS\\system32\\svchost.exe -k DcomLaunch", "displayName": "Task Scheduler" },
    { "name": "Spooler", "state": "Stopped", "startMode": "Auto", "pathName": "C:\\WINDOWS\\system32\\spoolsv.exe", "displayName": "Print Spooler" },
    { "name": "windefend", "state": "Running", "startMode": "Auto", "pathName": "C:\\Program Files\\Windows Defender\\MsMpEng.exe", "displayName": "Microsoft Defender Antivirus Service" }
  ],
  "ports": [
    { "protocol": "TCP", "localAddress": "0.0.0.0", "localPort": 51433, "remoteAddress": "0.0.0.0", "state": "LISTENING", "pid": 3412 },
    { "protocol": "TCP", "localAddress": "127.0.0.1", "localPort": 62830, "remoteAddress": "0.0.0.0", "state": "LISTENING", "pid": 5920 }
  ]
}
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
