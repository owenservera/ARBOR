#!/usr/bin/env node
// @ts-check
/**
 * @hq:context Multi-model console: one-line health dashboard for every model in provider_config.json.
 *   Reads provider_config.json (read-only), the model budget table, and `hq team` output.
 *   Shows provider, model ID, enabled, health state, budget state, last error, and route status.
 *   No secrets are printed — keys are named by fingerprint only.
 * @hq:owner hq-agent
 * @hq:task model-console
 * @hq:invariant read-only: never mutates provider_config.json, model budget, or agent definitions.
 * @hq:invariant no API keys or secrets are printed to stdout.
 * @hq:see hq/lib/model-router.mjs · hq/lib/model-budget.mjs · hq/lib/revive-lane.mjs
 */

import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { classifyHealth } from '../lib/model-router.mjs';
import { summarizeUsage } from '../lib/model-router.mjs';
import { budgetStatusFromUsage } from '../lib/model-budget.mjs';

const REPO_ROOT = resolve(import.meta.url, '..', '..', '..');
const CONFIG_PATH = process.env.VIVIM_PROVIDER_CONFIG ?? 'C:/Users/VIVIM.inc/.zcode/v2/provider_config.json';
// model_usage lives in the ZCode session store, NOT the HQ index. Reading the wrong DB
// made every model read UNPROVEN while the real table held thousands of completions.
const USAGE_DB_PATH = process.env.VIVIM_USAGE_DB ?? join(
  process.env.USERPROFILE || process.env.HOME || '', '.zcode', 'cli', 'db', 'db.sqlite',
);

/** Parse provider_config.json and return the provider rules array. */
function loadProviderRules() {
  let text;
  try { text = readFileSync(CONFIG_PATH, 'utf8'); }
  catch (err) { return { ok: false, error: `cannot read provider_config.json: ${/** @type {any} */ (err).message}`, rules: [] }; }
  let config;
  try { config = JSON.parse(text); }
  catch (err) { return { ok: false, error: `provider_config.json is not valid JSON: ${/** @type {any} */ (err).message}`, rules: [] }; }
  const rules = config?.config?.providerConfigRules?.providerRules ?? [];
  return { ok: true, rules, raw: config };
}

/** Fingerprint an API key: first 4 + last 4 hex, never the full value. */
function fingerprint(key) {
  if (typeof key !== 'string' || key.length < 8) return 'unset';
  return `${key.slice(0, 4)}…${key.slice(-4)}`;
}

/** Build one console row per provider/model combination. */
function buildRows(rules, usageRows, now) {
  const stats = usageRows.length ? summarizeUsage(usageRows, { now }) : new Map();
  const budgetStatus = budgetStatusFromUsage ? budgetStatusFromUsage(usageRows, { now }) : new Map();

  /** @type {Array<{provider:string, providerName:string, enabled:boolean, model:string, modelListed:boolean, isFree:boolean, health:{state:string, reliability:number, avgLatencyMs:number, reasons:string[]}, budget:{state:string, reasons:string[]}, key:string, fingerprint:string}>} */
  const rows = [];

  for (const rule of rules) {
    const providerId = String(rule?.providerId ?? rule?.id ?? 'unknown');
    const providerName = String(rule?.providerName ?? providerId);
    const providerEnabled = rule?.enabled !== false;
    const cfg = rule?.config ?? {};
    const modelIds = Array.isArray(cfg?.personalModelIds) ? cfg.personalModelIds : [];
    const access = cfg?.access ?? {};
    const keyFingerprint = fingerprint(access?.apiKey ?? '');

    if (modelIds.length === 0) {
      rows.push({
        provider: providerId, providerName, enabled: providerEnabled, model: '(none listed)',
        modelListed: false, isFree: false,
        health: { state: 'unproven', reliability: 0, avgLatencyMs: 0, reasons: ['no models listed'] },
        budget: { state: 'unverified', reasons: ['no models to assess'] },
        key: `${providerId}/(none)`, fingerprint: keyFingerprint,
      });
      continue;
    }

    for (const modelId of modelIds) {
      const key = `${providerId}/${modelId}`;
      const statsRec = stats.get(key);
      const health = statsRec ? classifyHealth(statsRec) : { state: 'unproven', reliability: 0, avgLatencyMs: 0, reasons: ['no observed usage'] };
      const budget = budgetStatus.get(key) ?? { state: 'unverified', reasons: ['no usage data'] };

      // Price info from config model rules if available
      const modelRule = Array.isArray(cfg?.providerModelRules) ? cfg.providerModelRules.find((r) => String(r?.modelId ?? r?.id) === modelId) : null;
      // A model is free when its id carries the :free suffix (OpenRouter) or -free suffix
      // (opencode-zen convention), or the provider's model rule explicitly marks it free.
      const isFree = /(:free|-free)$/i.test(modelId) || Boolean(modelRule?.config?.properties?.free === true);

      rows.push({
        provider: providerId, providerName, enabled: providerEnabled, model: modelId,
        modelListed: true, isFree,
        health, budget, key, fingerprint: keyFingerprint,
      });
    }
  }

  return rows.sort((a, b) => {
    const pa = a.provider.localeCompare(b.provider);
    if (pa !== 0) return pa;
    return a.model.localeCompare(b.model);
  });
}

