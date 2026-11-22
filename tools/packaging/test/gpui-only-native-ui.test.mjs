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
const builder=readFileSync(path.join(root,'tools/packaging/build-gpui-native.ps1'),'utf8');
const nativeDelivery=readFileSync(path.join(root,'native/gpui-desktop/src/live_delivery.rs'),'utf8');
const nativeStackBuild=readFileSync(path.join(root,'native/gpui-desktop/build.rs'),'utf8');
const tauriShell=readFileSync(path.join(root,'src-tauri/src/main.rs'),'utf8');
const surfaceCatalog=readFileSync(path.join(root,'native/gpui-desktop/src/surface_registry.rs'),'utf8');

test('Windows desktop launches native GPUI rather than a web app',()=>{
  assert.match(source,/Application::new\(\)\.run\(/);
  assert.match(source,/cx\.open_window\(/);
  assert.match(pkg.scripts.desktop,/build-gpui-native\.ps1 && pwsh .*launch-gpui-only\.ps1$/);
  assert.doesNotMatch(pkg.scripts.desktop,/\bcargo run\b|webview|edge|chrome/i);
  assert.doesNotMatch(pkg.scripts.desktop,/chrome|edge|https?:|--app=/i);
});

test('native desktop does not offer or silently launch a browser UI',()=>{
  assert.doesNotMatch(source,/open_owner_controls|host-controls|owner_control_session_url/);
  assert.doesNotMatch(source,/xdg-open|chrome\.exe|msedge\.exe|start-process/i);
  // Windows Explorer is permitted for an explicit owner-selected screenshot
  // folder action; it must not be mistaken for a browser UI fallback.
  assert.match(source,/std::process::Command::new\("explorer\.exe"\)\.arg\(&folder\)\.spawn\(\)\?/);
  assert.match(source,/panel:\s*Panel::FirstContact/);
  assert.doesNotMatch(adapter,/owner_control_session_url|mint_owner_ui_session/);
  assert.match(source,/Button::new\("host-reconnect"\)/);
  assert.match(source,/Button::new\("plan"\)/);
});

test('native-only PowerShell launcher fails closed if the GPUI binary is missing',()=>{
  assert.match(launcher,/GPUI_ONLY_UNAVAILABLE/);
  assert.match(launcher,/Start-Process -FilePath \$exe/);
  assert.match(launcher,/vivim-gpui-desktop\.exe/);
  const executableLines=launcher.split(/\r?\n/).filter(line=>!line.trimStart().startsWith('#')).join('\n');
  assert.doesNotMatch(executableLines,/msedge|chrome|--app=|webview|Start-Process -FilePath ['"]?https?:/i);
});

test('retired cached GPUI binaries cannot launch without a matching native build receipt',()=>{
  assert.match(launcher,/GPUI_ONLY_UNVERIFIED_BUILD/);
  assert.match(launcher,/GPUI_ONLY_STALE_BUILD/);
  assert.match(launcher,/GPUI_ONLY_SOURCE_NOT_CURRENT/);
  assert.match(launcher,/GPUI_ONLY_DIRTY_SOURCE/);
  assert.match(launcher,/vivim\.gpui-source-receipt\/1/);
  assert.match(launcher,/receipt\.sourceSha -ne \$head/);
  assert.match(launcher,/receipt\.binarySha256 -ne \$hash/);
  assert.match(launcher,/receipt\.firstContactDefault -ne \$true/);
  assert.match(builder,/panel\\s\*:\\s\*Panel::FirstContact/);
  assert.match(builder,/--locked/);
  assert.match(builder,/firstContactDefault = \$true/);
  assert.match(builder,/Get-FileHash -LiteralPath \$exe -Algorithm SHA256/);
  assert.doesNotMatch(pkg.scripts.desktop,/vivim-product-pure\.exe/);
});

test('live build inspection is a Rust GPUI capability inside Developer menu, not a second UI',()=>{
  assert.match(source,/Button::new\("dev-live-build"\)/);
  assert.match(source,/live_delivery::inspect_live_delivery\(\)/);
  assert.match(source,/Panel::Developer/);
  assert.match(nativeDelivery,/pub fn inspect_live_delivery\(\)/);
  assert.match(nativeDelivery,/fn get_static\(/);
  assert.match(nativeDelivery,/Sha256::digest\(module\)/);
  assert.match(nativeDelivery,/phone acceptance unproven/);
  assert.doesNotMatch(nativeDelivery,/webview|edge\.exe|chrome\.exe|Start-Process|post\(/i);
});

test('legacy Windows WebView is not an alternate default VIVIM local UI',()=>{
  assert.match(tauriShell,/VIVIM_LEGACY_TAURI_ALLOW/);
  assert.match(tauriShell,/TAURI_UI_RETIRED/);
  assert.match(tauriShell,/tauri::Builder::default/);
  assert.match(surfaceCatalog,/pub const PRODUCT_TABS/);
  assert.match(surfaceCatalog,/pub const DONOR_SURFACES/);
  assert.match(surfaceCatalog,/pub const SURFACES/);
  assert.match(source,/dev-surface-inventory/);
  assert.match(source,/Intent::InspectSurfaces\(section\)/);
});

test('one Windows GPUI thread reserves enough stack for the merged native menu',()=>{
  assert.match(nativeStackBuild,/cargo:rustc-link-arg-bin=vivim-gpui-desktop=\/STACK:8388608/);
  assert.doesNotMatch(nativeStackBuild,/std::thread::spawn|WebView|Tauri|Start-Process/);
  assert.match(source,/native_source_inventory\(group\)/);
});
