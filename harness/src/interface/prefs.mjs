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
    async recordOutcome({ provider, model, taskClass, success }) {
      const o = validateOutcome({ provider, model, taskClass, success });
      const learned = await this.listLearned();
      const key = `${o.provider}:${o.model}:${o.taskClass}`;
      const idx = learned.findIndex(l => `${l.provider}:${l.model}:${l.taskClass}` === key);
      const nowMs = now();
      if (idx >= 0) {
        const prev = learned[idx];
        const n = prev.sampleCount + 1;
        learned[idx] = {
          ...prev, sampleCount: n,
          successRate: ((prev.successRate * (n - 1)) + (o.success ? 1 : 0)) / n,
          lastAt: nowMs, updatedAt: nowMs
        };
      } else {
        learned.push({ ...o, sampleCount: 1, successRate: o.success ? 1 : 0, lastAt: nowMs, createdAt: nowMs, updatedAt: nowMs });
      }
      await writeJson(learnedFile, learned);
      return learned[idx >= 0 ? idx : learned.length - 1];
    },

    // ---- Combined input for the intelligent router -------------------
    async routerInputs() {
      const [rules, learned] = await Promise.all([this.listRules(), this.listLearned()]);
      return {
        ownerRules: rules.filter(r => r.enabled !== false),
        learned
      };
    }
  };
}
