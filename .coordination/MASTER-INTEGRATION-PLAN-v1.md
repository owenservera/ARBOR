# ARBOR Master Integration Plan v1

Generated 2026-11-19 from `ARBOR-MASTER-INTEGRATION-TRACKER.csv` (4,741 rows, 84 cols, pinned to HEAD `e07e613`, extracted from `vivim-labs/ARBOR-DEEP-DISPOSITION/ARBOR-MASTER-INTEGRATION-TRACKER.csv.gz`).
Inputs: four fan-out analyses (defects, NEXT-sequencing, verify-planning, ownership-mapping). Slice files: `.coordination/slice-*.csv`.

## 1. Scope

| Metric | Value |
|---|---|
| Rows | 4,741 (File 2,558 / Symbol 2,183) |
| Should integrate | Yes 457 · Conditional 1,851 · Undetermined 1,502 · No 931 |
| Priority | P0 189 · P1 2,191 · P2 846 · unset 1,502 |
| Phase decision | RETAIN 2,476 · VERIFY 734 · NEXT 162 · LATER 155 · DEFER 31 |
| Open audit findings | 172 (Rust 112, Host 28, PWA 15) |
| Owner column | **0 / 4,741 assigned** |

## 2. Governance facts (read before executing anything)

1. **Every P0 is runtime-UNRUN** (189/189). No row may be closed "done" without a verification run.
2. **49 P0 + 724 P1 rows have no production-reachability evidence.** No P0 is "reachable" until its reachability cell is populated.
3. **0 rows have an owner.** Lane assignment below is a proposal, not a record.
4. **Cross-repo work is real:** hq/* rows target `repos_hq` (hq/bin/hq.mjs byte-identical mirror); harness/* rows target `vivim-web-harness`; `apps/vivim-host/public/*` KEEP_UI rows target `vivim-ui` assets; 33 `packages/tierflow/src/visual-runtime/render/dom.ts` rows diverge from vivim-ui's copy.
5. **34 of 162 NEXT rows are misclassified retain-only** (21 KEEP_DEV_TOOL + 7 KEEP_CLI + KEEP_UI/TRANSPORT/GUARD) → move to LATER, no code.
6. **74 NEXT rows are trace tasks** (blank closure class / FIRST PASS) — not executable units; they feed VERIFY, not a wave.

## 3. Track A — Defect repair (root-cause clusters)

207 unique defect/audit rows collapse into 6 clusters:

| Cluster | n | P0 | Core files | Blocks |
|---|---|---|---|---|
| C1 Source-delta authority / lossy projection | 34 | 22 | product-journal.mjs, rust-context.mjs, hqkg-personal.rs | C3, C6 |
| C2 Cache invalidation / scoped DAG / change-set engine | 48 | 37 | invalidate.rs, typed_dag.rs, scoped_graph.rs, graph_change_set.rs | C4, C5 |
| C3 Authorized entry & capability surface | 40 | 5 | control.rs, server.mjs, dispatcher.mjs, direct-phone.mjs | C6 |
| C4 Native engine/algorithm registry | 16 | 9 | engine.rs, algorithm_adapter.rs, lib.rs | — |
| C5 Evidence feed / observability / web-memory | 20 | 0 | observability.rs, web_memory.rs, hqkg-research.rs | — |
| C6 Client / packaging / docs / test surfaces | 49 | 4 | app.js, grokbot.*, prepare-host-runtime.mjs, 6 test files | — |

**Fix order** (quick-wins first; every step needs a runtime acceptance run):
1. AT-1D3AB4FA4D02 — MAX_JOURNAL_BYTES guard (one const, product-journal.mjs:9)
2. AT-7DD9F1E3705D + AT-8FFE2F565EBB — server.mjs native/request context unification
3. AT-CEA535AC0938 + AT-99124D1838DA — Host effect authority + device-grant guard
4. AT-08786C77E075 — development-read-port typed sources
5. C1-A: product-journal.mjs five (AT-FB0C6E6ECE69, AT-C9B4726A4824, AT-E658AA1D8E3C, AT-89D83426FAF5, AT-029E61AD9681)
6. C1-B: rust-context.mjs five (AT-5985AB943973, AT-80F23495E6AD, AT-F3D84F00A06E, AT-7926D5803AC2, AT-9FA8AEC5468B) — depends on 5's delta contract
7. dispatcher.mjs four (AT-7AD4746E44A6, AT-2563EC207E6A, AT-F4671F461297, AT-66F274D9ADFB)
8. C2 core: invalidate.rs + typed_dag.rs + graph_change_set.rs — cargo test, no device
9. C2 remainder: scoped_graph / managed_context / reconcile / durable_dag — cargo test
10. C4 (16) → C5 (20) → C3 control.rs (20) → C6 (49, needs packaged app)

## 4. Track B — Integration waves (162 NEXT rows)

| Wave | Theme | Rows | Start gate |
|---|---|---|---|
| W1 | Source-of-truth delta core | 20 (Host 13, Rust 7) | CAS/torn-tail/sequence-readback + restart harness exists; >72-source / >100-receipt golden fixture committed |
| W2 | Pure-execution authority boundary | 13 | W1 delta identity stable; authority statement signed; negative tests (revoked grant / stale / wrong audience-actor-device) |
| W3 | Studio convergence | 50 | W2 authority contract frozen; every new route test in `scripts/lib/test-manifest.mjs` |
| W4 | Host/Harness/HQ read-surface + context | 44 | W1 tombstone semantics landed; **W5 importer staging done first**; 10 VI adapters pass one registration event |
| W5 | Packaging, PWA transport, dev-tool disposition | 35 | W1/W2 entry points frozen; signed Windows installed-runtime test; "launches without Cargo/Bun/Git" |

**Hard dependency chain:** W1 → W2 → W3/W4. Inverted edge: W5's AT-26069031F01A + AT-CE1EAA2642DA (importer staging) must precede W4's cargo-removal pair (AT-8D1FF600A784, AT-16EE19B2CCBE) or product KG sync regresses.

**Per-wave quick wins first** (smallest file scope): W1 → AT-1D3AB4FA4D02, AT-029E61AD9681; W2 → AT-D7737CC0A646, AT-CEA535AC0938; W3 → AT-B983DD8AB550 (44 L), AT-064E27ADD42E; W4 → AT-2D025215ED50 (20 L); W5 → three JSON build-closure checks.

**Duplicates of shipped work — verify before editing:** AT-E455BCFBBD2C (aabe2c1 partially landed), AT-CE1EAA2642DA (aabe2c1/30e9b4b touched), AT-9237D196A64F (e07e613 shipped half), AT-542247A785F9 (recipes shipped Host/PWA), AT-7DD9F1E3705D/AT-99124D1838DA (4671ba0/1974ba9 fenced).

## 5. Track C — Verification program (734 VERIFY rows)

Buckets: static/read-only 203 · test-exists 245 · new-test-needed 270 · runtime/device 16. (720 rows have blank test-manifest registration; 14 marked MISSING.)

| Batch | Scope | ~Rows | Pass criterion |
|---|---|---|---|
| B1 hq-wiki | hq/test/wiki.test.mjs | 63 | node --test green at pinned HEAD |
| B2 rust-core | cargo -p hqkg --test control/observability/… | 105 | cargo test green |
| B3 rust-mem | cargo --test web_memory/revocation/algorithm_adapter | 27 | cargo test green |
| B4 host+harness | test:host + harness npm test | 84 | both green; 29 unmapped triaged |
| B5 studio-new | NEW studio/test/unit/* (4 files) | 88 | npm test green, 0 rows unassigned |
| B6 hq-new | NEW hq/test/* (6 files) | 76 | node --test green + manifest-registered |
| B7 rust-new | APPEND to existing rust tests | 57 | cargo test green, no #[ignore] |
| B8 host/harness-new | NEW journal/phone-sessions + context tests | 49 | green |

**Top P0 risks to verify first:** AT-C55179207345 (apply_ledger durability), AT-CD66AB00D6C0 / AT-DE341A406CE6 / AT-A4F98CE32767 / AT-B926B4FF2130 (web_memory revocation chain), AT-4B619CF7F92A + AT-0FBBCBC75526 (observability gates), AT-1FD47C89CCA7 (owner-auth), AT-A89F4379A996 + AT-AFEFA0CF7682 (Studio dispatch).

**Gate defects to fix before verification:** 23 rows with vague acceptance evidence (19 share one cloned sentence "Owner UI renders live committed state and actual error"); 121 blank "Remaining evidence required"; 28 blank evidence tier.

## 6. Lane structure (proposal — no row currently has an owner)

| Lane | Scope | Repo | Rows | P0 |
|---|---|---|---|---|
| L1 Surface & Contracts | PWA, Contracts | apps/mobile-relay, contracts | 426 | 0 |
| L2 Host & VEC | Host, TierFlow/VEC | apps/vivim-host, packages/tierflow | 778 | 65 |
| L3 Native & Tauri | Rust core, Tauri | native/, src-tauri/ | 406 | 79 |
| L4 HQ & Knowledge | HQ/HVI | hq/ (repos_hq canonical) | 688 | 0 |
| L5 Studio Authoring | Studio | studio/ | 1,189 | 42 |
| L6 Harness & Dev History | Harness, Dev/History | harness/, .integration/ | 1,254 | 3 |

Waves cut across lanes: W1 = L2+L3, W2 = L3+L2, W3 = L5, W4 = L4+L2+L6, W5 = L1+L3+L6.

## 7. Immediate next actions

1. Assign owners to lanes L1–L6 (plan is unexecutable while Owner is blank).
2. Stand up the W1 start gate: CAS/torn-tail/sequence-readback + restart harness + golden fixture (>72 sources, >100 receipts).
3. Land the two quick-wins (AT-1D3AB4FA4D02, AT-029E61AD9681) — smallest real code changes, unblock nothing but prove the loop.
4. Fix the 23 vague acceptance rows (gate definitions) before B5/B6 start.
5. Move the 34 retain-only NEXT rows to LATER and merge the duplicate units (6 conversation-runtime rows = 1 file; 4 capture rows = 1 file) so wave counts are honest.

## 8. Caveats

- All dispositions are source-anchored static; runtime status is UNRUN everywhere. Treat every "CONFIRMED" as static-confirmed only.
- Wave row counts include misclassified rows; after §2.5/§2.6 cleanup, W3/W5 shrink.
- The tracker is a joint ARBOR/labs artifact; disposition changes must land in vivim-labs' canonical CSV, not only here.