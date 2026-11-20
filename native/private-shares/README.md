# VIVIM Private Shares — native Rust authority

This is the **production Rust engine** for the Direct PWA file-sharing
capability, not a proposed rewrite or a parallel server. Its one owner-facing
adapter is `apps/vivim-host/shares/private-shares.mjs`: HTTP bytes are staged
by Node and final file admission, integrity, metadata and policy mutations are
performed in Rust. The PWA remains `apps/mobile-relay/private-shares-ui.mjs`.

## Authority and graph lineage

- Native source: `native/private-shares/src/main.rs`
- Binary: `vivim-private-shares` (single bounded JSON request on stdin, JSON
  reply on stdout; no network listener).
- Host source: `apps/vivim-host/shares/private-shares.mjs`
- Edge: Host adapter **consumes** `vivim.private-shares-native@1`; source
  comment annotations are discoverable by HQ but not authorization grants.
- Device authority: `apps/vivim-host/direct-phone.mjs`; Tailscale identity,
  approved grant, exact Origin and an explicit header remain mandatory before
  Host calls the Rust capability. A request to the PWA cannot select a Rust
  binary, filesystem path, actor or operation outside those fixed routes.
- Native authority: create, upload-finalize, inspect, download-admission,
  list, revoke and prune. A per-store OS file lock spans each transaction.
- If the binary is absent, Host returns **503**. No JS fallback, public
  anonymous route, or cloud copy of private file contents is installed.

## Wire ABI

Request schema: `vivim.private-shares-request/1`, operations:
`reserve`, `finish`, `list`, `inspect`, `download`, `revoke`, `prune`.

Output schema: `vivim.private-shares-result/1`. A success has `ok:true`
and a bounded `value`; refusal has `ok:false,status,code`. Raw records,
plaintext passcodes, and private capability digests are never exposed in
read/list responses. The one-time generated capability is returned to its
creating Host request so the PWA can form a private link; this capability is
not recoverable from subsequent owner list requests.

The Node adapter streams an approved upload into a unique
`dataRoot/private-shares/staging/<random>.upload` file, and passes only that
random basename to Rust. Rust verifies the reserved owner/capability, staging
file type and exact byte count, hashes the content, publishes bytes atomically
to `<id>.bin` and persists the ready record. The staging file is removed by
the Host afterward. Native `prune` also reclaims abandoned staging files.

Downloads return only the expected native path
`dataRoot/private-shares/<id>.bin`; Host checks it against its own
computed pathname before streaming. The Rust engine validates capability,
optional passcode, expiration, download allowance and SHA-256 content hash,
then commits a counted admission. The existing live device-grant stream guard
continues checking authorization while the HTTP stream is emitted.

## Persistent migration

Existing JS records need **no destructive migration**:
`dataRoot/private-shares/<32hex>.json` and `<32hex>.bin` are read natively.
The schema `vivim.private-share-record/1` and existing camelCase fields
remain unchanged. Rust reproduces Node's legacy scrypt KDF:
`N=16384, r=8, p=1, length=32`, using the existing hex salt and SHA-256
capability digest. There is a unit test against the exact Node-generated
scrypt vector. Unknown extra record fields are retained through rewrites.

Legacy limits and behaviors are retained: 10 MiB/file, 30-day maximum
lifetime, 100 downloads/share, up to 100 active shares and 250 MiB allocated
per device, five failed passcodes => 15-minute persisted lockout,
20-minute abandoned reservation, 15-minute Host cleanup cadence, and
30-day terminal metadata retention. Files are private to the OS profile.

## Build and executable exercise

Run from the ARBOR root on the supported Rust toolchain:

```sh
cargo test -p vivim-private-shares
cargo build --release -p vivim-private-shares --bin vivim-private-shares
node --test apps/vivim-host/test/private-shares.test.mjs
node --test apps/vivim-host/test/private-shares-direct.test.mjs
```

The release packaging plan in
`tools/packaging/prepare-host-runtime.mjs` includes the new binary in
`native/bin` and the Tauri installed-runtime inventory expects it.

**Status accounting:** repository source wiring and commit readback are not
equivalent to a successful Rust build, cargo test, signed Windows package,
or paired-phone hardware acceptance. Treat each as unverified until its
actual output is observed. The packaging contract separately expects the
workspace's canonical `Cargo.lock`; regenerate it using Cargo on the
supported build machine if absent, and commit its resolved dependency graph.
