# File: evidence/r004/lane-d/R004-LOCAL-GATE.json

> Generated 2026-11-19 · JSON · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | evidence/r004/lane-d/R004-LOCAL-GATE.json |
| Language | JSON |
| Kind | config |
| Size | 31782 B |
| Lines | 122 |
| Hash | 0d53625766de |
| Test | no |
| Generated | no |
| Component | evidence |

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
  "schema": "arbor.r004.local-gate/1",
  "profile": "focused",
  "execution": "LOCAL_MACHINE_ONLY",
  "sourceSha": "87c35576f142978a11071737b5815911308901a2",
  "sourceStatus": "PINNED",
  "startedAt": "2026-11-15T18:16:32.530Z",
  "runtime": {
    "node": "v24.22.1",
    "platform": "win32",
    "arch": "x64"
  },
  "privateDataRoot": "ISOLATED_IN_SYSTEM_TEMP",
  "ownerDataTouched": false,
  "browserDom": "UNRUN",
  "physicalAndroid": "UNRUN",
  "independentAcceptance": "UNRUN",
  "releaseAcceptance": "UNRUN",
  "preflight": [],
  "tasks": [
    {
      "id": "queue",
      "command": [
        "node",
        "scripts/roadmap/acceleration-queue.mjs",
        "--check"
      ],
      "status": "PASS",
      "exitCode": 0,
      "signal": null,
      "errorCode": null,
      "durationMs": 327,
      "stdout": "{\n  \"revision\": \"R002\",\n  \"activeBatch\": \"ACCEL-A\",\n  \"l2Count\": 98,\n  \"queueCount\": 9,\n  \"archivedBatchCount\": 1,\n  \"ok\": true,\n  \"ready\": [\n    \"A00\",\n    \"A01\",\n    \"A02\"\n  ]\n}\n",
      "stderr": ""
    },
    {
      "id": "release-truth",
      "command": [
        "node",
        "scripts/roadmap/evidence-truth.mjs",
        "--check"
      ],
      "status": "PASS",
      "exitCode": 0,
      "signal": null,
      "errorCode": null,
      "durationMs": 315,
      "stdout": "{\n  \"schema\": \"arbor.release-truth-projection/2\",\n  \"nature\": \"READ_ONLY_CONFLICT_PROJECTION\",\n  \"releaseReady\": false,\n  \"sourceClaimsSatisfied\": false,\n  \"claimsConsistent\": false,\n  \"disposition\": \"BLOCKED_UNVERIFIED\",\n  \"claims\": {\n    \"promoted\": {\n      \"source\": \"integration/beta-gates.json\",\n      \"status\": \"UNBLOCKED\",\n      \"decision\": \"READY_FOR_INDEPENDENT_Z2_REVIEW\",\n      \"sourceMergeSha\": \"7586f28da8b92713d399040db4a02d505bc7cf1\"\n    },\n    \"proposal\": {\n      \"source\": \".integration/proposal5/08-BETA-GATES.json\",\n      \"status\": \"PROPOSED_UNRUN\"\n    },\n    \"release\": {\n      \"source\": \"integration/release-manifest.json\",\n      \"status\": \"BLOCKED_NOT_BUILT\",\n      \"sourceMerge\": \"0b3474a5cb2053d607453b18d319d225f1d3ca57\"\n    }\n  },\n  \"conflictingClaims\": true,\n  \"conflicts\": [\n    {\n      \"code\": \"UNBLOCKED_VS_PROPOSAL_UNRUN\",\n      \"sources\": [\n        \"integration/beta-gates.json\",\n        \".integration/proposal5/08-BETA-GATES.json\"\n      ]\n    },\n    {\n      \"code\": \"UNBLOCKED_VS_RELEASE_BLOCKED\",\n      \"sources\": [\n        \"integration/beta-gates.json\",\n        \"integration/release-manifest.json\"\n      ]\n    },\n    {\n      \"code\": \"PROMOTED_GATES_VS_UNRUN_PROPOSAL\",\n      \"gateIds\": [\n        \"G01\",\n        \"G02\",\n        \"G03\",\n        \"G04\",\n        \"G05\",\n        \"G06\",\n        \"G07\",\n        \"G08\",\n        \"G09\",\n        \"G10\",\n        \"G11\",\n        \"G12\",\n        \"G13\"\n      ],\n      \"count\": 13,\n      \"sources\": [\n        \"integration/beta-gates.json\",\n        \".integration/proposal5/08-BETA-GATES.json\"\n      ]\n    },\n    {\n      \"code\": \"EXECUTED_OR_RELEASE_CLAIM_VS_ZERO_CI_JOBS\",\n      \"runId\": 43334607434,\n      \"conclusion\": \"startup_failure\",\n      \"jobs\": 0,\n      \"source\": \"integration/beta-gates.json\"\n    },\n    {\n      \"code\": \"INCONSISTENT_MERGE_SHA\",\n      \"promoted\": \"7586f28da8b92713d399040db4a02d505bc7cf1\",\n      \"release\": \"dc2ae81103925b18d962ff6c53d14c6a470b9f79\",\n      \"sources\": [\n        \"integration/beta-gates.json\",\n        \"integration/release-manifest.json\"\n      ]\n    },\n    {\n      \"code\": \"G12_ACCEPTED_CLAIM_ADMITS_UNRUN\",\n      \"source\": \"integration/beta-gates.json\",\n      \"gateId\": \"G12\"\n    }\n  ],\n  \"blockers\": [\n    {\n      \"code\": \"PROPOSAL_GATES_UNRUN\",\n      \"count\": 14,\n      \"gateIds\": [\n        \"G00\",\n        \"G01\",\n        \"G02\",\n        \"G03\",\n        \"G04\",\n        \"G05\",\n        \"G06\",\n        \"G07\",\n        \"G08\",\n        \"G09\",\n        \"G10\",\n        \"G11\",\n        \"G12\",\n        \"G13\"\n      ],\n      \"detail\": \"A missing/UNRUN gate, absent receipt or unaccepted owner gate is not a pass\"\n    },\n    {\n      \"code\": \"RELEASE_NOT_ACCEPTED\",\n      \"manifestStatus\": \"BLOCKED_NOT_BUILT\",\n      \"securityAccepted\": false,\n      \"deviceAccepted\": false,\n      \"noDonorBuildAccepted\": false,\n      \"releaseAllowed\": false\n    },\n    {\n      \"code\": \"CI_STARTUP_FAILURE_ZERO_JOBS\",\n      \"sources\": [\n        \"integration/beta-gates.json\",\n        \"integration/release-manifest.json\"\n      ],\n      \"detail\": \"Workflow never launched test jobs; do not infer a process exit or passing checks\"\n    },\n    {\n      \"code\": \"PHYSICAL_DEVICE_EVIDENCE_UNRUN\",\n      \"androidPwa\": \"UNRUN\",\n      \"ownerAccepted\": false\n    }\n  ],\n  \"evidence\": {\n    \"nodeTests\": \"NOT_EXECUTED_BY_THIS_READ_ONLY_PROJECTION\",\n    \"ci\": \"LEDGERS_REPORT_STARTUP_FAILURE_ZERO_JOBS\",\n    \"browserDom\": \"UNRUN\",\n    \"physicalDevice\": \"UNRUN\",\n    \"independentKeeperReceipt\": \"UNRUN\",\n    \"ownerAcceptance\": \"UNRUN\"\n  },\n  \"historicalReceiptsPreserved\": true,\n  \"evidenceIsNotReleasePermission\": true,\n  \"note\": \"Consistent ledgers are not independent Node/browser/device receipts. No gate, roadmap or release manifest was mutated.\"\n}\n",
      "stderr": ""
    },
    {
      "id": "host-unit",
      "command": [
        "node",
        "--test",
        "apps/vivim-host/test/product-journal.test.mjs",
        "apps/vivim-host/test/product-routes.test.mjs",
        "apps/vivim-host/test/chat-box-baseline.test.mjs"
      ],
      "status": "PASS",
      "exitCode": 0,
      "signal": null,
      "errorCode": null,
      "durationMs": 1849,
      "stdout": "✔ canonical chat and Wiki pages serve external CSP-compatible JS/CSS (201.1135ms)\n✔ state and Wiki read from one typed source-backed projection (50.4626ms)\n✔ human and AI post same typed envelope through the single Host interpreter (219.0996ms)\n✔ invalid chat envelopes fail closed without touching state (40.2901ms)\n✔ Wiki edit needs explicit local-origin action, owner capability and a fresh revision (82.5652ms)\n✔ catalog enumeration is source-backed; unavailable actions are not called executable (2.9781ms)\n✔ demo feedback and product journaling use one append path without executing gates (60.1476ms)\n✔ pure replay is deterministic and does not mutate seeds (12.3978ms)\n✔ fsynced append, private dataRoot isolation, restart and all read surfaces agree (80.7554ms)\n✔ same revision concurrent attempts across two instances: one commit one 409 (31.3314ms)\n✔ typed envelope, actor, payload size, unknown effect keys, CAS and paths refused (38.387ms)\n✔ torn tail replays committed prefix, exposes only committed JSONL, refuses next append (45.5535ms)\n✔ corrupt middle, duplicated entry, out-of-order revision, and corrupt UTF-8 fail closed (47.2386ms)\n✔ write failure leaves original records unchanged and reports failure (37.7304ms)\n✔ legacy feedback and gate records remain read-only and replayable (36.5519ms)\n✔ batch-1 product routes: pages, baseline JSON, read-throughs, mutate append, 404 tail (586.0214ms)\nℹ tests 16\nℹ suites 0\nℹ pass 16\nℹ fail 0\nℹ cancelled 0\nℹ skipped 0\nℹ todo 0\nℹ duration_ms 1555.639\n",
      "stderr": ""
    },
    {
      "id": "wiki-feedback",
      "command": [
        "node",
        "--test",
        "apps/vivim-host/test/wiki-visual-contract.test.mjs",
        "scripts/batch-evidence/wiki-evidence-regression.test.mjs",
        "scripts/roadmap/evidence-truth.test.mjs",
        "scripts/feedback-loop/compiler.test.mjs",
        "scripts/acceleration/w1-integration-contract.test.mjs"
      ],
      "status": "PASS",
      "exitCode": 0,
```

_First 80 of 123 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
