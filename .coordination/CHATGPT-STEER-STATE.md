# ChatGPT strategic loop — live state (updated 2026-11-18 ~10:05Z)

**Transport (PROVEN)**: `bun C:\0-BlackBoxProject-0\vivim-web-harness\studio\bin\studio.mjs drive chatgpt --reuse-tab --prompt "..." --timeout 300 --json` (reuses the owner's ChatGPT tab, no new tabs, reply read back via `studio export transcript <session> --confirm`). `chat chatgpt --target <tab>` is blocked by DRAFT_PRESENT on a tab that already has a thread. Owner rule: commit+push ~1 min before each ChatGPT turn so it reviews real HEAD.

**Cadence**: strategic reviews at steer checkpoints (NOT per cycle — ChatGPT itself ruled per-cycle approval would be a bottleneck).

## Steer log
- **#1** (02:55Z, reviewed 0dab26a): fleet briefing → P0 set (A05/A06 reconcile, A07 receipt, A03 dep), 4-lane topology, verification tiers, model split, channel roles. Archived: `chatgpt-guidance-20261118-restated.md`.
- **#2** (08:17Z): field report → A05 slices (Select/Execute/Verify/Proof, acceptance = one complete real cycle), vertical journey lane (GOAL-3 mapping), per-sweep flip-debt, step-5 primary/mistral fallback, GLM out, ernie probe-only. Archived: `chatgpt-guidance-20261118-steer2.md`.
- **#3** (09:22Z, reviewed a59f587): GOAL-3 round 1 = bounded READ-ONLY AUDIT (trace + first broken edge, no edits), keeper = per-sweep reconcile + 2-sweep KEEPER_RECONCILIATION_STALLED escalation + freeze dependents only, A07 receipt says independentVerification NOT_RUN (not acceptance), A05.1 source-pinned no effects, checkpoint report order (journey→A05.1→keeper→models). Archived: `chatgpt-guidance-20261118-steer3.md`.

## Lane state 2026-11-18 10:05Z
- L1 GOAL-3 (vertical) dwfrun-2543d543: WEDGED (USE ask 1h57m, 0 tokens) — un-wedge + audit-first relaunch steered to manager.
- L2 queue A05 dwfrun-a4d3c8ee: STOPPED 1h52m; ran arg-less (args-drop); A05 not feedable while gated; relaunch {item:A05} steered.
- L3 GOAL-2 dwfrun-9da1a9a3: healthy, phase 6 VERIFY (USE 955k/1h13m, OBSERVE 502k/42m).
- L4 goals dwfrun-cca3e267: healthy phase 6 VERIFY but duplicated GOAL-2; next round → unsettled goal or discovery.

## Open debts
- Keeper dispositions due: A05 (failed-name vs validated reset), A07 (no-flip — receipt gate), A03 (blocked).
- Manager def delta: GLM out (DONE — script_models no longer list it), ernie probe-gate pending.
- Checkpoint to ChatGPT next: (a) GOAL-3 trace/first broken edge, (b) A05.1 receipt, (c) keeper dispositions, (d) model health — with SHAs, exits, receipt refs.