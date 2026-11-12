import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createWorkerSupervisor } from '../bootstrap/worker-supervisor.mjs';

const tmp = () => mkdtempSync(join(tmpdir(), 'sup-'));

test('supervisor reports not_started for an unknown role', () => {
  const dir = tmp();
  try {
    const s = createWorkerSupervisor({ dataRoot: dir });
    assert.equal(s.status('bootstrap').state, 'not_started');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('takeover starts an in-process worker with a valid lease', () => {
  const dir = tmp();
  try {
    const s = createWorkerSupervisor({ dataRoot: dir });
    const out = s.takeover('bootstrap', process.pid);
    assert.equal(out.state, 'started');
    assert.equal(out.pid, process.pid);
    assert.equal(out.inProcess, true);
    const st = s.status('bootstrap');
    assert.equal(st.state, 'online');
    assert.equal(st.pid, process.pid);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('stop removes the lease and reports stopped', () => {
  const dir = tmp();
  try {
    const s = createWorkerSupervisor({ dataRoot: dir });
    s.takeover('bootstrap', process.pid);
    const out = s.stop('bootstrap');
    assert.equal(out.state, 'stopped');
    assert.equal(s.status('bootstrap').state, 'not_started');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('recover marks an unknown worker as not_started and a stale one as blocked', () => {
  const dir = tmp();
  try {
    const s = createWorkerSupervisor({ dataRoot: dir });
    assert.equal(s.recover('bootstrap').state, 'not_started');
    s.takeover('bootstrap', process.pid);
    const out = s.recover('bootstrap');
    assert.equal(out.state, 'blocked');
    assert.equal(out.reason, 'owner_recovered_no_resend');
    assert.equal(s.status('bootstrap').state, 'not_started');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('second takeover of same role returns already_running', () => {
  const dir = tmp();
  try {
    const s = createWorkerSupervisor({ dataRoot: dir });
    s.takeover('bootstrap', process.pid);
    const out = s.takeover('bootstrap', 99999);
    assert.equal(out.state, 'already_running');
    assert.equal(out.pid, process.pid);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('roles lists supervised roles', () => {
  const dir = tmp();
  try {
    const s = createWorkerSupervisor({ dataRoot: dir });
    assert.deepEqual(s.roles(), []);
    s.takeover('bootstrap', process.pid);
    s.takeover('relay', process.pid);
    assert.deepEqual(s.roles().sort(), ['bootstrap', 'relay']);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('R0 dead-worker status preserves the uncertain lease for authorized recovery', () => {
  const dir = tmp();
  try {
    const s = createWorkerSupervisor({ dataRoot: dir });
    s.takeover('bootstrap', 2147483647);
    const first = s.status('bootstrap');
    assert.equal(first.state, 'uncertain');
    assert.equal(first.reason, 'process_ended');
    const second = s.status('bootstrap');
    assert.equal(second.state, 'uncertain', 'read-only inspection must not delete the lease');
    assert.equal(second.pid, first.pid);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
