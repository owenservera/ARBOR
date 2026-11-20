# Host — mobile-first entry (R001)

The installed Host and loopback browser now open **the real phone PWA first**.
The desktop wrapper (`public/mobile-first.html`) presents
`apps/mobile-relay/index.html` in a phone-sized viewport, so the PWA's actual
mobile breakpoints, modules, and navigation are reused. It is not a rebuilt,
competing desktop dashboard.

## Entry and ownership

- `/` — PWA-first launch with no legacy Host scripts on startup.
- `/mobile/?host-preview=1` — loopback-only, **read-only and unpaired**
  visual shell. It never obtains a device grant, sends a message, or claims
  that a phone has paired. The menu offers explicit Host utilities.
- `/host/control` — existing authenticated desktop administration, loaded
  **only when selected** in the PWA menu.
- `/onboarding` — the existing Host setup and phone pairing UI.
- `/api/host/status` — read-only local diagnostic JSON.
- Trusted Tailscale `/mobile/` and its authenticated APIs remain unchanged.
  No preview behavior is enabled on remote or cloud origins.

The native Tauri launch code reaches the inner PWA only once and is exchanged
for the existing HttpOnly Host browser session, not a phone device session.
The old backend, control dispatcher, journal, pairing store, and receipts
are not replaced.

## Verify locally

```sh
node --test apps/vivim-host/test/mobile-first-entry.test.mjs
node --test apps/vivim-host/test/*.test.mjs
node --test apps/mobile-relay/test/*.test.mjs
```

Open the Host at `http://127.0.0.1:43187/` or launch the desktop app. It
should show a 420px-wide mobile PWA on desktop and the full-height PWA on a
small viewport. Tap the gear to open **Host menu**. Pairing, settings, and
diagnostics must require an explicit choice. Verify a real phone still pairs
through the original trusted Direct endpoint.

Scope note: R001 is the mobile-first **presentation cutover**, not a claim that
unpaired desktop preview can send commands. Subsequent connection work can
share the PWA's authenticated Host action flow without creating a new UI.

## Private Direct file sharing (OpenSend-inspired)

The mobile PWA's ↗ toolbar action opens the Private file shares sheet. It
reuses the canonical phone UI on the **approved Direct/Tailscale origin**.
There is no Cloud relay fallback and no public anonymous download endpoint.
The Host remains the sole authority for file bytes and share lifecycle.

`apps/vivim-host/shares/private-shares.mjs` stores files and policy metadata
under the Host's existing `dataRoot/private-shares`. Each share uses a random
ID and an independent random capability whose SHA-256 digest (not plaintext)
is persisted. Optional passcodes are salted and derived with scrypt. The
recipient's link contains its capability in a URL fragment, removed from
browser history when opened; private APIs receive it only in a header.

The existing authenticated Direct handler accepts the following routes with
a **live approved device grant**: `GET/POST /mobile/api/shares`,
`PUT /mobile/api/shares/:id/content`, `GET /mobile/api/shares/:id/meta`,
`GET /mobile/api/shares/:id/download`, and
`DELETE /mobile/api/shares/:id`. Mutations additionally require an exact
same-origin request plus an explicit share-operation header. Grant scopes are
`control:read` for reads and `control:execute` for writes.

Maximum file size is 10 MiB, lifetime 30 days, and download allowance 100.
A device is limited to 100 unrevoked unexpired shares and 250 MiB of
allocated share storage. Revocation deletes the content. Download admission
counts toward the allowance even if a client disconnects. Inline preview
supports a subset of safe document and media types and also counts toward the
allowance. Metadata views and download admissions are counted locally.

The **loopback desktop preview remains unpaired and read-only**; its share
button is hidden and it cannot access private APIs. The service worker only
caches the static share UI module, never share APIs or file data.

This is an independent VIVIM implementation inspired by the features of
`adcar/opensend` (MIT), not a copy or deployment of its Rails application.
There is no anonymous/public internet access, geographic blocking, automatic
content expiry deletion job, or Office-document inline rendering. These
features must not be advertised as implemented. A successful source commit is
not device acceptance: the paired-phone upload/download journey still
requires an actual Host/PWA runtime exercise.
