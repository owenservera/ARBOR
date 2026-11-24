#!/bin/sh
# Fast development only. Never writes Windows release receipts or starts GPUI.
set -eu
version=0.20261122.0
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
 version) exec "$blaze" --version;;
 check|test) ;;
 *) echo "Usage: sh scripts/rust-dev-blaze.sh [version|check|test] [extra flags]" >&2; exit 2;;
esac
if [ "$#" -gt 0 ]; then shift; fi
if [ ! -x "$blaze" ]; then
 echo "BLAZE_NOT_INSTALLED: install verified release $version under $blaze_dir" >&2; exit 3
fi
# Keep Linux development artifacts separate from Windows native packaging.
# The caller owns this Linux checkout; do not mount a live Windows repo.
root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd -P)
case "$root" in /mnt/[a-z]/*) echo "Use a Linux-filesystem development checkout, not a Windows mount" >&2; exit 2;; esac
cd "$root"
printf 'BLAZE_DEV_ONLY version=%s checkout=%s\n' "$version" "$root"
# Limit the first adoption to the portable programmability crate.
exec "$blaze" "$action" core/programmability "$@"
