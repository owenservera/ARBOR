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
      const raw = JSON.parse(readFileSync(file, 'utf8')); const list = Array.isArray(raw) ? raw : Object.entries(raw).map(([provider, v]) => ({ provider, ...v }));
      return { updatedAt: new Date().toISOString(), providers: list.filter(p => ok.includes(p.provider)).map(p => ({ id: p.provider, label: p.label ?? p.provider, signedIn: true,
        models: (p.models ?? []).filter(m => !p.slider || String(m.id).toLowerCase() !== String(p.slider.label).toLowerCase()).map(m => ({ id: m.id, label: m.label ?? m.id, current: !!m.current })),
        thinkingLevels: (p.efforts?.length ? p.efforts : p.slider ? [{ id: String(p.slider.label).toLowerCase(), label: p.slider.label, locked: !!p.slider.locked }] : []).map(e => ({ id: e.id ?? e, label: e.label ?? e.id ?? e, locked: !!(e.locked || p.slider?.locked) })),
        newChat: true, attachments: false })) };
    };
    const agent = createRelayAgent({ manifestFn, store: createBridgeStore({ root: ctx.paths.root }), root: ctx.paths.root, url: url.replace(/\/+$/, ''),
      hostSecret: secretFrom(file), statusFn, bootstrapFn,
      wakeUrl: process.env.VIVIM_WAKE_WEBHOOK_URL || null, wakeKey: process.env.VIVIM_WAKE_WEBHOOK_KEY || null, log: m => console.error(`[relay ${new Date().toISOString()}] ${m}`) });
    const heartbeat = createWorkerHeartbeat({ root: ctx.paths.root, worker: 'relay' });
    const sync = async options => {
      try { const result = await agent.syncOnce(options); try { heartbeat.record('ok'); } catch {} return result; }
      catch (e) { try { heartbeat.record('error'); } catch {} throw e; }
    };
    if (ctx.flags.once) { ctx.out.emit(await sync({ withStatus: true }), o => o.line('synced')); return; }
    const ms = Math.max(1, Number(ctx.flags.interval ?? 3)) * 1000;
    for (;;) { try { await sync(); } catch (e) { console.error(`[relay] ${e.message}`); } await new Promise(r => setTimeout(r, ms)); }
  } });
