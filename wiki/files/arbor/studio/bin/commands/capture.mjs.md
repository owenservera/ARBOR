# File: studio/bin/commands/capture.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/bin/commands/capture.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 30216 B |
| Lines | 437 |
| Hash | fb17a369fd8d |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| openUrl | function | 19 | no | function openUrl(url) { |
| cmd | const | 21 | no | const cmd = process.platform === &#39;win32&#39; ? [&#39;explorer.exe&#39;, [url]] : process.platform === &#39;darwin&#39; ? [&#39;open&#39;, [url]] : [&#39;xdg-open&#39;, [url]]; |
| child | const | 25 | no | const child = spawn(cmd[0], cmd[1], { detached: true, stdio: &#39;ignore&#39;, windowsHide: true }); |
| sleep | function | 31 | no | const sleep = (ms) =&gt; new Promise((r) =&gt; setTimeout(r, ms)); |
| profileDir | const | 42 | no | const profileDir = ctx.flags[&#39;profile-dir&#39;] ?? ctx.paths.chromeProfile; |
| r | const | 43 | no | const r = await launchChrome({ profileDir, port: ctx.port, url: ctx.flags.url ?? &#39;about:blank&#39;, headless: !!ctx.flags.headless }); |
| ts | variable | 52 | no | let ts; |
| rows | const | 58 | no | const rows = ts.map((t, i) =&gt; ({ index: i, id: t.id, title: t.title, url: t.url })); |
| studioFlags | const | 66 | no | const studioFlags = { |
| runStudio | function | 74 | no | async function runStudio(ctx, { launch }) { |
| lanPair | const | 76 | no | const lanPair = !!flags[&#39;lan-pair&#39;] \|\| process.env.CAPTURE_STUDIO_LAN_PAIR === &#39;1&#39;; |
| studioPort | const | 80 | no | const studioPort = Number(flags[&#39;studio-port&#39;] ?? ctx.settings.studioPort); |
| cdpLock | variable | 81 | no | let cdpLock; |
| r | variable | 89 | no | let r; |
| lanOptions | const | 96 | no | const lanOptions = lanPair ? { lanPair: true, accessMode: &#39;token&#39;, lanHost: flags[&#39;lan-host&#39;], ...(process.env.CAPTURE_STUDIO_TOKEN ? { token: process.env.CAPTURE_STUDIO_TOKEN } : {}) } : { lanPair: … |
| st | variable | 97 | no | let st; |
| shutdown | variable | 115 | no | let shutdown = null; |
| closeStudio | function | 116 | no | const closeStudio = () =&gt; { |
| pairFlags | const | 137 | no | const pairFlags = { |
| runningStudioPort | function | 142 | no | function runningStudioPort(ctx) { |
| lock | const | 144 | no | const lock = JSON.parse(readFileSync(lockPath(ctx.paths.root, ctx.port), &#39;utf8&#39;)); |
| lanStudioProbe | function | 152 | no | async function lanStudioProbe(address, port, token) { |
| res | const | 154 | no | const res = await fetch(`http://${address}:${port}/api/v1/health`, { headers: { &#39;x-studio-token&#39;: token }, signal: AbortSignal.timeout(2000) }); |
| body | const | 157 | no | const body = await res.json(); |
| pairingTarget | function | 162 | no | function pairingTarget(ctx) { |
| addresses | const | 163 | no | const addresses = lanAddresses(); |
| chosen | const | 164 | no | const chosen = pickLanAddress(addresses, ctx.flags[&#39;lan-host&#39;]); |
| port | const | 166 | no | const port = runningStudioPort(ctx) ?? Number(ctx.flags[&#39;studio-port&#39;] ?? ctx.settings.studioPort); |
| printPairing | function | 170 | no | function printPairing(out, { link, others, address }) { |
| stored | const | 187 | no | const stored = ensurePairingToken(ctx.paths.root); |
| target | const | 188 | no | const target = pairingTarget(ctx); |
| link | const | 189 | no | const link = pairingUrl({ address: target.address, port: target.port, token: stored.token }); |
| probe | const | 190 | no | const probe = await lanStudioProbe(target.address, target.port, stored.token); |
| rotated | const | 208 | no | const rotated = resetPairingToken(ctx.paths.root); |
| target | const | 210 | no | const target = pairingTarget(ctx); |
| link | const | 211 | no | const link = pairingUrl({ address: target.address, port: target.port, token: rotated.token }); |
| probe | const | 212 | no | const probe = await lanStudioProbe(target.address, target.port, rotated.token); |
| NET_KINDS | const | 226 | no | const NET_KINDS = new Set([&#39;req&#39;, &#39;res&#39;, &#39;chunk&#39;, &#39;body&#39;, &#39;es.msg&#39;, &#39;ws.frame&#39;, &#39;ws.open&#39;, &#39;done&#39;, &#39;fail&#39;]); |
| EXPORT_KINDS | const | 227 | no | const EXPORT_KINDS = [&#39;transcript&#39;, &#39;report&#39;, &#39;knowledge&#39;, &#39;schemas&#39;, &#39;graph-ranked&#39;, &#39;bundle&#39;]; |
| recordFlags | const | 229 | no | const recordFlags = { |
| summarizeRecording | function | 248 | no | function summarizeRecording(stop, derived, exportsWritten) { |
| r | const | 249 | no | const r = derived?.receipt; |
| writeExports | function | 261 | no | async function writeExports(ctx, session, kinds, outDirFlag) { |
| dir | const | 262 | no | const dir = path.resolve(outDirFlag ?? path.join(ctx.paths.exports, session.id)); |
| written | const | 263 | no | const written = []; |
| runRecording | function | 278 | no | async function runRecording(ctx, o) { |
| maxMb | const | 280 | no | const maxMb = o.maxMb ?? ctx.settings.maxMb; |
| liveModule | const | 281 | no | const liveModule = o.live ? await capability(&#39;../../src/capture/live-tap.mjs&#39;, [&#39;createLiveTap&#39;], &#39;Live capture decoding&#39;) : null; |
| rec | const | 283 | no | const rec = new Recorder({ sessionsDir: ctx.paths.sessions, profileStore: ctx.profiles(), familyStore: ctx.families(), port: ctx.port, tabs: o.tabs, follow: !!o.follow, allBodies: !!o.allBodies, maxS… |
| tap | const | 285 | no | const tap = liveModule ? await liveModule.createLiveTap(rec, { kinds: o.kinds, decode: true }) : null; |
| liveListeners | const | 286 | no | const liveListeners = []; |
| listener | function | 288 | no | const listener = (data) =&gt; { |
| text | const | 292 | no | const text = typeof data === &#39;string&#39; ? data : data?.delta ?? data?.text ?? data?.value; |
| cleanupTap | function | 299 | no | const cleanupTap = () =&gt; { |
| profile | const | 304 | no | const profile = o.profile ?? ctx.settings.defaultProfile ?? undefined; |
| session | variable | 305 | no | let session; |
| lastNet | variable | 311 | no | let lastNet = Date.now(); |
| done | variable | 316 | no | let done = false, sigints = 0; |
| timers | const | 317 | no | const timers = []; |
| onSignal | function | 318 | no | const onSignal = () =&gt; { if (++sigints &gt; 1) process.exit(130); stopNow(&#39;user_stop&#39;); }; |
| clearAll | function | 319 | no | const clearAll = () =&gt; { timers.forEach(clearInterval); timers.forEach(clearTimeout); process.off(&#39;SIGINT&#39;, onSignal); process.off(&#39;SIGTERM&#39;, onSignal); out.progressDone(); }; |
| finalize | function | 320 | no | const finalize = async (stop) =&gt; { |
| derived | variable | 322 | no | let derived = null; |
| s | const | 324 | no | const s = Session.open(ctx.paths.sessions, stop.id); |
| exportsWritten | const | 327 | no | const exportsWritten = o.exports?.length ? await writeExports(ctx, Session.open(ctx.paths.sessions, stop.id), o.exports, o.outDir) : []; |
| stopNow | function | 331 | no | const stopNow = async (reason) =&gt; { |
| st | const | 341 | no | const st = rec.status(); if (st.state !== &#39;recording&#39;) return; |
| n | const | 342 | no | const n = st.stats.network; |
| printRecordingSummary | function | 351 | no | function printRecordingSummary(o, s) { |
| optsFromFlags | function | 362 | no | const optsFromFlags = (ctx, extra = {}) =&gt; ({ target: ctx.flags.target, profile: ctx.flags.profile, label: ctx.flags.label, duration: ctx.flags.duration, idle: ctx.flags.idle, timeout: ctx.flags.time… |
| s | const | 375 | no | const s = await runRecording(ctx, optsFromFlags(ctx)); |
| normalizeUrl | function | 382 | no | function normalizeUrl(raw) { |
| u | variable | 383 | no | let u = String(raw).trim(); |
| parsed | variable | 385 | no | let parsed; |
| openTab | function | 391 | no | async function openTab(port, url) { |
| base | const | 392 | no | const base = endpointBase({ port }); |
| target | const | 393 | no | const target = `${base}/json/new?${encodeURI(url)}`; |
| res | variable | 394 | no | let res = await fetch(target, { method: &#39;PUT&#39; }); |
| urls | const | 410 | no | const urls = ctx.args.map(normalizeUrl); |
| r | const | 414 | no | const r = await launchChrome({ profileDir: ctx.paths.chromeProfile, port: ctx.port, url: &#39;about:blank&#39; }); |
| results | const | 416 | no | const results = []; |
| tab | const | 419 | no | const tab = await openTab(ctx.port, url); |
| deadline | const | 420 | no | const deadline = Date.now() + (flags.wait ?? 10) * 1000; |
| t | const | 422 | no | const t = (await listTargets({ port: ctx.port })).find((x) =&gt; x.id === tab.id); |
| opts | const | 428 | no | const opts = optsFromFlags(ctx, { target: tab.id, reload: flags.reload !== false }); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:path | import | 2 | external |
| node:fs | import | 3 | external |
| node:child_process | import | 4 | external |
| ../../src/chrome/launch.mjs | import | 5 | [studio/src/chrome/launch.mjs](../../src/chrome/launch.mjs.md) |
| ../../src/chrome/browser-ownership.mjs | import | 6 | [studio/src/chrome/browser-ownership.mjs](../../src/chrome/browser-ownership.mjs.md) |
| ../../src/cdp/discovery.mjs | import | 7 | [studio/src/cdp/discovery.mjs](../../src/cdp/discovery.mjs.md) |
| ../../src/capture/recorder.mjs | import | 8 | [studio/src/capture/recorder.mjs](../../src/capture/recorder.mjs.md) |
| ../../src/store/session.mjs | import | 9 | [studio/src/store/session.mjs](../../src/store/session.mjs.md) |
| ../../src/replay/derive.mjs | import | 10 | [studio/src/replay/derive.mjs](../../src/replay/derive.mjs.md) |
| ../../src/studio/server.mjs | import | 11 | [studio/src/studio/server.mjs](../../src/studio/server.mjs.md) |
| ../../src/studio/cdp-owner-lock.mjs | import | 12 | [studio/src/studio/cdp-owner-lock.mjs](../../src/studio/cdp-owner-lock.mjs.md) |
| ../../src/studio/lan-pair.mjs | import | 13 | [studio/src/studio/lan-pair.mjs](../../src/studio/lan-pair.mjs.md) |
| ../../src/export/export.mjs | import | 14 | [studio/src/export/export.mjs](../../src/export/export.mjs.md) |
| ../lib/registry.mjs | import | 15 | [studio/bin/lib/registry.mjs](../lib/registry.mjs.md) |
| ../lib/ui.mjs | import | 16 | [studio/bin/lib/ui.mjs](../lib/ui.mjs.md) |
| ../lib/capabilities.mjs | import | 17 | [studio/bin/lib/capabilities.mjs](../lib/capabilities.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/bin/studio.mjs](../studio.mjs.md) | ./commands/capture.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// start, serve, launch, targets, record, capture
import path from 'node:path';
import { readFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { launchChrome, findChrome } from '../../src/chrome/launch.mjs';
import { verifyBrowserOwner } from '../../src/chrome/browser-ownership.mjs';
import { listTargets, isReachable, endpointBase } from '../../src/cdp/discovery.mjs';
import { Recorder } from '../../src/capture/recorder.mjs';
import { Session } from '../../src/store/session.mjs';
import { derive } from '../../src/replay/derive.mjs';
import { startStudio } from '../../src/studio/server.mjs';
import { acquireCdpOwnerLock, lockPath } from '../../src/studio/cdp-owner-lock.mjs';
import { qrToTerminal, lanAddresses, pickLanAddress, pairingUrl, ensurePairingToken, resetPairingToken } from '../../src/studio/lan-pair.mjs';
import { exportTranscript, exportReport, exportKnowledge, exportBundle, exportSchemas, exportGraphRanked } from '../../src/export/export.mjs';
import { define, defineGroup } from '../lib/registry.mjs';
import { CliError, usageError, envError, fmtBytes } from '../lib/ui.mjs';
import { capability } from '../lib/capabilities.mjs';

function openUrl(url) {
  // Windows: explorer.exe takes the URL directly, so no cmd.exe shell ever parses it.
  const cmd = process.platform === 'win32' ? ['explorer.exe', [url]] : process.platform === 'darwin' ? ['open', [url]] : ['xdg-open', [url]];
  try {
    // The URL remains printable even when xdg-open/open/cmd is not installed.
    // Missing helper binaries emit an asynchronous error, not a synchronous throw.
    const child = spawn(cmd[0], cmd[1], { detached: true, stdio: 'ignore', windowsHide: true });
    child.on('error', () => {});
    child.unref();
  } catch { /* the URL is printed anyway */ }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------------------------------------
// Browser lifecycle
// ---------------------------------------------------------------------------------------------
define({
  name: 'launch', section: 'Capture', usage: '[--url URL]', summary: 'Open the dedicated capture browser (loopback DevTools only)',
  description: 'Starts Chrome with a separate profile and a loopback-only DevTools port. Sign in to the sites you want to capture in that window; the profile persists between runs.',
  flags: { url: { type: 'string', valueName: 'URL', desc: 'Page to open (default about:blank)' }, headless: { type: 'boolean', desc: 'Run without a visible window' },
    'profile-dir': { type: 'string', valueName: 'DIR', desc: 'Chrome profile folder (default: the data folder chrome-profile; vivim start passes the manifest profile)' } },
  async run(ctx) {
    const profileDir = ctx.flags['profile-dir'] ?? ctx.paths.chromeProfile;
    const r = await launchChrome({ profileDir, port: ctx.port, url: ctx.flags.url ?? 'about:blank', headless: !!ctx.flags.headless });
    ctx.out.emit(r, (o) => o.result(r.alreadyRunning ? `Capture browser already running (${r.browser}) on port ${ctx.port}.` : `Capture browser opened (${r.browser}). Sign in to the sites you want to capture in this window.`));
  },
});

define({
  name: 'targets', section: 'Capture', usage: '[--filter TEXT]', summary: 'List tabs in the capture browser that can be recorded',
  flags: { filter: { type: 'string', alias: 'f', valueName: 'TEXT', desc: 'Only tabs whose title or URL contains TEXT' } },
  async run(ctx) {
    let ts;
    try {
      await verifyBrowserOwner({ profileDir: ctx.paths.chromeProfile, port: ctx.port });
      ts = await listTargets({ port: ctx.port });
    } catch (e) { throw envError(`Capture browser not available or not verified: ${e.message}`, 'Use "studio start" with the dedicated VIVIM profile.'); }
    if (ctx.flags.filter) { const f = ctx.flags.filter.toLowerCase(); ts = ts.filter((t) => t.url.toLowerCase().includes(f) || (t.title ?? '').toLowerCase().includes(f)); }
    const rows = ts.map((t, i) => ({ index: i, id: t.id, title: t.title, url: t.url }));
    ctx.out.emit(rows, (o) => {
      if (!rows.length) { o.line('No tabs open.'); return; }
      for (const r of rows) o.result(`${String(r.index).padStart(2)}  ${r.id.slice(0, 8)}  ${r.title}\n      ${r.url}`);
    });
  },
});

const studioFlags = {
  'studio-port': { type: 'number', valueName: 'N', desc: 'Port for the studio UI (default 7878)' },
  'no-open': { type: 'boolean', desc: 'Do not open the studio in a browser window' },
  url: { type: 'string', valueName: 'URL', desc: 'Page to open in the capture browser (start only)' },
  'lan-pair': { type: 'boolean', desc: 'OPT-IN: listen on the WiFi/LAN (0.0.0.0) so a phone can open the mobile surface; token required, prints a pairing URL + QR' },
  'lan-host': { type: 'string', valueName: 'IP', desc: 'With --lan-pair: which of this PC\'s IPv4 addresses to put in the pairing URL (default: best guess)' },
};

async function runStudio(ctx, { launch }) {
  const { out, flags } = ctx;
  const lanPair = !!flags['lan-pair'] || process.env.CAPTURE_STUDIO_LAN_PAIR === '1';
  if (flags['lan-host'] && !lanPair) throw usageError('--lan-host only applies together with --lan-pair.');
  // One Studio per CDP port, machine-wide. Taken BEFORE any browser launch so a non-owner can never
  // relaunch or fight over the owner's Chrome.
  const studioPort = Number(flags['studio-port'] ?? ctx.settings.studioPort);
```

_First 80 of 438 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
