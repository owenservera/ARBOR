# ARBOR Proposal 5 — PWA-first direct-main build queue

**Directive (2026-11-13):** Execute sequential, small, reviewable commits **directly on `main`**, not in new branches or pull requests. Build the real `apps/mobile-relay` PWA first, visible as Host's default entry. Use existing working sources; do not make a second phone app or rewrite Host's authority.

**Shipped source:** PWA-first cutover `931d08bf1d4f6af051c06cc2f293b8fcf51c115c`; read-only loopback preview, preserved Tailscale Direct handler, legacy Host tools only on explicit menu choice. **Execution truth:** no Node, Android, Windows or browser test run completed in this connected GitHub environment. GitHub Actions has reported startup failures, not passing test results. This is not a production acceptance claim.

## ERA 1 — Visible phone first

- **PWA-01 · Host root opens canonical PWA** — committed_unverified. root / PWA preview; legacy admin explicit; Direct routing isolated.
- **PWA-02 · Protect Direct phone and preview routing** — source_tests_added_unrun. paired and preview HTTP contract; negative POST; CI Node24 and physical phone still required.
- **PWA-03 · Surface inventory and real visual navigation** — source_implemented_tests_unrun. Today/Talk/Build/Control/World/Me visible at 390px, 420px and narrow; no stale stub; menu works.
- **PWA-04 · Authenticated read-only Host projection on desktop** — source_implemented_tests_unrun. current state/receipts only with Host session; empty/offline and denied truthful; no phone grant impersonation.

## ERA 2 — Make existing features live

- **PWA-05 · Phone pairing and reconnect UX** — source_implemented_tests_unrun. trusted HTTPS, browser P-256 key, approvals, revoke, lost-key, reconnect; no APK requirement.
- **PWA-06 · Universal text command preview in PWA** — queued. plan, permission, approve/deny and receipt through one Host executor; no silent send.
- **PWA-07 · Build canvas visual proposal and activation** — existing_paired_flow_and_readonly_desktop_tests_unrun. preview and safe activate/undo against Host revision; stale edits rejected.
- **PWA-08 · VEC deterministic UI edits and compiler contract** — source_implemented_tests_unrun. known text edits compile locally and safely; unsupported requests use existing optional model flow; tests run.
- **PWA-09 · Mobile media library and playback entry** — queued. authorized library cards and streamed playback with range/cache/abort proofs.

## ERA 3 — Polish and ship

- **PWA-10 · Offline shell, drafts and installability** — manifest_and_offline_shell_source_updated_tests_unrun. offline read-only shell, clear stale state, no API caching/replayed mutations, valid PWA icons.
- **PWA-11 · Adaptive UI, accessibility and one-thumb polish** — queued. Android Chrome, keyboard, safe areas, reduced motion, screen reader; device validation.
- **PWA-12 · Windows+paired Android operational acceptance** — queued. Node24/Bun/Cargo plus real Windows+Android Tailscale pairing, grants, restarts and offline; no external donor runtimes.

## Working rules

- **Queue pointer:** PWA-06. For each item: inspect current `main`, implement the smallest source slice, exercise relevant executable tests when a runner is available, commit to `main` with an expected-head check, update JSON and advance.
- A recorded static inspection is not an executable test. Never mark unexecuted test suites or real devices as PASS.
- Keep Windows Host as the sole identity, approval, effect, receipt and recovery writer. Browser preview cannot impersonate a paired device; no provider APIs, duplicate registries, new cloud backend or APK dependency.
- Preserve working Today, Talk, Build, Control, World, Me, phone pairing, command planning, media and TierFlow module surfaces. Correct unsupported or unconnected states visibly instead of inventing data.
- Use this queue with the machine-readable companion `PWA-FIRST-BUILD-QUEUE.json`. The Proposal 5 foundations and VEC PWA documents remain the implementation references; prior branch/PR gate procedures are superseded **for this direct-main sequence only**.
