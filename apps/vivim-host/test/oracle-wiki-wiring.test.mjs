import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createBootstrapRuntime } from '../bootstrap/runtime.mjs';
import { createHostServer } from '../server.mjs';
import { createProductJournal } from '../chat/product-journal.mjs';

const TOKEN = 'oracle-private-owner-0123456789abcdef0123456789abcdef';
const deep = {
  schema: 'vivim.bootstrap-output/1', generationId: 'gen-oracle-wiki-1', passId: 'D03',
  observations: [{ category: 'interest', text: 'Enjoys geometry', confidence: 0.65, sensitive: false }],
  assertions: [{ section: 'interest', label: 'Geometry', value: 'Enjoys geometry',
    basis: 'provider_memory_report', confidence: 0.65, freshness: 'current', scope: 'personal' }],
  unknowns: [], viewProposals: [], schemaProposals: [], coverage: { areas: [] }
};
const sensitive = {
  schema: 'vivim.bootstrap-output/1', generationId: 'gen-oracle-wiki-1', passId: 'D06',
  observations: [{ category: 'relationship', text: 'CONFIDENTIAL-RELATIONSHIP-DETAIL', confidence: 0.6 }],
  assertions: [{ section: 'relationship', label: 'Confidential',
    value: 'CONFIDENTIAL-RELATIONSHIP-DETAIL', basis: 'provider_memory_report',
    confidence: 0.6, freshness: 'current', scope: 'personal' }],
  unknowns: [], viewProposals: [], schemaProposals: [], coverage: { areas: [] }
};

test('Oracle reuses the existing owner-private AutoWiki Host context and never changes public Wiki', async t => {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'oracle-wiki-existing-host-'));
  const archive = path.join(dir, 'existing-labs-desktop-archive');
  mkdirSync(path.join(archive,'state'),{recursive:true});
  mkdirSync(path.join(archive,'reports'),{recursive:true});
  const observedAt = new Date().toISOString();
  writeFileSync(path.join(archive,'state','cycle-latest.json'), JSON.stringify({
    schema:'desktop-commander-cycle-v1',status:'SUCCESS',finished_utc:observedAt,
    privatePath:'PRIVATE-TERMINAL-TOKEN'
  }));
  writeFileSync(path.join(archive,'reports','learning-latest.json'), JSON.stringify({
    schema:'dc-local-learning-observatory-v1',generated_utc:observedAt,
    observed_index_rows:123,upstream_large_output_omissions:4,
    process_exit_zero_entries:12,process_exit_nonzero_entries:3,
    pattern_hit_entries:{model_rate_limit:2},
    rawArguments:'PRIVATE-TERMINAL-TOKEN'
  }));
  const runtime = createBootstrapRuntime({ dataRoot: dir });
  const host = createHostServer({ dataRoot: dir, bootstrap: runtime, ownerToken: TOKEN,
    developmentLearningRoot: archive });
  t.after(async () => {
    await new Promise(resolve => host.close(resolve));
    runtime.close();
    rmSync(dir, { recursive: true, force: true });
  });
  const initialWiki = await createProductJournal({ dataRoot: dir }).readPhoneWiki();
  runtime.grantBootstrap({ scope: 'full-bootstrap' });
  runtime.ingestPass({ response: deep, requestId: 'oracle-wiki-d03', generationId: 'gen-oracle-wiki-1', threadRef: 'chatgpt-thread-ref' });
  runtime.ingestPass({ response: sensitive, requestId: 'oracle-wiki-d06', generationId: 'gen-oracle-wiki-1', threadRef: 'chatgpt-thread-ref' });
  await new Promise(resolve => host.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + host.address().port;
  const endpoint = base + '/api/host/control/wiki-context';
  const unauthorized = await fetch(endpoint);
  assert.equal(unauthorized.status, 401);
  assert.doesNotMatch(await unauthorized.text(), /Enjoys geometry|CONFIDENTIAL/);
  const cross = await fetch(endpoint, { headers: { authorization: 'Bearer ' + TOKEN, origin: 'https://foreign.example' } });
  assert.equal(cross.status, 403);
  const ok = await fetch(endpoint, { headers: { authorization: 'Bearer ' + TOKEN } });
  assert.equal(ok.status, 200);
  const view = await ok.json();
  assert.equal(view.schema, 'vivim.wiki-context/1');
  assert.equal(view.oracleCorpus.schema, 'vivim.oracle-corpus-view/1');
  assert.equal(view.oracleCorpus.items.length, 1);
  assert.equal(view.oracleCorpus.items[0].statement, 'Enjoys geometry');
  assert.equal(view.oracleCorpus.items[0].source.requestId, 'oracle-wiki-d03');
  assert.equal(view.oracleCorpus.items[0].source.threadRef, 'chatgpt-thread-ref');
  assert.equal(view.oracleCorpus.items[0].status, 'provider-reported');
  assert.equal(view.semantics.schema, 'vivim.autowiki-semantics/1');
  assert.equal(view.developmentLearning.schema, 'vivim.development-learning/1');
  assert.equal(view.developmentLearning.state, 'ready');
  assert.equal(view.developmentLearning.analysis.indexedObservations, 123);
  assert.equal(view.developmentLearning.analysis.upstreamOutputsOmitted, 4);
  assert.equal(view.developmentLearning.promotesLearning, false);
  assert.equal(view.developmentLearning.privateContentIncluded, false);
  assert.doesNotMatch(JSON.stringify(view.developmentLearning), /PRIVATE-TERMINAL-TOKEN|rawArguments|privatePath/);
  assert.doesNotMatch(JSON.stringify(view), /CONFIDENTIAL-RELATIONSHIP-DETAIL/);
  // The authenticated PWA/native summary uses only the existing phone-safe
  // bootstrap progress; it must never acquire owner-private Oracle text.
  const pwaResponse = await fetch(base + '/api/host/control/pwa-view', {
    headers: { authorization: 'Bearer ' + TOKEN }
  });
  assert.equal(pwaResponse.status, 200);
  const pwaSnapshot = await pwaResponse.json();
  assert.equal(pwaSnapshot.schema, 'vivim.host-pwa-view/1');
  assert.ok(pwaSnapshot.snapshot.bootstrap.progress.claims >= 1,
    'GPUI can read progress from existing Host bootstrap metadata');
  assert.doesNotMatch(JSON.stringify(pwaSnapshot), /Enjoys geometry|CONFIDENTIAL-RELATIONSHIP-DETAIL|PRIVATE-TERMINAL-TOKEN|desktop-commander|development-learning/,
    'private corpus statements cannot enter generic PWA/native summary');
  const publicWiki = await (await fetch(base + '/api/wiki')).json();
  assert.doesNotMatch(JSON.stringify(publicWiki), /Enjoys geometry|CONFIDENTIAL|desktop-commander|development-learning|PRIVATE-TERMINAL-TOKEN/);
  assert.equal(publicWiki.revision, initialWiki.revision, 'corpus port never commits a Wiki revision');
  const js = await (await fetch(base + '/wiki.js')).text();
  assert.match(js, /renderOracleCorpus\(root, context\.oracleCorpus\)/);
  assert.match(js, /provider-reported, not independently verified/);
});
