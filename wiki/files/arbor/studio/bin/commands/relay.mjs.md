# File: studio/bin/commands/relay.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/bin/commands/relay.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 7458 B |
| Lines | 98 |
| Hash | 49ac3fb04d87 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| secretFrom | function | 12 | yes | export const secretFrom = (file, { platform = process.platform, run = execFileSync, env = process.env } = {}) =&gt; { |
| st | const | 13 | no | const st = statSync(file); |
| checkAcl | const | 17 | no | const checkAcl = ` |
| url | const | 57 | no | const url = ctx.flags.url ?? process.env.VIVIM_RELAY_URL, file = ctx.flags[&#39;secret-file&#39;] ?? process.env.VIVIM_RELAY_HOST_SECRET_FILE; |
| studioUrl | const | 59 | no | const studioUrl = ctx.flags[&#39;studio-url&#39;] ?? &#39;http://127.0.0.1:38787&#39;, tokFile = ctx.flags[&#39;studio-token-file&#39;]; |
| hostUrl | const | 60 | no | const hostUrl = ctx.flags[&#39;host-url&#39;] ?? &#39;http://127.0.0.1:43187&#39;; |
| token | const | 61 | no | const token = tokFile ? secretFrom(tokFile) : null; |
| statusFn | function | 62 | no | const statusFn = async () =&gt; { |
| r | const | 63 | no | const r = await fetch(`${studioUrl}/api/v1/personal-agent/status`, { headers: token ? { &#39;x-studio-token&#39;: token } : {} }); |
| bootstrapFn | function | 67 | no | const bootstrapFn = async () =&gt; { |
| r | const | 68 | no | const r = await fetch(`${hostUrl}/api/host/bootstrap/projection`, { signal: AbortSignal.timeout(4000) }); |
| body | const | 70 | no | const body = await r.json(); |
| manifestFn | function | 78 | no | const manifestFn = async () =&gt; { |
| file | const | 79 | no | const file = defaultModelsFile(); |
| ok | const | 80 | no | const ok = (process.env.VIVIM_CHAT_PROVIDERS \|\| &#39;chatgpt,claude,qwen,zai&#39;).split(&#39;,&#39;); |
| raw | const | 81 | no | const raw = JSON.parse(readFileSync(file, &#39;utf8&#39;)); const list = Array.isArray(raw) ? raw : Object.entries(raw).map(([provider, v]) =&gt; ({ provider, ...v })); |
| agent | const | 87 | no | const agent = createRelayAgent({ manifestFn, store: createBridgeStore({ root: ctx.paths.root }), root: ctx.paths.root, url: url.replace(/\\/+$/, &#39;&#39;), hostSecret: secretFrom(file), statusFn, bootstrapF… |
| heartbeat | const | 90 | no | const heartbeat = createWorkerHeartbeat({ root: ctx.paths.root, worker: &#39;relay&#39; }); |
| sync | function | 91 | no | const sync = async options =&gt; { |
| ms | const | 96 | no | const ms = Math.max(1, Number(ctx.flags.interval ?? 3)) * 1000; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 2 | external |
| node:child_process | import | 3 | external |
| node:path | import | 4 | external |
| ../lib/registry.mjs | import | 5 | [studio/bin/lib/registry.mjs](../lib/registry.mjs.md) |
| ../lib/ui.mjs | import | 6 | [studio/bin/lib/ui.mjs](../lib/ui.mjs.md) |
| ../../src/studio/bridge-commands.mjs | import | 7 | [studio/src/studio/bridge-commands.mjs](../../src/studio/bridge-commands.mjs.md) |
| ../../src/studio/relay-agent.mjs | import | 8 | [studio/src/studio/relay-agent.mjs](../../src/studio/relay-agent.mjs.md) |
| ../../src/studio/worker-heartbeat.mjs | import | 9 | [studio/src/studio/worker-heartbeat.mjs](../../src/studio/worker-heartbeat.mjs.md) |
| ../../src/config.mjs | import | 10 | [studio/src/config.mjs](../../src/config.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/bin/studio.mjs](../studio.mjs.md) | ./commands/relay.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// grokbot-authored. `studio relay`: run the outbound relay agent (box -> Vercel relay; nothing listens).
import { readFileSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { define } from '../lib/registry.mjs';
import { usageError } from '../lib/ui.mjs';
import { createBridgeStore } from '../../src/studio/bridge-commands.mjs';
import { createRelayAgent } from '../../src/studio/relay-agent.mjs';
import { createWorkerHeartbeat } from '../../src/studio/worker-heartbeat.mjs';
import { defaultModelsFile } from '../../src/config.mjs';

export const secretFrom = (file, { platform = process.platform, run = execFileSync, env = process.env } = {}) => {
  const st = statSync(file);
  if (!st.isFile()) throw usageError(`${file} must be a regular secret file`);
  if (platform === 'win32') {
    // Windows mode bits do not describe access: validate the NTFS ACL instead.
    const checkAcl = `
$ErrorActionPreference = 'Stop'
$acl = Get-Acl -LiteralPath $env:VIVIM_SECRET_ACL_PATH
$me = [System.Security.Principal.WindowsIdentity]::GetCurrent().User.Value
$allowed = @($me, 'S-1-5-18', 'S-1-5-32-544')
if (-not $acl.AreAccessRulesProtected) { throw 'Secret ACL must disable inherited permissions' }
$owner = $acl.GetOwner([System.Security.Principal.SecurityIdentifier]).Value
if ($owner -notin $allowed) { throw 'Secret has an untrusted owner' }
foreach ($rule in $acl.GetAccessRules($true, $true, [System.Security.Principal.SecurityIdentifier])) {
  if ($rule.AccessControlType -eq 'Allow' -and $rule.IdentityReference.Value -notin $allowed) {
    throw 'Secret grants access to another account'
  }
}`;
    try {
      run('powershell.exe', ['-NoLogo', '-NoProfile', '-NonInteractive', '-Command', checkAcl], {
        env: { ...env, VIVIM_SECRET_ACL_PATH: path.resolve(file),
          // A pwsh parent can otherwise make Windows PowerShell load incompatible modules.
          PSModulePath: path.join(env.SystemRoot || env.WINDIR, 'System32', 'WindowsPowerShell', 'v1.0', 'Modules'),
        // Cold Windows PowerShell starts can exceed 10 s under load; a timeout still fails closed, so the bound is generous.
        }, timeout: 30000, windowsHide: true, stdio: 'pipe',
      });
    } catch {
      throw usageError(`${file} must have a protected Windows ACL allowing only its owner account, SYSTEM, or Administrators`);
    }
  } else if (st.mode & 0o077) throw usageError(`${file} must be mode 0600`);
  return readFileSync(file, 'utf8').trim();
};
define({ name: 'relay', section: 'System', usage: '--url https://<relay> --secret-file <private file>',
  summary: 'Poll the Vercel mobile relay outbound: pull phone commands, push replies and status',
  flags: {
    url: { type: 'string', valueName: 'URL', desc: 'Relay origin, e.g. https://vivim-mobile-relay.vercel.app (or VIVIM_RELAY_URL)' },
    'secret-file': { type: 'string', valueName: 'FILE', desc: 'Host secret: Unix 0600 or protected Windows ACL (or VIVIM_RELAY_HOST_SECRET_FILE)' },
    interval: { type: 'string', valueName: 'SEC', desc: 'Poll interval seconds (default 3)' },
    once: { type: 'boolean', desc: 'Run a single sync and exit' },
    'studio-url': { type: 'string', valueName: 'URL', desc: 'Local Studio for status snapshot (default http://127.0.0.1:38787)' },
    'host-url': { type: 'string', valueName: 'URL', desc: 'Local Host for the bootstrap projection (default http://127.0.0.1:43187)' },
    'studio-token-file': { type: 'string', valueName: 'FILE', desc: 'Private Studio token file: Unix 0600 or protected Windows ACL' },
  },
  examples: ['studio relay --url https://vivim-mobile-relay.vercel.app --secret-file ~/.vivim-relay-host'],
  async run(ctx) {
    const url = ctx.flags.url ?? process.env.VIVIM_RELAY_URL, file = ctx.flags['secret-file'] ?? process.env.VIVIM_RELAY_HOST_SECRET_FILE;
    if (!url || !file) throw usageError('relay needs --url and --secret-file');
    const studioUrl = ctx.flags['studio-url'] ?? 'http://127.0.0.1:38787', tokFile = ctx.flags['studio-token-file'];
    const hostUrl = ctx.flags['host-url'] ?? 'http://127.0.0.1:43187';
    const token = tokFile ? secretFrom(tokFile) : null;
    const statusFn = async () => {
      const r = await fetch(`${studioUrl}/api/v1/personal-agent/status`, { headers: token ? { 'x-studio-token': token } : {} });
      return r.ok ? r.json() : { error: `studio HTTP ${r.status}` };
    };
    // Personalization projection from the Host bootstrap ledger. Absent host = no bootstrap block.
    const bootstrapFn = async () => {
      const r = await fetch(`${hostUrl}/api/host/bootstrap/projection`, { signal: AbortSignal.timeout(4000) });
      if (!r.ok) return null;
      const body = await r.json();
      if (!body || body.state !== 'ready' || body.schema !== 'vivim.bootstrap-phone/1') return null;
      // The relay is external transport: publish only non-sensitive visual tokens and
      // anonymous progress. Never upload personal cards, hard NOs or inferred preferences.
      const { cards, hardNos, preferences, ...visualOnly } = body;
      return { ...visualOnly, cards: [], hardNos: [], preferences: [] };
    };
    // grokbot-authored: Relay Chat capability manifest from the harness model cache (rebuilt on `wh models --refresh`).
    const manifestFn = async () => {
      const file = defaultModelsFile();
      const ok = (process.env.VIVIM_CHAT_PROVIDERS || 'chatgpt,claude,qwen,zai').split(',');
```

_First 80 of 99 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
