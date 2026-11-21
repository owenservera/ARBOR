# First-contact live observation handoff

Date: 2026-11-21. Source: ARBOR `main`. This is the first-customer PWA Wiki interaction slice, NOT a second system-state architecture.

## Customer invariant

Use the unchanged `https://desktop-9kb03lu.taild7271a.ts.net/mobile/?first=1` URL. No Send button in Wiki mode: input events call a 180 ms debounced read-only Host Wiki fetch, and the existing Rust/WASM `wiki-source-stamp` and `wiki-source-search` operations admit/render the response. A visible panel must report searching, match count/source revision, zero matches, or failure. No browser unpaired command, provider call, or effect can occur.

## What the Host can actually observe now

Direct Host route `POST /mobile/api/first-contact/observe` receives *only* predeclared stage metadata from the same-origin authenticated Tailscale owner (exact origin and `x-vivim-first-contact: 1` CSRF header). The endpoint refuses other identities, non-POST, unknown fields, arbitrary text, and grants no permissions. It returns 204 when append is durable. The record contains `schema:vivim.first-contact-observation/1`, UTC timestamp, origin tag, `stage`, and optional bounded `length`, `matches`, `revision`, `elapsedMs`, `code`. Text input, device secret, user prompt, Wiki content, grant and tokens are NOT logged.

A diagnostic file is written inside the **existing Host data directory** at `diagnostics/first-contact-events.jsonl` (not under Git, never served to the phone). File writes are serialized, capped to 1 MiB with one rotated predecessor. The event log is diagnostic evidence only, not the source of truth for command effects, Host journals, approvals or Wiki mutations. A local agent or another ChatGPT session with authorized desktop access can read it; this conversation does not automatically receive events from a different session. The browser does not transmit events off-Tailnet.

Observed stage vocabulary:
`input`, `wasm-ready`, `wasm-error`, `search-start`, `source-ok`, `source-error`, `rust-ok`, `rust-error`, `render-matches`, `render-empty`, `render-error`, `read-only-send-blocked`.

## Inter-session integration point

For the parallel **LiveSystemState / full active-system document** program: ingest Host `first-contact-observation/1` as source-identified *observations*, not as commands or proof a user read an output. The visual PWA is one expression of the single Rust graph fabric; the Host remains sole authority. Assign an eventual stable source/event identity when integrating with that existing Rust program rather than creating a second graph, watcher, journal, external provider stream, or autonomous execution pathway.

Current scope is **event stages and counts** only; it is not a full DOM mirror or a transcript of each keystroke. Those would require an explicit source-grant and coordinated design with the parallel LiveSystemState owner. The existing authorized `/mobile/api/wiki` remains device-granted; the dedicated `/mobile/api/first-contact/wiki` permits only read-only Host Wiki under exact Tailnet-owner authentication. The full ARBOR source/HQKG index is **not yet wired** into this phone search.

## Acceptance evidence / read commands

Native read without active phone grant: `GET /mobile/api/first-contact/wiki` returns 200 for exact Tailnet owner, other login denied 403. `POST /mobile/api/first-contact/observe` returns 204 for valid metadata, 400 for fields such as raw `text`, 403 for CSRF/identity mismatch. Focused JS, Host, and Rust/WASM tests live in `apps/vivim-host/test/first-contact-owner-wiki.test.mjs`, `apps/mobile-relay/test/first-customer.test.mjs`, and `apps/mobile-relay/test/first-contact-wasm.test.mjs`.

**Real device acceptance still required**: type `vlang` on Android; see immediate `Searching Wiki…` status followed by a revision-bearing result or explicit no matches. Confirm the Host diagnostic file contains stages from this Android browser after reopening the unchanged URL. Separate real Android/browser observations from synthetic Host endpoint checks.
