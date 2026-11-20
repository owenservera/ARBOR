# File: apps/vivim-host/control/personal-rule-store.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/control/personal-rule-store.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 10075 B |
| Lines | 177 |
| Hash | 937294527225 |
| Test | no |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| PERSONAL_STORE_SCHEMA | const | 9 | yes | export const PERSONAL_STORE_SCHEMA = &#39;vivim.personal-semantic-store/1&#39;; |
| MAX_RULES | const | 10 | no | const MAX_RULES = 500, MAX_HISTORY = 500; |
| fail | function | 11 | no | const fail = code =&gt; Object.assign(new Error(code), { code }); |
| digest | function | 12 | no | const digest = value =&gt; createHash(&#39;sha256&#39;).update(JSON.stringify(value)).digest(&#39;hex&#39;); |
| blank | function | 13 | no | const blank = () =&gt; ({ schema: PERSONAL_STORE_SCHEMA, version: 0, entries: [], history: [] }); |
| states | const | 14 | no | const states = Object.freeze({ proposed: [&#39;accepted&#39;, &#39;revoked&#39;], accepted: [&#39;suspended&#39;, &#39;revoked&#39;], suspended: [&#39;accepted&#39;, &#39;revoked&#39;], revoked: [], |
| validData | function | 20 | no | function validData(data, catalog) { |
| resultShape | function | 31 | no | const resultShape = (s, rule) =&gt; ({ schema: PERSONAL_STORE_SCHEMA, version: s.version, ruleId: rule.id, ruleRevision: rule.revision, state: rule.state, digest: digest(rule), }); |
| createPersonalRuleStore | function | 35 | yes | export function createPersonalRuleStore({ dataRoot, catalog, verifyOwnerApproval = () =&gt; false, now = () =&gt; new Date().toISOString(), } = {}) { |
| dir | const | 42 | no | const dir = path.join(dataRoot, &#39;control&#39;); |
| file | const | 43 | no | const file = path.join(dir, &#39;personal-semantics.json&#39;); |
| read | function | 44 | no | function read() { |
| value | variable | 45 | no | let value; |
| locked | function | 51 | no | function locked(mutator, expectedVersion) { |
| lockFile | const | 54 | no | const lockFile = file + &#39;.lock&#39;; |
| tempLock | const | 55 | no | const tempLock = lockFile + &#39;.&#39; + process.pid + &#39;.&#39; + randomBytes(6).toString(&#39;hex&#39;) + &#39;.tmp&#39;; |
| acquired | variable | 57 | no | let acquired = false; |
| current | const | 61 | no | const current = read(); |
| next | const | 63 | no | const next = mutator(current); |
| temp | const | 66 | no | const temp = file + &#39;.&#39; + process.pid + &#39;.&#39; + randomBytes(6).toString(&#39;hex&#39;) + &#39;.tmp&#39;; |
| propose | function | 86 | no | function propose({ phrase, actionId, args = {}, scope = {}, source = &#39;explicit-owner&#39;, expectedVersion } = {}) { |
| candidate | const | 88 | no | const candidate = { schema: PERSONAL_RULE_SCHEMA, |
| created | variable | 92 | no | let created; |
| next | const | 93 | no | const next = locked(current =&gt; { if (current.entries.length &gt;= MAX_RULES) throw fail(&#39;PERSONAL_STORE_FULL&#39;); created = candidate; return record(current, created, &#39;propose&#39;, null); }, expectedVersion); |
| remember | function | 102 | no | function remember({subject,approval}={}) { |
| changed | variable | 103 | no | let changed; |
| next | const | 104 | no | const next=locked(current=&gt;{ if(subject?.operation!==&#39;remember&#39;\|\|subject.catalogVersion!==catalog.version\|\| subject.storeDigest!==digest(current.entries))throw fail(&#39;PERSONAL_STORE_STALE&#39;); const can… |
| candidate | const | 107 | no | const candidate=subject.rule; |
| key | function | 108 | no | const key=value=&gt;value.normalize(&#39;NFKC&#39;).trim().replace(/\\s+/g,&#39; &#39;).toLowerCase(); |
| trial | const | 109 | no | const trial={schema:PERSONAL_RULE_SCHEMA,id:&#39;rule:validation&#39;,revision:1, |
| matches | const | 112 | no | const matches=current.entries.filter(r=&gt;r.state===&#39;accepted&#39;&amp;&amp;key(r.phrase)===key(candidate.phrase)&amp;&amp; digest(r.scope)===digest(candidate.scope)); |
| old | const | 115 | no | const old=matches[0]??null; |
| transition | function | 126 | no | function transition({ ruleId, nextState, expectedVersion, approval } = {}) { |
| changed | variable | 129 | no | let changed; |
| next | const | 130 | no | const next = locked(current =&gt; { const old = current.entries.find(r =&gt; r.id === ruleId); if (!old) throw fail(&#39;PERSONAL_STORE_UNKNOWN_RULE&#39;); if (!states[old.state]?.includes(nextState)) throw fail(&#39;… |
| old | const | 131 | no | const old = current.entries.find(r =&gt; r.id === ruleId); |
| approvalSubject | const | 136 | no | const approvalSubject = { ruleId, ruleDigest: digest(old), nextState, |
| rollback | function | 147 | no | function rollback({ ruleId, toRevision, expectedVersion, approval } = {}) { |
| changed | variable | 148 | no | let changed; |
| next | const | 149 | no | const next = locked(current =&gt; { const old = current.entries.find(r =&gt; r.id === ruleId); if (!old) throw fail(&#39;PERSONAL_STORE_UNKNOWN_RULE&#39;); const past = [...current.history].reverse().find(h =&gt; h.r… |
| old | const | 150 | no | const old = current.entries.find(r =&gt; r.id === ruleId); |
| past | const | 152 | no | const past = [...current.history].reverse().find(h =&gt; h.ruleId === ruleId &amp;&amp; h.after?.revision === toRevision)?.after; |
| approvalSubject | const | 156 | no | const approvalSubject = { ruleId, ruleDigest: digest(old), nextState: past.state, |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 4 | external |
| node:crypto | import | 5 | external |
| node:path | import | 6 | external |
| ./personal-semantics.mjs | import | 7 | [apps/vivim-host/control/personal-semantics.mjs](./personal-semantics.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [apps/vivim-host/control/dispatcher.mjs](./dispatcher.mjs.md) | ./personal-rule-store.mjs |
| [apps/vivim-host/test/personal-rule-store.test.mjs](../test/personal-rule-store.test.mjs.md) | ../control/personal-rule-store.mjs |
| [apps/vivim-host/test/personal-semantic-host.test.mjs](../test/personal-semantic-host.test.mjs.md) | ../control/personal-rule-store.mjs |
| [studio/src/studio/world-service.mjs](../../../studio/src/studio/world-service.mjs.md) | ../../../apps/vivim-host/control/personal-rule-store.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Local-first personal command-rule state. Separate from Host effect authority:
// proposals are inert and acceptance REQUIRES a trusted owner-approval verifier.
// A receipt-shaped object is not sufficient. Never wire an AI/web request as verifier.
import { mkdirSync, readFileSync, renameSync, writeFileSync, linkSync, unlinkSync } from 'node:fs';
import { randomBytes, createHash } from 'node:crypto';
import path from 'node:path';
import { PERSONAL_RULE_SCHEMA, validatePersonalRule } from './personal-semantics.mjs';

export const PERSONAL_STORE_SCHEMA = 'vivim.personal-semantic-store/1';
const MAX_RULES = 500, MAX_HISTORY = 500;
const fail = code => Object.assign(new Error(code), { code });
const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const blank = () => ({ schema: PERSONAL_STORE_SCHEMA, version: 0, entries: [], history: [] });
const states = Object.freeze({
  proposed: ['accepted', 'revoked'],
  accepted: ['suspended', 'revoked'],
  suspended: ['accepted', 'revoked'],
  revoked: [],
});
function validData(data, catalog) {
  if (!data || data.schema !== PERSONAL_STORE_SCHEMA ||
    !Number.isSafeInteger(data.version) || data.version < 0 ||
    !Array.isArray(data.entries) || data.entries.length > MAX_RULES ||
    !Array.isArray(data.history) || data.history.length > MAX_HISTORY ||
    new Set(data.entries.map(x => x.id)).size !== data.entries.length ||
    data.entries.some(x => !validatePersonalRule(x, catalog).ok) ||
    data.history.some(h => !h || typeof h !== 'object' || typeof h.ruleId !== 'string' ||
      typeof h.at !== 'string' || !Number.isSafeInteger(h.version))) return false;
  return true;
}
const resultShape = (s, rule) => ({
  schema: PERSONAL_STORE_SCHEMA, version: s.version, ruleId: rule.id,
  ruleRevision: rule.revision, state: rule.state, digest: digest(rule),
});
export function createPersonalRuleStore({
  dataRoot, catalog, verifyOwnerApproval = () => false,
  now = () => new Date().toISOString(),
} = {}) {
  if (typeof dataRoot !== 'string' || !dataRoot || !catalog || !Array.isArray(catalog.actions) ||
    typeof verifyOwnerApproval !== 'function' || typeof now !== 'function')
    throw fail('PERSONAL_STORE_INVALID_SETUP');
  const dir = path.join(dataRoot, 'control');
  const file = path.join(dir, 'personal-semantics.json');
  function read() {
    let value;
    try { value = JSON.parse(readFileSync(file, 'utf8')); }
    catch (e) { if (e.code === 'ENOENT') return blank(); throw fail('PERSONAL_STORE_CORRUPT'); }
    if (!validData(value, catalog)) throw fail('PERSONAL_STORE_CORRUPT');
    return value;
  }
  function locked(mutator, expectedVersion) {
    if (!Number.isSafeInteger(expectedVersion) || expectedVersion < 0) throw fail('PERSONAL_STORE_VERSION_REQUIRED');
    mkdirSync(dir, { recursive: true, mode: 0o700 });
    const lockFile = file + '.lock';
    const tempLock = lockFile + '.' + process.pid + '.' + randomBytes(6).toString('hex') + '.tmp';
    writeFileSync(tempLock, '', { mode: 0o600 });
    let acquired = false;
    try {
      try { linkSync(tempLock, lockFile); acquired = true; }
      catch (e) { if (e.code === 'EEXIST') throw fail('PERSONAL_STORE_BUSY'); throw e; }
      const current = read();
      if (current.version !== expectedVersion) throw fail('PERSONAL_STORE_STALE');
      const next = mutator(current);
      if (!validData(next, catalog) || next.version !== current.version + 1)
        throw fail('PERSONAL_STORE_INVALID_TRANSITION');
      const temp = file + '.' + process.pid + '.' + randomBytes(6).toString('hex') + '.tmp';
      try {
        writeFileSync(temp, JSON.stringify(next, null, 2), { mode: 0o600 });
        renameSync(temp, file);
      } finally { try { unlinkSync(temp); } catch {} }
      return next;
    } finally {
      try { unlinkSync(tempLock); } catch {}
      if (acquired) { try { unlinkSync(lockFile); } catch {} }
    }
  }
  function record(current, rule, op, previous, ownerReceiptId = null) {
    return {
      ...current, version: current.version + 1,
      entries: [...current.entries.filter(x => x.id !== rule.id), rule].sort((a,b) => a.id.localeCompare(b.id)),
```

_First 80 of 178 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
