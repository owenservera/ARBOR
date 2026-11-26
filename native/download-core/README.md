# VIVIM native downloads — implementation slice 0.1

One Rust BitTorrent engine, independent of UI. Host Control is the authorization and receipt owner on Windows. On Android the APK must own an equivalent app-private service binding; the Termux executable is only a development verification target.

The engine uses pinned librqbit 8.1.1 (Rust TLS, no HTTP API or web UI), a single locked device root, engine-owned persistent sessions, piece rechecking on restore, no UPnP, no caller-selected output paths, and removal without deleting payload. Peer connections expose the device IP and may upload pieces. Use only lawful, authorized content. Dependency/security and platform audits are required before release.

## Worker
`cargo build --manifest-path native/download-core/Cargo.toml`
Run the binary with exactly one absolute app-owned root. Private JSON-lines stdin/stdout protocol; commands: list, add_magnet, add_file (byte array), pause, resume, remove (hash), shutdown. No socket control listener. Host uses only magnet admission initially; file-picker/SAF import must provide bytes, not arbitrary paths.

Set `VIVIM_DOWNLOAD_WORKER` to the absolute trusted compiled executable in the Host launch environment. Host actions use incumbent planning/approval/receipts; start is explicit because persistent jobs can restart. List never starts the worker. Existing qBittorrent/Studio code is preserved for rollback; no migration or automatic content discovery. No new renderer. Existing native and paired-phone typed control path can consume the commands subject to existing permission checks.

## Scope and evidence
Source implementation only until native cargo tests and a real lawful peer transfer run. Android APK JNI/foreground service and storage permission implementation, dedicated GPUI/PWA projection, VLANG SDK registration, rate/scheduling policies, HTTP downloads, and remote device routing are not present in this slice. Do not report these as implemented.
