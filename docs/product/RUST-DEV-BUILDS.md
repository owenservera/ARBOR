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
