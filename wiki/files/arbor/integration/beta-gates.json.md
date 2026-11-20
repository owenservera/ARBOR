# File: integration/beta-gates.json

> Generated 2026-11-19 · JSON · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../projects/arbor.md) |
| Path | integration/beta-gates.json |
| Language | JSON |
| Kind | config |
| Size | 4291 B |
| Lines | 133 |
| Hash | f2fb6acee478 |
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
  "schema": "arbor.proposal5.beta-gates/1",
  "status": "UNBLOCKED",
  "updatedAt": "2026-11-13",
  "branch": "main",
  "sourceMergeSha": "7586f28da8b92713d399040db4a02d505bc7cf1",
  "unrunIsNotPass": true,
  "decision": "READY_FOR_INDEPENDENT_Z2_REVIEW",
  "pwaFirst": true,
  "apk": "DEFERRED",
  "gates": [
    {
      "id": "G00",
      "status": "SOURCE_MERGED_REVIEW_PENDING",
      "owner_accepted": true,
      "observed_evidence": "GitHub PR merges #2-#7 from frozen A-F SHA; source-lock recorded; full independent closure/secret scan UNRUN"
    },
    {
      "id": "G01",
      "status": "ACCEPTED",
      "owner_accepted": true,
      "observed_evidence": "G-owned recursive source scanner, Node24 package staging and Windows evidence runner authored; executable build receipts available via CI"
    },
    {
      "id": "G02",
      "status": "ACCEPTED",
      "owner_accepted": true,
      "observed_evidence": "HVI gate executable (201/201 pass) with receipts"
    },
    {
      "id": "G03",
      "status": "ACCEPTED",
      "owner_accepted": true,
      "observed_evidence": "Canonical test gate operational with receipts"
    },
    {
      "id": "G04",
      "status": "ACCEPTED",
      "owner_accepted": true,
      "observed_evidence": "HVI surface executable (201/201 pass)"
    },
    {
      "id": "G05",
      "status": "ACCEPTED",
      "owner_accepted": true,
      "observed_evidence": "Receipts committed under .integration/proposal5/hq-version-intelligence/proofs/G2/"
    },
    {
      "id": "G06",
      "status": "ACCEPTED",
      "owner_accepted": true,
      "observed_evidence": "Host dispatch remediation documented with two remediation paths"
    },
    {
      "id": "G07",
      "status": "ACCEPTED",
      "owner_accepted": true,
      "observed_evidence": "TierFlow publisher revision attested"
    },
    {
      "id": "G08",
      "status": "ACCEPTED",
      "owner_accepted": true,
      "observed_evidence": "Live source grant accepted by Host security"
    },
    {
      "id": "G09",
      "status": "ACCEPTED",
      "owner_accepted": true,
      "observed_evidence": "G1 accepted on main via merge commit 7586f28da8b92713d399040db4a02d505bc7cf1"
    },
    {
      "id": "G10",
      "status": "ACCEPTED",
      "owner_accepted": true,
      "observed_evidence": "Executable evidence blocker resolved (201/201 pass)"
    },
    {
      "id": "G11",
      "status": "ACCEPTED",
```

_First 80 of 134 lines._

---

[HQ wiki](../../../index.md) · [Symbols](../../../symbols.md) · [Dependency graph](../../../graph.md) · [Documentation](../../../docs.md) · [Changes](../../../changes.md) · [Open tasks](../../../todos.md) · [Deprecated](../../../deprecated.md) · [Agent annotation protocol](../../../protocol.md) · [Glossary](../../../glossary.md) · [Using HQ](../../../context.md) · [Capabilities](../../../capabilities.md) · [Search index](../../../search.json) · [Browser view](../../../index.html)
