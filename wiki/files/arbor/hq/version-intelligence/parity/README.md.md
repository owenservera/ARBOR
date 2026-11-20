# File: hq/version-intelligence/parity/README.md

> Generated 2026-11-19 · Markdown · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/version-intelligence/parity/README.md |
| Language | Markdown |
| Kind | doc |
| Size | 1476 B |
| Lines | 8 |
| Hash | c4a9e89fd43d |
| Test | no |
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

```markdown
# HQ Version Intelligence — Lane D parity atlas
Pure pinned-source migration classifier. No GitHub calls, filesystem reads, SQL/graph writes, actions, browser interaction or personal data.

`buildParityAtlas({donor,target,owners,sourceEvidence,testReceipts,ownerDecisions})` accepts already-authorized immutable source manifests `{repo,commitSha,completeness,scope:'development',entries:[{path,blobSha,kind}]}`. `sourceEvidence` uses explicit IDs, types and exact source pin+blob; `ownerDecisions` require an explicit matching owner, acceptance and evidence IDs. The output is deterministic by sorted path and includes evidence-linked per-file source/capability states, inspected-file coverage and a reproducibility digest.

**Guardrails:** exact source blob or relocation does not prove behavior; incomplete target scans cannot establish physical absence; historical test files are not executed receipts; explicit tombstone owner evidence is necessary for exclusion. Host grants and receipts are external authorities — this library cannot authenticate caller-supplied receipt claims and NEVER promotes a row to RUNTIME_VERIFIED; Host H and independent runtime referees alone decide that gate. No runtime acceptance is asserted by this module.

Run: `node --test hq/version-intelligence/parity/atlas.test.mjs` (Node 24 integration gate is separate). Source-only evaluation is **PREPARED_NOT_PROMOTED** until G1 verifies all shared contracts and operational tests.
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
