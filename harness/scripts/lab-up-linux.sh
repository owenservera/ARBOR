#!/usr/bin/env bash
# Relaunch the lab Chrome (127.0.0.1:9333, runtime/chrome-profile) on the box desktop and attach PinchTab.
# Token stays in ~/.pinchtab/config.json; harness env is written to ~/.config/web-harness/pinchtab.env (0600). Never commit either.
set -euo pipefail
ROOT=$(cd "$(dirname "$0")/../.." && pwd); P=${PINCHTAB:-$HOME/.local/bin/pinchtab}; DISPLAY=${DISPLAY:-:12}
mkdir -p "$ROOT/runtime/chrome-profile"
if ! curl -sf 127.0.0.1:9333/json/version >/dev/null; then
  DISPLAY=$DISPLAY setsid nohup /usr/bin/google-chrome --remote-debugging-address=127.0.0.1 --remote-debugging-port=9333 \
    --user-data-dir="$ROOT/runtime/chrome-profile" --no-first-run --no-default-browser-check --password-store=basic --class=lab-chrome \
    >"$ROOT/runtime/chrome.log" 2>&1 & sleep 4
fi
curl -s -o /dev/null 127.0.0.1:9867/health || { (cd ~ && setsid nohup "$P" server --bind 127.0.0.1 --port 9867 >"$ROOT/runtime/pinchtab.log" 2>&1 &); sleep 4; }
T=$(python3 -c "import json,os;print(json.load(open(os.path.expanduser('~/.pinchtab/config.json')))['server']['token'])")
WS=$(curl -s 127.0.0.1:9333/json/version | python3 -c "import json,sys;print(json.load(sys.stdin)['webSocketDebuggerUrl'])")
ID=$(curl -s -H "Authorization: Bearer $T" -H 'Content-Type: application/json' -X POST 127.0.0.1:9867/instances/attach -d "{\"name\":\"lab\",\"cdpUrl\":\"$WS\"}" | python3 -c "import json,sys;print(json.load(sys.stdin)['id'])")
mkdir -p ~/.config/web-harness; umask 077
printf 'WH_DRIVER=pinchtab\nPINCHTAB_BASE_URL=http://127.0.0.1:9867\nPINCHTAB_INSTANCE_ID=%s\nPINCHTAB_TOKEN=%s\n' "$ID" "$T" > ~/.config/web-harness/pinchtab.env
echo "attached instance $ID"
