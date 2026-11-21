# AV-001 — Live agent typing and touch visibility on the real PWA

**Status:** DESIGN READY / NOT IMPLEMENTED. **Created:** 2026-11-21.
**Owner goal:** While an authorized coding agent operates the phone PWA, the owner can watch the *real composer field* change progressively, and can see a small, temporary touch dot precisely where an *actual agent-dispatched* tap occurs. This is a temporary on-phone human confirmation loop, not a screen recorder or permission substitute.

> Agent handoff: implement against current ARBOR `main`, with product changes in a later, explicitly authorized task. This document and its tracker changes are documentation only. A ChatGPT conversation is **not** automatically connected to the phone; agent actions must enter via an authenticated, owner-approved Host command path.

## 1. Read these files, in this order

1. `docs/integration/OW-20261121-LIVE-FABRIC-STATUS.md` — current source-backed capabilities, verified tests, 60-item ledger disposition.
2. `apps/mobile-relay/first-contact-composer.ts` — mounted first-contact `#text`, source fences, human input collision, same-origin observation, one-shot 15-second delivery polling, verified ACK.
3. `apps/mobile-relay/agent-composer-adapter.ts` — one-shot authorized `input` mutation; no Send.
4. `apps/mobile-relay/app.js` — real Direct first-contact mount, active modes and DOM lifecycle. Do not accidentally mount in unpaired, Host-preview or cloud contexts.
5. `apps/vivim-host/control/agent-composer-bridge.mjs` — one-shot claim, source observation, delivery, 12-second ACK, source-backed verification and no replay.
6. `apps/vivim-host/control/agent-composer-client.ts` — Rust stage → Host Control R1 plan → **human** approval → execute → owner receipt and independent readback.
7. `apps/vivim-host/control/live-system-delta-feed.mjs`, `live-system-client.ts`, and `server.mjs` — existing Rust-projected owner cursor/changes; not a second state fabric.
8. `docs/FIRST-CONTACT-LIVE-OBSERVABILITY.md` — bounded diagnostics metadata, unchanged live URL and strict "not actual DOM mirror" truth convention.

The original canonical local Labs wiring ledger is `vivim-labs/ARBOR-LIVE-SURFACE-DOCUMENT/WIRING-LEDGER.md`. It is not present in the connected GitHub `vivim-labs` repository; reconcile this design with its IDs 11–18, 26–29 and 47–58 when that file becomes available. Until then, the **actionable tracked items below** are in ARBOR's `docs/FIRST-CUSTOMER-TRACKER.md` and `docs/integration/OW-20261121-LIVE-FABRIC-STATUS.md`.

## 2. Non-negotiable architecture

- **One Rust LiveSystemState / HQKG fabric.** Rust admits typed intents and source revisions. **Existing Host Control** alone owns authorization, approvals, delivery claims, device effects and durable receipts.
- **Real first-contact PWA DOM** expresses state with minimal TypeScript 7+ browser glue. It is not a shadow emulator, separate agent canvas, simulated keyboard, synthetic grant or direct ChatGPT-to-phone socket.
- **No Send by implication.** Text insertion only edits the draft; it never hits Send, synthesizes Enter, calls providers, navigates, purchases, or accepts an approval.
- **User wins every collision.** Physical typing, touch, composition/IME, focus change, hiding/navigating, grant revocation, disconnect or source revision mismatch cancels the agent's remaining sequence. Never replay an uncertain or already claimed effect.
- **No dot for a plan or intention.** Draw a dot only on the phone that actually dispatched the authorized UI activation; a painted dot is an *interaction visualization*, not a Host effect receipt. Separate dispatched, observed and verified statuses.
- No raw draft text or private UI screenshots in diagnostics. Any future capture requires distinct explicit opt-in. Respect reduced-motion preferences and allow the owner to hide visual overlays.

## 3. Feature A — genuinely visible agent typing (P0)

**UX:** The owner's unchanged Direct first-contact PWA shows a subtle "Agent typing" indicator while an authorized edit is active. The **actual mounted `#text` value** grows in short visible steps with the caret/selection behavior of a draft edit. It must not be a fake text overlay. Local input listeners react as for an ordinary input change, without a submit.

**Protocol lifecycle:**

`source-observed → Rust inert candidate → Host Control plan → explicit owner approval → one-shot claim → phone delivery → visual draft steps → final phone observation → Rust source readback → Host Control receipt`