/** Render one line per row. */
function renderRow(r) {
  const h = r.health;
  const b = r.budget;
  const enabledTag = r.enabled ? 'EN' : 'DIS';
  const listedTag = r.modelListed ? 'LIST' : 'NOLIST';
  const freeTag = r.isFree ? 'free' : 'paid';
  const healthTag = h.state.toUpperCase().padEnd(16);
  const budgetTag = b.state.toUpperCase().padEnd(9);
  const rel = h.reliability > 0 ? `${(h.reliability * 100).toFixed(0)}%` : '—';
  const lat = h.avgLatencyMs > 0 ? `${(h.avgLatencyMs / 1000).toFixed(1)}s` : '—';
  const reason = h.reasons?.slice(0, 2).join('; ') || b.reasons?.slice(0, 2).join('; ') || '—';
  return `${r.key.padEnd(42)} | ${enabledTag}/${listedTag} ${freeTag.padEnd(5)} | ${healthTag} rel=${rel.padEnd(4)} lat=${lat.padEnd(6)} | budget=${budgetTag} | ${r.fingerprint} | ${reason}`;
}

/** Render the full console. */
function renderConsole(rows) {
  const lines = [];
  lines.push('MULTI-MODEL CONSOL — model health dashboard');
  lines.push('Generated: ' + new Date().toISOString());
  lines.push('');
  lines.push(`${'provider/model'.padEnd(42)} | scope      tier    | health          rel    lat     | budget    | key fingerprint | reason`);
  lines.push(`${'-'.repeat(42)} | ${'-'.repeat(10)} ${'-'.repeat(5)} | ${'-'.repeat(16)} ${'-'.repeat(6)} ${'-'.repeat(7)} | ${'-'.repeat(9)} | ${'-'.repeat(17)} | ${'-'.repeat(20)}`);
  for (const r of rows) lines.push(renderRow(r));
  lines.push('');
  lines.push(`${rows.length} model(s) across ${new Set(rows.map((r) => r.provider)).size} provider(s)`);
  const blocked = rows.filter((r) => r.health.state === 'budget-blocked' || r.health.state === 'capped' || r.health.state === 'broken');
  const healthy = rows.filter((r) => r.health.state === 'healthy');
  lines.push(`healthy: ${healthy.length} · blocked/capped/broken: ${blocked.length}`);
  if (blocked.length > 0) {
    lines.push('');
    lines.push('BLOCKED MODELS (do not fan out lanes onto these):');
    for (const r of blocked) lines.push(`  ${r.key} — ${r.health.reasons?.join('; ') || r.budget.reasons?.join('; ')}`);
  }
  return lines.join('\n');
}

async function main() {
  const { ok, error, rules, raw } = loadProviderRules();
  if (!ok) { process.stderr.write(`console: ${error}\n`); process.exitCode = 1; return; }

  // model_usage lives in the ZCode session store. Read it read-only; a missing or locked
  // DB yields zero rows, which makes health UNPROVEN — never "healthy by default".
  let usageRows = [];
  try {
    const db = new DatabaseSync(USAGE_DB_PATH, { readOnly: true });
    const cutoff = Date.now() - 5 * 60 * 60 * 1000;
    usageRows = db.prepare(
      'SELECT provider_id, model_id, status, started_at, duration_ms, input_tokens, output_tokens, error_type, error_code, error_message FROM model_usage WHERE started_at > ?',
    ).all(cutoff);
    db.close();
  } catch { /* no session store or no model_usage table — health stays unproven */ }

  const now = Date.now();
  const rows = buildRows(rules, usageRows, now);
  process.stdout.write(renderConsole(rows) + '\n');
}

const scriptPath = process.argv[1] ?? '';
if (String(scriptPath).includes('console.mjs')) await main();

export { buildRows, renderConsole, renderRow, loadProviderRules, fingerprint };
