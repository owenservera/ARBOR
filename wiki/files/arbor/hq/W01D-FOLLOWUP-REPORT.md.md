# File: hq/W01D-FOLLOWUP-REPORT.md

> Generated 2026-11-19 · Markdown · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../projects/arbor.md) |
| Path | hq/W01D-FOLLOWUP-REPORT.md |
| Language | Markdown |
| Kind | doc |
| Size | 7629 B |
| Lines | 137 |
| Hash | a75b98ac3add |
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
# ARBOR P5 — Lane D follow-up integration assessment and HQ-owned patch

**Gate result:** BLOCKED_ON_G_INTEGRATION as observed during this follow-up.
The required integrate/proposal5-beta-r001 ref was absent. The existing
work/p5-w01-d-hq was at 16c590dbd97dc617b783d949268ddc8fb77da2c5.
No work/p5-w02-d-hq branch was created. No merge, rebase or root change.

**This is a disjoint HQ patch on the existing lane branch, NOT a W2 GO.**
G must establish its own combined base and run cross-owner tests.

## Source-preserving internal dependency closure

Preserved original HQ JS/index algorithms, schema, search, semantic registry,
graph observations, context composition, deterministic wiki, capability scan,
support modules, original legacy CLI and focused regression tests.
Original donor: owenservera/repos-hq
9b922ea049dbadc94e504b5b9432743995c020ca.
The W1 physical import contained 315 exact Git blobs. In this patch 314 stay
byte-identical; one original HQ source file, hq/lib/walk.mjs, is adapted to
refuse Git-tracked symlink escapes. Provenance records both blob identities.

Runtime dependency imports are internal relative JS modules under hq/lib,
hq/aii/fixtures, hq/registry, and hq/capabilities/registry.
The ARBOR application-facing entrypoint is hq/lib/arbor-service.mjs, in the
same ARBOR repository. It has no repos-hq process, service, checkout, SQLite
index or external CLI dependency. Legacy hq/bin/hq.mjs remains imported as
source but is not the beta application-facing API; selected historic CLI
subcommands and legacy tests retain non-beta assumptions requiring G audit.

## Boundary contract (Lane B)

createDevIntelligence has an explicit required mode, diagnostic or host.
For host mode, Lane B MUST pass:

- actorId and sessionId from trusted authenticated Host context; never from
  model text, phone input or arbitrary HQ request bodies;
- approvedRoots from Host-owned consent/grant state (exact canonical local
  development project roots, not arbitrary parent directories);
- authorize callback that returns true only if the current Host actor/session
  has the corresponding source-operation permission and is not revoked.

Each request receives operation, domain=development, sourceId (a stable
dev-source:SHA256 of a canonical root path), and sourceRoot.
A stored project registration is NOT a grant. Callback denial rejects.
There is no new authorization database or effect writer in HQ.

Operations: source.register, source.index, source.search/source.read,
source.context, source.graph/source.wiki, source.status,
source.capabilities, source.revoke. Lane B owns exact mapping to its
existing Host action catalog and risk/grant model; do not invent new Host IDs.

The separate diagnostic-only CLI opts into mode=diagnostic and requires
explicit --allow project roots for each call. Do not mount this diagnostic
mode in a remote/phone API. Host must own dataDir and its per-user ACL.

## HQKG and Host read port (Lane A/B)

- indexWatermarks(): [{sourceId,project,domain,projectRevision,currentRevision,
  indexWatermark,files,symbols,freshness}].
  Freshness values are unindexed, revision_changed,
  unversioned_not_file_verified, head_only_not_file_verified.
  HEAD equality does not prove working-tree content currency.
- sourceEvidence({project,path,startLine,endLine}) returns
  arbor.dev-source-evidence/1 including sourceId legacy project:path,
  devSourceId (stable source root identity), projectRevision/currentRevision,
  indexWatermark, indexedHash/currentHash and bounded line-span text.
  status indexed means indexed bytes match current bytes at read time;
  stale means content hash or Git revision diverged.
- search/symbols/files/graph/context/verifyContext/wiki/semanticIds/semanticId
  wrap retained HQ JS algorithms. No native graph algorithm or graph store.
- graph observations are read-only. Native/hqkg Development namespace maps
  only Host-authorized project/source revisions. No Personal World ingestion.
- Wiki is the deterministic local HQ code/documentation projection in the
  per-user ARBOR HQ data directory, not universal/personal AutoWiki.

Source roots are realpath-checked at registration and reads. Legacy walk
filters symlink escapes before content sniffing; context verification cannot
follow caller-provided absolute-path hints. Fixed database path is
dataDir/.hq/index.db; mutable legacy config.db is ignored. Revocation clears
project file FTS, associated derived capability scan records, generated wiki
```

_First 80 of 138 lines._

---

[HQ wiki](../../../index.md) · [Symbols](../../../symbols.md) · [Dependency graph](../../../graph.md) · [Documentation](../../../docs.md) · [Changes](../../../changes.md) · [Open tasks](../../../todos.md) · [Deprecated](../../../deprecated.md) · [Agent annotation protocol](../../../protocol.md) · [Glossary](../../../glossary.md) · [Using HQ](../../../context.md) · [Capabilities](../../../capabilities.md) · [Search index](../../../search.json) · [Browser view](../../../index.html)
