# File: tests/migration/W01-F-ledger.v1.json

> Generated 2026-11-19 · JSON · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | tests/migration/W01-F-ledger.v1.json |
| Language | JSON |
| Kind | config |
| Size | 10329 B |
| Lines | 199 |
| Hash | 8dafba317911 |
| Test | yes |
| Generated | no |
| Component | tests |

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
  "schema": "arbor.w01f.migration-ledger/1",
  "proposalBaseSha": "dd245d78ff3c110ba8630cad557ea0479c51a635",
  "branch": "work/p5-w01-f-verify",
  "sharedIntegrationBranch": "integrate/proposal5-beta-r001",
  "sharedIntegrationHeadObserved": null,
  "basePolicy": "provisional isolated branch; W0-G source lock unavailable; G must reconcile before merge",
  "sourceCommits": {
    "labs": "022608f5797e7b4a14ccc4c393bd3c5a4704a4be",
    "host": "cae97afe848d79957c9d6c698a90996a758bfd56",
    "hq": "9b922ea049dbadc94e504b5b9432743995c020ca",
    "tierflow": "50822f11ee63c3d80f631f8fea7dcb9b19bffc38"
  },
  "entries": [
    {
      "sourceRepo": "owenservera/vivim-labs",
      "sourceCommit": "022608f5797e7b4a14ccc4c393bd3c5a4704a4be",
      "sourcePath": "vivim/voice-to-tasks/workbench/fixtures.json",
      "sourceSha": "49c0a1fab872353aa24c5861f5dccf71bbefe32d",
      "targetPath": "tests/fixtures/labs/voice-to-tasks/fixtures.json",
      "ownerDecision": "owner-selected bounded contract/fixture from Proposal 5",
      "implementationStatus": "VERIFIED",
      "privacyClass": "synthetic-or-public-contract",
      "requiredTransform": "none; source-preserving tested fixture",
      "testEvidence": "source-side evidence only; ARBOR run pending",
      "retirementCondition": "replace when owning runtime supplies integrated accepted tests"
    },
    {
      "sourceRepo": "owenservera/vivim-labs",
      "sourceCommit": "022608f5797e7b4a14ccc4c393bd3c5a4704a4be",
      "sourcePath": "vivim/voice-to-tasks/workbench/trace-check.mjs",
      "sourceSha": "af25ab69cae6169c27246414b7ab52c60d2b5c78",
      "targetPath": "tests/fixtures/labs/voice-to-tasks/trace-check.mjs",
      "ownerDecision": "owner-selected bounded contract/fixture from Proposal 5",
      "implementationStatus": "VERIFIED",
      "privacyClass": "synthetic-or-public-contract",
      "requiredTransform": "none; source-preserving tested fixture",
      "testEvidence": "source-side evidence only; ARBOR run pending",
      "retirementCondition": "replace when owning runtime supplies integrated accepted tests"
    },
    {
      "sourceRepo": "owenservera/vivim-labs",
      "sourceCommit": "022608f5797e7b4a14ccc4c393bd3c5a4704a4be",
      "sourcePath": "capability-observatory/data/capabilities.json",
      "sourceSha": "4c5876bd40d727b6e7464f71dbe23679f5558f8a",
      "targetPath": "tests/fixtures/labs/capability-observatory/seed.json",
      "ownerDecision": "owner-selected bounded contract/fixture from Proposal 5",
      "implementationStatus": "VERIFIED",
      "privacyClass": "synthetic-or-public-contract",
      "requiredTransform": "none; source-preserving tested fixture",
      "testEvidence": "source-side evidence only; ARBOR run pending",
      "retirementCondition": "replace when owning runtime supplies integrated accepted tests"
    },
    {
      "sourceRepo": "owenservera/vivim-labs",
      "sourceCommit": "022608f5797e7b4a14ccc4c393bd3c5a4704a4be",
      "sourcePath": "capability-observatory/schemas/capabilities.schema.json",
      "sourceSha": "e2d9437e9560b813a2a9cfb255344c287b645903",
      "targetPath": "tests/fixtures/labs/capability-observatory/schema.json",
      "ownerDecision": "owner-selected bounded contract/fixture from Proposal 5",
      "implementationStatus": "VERIFIED",
      "privacyClass": "synthetic-or-public-contract",
      "requiredTransform": "none; source-preserving tested fixture",
      "testEvidence": "source-side evidence only; ARBOR run pending",
      "retirementCondition": "replace when owning runtime supplies integrated accepted tests"
    },
    {
      "sourceRepo": "owenservera/vivim-labs",
      "sourceCommit": "022608f5797e7b4a14ccc4c393bd3c5a4704a4be",
      "sourcePath": "chronos-toolkit/wave2/repos-hq/contracts/chronos/contract.v1.json",
      "sourceSha": "a74a612458e1854a95bc8331e6ed14747fec2742",
      "targetPath": "contracts/chronos/staged-contract.v1.json",
      "ownerDecision": "owner-selected bounded contract/fixture from Proposal 5",
      "implementationStatus": "PREVIEW",
      "privacyClass": "synthetic-or-public-contract",
      "requiredTransform": "none; source-preserving tested fixture",
      "testEvidence": "source-side evidence only; ARBOR run pending",
      "retirementCondition": "replace when owning runtime supplies integrated accepted tests"
    },
    {
```

_First 80 of 200 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
