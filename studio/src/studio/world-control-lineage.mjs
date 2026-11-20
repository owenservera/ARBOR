// Read-only, metadata-only projection of existing Host-owned command state.
// No graph database, persistence, permissions, commands, browser effects or AI sends.
// The caller supplies snapshots already read from canonical Host stores.
import { createHash } from 'node:crypto';

export const CONTROL_LINEAGE_SCHEMA = 'vivim.world-control-lineage/1';
const ID = /^[a-z][a-z0-9._:-]{0,127}$/;
const PLAN = /^ctl-[a-f0-9]{16}$/;
const RISK = new Set(['R0','R1','R2','R3']);
const STATES = new Set(['planned','approved','uncertain','applied','failed']);
const RULE_STATES = new Set(['proposed','accepted','suspended','revoked']);
const nodeId = (type, id) => 'cl-' + createHash('sha256').update(type + '\0' + id).digest('hex').slice(0,40);
const invalid = code => Object.assign(new Error(code), { code });

/**
 * Project Host journal and personal rule *metadata* into the existing Personal
 * World graph. Phrases, arguments, user contents, tokens and approval bodies
 * are never copied. IDs are intentionally scoped/hashed; this is a read-model.
 * Receipt references are EXACT (the Host journal stores one receipt per plan,
 * named by the plan id, with status applied|failed) and never become an
 * execution claim: executionVerified stays false on every node.
 * Reader freshness and authentication remain the trusted Host's responsibility.
 */
export function projectControlLineageSnapshot({plans=[], rules=[], journalAvailable=true,
  rulesAvailable=true, journalTruncated=false, rulesTruncated=false}={}) {
  if (!Array.isArray(plans) || !Array.isArray(rules) || plans.length>100 || rules.length>500)
    throw invalid('CONTROL_LINEAGE_BOUNDS');
  const RECEIPT_STATES = new Set(['applied','failed']);
  const nodes = new Map(), edges = new Map();
  function node(kind, sourceId, attributes) {
    const id = nodeId(kind,sourceId);
    const existing=nodes.get(id);
    if (existing && JSON.stringify(existing)!==JSON.stringify({id,kind,...attributes}))
      throw invalid('CONTROL_LINEAGE_ID_COLLISION');
    nodes.set(id,{id,kind,...attributes});
    return id;
  }
  function edge(from,to,kind) {
    const key=from+'\0'+kind+'\0'+to;
    edges.set(key,{from,to,kind,provenance:'local-host-source-read'});
  }
  const seenPlans=new Set(),seenRules=new Set();
  for (const p of plans) {
    if (!p || !PLAN.test(p.planId) || !ID.test(p.actionId) ||
      !RISK.has(p.risk) || !STATES.has(p.state) ||
      typeof p.source!=='string' || p.source.length>64 ||
      (p.createdAt!=null && (typeof p.createdAt!=='string'||!Number.isFinite(Date.parse(p.createdAt)))) ||
      seenPlans.has(p.planId)) throw invalid('CONTROL_LINEAGE_BAD_PLAN');
    // Canonical receipt reference: the Host journal's state IS the receipt status whenever a
    // receipt exists (journal get(): state = receipt ? receipt.status : ...), and the receipt
    // file is named by the plan id. An explicitly supplied receipt must match that exactly.
    let receipt=null;
    if (p.receipt!=null) {
      if (typeof p.receipt!=='object' || Array.isArray(p.receipt) || p.receipt.id!==p.planId
        || !RECEIPT_STATES.has(p.receipt.status) || p.receipt.status!==p.state)
        throw invalid('CONTROL_LINEAGE_BAD_PLAN');
      receipt={id:p.receipt.id,status:p.receipt.status};
    } else if (RECEIPT_STATES.has(p.state)) receipt={id:p.planId,status:p.state};
    seenPlans.add(p.planId);
    const program=node('control-plan',p.planId,{
      state:p.state,risk:p.risk,origin:'host-control-journal',
      executionVerified:false,owner:'host-control',
      receipt,
      createdAt:p.createdAt??null,
    });
    const action=node('control-action',p.actionId,{
      owner:'host-control',origin:'host-action-catalog',executionVerified:false,
    });
    edge(program,action,'proposes_action');
  }
  for (const r of rules) {
    if (!r || typeof r.id!=='string' || !ID.test(r.id) ||
      !ID.test(r.actionId) || !RULE_STATES.has(r.state) ||
      !Number.isSafeInteger(r.revision) || r.revision<1 ||
      seenRules.has(r.id)) throw invalid('CONTROL_LINEAGE_BAD_RULE');
    seenRules.add(r.id);
    const rule=node('personal-command-rule',r.id,{
      owner:'host-control',origin:'host-personal-rule-store',
      state:r.state,revision:r.revision,
      authority:'interpretation_only',executionVerified:false,
    });
    const action=node('control-action',r.actionId,{
      owner:'host-control',origin:'host-action-catalog',executionVerified:false,
    });
    edge(rule,action,'suggests_action');
  }
  return Object.freeze({
    schema:CONTROL_LINEAGE_SCHEMA,
    nodes:[...nodes.values()].sort((a,b)=>a.id.localeCompare(b.id)),
    edges:[...edges.values()].sort((a,b)=>a.from.localeCompare(b.from)||a.kind.localeCompare(b.kind)||a.to.localeCompare(b.to)),
    complete:journalAvailable && rulesAvailable && !journalTruncated && !rulesTruncated,
    sourceAvailability:{hostJournal:journalAvailable?'read':'unavailable',
      personalSemantics:rulesAvailable?'read':'unavailable'},
    authority:'read-only-projection',effectsAuthorized:false,
  });
}
