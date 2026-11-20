# File: hq/lib/zcode-doctor.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/lib/zcode-doctor.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 18629 B |
| Lines | 378 |
| Hash | 82ac27f37bfe |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| VALID_CONFIG_KEYS | const | 21 | yes | export const VALID_CONFIG_KEYS = Object.freeze([ &#39;group&#39;, &#39;access&#39;, &#39;api&#39;, &#39;personalModelIds&#39;, &#39;modelOrder&#39;, &#39;modelConfigRules&#39;, &#39;defaultModelSelection&#39;, ]); |
| VALID_RULE_KEYS | const | 26 | yes | export const VALID_RULE_KEYS = Object.freeze([&#39;providerId&#39;, &#39;templateId&#39;, &#39;providerName&#39;, &#39;config&#39;, &#39;enabled&#39;]); |
| MISPLACED_KEYS | const | 29 | yes | export const MISPLACED_KEYS = Object.freeze({ enabled: &#39;the rule level, beside `providerId` — `enabled` is the provider execution gate&#39;, visibility: &#39;the rule level, beside `providerId` — visibility … |
| validateProviderConfig | function | 41 | yes | export function validateProviderConfig(doc) { |
| problems | const | 42 | no | const problems = []; |
| providers | const | 43 | no | const providers = []; |
| config | const | 50 | no | const config = doc.config; |
| rules | const | 54 | no | const rules = config.providerConfigRules?.providerRules; |
| modelRules | const | 58 | no | const modelRules = config.modelConfigRules; |
| pid | const | 64 | no | const pid = rule?.providerId \|\| `rules[${i}]`; |
| path | const | 65 | no | const path = `config.providerConfigRules.providerRules[${i}]`; |
| ruleConfig | const | 66 | no | const ruleConfig = rule?.config; |
| isObject | const | 67 | no | const isObject = ruleConfig &amp;&amp; typeof ruleConfig === &#39;object&#39; &amp;&amp; !Array.isArray(ruleConfig); |
| models | const | 97 | no | const models = ruleConfig.personalModelIds \|\| ruleConfig.modelOrder \|\| []; |
| inheritsTemplate | const | 100 | no | const inheritsTemplate = Boolean(rule.templateId); |
| fatal | const | 116 | no | const fatal = problems.some((p) =&gt; p.fatal); |
| providerReadiness | function | 133 | yes | export function providerReadiness(doc, opts = {}) { |
| health | const | 135 | no | const health = opts.health instanceof Map ? opts.health : new Map(); |
| usable | const | 136 | no | const usable = []; |
| unusable | const | 137 | no | const unusable = []; |
| declaredModels | function | 140 | no | const declaredModels = (providerId) =&gt; { |
| rules | const | 141 | no | const rules = doc?.config?.providerConfigRules?.providerRules; |
| rule | const | 143 | no | const rule = rules.find((x) =&gt; x &amp;&amp; x.providerId === providerId); |
| ruleConfig | const | 144 | no | const ruleConfig = rule?.config; |
| ids | const | 146 | no | const ids = Array.isArray(ruleConfig.personalModelIds) ? ruleConfig.personalModelIds |
| entry | const | 152 | no | const entry = { ...p }; |
| blockedBy | const | 154 | no | const blockedBy = []; |
| declared | const | 159 | no | const declared = declaredModels(p.providerId); |
| blockedModels | const | 160 | no | const blockedModels = []; |
| state | const | 163 | no | const state = h?.health?.state; |
| model | const | 165 | no | const model = key.slice(p.providerId.length + 1); |
| featuresDisabledByConfig | function | 196 | yes | export function featuresDisabledByConfig(doc) { |
| rules | const | 197 | no | const rules = doc?.config?.providerConfigRules?.providerRules; |
| disabled | const | 199 | no | const disabled = []; |
| config | const | 202 | no | const config = rule.config; |
| ids | const | 203 | no | const ids = Array.isArray(config?.personalModelIds) ? config.personalModelIds |
| models | const | 206 | no | const models = ids ? ids.map((id) =&gt; String(id)) : []; |
| diffOpenCodeConfig | function | 229 | yes | export function diffOpenCodeConfig(zcodeDoc, opencodeDoc) { |
| zcodeKeys | const | 230 | no | const zcodeKeys = zcodeDoc &amp;&amp; typeof zcodeDoc === &#39;object&#39; ? Object.keys(zcodeDoc) : []; |
| opencodeKeys | const | 231 | no | const opencodeKeys = opencodeDoc &amp;&amp; typeof opencodeDoc === &#39;object&#39; ? Object.keys(opencodeDoc) : []; |
| zcodeSet | const | 232 | no | const zcodeSet = new Set(zcodeKeys); |
| opencodeSet | const | 233 | no | const opencodeSet = new Set(opencodeKeys); |
| zcodeOnly | const | 234 | no | const zcodeOnly = zcodeKeys.filter((k) =&gt; !opencodeSet.has(k)).sort(); |
| opencodeOnly | const | 235 | no | const opencodeOnly = opencodeKeys.filter((k) =&gt; !zcodeSet.has(k)).sort(); |
| shared | const | 236 | no | const shared = zcodeKeys.filter((k) =&gt; opencodeSet.has(k)).sort(); |
| zcodeProviders | const | 238 | no | const zcodeProviders = new Set(); |
| rules | const | 239 | no | const rules = zcodeDoc?.config?.providerConfigRules?.providerRules; |
| opencodeProviders | const | 248 | no | const opencodeProviders = new Set(); |
| map | const | 250 | no | const map = opencodeDoc?.[key]; |
| providerPresence | const | 257 | no | const providerPresence = [...new Set([...zcodeProviders, ...opencodeProviders])].map((pid) =&gt; ({ providerId: pid, inZcode: zcodeProviders.has(pid), inOpenCode: opencodeProviders.has(pid), })); |
| diff | const | 264 | no | const diff = [ |
| auditAgentCompliance | function | 283 | yes | export function auditAgentCompliance(files) { |
| gaps | const | 284 | no | const gaps = []; |
| compliant | variable | 285 | no | let compliant = 0; |
| text | const | 287 | no | const text = String(f.text \|\| &#39;&#39;); |
| issues | const | 288 | no | const issues = []; |
| renderDoctorVerdict | function | 308 | yes | export function renderDoctorVerdict(report) { |
| r | const | 309 | no | const r = report \|\| {}; |
| bits | const | 310 | no | const bits = []; |
| fatal | const | 316 | no | const fatal = Boolean(r.providerConfig?.fatal) \|\| (r.agents?.gaps?.length ?? 0) &gt; 0; |
| renderDoctor | function | 326 | yes | export function renderDoctor(report) { |
| r | const | 327 | no | const r = report \|\| {}; |
| lines | const | 328 | no | const lines = []; |
| blockedModelsText | function | 346 | no | const blockedModelsText = (p) =&gt; (p.blockedModels \|\| []).map((m) =&gt; `${m.model} ${m.state}`).join(&#39;, &#39;); |
| note | const | 348 | no | const note = p.blockedModelKeys?.length ? ` (${p.blockedModelKeys.length} blocked: ${blockedModelsText(p)})` : &#39;&#39;; |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [hq/aii/fixtures/HQ-027-disabled-by-config.mjs](../aii/fixtures/HQ-027-disabled-by-config.mjs.md) | ../../lib/zcode-doctor.mjs |
| [hq/aii/fixtures/HQ-067-zcode-vs-opencode-config.mjs](../aii/fixtures/HQ-067-zcode-vs-opencode-config.mjs.md) | ../../lib/zcode-doctor.mjs |
| [hq/aii/fixtures/HQ-099-self-audit.mjs](../aii/fixtures/HQ-099-self-audit.mjs.md) | ../../lib/zcode-doctor.mjs |
| [hq/bin/hq.mjs](../bin/hq.mjs.md) | ../lib/zcode-doctor.mjs |

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 2 | context | — | — | The COO&#39;s machine doctor: validates ZCode&#39;s provider config and reports every health signal the team needs. |
| 3 | owner | hq-agent | — | hq-agent |
| 4 | task | — | — | team-control |
| 5 | invariant | — | — | read-only; it diagnoses and explains, it never repairs a provider config. |
| 6 | see | — | docs/TEAM-CONTROL.md | docs/TEAM-CONTROL.md |

## Excerpt

```javascript
/**
 * @hq:context The COO's machine doctor: validates ZCode's provider config and reports every health signal the team needs.
 * @hq:owner hq-agent
 * @hq:task team-control
 * @hq:invariant read-only; it diagnoses and explains, it never repairs a provider config.
 * @hq:see docs/TEAM-CONTROL.md
 *
 * Why this exists. On 2026-11-04 a single unrecognized key inside `provider_config.json` made
 * ZCode's Zod schema reject the ENTIRE file. The app logged one warning and silently degraded to
 * an empty in-memory config — every provider vanished from the model picker at once, with no error
 * in the UI. The rule that caused it (`enabled` written inside `config` instead of beside
 * `providerId`) is exactly the kind of mistake this module exists to catch before it costs the
 * owner a restart and a search.
 */


/**
 * Keys ZCode accepts inside a provider rule's `config` object.
 * Anything else fails the whole file with `unrecognized_keys` — ZCode does NOT skip the bad rule.
 */
export const VALID_CONFIG_KEYS = Object.freeze([
  'group', 'access', 'api', 'personalModelIds', 'modelOrder', 'modelConfigRules', 'defaultModelSelection',
]);

/** Keys ZCode accepts at the top level of a provider rule. `enabled` lives here, not in `config`. */
export const VALID_RULE_KEYS = Object.freeze(['providerId', 'templateId', 'providerName', 'config', 'enabled']);

/** Keys that were misplaced inside `config` by mistake, with where they actually belong. */
export const MISPLACED_KEYS = Object.freeze({
  enabled: 'the rule level, beside `providerId` — `enabled` is the provider execution gate',
  visibility: 'the rule level, beside `providerId` — visibility controls the Settings and Selection facades',
});

/**
 * Validate a parsed provider config against the rules ZCode's schema enforces.
 *
 * @param {Object} doc The parsed `provider_config.json`.
 * @returns {{ok: boolean, problems: Array<{path: string, code: string, message: string, fix: string}>,
 *            providers: Array<Object>}}
 */
export function validateProviderConfig(doc) {
  const problems = [];
  const providers = [];
  if (!doc || typeof doc !== 'object') {
    return { ok: false, problems: [{ path: '', code: 'invalid_document', message: 'the provider config is not an object', fix: 'restore the last known-good provider_config.json' }], providers };
  }
  if (doc.schemaVersion !== 1) {
    problems.push({ path: 'schemaVersion', code: 'unsupported_schema', message: `schemaVersion is ${JSON.stringify(doc.schemaVersion)}, expected 1`, fix: 'restore a provider_config.json whose schemaVersion is 1' });
  }
  const config = doc.config;
  if (!config || typeof config !== 'object') {
    return { ok: false, problems: [...problems, { path: 'config', code: 'missing_config', message: 'the provider config has no `config` object', fix: 'restore the last known-good provider_config.json' }], providers };
  }
  const rules = config.providerConfigRules?.providerRules;
  if (!Array.isArray(rules)) {
    return { ok: false, problems: [...problems, { path: 'config.providerConfigRules.providerRules', code: 'missing_rules', message: 'providerRules is not an array', fix: 'restore the last known-good provider_config.json' }], providers };
  }
  const modelRules = config.modelConfigRules;
  if (!modelRules || !Array.isArray(modelRules.providerModelRules) || !Array.isArray(modelRules.manualProviderModelRules)) {
    problems.push({ path: 'config.modelConfigRules', code: 'missing_model_rule_arrays', message: 'both providerModelRules and manualProviderModelRules must exist, even if empty', fix: 'add the two arrays back' });
  }

  rules.forEach((rule, i) => {
    const pid = rule?.providerId || `rules[${i}]`;
    const path = `config.providerConfigRules.providerRules[${i}]`;
    const ruleConfig = rule?.config;
    const isObject = ruleConfig && typeof ruleConfig === 'object' && !Array.isArray(ruleConfig);

    if (!rule || typeof rule !== 'object') {
      problems.push({ path, code: 'invalid_rule', message: `${pid} is not an object`, fix: 'remove the malformed rule' });
      return;
    }
    if (!rule.providerId) {
      problems.push({ path: `${path}.providerId`, code: 'missing_provider_id', message: 'a provider rule has no providerId', fix: 'give every rule a stable providerId' });
    }
    for (const key of Object.keys(rule)) {
      if (!VALID_RULE_KEYS.includes(key)) {
        problems.push({ path: `${path}.${key}`, code: 'unrecognized_keys', message: `unrecognized top-level key "${key}"`, fix: `remove "${key}" — the accepted keys are ${VALID_RULE_KEYS.join(', ')}` });
      }
    }
```

_First 80 of 379 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
