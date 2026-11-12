// Disabled scheduler draft retained for reference only. It is not an authorized
// browser owner or durable scheduler and must not grant, approve, send, or ingest.
// Both the CLI entrypoint and programmatic execution fail closed.
import process from 'node:process';
import { randomUUID } from 'node:crypto';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { createRouter } from '../interface/router.mjs';
import { createApprovals } from '../interface/approval.mjs';
import { loadOwnerToken } from '../../../apps/vivim-host/bootstrap/owner-auth.mjs';
import { studioDataDir } from '../../../apps/vivim-host/server.mjs';
import { parseF02Response } from '../../../apps/mobile-relay/bootstrap-f02.mjs';
import { parseF01Response, F01_SCHEMA } from '../../../apps/mobile-relay/bootstrap-f01.mjs';

const DEFAULT_HOST = 'http://127.0.0.1:43187';
const PASSES = ['F02', 'F01'];
const DISABLED_DRAFT = true;
const disabledDraft = () => Object.assign(new Error('BOOTSTRAP_SCHEDULER_DISABLED: scheduler is a disabled draft'), { code: 'BOOTSTRAP_SCHEDULER_DISABLED' });

import { F02_PROMPT, F01_PROMPT, extractJson } from '../../../apps/mobile-relay/bootstrap-prompts.mjs';
export { extractJson };

const log = line => process.stderr.write(`[bootstrap] ${line}\n`);

export class BootstrapScheduler {
  constructor({ hostUrl = DEFAULT_HOST, provider = 'chatgpt', timeoutMs = 600000, replyTimeoutMs = 240000, requestIdPrefix = 'req-bst', token = process.env.VIVIM_BOOTSTRAP_TOKEN } = {}) {
    this.hostUrl = String(hostUrl).replace(/\/+$/, '');
    this.provider = provider;
    this.timeoutMs = timeoutMs;
    this.replyTimeoutMs = replyTimeoutMs;
    this.requestIdPrefix = requestIdPrefix;
    this.token = token;
    this.results = [];
  }

  // Every Host mutation is loopback + owner token + explicit marker header.
  async hostPost(endpoint, body, token = this.token) {
    if (DISABLED_DRAFT) throw disabledDraft();
    if (typeof token !== 'string' || token.length < 32) throw new Error('Host owner token missing or too short; refusing to run');
    const res = await fetch(this.hostUrl + endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-vivim-bootstrap': '1', authorization: 'Bearer ' + token },
      body: JSON.stringify(body),
    });
    return { ok: res.ok, status: res.status, body: await res.json().catch(() => ({})) };
  }

  async grant(scope = 'full-bootstrap') { return this.hostPost('/api/host/bootstrap/grant', { scope }); }

  promptFor(passId, generationId) {
    if (passId === 'F02') return F02_PROMPT;
    if (passId === 'F01') return F01_PROMPT(generationId);
    throw new Error('unsupported pass ' + passId);
  }

  // Local pre-validation with the same trusted validators the Host will apply:
  // an invalid reply fails here without ever being written.
  validatorFor(passId) {
    if (passId === 'F02') return parseF02Response;
    if (passId === 'F01') return parseF01Response;
    throw new Error('unsupported pass ' + passId);
  }

  async runPasses({ router, approvals, passes = PASSES, now = () => Date.now() } = {}) {
    if (DISABLED_DRAFT) throw disabledDraft();
    if (!router) throw new Error('router required');
    const results = [];
    // One Host grant up front; the scope is idempotent and full-bootstrap covers
    // both visual and profile/boundary/pass areas. If the Host is unreachable all
    // passes are blocked before any send happens.
    try {
      const granted = await this.grant('full-bootstrap');
      if (!granted.ok) throw new Error('host grant failed: ' + granted.status + ' ' + JSON.stringify(granted.body));
      log('granted full-bootstrap');
    } catch (error) {
      log('host unavailable: ' + error.message + '; no send attempted');
      return PASSES.concat(passes).filter((p, i, a) => a.indexOf(p) === i)
        .filter(p => passes.includes(p))
        .map(passId => ({ passId, requestId: null, generationId: null, status: 'blocked', ingested: false, receipt: null, reason: 'host unreachable; no send' }));
    }
    for (const passId of passes) {
      const generationId = 'gen-' + passId.toLowerCase() + '-' + now().toString(36) + '-' + randomUUID().slice(0, 8);
      const requestId = this.requestIdPrefix + '-' + randomUUID().slice(0, 12);
      // Record status first via setPassState so a crash mid-pass is visible; the
      // Host refuses unsupported passes anyway. This never assumes a reply.
      const record = { passId, requestId, generationId, status: 'sending', ingested: false, receipt: null, reason: null };
      results.push(record);
      await this.passState(passId, 'running', requestId);
      let reply = null;
      try {
        const ack = await router.ask({ provider: this.provider, prompt: this.promptFor(passId, generationId), requestId, threadUrl: 'new', replyTimeoutMs: this.replyTimeoutMs });
        log(passId + ' acknowledged request ' + ack.requestId + ' status ' + ack.status);
        // The router may already have approved (dev auto-approve); approve only a pending request.
        if (await approvals.pending(requestId)) await approvals.approve(requestId);
        const final = await router.wait(requestId, this.timeoutMs);
        log(passId + ' final status ' + (final?.status ?? 'none'));
        if (final && final.reply && (final.status === 'complete' || final.status === 'observed')) reply = final.reply;
        else if (final?.status === 'uncertain') { record.status = 'uncertain'; record.reason = 'send uncertain; not resent'; continue; }
        else { record.status = 'blocked'; record.reason = 'send ' + (final?.status ?? 'unknown') + '; not resent'; continue; }
      } catch (error) {
        record.status = 'blocked'; record.reason = 'send error: ' + error.message + '; not resent'; continue;
      }
      let parsed = extractJson(reply);
      if (!parsed) { record.status = 'parse_failed'; record.reason = 'no parseable JSON from reply; not resent'; continue; }
      try { this.validatorFor(passId)(parsed); }
      catch (error) { record.status = 'invalid'; record.reason = 'validator: ' + error.message; continue; }
      try {
        const posted = await this.hostPost(passId === 'F02' ? '/api/host/bootstrap/f02' : '/api/host/bootstrap/f01',
          { response: parsed, requestId, generationId });
        if (!posted.ok) { record.status = 'ingest_failed'; record.reason = 'host ' + posted.status + ' ' + JSON.stringify(posted.body); continue; }
        record.status = 'complete'; record.ingested = true;
        record.receipt = posted.body?.receipt ?? posted.body ?? null;
      } catch (error) { record.status = 'ingest_failed'; record.reason = 'host error: ' + error.message; continue; }
    }
    this.results = results;
    return results;
  }

  // Best-effort visible pass state; never blocks a pass.
  async passState(pass, status, requestId) {
    try { await this.hostPost('/api/host/bootstrap/pass-state', { pass, status, requestId }); } catch { /* status only */ }
  }

  async status() {
    const res = await fetch(this.hostUrl + '/api/host/bootstrap/status');
    return res.json();
  }
}

