# File: contracts/hq-version-intelligence/examples/comparison.example.json

> Generated 2026-11-19 · JSON · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | contracts/hq-version-intelligence/examples/comparison.example.json |
| Language | JSON |
| Kind | config |
| Size | 1372 B |
| Lines | 52 |
| Hash | c8e3d4822958 |
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
  "schema": "arbor.hvi.comparison/1",
  "targetPinId": "owenservera/ARBOR@f9823a5131e73e7562db5a4ec14e1ec481557d69",
  "sourcePins": [
    "owenservera/ARBOR@f9823a5131e73e7562db5a4ec14e1ec481557d69",
    "owenservera/repos-hq@9b922ea049dbadc94e504b5b9432743995c020ca"
  ],
  "coverage": {
    "completeness": "partial",
    "observed": 1,
    "expected": null,
    "truncated": true,
    "reason": "synthetic example; not a live scan"
  },
  "summary": {
    "source": "INCOMPLETE",
    "capability": "INCOMPLETE",
    "runtime": "UNVERIFIED"
  },
  "sourceDeltas": [
    {
      "id": "hq/path:missing",
      "pinId": "owenservera/repos-hq@9b922ea049dbadc94e504b5b9432743995c020ca",
      "status": "UNOBSERVABLE",
      "evidenceRefs": [
        "S0:MECHANICAL-PARITY"
      ]
    }
  ],
  "capabilityDeltas": [],
  "identityCandidates": [],
  "authorityConflicts": [],
  "unported": [],
  "intentionallyExcluded": [],
  "unobserved": [
    "hq/path:missing"
  ],
  "runtimeProof": [],
  "mergePlan": [],
  "evidenceIndex": [
    "S0:MECHANICAL-PARITY"
  ],
  "limits": {
    "maxPins": 64,
    "maxEntries": 100000,
    "maxBlobBytes": 1500000,
    "truncated": true
  },
  "errors": [],
  "reproducibilityDigest": "0000000000000000000000000000000000000000000000000000000000000000",
  "owner": "HQ-development"
}
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
