import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
const source=readFileSync(path.join(root,'native/gpui-desktop/src/main.rs'),'utf8');
const adapter=readFileSync(path.join(root,'native/gpui-desktop/src/lib.rs'),'utf8');
const pkg=JSON.parse(readFileSync(path.join(root,'package.json'),'utf8'));
const launcher=readFileSync(path.join(root,'tools/packaging/launch-gpui-only.ps1'),'utf8');

test('Windows desktop launches native GPUI rather than a web app',()=>{
  assert.match(source,/Application::new\(\)\.run\(/);
  assert.match(source,/cx\.open_window\(/);
  assert.match(pkg.scripts.desktop,/^cargo run --manifest-path native\/gpui-desktop\/Cargo\.toml --features desktop$/);
  assert.doesNotMatch(pkg.scripts.desktop,/chrome|edge|https?:|--app=/i);
});

test('native desktop does not offer or silently launch a browser UI',()=>{
  assert.doesNotMatch(source,/open_owner_controls|host-controls|owner_control_session_url/);
  assert.doesNotMatch(source,/explorer\.exe|xdg-open|chrome\.exe|msedge\.exe|start-process|std::process::Command::new/i);
  assert.doesNotMatch(adapter,/owner_control_session_url|mint_owner_ui_session/);
  assert.match(source,/Button::new\("host-reconnect"\)/);
  assert.match(source,/Button::new\("plan"\)/);
});

test('native-only PowerShell launcher fails closed if the GPUI binary is missing',()=>{
  assert.match(launcher,/GPUI_ONLY_UNAVAILABLE/);
  assert.match(launcher,/Start-Process -FilePath \$exe/);
  assert.match(launcher,/vivim-gpui-desktop\.exe/);
  assert.doesNotMatch(launcher,/msedge|chrome|--app=|webview|Start-Process -FilePath ['"]?https?:/i);
});
