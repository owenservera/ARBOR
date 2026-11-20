# File: studio/src/studio/world-control-lineage.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/studio/world-control-lineage.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 5142 B |
| Lines | 96 |
| Hash | a4dbb4b273f9 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| CONTROL_LINEAGE_SCHEMA | const | 6 | yes | export const CONTROL_LINEAGE_SCHEMA = &#39;vivim.world-control-lineage/1&#39;; |
| ID | const | 7 | no | const ID = /^[a-z][a-z0-9._:-]{0,127}$/; |
| PLAN | const | 8 | no | const PLAN = /^ctl-[a-f0-9]{16}$/; |
| RISK | const | 9 | no | const RISK = new Set([&#39;R0&#39;,&#39;R1&#39;,&#39;R2&#39;,&#39;R3&#39;]); |
| STATES | const | 10 | no | const STATES = new Set([&#39;planned&#39;,&#39;approved&#39;,&#39;uncertain&#39;,&#39;applied&#39;,&#39;failed&#39;]); |
| RULE_STATES | const | 11 | no | const RULE_STATES = new Set([&#39;proposed&#39;,&#39;accepted&#39;,&#39;suspended&#39;,&#39;revoked&#39;]); |
| nodeId | function | 12 | no | const nodeId = (type, id) =&gt; &#39;cl-&#39; + createHash(&#39;sha256&#39;).update(type + &#39;\\0&#39; + id).digest(&#39;hex&#39;).slice(0,40); |
| invalid | function | 13 | no | const invalid = code =&gt; Object.assign(new Error(code), { code }); |
| projectControlLineageSnapshot | function | 24 | yes | export function projectControlLineageSnapshot({plans=[], rules=[], journalAvailable=true, rulesAvailable=true, journalTruncated=false, rulesTruncated=false}={}) { |
| RECEIPT_STATES | const | 28 | no | const RECEIPT_STATES = new Set([&#39;applied&#39;,&#39;failed&#39;]); |
| nodes | const | 29 | no | const nodes = new Map(), edges = new Map(); |
| node | function | 30 | no | function node(kind, sourceId, attributes) { |
| id | const | 31 | no | const id = nodeId(kind,sourceId); |
| existing | const | 32 | no | const existing=nodes.get(id); |
| edge | function | 38 | no | function edge(from,to,kind) { |
| key | const | 39 | no | const key=from+&#39;\\0&#39;+kind+&#39;\\0&#39;+to; |
| seenPlans | const | 42 | no | const seenPlans=new Set(),seenRules=new Set(); |
| receipt | variable | 52 | no | let receipt=null; |
| program | const | 60 | no | const program=node(&#39;control-plan&#39;,p.planId,{ state:p.state,risk:p.risk,origin:&#39;host-control-journal&#39;, executionVerified:false,owner:&#39;host-control&#39;, receipt, createdAt:p.createdAt??null, |
| action | const | 66 | no | const action=node(&#39;control-action&#39;,p.actionId,{ owner:&#39;host-control&#39;,origin:&#39;host-action-catalog&#39;,executionVerified:false, }); |
| rule | const | 77 | no | const rule=node(&#39;personal-command-rule&#39;,r.id,{ owner:&#39;host-control&#39;,origin:&#39;host-personal-rule-store&#39;, state:r.state,revision:r.revision, authority:&#39;interpretation_only&#39;,executionVerified:false, }); |
| action | const | 82 | no | const action=node(&#39;control-action&#39;,r.actionId,{ owner:&#39;host-control&#39;,origin:&#39;host-action-catalog&#39;,executionVerified:false, }); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 4 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/src/studio/world-service.mjs](./world-service.mjs.md) | ./world-control-lineage.mjs |
| [studio/test/unit/consolidate-studio-src.test.mjs](../../test/unit/consolidate-studio-src.test.mjs.md) | ../../src/studio/world-control-lineage.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
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
```

_First 80 of 97 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
