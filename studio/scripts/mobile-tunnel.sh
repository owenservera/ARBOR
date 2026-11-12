#!/usr/bin/env bash
# Run Studio on loopback (token mode) behind a cloudflared quick tunnel so a phone off-LAN can open
# /mobile over HTTPS. Usage: scripts/mobile-tunnel.sh start|stop|status   (state in $VIVIM_MOBILE_DIR)
# The tunnel hostname is added to Studio's exact Host/Origin allow-list (CAPTURE_STUDIO_PUBLIC_HOSTS).
# The token and pairing URL are written only to 0600 files; nothing secret is printed.
set -euo pipefail
studio="$(cd "$(dirname "$0")/.." && pwd)"
dir="${VIVIM_MOBILE_DIR:-/workspace/vivim-mobile}"; port="${VIVIM_STUDIO_PORT:-38787}"
cf="${CLOUDFLARED:-$(command -v cloudflared || echo "$HOME/.local/bin/cloudflared")}"
mkdir -p "$dir"; umask 077
stop() { for n in studio tunnel; do [ -f "$dir/$n.pid" ] && kill "$(cat "$dir/$n.pid")" 2>/dev/null || true; rm -f "$dir/$n.pid"; done; }
case "${1:-start}" in
  stop) stop; echo stopped; exit 0;;
  status) for n in studio tunnel; do if [ -f "$dir/$n.pid" ] && kill -0 "$(cat "$dir/$n.pid")" 2>/dev/null; then echo "$n: running"; else echo "$n: stopped"; fi; done
          [ -f "$dir/tunnel-host.txt" ] && echo "host: $(cat "$dir/tunnel-host.txt")"; exit 0;;
esac
stop
[ -s "$dir/.token" ] || node -e 'process.stdout.write(require("crypto").randomBytes(24).toString("base64url"))' > "$dir/.token"
chmod 600 "$dir/.token"
: > "$dir/tunnel.log"
nohup "$cf" tunnel --no-autoupdate --protocol http2 --url "http://127.0.0.1:$port" > "$dir/tunnel.log" 2>&1 & echo $! > "$dir/tunnel.pid"
host=""; for _ in $(seq 60); do host="$(grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' "$dir/tunnel.log" | grep -v '//api\.' | head -1 | sed 's#https://##' || true)"; [ -n "$host" ] && break; sleep 1; done
[ -n "$host" ] || { echo 'tunnel did not report a hostname; see tunnel.log' >&2; exit 1; }
echo "$host" > "$dir/tunnel-host.txt"
cd "$studio"
CAPTURE_STUDIO_ACCESS_MODE=token CAPTURE_STUDIO_TOKEN="$(cat "$dir/.token")" CAPTURE_STUDIO_PUBLIC_HOSTS="$host" \
  nohup node bin/studio.mjs serve --studio-port "$port" > "$dir/studio.log" 2>&1 & echo $! > "$dir/studio.pid"
for _ in $(seq 30); do curl -s -o /dev/null "http://127.0.0.1:$port/" && break; sleep 1; done
printf 'https://%s/mobile?token=%s\n' "$host" "$(cat "$dir/.token")" > "$dir/pair-url.txt"; chmod 600 "$dir/pair-url.txt"
echo "studio on 127.0.0.1:$port, tunnel host $host; pairing URL in $dir/pair-url.txt"
