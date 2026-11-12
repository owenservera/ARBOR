// Durable control journal (UTC03). Journal-before-effect, send-once semantics for local actions.
//   <id>.plan.json      exclusive create — the exact typed plan + digest the owner sees
//   <id>.approved.json  exclusive create — owner decision bound to that digest
//   <id>.claimed        exclusive create — THE effect fence: once present, never re-executed
//   <id>.receipt.json   exclusive create — observed outcome (applied | failed)
// A claim without a receipt is `uncertain` (crash mid-effect) and is surfaced, never retried.
// events.jsonl is an append-only audit trail of every transition (no secrets, no tokens).
import { appendFileSync, mkdirSync, readFileSync, writeFileSync, linkSync, unlinkSync, existsSync, readdirSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import path from 'node:path';

export const JOURNAL_SCHEMA = 'vivim.control-journal/1';
const PLAN_ID = /^ctl-[a-f0-9]{16}$/;
const fail = code => Object.assign(new Error(code), { code });

export function newPlanId() { return 'ctl-' + randomBytes(8).toString('hex'); }

export function createControlJournal({ dataRoot }) {
  if (typeof dataRoot !== 'string' || !dataRoot) throw fail('CONTROL_JOURNAL_ROOT');
  const dir = path.join(dataRoot, 'control', 'plans');
  const eventsFile = path.join(dataRoot, 'control', 'events.jsonl');
  const file = (id, suffix) => { if (!PLAN_ID.test(id ?? '')) throw fail('CONTROL_PLAN_ID'); return path.join(dir, `${id}.${suffix}`); };
  const ensure = () => mkdirSync(dir, { recursive: true, mode: 0o700 });
  // Publish complete contents under an exclusive name (hard link fails with EEXIST).
  function createExclusive(target, body) {
    ensure();
    const temp = `${target}.${process.pid}.${randomBytes(6).toString('hex')}.tmp`;
    writeFileSync(temp, body, { mode: 0o600 });
    try { linkSync(temp, target); return true; }
    catch (e) { if (e.code === 'EEXIST') return false; throw e; }
    finally { try { unlinkSync(temp); } catch { /* already gone */ } }
  }
  const readJson = target => { try { return JSON.parse(readFileSync(target, 'utf8')); } catch (e) { if (e.code === 'ENOENT') return null; throw e; } };
  function event(kind, id, data = {}) {
    ensure();
    appendFileSync(eventsFile, JSON.stringify({ schema: JOURNAL_SCHEMA, kind, planId: id, at: new Date().toISOString(), ...data }) + '\n', { mode: 0o600 });
  }
  function get(id) {
    const plan = readJson(file(id, 'plan.json'));
    if (!plan) return null;
    const approval = readJson(file(id, 'approved.json'));
    const claimed = existsSync(file(id, 'claimed'));
    const receipt = readJson(file(id, 'receipt.json'));
    const state = receipt ? receipt.status : claimed ? 'uncertain' : approval ? 'approved' : 'planned';
    return { plan, approval, claimed, receipt, state };
  }
  return {
    schema: JOURNAL_SCHEMA, dir,
    record(plan) {
      if (!createExclusive(file(plan.planId, 'plan.json'), JSON.stringify(plan))) throw fail('CONTROL_PLAN_EXISTS');
      event('planned', plan.planId, { actionId: plan.actionId, risk: plan.risk, planDigest: plan.planDigest, source: plan.source, origin: plan.origin });
      return plan;
    },
    get,
    approve(id, approval) {
      const created = createExclusive(file(id, 'approved.json'), JSON.stringify(approval));
      const stored = created ? approval : readJson(file(id, 'approved.json'));
      if (!stored) throw fail('CONTROL_APPROVAL_MISSING');
      if (stored.planDigest !== approval.planDigest) throw fail('CONTROL_APPROVAL_CONFLICT');
      if (!created && (stored.channel !== approval.channel || stored.actor !== approval.actor))
        throw fail('CONTROL_APPROVAL_CONFLICT');
      if (created) event('approved', id, { channel: approval.channel, planDigest: approval.planDigest });
      return stored;
    },
    /** The single effect fence. Returns false if anyone ever claimed this plan before. */
    claim(id) {
      ensure();
      try { writeFileSync(file(id, 'claimed'), new Date().toISOString(), { flag: 'wx', mode: 0o600 }); }
      catch (e) { if (e.code === 'EEXIST') return false; throw e; }
      event('claimed', id);
      return true;
    },
    finish(id, receipt) {
      if (!createExclusive(file(id, 'receipt.json'), JSON.stringify(receipt))) throw fail('CONTROL_RECEIPT_EXISTS');
      event(receipt.status, id, { actionId: receipt.actionId, ...(receipt.error ? { code: receipt.error.code } : {}) });
      return receipt;
    },
    recent(limit = 20) {
      if (!existsSync(dir)) return [];
      const ids = readdirSync(dir).filter(f => f.endsWith('.plan.json')).map(f => f.slice(0, -'.plan.json'.length)).filter(id => PLAN_ID.test(id));
      return ids.map(get).filter(Boolean).sort((a, b) => b.plan.createdAt.localeCompare(a.plan.createdAt))
        .slice(0, Math.max(1, Math.min(100, limit)))
        .map(r => ({ planId: r.plan.planId, actionId: r.plan.actionId, risk: r.plan.risk, state: r.state, createdAt: r.plan.createdAt, source: r.plan.source }));
    },
  };
}
