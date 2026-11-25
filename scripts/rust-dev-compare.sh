#!/bin/sh
# Linux/WSL development measurement only. Never alters the source checkout.
set -eu
if [ "$#" -lt 2 ] || [ "$#" -gt 3 ]; then
  echo 'Usage: sh scripts/rust-dev-compare.sh <40-hex commit SHA> <new absolute Linux scratch directory> [source Git repository]' >&2
  exit 2
fi
sha=$1
out=$2
case "$sha" in *[!0-9a-f]*|'') echo 'INVALID_SOURCE_SHA' >&2; exit 2;; esac
[ "${#sha}" -eq 40 ] || { echo 'INVALID_SOURCE_SHA' >&2; exit 2; }
[ "$(uname -s)" = Linux ] || { echo 'LINUX_ONLY' >&2; exit 2; }
case "$out" in /mnt/*|/mnt|/|*[!a-zA-Z0-9_./-]*|*'/../'*|*'/..'|*'/./'*|*'/.'|*'//'*|*/) echo 'INVALID_SCRATCH_PATH' >&2; exit 2;; /*) ;; *) echo 'ABSOLUTE_SCRATCH_PATH_REQUIRED' >&2; exit 2;; esac
[ ! -e "$out" ] && [ ! -L "$out" ] || { echo 'SCRATCH_ALREADY_EXISTS' >&2; exit 2; }
parent=$(dirname -- "$out")
parent_real=$(CDPATH= cd -- "$parent" && pwd -P)
[ "$parent_real" = "$parent" ] || { echo 'SCRATCH_PARENT_NOT_CANONICAL' >&2; exit 2; }
case "$parent_real" in /mnt|/mnt/*) echo 'LINUX_FILESYSTEM_REQUIRED' >&2; exit 2;; esac
if [ "$#" -eq 3 ]; then
  root=$(CDPATH= cd -- "$3" && pwd -P)
else
  root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd -P)
fi
[ "$(git -C "$root" rev-parse --show-toplevel)" = "$root" ] || { echo 'SOURCE_REPOSITORY_ROOT_REQUIRED' >&2; exit 2; }
[ "$(git -C "$root" rev-parse --verify "$sha^{commit}")" = "$sha" ] || { echo 'SOURCE_SHA_NOT_FOUND' >&2; exit 2; }
command -v cargo >/dev/null || { echo 'CARGO_MISSING' >&2; exit 3; }
command -v cc >/dev/null || { echo 'C_LINKER_MISSING' >&2; exit 3; }
# Benchmark the same real workspace/lockfile, not a synthetic crate.
umask 077
mkdir -- "$out"
mkdir -- "$out/cargo" "$out/blaze"
set -- Cargo.toml Cargo.lock rust-toolchain.toml core/programmability native/hqkg native/host-supervisor native/private-shares apps/vivim-host/control/action-catalog.v1.json scripts/rust-dev-blaze.sh
if git -C "$root" cat-file -e "$sha:.cargo" 2>/dev/null; then set -- "$@" .cargo; fi
git -C "$root" archive --format=tar --output="$out/source.tar" "$sha" -- "$@"
for backend in cargo blaze; do tar -xf "$out/source.tar" -C "$out/$backend"; done
printf 'source_sha=%s\nmeasurement=wall_clock_build\ncache=fresh_checkout_existing_global_caches_possible\n' "$sha" > "$out/metadata.txt"
(cd "$out/cargo"; cargo --version; rustc --version) >> "$out/metadata.txt"
(cd "$out/blaze"; VIVIM_BLAZE_VERSION=0.20261029.7 sh scripts/rust-dev-blaze.sh version) >> "$out/metadata.txt"
printf 'backend,phase,elapsed_ns,exit_code\n' > "$out/timings.csv"
run_phase() {
  phase=$1; shift
  begin=$(date +%s%N)
  rc=0
  "$@" > "$out/$backend-$phase.log" 2>&1 || rc=$?
  end=$(date +%s%N)
  printf '%s,%s,%s,%s\n' "$backend" "$phase" "$((end-begin))" "$rc" >> "$out/timings.csv"
  printf '%s %s %s ns exit=%s\n' "$backend" "$phase" "$((end-begin))" "$rc"
  return "$rc"
}
build_cargo() { CARGO_TARGET_DIR="$out/cargo-target" CARGO_PROFILE_DEV_INCREMENTAL=true CARGO_PROFILE_DEV_DEBUG=0 RUSTC_WRAPPER= cargo build --locked -j 2 -p vivim-programmability-core; }
build_blaze() { VIVIM_BLAZE_VERSION=0.20261029.7 sh scripts/rust-dev-blaze.sh build; }
for backend in cargo blaze; do
  (
    cd "$out/$backend"
    lib=core/programmability/src/lib.rs
    cp -- "$lib" "$out/$backend-original.rs"
    cp -- Cargo.lock "$out/$backend-original.lock"
    trap 'cp -- "$out/$backend-original.rs" "$lib"' EXIT
    trap 'exit 130' INT
    trap 'exit 143' TERM
    # A public non-inlined function forces a real changed-code build in an isolated copy.
    printf '\n#[inline(never)]\npub fn vivim_r017_benchmark_probe() -> u32 { 17 }\n' >> "$lib"
    run_phase first_build "build_$backend"
    run_phase unchanged "build_$backend"
    cp -- "$out/$backend-original.rs" "$lib"
    printf '\n#[inline(never)]\npub fn vivim_r017_benchmark_probe() -> u32 { 18 }\n' >> "$lib"
    run_phase edited "build_$backend"
    cmp Cargo.lock "$out/$backend-original.lock"
    cp -- "$out/$backend-original.rs" "$lib"
    cmp "$lib" "$out/$backend-original.rs"
    trap - EXIT
  )
done
printf 'BUILD_COMPARISON_COMPLETE: %s\n' "$out/timings.csv"
