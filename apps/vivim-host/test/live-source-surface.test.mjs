import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { mkdtempSync, mkdirSync, copyFileSync, readFileSync, writeFileSync, rmSync, realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createDevIntelligence } from '../../../hq/lib/arbor-service.mjs';
import { createHostServer } from '../server.mjs';

const arbor = realpathSync(fileURLToPath(new URL('../../../', import.meta.url)));
const commandPath = 'apps/vivim-host/control/intent-planner.mjs';
const id = 'vivim.command-intent@0.1';
const ownerToken = 'real-source-surface-owner-test-12345678901234567890';
const open = server => new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const close = server => new Promise(resolve => server.close(resolve));
function request(server, route, { authenticated = true, method = 'GET', origin, headers = {}, body } = {}) {
  const host = '127.0.0.1:' + server.address().port;
  return new Promise((resolve, reject) => {
    const req = http.request({ hostname: '127.0.0.1', port: server.address().port, path: route,
      method, headers: { host, ...(authenticated ? { authorization: 'Bearer ' + ownerToken } : {}),
        ...(method === 'POST' ? { origin: 'http://' + host, 'x-vivim-control': '1' } : {}),
        ...(origin ? { origin } : {}), ...(body!==undefined ? {'content-type':'application/json'} : {}), ...headers }
    }, res => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const body = Buffer.concat(chunks).toString('utf8');
        let data;
        try { data = JSON.parse(body); } catch { data = body; }
        resolve({ status: res.statusCode, data });
      });
    });
    req.on('error', reject);
    req.end(body===undefined?undefined:JSON.stringify(body));
  });
}
function hqAt(root, dataDir) {
  return createDevIntelligence({ mode: 'diagnostic', approvedRoots: [root], dataDir });
}
function checkContext(out, project, path, semanticId) {
  assert.equal(out.status, 'indexed', JSON.stringify(out).slice(0,300));
  assert.equal(out.sourceId, project + ':' + path);
  const source = out.context.sources.find(s => s.ref === out.sourceId);
  assert.ok(source, 'selected genuine source must be included');
  assert.equal(source.contentHash, out.sourceDigest);
  assert.ok(source.semanticReferences.some(a => a.semanticId === semanticId && a.annotationKind === 'consumes'));
  assert.match(out.context.fragment, /function planText\(/);
  assert.equal(out.context.authority, 'read_only_projection');
  assert.ok(out.context.sources.every(s => !Object.hasOwn(s, 'absPath')));
  return source;
}
function createTestHost(sourceRoot, indexRoot, dataRoot) {
  return createHostServer({ dataRoot, ownerToken, autoPump: false,
    developmentSources: { approvedRoots: [sourceRoot], dataDir: indexRoot } });
}

test('actual ARBOR registration and HQ source index feed real Host route and source context', async () => {
  // No fixture, copied source, or precomputed corpus in this acceptance path.
  // The only temporary data is the existing HQ index and Host data directory.
  // The full-repository index is intentionally explicit: run this focused test
  // from a real checkout when testing repository-wide acceptance.
  const tmp = mkdtempSync(join(tmpdir(), 'arbor-live-full-source-'));
  const indexRoot = join(tmp, 'hq');
  const server = createTestHost(arbor, indexRoot, join(tmp, 'host'));
  try {
    const hq = hqAt(arbor, indexRoot);
    hq.registerSource({ name: 'arbor', path: arbor });
    const indexed = hq.index({ useGit: false });
    assert.equal(indexed.errors.length, 0, JSON.stringify(indexed.errors.slice(0,3)));
    assert.ok(indexed.totals.files > 3);
    const result = hq.fileSurface({ project: 'arbor', query: 'planText' });
    assert.equal(result.generatorVersion, 'hq.source-index/1');
    const record = result.files.find(f => f.path === commandPath);
    assert.ok(record, 'real command intent implementation must be indexed');
    assert.equal(record.freshness, 'indexed');
    assert.ok(record.annotations.some(a => a.semanticId === id && a.kind === 'consumes'));
    assert.equal(record.currentDigest, record.sourceDigest);
    const direct = hq.fileSurfaceContext({ project: 'arbor', path: commandPath });
    checkContext(direct, 'arbor', commandPath, id);
    assert.equal(hq.verifyContext(direct.context).valid, true);

    await open(server);
    assert.equal((await request(server, '/api/file-surface', { authenticated: false })).status, 401);
    assert.equal((await request(server, '/api/file-surface', { origin: 'http://evil.invalid' })).status, 403);
    const live = await request(server, '/api/file-surface?project=arbor&q=planText');
    assert.equal(live.status, 200);
    assert.deepEqual(live.data, result);
    const context = await request(server, '/api/file-surface/context?project=arbor&path=' + encodeURIComponent(commandPath));
    assert.equal(context.status, 200);
    checkContext(context.data, 'arbor', commandPath, id);
    assert.equal(hq.verifyContext(context.data.context).valid, true);
    const wiki = await request(server, '/wiki', { authenticated: false });
    assert.equal(wiki.status, 200);
    assert.match(wiki.data, /id="surface-search"/);
    const script = await request(server, '/wiki.js', { authenticated: false });
    assert.match(script.data, /wiki-source-view\.mjs/);
    const module=await request(server,'/mobile/wiki-source-view.mjs',{authenticated:false});
    assert.equal(module.status,200);
    assert.match(module.data,/Read verified source context/);
    assert.match(wiki.data, /id="surface-context-view"/);
    assert.doesNotMatch(script.data, /data\/demo-baseline\/file-surface/);
  } finally { if (server.listening) await close(server); rmSync(tmp, { recursive: true, force: true }); }
});

test('real annotated implementation copy: stale refusal, incremental reindex, changed context, no private fallback', async () => {
  const tmp = mkdtempSync(join(tmpdir(), 'arbor-live-source-edit-'));
  const source = join(tmp, 'code'), data = join(tmp, 'hq');
  mkdirSync(source);
  mkdirSync(join(source, 'private'));
  mkdirSync(join(source, 'demo'));
  const file = join(source, 'intent-planner.mjs');
  copyFileSync(join(arbor, commandPath), file);
  copyFileSync(file, join(source, 'private', 'intent-planner.mjs'));
  copyFileSync(file, join(source, 'demo', 'intent-planner.mjs'));
  const server = createTestHost(source, data, join(tmp, 'host'));
  try {
    const hq = hqAt(source, data);
    await open(server);
    const empty = await request(server, '/api/file-surface');
    assert.equal(empty.status, 200);
    assert.deepEqual(empty.data.files, []);
    hq.registerSource({ name: 'copy', path: source });
    const index = hq.index({ useGit: false });
    assert.equal(index.errors.length, 0);
    const initial = await request(server, '/api/file-surface?project=copy&q=' + encodeURIComponent(id));
    assert.equal(initial.status, 200);
    assert.deepEqual(initial.data.files.map(f => f.path), ['intent-planner.mjs']);
    const contextUrl = '/api/file-surface/context?project=copy&path=intent-planner.mjs';
    const annotation=initial.data.files[0].annotations.find(a=>a.semanticId===id&&a.kind==='consumes');
    assert.equal(annotation.evidence.assurance,'verified');
    const selected=annotation.semanticAnchor;
    const exactUrl=contextUrl+'&anchor='+encodeURIComponent(selected.anchorId)+'&fingerprint='+selected.fingerprint;
    const personalBefore=(await request(server,'/api/wiki')).data;
    const exact=(await request(server,exactUrl)).data;
    assert.equal(exact.status,'indexed');
    assert.equal(exact.anchor.anchorId,selected.anchorId);
    assert.equal(exact.anchor.fingerprint,selected.fingerprint);
    assert.equal(exact.context.sources.length,1);
    assert.equal(exact.anchor.authority,'read_only_projection');
    assert.equal((await request(server,exactUrl,{authenticated:false})).status,401);
    assert.notEqual((await request(server,contextUrl+'&anchor=invalid')).status,200);
    assert.equal((await request(server,exactUrl,{method:'POST'})).status,405);
    const before = (await request(server, contextUrl)).data;
    checkContext(before, 'copy', 'intent-planner.mjs', id);
    const command = await request(server,'/api/host/control/plan',{
      method:'POST',body:{text:'list wiki pages'}
    });
    assert.equal(command.status,200,JSON.stringify(command.data));
    assert.equal(command.data.outcome,'done');
    assert.equal(command.data.requestContext.authority,'read-only');
    assert.equal(command.data.requestContext.wiki.status,'source-backed');
    assert.equal(command.data.requestContext.source.status,'indexed');
    const automatic=command.data.requestContext.source.context;
    assert.ok(automatic.sources.length<=3 && automatic.sources.length>0);
    assert.equal(automatic.budget.maxTokens,2400);
    assert.ok(automatic.budget.used<=automatic.budget.capacity);
    assert.ok(automatic.sources.every(s=>s.path==='intent-planner.mjs'&&!Object.hasOwn(s,'absPath')));
    assert.ok(automatic.sources.every(s=>s.semanticReferences.some(r=>
      automatic.sourceSemanticIds.includes(r.semanticId))));
    assert.ok(hq.verifyContext(automatic).valid);
    assert.equal(automatic.semanticPacket.status,'complete');
    assert.equal(automatic.semanticPacket.planningEligible,false);
    assert.equal(automatic.semanticPacket.mandatoryConstraints.status,'incomplete');
    assert.ok(automatic.sourceSemanticIds.every(id=>automatic.semanticPacket.dependencies.some(d=>d.semanticId===id)));
    const again=hq.compiledContext({task:'list wiki pages',sourceSemanticIds:automatic.sourceSemanticIds});
    assert.equal(again.context.digest,automatic.digest);
    const tooSmall=hq.compiledContext({task:'list wiki pages',sourceSemanticIds:automatic.sourceSemanticIds,budgetTokens:100});
    assert.equal(tooSmall.status,'budget_exceeded');
    assert.equal(tooSmall.context,null);
    const incomplete=hq.compiledContext({task:'list wiki pages',sourceSemanticIds:[...automatic.sourceSemanticIds,'missing.capability@1']});
    assert.equal(incomplete.status,'incomplete');
    assert.equal(incomplete.context,null);
    assert.ok(incomplete.semanticPacket.missingSemanticIds.includes('missing.capability@1'));
    writeFileSync(join(source,'unrelated.mjs'),'export const unrelated=1;');
    hq.index({useGit:false});
    assert.equal(hq.verifyContext(automatic).valid,true);
    assert.equal(hq.compiledContext({task:'list wiki pages',sourceSemanticIds:automatic.sourceSemanticIds}).context.digest,automatic.digest);
    assert.equal(hq.verifyContext({...automatic,fragment:automatic.fragment+'\nInjected prose'}).valid,false);
    assert.equal((await request(server,'/api/host/control/plan',{
      method:'POST',authenticated:false,body:{text:'list wiki pages'}
    })).status,401);
    const newer = 'vivim.command-intent@0.2';
    const code = readFileSync(file, 'utf8');
    const edited = code.replace('// @hq:consumes ' + id, '// @hq:consumes ' + newer + '0');
    assert.notEqual(code, edited);
    const changedId = newer + '0'; // length change exercises ordinary incremental detection
    writeFileSync(file, edited);
    const stale = (await request(server, '/api/file-surface?project=copy&path=intent-planner.mjs')).data;
    assert.equal(stale.files[0].freshness, 'stale');
    const noContext = (await request(server, contextUrl)).data;
    assert.equal(noContext.status, 'stale');
    assert.equal(noContext.context, null);
    assert.equal((await request(server,exactUrl)).data.context,null);
    assert.equal(hq.verifyContext(before.context).valid, false);
    const changed = await request(server,'/api/host/control/plan',{
      method:'POST',body:{text:'list wiki pages'}
    });
    assert.equal(changed.data.outcome,'done','optional HQ failure cannot block the authoritative Wiki read');
    assert.equal(changed.data.requestContext.source.status,'stale');
    assert.equal(changed.data.requestContext.source.context,null);

    const deniedRefresh = await request(server, '/api/file-surface/index', { method: 'POST', authenticated: false });
    assert.equal(deniedRefresh.status, 401);
    const refreshed = await request(server, '/api/file-surface/index', { method: 'POST' });
    assert.equal(refreshed.status, 200);
    assert.equal(refreshed.data.status, 'indexed');
    const after = (await request(server, '/api/file-surface?project=copy&q=' + encodeURIComponent(changedId))).data;
    assert.equal(after.files.length, 1);
    assert.equal(after.files[0].freshness, 'indexed');
    assert.notEqual(after.files[0].sourceDigest, initial.data.files[0].sourceDigest);
    assert.ok(after.files[0].annotations.some(a => a.semanticId === changedId && a.kind === 'consumes'));
    const updated = (await request(server, contextUrl)).data;
    checkContext(updated, 'copy', 'intent-planner.mjs', changedId);
    assert.equal(hq.verifyContext(updated.context).valid, true);
    assert.notEqual(updated.context.digest, before.context.digest);
    assert.equal((await request(server,exactUrl)).data.context,null,'removed anchor cannot be read using old identity');
    const replacement=after.files[0].annotations.find(a=>a.semanticId===changedId&&a.kind==='consumes').semanticAnchor;
    const replaced=(await request(server,contextUrl+'&anchor='+encodeURIComponent(replacement.anchorId)+'&fingerprint='+replacement.fingerprint)).data;
    assert.equal(replaced.status,'indexed');
    assert.equal(replaced.anchor.anchorId,replacement.anchorId);
    assert.deepEqual((await request(server,'/api/wiki')).data,personalBefore,'HQ reads and reindex never mutate personal Wiki');
    const forbidden = await request(server, '/api/file-surface/context?project=copy&path=private%2Fintent-planner.mjs');
    assert.equal(forbidden.data.context, null);
    const escaped = await request(server, '/api/file-surface/context?project=copy&path=..%2Foutside.mjs');
    assert.notEqual(escaped.status, 200);
  } finally { if (server.listening) await close(server); rmSync(tmp, { recursive: true, force: true }); }
});
