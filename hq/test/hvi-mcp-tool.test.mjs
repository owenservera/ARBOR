// Native HQ capability discovery + invocation for HQ Version Intelligence.
// Invented Git-object fixtures only: no real repository, no network, no provider,
// no browser, no personal corpus and no effect of any kind.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createMcpServer } from '../lib/mcp.mjs';
import { syntheticSource } from '../version-intelligence/sources/fixtures.mjs';
import { resolvePin, snapshotAt } from '../version-intelligence/sources/snapshots.mjs';

const grant = async () => true;

/** The HVI tool must never touch the HQ index; this stub proves it. */
const noIndex = new Proxy({}, {
  get(_target, prop) {
    throw new Error('the HVI tool must not touch the HQ index (asked for ' + String(prop) + ')');
  },
});

const server = () => createMcpServer({ root: process.cwd(), db: noIndex });
const list = s => s.handle({ jsonrpc: '2.0', id: 1, method: 'tools/list' });
const call = (s, name, args) =>
  s.handle({ jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name, arguments: args } });
const payload = response => JSON.parse(response.result.content[0].text);

async function invented(repo = 'synthetic/mcp-fixture', versions = ['v1', 'v2', 'v3']) {
  const fixture = syntheticSource();
  const manifests = [];
  for (const ref of versions) {
    const pin = await resolvePin({ provider: 'github', repo, ref, approvedScope: 'development' },
      { adapter: fixture.adapter, authorize: grant, acquiredAt: '2026-01-01T00:00:00.000Z' });
    manifests.push(await snapshotAt(pin, {
      adapter: fixture.adapter, authorize: grant, inspectContent: true, limits: {},
    }));
  }
  return manifests;
}

test('HVI is discoverable in the native HQ tool list', async () => {
  const response = await list(server());
  const tools = response.result.tools;
  const hvi = tools.find(t => t.name === 'hvi_compare_pinned');
  assert.ok(hvi, 'the HVI capability must be listed for agent discovery');
  assert.match(hvi.description, /source facts/i);
  assert.match(hvi.description, /never runtime proof/i);
  assert.deepEqual(hvi.inputSchema.required, ['sourceManifests', 'targetPinId']);
  assert.equal(hvi.inputSchema.properties.sourceManifests.type, 'array');
});

test('an agent can invoke the native HVI capability on invented fixtures', async () => {
  const manifests = await invented();
  const response = await call(server(), 'hvi_compare_pinned', {
    sourceManifests: manifests,
    targetPinId: manifests.at(-1).pin.pinId,
  });
  assert.equal(response.result.isError, undefined);
  const out = payload(response);
  assert.equal(out.capabilityId, 'arbor.hvi.compare.pinned/1');
  assert.equal(out.comparison.sourcePins.length, 3);
  assert.equal(out.comparison.coverage.length, 2);
  assert.equal(out.runtimeAccepted, false);
  assert.equal(out.hostBound, false);
  assert.equal(out.provenance, 'SYNTHETIC_ONLY');
  assert.ok(out.limitations.includes('not runtime verified'));
});

test('the native HVI tool refuses any non-synthetic source', async () => {
  const manifests = await invented();
  const renamed = manifests.map(m => ({ ...m, pin: { ...m.pin, repoIdentity: 'real-owner/private-repo' } }));
  const response = await call(server(), 'hvi_compare_pinned', {
    sourceManifests: renamed,
    targetPinId: renamed.at(-1).pin.pinId,
  });
  assert.equal(response.result.isError, true);
  assert.match(response.result.content[0].text, /synthetic/i);
});

test('the native HVI tool refuses an incomplete source set', async () => {
  const manifests = await invented();
  const response = await call(server(), 'hvi_compare_pinned', {
    sourceManifests: [manifests[0]],
    targetPinId: manifests[0].pin.pinId,
  });
  assert.equal(response.result.isError, true);
  assert.match(response.result.content[0].text, /RESOURCE_LIMIT/);
});
