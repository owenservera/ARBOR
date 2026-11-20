# File: hq/lib/machine-probe.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/lib/machine-probe.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 11190 B |
| Lines | 300 |
| Hash | 6d05e4ecb89e |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| MACHINE_PROBE_SCHEMA | const | 10 | yes | export const MACHINE_PROBE_SCHEMA = &#39;hq.machine-probe/1&#39;; |
| VERSION_RE | const | 12 | no | const VERSION_RE = /\\d+(?:\\.\\d+){1,}/; |
| DEFAULT_VERSION_TIMEOUT_MS | const | 13 | no | const DEFAULT_VERSION_TIMEOUT_MS = 8000; |
| finiteNumber | function | 15 | no | function finiteNumber(value) { |
| n | const | 16 | no | const n = Number(value); |
| parseCsvLine | function | 21 | no | function parseCsvLine(line) { |
| fields | const | 22 | no | const fields = []; |
| current | variable | 23 | no | let current = &#39;&#39;; |
| inQuotes | variable | 24 | no | let inQuotes = false; |
| ch | const | 26 | no | const ch = line[i]; |
| firstNonEmptyLine | function | 42 | no | function firstNonEmptyLine(text) { |
| versionToken | function | 48 | no | function versionToken(output) { |
| spawnOrFail | function | 53 | no | function spawnOrFail(command, args, { timeoutMs } = {}) { |
| rawTasklist | function | 69 | no | function rawTasklist() { |
| res | const | 71 | no | const res = spawnOrFail(&#39;ps&#39;, [&#39;-e&#39;, &#39;-o&#39;, &#39;pid=&#39;, &#39;comm=&#39;, &#39;args=&#39;]); |
| res | const | 75 | no | const res = spawnOrFail(&#39;tasklist&#39;, [&#39;/FO&#39;, &#39;CSV&#39;]); |
| normalizeProcessRow | function | 80 | no | function normalizeProcessRow(fields, header) { |
| row | const | 81 | no | const row = {}; |
| pid | const | 83 | no | const pid = Number(row.pid) \|\| null; |
| name | const | 84 | no | const name = row[&#39;image name&#39;] \|\| row.comm \|\| row.name \|\| &#39;&#39;; |
| normalizeProcessObject | function | 95 | no | function normalizeProcessObject(row) { |
| listProcesses | function | 106 | yes | export function listProcesses({ input } = {}) { |
| rows | const | 107 | no | const rows = input == null ? rawTasklist() : input; |
| processes | const | 108 | no | const processes = []; |
| header | variable | 109 | no | let header = null; |
| line | const | 115 | no | const line = String(raw ?? &#39;&#39;).trim(); |
| fields | const | 117 | no | const fields = parseCsvLine(line); |
| rawServices | function | 136 | no | function rawServices() { |
| cmd | const | 138 | no | const cmd = &#39;Get-CimInstance Win32_Service \| Select-Object Name, State, StartMode, PathName, DisplayName \| ConvertTo-Csv -NoTypeInformation&#39;; |
| res | const | 139 | no | const res = spawnOrFail(&#39;powershell&#39;, [&#39;-NoProfile&#39;, &#39;-Command&#39;, cmd]); |
| res | const | 143 | no | const res = spawnOrFail(&#39;systemctl&#39;, [&#39;list-units&#39;, &#39;--type=service&#39;, &#39;--state=running&#39;, &#39;--no-pager&#39;, &#39;--no-legend&#39;]); |
| listServices | function | 148 | yes | export function listServices({ input } = {}) { |
| rows | const | 149 | no | const rows = input == null ? rawServices() : input; |
| services | const | 150 | no | const services = []; |
| header | variable | 151 | no | let header = null; |
| line | const | 163 | no | const line = String(raw ?? &#39;&#39;).trim(); |
| fields | const | 165 | no | const fields = parseCsvLine(line); |
| row | const | 167 | no | const row = {}; |
| rawPorts | function | 192 | no | function rawPorts() { |
| res | const | 194 | no | const res = spawnOrFail(&#39;netstat&#39;, [&#39;-ano&#39;]); |
| res | const | 198 | no | const res = spawnOrFail(&#39;ss&#39;, [&#39;-tlnp&#39;]); |
| listListeningPorts | function | 203 | yes | export function listListeningPorts({ input } = {}) { |
| rows | const | 204 | no | const rows = input == null ? rawPorts() : input; |
| ports | const | 205 | no | const ports = []; |
| line | const | 217 | no | const line = String(raw ?? &#39;&#39;).trim(); |
| fields | const | 220 | no | const fields = line.split(/\\s+/); |
| local | const | 224 | no | const local = fields[1] ?? &#39;&#39;; |
| state | const | 225 | no | const state = fields[3] ?? &#39;&#39;; |
| pid | const | 226 | no | const pid = Number(fields[4]) \|\| null; |
| local | const | 232 | no | const local = fields[4] ?? &#39;&#39;; |
| state | const | 233 | no | const state = fields[1] ?? &#39;&#39;; |
| resolveExecutableVersion | function | 254 | yes | export function resolveExecutableVersion(executablePath, { versionFlag = &#39;--version&#39;, timeoutMs } = {}) { |
| stats | variable | 266 | no | let stats; |
| res | const | 275 | no | const res = spawnOrFail(record.executablePath, [versionFlag], { timeoutMs }); |
| token | const | 280 | no | const token = versionToken(res.stdout ?? &#39;&#39;); |
| machineSnapshot | function | 290 | yes | export function machineSnapshot({ processes = true, services = true, ports = true } = {}) { |
| result | const | 291 | no | const result = { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:child_process | import | 6 | external |
| node:fs | import | 7 | external |
| ./util.mjs | import | 8 | [hq/lib/util.mjs](./util.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [hq/aii/fixtures/HQ-031-running-services.mjs](../aii/fixtures/HQ-031-running-services.mjs.md) | ../../lib/machine-probe.mjs |
| [hq/aii/fixtures/HQ-032-running-version.mjs](../aii/fixtures/HQ-032-running-version.mjs.md) | ../../lib/machine-probe.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
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
```

_First 80 of 301 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
