# Fast Rust development rebuilds — R015
Blaze v0.20261122.0 is an optional, experimental development compiler for Linux/macOS. Windows GPUI and all canonical acceptance, release packaging and CI remain on ARBOR's pinned Rust/Cargo toolchain.

## Windows native
`pwsh -NoProfile -File scripts/rust-dev-build.ps1 -Component core -Action check -Offline`
`pwsh -NoProfile -File scripts/rust-dev-build.ps1 -Component gpui -Action build -Offline`
The script enables incremental compilation only for its child process, caps jobs, disables debug symbols and restores prior environment settings. Keep warm target directories. No release stamp, deployment, or GPUI launch occurs.

## Linux or WSL
Use a separate development checkout on the Linux filesystem, not /mnt/c. Install the pinned upstream release into ~/.local/share/vivim-blaze/v0.20261122.0/blaze-v0.20261122.0-<target>/blaze after comparing the SHA-256 of the archive against the official release:
https://github.com/indexable-inc/blaze/releases/tag/v0.20261122.0
For Linux x86-64 tar.gz the official hash is 45d5e42537f84a02146921f5dc8ad6ee0bea4db3cba610e597f8daef2ae0e1c9.
Run `sh scripts/rust-dev-blaze.sh version`, then `sh scripts/rust-dev-blaze.sh check` or `sh scripts/rust-dev-blaze.sh test`. First adoption targets core/programmability only. A missing linker, Blaze toolchain, insufficient memory or unsupported dependency must remain an explicit failure, not an implicit Cargo fallback. See https://github.com/indexable-inc/blaze/blob/main/docs/install.md. Blaze v2 does not support native Windows and has a known installer toolchain limitation; installation of the executable alone is not build compatibility.

Compare cold and warm edit rebuilds on the same machine and dependency graph, capture time, memory and exit status, and require pinned Cargo verification before acceptance. No speedup is asserted until measured.

## First actual WSL validation — 2026-11-24

On Ubuntu WSL x86-64, upstream release checksum verified and `blaze --version` exited 0 (`0.20261122.0`, nightly-2026-10-27). Shell syntax/version tested at exact ARBOR `7fb1bae840eac439ee68dcf38772f454d44dfb39`. Actual core check using v2's positional directory command (`sh scripts/rust-dev-blaze.sh check --workers 2`) exited 1: missing pinned toolchain manifest `187c11dc57908faed50beacf02d982fbd188ecb17f2e0c8b5c7571b4393d5793` in `~/.blaze/v2/toolchain`. WSL had no Rustup or C linker on PATH and about 4 GB assigned RAM. Do not weaken sandboxing, fabricate the shelf, or replace Windows Cargo. Upstream source at tag `v0.20261122.0` contains `scripts/src/bin/toolchain_cut.rs` for generating the content-addressed shelf; further adoption requires a genuine exact-digest shelf provisioned by upstream or a separately verified compatible release. Native compiler path remains independent. No Blaze build or speedup has yet been demonstrated.

## Native Windows verification

At exact archived ARBOR `7fb1bae840eac439ee68dcf38772f454d44dfb39`, Desktop Commander PID 3280 executed the new native script twice against the portable programmability crate on Windows. PowerShell parser passed. Both `cargo check --locked --offline` calls exited 0: first cold check 32,556 ms, unchanged warm check 674 ms (wall clock, including wrapper), with the existing unused-import/profile warnings only. These are cold versus unchanged-warm Cargo measurements, NOT a changed-function rebuild or Blaze comparison. GPUI feature build has not yet been timed. The canonical release packager and pinned toolchain are untouched.
