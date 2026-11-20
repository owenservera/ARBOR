# File: tests/migration/W01-F-proof.v1.json

> Generated 2026-11-19 · JSON · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | tests/migration/W01-F-proof.v1.json |
| Language | JSON |
| Kind | config |
| Size | 1562 B |
| Lines | 57 |
| Hash | 32c774e91fac |
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
  "schema": "arbor.w01f.evidence/1",
  "date": "2026-11-12",
  "branch": "work/p5-w01-f-verify",
  "sourceCommitTested": "43cf1edaf87d7b6d52c1e64ccdee597656700beb",
  "scope": "pure authored contract assertions and donor file equality; no real product/device tests",
  "checks": {
    "pureV8ContractSmoke": {
      "status": "PASS",
      "passed": 25,
      "total": 25,
      "environment": "isolated connector V8; no Node modules"
    },
    "donorByteParity": {
      "status": "PASS",
      "identical": 7,
      "total": 7,
      "donorRepo": "owenservera/vivim-labs",
      "donorRef": "main"
    },
    "jsonParseAndGeneratorChecks": {
      "status": "PASS",
      "notes": "precommit JSON.parse + test-only Host catalog baseline count"
    },
    "nodeTest": {
      "status": "NOT_RUN"
    },
    "cargoAndRustc": {
      "status": "NOT_RUN"
    },
    "windowsInstall": {
      "status": "NOT_RUN"
    },
    "physicalPwa": {
      "status": "NOT_RUN"
    },
    "providerE2e": {
      "status": "NOT_RUN"
    },
    "donorRemoval": {
      "status": "NOT_RUN"
    },
    "fullPrivacyAudit": {
      "status": "NOT_RUN"
    }
  },
  "defectFixed": {
    "description": "overescaped control-character regex",
    "fixCommit": "43cf1edaf87d7b6d52c1e64ccdee597656700beb"
  },
  "acceptance": "NOT_GO",
  "reasons": [
    "shared W0-G integration baseline missing",
    "Node/Cargo/Windows/PWA/signed-in E2E unrun",
    "Host and TierFlow donor imports still in disjoint worker branches"
  ]
}
```

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
