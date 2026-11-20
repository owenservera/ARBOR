// Local development helper for the VIVIM bootstrap.
//
// Development/CLI use only. This module is NOT part of the product import graph: no
// Host, Studio, PWA, Tauri or HQ entrypoint imports it, and no product path reaches it.
// It holds no browser, router, approval or ingestion authority: there is no grant,
// approve, send or ingest code here to enable. Bootstrap passes are owned by the existing
// Host scheduler (apps/vivim-host/onboarding/service.mjs -> bootstrap/scheduler.mjs),
// which enforces the owner-pinned generation, the explicit revocable grant, the
// prompt-digest binding and no-duplicate-send rules. This helper only reads Host state;
// every mutation fails closed.
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { loadOwnerToken } from '../../../apps/vivim-host/bootstrap/owner-auth.mjs';
import { studioDataDir } from '../../../apps/vivim-host/server.mjs';

const DEFAULT_HOST = 'http://127.0.0.1:43187';
const disabledDraft = () => Object.assign(
  new Error('BOOTSTRAP_SCHEDULER_DISABLED: bootstrap passes run only in the Host scheduler'),
  { code: 'BOOTSTRAP_SCHEDULER_DISABLED' },
);

const log = line => process.stderr.write(`[bootstrap] ${line}\n`);

export class BootstrapScheduler {
  constructor({ hostUrl = DEFAULT_HOST, fetchImpl = globalThis.fetch } = {}) {
    this.hostUrl = String(hostUrl).replace(/\/+$/, '');
    this.fetchImpl = fetchImpl;
  }

  // Read-only view of the Host's canonical bootstrap state. This is the only network
  // call the dev helper makes; it cannot grant, approve, send or ingest.
  async status() {
    const res = await this.fetchImpl(this.hostUrl + '/api/host/bootstrap/status');
    return res.json();
  }

  // Explicit fail-closed guard. Callers written against the old dev scheduler get a
  // refusal, never a Host grant, a send or a self-approval. Running passes is the Host
  // scheduler's job; this module must never grow a second orchestration path.
  async runPasses() {
    throw disabledDraft();
  }
}

// Env token first, then the Host's stored owner-token file (read-only; never created here).
export function resolveHostToken(env = process.env) {
  if (typeof env.VIVIM_BOOTSTRAP_TOKEN === 'string' && env.VIVIM_BOOTSTRAP_TOKEN.length >= 32) return env.VIVIM_BOOTSTRAP_TOKEN;
  try { return loadOwnerToken({ dataRoot: studioDataDir(env), env, create: false }).token; } catch { return null; }
}

export function createBootstrapScheduler(options) { return new BootstrapScheduler(options); }

if (!process.env.BOOTSTRAP_SKIP_MAIN && process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  log(disabledDraft().message + '; use the Host onboarding scheduler for bootstrap passes');
  process.exitCode = 1;
}