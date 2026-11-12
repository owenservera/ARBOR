# Proposal 5 / 01 — Fast Landing Scaffold: Preserve Working Paths, Add Only Shared Backbone

## Decision

**Do not reorganize every legacy path during first import.** Source-relative imports, Windows process spawn paths, phone asset routing, tests, Studio browser leases and packaging conventions are already interdependent. Preserve that topology as an intentionally **transitional product compatibility island**, then add a small native + capability-space scaffold next to it.

This is a deliberate correction to both a greenfield eight-crate tree and a fully capability-first physical reorganization. The *logical product model* is capability-first; the *beta physical layout* prioritizes successful source-preserving integration.

## Exact proposed ARBOR tree (beta landing)

~~~text
ARBOR/
├── .integration/
│   ├── proposal1/                    # existing alternative
│   ├── proposal4/                    # existing alternative
│   └── proposal5/                    # this beta-first alternative
│
├── Cargo.toml                       # single Cargo workspace
├── Cargo.lock
├── rust-toolchain.toml
├── package.json                     # Bun workspace + selected existing scripts
├── bun.lock
├── .gitignore                       # exclude profiles, secrets, caches, build outputs
├── AGENTS.md                        # single-writer & no-new-system constraints
├── README.md                        # Windows+PWA bootstrap, beta truth
│
├── src-tauri/                       # PRESERVE existing Harness path initially
│   ├── Cargo.toml                   # coordinated patched Tauri v2 upgrade
│   ├── capabilities/                # least-privilege origin/command scopes
│   └── src/main.rs                  # process identity fix + native read-only events
│
├── apps/
│   ├── vivim-host/                  # PRESERVE CURRENT JS Host path & imports
│   │   ├── server.mjs
│   │   ├── control/                 # one active effect authority/journal
│   │   ├── bootstrap/
│   │   ├── onboarding/
│   │   ├── media/
│   │   └── public/                  # desktop/Host UI; no premature rewrite
│   └── mobile-relay/               # PRESERVE CURRENT paired PWA/phone path
│       ├── app.js
│       ├── control-client.mjs
│       ├── ux/
│       └── ...
│
├── studio/                          # PRESERVE signed-in Chrome/Studio worker paths
├── harness/                         # PRESERVE actually-required Host/Studio helpers
├── core/
│   └── programmability/             # retain current pure Rust validator, 1 workspace
│
├── native/                           # ONLY NEW FOUNDATIONAL RUST
│   ├── hqkg/                         # source-preserving import of HQ Rust graph crate
│   ├── node0/                        # small bounded native read-only event/trace layer
│   └── protocol/                     # canonical typed IDs, revisions, source/effect statuses
│
├── capability-spaces/                # ORG UNIT ONLY: no new runtime process/store
│   ├── interaction/
│   ├── providers-conversation/
│   ├── host-control/
│   ├── world-personal/
│   ├── graph-knowledge/
│   ├── context-dcb/
│   ├── missions/
│   ├── visual-tierflow/
│   ├── device-pairing/
│   ├── onboarding/
│   ├── media/
│   ├── voice-to-tasks/
│   ├── automation-chronos/
│   ├── app-builder/
│   └── observability/
│
├── adapters/
│   ├── hq-read/                     # read-only source-pinned HQ export consumer
│   ├── host-capabilities/           # maps CURRENT Host action catalog, never rewrites it
│   ├── native-interop/              # existing Host↔Rust IPC, actor + version fencing
│   ├── tierflow/                    # exact pinned TierFlow build + current view adapter
│   └── studio-evidence/             # browser observation schema, no independent sender
│
├── contracts/
│   ├── schema/                      # one explicitly versioned source for interop
│   ├── generated/                   # generated Rust/TS bindings, reproducible checks
│   ├── fixtures/                    # source-truth and behavioral parity
│   └── compatibility/              # old actions/receipts/device version crosswalk
│
├── integration/
│   ├── source-lock.json             # exact donor commit hashes, imports, checksums
│   ├── capabilities.json            # GENERATED read-only inventory; not effect registry
│   ├── import-manifest.json         # what was moved and why
│   ├── migration-ledger.json        # move/adapt/block/retire; evidence+owners
│   ├── beta-gates.json              # runnable criteria + observed proof
│   └── scripts/
│       ├── audit-source.mjs
│       ├── generate-capabilities.mjs
│       ├── verify-interop.mjs
│       └── preflight.mjs
│
├── tests/
│   ├── native-graph/
│   ├── node0/
│   ├── contracts/
│   ├── source-bridge/
│   ├── host-effects/
│   ├── windows-packaged/
│   ├── paired-pwa/
│   └── recovery/
│
├── docs/
│   ├── accepted-architecture/       # only ratified ADRs
│   ├── beta/                        # known limitations and acceptance
│   └── security/
│
└── .github/workflows/
    ├── native.yml
    ├── js-compat.yml
    ├── windows-beta.yml
    └── source-truth.yml