1. Retain the existing bounded `pwa.composer.draft.set` plan, candidate digest, session ID, expected source revision and maximum **1,000 UTF-8 bytes**. Do not issue a separate effect/approval for each character. Treat intermediate steps as one in-flight, exclusively claimed edit, **not** multiple commands.
2. Extend the authorized phone apply implementation to generate Unicode **grapheme-safe** visible steps (not raw UTF-16 slicing); use `Intl.Segmenter` where supported and a safe fallback when absent. A replace operation may show deletion/change before insertion, but may not corrupt a combining sequence or split emoji. Support append and replace; constrain to the already admitted exact final text/digest.
3. Budget the whole visual edit to **at most 6 seconds** (adaptive steps, default ~60–120 ms between visible updates, coalesce long strings) so that final source readback and ACK can normally complete inside the existing **12-second** claimed-delivery window. Stop rather than rushing/retrying if the deadline becomes unsafe. This budget is a design target, not evidence of measured device performance.
4. Recheck `sessionId`, owner grant, visibility, focus/selection compatibility, field enablement, local revision, composition state and human-edit counter before *every* subsequent step. Use the existing synthetic-input-event identity guard so genuine human input cannot be misclassified. As soon as real human input begins, stop all further agent mutations; the partial draft remains visible and explicitly needs reconciliation. Never silently roll back over human text.
5. Render actual input changes through the existing permitted DOM adapter and ordinary `input` handlers. The phone may publish bounded, correlated **source observations** of intermediate values through the existing authenticated Host observation path (at most ~5 Hz), but they are **progress evidence only**. Only the final matching source readback can complete the existing Control receipt. Every observation advances the source revision consistently; intermediate observations do not authorize new actions.
6. On confirmed final apply, match final draft, session, correlation and source revision against Rust LiveSystemState, then existing Host Control receipt. If poll/delivery expires, owner revokes, browser goes away, or readback is uncertain, show "Interrupted / not verified"; do **not** auto-replay, auto-submit or claim final success. An extra DOM read after `requestAnimationFrame` can establish *local rendering observation*; only a real phone observation proves the human could see it.

**Important current-state distinction:** Today's one-shot draft adapter applies the entire value in one operation. The Host's verified ACK is source readback, **not** evidence of frame-by-frame typing. Progressive typing must be built and device-verified.

## 4. Feature B — truthful agent tap dot (P1 after authorized UI-action seam)

**UX:** When the phone executes an approved agent **UI activation**, it paints a small, high-contrast circle centered on the actual element's visible hit target for about **450–650 ms**, then fades/removes it. An understated "Agent tap" label may appear. The dot is labelled/visually distinguishable as **agent activity**, never a spoofed human finger.

**Action lifecycle:**

`Rust visible target + layout/source revision → Host Control target-specific plan/approval → device grant check → one-shot delivery → browser resolve + hit-test + actual dispatch → local tap-marker render → source/outcome observation → Host receipt`

1. **Do not add a generic remote click API**. First identify/reuse or introduce an **allowlisted semantic UI activation action** in the existing Host Control catalog, scoped to one real PWA target ID and explicit risk classification. Never accept arbitrary JavaScript, CSS selector strings, DOM injection or stale raw coordinates as authority.
2. A target is described by stable semantic element identity, view/layout revision, visibility, current access scope and expected state; the browser resolves it against the *current* DOM and performs `getBoundingClientRect`/hit-test at execution time. Reject hidden, covered, disabled, out-of-viewport, changed-layout or inaccessible targets. Scrolling/zoom/keyboard/rotation can invalidate the old geometry.
3. The **same phone runtime** dispatches the action using its approved native/browser-supported path. Only after the local dispatch boundary is crossed may it emit a correlated `agent-ui-dispatched` local event to a **presentation-only** overlay. Do not synthesize `isTrusted` pointer/touch events or claim browser JS events equal physical hardware touches. For a simple DOM activation, call the permitted element activation path; privileged OS-like touches require a different explicit runtime capability.
4. The overlay is a single bounded, noninteractive layer (`pointer-events:none`, `aria-hidden=true`), capped/cleaned on unmount. Position from the **current browser viewport geometry**, compensating for `visualViewport` offset/scale, scrolling and browser keyboard where applicable; clamp inside the visible viewport. Do not put dots on an unrelated screen based on desktop coordinates.
5. Report separate states **planned, authorized, delivered, dispatched, source-observed, verified/refused/uncertain**. A dot following actual dispatch can coexist with later refusal; only a matching Host receipt proves the authoritative result. No dot on denied, stale, not-delivered or missing-target actions.
6. Local owner taps/intervention take precedence and interrupt any queued agent action. No visual marker should block a button, leak into screenshots by default, continue after pausing, or persist in the journal as private location history.

**Important current-state distinction:** The existing implementation covers **draft editing**, not a verified generalized PWA tap/click execution path. A touch dot alone without an authorized target action is cosmetic deception and must not be shipped as the proof loop.

## 5. Shared PWA confirmation strip

