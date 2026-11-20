# File: harness/test/interface/attach-target.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | harness/test/interface/attach-target.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 9235 B |
| Lines | 101 |
| Hash | d409bd7b7b6f |
| Test | yes |
| Generated | no |
| Component | harness |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| PROFILE | const | 11 | no | const PROFILE = join(tmpdir(), &#39;wh-attach-profile&#39;, &#39;Fork-12&#39;); |
| ss | const | 12 | no | const ss = &#39;LISTEN 0 10 127.0.0.1:9234 0.0.0.0:* users:((&quot;chrome&quot;,pid=42,fd=88))\\nLISTEN 0 10 127.0.0.1:9333 0.0.0.0:* users:((&quot;chrome&quot;,pid=7,fd=9))&#39;; |
| argv | function | 13 | no | const argv = (dir, port = 9234) =&gt; [&#39;/opt/chrome&#39;, `--user-data-dir=${dir}`, `--remote-debugging-port=${port}`].join(&#39;\\0&#39;); |
| profile | const | 33 | no | const profile = &#39;/home/box/chrome-profile/Fork-12&#39;; |
| target | const | 34 | no | const target = resolveTarget({ WH_CDP_PORT: &#39;9234&#39;, WH_ATTACH_PROFILE: profile }, &#39;linux&#39;); |
| target | const | 43 | no | const target = resolveTarget({ WH_CDP_PORT: &#39;9234&#39;, WH_ATTACH_PROFILE: &#39;C:\\\\Vivim Profile&#39; }, &#39;win32&#39;); |
| browser | const | 44 | no | const browser = { pid: 42, name: &#39;chrome.exe&#39;, commandLine: &#39;&quot;C:\\\\Program Files\\\\Google\\\\Chrome\\\\chrome.exe&quot; --user-data-dir=&quot;c:\\\\vivim profile&quot; --remote-debugging-port=9234&#39; }; |
| check | function | 45 | no | const check = record =&gt; verifyAttachTarget(target, { platform: &#39;win32&#39;, run: cmd =&gt; { assert.equal(cmd, &#39;powershell.exe&#39;); return JSON.stringify(record); } }); |
| fixture | function | 73 | no | async function fixture(t, { verifyTarget = () =&gt; true, standingOk = true } = {}) { |
| dir | const | 74 | no | const dir = await mkdtemp(join(tmpdir(), &#39;wh-attach-&#39;)); t.after(() =&gt; rm(dir, { recursive: true, force: true })); |
| records | const | 75 | no | const records = new Map(); const calls = { connect: [], open: [], closed: 0, sends: 0 }; |
| journal | const | 76 | no | const journal = { async create(r) { if (records.has(r.requestId)) return { created: false, existing: records.get(r.requestId) }; records.set(r.requestId, { ...r, state: &#39;accepted&#39;, submitted: &#39;no&#39; })… |
| page | const | 77 | no | const page = { close: async () =&gt; { calls.closed++; } }; |
| deps | const | 78 | no | const deps = { createJournal: () =&gt; journal, getProvider: id =&gt; ({ id, url: &#39;https://chatgpt.com/&#39;, status: &#39;measured&#39; }), listProviders: () =&gt; [], digestPayload: x =&gt; createHash(&#39;sha256&#39;).update(x).… |
| approvals | const | 81 | no | const approvals = createApprovals({ dir: join(dir, &#39;approvals&#39;), print: () =&gt; {} }); |
| standing | const | 82 | no | const standing = { check: async () =&gt; ({ ok: standingOk }), recordSend: async () =&gt; {} }; |
| target | const | 83 | no | const target = { host: &#39;127.0.0.1&#39;, port: 9234, mode: &#39;attach&#39;, profile: PROFILE }; |
| router | const | 84 | no | const router = await createRouter({ dir, deps, approvals, standing, target, verifyTarget, pollMs: 1 }); |
| f | const | 88 | no | const f = await fixture(t); |
| r | const | 89 | no | const r = await f.router.ask({ provider: &#39;chatgpt&#39;, prompt: &#39;Reply with OK&#39; }); |
| done | const | 92 | no | const done = await f.router.wait(r.requestId, 1000); |
| f | const | 97 | no | const f = await fixture(t, { verifyTarget: () =&gt; { throw Object.assign(new Error(&#39;mismatch&#39;), { code: &#39;ATTACH_PROFILE_MISMATCH&#39; }); } }); |
| r | const | 98 | no | const r = await f.router.ask({ provider: &#39;chatgpt&#39;, prompt: &#39;Reply with OK&#39; }); await f.approvals.approve(r.requestId); |
| done | const | 99 | no | const done = await f.router.wait(r.requestId, 1000); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:fs/promises | import | 3 | external |
| node:os | import | 4 | external |
| node:path | import | 5 | external |
| node:crypto | import | 6 | external |
| ../../src/interface/target.mjs | import | 7 | [harness/src/interface/target.mjs](../../src/interface/target.mjs.md) |
| ../../src/interface/approval.mjs | import | 8 | [harness/src/interface/approval.mjs](../../src/interface/approval.mjs.md) |
| ../../src/interface/router.mjs | import | 9 | [harness/src/interface/router.mjs](../../src/interface/router.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { resolveTarget, commandLineMatches, verifyAttachTarget } from '../../src/interface/target.mjs';
import { createApprovals } from '../../src/interface/approval.mjs';
import { createRouter } from '../../src/interface/router.mjs';

const PROFILE = join(tmpdir(), 'wh-attach-profile', 'Fork-12');
const ss = 'LISTEN 0 10 127.0.0.1:9234 0.0.0.0:* users:(("chrome",pid=42,fd=88))\nLISTEN 0 10 127.0.0.1:9333 0.0.0.0:* users:(("chrome",pid=7,fd=9))';
const argv = (dir, port = 9234) => ['/opt/chrome', `--user-data-dir=${dir}`, `--remote-debugging-port=${port}`].join('\0');

test('default target is the lab endpoint', () => {
  assert.deepEqual(resolveTarget({}), { host: '127.0.0.1', port: 9333, mode: 'lab' });
});
test('attach mode is opt-in and needs both port and absolute profile', () => {
  assert.deepEqual(resolveTarget({ WH_CDP_PORT: '9234', WH_ATTACH_PROFILE: PROFILE }), { host: '127.0.0.1', port: 9234, mode: 'attach', profile: PROFILE });
  assert.throws(() => resolveTarget({ WH_CDP_PORT: '9234' }), { code: 'ATTACH_PROFILE_REQUIRED' });
  assert.throws(() => resolveTarget({ WH_CDP_PORT: '9234', WH_ATTACH_PROFILE: 'rel/dir' }), { code: 'ATTACH_PROFILE_REQUIRED' });
  assert.throws(() => resolveTarget({ WH_CDP_PORT: '9234', WH_ATTACH_PROFILE: '/a/../etc' }), { code: 'ATTACH_PROFILE_REQUIRED' });
  for (const p of ['9222', 'abc', '80', '70000']) assert.throws(() => resolveTarget({ WH_CDP_PORT: p, WH_ATTACH_PROFILE: PROFILE }), { code: 'ATTACH_PORT_REFUSED' });
});
test('command line must match profile and port exactly', () => {
  assert.equal(commandLineMatches(argv(PROFILE), { profile: PROFILE, port: 9234 }), true);
  assert.equal(commandLineMatches(argv(PROFILE + '-other'), { profile: PROFILE, port: 9234 }), false);
  assert.equal(commandLineMatches(argv(PROFILE, 9333), { profile: PROFILE, port: 9234 }), false);
  assert.equal(commandLineMatches(`/opt/chrome --no-sandbox --user-data-dir=${PROFILE} --remote-debugging-port=9234\0`, { profile: PROFILE, port: 9234 }), true);
  assert.equal(commandLineMatches('/opt/chrome', { profile: PROFILE, port: 9234 }), false);
});
test('verifyAttachTarget checks the actual listener process', () => {
  const profile = '/home/box/chrome-profile/Fork-12';
  const target = resolveTarget({ WH_CDP_PORT: '9234', WH_ATTACH_PROFILE: profile }, 'linux');
  assert.equal(verifyAttachTarget(target, { platform: 'linux', run: () => ss, readCmdline: pid => pid === 42 ? argv(profile) : '' }), true);
  assert.throws(() => verifyAttachTarget(target, { platform: 'linux', run: () => ss, readCmdline: () => argv('/tmp/x') }), { code: 'ATTACH_PROFILE_MISMATCH' });
  assert.throws(() => verifyAttachTarget(target, { platform: 'linux', run: () => '', readCmdline: () => argv(profile) }), { code: 'ATTACH_PROFILE_MISMATCH' });
  assert.throws(() => verifyAttachTarget(target, { platform: 'linux', run: () => { throw new Error('no ss'); } }), { code: 'ATTACH_PROFILE_MISMATCH' });
  assert.equal(verifyAttachTarget({ mode: 'lab', port: 9333 }), true);
});

test('Windows attach validates the listener image, profile, port, and unavailable process metadata', () => {
  const target = resolveTarget({ WH_CDP_PORT: '9234', WH_ATTACH_PROFILE: 'C:\\Vivim Profile' }, 'win32');
  const browser = { pid: 42, name: 'chrome.exe', commandLine: '"C:\\Program Files\\Google\\Chrome\\chrome.exe" --user-data-dir="c:\\vivim profile" --remote-debugging-port=9234' };
  const check = record => verifyAttachTarget(target, { platform: 'win32', run: cmd => { assert.equal(cmd, 'powershell.exe'); return JSON.stringify(record); } });
  assert.equal(check(browser), true);
  for (const bad of [
    { ...browser, pid: 0 }, { ...browser, name: 'other.exe' }, { ...browser, commandLine: '' },
    { ...browser, commandLine: browser.commandLine.replace('vivim profile', 'wrong profile') },
    { ...browser, commandLine: browser.commandLine.replace('9234', '9333') },
  ]) assert.throws(() => check(bad), { code: 'ATTACH_PROFILE_MISMATCH' });
  assert.throws(() => verifyAttachTarget(target, { platform: 'win32', run: () => { throw Error('No listener metadata'); } }), { code: 'ATTACH_PROFILE_MISMATCH' });
  assert.throws(() => verifyAttachTarget(target, { platform: 'win32', run: () => 'invalid JSON' }), { code: 'ATTACH_PROFILE_MISMATCH' });
});

test('profile comparison folds Windows case only and preserves quoted or NUL-delimited spaces', () => {
  assert.equal(commandLineMatches('chrome.exe --user-data-dir="C:\\User Profile" --remote-debugging-port=9234', { profile: 'c:\\user profile', port: 9234 }, 'win32'), true);
  assert.equal(commandLineMatches(['/opt/chrome', '--user-data-dir=/tmp/User Profile', '--remote-debugging-port=9234'], { profile: '/tmp/User Profile', port: 9234 }, 'linux'), true);
  assert.equal(commandLineMatches(argv('/tmp/User Profile'), { profile: '/tmp/user profile', port: 9234 }, 'linux'), false);
  assert.equal(commandLineMatches(argv('/tmp/User Profile'), { profile: '/tmp/User Profile', port: 9234 }, 'linux'), true);
  assert.equal(commandLineMatches('chrome --user-data-dir=relative --remote-debugging-port=9234', { profile: '/tmp/relative', port: 9234 }, 'linux'), false);
  assert.equal(commandLineMatches('chrome --user-data-dir=/tmp/a --user-data-dir=/tmp/b --remote-debugging-port=9234', { profile: '/tmp/a', port: 9234 }, 'linux'), false);
});

test('attach resolution uses target-platform path rules without accepting relative or traversing paths', () => {
  assert.equal(resolveTarget({ WH_CDP_PORT: '9234', WH_ATTACH_PROFILE: 'c:/User Profile/' }, 'win32').profile, 'c:\\User Profile');
  assert.equal(resolveTarget({ WH_CDP_PORT: '9234', WH_ATTACH_PROFILE: '/tmp/User Profile/' }, 'linux').profile, '/tmp/User Profile');
  for (const [platform, profile] of [['linux', '/tmp/a/../b'], ['win32', 'C:\\a\\..\\b'], ['win32', 'C:relative'], ['linux', 'relative']]) {
    assert.throws(() => resolveTarget({ WH_CDP_PORT: '9234', WH_ATTACH_PROFILE: profile }, platform), { code: 'ATTACH_PROFILE_REQUIRED' });
  }
});

async function fixture(t, { verifyTarget = () => true, standingOk = true } = {}) {
  const dir = await mkdtemp(join(tmpdir(), 'wh-attach-')); t.after(() => rm(dir, { recursive: true, force: true }));
  const records = new Map(); const calls = { connect: [], open: [], closed: 0, sends: 0 };
  const journal = { async create(r) { if (records.has(r.requestId)) return { created: false, existing: records.get(r.requestId) }; records.set(r.requestId, { ...r, state: 'accepted', submitted: 'no' }); return { created: true }; }, async read(id) { return records.get(id); }, async update(id, p) { Object.assign(records.get(id), p); return records.get(id); }, async list() { return [...records.values()]; } };
  const page = { close: async () => { calls.closed++; } };
  const deps = { createJournal: () => journal, getProvider: id => ({ id, url: 'https://chatgpt.com/', status: 'measured' }), listProviders: () => [], digestPayload: x => createHash('sha256').update(x).digest('hex'), threadKeyFor: (p, u) => `${p.id}:${u}`,
    connect: opts => { calls.connect.push(opts); return { openPage: url => { calls.open.push(url); return page; } }; },
    sendOnce: async () => { calls.sends++; return { state: 'observed' }; }, readReply: () => ({ complete: true, text: 'OK' }) };
```

_First 80 of 102 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
