# File: apps/mobile-relay/test/wiki-root-suites-node-runtime.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/mobile-relay/test/wiki-root-suites-node-runtime.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 2868 B |
| Lines | 51 |
| Hash | 8554812f1fcc |
| Test | yes |
| Generated | no |
| Component | mobile-relay |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| here | const | 14 | no | const here = fileURLToPath(new URL(&#39;.&#39;, import.meta.url)); // apps/mobile-relay/test/ |
| root | const | 15 | no | const root = join(here, &#39;..&#39;); // apps/mobile-relay/ |
| repo | const | 16 | no | const repo = join(root, &#39;..&#39;, &#39;..&#39;); // repo root |
| ROOT_SUITES | const | 17 | no | const ROOT_SUITES = [ |
| src | const | 26 | no | const src = readFileSync(join(root, name), &#39;utf8&#39;); |
| files | const | 35 | no | const files = ROOT_SUITES.map(f =&gt; join(&#39;apps&#39;, &#39;mobile-relay&#39;, f)); |
| run | const | 37 | no | const run = spawnSync(process.execPath, [&#39;--test&#39;, ...files], { cwd: repo, encoding: &#39;utf8&#39; }); |
| out | const | 39 | no | const out = run.stdout + run.stderr; |
| app | const | 45 | no | const app = readFileSync(join(root, &#39;app.js&#39;), &#39;utf8&#39;); |
| hits | const | 46 | no | const hits = app.match(/fetch\\(HOST_PREVIEW\\s*\\?\\s*&#39;\\/api\\/host\\/control\\/wiki-view&#39;\\s*:\\s*&#39;\\/mobile\\/api\\/wiki&#39;/g) ?? []; assert.ok(hits.length &gt;= 2, &#39;expected both wiki fetch call sites (app.js:788… |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 7 | external |
| node:assert/strict | import | 8 | external |
| node:fs | import | 9 | external |
| node:url | import | 10 | external |
| node:path | import | 11 | external |
| node:child_process | import | 12 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// Guards the four root-level wiki suites (goal-wiki, goal1-wiki-chat-regression,
// goal1-wiki-tab-open, wiki-receipt-refresh). They sit at the apps/mobile-relay root,
// outside the `test/*.test.mjs` glob in both package.json test scripts, so they are
// dispatched only by explicit `node --test <files>` invocation. That runtime is node,
// so these suites must not depend on bun-only APIs, and the product contract they pin
// (the Host wiki route under HOST_PREVIEW) must stay current.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const here = fileURLToPath(new URL('.', import.meta.url));   // apps/mobile-relay/test/
const root = join(here, '..');                               // apps/mobile-relay/
const repo = join(root, '..', '..');                         // repo root
const ROOT_SUITES = [
  'goal-wiki.test.mjs',
  'goal1-wiki-chat-regression.test.mjs',
  'goal1-wiki-tab-open.test.mjs',
  'wiki-receipt-refresh.test.mjs',
];

test('root-level wiki suites declare no bun-only runtime APIs', () => {
  for (const name of ROOT_SUITES) {
    const src = readFileSync(join(root, name), 'utf8');
    assert.ok(!/from\s+['"]bun:/.test(src),
      name + ' imports a bun: module — under node --test it dies with ERR_UNSUPPORTED_ESM_URL_SCHEME before any case runs');
    assert.ok(!/import\.meta\.dir\b/.test(src),
      name + ' uses bun-only import.meta.dir, undefined under node');
  }
});

test('root-level wiki suites pass under the node --test runtime that dispatches them', () => {
  const files = ROOT_SUITES.map(f => join('apps', 'mobile-relay', f));
  // non-zero exit means at least one of the four suites failed under node
  const run = spawnSync(process.execPath, ['--test', ...files], { cwd: repo, encoding: 'utf8' });
  assert.equal(run.status, 0, 'node --test run of the four root suites failed:\n' + run.stdout + run.stderr);
  const out = run.stdout + run.stderr;
  assert.match(out, /fail 0\b/, 'node --test run of the four root suites must report zero failures');
  assert.match(out, /pass [1-9]/, 'node --test run of the four root suites must report passing tests');
});

test('PWA wiki reads hit the current Host control route in both preview and phone modes', () => {
  const app = readFileSync(join(root, 'app.js'), 'utf8');
  const hits = app.match(/fetch\(HOST_PREVIEW\s*\?\s*'\/api\/host\/control\/wiki-view'\s*:\s*'\/mobile\/api\/wiki'/g) ?? [];
  assert.ok(hits.length >= 2,
    'expected both wiki fetch call sites (app.js:788 and app.js:1783) to use /api/host/control/wiki-view under HOST_PREVIEW; found ' + hits.length);
  assert.ok(!app.includes("'/api/wiki'"),
    'stale quoted /api/wiki route literal still present in app.js');
});
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