Keep this visually tiny and optional. It can show `Agent idle / Typing / Tapping / Waiting for Host / Verified / Interrupted`, an accessible pause action that delegates to the existing Host pause authority, and short-lived correlation (truncated ID). It must not implement a local second permission switch, act as approval on behalf of the user, or reveal drafts. User interaction pauses/cancels remote work safely. With `prefers-reduced-motion`, use a stationary 450ms dot and instant text steps; announce meaningful status through a polite live region without reading every character aloud.

## 6. Work packages / assignment order

| ID | Priority | Work package | Grounded edit seam | Done when |
| --- | --- | --- | --- | --- |
| AV-01 | P0 | Define one approved, bounded visible-draft session and correlation/timeout rules | Existing Rust `agent_composer`, Host `agent-composer-bridge.mjs` + Control; avoid new authority | One claim, one final receipt; no per-character grants; cancellation and uncertain outcomes specified/tested |
| AV-02 | P0 | Grapheme-safe incremental **real textarea** updates with human-edit preemption | `first-contact-composer.ts`, `agent-composer-adapter.ts`, `app.js` | Actual `#text` visibly changes in steps; no Send; IME/user races stop edits |
| AV-03 | P0 | Correlated progress/readback presentation and compact agent activity status | Existing Host observation, Rust source projection, phone UI | Intermediate `progress` cannot become a successful Host receipt; final only after exact source readback |
| AV-04 | P1 | Enumerate and authorize first real semantic UI targets with risk and layout fencing | Existing Host Control catalog/dispatcher, Rust LiveSystemState `pwa.view`/visual source | Only approved target-specific actions can execute; no generic click/screen injection |
| AV-05 | P1 | Add phone-local tap marker from verified **dispatch event** | New small TS7+ presentation module under `apps/mobile-relay/`; mount via existing `app.js` | Dot follows real dispatch, matches browser target geometry, never intercepts touch |
| AV-06 | P1 | Operator precedence, privacy, pause/reconnect and safe cleanup | PWA mount/dispose + Host grant/Control pause | Stale/revoked, unmounted, duplicate, offline and human takeover all fail closed |
| AV-07 | P0/P1 | Automated regressions on both halves | `apps/mobile-relay/test/`, `apps/vivim-host/test/`, focused Rust tests | Tests demonstrate source vs cosmetic distinction; no duplicate effects or auto-Send |
| AV-08 | P0/P1 | **Real Android PWA acceptance**, followed by broader visual UI targets | Unchanged Direct `/mobile/?first=1` URL and actual Windows Host | Owner witnesses real typing and eligible tap dot; trace correlates with Host receipt; separate real vs fixture evidence |

**Dependency:** AV-02 can land first on the existing composer seam. AV-04 must precede AV-05 for *functional* tap verification. AV-08 typing may be accepted before tap capability is ready, but never advertise tap success prematurely.

## 7. Verification matrix (do not claim PASS unless run)

**Unit / browser DOM:** grapheme clusters (emoji/combining), app `input` events, 1,000-byte ceiling, human input mid-step, IME start/end, focus/selection, mount/unmount, visibility, reduced motion, no Send, no fake marker before dispatch, overlay pointer-events none, hit-test on scroll/zoom/keyboard/rotation, stale/disabled/covered target.

**Host / Rust integration:** one candidate/one Control receipt, no double execute, revision CAS under intermediate observations, source-readback final digest, grant revoke, pause, lost ACK, reconnect/epoch reset, no replay, unknown target denied, target risk/approval truthful, protected owner routes, no raw draft in diagnostics.

**Real owner acceptance (UNRUN until observed):** open the unchanged paired PWA URL on Android; see genuine agent-originated text progress in the active textarea (not a demo overlay), never auto-Send; interrupt with a finger and verify agent stops; approve a permitted non-destructive button action and see one dot at its actual on-phone location; cross-check an actual Host receipt and correlated source revision. Repeat after rotate/zoom and reconnect. Record device/browser version, event correlation, Host receipt ID, expected/observed revision, screenshots **only if owner explicitly consents**, and precise PASS/FAIL/UNRUN.

## 8. Agent kickoff — copy into the next coding session

> Read `docs/integration/OW-20261121-PWA-LIVE-AGENT-VISIBILITY-DESIGN.md` and both linked trackers. Refresh ARBOR `main`. Implement **AV-01 → AV-03 and AV-07 typing** first, extending the existing Rust/Host/Direct first-contact draft path. Do not implement a fake activity overlay, a generic click bridge, or any implicit Send. Then implement **AV-04 → AV-06 plus AV-07 tap tests**, with each dot emitted only after a real Host-authorized phone-side dispatch. Human wins races; no duplicate execution or fabricated receipts. Preserve source proofs; do not run a product operation until expressly authorized. Report exact tests and device UNRUN evidence. Follow current owner instructions on coding tools and final GitHub delivery.

**Handoff complete means the design and tracker are discoverable—not that the product feature was implemented.**
