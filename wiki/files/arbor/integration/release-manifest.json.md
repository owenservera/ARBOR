# File: integration/release-manifest.json

> Generated 2026-11-19 · JSON · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../projects/arbor.md) |
| Path | integration/release-manifest.json |
| Language | JSON |
| Kind | config |
| Size | 1654 B |
| Lines | 54 |
| Hash | 5aa89fd9521b |
| Test | no |
| Generated | no |
| Component | integration |

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
  "schema": "arbor.proposal5.beta-release/1",
  "version": "0.1.0",
  "status": "BLOCKED_NOT_BUILT",
  "platforms": {
    "windowsTauri": "UNRUN",
    "androidPwa": "UNRUN",
    "androidApk": "DEFERRED"
  },
  "authoritativeEffectOwner": "apps/vivim-host",
  "runtimeNodeMin": "24",
  "sourceLock": "integration/source-lock.json",
  "sourceMerge": "0b3474a5cb2053d607453b18d319d225f1d3ca57",
  "securityAccepted": false,
  "deviceAccepted": false,
  "noDonorBuildAccepted": false,
  "artifacts": [],
  "rollback": {
    "strategy": "revert G merge commits in reverse order on integration branch only; preserve frozen A-F refs",
    "tested": false
  },
  "w01gR001": {
    "rootLockfiles": "ABSENT",
    "packagerSource": "PRESENT_UNRUN",
    "packagedNode24": "ABSENT",
    "tauriPwaOnlyConfig": "SOURCE_MERGED_UNTESTED",
    "windowsMsi": "UNRUN",
    "donorRemoval": "UNRUN",
    "sourceClosure": "UNRUN",
    "nextWaveApproved": false,
    "bPwaSignerStaticRoute": "MERGED_UNTESTED",
    "canonicalMainPr": 10
  },
  "mainConsolidation": {
    "pr": 10,
    "sourceOnly": true,
    "ciRunId": 43233248631,
    "ciConclusion": "startup_failure",
    "ciJobs": 0,
    "merged": true,
    "cargoLock": "ABSENT",
    "bunLock": "ABSENT",
    "betaGo": false,
    "nextWaveAcceptedSha": null,
    "securityAndDeviceUnrun": true,
    "toolchainTests": "UNRUN",
    "deploymentAuthorized": false,
    "mergeCommit": "dc2ae81103925b18d962ff6c53d14c6a470b9f79",
    "canonicalDevelopmentBranch": "main",
    "releaseAllowed": false,
    "checks": "UNRUN/STARTUP_FAILURE"
  },
  "sourceBranch": "main"
}
```

---

[HQ wiki](../../../index.md) · [Symbols](../../../symbols.md) · [Dependency graph](../../../graph.md) · [Documentation](../../../docs.md) · [Changes](../../../changes.md) · [Open tasks](../../../todos.md) · [Deprecated](../../../deprecated.md) · [Agent annotation protocol](../../../protocol.md) · [Glossary](../../../glossary.md) · [Using HQ](../../../context.md) · [Capabilities](../../../capabilities.md) · [Search index](../../../search.json) · [Browser view](../../../index.html)
