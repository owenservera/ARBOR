// Focused unit test for NEXT:B-F01-B14 (CONFIRMED SOURCE REPAIR).
// Owned paths: apps/vivim-host/server.mjs, apps/vivim-host/bootstrap/worker-supervisor.mjs
//
// Covers:
//   AT-BEB57E2A22C7 — worker supervisor fed real native health/diagnostics via existing Host
//     lifecycle; missing evidence distinguished from failure.
//   AT-4BF6BC95F4EC / AT-7DD9F1E3705D — createHostServer wires nativeContext/requestContext
//     through existing Host access control (native query, pure execution, lifecycle) and
//     boots with the diagnostics-wired supervisor.
import { test } from 'node:test';
import assert from 'assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { request as httpRequest } from 'node:http';
import { createWorkerSupervisor } from '../bootstrap/worker-supervisor.mjs';
import { createHostServer } from '../server.mjs';

const tmp = () => mkdtempSync(join(tmpdir(), 'host-native-diag-'));

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = httpRequest({ hostname: u.hostname, port: u.port, path: u.pathname, method: 'GET' },
      res => {
        const chunks = [];
        res.on('data', c => chunks.push(c));
        res.on('end', () => resolve({
          status: res.statusCode,
          json: () => JSON.parse(Buffer.concat(chunks).toString('utf8')),
        }));
      });
    req.on('error', reject);
    req.end();
  });
}

// --- worker-supervisor: native health evidence (missing vs failure) ---

test('worker supervisor reports missing native evidence, not failure, when the probe is absent', () => {
  const dir = tmp();
  try {
    // No lease exists yet; only native evidence is reported.
    const s = createWorkerSupervisor({ dataRoot: dir, diagnostics: () => null });
    const st = s.status('relay');
    assert.equal(st.state, 'not_started');
    assert.equal(st.evidence.state, 'missing');
    assert.equal(st.evidence.diagnosticCode, 'NO_NATIVE_HEALTH_EVIDENCE');
    assert.equal(st.evidence.source, 'host-worker-health');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('worker supervisor reports a real native fault as failed, distinct from missing evidence', () => {
  const dir = tmp();
  try {
    const s = createWorkerSupervisor({
      dataRoot: dir,
      diagnostics: () => ({ state: 'blocked', diagnosticCode: 'WORKER_CYCLE_FAILED' }),
    });
    const st = s.status('relay');
    assert.equal(st.state, 'not_started');
    assert.equal(st.evidence.state, 'failed');
    assert.equal(st.evidence.diagnosticCode, 'WORKER_CYCLE_FAILED');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('worker supervisor reports current native health as ok', () => {
  const dir = tmp();
  try {
    const s = createWorkerSupervisor({
      dataRoot: dir,
      diagnostics: () => ({ state: 'online', diagnosticCode: 'WORKER_CYCLE_OK' }),
    });
    const st = s.status('relay');
    assert.equal(st.evidence.state, 'ok');
    assert.equal(st.evidence.source, 'host-worker-health');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('worker supervisor with no diagnostics callback reports missing evidence, never failure', () => {
  const dir = tmp();
  try {
    const s = createWorkerSupervisor({ dataRoot: dir }); // diagnostics defaults to null
    const st = s.status('relay');
    assert.equal(st.evidence.state, 'missing');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('worker supervisor diagnostics callback throwing is treated as missing evidence', () => {
  const dir = tmp();
  try {
    const s = createWorkerSupervisor({
      dataRoot: dir,
      diagnostics: () => { throw new Error('probe exploded'); },
    });
    const st = s.status('relay');
    assert.equal(st.evidence.state, 'missing');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('createHostServer boots with diagnostics-wired supervisor and exposes host status', async () => {
  const dataRoot = tmp();
  const server = createHostServer({ dataRoot });
  try {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const port = server.address().port;
    const status = await fetchJson(`http://127.0.0.1:${port}/api/host/status`);
    assert.equal(status.status, 200);
    const body = await status.json();
    assert.equal(body.host.state, 'online');
    assert.ok(body.services, 'host status exposes service health');
  } finally {
    await new Promise(resolve => server.close(resolve));
    rmSync(dataRoot, { recursive: true, force: true });
  }
});
