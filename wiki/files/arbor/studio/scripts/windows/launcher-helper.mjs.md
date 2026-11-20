# File: studio/scripts/windows/launcher-helper.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/scripts/windows/launcher-helper.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 2791 B |
| Lines | 50 |
| Hash | 6d3c229964af |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| fd | const | 33 | no | const fd = openSync(logFile, &#39;wx&#39;); |
| argv | const | 34 | no | const argv = [cli, &#39;serve&#39;, &#39;--port&#39;, String(cdpPort), &#39;--studio-port&#39;, String(studioPort), &#39;--no-open&#39;, ...(lan === &#39;lan&#39; ? [&#39;--lan-pair&#39;] : [])]; |
| child | const | 35 | no | const child = spawn(process.execPath, argv, { cwd: path.dirname(path.dirname(cli)), detached: true, windowsHide: true, stdio: [&#39;ignore&#39;, fd, fd], env: process.env }); |
| text | const | 40 | no | const text = process.env.VIVIM_QR_TEXT; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:child_process | import | 12 | external |
| node:fs | import | 13 | external |
| node:path | import | 14 | external |
| ../../src/chrome/browser-ownership.mjs | dynamic | 20 | [studio/src/chrome/browser-ownership.mjs](../../src/chrome/browser-ownership.mjs.md) |
| ../../src/studio/lan-pair.mjs | dynamic | 39 | [studio/src/studio/lan-pair.mjs](../../src/studio/lan-pair.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// Small Node helpers for scripts/windows/VIVIM.ps1. They live in a file (not `node -e`) so
// Windows PowerShell 5.1 argument quoting can never mangle the code, and secrets travel only
// through the environment, never through process arguments.
//
//   node launcher-helper.mjs verify <profileDir> <cdpPort>
//       Read-only: exit 0 when the browser on <cdpPort> is the dedicated VIVIM profile.
//   node launcher-helper.mjs spawn <cliPath> <cdpPort> <studioPort> <logFile> [lan]
//       Start `studio serve` detached and hidden, so it survives the launcher window.
//       The data folder comes from CAPTURE_STUDIO_HOME (inherited); prints {"pid":N}.
//   node launcher-helper.mjs qr
//       Print a terminal QR code for VIVIM_QR_TEXT (env, so the token is not in argv).
import { spawn } from 'node:child_process';
import { closeSync, mkdirSync, openSync } from 'node:fs';
import path from 'node:path';

const [cmd, ...args] = process.argv.slice(2);

try {
  if (cmd === 'verify') {
    const { verifyBrowserOwner } = await import('../../src/chrome/browser-ownership.mjs');
    const [profileDir, port] = args;
    try {
      await verifyBrowserOwner({ profileDir, port: Number(port) });
      console.log('The dedicated VIVIM browser is already open.');
    } catch {
      console.error('A browser is using the VIVIM connection, but it is not the dedicated VIVIM browser for this data folder.');
      process.exitCode = 1;
    }
  } else if (cmd === 'spawn') {
    const [cli, cdpPort, studioPort, logFile, lan] = args;
    mkdirSync(path.dirname(logFile), { recursive: true });
    // Unique per launcher attempt, so another double-click cannot erase the owner's pairing link.
    const fd = openSync(logFile, 'wx');
    const argv = [cli, 'serve', '--port', String(cdpPort), '--studio-port', String(studioPort), '--no-open', ...(lan === 'lan' ? ['--lan-pair'] : [])];
    const child = spawn(process.execPath, argv, { cwd: path.dirname(path.dirname(cli)), detached: true, windowsHide: true, stdio: ['ignore', fd, fd], env: process.env });
    child.once('error', (error) => { closeSync(fd); console.error(`Could not start VIVIM: ${error.message}`); process.exitCode = 1; });
    child.once('spawn', () => { closeSync(fd); child.unref(); console.log(JSON.stringify({ pid: child.pid })); });
  } else if (cmd === 'qr') {
    const { qrToTerminal } = await import('../../src/studio/lan-pair.mjs');
    const text = process.env.VIVIM_QR_TEXT;
    if (!text) throw new Error('nothing to show');
    console.log(qrToTerminal(text));
  } else {
    console.error('usage: launcher-helper.mjs verify|spawn|qr');
    process.exitCode = 2;
  }
} catch (error) {
  console.error(error?.message ?? String(error));
  process.exitCode = 1;
}
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
