# File: apps/vivim-host/public/onboarding.js

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/public/onboarding.js |
| Language | JavaScript |
| Kind | source |
| Size | 22483 B |
| Lines | 282 |
| Hash | 0f8ff6761e2b |
| Test | no |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| API | const | 2 | no | const API = &#39;/api/onboarding&#39;; |
| $ | function | 3 | no | const $ = id =&gt; document.getElementById(id); |
| STEPS | const | 4 | no | const STEPS = [ |
| CHECK_LABEL | const | 11 | no | const CHECK_LABEL = { ready: &#39;Signed in&#39;, signed_out: &#39;Needs sign-in&#39;, needs_attention: &#39;Needs attention&#39;, unknown: &#39;Not sure yet&#39;, studio_unavailable: &#39;Studio not running&#39; }; |
| CHECK_HELP | const | 12 | no | const CHECK_HELP = { |
| PASS_LABEL | const | 18 | no | const PASS_LABEL = { queued: &#39;Waiting&#39;, dispatching: &#39;Asking&#39;, awaiting: &#39;Waiting for reply&#39;, ingesting: &#39;Saving&#39;, complete: &#39;Done&#39;, blocked: &#39;Stopped&#39;, failed: &#39;Stopped&#39;, cancelled: &#39;Cancelled&#39;, unc… |
| model | variable | 19 | no | let model = null, step = -1, userMoved = false, review = null, busy = new Set(), form = { workspaceRoot: null, chromeExe: null }; |
| pairContext | variable | 20 | no | let pairContext = null; |
| registerPhoneApk | function | 21 | no | async function registerPhoneApk() { |
| mintPhoneCode | function | 24 | no | async function mintPhoneCode() { |
| phone | const | 25 | no | const phone = model?.onboarding?.phone; |
| result | const | 28 | no | const result = await post(&#39;/pair/register&#39;, { platform: &#39;android&#39;, app: &#39;vivim-mobile&#39; }); |
| h | function | 36 | no | function h(tag, props = {}, ...kids) { |
| el | const | 37 | no | const el = document.createElement(tag); |
| call | function | 45 | no | async function call(route, options = {}) { |
| response | const | 46 | no | const response = await fetch(API + route, { cache: &#39;no-store&#39;, headers: { &#39;content-type&#39;: &#39;application/json&#39; }, ...options }); |
| body | const | 47 | no | const body = response.status === 204 ? null : await response.json().catch(() =&gt; null); |
| post | function | 51 | no | const post = (route, data = {}) =&gt; call(route, { method: &#39;POST&#39;, body: JSON.stringify(data) }); |
| say | function | 52 | no | function say(message) { const n = $(&#39;notice&#39;); n.hidden = !message; n.textContent = message \|\| &#39;&#39;; } |
| run | function | 53 | no | async function run(key, task) { |
| progress | function | 61 | no | function progress() { |
| o | const | 62 | no | const o = model?.onboarding; |
| verified | const | 63 | no | const verified = (o?.providers ?? []).filter(p =&gt; p.check?.verified); |
| firstOpen | function | 72 | no | function firstOpen(p) { const i = [p.computer, p.accounts, p.main, p.phone].findIndex(done =&gt; !done); return i === -1 ? 4 : i; } |
| canContinue | function | 73 | no | function canContinue(p) { return step === 4 ? false : step === 3 ? true : [p.computer, p.accounts, p.main][step] === true; } |
| stepComputer | function | 76 | no | function stepComputer() { |
| env | const | 77 | no | const env = model, ok = env.node?.ok, browser = env.chrome; |
| done | const | 79 | no | const done = env.manifest.complete; |
| row | function | 80 | no | const row = (good, label, detail) =&gt; h(&#39;li&#39;, { class: &#39;check &#39; + (good ? &#39;is-ok&#39; : &#39;is-open&#39;) }, h(&#39;span&#39;, { class: &#39;check-mark&#39;, &#39;aria-hidden&#39;: &#39;true&#39; }, good ? &#39;✓&#39; : &#39;&#39;), h(&#39;div&#39;, {}, h(&#39;strong&#39;, {… |
| field | function | 81 | no | const field = (id, label, key, hint, readonly) =&gt; h(&#39;label&#39;, { class: &#39;field&#39;, for: id }, h(&#39;span&#39;, { text: label }), h(&#39;input&#39;, { id, type: &#39;text&#39;, value: form[key] ?? &#39;&#39;, readonly: readonly \|\| done… |
| chip | function | 100 | no | function chip(state, text) { return h(&#39;span&#39;, { class: &#39;pill &#39; + (state === &#39;ready&#39; ? &#39;online&#39; : state === &#39;signed_out&#39; \|\| state === &#39;needs_attention&#39; ? &#39;stale&#39; : &#39;unknown&#39;), text }); } |
| stepAccounts | function | 101 | no | function stepAccounts() { |
| o | const | 102 | no | const o = model.onboarding, studioUp = o.studio.reachable; |
| check | const | 106 | no | const check = p.check, state = check?.state; |
| busyOpen | const | 107 | no | const busyOpen = busy.has(&#39;open:&#39; + p.id), busyCheck = busy.has(&#39;check:&#39; + p.id); |
| passList | function | 120 | no | function passList(passes) { |
| stepMain | function | 126 | no | function stepMain() { |
| o | const | 127 | no | const o = model.onboarding, pz = o.personalization, verified = progress().verified; |
| pick | const | 128 | no | const pick = h(&#39;fieldset&#39;, { class: &#39;choices&#39; }, h(&#39;legend&#39;, { text: &#39;Your main AI&#39; }), ...o.providers.map(p =&gt; { const ready = Boolean(p.check?.verified), id = &#39;main-&#39; + p.id; return h(&#39;label&#39;, { cl… |
| ready | const | 130 | no | const ready = Boolean(p.check?.verified), id = &#39;main-&#39; + p.id; |
| out | const | 136 | no | const out = [pick]; |
| card | const | 143 | no | const card = h(&#39;div&#39;, { class: &#39;panel-soft&#39; }, h(&#39;span&#39;, { class: &#39;eyebrow&#39;, text: &#39;IN THE BACKGROUND&#39; }), h(&#39;h2&#39;, { text: &#39;Let VIVIM learn your style&#39; }), h(&#39;p&#39;, { text: &#39;VIVIM will ask ChatGPT two … |
| drawQr | function | 163 | no | function drawQr(url) { |
| qr | const | 164 | no | const qr = window.qrcode(0, &#39;M&#39;); qr.addData(url); qr.make(); |
| n | const | 165 | no | const n = qr.getModuleCount(), ns = &#39;http://www.w3.org/2000/svg&#39;; |
| svg | const | 166 | no | const svg = document.createElementNS(ns, &#39;svg&#39;); |
| bg | const | 168 | no | const bg = document.createElementNS(ns, &#39;rect&#39;); bg.setAttribute(&#39;x&#39;, -2); bg.setAttribute(&#39;y&#39;, -2); bg.setAttribute(&#39;width&#39;, n + 4); bg.setAttribute(&#39;height&#39;, n + 4); bg.setAttribute(&#39;fill&#39;, &#39;#fffff… |
| path | const | 169 | no | const path = document.createElementNS(ns, &#39;path&#39;); let d = &#39;&#39;; |
| stepPhone | function | 174 | no | function stepPhone() { |
| phone | const | 175 | no | const phone = model.onboarding.phone, url = phone.mobileUrl, apk = phone.apk; |
| number | function | 176 | no | const number = (n, title, body) =&gt; h(&#39;li&#39;, {}, h(&#39;span&#39;, { class:&#39;num&#39;, &#39;aria-hidden&#39;:true, text:n }), h(&#39;div&#39;, {}, h(&#39;strong&#39;, { text:title }), body)); |
| copy | function | 177 | no | const copy = (label, value) =&gt; h(&#39;button&#39;, { class:&#39;btn sm&#39;, type:&#39;button&#39;, onclick:async e =&gt; { try { await navigator.clipboard.writeText(value); e.currentTarget.textContent=&#39;Copied&#39;; } catch { say(… |
| paired | const | 181 | no | const paired = Boolean(phone.paired); |
| result | const | 182 | no | const result = [ |
| steps | const | 193 | no | const steps = h(&#39;ol&#39;, { class:&#39;numbered&#39; }, number(&#39;1&#39;, &#39;Install the Android app&#39;, apk ? h(&#39;div&#39;, {}, h(&#39;p&#39;, { text:&#39;Version &#39;+ (apk.versionName \|\| &#39;available&#39;) +&#39; is ready. Download the APK on Andro… |
| stepReady | function | 223 | no | function stepReady() { |
| o | const | 224 | no | const o = model.onboarding, p = progress(), pz = o.personalization; |
| line | function | 225 | no | const line = (done, text) =&gt; h(&#39;li&#39;, { class: done ? &#39;is-ok&#39; : &#39;is-open&#39; }, h(&#39;span&#39;, { class: &#39;check-mark&#39;, &#39;aria-hidden&#39;: &#39;true&#39; }, done ? &#39;✓&#39; : &#39;&#39;), text); |
| next | function | 226 | no | const next = (title, body) =&gt; h(&#39;li&#39;, {}, h(&#39;strong&#39;, { text: title }), h(&#39;span&#39;, { text: body })); |
| renderRail | function | 245 | no | function renderRail(p) { |
| done | const | 246 | no | const done = [p.computer, p.accounts, p.main, p.phone, false]; |
| renderStrip | function | 251 | no | function renderStrip() { |
| pz | const | 252 | no | const pz = model.onboarding.personalization, strip = $(&#39;bg-strip&#39;); |
| text | const | 253 | no | const text = { running: &#39;Learning your style…&#39;, done: &#39;Your style is learned&#39;, attention: &#39;Personalizing needs you&#39;, uncertain: &#39;Personalizing paused&#39; }[pz.phase]; |
| render | function | 259 | no | function render() { |
| p | const | 261 | no | const p = progress(); |
| s | const | 263 | no | const s = STEPS[step]; |
| builders | const | 266 | no | const builders = [stepComputer, stepAccounts, stepMain, stepPhone, stepReady]; |
| focusId | const | 267 | no | const focusId = document.activeElement?.id; |
| refresh | function | 275 | no | async function refresh() { |

## Imports

_No imports._

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// VIVIM guided setup. Every value from the Host API is inserted with textContent; no innerHTML.
const API = '/api/onboarding';
const $ = id => document.getElementById(id);
const STEPS = [
  { id: 'computer', rail: 'This computer', eyebrow: 'STEP 1 OF 5', title: 'Set up VIVIM on this PC', sub: 'VIVIM keeps your data in one folder and uses its own browser profile, so your everyday Chrome is never touched.' },
  { id: 'accounts', rail: 'Your AI accounts', eyebrow: 'STEP 2 OF 5', title: 'Sign in to the AIs you use', sub: 'Sign in once in the VIVIM browser. VIVIM never sees your passwords and never uses API keys.' },
  { id: 'main', rail: 'Your main AI', eyebrow: 'STEP 3 OF 5', title: 'Choose your main AI', sub: 'This is where VIVIM starts. It can learn your style in the background while you set up your phone.' },
  { id: 'phone', rail: 'Your phone', eyebrow: 'STEP 4 OF 5', title: 'Connect your phone', sub: 'Your phone is where you build your personal AI app. Setup continues there.' },
  { id: 'ready', rail: 'All set', eyebrow: 'STEP 5 OF 5', title: 'Your VIVIM is getting ready', sub: 'Here is where things stand and what you can do next.' }
];
const CHECK_LABEL = { ready: 'Signed in', signed_out: 'Needs sign-in', needs_attention: 'Needs attention', unknown: 'Not sure yet', studio_unavailable: 'Studio not running' };
const CHECK_HELP = {
  signed_out: 'Sign in in the VIVIM browser, then check again.',
  needs_attention: 'Open it in the VIVIM browser: there may be an unsent draft or a verification step.',
  unknown: 'VIVIM could not tell. Open it in the VIVIM browser, then check again.',
  studio_unavailable: 'Start VIVIM in step 1, then check again.'
};
const PASS_LABEL = { queued: 'Waiting', dispatching: 'Asking', awaiting: 'Waiting for reply', ingesting: 'Saving', complete: 'Done', blocked: 'Stopped', failed: 'Stopped', cancelled: 'Cancelled', uncertain: 'Not sure' };
let model = null, step = -1, userMoved = false, review = null, busy = new Set(), form = { workspaceRoot: null, chromeExe: null };
let pairContext = null;
async function registerPhoneApk() {
  await post('/apk/register', { apkPath: 'studio/android/build/vivim-release.apk' });
}
async function mintPhoneCode() {
  const phone = model?.onboarding?.phone;
  if (!phone?.mobileUrl) { say('Set up a private Tailscale HTTPS address before pairing this phone.'); return; }
  await run('pair', async () => {
    const result = await post('/pair/register', { platform: 'android', app: 'vivim-mobile' });
    if (!/^[a-f0-9]{64}$/.test(String(result.token || ''))) throw new Error('The pairing code could not be prepared.');
    pairContext = { url: phone.mobileUrl.replace(/\/$/, '') + '/#' + result.token,
                    expiresAt: new Date(result.expiresAt).toISOString() };
  });
}


function h(tag, props = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v; else if (k.startsWith('on')) el.addEventListener(k.slice(2), v); else if (k === 'text') el.textContent = v; else el.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat()) if (kid != null && kid !== false) el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  return el;
}
async function call(route, options = {}) {
  const response = await fetch(API + route, { cache: 'no-store', headers: { 'content-type': 'application/json' }, ...options });
  const body = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok || body?.ok === false) throw Object.assign(new Error(body?.error || `Request failed (${response.status})`), { code: body?.code });
  return body;
}
const post = (route, data = {}) => call(route, { method: 'POST', body: JSON.stringify(data) });
function say(message) { const n = $('notice'); n.hidden = !message; n.textContent = message || ''; }
async function run(key, task) {
  if (busy.has(key)) return;
  busy.add(key); say(''); render();
  try { await task(); } catch (error) { say(error.message); }
  busy.delete(key); await refresh();
}

// ---- derived progress (the page never trusts its own memory over the Host) ----
function progress() {
  const o = model?.onboarding;
  const verified = (o?.providers ?? []).filter(p => p.check?.verified);
  return {
    computer: Boolean(model?.manifest?.complete),
    accounts: verified.length > 0,
    main: Boolean(o?.primary),
    phone: Boolean(o?.phone?.paired),
    verified
  };
}
function firstOpen(p) { const i = [p.computer, p.accounts, p.main, p.phone].findIndex(done => !done); return i === -1 ? 4 : i; }
function canContinue(p) { return step === 4 ? false : step === 3 ? true : [p.computer, p.accounts, p.main][step] === true; }

// ---- steps ----
function stepComputer() {
  const env = model, ok = env.node?.ok, browser = env.chrome;
  form.workspaceRoot ??= env.defaultWorkspaceRoot; form.chromeExe ??= env.defaultChromeExe;
  const done = env.manifest.complete;
  const row = (good, label, detail) => h('li', { class: 'check ' + (good ? 'is-ok' : 'is-open') }, h('span', { class: 'check-mark', 'aria-hidden': 'true' }, good ? '✓' : ''), h('div', {}, h('strong', { text: label }), detail ? h('small', { text: detail }) : null));
```

_First 80 of 283 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
