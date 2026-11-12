// hq/lib/machine-probe.mjs — read-only local-machine observation (AII scenarios HQ-031, HQ-032)
// Enumerates the OS process table, service table and listening ports on the machine
// HQ runs on, and resolves the version of a running executable.
// Read-only only: tasklist/ps, WMI/service queries, netstat/ss and `--version` on an
// executable. No writes, no device effects, no provider sends, no secrets.
import { spawnSync } from 'node:child_process';
import { statSync } from 'node:fs';
import { nowISO } from './util.mjs';

export const MACHINE_PROBE_SCHEMA = 'hq.machine-probe/1';

const VERSION_RE = /\d+(?:\.\d+){1,}/;
const DEFAULT_VERSION_TIMEOUT_MS = 8000;

function finiteNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/** A parseable CSV line, handling doubled quotes inside quoted fields. */
function parseCsvLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') { current += '"'; i += 1; }
        else inQuotes = false;
      } else current += ch;
    } else if (ch === ',') {
      fields.push(current); current = '';
    } else if (ch === '"') {
      inQuotes = true;
    } else current += ch;
  }
  fields.push(current);
  return fields;
}

function firstNonEmptyLine(text) {
  return String(text ?? '').replace(/\r\n/g, '\n').split('\n')
    .map((l) => l.trim()).find((l) => l.length > 0) ?? '';
}

/** The version token printed by an executable's `--version`, first line only. */
function versionToken(output) {
  const match = firstNonEmptyLine(output).match(VERSION_RE);
  return match ? match[0] : null;
}

function spawnOrFail(command, args, { timeoutMs } = {}) {
  try {
    return spawnSync(command, args, {
      encoding: 'utf8',
      timeout: Math.max(1000, Number(timeoutMs) || DEFAULT_VERSION_TIMEOUT_MS),
      windowsHide: true,
    });
  } catch (err) {
    return { status: null, error: err, stdout: '', stderr: '' };
  }
}

// ---------------------------------------------------------------------------
// Process table — read-only snapshot of running processes
// ---------------------------------------------------------------------------

function rawTasklist() {
  if (process.platform !== 'win32') {
    const res = spawnOrFail('ps', ['-e', '-o', 'pid=', 'comm=', 'args=']);
    if (res.status === null || res.status !== 0) return [];
    return String(res.stdout ?? '').split('\n');
  }
  const res = spawnOrFail('tasklist', ['/FO', 'CSV']);
  if (res.status === null || res.status !== 0) return [];
  return String(res.stdout ?? '').split('\n');
}

function normalizeProcessRow(fields, header) {
  const row = {};
  for (let i = 0; i < header.length; i++) row[String(header[i]).trim().toLowerCase()] = fields[i] ?? '';
  const pid = Number(row.pid) || null;
  const name = row['image name'] || row.comm || row.name || '';
  return {
    pid,
    name,
    executablePath: row['image name'] || null,
    session: row['session name'] || null,
    memUsage: row['mem usage'] || null,
    command: row.args || null,
  };
}

function normalizeProcessObject(row) {
  return {
    pid: finiteNumber(row.pid ?? row.Pid ?? null),
    name: String(row.name ?? row['Image Name'] ?? row['image name'] ?? ''),
    executablePath: row.executablePath ?? row.ExecutablePath ?? null,
    session: row.session ?? row['Session Name'] ?? null,
    memUsage: row.memUsage ?? row['Mem Usage'] ?? null,
    command: row.command ?? null,
  };
}

export function listProcesses({ input } = {}) {
  const rows = input == null ? rawTasklist() : input;
  const processes = [];
  let header = null;
  for (const raw of rows) {
    if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
      processes.push(normalizeProcessObject(raw));
      continue;
    }
    const line = String(raw ?? '').trim();
    if (!line) continue;
    const fields = parseCsvLine(line);
    if (!header) { header = fields; continue; }
    processes.push(normalizeProcessRow(fields, header));
  }
  return {
    schema: MACHINE_PROBE_SCHEMA,
    kind: 'process',
    generatedAt: nowISO(),
    platform: process.platform,
    source: input == null ? 'live' : 'snapshot',
    processes,
    count: processes.length,
  };
}

// ---------------------------------------------------------------------------
// Service table — read-only snapshot of OS services
// ---------------------------------------------------------------------------

function rawServices() {
  if (process.platform === 'win32') {
    const cmd = 'Get-CimInstance Win32_Service | Select-Object Name, State, StartMode, PathName, DisplayName | ConvertTo-Csv -NoTypeInformation';
    const res = spawnOrFail('powershell', ['-NoProfile', '-Command', cmd]);
    if (res.status === null || res.status !== 0) return [];
    return String(res.stdout ?? '').split('\n');
  }
  const res = spawnOrFail('systemctl', ['list-units', '--type=service', '--state=running', '--no-pager', '--no-legend']);
  if (res.status === null || res.status !== 0) return [];
  return String(res.stdout ?? '').split('\n');
}

