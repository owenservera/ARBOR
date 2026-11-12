// AII scenario HQ-031 (group D, P1): "Which services are actually running on my machine?"
// Engine: hq/lib/machine-probe.mjs (new read-only probe, per hq/aii/assessments/recheck-scope.json
// wave-1 overrule: HQ-031 is a gap, not out_of_scope — read-only OS observation crosses no boundary).
//
// Ground truth LOCKED 2026-11-11 (this session):
//   - hq/lib/machine-probe.mjs exports listProcesses/listServices/listListeningPorts (live via
//     tasklist / WMI / netstat on win32, ps / ss / systemctl elsewhere; read-only, no effects)
//     plus resolveExecutableVersion (shared with HQ-032) and machineSnapshot.
//   - The fixture runs the probe over a sandboxed snapshot (HQ-031-machine-snapshot.json), never
//     over the live machine except for command-shape smoke checks already made this session
//     (tasklist lists 63 processes; WMI lists services; netstat -ano lists 135 rows — all read-only).
//   - Disjointness from agent seats: process/service ids are OS resources; chatgpt/gemini/claude/
//     channel-manager are agent seat liveness (hq/lib/channel-seats.mjs loadSeats/classifySeat).
//   - Explicit zero: hq/lib/schema.mjs defines no process/service table, so the probe is
//     file/snapshot-backed (HQ-060 fixture pattern), not ledger-backed.
//
// run() re-derives every finding from the snapshot; nothing is seeded into any HQ ledger.

import { defineFixture, finding } from './harness.mjs';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

export default defineFixture({
  id: 'HQ-031',
  provenance:
    'Locked 2026-11-11 (this session) from hq/lib/machine-probe.mjs (new read-only module, created this session) ' +
    'over the sandboxed snapshot hq/aii/fixtures/HQ-031-machine-snapshot.json. Live command shapes were ' +
    'smoke-verified read-only on this machine this session: tasklist /FO CSV (63 process rows), PowerShell ' +
    'Get-CimInstance Win32_Service (service rows) and netstat -ano (135 rows) all ran with exit 0 and wrote ' +
    'nothing. Ground truth is the snapshot; nothing from the live machine is pinned except that the commands ' +
    'exist and are read-only. run() re-derives findings from the snapshot.',
  expected: [
    { what: 'running processes enumerated from the snapshot: bun.exe pid 3412 among 5 processes', where: 'hq/lib/machine-probe.mjs listProcesses' },
    { what: 'OS services enumerated from the snapshot: Schedule Running, windefend Running, Spooler Stopped', where: 'hq/lib/machine-probe.mjs listServices' },
    { what: 'machine-process identifiers are disjoint from agent seat ids (chatgpt, gemini, claude, channel-manager): seats are liveness, not OS services', where: 'hq/lib/channel-seats.mjs loadSeats + hq/lib/machine-probe.mjs' },
    { what: 'no process/service table in hq/lib/schema.mjs: the probe is file/snapshot-backed, not ledger-backed (explicit zero)', where: 'hq/lib/schema.mjs' },
  ],
  run: async () => {
    const findings = [];
    const { listProcesses, listServices } = await import('../../lib/machine-probe.mjs');

    const snapshot = JSON.parse(readFileSync(join(ROOT, 'hq/aii/fixtures/HQ-031-machine-snapshot.json'), 'utf8'));
    if (!Array.isArray(snapshot.processes) || !Array.isArray(snapshot.services)) {
      throw new Error(`malformed machine snapshot: ${JSON.stringify(snapshot).slice(0, 200)}`);
    }

    // 1. Processes classified from snapshot rows.
    const proc = listProcesses({ input: snapshot.processes });
    if (proc.count !== 5 || proc.processes.some((p) => p.pid == null)) {
      throw new Error(`expected 5 parsed processes, got ${proc.count}: ${JSON.stringify(proc.processes)}`);
    }
    const bun = proc.processes.find((p) => p.pid === 3412);
    if (!bun || bun.name !== 'bun.exe') {
      throw new Error(`expected bun.exe pid 3412 in snapshot, got ${JSON.stringify(proc.processes)}`);
    }
    findings.push(finding('running processes enumerated from the snapshot: bun.exe pid 3412 among 5 processes', 'hq/lib/machine-probe.mjs listProcesses'));

    // 2. Services classified from snapshot rows.
    const svc = listServices({ input: snapshot.services });
    if (svc.count !== 3) throw new Error(`expected 3 parsed services, got ${svc.count}`);
    const schedule = svc.services.find((s) => s.name === 'Schedule');
    const windefend = svc.services.find((s) => s.name === 'windefend');
    const spooler = svc.services.find((s) => s.name === 'Spooler');
    if (!schedule || schedule.state !== 'Running' || !windefend || windefend.state !== 'Running' || !spooler || spooler.state !== 'Stopped') {
      throw new Error(`unexpected service states: ${JSON.stringify(svc.services)}`);
    }
    findings.push(finding('OS services enumerated from the snapshot: Schedule Running, windefend Running, Spooler Stopped', 'hq/lib/machine-probe.mjs listServices'));

    // 3. Disjoint from agent seat ids: OS resources are not agent seats.
    const seatIds = ['chatgpt', 'gemini', 'claude', 'channel-manager'];
    let collision = false;
    for (const seat of seatIds) {
      if (proc.processes.some((p) => String(p.name ?? '').toLowerCase() === seat)) collision = true;
      if (svc.services.some((s) => String(s.name ?? '').toLowerCase() === seat)) collision = true;
    }
    if (collision) throw new Error('an OS process/service id collides with an agent seat id');
    findings.push(finding('machine-process identifiers are disjoint from agent seat ids (chatgpt, gemini, claude, channel-manager): seats are liveness, not OS services', 'hq/lib/channel-seats.mjs loadSeats + hq/lib/machine-probe.mjs'));

    // 4. Explicit zero: no process/service table in the schema.
    const schemaText = readFileSync(join(ROOT, 'hq/lib/schema.mjs'), 'utf8');
    if (/CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+(processes|services)\b/i.test(schemaText)) {
      throw new Error('schema.mjs defines a process or service table — probe must stay snapshot-backed');
    }
    findings.push(finding('no process/service table in hq/lib/schema.mjs: the probe is file/snapshot-backed, not ledger-backed (explicit zero)', 'hq/lib/schema.mjs'));

    return findings;
  },
});
