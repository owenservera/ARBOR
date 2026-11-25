#!/bin/sh
# Fast development only. Never writes Windows release receipts or starts GPUI.
set -eu
# Explicit, pinned selection: never silently fall back to another compiler.
version="${VIVIM_BLAZE_VERSION:-0.20261122.0}"
case "$version" in
 0.20261122.0|0.20261029.7) ;;
 *) echo "BLAZE_VERSION_UNSUPPORTED: select 0.20261122.0 or 0.20261029.7" >&2; exit 2;;
esac
case "$(uname -s):$(uname -m)" in
 Linux:x86_64) target=x86_64-unknown-linux-gnu;;
 Linux:aarch64) target=aarch64-unknown-linux-gnu;;
 Darwin:arm64) target=aarch64-apple-darwin;;
 *) echo "BLAZE_PLATFORM_UNSUPPORTED; use native Cargo" >&2; exit 2;;
esac
blaze_dir="$HOME/.local/share/vivim-blaze/v$version/blaze-v$version-$target"
blaze="$blaze_dir/blaze"
action="${1:-check}"
case "$action" in
 version|check|test) ;;
 build) if [ "$version" != 0.20261029.7 ]; then
   echo "BLAZE_BUILD_UNAVAILABLE_FOR_V2_PIN" >&2; exit 2
 fi;;
 *) echo "Usage: sh scripts/rust-dev-blaze.sh [version|check|test|build(v1)] [extra flags]" >&2; exit 2;;
esac
if [ "$#" -gt 0 ]; then shift; fi
if [ ! -x "$blaze" ]; then
 echo "BLAZE_NOT_INSTALLED: install verified release $version under $blaze_dir" >&2; exit 3
fi
if [ "$action" = version ]; then exec "$blaze" --version; fi
# Keep Linux development artifacts separate from Windows native packaging.
# The caller owns this Linux checkout; do not mount a live Windows repo.
root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd -P)
case "$root" in /mnt/[a-z]|/mnt/[a-z]/*) echo "Use a Linux-filesystem development checkout, not a Windows mount" >&2; exit 2;; esac
cd "$root"
printf 'BLAZE_DEV_ONLY version=%s checkout=%s\n' "$version" "$root"
# v1 has a Cargo-compatible package selector; v2 takes a positional directory.
if [ "$version" = 0.20261029.7 ]; then
 # Build scripts need a native C linker even for check; avoid wasting a cold compile.
 if ! command -v cc >/dev/null 2>&1; then
  echo "BLAZE_C_LINKER_MISSING: install native C build tools (Ubuntu: build-essential)" >&2; exit 3
 fi
 exec "$blaze" "$action" -p vivim-programmability-core "$@"
fi
exec "$blaze" "$action" core/programmability "$@"
