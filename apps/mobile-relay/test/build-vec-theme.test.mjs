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

test('Build rejects fake success receipts and does not resend an uncertain Host action', () => {
  const canvas = readFileSync(new URL('../build-canvas.mjs', import.meta.url), 'utf8');
  const phone = readFileSync(new URL('../generative-ui/phone-surface.mjs', import.meta.url), 'utf8');
  assert.doesNotMatch(canvas, /PROP_001_PROOF|testReceipts|commitSHA/);
  assert.match(canvas, /committedUiRevision\(await apply/);
  assert.match(canvas, /waitForReadback\(proof, submitted.preview.surface\)/);
  assert.match(phone, /Command pending or uncertain; not resent/);
});

test('Direct Host serves canonical VEC assets without making cloud offline shell depend on them', () => {
  const host = readFileSync(new URL('../../vivim-host/direct-phone.mjs', import.meta.url), 'utf8');
  const sw = readFileSync(new URL('../sw.js', import.meta.url), 'utf8');
  assert.match(host, /vec-engines\//);
  for (const name of ['compiler','registry','catalog','validators','enum-choices'])
    assert.equal(sw.includes("'vec-engines/" + name + ".mjs'"), false);
});


test('real typed theme mappings preserve other values and reject unsupported units',()=>{
  for(const [phrase,field,value] of [
    ['set my app secondary to #123456','secondary','#123456'],
    ['set my app font-size to 17px','fontSizePx',17],
    ['set my app radius to 18px','radiusPx',18],
    ['set my app spacing-scale to 0.9','spacingScale',0.9]
  ]){
    const before=makeSurface(),out=request(phrase,before);
    assert.equal(out.outcome,'candidate',phrase);assert.equal(out.preview.surface.theme[field],value);
    for(const key of Object.keys(before.theme).filter(k=>k!==field))assert.equal(out.preview.surface.theme[key],before.theme[key]);
    assert.deepEqual(out.preview.surface.tree,before.tree);
  }
  for(const phrase of ['set my app font-size to 50px','set my app radius to 2rem','set my app spacing-scale to 9'])
    assert.equal(request(phrase).outcome,'refused');
});

test('shell changes are separately scoped in the existing deterministic Host proposal',()=>{
  const before=makeSurface();
  const out=request('Set my shell background to #123456',before);
  assert.equal(out.outcome,'candidate');
  assert.equal(out.detail.scope,'shell');
  assert.equal(out.preview.surface.theme.shell.background,'#123456');
  assert.equal(out.preview.surface.theme.background,before.theme.background);
  assert.deepEqual(out.preview.surface.tree,before.tree);
  assert.equal(before.theme.shell,undefined);
  assert.match(out.summary.explanation,/all application tabs/);
  const next=request('Set my shell radius to 20px',out.preview.surface);
  assert.deepEqual(next.preview.surface.theme.shell,{background:'#123456',radiusPx:20});
  assert.equal(request('Set my shell radius to 999px',before).outcome,'refused');
});
