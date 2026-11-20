# File: apps/mobile-relay/test/build-vec-theme.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/mobile-relay/test/build-vec-theme.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 6846 B |
| Lines | 128 |
| Hash | 91bcd4a3adca |
| Test | yes |
| Generated | no |
| Component | mobile-relay |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| makeSurface | function | 9 | no | const makeSurface = () =&gt; createSurface({ surfaceId: &#39;my-space&#39; }); |
| request | const | 10 | no | const request = (text, surface = makeSurface()) =&gt; resolveBuildRequest({ request: text, surface }); |
| before | const | 13 | no | const before = makeSurface(); |
| out | const | 14 | no | const out = request(&#39;Set my app background to #112233&#39;, before); |
| before | const | 29 | no | const before = makeSurface(); |
| out | const | 30 | no | const out = request(&#39;Set my app accent to #445566&#39;, before); |
| out | const | 48 | no | const out = request(phrase); |
| valid | const | 52 | no | const valid = compileVecThemeRequest({ text: &#39;Set my app accent to #ABCDEF&#39;, surface: makeSurface() }); |
| before | const | 57 | no | const before = makeSurface(), out = request(&#39;Set my app background to #112233&#39;, before); |
| before | const | 65 | no | const before = makeSurface(); |
| body | const | 66 | no | const body = { schema: &#39;vivim.bootstrap-command-worker/1&#39;, action: &#39;apply-proposal&#39;, |
| ack | const | 68 | no | const ack = { status: &#39;done&#39;, result: JSON.stringify(body) }; |
| canvas | const | 82 | no | const canvas = readFileSync(new URL(&#39;../build-canvas.mjs&#39;, import.meta.url), &#39;utf8&#39;); |
| phone | const | 83 | no | const phone = readFileSync(new URL(&#39;../generative-ui/phone-surface.mjs&#39;, import.meta.url), &#39;utf8&#39;); |
| host | const | 91 | no | const host = readFileSync(new URL(&#39;../../vivim-host/direct-phone.mjs&#39;, import.meta.url), &#39;utf8&#39;); |
| sw | const | 92 | no | const sw = readFileSync(new URL(&#39;../sw.js&#39;, import.meta.url), &#39;utf8&#39;); |
| before | const | 106 | no | const before=makeSurface(),out=request(phrase,before); |
| before | const | 116 | no | const before=makeSurface(); |
| out | const | 117 | no | const out=request(&#39;Set my shell background to #123456&#39;,before); |
| next | const | 125 | no | const next=request(&#39;Set my shell radius to 20px&#39;,out.preview.surface); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:fs | import | 3 | external |
| ../generative-ui/catalog.mjs | import | 4 | [apps/mobile-relay/generative-ui/catalog.mjs](../generative-ui/catalog.mjs.md) |
| ../generative-ui/compiler.mjs | import | 5 | [apps/mobile-relay/generative-ui/compiler.mjs](../generative-ui/compiler.mjs.md) |
| ../build-composer.mjs | import | 6 | [apps/mobile-relay/build-composer.mjs](../build-composer.mjs.md) |
| ../build-canvas.mjs | import | 7 | [apps/mobile-relay/build-canvas.mjs](../build-canvas.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createSurface } from '../generative-ui/catalog.mjs';
import { compileUiProposal } from '../generative-ui/compiler.mjs';
import { resolveBuildRequest, compileVecThemeRequest } from '../build-composer.mjs';
import { committedUiRevision } from '../build-canvas.mjs';

const makeSurface = () => createSurface({ surfaceId: 'my-space' });
const request = (text, surface = makeSurface()) => resolveBuildRequest({ request: text, surface });

test('background uses actual VEC configuration and existing inert Host UI preview', () => {
  const before = makeSurface();
  const out = request('Set my app background to #112233', before);
  assert.equal(out.outcome, 'candidate');
  assert.equal(out.code, 'VEC_THEME_PREVIEW');
  assert.equal(out.authorization, 'none');
  assert.equal(out.persisted, false);
  assert.equal(out.preview.persisted, false);
  assert.equal(out.detail.capabilityId, 'vivim.ui-engine.color.background@1');
  assert.equal(out.detail.baseRevision, 0);
  assert.equal(out.detail.targetRevision, 1);
  assert.equal(out.preview.surface.theme.background, '#112233');
  assert.equal(out.proposal.operations[0].type, 'set-theme');
  assert.equal(before.theme.background, '#111722');
});

test('accent preserves all unrelated theme settings and component tree', () => {
  const before = makeSurface();
  const out = request('Set my app accent to #445566', before);
  assert.equal(out.outcome, 'candidate');
  assert.equal(out.detail.capabilityId, 'vivim.ui-engine.color.accent@1');
  assert.equal(out.preview.surface.theme.accent, '#445566');
  for (const key of Object.keys(before.theme).filter(key => key !== 'accent'))
    assert.equal(out.preview.surface.theme[key], before.theme[key], key);
  assert.deepEqual(out.preview.surface.tree, before.tree);
  assert.equal(out.proposal.baseRevision, before.revision);
});

test('bad hex and unapproved configuration properties refuse without model fallback', () => {
  for (const phrase of [
    'Set my app background to red',
    'Set my app accent to #12345',
    'Set my app font to #112233',
    'Set my app background to #112233;alert(1)',
    'Set my app background to #112233 and delete all files'
  ]) {
    const out = request(phrase);
    assert.equal(out.outcome, 'refused', phrase);
    assert.equal(out.proposal, undefined);
  }
  const valid = compileVecThemeRequest({ text: 'Set my app accent to #ABCDEF', surface: makeSurface() });
  assert.equal(valid.preview.surface.theme.accent, '#abcdef');
});

test('stale baseRevision cannot pass the existing Host-compatible preview validator', () => {
  const before = makeSurface(), out = request('Set my app background to #112233', before);
  assert.throws(() => compileUiProposal({
    proposal: out.proposal, surface: { ...before, revision: before.revision + 1 },
    audience: 'phone'
  }), /stale|revision/i);
});

test('Host result must confirm persisted revision, base revision and surface identity', () => {
  const before = makeSurface();
  const body = { schema: 'vivim.bootstrap-command-worker/1', action: 'apply-proposal',
    revision: 1, parentRevision: 0, persisted: true, surfaceId: before.surfaceId };
  const ack = { status: 'done', result: JSON.stringify(body) };
  assert.deepEqual(committedUiRevision(ack, before),
    { committedRevision: 1, parentRevision: 0, surfaceId: 'my-space' });
  for (const invalid of [
    { status: 'queued', result: ack.result },
    { status: 'done', result: 'unreadable' },
    { status: 'done', result: JSON.stringify({ ...body, persisted: false }) },
    { status: 'done', result: JSON.stringify({ ...body, parentRevision: 1 }) },
    { status: 'done', result: JSON.stringify({ ...body, revision: 2 }) },
    { status: 'done', result: JSON.stringify({ ...body, surfaceId: 'other' }) }
  ]) assert.throws(() => committedUiRevision(invalid, before));
});
```

_First 80 of 129 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
