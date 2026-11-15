import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { buildControlWorld, interpretControl } from '../../mobile-relay/control-language.mjs';
import { interpret } from '../../mobile-relay/nlcl/index.mjs';
import { loadControlCatalog } from '../control/intent-planner.mjs';

const catalog = loadControlCatalog();
const corpus = JSON.parse(readFileSync(new URL('../control/corpus.v1.json', import.meta.url), 'utf8'));

const VENDOR_TOOL = new URL('../../../tools/control/vendor-nlcl.mjs', import.meta.url);
const VENDOR_PRESENT = existsSync(VENDOR_TOOL);

test('vendored Omega NCLL bytes match their pinned provenance', {
  skip: VENDOR_PRESENT ? false : `orphaned test: ${'tools/control/vendor-nlcl.mjs'} is absent from this checkout`,
}, () => {
  const tool = fileURLToPath(VENDOR_TOOL);
  const out = execFileSync(process.execPath, [tool, '--check'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  assert.match(out, /vendored NCLL ok: 11 files/);
});

for (const c of corpus.cases) {
  test(`corpus: ${JSON.stringify(c.text)} → ${c.outcome} (${c.note})`, () => {
    const world = buildControlWorld(catalog, { lexicon: c.lexicon ?? [] });
    const r = interpretControl(c.text, { catalog, world });
    assert.equal(r.outcome, c.outcome);
    if (c.actionId) assert.equal(r.candidate?.actionId, c.actionId);
    if (c.args) assert.deepEqual(r.candidate.args, c.args);
    if (c.outcome !== 'candidate') assert.ok(!(r.outcome === 'candidate'));
  });
}

test('determinism (N1): same text and world give byte-identical interpretation', () => {
  const world = buildControlWorld(catalog);
  for (const c of corpus.cases) {
    assert.equal(JSON.stringify(interpretControl(c.text, { catalog, world })), JSON.stringify(interpretControl(c.text, { catalog, world })));
  }
});

test('force modifier is reported as ignored, never as authority', () => {
  const r = interpretControl('!set theme to ember', { catalog, world: buildControlWorld(catalog) });
  assert.deepEqual(r.ignoredModifiers, ['!']);
  assert.equal(Object.hasOwn(r, 'authorized'), false);
});

test('raw NCLL "ok" with an unresolved slot never becomes a candidate (AION E3)', () => {
  const world = buildControlWorld(catalog);
  assert.equal(interpret('change my theme to purple', world).status, 'ok');
  assert.equal(interpretControl('change my theme to purple', { catalog, world }).outcome, 'incomplete');
});

test('world is derived from the catalog only: every spoken action is routable, nothing else', () => {
  const world = buildControlWorld(catalog);
  const spoken = catalog.actions.filter(a => a.language).map(a => a.id).sort();
  assert.deepEqual(world.ops.map(o => o.op).sort(), spoken);
  assert.deepEqual(world.frames.map(f => f.op).sort(), spoken);
  assert.ok(!world.ops.some(o => o.op.startsWith('message.')));
});

test('exact paired-device text resolves to typed R2 grant actions without granting authority',()=>{
  const world=buildControlWorld(catalog);
  const grantId='a'.repeat(32);
  const revoke=interpretControl('revoke phone grant '+grantId,{catalog,world});
  assert.equal(revoke.outcome,'candidate');
  assert.deepEqual(revoke.candidate,{actionId:'devices.revoke',
    args:{grant_id:grantId}});
  const approve=interpretControl('approve phone grant '+grantId+
    ' scopes relay:read, relay:write',{catalog,world});
  assert.equal(approve.outcome,'candidate');
  assert.deepEqual(approve.candidate,{actionId:'devices.approve',
    args:{grant_id:grantId,scopes:'relay:read,relay:write'}});
  assert.equal(Object.hasOwn(approve,'authorized'),false);
  assert.equal(Object.hasOwn(revoke,'executionPerformed'),false);
});
test('unrequested scopes and malformed IDs cannot be guessed by device text parser',()=>{
  const world=buildControlWorld(catalog);
  const grantId='a'.repeat(32);
  for(const value of [
    'approve phone grant '+grantId+' scopes relay:read, relay:read',
    'approve phone grant '+grantId+' scopes relay:read, invalid scope',
    'revoke phone grant ../'+grantId,
    'approve phone grant not-an-id scopes relay:read'
  ]){
    const answer=interpretControl(value,{catalog,world});
    assert.notEqual(answer.outcome==='candidate' && answer.candidate?.actionId==='devices.approve' &&
      answer.candidate.args?.grant_id===grantId && answer.candidate.args?.scopes?.includes('invalid'),
      true);
    if(value.includes('relay:read, relay:read')||value.includes('invalid scope'))
      assert.notEqual(answer.candidate?.actionId,'devices.approve');
  }
});
