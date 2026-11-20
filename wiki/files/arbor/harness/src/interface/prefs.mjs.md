# File: harness/src/interface/prefs.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | harness/src/interface/prefs.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 5234 B |
| Lines | 111 |
| Hash | 3790454f683f |
| Test | no |
| Generated | no |
| Component | harness |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| TASKS | const | 9 | yes | export const TASKS = Object.freeze([&#39;coding&#39;, &#39;visual&#39;, &#39;research&#39;, &#39;documents&#39;, &#39;data&#39;, &#39;reasoning&#39;, &#39;general&#39;, &#39;quick&#39;, &#39;implementation&#39;, &#39;app-design&#39;, &#39;writing&#39;, &#39;review&#39;, &#39;decision&#39;]); |
| SCOPES | const | 10 | yes | export const SCOPES = Object.freeze([&#39;owner&#39;, &#39;project&#39;]); |
| ID | const | 11 | no | const ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,95}$/; |
| fail | function | 13 | no | function fail(code) { const e = new Error(code); e.code = code; throw e; } |
| createPrefs | function | 15 | yes | export function createPrefs({ dir, now = Date.now } = {}) { |
| rulesFile | const | 17 | no | const rulesFile = join(dir, &#39;routing-rules.json&#39;); |
| learnedFile | const | 18 | no | const learnedFile = join(dir, &#39;routing-learned.json&#39;); |
| readJson | function | 20 | no | async function readJson(file) { |
| writeJson | function | 23 | no | async function writeJson(file, data) { |
| tmp | const | 25 | no | const tmp = `${file}.${randomUUID()}.tmp`; |
| validateRule | function | 30 | no | function validateRule(rule) { |
| scope | const | 36 | no | const scope = rule.scope \|\| &#39;owner&#39;; |
| validateOutcome | function | 42 | no | function validateOutcome(o) { |
| data | const | 53 | no | const data = await readJson(rulesFile); |
| rules | const | 59 | no | const rules = await this.listRules(); |
| idx | const | 60 | no | const idx = rules.findIndex(r =&gt; r.taskClass === record.taskClass &amp;&amp; r.provider === record.provider &amp;&amp; r.scope === record.scope &amp;&amp; r.projectRef === record.projectRef); |
| rules | const | 70 | no | const rules = await this.listRules(); |
| filtered | const | 71 | no | const filtered = rules.filter(r =&gt; !(r.taskClass === taskClass &amp;&amp; r.provider === provider &amp;&amp; r.scope === scope &amp;&amp; r.projectRef === projectRef)); |
| data | const | 78 | no | const data = await readJson(learnedFile); |
| o | const | 82 | no | const o = validateOutcome({ provider, model, taskClass, success }); |
| learned | const | 83 | no | const learned = await this.listLearned(); |
| key | const | 84 | no | const key = `${o.provider}:${o.model}:${o.taskClass}`; |
| idx | const | 85 | no | const idx = learned.findIndex(l =&gt; `${l.provider}:${l.model}:${l.taskClass}` === key); |
| nowMs | const | 86 | no | const nowMs = now(); |
| prev | const | 88 | no | const prev = learned[idx]; |
| n | const | 89 | no | const n = prev.sampleCount + 1; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs/promises | import | 5 | external |
| node:path | import | 6 | external |
| node:crypto | import | 7 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [harness/src/interface/router.mjs](./router.mjs.md) | ./prefs.mjs |
| [harness/test/interface/prefs.test.mjs](../../test/interface/prefs.test.mjs.md) | ../../src/interface/prefs.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Owner routing preferences: explicit owner rules + learned usage signals.
// Persisted to JSON files under the harness dir. Never sends, never touches a browser.
// Feeds the intelligent-model-router (Q21/Q22) so auto-routing a user prompt
// uses verified readiness, explicit owner rules, and learned local signals.
import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { randomUUID } from 'node:crypto';

export const TASKS = Object.freeze(['coding', 'visual', 'research', 'documents', 'data', 'reasoning', 'general', 'quick', 'implementation', 'app-design', 'writing', 'review', 'decision']);
export const SCOPES = Object.freeze(['owner', 'project']);
const ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,95}$/;

function fail(code) { const e = new Error(code); e.code = code; throw e; }

export function createPrefs({ dir, now = Date.now } = {}) {
  if (typeof dir !== 'string' || !dir) throw new TypeError('dir is required');
  const rulesFile = join(dir, 'routing-rules.json');
  const learnedFile = join(dir, 'routing-learned.json');

  async function readJson(file) {
    try { return JSON.parse(await readFile(file, 'utf8')); } catch { return null; }
  }
  async function writeJson(file, data) {
    await mkdir(dirname(file), { recursive: true });
    const tmp = `${file}.${randomUUID()}.tmp`;
    await writeFile(tmp, JSON.stringify(data, null, 2));
    await rename(tmp, file);
  }

  function validateRule(rule) {
    if (!rule || typeof rule !== 'object') fail('PREFS_RULE_INVALID');
    if (!TASKS.includes(rule.taskClass)) fail('PREFS_TASK_INVALID');
    if (!ID.test(rule.provider ?? '')) fail('PREFS_PROVIDER_INVALID');
    if (rule.model !== undefined && !ID.test(rule.model)) fail('PREFS_MODEL_INVALID');
    if (rule.effort !== undefined && !ID.test(rule.effort)) fail('PREFS_EFFORT_INVALID');
    const scope = rule.scope || 'owner';
    if (!SCOPES.includes(scope)) fail('PREFS_SCOPE_INVALID');
    if (scope === 'project' && (typeof rule.projectRef !== 'string' || !rule.projectRef || rule.projectRef.length > 160)) fail('PREFS_PROJECT_INVALID');
    return { ...rule, scope, projectRef: scope === 'project' ? rule.projectRef : null };
  }

  function validateOutcome(o) {
    if (!ID.test(o.provider ?? '')) fail('PREFS_PROVIDER_INVALID');
    if (!ID.test(o.model ?? '')) fail('PREFS_MODEL_INVALID');
    if (!TASKS.includes(o.taskClass)) fail('PREFS_TASK_INVALID');
    if (typeof o.success !== 'boolean') fail('PREFS_OUTCOME_INVALID');
    return o;
  }

  return {
    // ---- Owner rules -------------------------------------------------
    async listRules() {
      const data = await readJson(rulesFile);
      return Array.isArray(data) ? data : [];
    },
    async saveRule(rule) {
      const record = validateRule(rule);
      record.updatedAt = now();
      const rules = await this.listRules();
      const idx = rules.findIndex(r =>
        r.taskClass === record.taskClass &&
        r.provider === record.provider &&
        r.scope === record.scope &&
        r.projectRef === record.projectRef);
      if (idx >= 0) { rules[idx] = record; } else { rules.push({ ...record, createdAt: now() }); }
      await writeJson(rulesFile, rules);
      return idx >= 0 ? rules[idx] : { ...record, createdAt: now() };
    },
    async removeRule(taskClass, provider, scope = 'owner', projectRef = null) {
      const rules = await this.listRules();
      const filtered = rules.filter(r => !(r.taskClass === taskClass && r.provider === provider && r.scope === scope && r.projectRef === projectRef));
      await writeJson(rulesFile, filtered);
      return filtered.length !== rules.length;
    },

    // ---- Learned usage signals ---------------------------------------
    async listLearned() {
      const data = await readJson(learnedFile);
      return Array.isArray(data) ? data : [];
    },
```

_First 80 of 112 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