// Env token first, then the Host's stored owner-token file (read-only; never created here).
export function resolveHostToken(env = process.env) {
  if (typeof env.VIVIM_BOOTSTRAP_TOKEN === 'string' && env.VIVIM_BOOTSTRAP_TOKEN.length >= 32) return env.VIVIM_BOOTSTRAP_TOKEN;
  try { return loadOwnerToken({ dataRoot: studioDataDir(env), env, create: false }).token; } catch { return null; }
}

export function createBootstrapScheduler(options) { return new BootstrapScheduler(options); }

if (!process.env.BOOTSTRAP_SKIP_MAIN && process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (DISABLED_DRAFT) {
    log(disabledDraft().message);
    process.exitCode = 1;
  } else {
  const argv = process.argv.slice(2);
  const idx = flag => { const i = argv.indexOf(flag); return i !== -1 ? argv[i + 1] ?? null : null; };
  const hostUrl = idx('--host') ?? DEFAULT_HOST;
  const provider = idx('--provider') ?? 'chatgpt';
  const timeout = Number(idx('--timeout')) || 600000;
  const passList = (idx('--passes') ?? PASSES.join(',')).split(',').map(p => p.trim().toUpperCase()).filter(Boolean);
  const token = resolveHostToken();
  if (!token) {
    log('no Host owner token (VIVIM_BOOTSTRAP_TOKEN or <data>/bootstrap/owner-token); start the Host first');
    process.exitCode = 2;
  } else {
    const scheduler = createBootstrapScheduler({ hostUrl, provider, timeoutMs: timeout, token });
    const approvals = createApprovals({ dir: process.env.VIVIM_BOOTSTRAP_APPROVALS ?? (tmpdir() + '/vivim-bootstrap-approvals'), ttlMs: 600000 });
    try {
      const router = await createRouter({ approvals });
      await scheduler.runPasses({ router, approvals, passes: passList });
      for (const r of scheduler.results) log(r.passId + ': ' + r.status + (r.reason ? ' — ' + r.reason : ''));
      const state = await scheduler.status().catch(() => null);
      log('phase ' + (state?.phase ?? 'unknown'));
    } catch (error) { log('fatal: ' + error.message); process.exitCode = 1; }
  }
  }
}