~~~

**The tree is a proposal**, not created implementation. Only .integration/proposal5/ documents exist in ARBOR from this round.

## Actual native workspace composition — beta, not greenfield

Proposed Cargo workspace members:

~~~toml
[workspace]
resolver = "2"
members = [
  "src-tauri",
  "core/programmability",
  "native/hqkg",
  "native/protocol",
  "native/node0"
]
~~~

This example is contingent on verifying crate names, imported manifests and any incompatible profile declarations. HQKG currently has its own development profile intended to reduce GB-scale debug artifacts; move profile control to the new workspace root and preserve that low-storage behavior.

**Three new native directories, not eight rewritten domain crates.** Native HQKG stays the same package and public API initially; protocol is small; Node 0 performs read-only event/trace conversion and bounded execution. Native authority/effect implementation remains Host JS, not duplicated in Rust.

## Preserve source paths for a reason

If current Tauri code expects apps/vivim-host/server.mjs and current phone code expects apps/mobile-relay assets, copying those path trees into new apps/desktop or modules/phone folders forces rewrites of imports, process spawn logic, packaging and tests before we have any user value.

Proposal 5 therefore **relocates the whole verified application as a connected source subtree**, quarantines generated/personal data, and changes only required trust and interop seams. Source-level reorganization becomes a measured, later optimization behind stable capabilities.

**Import only currently live subtrees and their dependency closures.** Do not drag all old developer tools/docs/secrets into ARBOR. Use source graph/callsite audits and existing tests to choose dependency closure.

## Capability spaces: organization without moving all code

Each capability space initially contains a small descriptor pointing to existing source code, not a duplicate implementation:

~~~yaml
schema: arbor.capability-space/0
id: host.status
source_owner: host-control
source_repo: vivim-web-harness
source_path: apps/vivim-host/control/action-catalog.v1.json
original_action_id: vivim.status.show
runtime_binding: apps/vivim-host/control/dispatcher.mjs
state: source_wired
platforms: [desktop, paired-pwa]
effect: none
semantic_schema_ref: contracts/schema/host-status
projection_ref: adapters/tierflow/host-status
beta_eligibility: verify_runtime
~~~

This is illustrative; the real descriptor should be **generated from source-owned catalog** and augmented only with non-authoritative presentation/deployment metadata. Avoid hand-editing a second action catalog.

A capability space can have an adapter, a view, a test, and a source-verified configuration—but it does **not** own a new DB, service, graph, agent, command router or privilege tier.

## Deployment topology for beta

~~~text
Desktop (Tauri/WebView2)
  ├── local browser edit/render (immediate)
  ├── Rust HQKG + Node 0 read-only core (in one resident Tauri app)
  ├── current JS Host child (one World/effects/approval/receipt writer)
  └── current Studio/Chrome signed-in browser adapter

Paired PWA
  └── existing authenticated direct-phone channel → same JS Host + native bridge

Development only
  └── repos-hq indexing/CLI/wiki, exporting approved source snapshots
~~~

At beta, there may be **two processes in the installed runtime** (native Tauri/Host and current JS Host), plus Chrome. They are one logical product because commands, source refs and actual effects have one agreed source owner, not because language/process boundaries have been erased.

## Why this minimizes integration effort

- Preserve tested relative imports and bootstrap paths.
- Keep one real existing effect writer and signed-in browser system.
- Import native graph once instead of rewriting Rust algorithms or creating a new graph service.
- Add **generated protocol/adapter bridges** rather than reimplementing command semantics and UI first.
- Ship one PWA and desktop app using existing working views.
- Defer physical file relocation until the app is stable.
- Run current donor test suites unchanged first, then add few high-value cross-domain integration tests.
- Read HQ through explicit exports; no developer indexing database installed in end-user build.
- Make every limitation observable, so missing Labs features cannot silently block basic beta.

## Future transformation path without another master migration

After beta, a capability can move from JS to Rust, from old Host UI to TierFlow, or from bridge to native read port **without changing its ID, contract, source ownership, verification semantics, or user configurations**.

That is the future-proofing guarantee this scaffold seeks. It is a substitution contract, not a guarantee that any implementation never changes again.
