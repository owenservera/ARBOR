# File: integration/worker-reports/PREG-D.md

> Generated 2026-11-19 · Markdown · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | integration/worker-reports/PREG-D.md |
| Language | Markdown |
| Kind | doc |
| Size | 16313 B |
| Lines | 237 |
| Hash | c0bd9031183c |
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

```markdown
# ARBOR Proposal 5 — PRE-G final freeze receipt — Lane D (HQ)

**Lane:** D / HQ development intelligence
**State:** FREEZE_READY (source/evidence freeze only; not product, security, build or device acceptance)
**Worker branch:** refs/heads/work/p5-w01-d-hq
**Pre-report verified HEAD:** aa6284812432cbc375bbe6b1f94bb867a0e72cfa
**FROZEN TIP IDENTIFIER:** refs/heads/work/p5-w01-d-hq at the commit introducing this exact file, integration/worker-reports/PREG-D.md. Its object SHA must be read from the Git ref after committing: embedding that SHA into its own committed content is circular. No later lane writes are authorized.
**Common worker architecture base:** dd245d78ff3c110ba8630cad557ea0479c51a635
**Donor repo:** owenservera/repos-hq
**Donor revision:** main at 9b922ea049dbadc94e504b5b9432743995c020ca
**Donor subtree:** hq/ at Git tree 48e48313187e3747ac70206276a1a286c94ab002
**Source truth:** hq/source-provenance.json (all 315 source paths, SHA pins, amended walk.mjs provenance); hq/MIGRATION-REPORT.md; hq/W01D-FOLLOWUP-REPORT.md.
**G status:** integrate/proposal5-beta-r001 was absent at the freeze instruction check. This lane has not created or updated it.

## 1. Complete commit chain; no omitted first follow-up

| SHA | Parent | Type | Evidence |
| --- | --- | --- | --- |
| d350a2d96dc8f9c5d60da87879f32ebe529dfb4b | dd245d78ff3c110ba8630cad557ea0479c51a635 | W1D physical import | 186 original HQ donor source blobs imported plus ARBOR-owned runtime/report/test scaffolding; no other lane paths |
| 16c590dbd97dc617b783d949268ddc8fb77da2c5 | d350a2d96dc8f9c5d60da87879f32ebe529dfb4b | W1D donor dependency-closure import | +129 original donor files: 3 hq/registry JSON and 126 hq/aii/fixtures files; total 315 original donor blobs |
| aa6284812432cbc375bbe6b1f94bb867a0e72cfa | 16c590dbd97dc617b783d949268ddc8fb77da2c5 | Focused follow-up and final implementation commit | Host-mode source authorization interface, revocation/source-evidence/watermarks, symlink hardening, test cases and provenance/report updates |
| **FROZEN TIP (this report commit)** | aa6284812432cbc375bbe6b1f94bb867a0e72cfa | PRE-G closeout only | Adds exactly integration/worker-reports/PREG-D.md, no product, manifest, lockfile or other worker edits |

The last implementation commit changed these nine HQ-owned paths only:
hq/README.md; hq/W01D-FOLLOWUP-REPORT.md; hq/bin/arbor-hq.mjs;
hq/lib/arbor-service.mjs; hq/lib/walk.mjs; hq/package.json;
hq/source-provenance.json; hq/test/arbor-boundary.test.mjs;
hq/test/arbor-service.test.mjs.

Of those, **code**: hq/bin/arbor-hq.mjs, hq/lib/arbor-service.mjs,
hq/lib/walk.mjs, hq/test/arbor-boundary.test.mjs,
hq/test/arbor-service.test.mjs, hq/package.json (packaging/scripts).
**Documentation/evidence**: hq/README.md, hq/W01D-FOLLOWUP-REPORT.md,
hq/source-provenance.json. The freeze commit adds this report only.

## 2. Complete physical source inventory and exclusions

**Original donor file classes, exact per-file identities in source-provenance.json:**

| Donor class / source paths | Files |
| --- | ---: |
| hq/lib/** operational JS: schema, indexing, Git, registry, search, symbols, graph, context, wiki, capability/source analysis, semantic registry, CLI support | 127 |
| hq/bin/** existing CLI and supporting sources | 9 |
| hq/test/** selected original regression tests | 47 |
| hq/capabilities/registry/** versioned data contracts | 2 |
| hq/types/** original typing support | 1 |
| hq/registry/** canonical taxonomy, binding and agentic registries | 3 |
| hq/aii/fixtures/** selected source and test fixture harness | 126 |
| **Imported donor-tracked files** | **315** |

**Verified Git object inventory:** at implementation HEAD aa628481..., all
315 entries in hq/source-provenance.json resolve to the same blob SHA in the
ARBOR HEAD tree. This is *Git identity verification* of the declared
ARBOR inventory, not an executable test or assertion that every file remains
byte-identical to the donor. **314 donor blobs remain byte-identical**;
**one is SOURCE_PATCHED:**

- hq/lib/walk.mjs: donor blob
  c3fb10ada3b078f9f6f2e0429d0c5829a7b155fe;
  patched ARBOR blob 38f8bfe82220909cbd456d3115ecad350656fe1e;
  rationale: realpath boundary refusal for Git-tracked symlink escape before
  stat/sniff/index. Both blob identities are retained in source-provenance.json.

**Additional ARBOR-owned HQ files (11, not counted as original donor blobs):**
hq/.gitignore; hq/MIGRATION-REPORT.md; hq/README.md;
hq/W01D-FOLLOWUP-REPORT.md; hq/bin/arbor-hq.mjs;
hq/lib/arbor-service.mjs; hq/package.json; hq/source-provenance.json;
hq/test/arbor-boundary.test.mjs; hq/test/arbor-service.test.mjs;
hq/test/in-repo-closure.test.mjs.
Total files under hq/ at implementation HEAD: **326**.

**Deliberate source exclusions:** old hq/.hq/ or other developer SQLite
indexes and cache, node_modules, credentials and local browser profiles,
personal corpora, user-specific session dumps, generated logs/reports/results,
hq/aii/assessments, other donor tests targeting out-of-scope agent/media/
automation tooling, source roots and runtime checkouts outside the selected
hq/ scope. Donor research/rust-knowledge-graph was not imported: Lane A owns
native/hqkg. Retained source code may contain historical cross-repo assumptions
and legacy optional CLI modes; they are not automatically shipping/runtime
dependencies. This is a selected-source inventory, not a claim that every
```

_First 80 of 238 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
