# ARBOR Proposal 5 — Beta-First Centralization and Clean Rust-Core Landing

**Status:** Independent architectural proposal, not accepted or implemented.
**Date:** 2026-11-12
**Branch:** architecture/proposal5-beta-first-centralization

## Mission

**Centralize the running product before replacing its implementations.** Bring the existing Windows Host, signed-in-browser Studio, one paired PWA, TierFlow projection, HQ Rust graph kernel and relevant source-backed intelligence into an independently buildable ARBOR product. Add only the typed bridges and critical Node 0/security fixes required for reliable integration. Prove real beta journeys before undertaking deeper rewrites.

**Goal:** one first-stage master integration, one canonical product/release identity, one coherent capability model, one controlled cutover, minimal duplicate infrastructure and a usable beta despite deferred optimizations.

## How this differs from other proposals

| Proposal | Optimizes for | Key risk |
| --- | --- | --- |
| 1: Native Product Monorepo | Clean long-term Rust-centered organization | Too much structural migration before a useful beta |
| 4: One Programmable System | Capabilities/programs/views as one semantic model | Universal abstraction may outrun real integrations |
| **5: Beta-First Landing** | **Shortest verified path from existing working code to a coherent product** | Compatibility adapters become permanent unless later measured and retired |

Proposal 5 adopts a **thin** slice of Proposal 4's capability model but does not require a complete universal programming runtime for beta.

## Ten decisions

1. **One ARBOR product repository and one locked release manifest.** Donor repositories remain source references; the shipped product does not depend on their development servers.
2. **Clean graph-core migration, not algorithm rewrite.** Import HQ's versioned hq-knowledge-graph crate as a source-preserving Rust component with exact SHA, tests and compatibility mapping. Set one future canonical source and make HQ consume that version when proven. Do not invent a second graph engine.
3. **Rust only where it gives foundational leverage now:** shared graph, typed contracts, Node 0 bounded read-only event flow, secure native session/transport and versioned projections. No blanket JS-to-Rust migration.
4. **Keep current Host JS World and effect journal as the sole beta writer.** Plans, grants, claim fences, receipts and uncertain-send recovery stay intact. Replace implementation later only with crash/parity evidence, never dual-write.
5. **Capability spaces are compatibility modules**, not independent servers or privilege managers. One stable identity, typed ports, source owner, version/status, optional view/configuration/program binding. Existing implementations plug in through thin adapters.
6. **HQ wiring is direct, scoped and read-only.** It contributes development source facts, semantic IDs and deterministic context/wiki outputs with source revisions. HQ does not receive product-private personal data automatically and is not required to run on customers' machines.
7. **Reuse working desktop/PWA/Studio and TierFlow UI.** Unify semantic identity and projection incrementally without rebuilding the visual client from scratch.
8. **Repair P0 security and liveness defects before beta.** Patch old Tauri pins, restrict origin IPC, verify Host process identity before credential transfer, actor-scope native data and eliminate per-keystroke blocking native reactor threads.
9. **One cutover, multiple atomic tested commits.** Bring source, tests, contracts and packaging to ARBOR with provenance; old product remains sole effect authority until verified switch.
10. **Truthful capability coverage.** Working beta features run; Labs concepts show explicit preview/unavailable status unless integrated. No silent loss of proven incumbent behavior.

## Functional full beta means

An installable Windows application and authenticated paired PWA where an actual owner can:
- start Host and onboard with a supported signed-in browser session;
- conduct a real supported AI conversation through the existing Chrome webapp channel;
- view native/Host source-backed interaction candidates and use safe existing command/control actions;
- see real permission, receipt, blocked and uncertain effect states;
- use available personal/context and project/HQ source-grounded read flows with explicit status;
- continue from phone through the same Host owner and device policy;
- recover safely from restart and failed browser/phone connections;
- inspect which capabilities are working, bridged, preview-only or unavailable.

Media, voice-to-tasks, missions, personalization, AutoWiki and app-builder must be inventoried and connected where already working, or separately tracked as limited beta previews with honest scope; no research-only feature can be labeled production-ready.

**A full beta is not the complete future feature roadmap.** Every existing previously functional beta-required journey needs real verification or an explicit owner-approved scope exception.

## Documents

- [01 Fast landing scaffold](01-FAST-LANDING-SCAFFOLD.md)
- [02 Rust core + HQ wiring](02-RUST-CORE-AND-HQ-WIRING.md)
- [03 Capability spaces + migration](03-CAPABILITY-SPACES-AND-MIGRATION.md)
- [04 Node 0 + security minimum](04-NODE0-SECURITY-AND-INTERACTION.md)
- [05 Beta journeys and gates](05-FULL-BETA-RELEASE-CONTRACT.md)
- [06 Execution + cutover](06-EXECUTION-AND-CUTOVER.md)
- [07 Deferred optimizations + decisions](07-DEFERRED-OPTIMIZATIONS-AND-DECISIONS.md)
- [08 Machine-readable gates](08-BETA-GATES.json)

## Current evidence and caveats

- HQ main Rust research crate: research/rust-knowledge-graph/Cargo.toml, package hq-knowledge-graph, library hqkg; graph engine/typed DAG exist in source, production product wiring not established by source alone.
- Harness main: Tauri/Node Host, command catalog v6, Host exclusive dispatcher/journal, direct-phone and Studio Chrome-based webapp flows.
- TierFlow main: typed inert visual compiler and renderer.
- Labs Node 0 architecture + R001 Rust draft and UI R005/R006/R007. The UI R007 full interpretation scope is a **design proposal**, not a live product.
- Native R001 initially held a mutex during a scoped per-input thread join; beta path must not copy that hot-loop design unchanged.
- The installed PC, actual Cargo build, browser provider login, signed Windows package and physical PWA acceptance have not been checked in this proposal round.

## Non-goals

No wholesale replacement of Host effects or browser automation, no new global database/event bus/scheduler, no generic untrusted plugin marketplace, no provider APIs, no Playwright/Puppeteer product automation, no duplicate Android app, no claims of production readiness without runtime proof. Future-proofing here means **stable substitution boundaries**, not eliminating future migrations.

**Proposal only:** ARBOR main untouched. No native source migration, executable code, release package or beta acceptance is claimed.