export function listServices({ input } = {}) {
  const rows = input == null ? rawServices() : input;
  const services = [];
  let header = null;
  for (const raw of rows) {
    if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
      services.push({
        name: String(raw.name ?? ''),
        state: String(raw.state ?? ''),
        startMode: String(raw.startMode ?? raw.startmode ?? ''),
        pathName: String(raw.pathName ?? raw.pathname ?? ''),
        displayName: String(raw.displayName ?? raw.displayname ?? ''),
      });
      continue;
    }
    const line = String(raw ?? '').trim();
    if (!line) continue;
    const fields = parseCsvLine(line);
    if (!header) { header = fields.map((f) => f.toLowerCase()); continue; }
    const row = {};
    for (let i = 0; i < header.length; i++) row[header[i]] = fields[i] ?? '';
    services.push({
      name: row.name || '',
      state: row.state || '',
      startMode: row.startmode || '',
      pathName: row.pathname || '',
      displayName: row.displayname || '',
    });
  }
  return {
    schema: MACHINE_PROBE_SCHEMA,
    kind: 'service',
    generatedAt: nowISO(),
    platform: process.platform,
    source: input == null ? 'live' : 'snapshot',
    services,
    count: services.length,
  };
}

// ---------------------------------------------------------------------------
// Listening ports — read-only snapshot of ports in a listening state
// ---------------------------------------------------------------------------

function rawPorts() {
  if (process.platform === 'win32') {
    const res = spawnOrFail('netstat', ['-ano']);
    if (res.status === null || res.status !== 0) return [];
    return String(res.stdout ?? '').split('\n');
  }
  const res = spawnOrFail('ss', ['-tlnp']);
  if (res.status === null || res.status !== 0) return [];
  return String(res.stdout ?? '').split('\n');
}

export function listListeningPorts({ input } = {}) {
  const rows = input == null ? rawPorts() : input;
  const ports = [];
  for (const raw of rows) {
    if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
      ports.push({
        protocol: String(raw.protocol ?? ''),
        localAddress: String(raw.localAddress ?? ''),
        localPort: finiteNumber(raw.localPort),
        state: String(raw.state ?? ''),
        pid: Number(raw.pid) || null,
      });
      continue;
    }
    const line = String(raw ?? '').trim();
    if (!line) continue;
    if (/^(Proto|Active Internet|Netid|State)/i.test(line)) continue;
    const fields = line.split(/\s+/);
    if (process.platform === 'win32') {
      // Proto  Local Address          Foreign Address        State           PID
      // TCP    0.0.0.0:51433          0.0.0.0:0              LISTENING       3412
      const local = fields[1] ?? '';
      const state = fields[3] ?? '';
      const pid = Number(fields[4]) || null;
      if (!/LISTENING/i.test(state)) continue;
      ports.push({ protocol: (fields[0] ?? '').toUpperCase(), localAddress: local.split(':')[0] || '',
        localPort: Number(local.split(':').pop()) || null, state, pid });
    } else {
      // ss -tlnp: Netid State Recv-Q Send-Q Local Address:Port Peer Address:Port
      const local = fields[4] ?? '';
      const state = fields[1] ?? '';
      if (!/LISTEN/i.test(state)) continue;
      ports.push({ protocol: (fields[0] ?? '').toUpperCase(), localAddress: local.split(':')[0] || '',
        localPort: Number(local.split(':').pop()) || null, state, pid: null });
    }
  }
  return {
    schema: MACHINE_PROBE_SCHEMA,
    kind: 'port',
    generatedAt: nowISO(),
    platform: process.platform,
    source: input == null ? 'live' : 'snapshot',
    ports,
    count: ports.length,
  };
}

// ---------------------------------------------------------------------------
// Executable version — read-only version query of one executable
// ---------------------------------------------------------------------------

export function resolveExecutableVersion(executablePath, { versionFlag = '--version', timeoutMs } = {}) {
  const record = {
    executablePath: String(executablePath ?? ''),
    version: null,
    resolvable: false,
    source: 'executable-version-flag',
    reason: null,
  };
  if (!record.executablePath) {
    record.reason = 'no executable path provided';
    return record;
  }
  let stats;
  try { stats = statSync(record.executablePath); } catch (err) {
    record.reason = `executable is not readable: ${err?.code ?? String(err?.message ?? err)}`;
    return record;
  }
  if (!stats.isFile()) {
    record.reason = 'not a regular file';
    return record;
  }
  const res = spawnOrFail(record.executablePath, [versionFlag], { timeoutMs });
  if (res.error || (res.status === null)) {
    record.reason = `version query failed to start: ${res.error?.code ?? String(res.error ?? res.status)}`;
    return record;
  }
  const token = versionToken(res.stdout ?? '');
  if (token) { record.version = token; record.resolvable = true; return record; }
  record.reason = `no version token in ${versionFlag} output`;
  return record;
}

// ---------------------------------------------------------------------------
// Combined snapshot — all read-only views in one call
// ---------------------------------------------------------------------------

export function machineSnapshot({ processes = true, services = true, ports = true } = {}) {
  const result = {
    schema: MACHINE_PROBE_SCHEMA,
    generatedAt: nowISO(),
    platform: process.platform,
  };
  if (processes) result.processes = listProcesses().processes;
  if (services) result.services = listServices().services;
  if (ports) result.ports = listListeningPorts().ports;
  return result;
}
