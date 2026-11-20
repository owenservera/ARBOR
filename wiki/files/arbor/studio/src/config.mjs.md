# File: studio/src/config.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | studio/src/config.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 12241 B |
| Lines | 225 |
| Hash | 24c93c78b65f |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| TOOL_ROOT | const | 8 | yes | export const TOOL_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), &#39;..&#39;); |
| VERSION | const | 9 | yes | export const VERSION = JSON.parse(readFileSync(path.join(TOOL_ROOT, &#39;package.json&#39;), &#39;utf8&#39;)).version; |
| workspaceManifestFile | function | 16 | yes | export function workspaceManifestFile(env = process.env) { |
| install | const | 19 | no | const install = path.join(env.LOCALAPPDATA, &#39;VIVIM&#39;, &#39;cli&#39;, &#39;installation.json&#39;); |
| dataDir | const | 21 | no | const dataDir = JSON.parse(readFileSync(install, &#39;utf8&#39;).replace(/^\\uFEFF/, &#39;&#39;)).dataDir; |
| loadCompletedWorkspace | function | 27 | yes | export function loadCompletedWorkspace(file) { |
| defaultDataDir | function | 36 | yes | export function defaultDataDir(env = process.env, platform = process.platform) { |
| workspace | const | 38 | no | const workspace = loadCompletedWorkspace(workspaceManifestFile(env)); |
| xdg | const | 43 | no | const xdg = env.XDG_DATA_HOME; |
| relayPathImpl | function | 48 | no | const relayPathImpl = platform =&gt; platform === &#39;win32&#39; ? path.win32 : path.posix; |
| defaultHarnessDir | function | 49 | yes | export function defaultHarnessDir(env = process.env, platform = process.platform) { |
| paths | const | 50 | no | const paths = relayPathImpl(platform); |
| defaultModelsFile | function | 56 | yes | export function defaultModelsFile(env = process.env, platform = process.platform) { |
| dataPaths | function | 61 | yes | export function dataPaths(dataDir = defaultDataDir()) { |
| workspace | const | 64 | no | const workspace = loadCompletedWorkspace(path.join(dataDir, MANIFEST_FILE)); |
| sameRoot | const | 65 | no | const sameRoot = workspace &amp;&amp; path.resolve(workspace.workspaceRoot).toLowerCase() === path.resolve(dataDir).toLowerCase(); |
| ensureDataDirs | function | 79 | yes | export function ensureDataDirs(paths) { |
| EXIT | const | 87 | yes | export const EXIT = Object.freeze({ OK: 0, ERROR: 1, // unexpected / runtime failure USAGE: 2, // bad flags, missing arguments, unknown command NOT_FOUND: 3, // session / profile / dataset / entity d… |
| EXPORT_FORMATS | const | 99 | yes | export const EXPORT_FORMATS = [&#39;jsonl&#39;, &#39;ndjson&#39;, &#39;json&#39;, &#39;csv&#39;, &#39;tsv&#39;, &#39;md&#39;, &#39;html&#39;]; |
| asInt | function | 101 | no | const asInt = (min, max) =&gt; (v) =&gt; { |
| n | const | 102 | no | const n = Number(v); |
| asNum | function | 106 | no | const asNum = (min) =&gt; (v) =&gt; { |
| n | const | 107 | no | const n = Number(v); |
| asBool | function | 111 | no | const asBool = (v) =&gt; { |
| asChoice | function | 117 | no | const asChoice = (...choices) =&gt; (v) =&gt; { |
| asString | function | 121 | no | const asString = (v) =&gt; String(v); |
| SETTINGS_SCHEMA | const | 124 | yes | export const SETTINGS_SCHEMA = Object.freeze({ cdpPort: { default: 9222, parse: asInt(1, 65535), env: &#39;CAPTURE_STUDIO_CDP_PORT&#39;, desc: &#39;Chrome DevTools port used for capture&#39; }, studioPort: { default… |
| parseSetting | function | 135 | yes | export function parseSetting(key, raw) { |
| spec | const | 136 | no | const spec = SETTINGS_SCHEMA[key]; |
| loadUserConfig | function | 142 | yes | export function loadUserConfig(configFile) { |
| raw | variable | 144 | no | let raw; |
| values | const | 146 | no | const values = {}, problems = []; |
| sleepSync | function | 156 | no | const sleepSync = (ms) =&gt; { Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms); }; |
| REPLACE_RETRY_CODES | const | 162 | no | const REPLACE_RETRY_CODES = new Set([&#39;EPERM&#39;, &#39;EBUSY&#39;, &#39;EACCES&#39;, &#39;ENOTEMPTY&#39;]); |
| replaceWithRetry | function | 164 | no | function replaceWithRetry(from, to, budgetMs = 5000) { |
| deadline | const | 165 | no | const deadline = Date.now() + budgetMs; |
| saveUserConfig | function | 179 | yes | export function saveUserConfig(configFile, values) { |
| body | const | 181 | no | const body = JSON.stringify(values, null, 2) + &#39;\\n&#39;; |
| temp | const | 184 | no | const temp = `${configFile}.${process.pid}.${randomBytes(8).toString(&#39;hex&#39;)}.tmp`; |
| resolveSettings | function | 194 | yes | export function resolveSettings({ configFile, env = process.env, flags = {} } = {}) { |
| settings | const | 196 | no | const settings = {}, sources = {}; |
| cachedSha | variable | 211 | no | let cachedSha; |
| collectorSourceSha | function | 212 | yes | export function collectorSourceSha() { |
| h | const | 214 | no | const h = createHash(&#39;sha256&#39;); |
| walk | function | 215 | no | const walk = (dir) =&gt; { |
| p | const | 217 | no | const p = path.join(dir, name); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:os | import | 1 | external |
| node:path | import | 2 | external |
| node:crypto | import | 3 | external |
| node:fs | import | 4 | external |
| node:url | import | 5 | external |
| ./workspace-manifest.mjs | import | 6 | [studio/src/workspace-manifest.mjs](./workspace-manifest.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [apps/vivim-host/server.mjs](../../apps/vivim-host/server.mjs.md) | ../../studio/src/config.mjs |
| [harness/bin/wh-mcp.mjs](../../harness/bin/wh-mcp.mjs.md) | ../../studio/src/config.mjs |
| [harness/bin/wh.mjs](../../harness/bin/wh.mjs.md) | ../../studio/src/config.mjs |
| [harness/src/dev/cli.mjs](../../harness/src/dev/cli.mjs.md) | ../../../studio/src/config.mjs |
| [studio/bin/commands/ask.mjs](../bin/commands/ask.mjs.md) | ../../src/config.mjs |
| [studio/bin/commands/campaign.mjs](../bin/commands/campaign.mjs.md) | ../../src/config.mjs |
| [studio/bin/commands/chat.mjs](../bin/commands/chat.mjs.md) | ../../src/config.mjs |
| [studio/bin/commands/drive.mjs](../bin/commands/drive.mjs.md) | ../../src/config.mjs |
| [studio/bin/commands/library.mjs](../bin/commands/library.mjs.md) | ../../src/config.mjs |
| [studio/bin/commands/platform.mjs](../bin/commands/platform.mjs.md) | ../../src/config.mjs |
| [studio/bin/commands/providers.mjs](../bin/commands/providers.mjs.md) | ../../src/config.mjs |
| [studio/bin/commands/recipes.mjs](../bin/commands/recipes.mjs.md) | ../../src/config.mjs |
| [studio/bin/commands/relay.mjs](../bin/commands/relay.mjs.md) | ../../src/config.mjs |
| [studio/bin/commands/run.mjs](../bin/commands/run.mjs.md) | ../../src/config.mjs |
| [studio/bin/commands/selftest.mjs](../bin/commands/selftest.mjs.md) | ../../src/config.mjs |
| [studio/bin/commands/sessions.mjs](../bin/commands/sessions.mjs.md) | ../../src/config.mjs |
| [studio/bin/commands/setup.mjs](../bin/commands/setup.mjs.md) | ../../src/config.mjs |
| [studio/bin/commands/system.mjs](../bin/commands/system.mjs.md) | ../../src/config.mjs |
| [studio/bin/commands/tools.mjs](../bin/commands/tools.mjs.md) | ../../src/config.mjs |
| [studio/bin/lib/args.mjs](../bin/lib/args.mjs.md) | ../../src/config.mjs |
| [studio/bin/lib/context.mjs](../bin/lib/context.mjs.md) | ../../src/config.mjs |
| [studio/bin/lib/ui.mjs](../bin/lib/ui.mjs.md) | ../../src/config.mjs |
| [studio/bin/relay-chat-mvp.mjs](../bin/relay-chat-mvp.mjs.md) | ../src/config.mjs |
| [studio/bin/studio.mjs](../bin/studio.mjs.md) | ../src/config.mjs |
| [studio/scripts/ai-chat-report.mjs](../scripts/ai-chat-report.mjs.md) | ../src/config.mjs |
| [studio/scripts/always-on.mjs](../scripts/always-on.mjs.md) | ../src/config.mjs |
| [studio/scripts/categorization-scoreboard.mjs](../scripts/categorization-scoreboard.mjs.md) | ../src/config.mjs |
| [studio/scripts/core-local-handoff.mjs](../scripts/core-local-handoff.mjs.md) | ../src/config.mjs |
| [studio/scripts/fidelity-survey.mjs](../scripts/fidelity-survey.mjs.md) | ../src/config.mjs |
| [studio/scripts/induce-vs-handmap.mjs](../scripts/induce-vs-handmap.mjs.md) | ../src/config.mjs |
| [studio/scripts/proto-field-search.mjs](../scripts/proto-field-search.mjs.md) | ../src/config.mjs |
| [studio/src/agents/personal-agent-service.mjs](./agents/personal-agent-service.mjs.md) | ../config.mjs |
| [studio/src/capture/actions.mjs](./capture/actions.mjs.md) | ../config.mjs |
| [studio/src/capture/campaign.mjs](./capture/campaign.mjs.md) | ../config.mjs |
| [studio/src/capture/recorder.mjs](./capture/recorder.mjs.md) | ../config.mjs |
| [studio/src/families/families.mjs](./families/families.mjs.md) | ../config.mjs |
| [studio/src/intel/platform.mjs](./intel/platform.mjs.md) | ../config.mjs |
| [studio/src/mcp/runtime.mjs](./mcp/runtime.mjs.md) | ../config.mjs |
| [studio/src/mcp/server-stdio.mjs](./mcp/server-stdio.mjs.md) | ../config.mjs |
| [studio/src/profiles/profiles.mjs](./profiles/profiles.mjs.md) | ../config.mjs |
| [studio/src/replay/derive.mjs](./replay/derive.mjs.md) | ../config.mjs |
| [studio/src/studio/integration-hub.mjs](./studio/integration-hub.mjs.md) | ../config.mjs |
| [studio/src/studio/server.mjs](./studio/server.mjs.md) | ../config.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
import os from 'node:os';
import path from 'node:path';
import { createHash, randomBytes } from 'node:crypto';
import { readdirSync, readFileSync, writeFileSync, statSync, existsSync, mkdirSync, renameSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { MANIFEST_FILE, readManifest } from './workspace-manifest.mjs';

export const TOOL_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const VERSION = JSON.parse(readFileSync(path.join(TOOL_ROOT, 'package.json'), 'utf8')).version;

// START01: the owner's completed workspace manifest is the source of truth for the data root
// and signed-in Chrome profile. It is located through VIVIM_WORKSPACE_MANIFEST or, on Windows,
// through the installed CLI's installation.json (its dataDir holds vivim-workspace.json).
// A missing, unreadable or incomplete manifest is ignored here, and legacy defaults apply.
// LOCALAPPDATA only exists where the Windows CLI can be installed, so no platform check is needed.
export function workspaceManifestFile(env = process.env) {
  if (env.VIVIM_WORKSPACE_MANIFEST) return env.VIVIM_WORKSPACE_MANIFEST;
  if (!env.LOCALAPPDATA) return null;
  const install = path.join(env.LOCALAPPDATA, 'VIVIM', 'cli', 'installation.json');
  try {
    const dataDir = JSON.parse(readFileSync(install, 'utf8').replace(/^\uFEFF/, '')).dataDir;
    return typeof dataDir === 'string' && path.isAbsolute(dataDir) ? path.join(dataDir, MANIFEST_FILE) : null;
  } catch { return null; }
}

// Returns the manifest only when setup is complete and every referenced path still exists.
export function loadCompletedWorkspace(file) {
  if (!file || !existsSync(file)) return null;
  try {
    const { manifest, ok } = readManifest(file);
    return ok && manifest.setupComplete === true ? manifest : null;
  } catch { return null; }
}

// Captured data is private and lives OUTSIDE the repository by default.
export function defaultDataDir(env = process.env, platform = process.platform) {
  if (env.CAPTURE_STUDIO_HOME) return env.CAPTURE_STUDIO_HOME;
  const workspace = loadCompletedWorkspace(workspaceManifestFile(env));
  if (workspace) return workspace.workspaceRoot;
  if (platform === 'win32') return path.join(env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local'), 'AION', 'capture-studio');
  if (platform === 'darwin') return path.join(os.homedir(), 'Library', 'Application Support', 'AION', 'capture-studio');
  // XDG_DATA_HOME is required to be absolute; a relative value must never place private evidence in the source checkout.
  const xdg = env.XDG_DATA_HOME;
  return path.join(xdg && path.isAbsolute(xdg) ? xdg : path.join(os.homedir(), '.local', 'share'), 'aion-capture-studio');
}

// Preserve the deployed Linux box default; Windows uses the harness in this checkout.
const relayPathImpl = platform => platform === 'win32' ? path.win32 : path.posix;
export function defaultHarnessDir(env = process.env, platform = process.platform) {
  const paths = relayPathImpl(platform);
  if (env.WH_HARNESS_DIR) return paths.resolve(env.WH_HARNESS_DIR);
  return platform === 'win32' ? paths.resolve(TOOL_ROOT, '..', 'harness')
    : paths.join(paths.parse(paths.resolve(os.homedir())).root, 'workspace', 'vivim-web-harness', 'harness');
}

export function defaultModelsFile(env = process.env, platform = process.platform) {
  return env.WH_MODELS_FILE || relayPathImpl(platform).resolve(defaultHarnessDir(env, platform), '..', 'runtime', 'models.json');
}

// @serves 005
export function dataPaths(dataDir = defaultDataDir()) {
  // A completed manifest in this data root names the exact signed-in profile. Without one, the
  // historical <dataDir>/chrome-profile applies. The profile directory is never created here.
  const workspace = loadCompletedWorkspace(path.join(dataDir, MANIFEST_FILE));
  const sameRoot = workspace && path.resolve(workspace.workspaceRoot).toLowerCase() === path.resolve(dataDir).toLowerCase();
  return {
    root: dataDir,
    sessions: path.join(dataDir, 'sessions'),
    profiles: path.join(dataDir, 'profiles'),
    families: path.join(dataDir, 'families'),
    learner: path.join(dataDir, 'learner'),
    chromeProfile: sameRoot ? workspace.chrome.profileDir : path.join(dataDir, 'chrome-profile'),
    exports: path.join(dataDir, 'exports'),
    config: path.join(dataDir, 'config.json'),
  };
}

// Directories the CLI needs to exist before any command runs (exports is created lazily).
export function ensureDataDirs(paths) {
  for (const d of [paths.root, paths.sessions, paths.profiles, paths.families]) mkdirSync(d, { recursive: true });
```

_First 80 of 226 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
