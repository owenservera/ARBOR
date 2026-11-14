# PRE-G Z — dependency DAG and collision fences
**Verdict:** PREPARED_NOT_PROMOTED; source readiness is not runtime readiness. This document selects dependencies, not a parallel implementation. All four specialist handoffs share base `8b23c73bf450738a76b256bf0fa17ecbf86db591`; exact tips and P2 read-only pins are in `EXACT-SOURCE-LOCK.json`.

## Era 1 — immutable source inputs (already committed, not combined)

```text
Frozen W1 A native ---\
Frozen W1 B Host -----\
Frozen W1 C Studio ----\
Frozen W1 D HQ --------+--> G source union / root lock / security
Frozen W1 E TierFlow --/
Frozen W1 F truth ----/                 (G-only; Z does not touch G)
                                        |
N0 staged Rust I/O -------------------->|             (N0  cde3b6e5)
S staged source-semantic wiki -------->|             (S   d7e59a38)
V inert visual read projection ------->|             (V   7ad5b3c4)
W ephemeral AutoWiki ----------------->|             (W   827d21d1)
P2-C/T/K source/test evidence -------->| (optional post-G; NOT G blockers)
P2-H1 triage (diverged) ---advisory--->| (no cherry-pick; priority only)
                                        v
                    W2 source owners A/B/C/D/E/F reconcile
                                        |
                               F independent proof
                                        |
                                 G release decision
```

*Arrows from N0/S/V/W and P2 to G mean **review inputs only**, not a request to merge prototypes into the product.* Only G imports owner-approved source, and G must not wait on P2. Pre-G Z cannot certify or authorize G.

## Era 2 — execution prerequisite edges

| Edge | From -> To | Owner | Minimum proof before downstream action | When missing |
|---|---|---|---|---|
| E01 | W1-A/B/C/D/E/F -> G coherent import | G+F | Actual merged tree, Cargo/Bun/imports, exact freeze SHAs, no second launchable apps | STOP source activation |
| E02 | G -> verified native ingress | A+B | Native child/Tauri loopback integrity, authenticated actor/session/World, live revocation and policy | Native input only synthetic |
| E03 | E02 -> N0 pure input event + graph lease | A+F | Bounded coalesced events, deterministic CAS, existing HQKG engine not per-edit thread pool | No live native fan-out |
| E04 | G + B grants + C exact-bound observation -> trusted ScreenContext | B+C | Real tab/thread/session, partial-history flag and unforgeable readScope | No AutoWiki personal page |
| E05 | G + D source registry + F source-type crosswalk -> attested semantic IR | D+F | Current IDs, immutable file/blob/symbol digest, current catalog, explicit ID length/revision bridge | Semantic labels explanatory only |
| E06 | E03 + E05 + B catalog -> accepted **read-side** candidate | A+B+F | Original-text, source, policy, graph and catalog revision coherence; no effect | Inert preview or refuse |
| E07 | E04 + E05 + D scope-aware read -> AutoWikiPage | B+C+D | Before/after scope recheck, W mirror negative tests on owner ports, no page persistence | Partial/denied page or no page |
| E08 | E06 + E07 + E TierFlow existing renderer -> phone/desktop projection | E+F | Monotone generations; common source vector; no draft/IME/caret overwrite; safe flip-back | Preview only, not device accepted |
| E09 | E06 + human Submit -> B sole effect journal | B+F | Current plan/grant/approval/exclusive claim/receipt; uncertain/HOLD behavior | Refuse/ask/uncertain, no retry |
| E10 | P2-C Chronos and P2-T fixtures -> existing F test pipeline | A/C/D/E/F | Exact import closure and review of no second scheduler/validator; failing replay port blocks D Chronos | Keep optional, UNRUN |
| E11 | P2-K personal archive -> B consent+receipt -> A graph CAS/erase -> D scoped read | B+A+D+F | Separate T=0 rights+account grant, crash recovery, source provenance, erasure, physical disk | Not a dependency for Z or G |
| E12 | W Rock guards + H1-02 + G11/B12 -> protected low-storage gate | B/A/D/E/F+G | Measured WAL/temp/scratch/free reserve and verified recovery of eligible derived bytes only | HARD safety gate unresolved; no evictor |
| E13 | E01–E12 relevant activated paths -> combined platform proof | F, G acceptance | Real Node/Cargo, Windows Host, PWA paired phone, device privacy/IME/receipt and low-disk | PREPARED_NOT_PROMOTED |

**Critical path:** E01 -> E02 -> E03 -> E05/E06 -> E08 -> E09 and relevant E12/E13. Read-only AutoWiki E04/E07 and optional P2/K/H1 features never bypass security/receipt/storage gates. P2-H1 ranks R005 optional beta, Rock baseline hard, AutoWiki/R007/R006 post-beta; Z may preserve a prepared prototype without advancing that release priority.

## Era 3 — collision and stop rules

- **Authority collisions:** D HQ dev source IDs and B personal World are different trust domains; H1 research tags and S annotations never register Host actions; N0/V/W are all inert sources or readers.
- **Shape collisions:** W canonical doc ID may exceed F/N0 `SourceRef.id`; preserve upstream native IDs and create an explicit F crosswalk. N0 unicode-scalar spans, V UTF-16/UTF-8, and S line spans cannot be compared without unit conversion + source digest. ScreenContext scope is comparison metadata, not Host authority.
- **Runtime collisions:** R001 per-edit threads/global mutex cannot be silently installed; A's existing graph engine remains sole compute owner. D wiki writer is not a screen-flip writer. E's single publisher remains sole visual writer. P2-C Chronos must not create a scheduler, P2-K must not create a personal store, Rock must not become an automatic deleter.
- **Falsification-first:** revoked policy during asynchronous read, stale source/catalog/world, missing HQ, wrong audience, split-brain owner, unknown project, denied grant, incomplete C history, out-of-order UI, negated command, uncertain send, low physical disk, erasure replay all fail closed.
- **No claim:** no combined Z tests run, no P2 gate executed by Z, no G source merge, no product/Windows/Android acceptance and no release approval.

Next authorized action after this isolated referee is a **G owner decision** based on `G-HANDOFF.md`, followed by bounded W2 orders only when G's own source gates pass. Z stops here.
