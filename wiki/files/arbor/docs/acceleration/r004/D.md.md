# File: docs/acceleration/r004/D.md

> Generated 2026-11-19 · Markdown · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | docs/acceleration/r004/D.md |
| Language | Markdown |
| Kind | doc |
| Size | 5959 B |
| Lines | 57 |
| Hash | ecc40188574e |
| Test | no |
| Generated | no |
| Component | docs |

## Symbols

_No symbols._

## Imports

_No imports._

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

````markdown
# R004 Lane D — Local Evidence Gate Implementation

**Disposition: SOURCE_IMPLEMENTED / RUNNER_TESTED_NODE22 / PRODUCT_NODE24_UNRUN / NOT_ACCEPTED**

## Source and ownership

- Original connected GitHub `main` baseline at inspection: `6f3fb8509ce6b5814b44de36e687b838462f677f`, latest commit `fix(acceleration): expect the owner-browser actor on a wiki edit` (2026-11-15 17:04 UTC).
- The R004 D-owned additions are `integration/scripts/r004-local-gate.mjs`, `integration/scripts/r004-local-gate.test.mjs`, `integration/scripts/r004-local-gate.ps1`, and this report. There is **no** modification to Host, World, roadmap, releases, CI configuration, root manifests or lockfiles.
- GitHub Actions `main` run `43739690454` ended `startup_failure` (2026-11-15 17:11 UTC). That outcome did not execute the Node24 acceptance suites; this local runner does **not** repair Actions infrastructure.

## Actual implementation

`r004-local-gate.mjs` is an immutable-command, fail-closed runner for the existing roadmap, evidence-truth, Host journal/routes, Wiki feedback and isolated real-Host A01 test suites. `--full` additionally selects PWA entry, Bun gate and locked Rust workspace checks. It performs no dependency installation and never makes a provider call. Each task records the actual child-process exit or TIMEOUT / SPAWN_ERROR / SKIPPED_MISSING_SOURCE; a skipped or failed test blocks the aggregate result. In the absence of `Cargo.lock` or `bun.lock`, the corresponding full-profile check is visibly skipped as a blocker rather than fabricated.

It pins `git rev-parse HEAD`, refuses a dirty tracked or untracked checkout, requires Node >=24 for actual ARBOR acceptance, runs commands with isolated ephemeral Host `dataRoot`, scrubs inherited provider and owner token environment variables, sanitizes and bounds excerpts, and writes private receipts under the OS temporary directory (not the repository). The receipt always says browser, physical phone, independent acceptance and release acceptance are `UNRUN`. PowerShell wrapper propagates the runner exit status without installing or elevating anything.

**Important security limit:** The runner executes existing repository test code as the invoking local user. It is designed only for a trusted, reviewed ARBOR checkout and is not a sandbox against malicious repository code or operating-system side effects. Use the existing Host test isolation; never point it at owner profiles.

## Evidence (executed, not estimated)

Environment: isolated Linux container, Node `v22.16.0`, no Bun, Cargo, PowerShell or complete ARBOR checkout. Synthetic fixtures were created and committed in fresh temporary **local-only** Git repositories to exercise real process spawn, clean/dirty pinning, missing source, timeout and nonzero propagation.

| Command | Exit | Evidence |
|---|---:|---|
| `node --check integration/scripts/r004-local-gate.mjs` | 0 | JS syntax |
| `node --test integration/scripts/r004-local-gate.test.mjs` | 0 | **14 pass / 0 fail**, real fixture processes and negative checks; Node22 |
| `pwsh -File integration/scripts/r004-local-gate.ps1` | UNRUN | PowerShell unavailable in container |
| `node integration/scripts/r004-local-gate.mjs --focused` on actual ARBOR Windows Node24 | UNRUN | No user PC checkout access |
| `bun scripts/test-gate.mjs --all --no-cache` | UNRUN | Bun unavailable / no checkout |
| `cargo check --workspace --locked` | UNRUN | Cargo unavailable / no checkout, root lock previously absent |
| Real Wiki Chrome, Tailscale Android, Studio/browser sends | UNRUN | No device, browser-owner-session or owner authorization |

Negative cases tested: child exit 17 retained and aggregate blocked, missing test named and aggregate blocked, 80ms timed-out process marked `TIMED_OUT`, dirty Git checkout rejected, Node requirement rejected, secret-looking stdout/stderr redacted, untracked or symlink-escaped test sources refused, inherited owner/provider credential variables removed, arbitrary CLI command injection rejected. On Windows without symlink privileges, that single synthetic symlink test must report a skip and independently remain unverified. The passing unit suite verifies the runner, **not** the actual R002 runtime behavior.

## Exact Windows handoff

On a clean, updated `C:\0-BlackBoxProject-0\ARBOR` checkout under PowerShell 7 and Node >=24:

```powershell
node --version
node --test integration/scripts/r004-local-gate.test.mjs
pwsh -NoProfile -File integration/scripts/r004-local-gate.ps1 -Profile focused
# Only after reviewing the focused receipt:
pwsh -NoProfile -File integration/scripts/r004-local-gate.ps1 -Profile full
```

The PowerShell wrapper prints a JSON summary containing the temporary receipt path. Open that file to inspect every task's literal exit and bounded stdout/stderr. A `release-truth` nonzero outcome may correctly reflect contradictory gate claims; it remains a blocker until independently reconciled.

## Cross-lane handoff / blockers

- **A/C/B:** run the focused Host/Wiki suite on the integrated candidate; fix implementation defects without weakening authorization or inventing UI proof.
- **E:** feed only independently pinned, exact outputs into bounded feedback compiler; runner output alone cannot activate A03 or edit the roadmap.
- **G keeper:** verify scope, run locally, review receipts and decide whether source should merge; no owner or release acceptance is implied.
- **P0 external blocker:** GitHub Actions zero-job `startup_failure` requires account/runner policy, billing and infrastructure diagnosis; cannot be closed with a local script alone.
- **P0 source closure:** root Cargo/Bun locked resolution and Windows MSI remain unverified.

Measured subsequent-task acceleration: **NOT_YET_MEASURED**. No main promotion, Windows execution, product acceptance or release approval is claimed in this report. Verify the final lane commit from GitHub.
````

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
