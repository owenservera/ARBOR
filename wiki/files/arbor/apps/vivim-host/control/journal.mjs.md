# File: apps/vivim-host/control/journal.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/control/journal.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 5089 B |
| Lines | 86 |
| Hash | 0fe8cf51c9f1 |
| Test | no |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| JOURNAL_SCHEMA | const | 12 | yes | export const JOURNAL_SCHEMA = &#39;vivim.control-journal/1&#39;; |
| PLAN_ID | const | 13 | no | const PLAN_ID = /^ctl-[a-f0-9]{16}$/; |
| fail | function | 14 | no | const fail = code =&gt; Object.assign(new Error(code), { code }); |
| newPlanId | function | 16 | yes | export function newPlanId() { return &#39;ctl-&#39; + randomBytes(8).toString(&#39;hex&#39;); } |
| createControlJournal | function | 18 | yes | export function createControlJournal({ dataRoot }) { |
| dir | const | 20 | no | const dir = path.join(dataRoot, &#39;control&#39;, &#39;plans&#39;); |
| eventsFile | const | 21 | no | const eventsFile = path.join(dataRoot, &#39;control&#39;, &#39;events.jsonl&#39;); |
| file | function | 22 | no | const file = (id, suffix) =&gt; { if (!PLAN_ID.test(id ?? &#39;&#39;)) throw fail(&#39;CONTROL_PLAN_ID&#39;); return path.join(dir, `${id}.${suffix}`); }; |
| ensure | function | 23 | no | const ensure = () =&gt; mkdirSync(dir, { recursive: true, mode: 0o700 }); |
| createExclusive | function | 25 | no | function createExclusive(target, body) { |
| temp | const | 27 | no | const temp = `${target}.${process.pid}.${randomBytes(6).toString(&#39;hex&#39;)}.tmp`; |
| readJson | function | 33 | no | const readJson = target =&gt; { try { return JSON.parse(readFileSync(target, &#39;utf8&#39;)); } catch (e) { if (e.code === &#39;ENOENT&#39;) return null; throw e; } }; |
| event | function | 34 | no | function event(kind, id, data = {}) { |
| get | function | 38 | no | function get(id) { |
| plan | const | 39 | no | const plan = readJson(file(id, &#39;plan.json&#39;)); |
| approval | const | 41 | no | const approval = readJson(file(id, &#39;approved.json&#39;)); |
| claimed | const | 42 | no | const claimed = existsSync(file(id, &#39;claimed&#39;)); |
| receipt | const | 43 | no | const receipt = readJson(file(id, &#39;receipt.json&#39;)); |
| state | const | 44 | no | const state = receipt ? receipt.status : claimed ? &#39;uncertain&#39; : approval ? &#39;approved&#39; : &#39;planned&#39;; |
| created | const | 56 | no | const created = createExclusive(file(id, &#39;approved.json&#39;), JSON.stringify(approval)); |
| stored | const | 57 | no | const stored = created ? approval : readJson(file(id, &#39;approved.json&#39;)); |
| ids | const | 80 | no | const ids = readdirSync(dir).filter(f =&gt; f.endsWith(&#39;.plan.json&#39;)).map(f =&gt; f.slice(0, -&#39;.plan.json&#39;.length)).filter(id =&gt; PLAN_ID.test(id)); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 8 | external |
| node:crypto | import | 9 | external |
| node:path | import | 10 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [apps/vivim-host/control/dispatcher.mjs](./dispatcher.mjs.md) | ./journal.mjs |
| [studio/src/studio/world-service.mjs](../../../studio/src/studio/world-service.mjs.md) | ../../../apps/vivim-host/control/journal.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
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
```

_First 80 of 87 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
