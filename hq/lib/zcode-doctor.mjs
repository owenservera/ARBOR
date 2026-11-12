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
    if (!isObject) {
      problems.push({ path: `${path}.config`, code: 'invalid_config', message: `${pid} has no config object`, fix: 'give the rule a config object' });
      return;
    }
    for (const key of Object.keys(ruleConfig)) {
      if (!VALID_CONFIG_KEYS.includes(key)) {
        const where = MISPLACED_KEYS[key];
        problems.push({
          path: `${path}.config.${key}`,
          code: 'unrecognized_keys',
          message: `unrecognized key "${key}" inside config`,
          fix: where ? `move "${key}" out of config — it belongs at ${where}` : `remove "${key}" — config accepts ${VALID_CONFIG_KEYS.join(', ')}`,
          fatal: true,
        });
      }
    }
    const models = ruleConfig.personalModelIds || ruleConfig.modelOrder || [];
    // A provider with a templateId inherits its api type and baseUrl from the built-in template,
    // so those fields are only required when there is no template to inherit from.
    const inheritsTemplate = Boolean(rule.templateId);
    providers.push({
      providerId: rule.providerId,
      providerName: rule.providerName || rule.providerId,
      templateId: rule.templateId || null,
      enabled: rule.enabled !== false,
      hasKey: Boolean(ruleConfig.access?.apiKey),
      hasBaseUrl: Boolean(ruleConfig.api?.baseUrl) || inheritsTemplate,
      hasApiType: Boolean(ruleConfig.api?.type) || inheritsTemplate,
      inheritsTemplate,
      modelCount: models.length,
      personalModelCount: (ruleConfig.personalModelIds || []).length,
      modelOrderCount: (ruleConfig.modelOrder || []).length,
    });
  });

  const fatal = problems.some((p) => p.fatal);
  return { ok: problems.length === 0 && !fatal, problems, providers, fatal };
}

/**
 * Report on the providers that are actually usable.
 *
 * A provider is `blocked` only for provider-level reasons (disabled, no credential, no models,
 * no api type). A capped model is a MODEL-level problem: it is reported in `blockedModelKeys`,
 * never as a provider block — a provider with 13 working models out of 14 is not blocked.
 * A provider with no provider-level reason but zero healthy models is `degraded`.
 *
 * @param {Object} doc Parsed provider_config.json.
 * @param {Object} [opts]
 * @param {Map<string, Object>} [opts.health] provider/model -> health record from the router.
 * @returns {{enabled: number, visible: number, complete: number, usable: Array<Object>, unusable: Array<Object>}}
 */
export function providerReadiness(doc, opts = {}) {
  const { ok, problems, providers } = validateProviderConfig(doc);
  const health = opts.health instanceof Map ? opts.health : new Map();
  const usable = [];
  const unusable = [];
  // The model ids a rule actually declares. Usage rows can outlive a model removed from the
  // config; such history is not a block on any current model, so it must not count against one.
  const declaredModels = (providerId) => {
    const rules = doc?.config?.providerConfigRules?.providerRules;
    if (!Array.isArray(rules)) return null;
    const rule = rules.find((x) => x && x.providerId === providerId);
    const ruleConfig = rule?.config;
    if (!ruleConfig || typeof ruleConfig !== 'object') return null;
    const ids = Array.isArray(ruleConfig.personalModelIds) ? ruleConfig.personalModelIds
      : Array.isArray(ruleConfig.modelOrder) ? ruleConfig.modelOrder
        : null;
    return ids ? ids.map((id) => String(id)) : null;
  };
  for (const p of providers) {
    const entry = { ...p };
    // Provider-level blocks are structural: with one of these the provider cannot serve at all.
    const blockedBy = [];
    if (!p.enabled) blockedBy.push('disabled');
    if (!p.hasKey) blockedBy.push('no credential');
    if (!p.modelCount) blockedBy.push('no models');
    if (!p.hasApiType) blockedBy.push('no api type');
    const declared = declaredModels(p.providerId);
    const blockedModels = [];
    for (const [key, h] of health) {
      if (!key.startsWith(`${p.providerId}/`)) continue;
      const state = h?.health?.state;
      if (state !== 'budget-blocked' && state !== 'capped') continue;
      const model = key.slice(p.providerId.length + 1);
      if (declared && declared.length && !declared.includes(model)) continue;
      blockedModels.push({ key, model, state });
    }
    entry.blockedBy = blockedBy;
    entry.blockedModels = blockedModels;
    entry.blockedModelKeys = blockedModels.map((m) => m.key);
    entry.healthyModelCount = Math.max(0, p.modelCount - blockedModels.length);
    entry.status = blockedBy.length ? 'blocked' : entry.healthyModelCount > 0 ? 'ok' : 'degraded';
    (entry.status === 'ok' ? usable : unusable).push(entry);
  }
  return {
    ok,
    problems,
    enabled: providers.filter((p) => p.enabled).length,
    visible: providers.filter((p) => p.enabled).length,
    complete: providers.filter((p) => p.enabled && p.hasKey && p.modelCount && p.hasApiType).length,
    usable,
    unusable,
    all: providers,
  };
}

/**
 * Map provider configuration flags to features: report which providers that declare
 * models are disabled by configuration (`enabled` not `true`), so an operator can see
 * which implemented features are switched off rather than missing.
 *
 * @param {Object} doc Parsed provider_config.json.
 * @returns {{disabled: Array<{providerId: string, enabled: boolean|null|undefined, modelCount: number, models: string[]}>, totalDisabled: number}}
 */
export function featuresDisabledByConfig(doc) {
  const rules = doc?.config?.providerConfigRules?.providerRules;
  if (!Array.isArray(rules)) return { disabled: [], totalDisabled: 0 };
  const disabled = [];
  for (const rule of rules) {
    if (!rule || typeof rule !== 'object') continue;
    const config = rule.config;
    const ids = Array.isArray(config?.personalModelIds) ? config.personalModelIds
      : Array.isArray(config?.modelOrder) ? config.modelOrder
        : null;
    const models = ids ? ids.map((id) => String(id)) : [];
    if (models.length === 0) continue;
    if (rule.enabled === true) continue;
    disabled.push({
      providerId: rule.providerId,
      enabled: rule.enabled,
      modelCount: models.length,
      models: models.slice().sort(),
    });
  }
  disabled.sort((a, b) => String(a.providerId).localeCompare(String(b.providerId)));
  return { disabled, totalDisabled: disabled.length };
}

/**
 * Compare ZCode's provider_config.json against an OpenCode settings export and report
 * top-level key differences plus per-provider presence mismatches. Read-only diff: no
 * writes, no secrets surfaced.
 *
 * @param {Object} zcodeDoc Parsed ZCode provider_config.json.
 * @param {Object} opencodeDoc Parsed OpenCode settings export.
 * @returns {{zcodeOnly: string[], opencodeOnly: string[], shared: string[], providerPresence: Array<{providerId: string, inZcode: boolean, inOpenCode: boolean}>, diff: string}} providerPresence covers the union of both sides' provider ids, so a provider declared by only one tool is a visible presence mismatch.
 */
export function diffOpenCodeConfig(zcodeDoc, opencodeDoc) {
  const zcodeKeys = zcodeDoc && typeof zcodeDoc === 'object' ? Object.keys(zcodeDoc) : [];
  const opencodeKeys = opencodeDoc && typeof opencodeDoc === 'object' ? Object.keys(opencodeDoc) : [];
  const zcodeSet = new Set(zcodeKeys);
  const opencodeSet = new Set(opencodeKeys);
  const zcodeOnly = zcodeKeys.filter((k) => !opencodeSet.has(k)).sort();
  const opencodeOnly = opencodeKeys.filter((k) => !zcodeSet.has(k)).sort();
  const shared = zcodeKeys.filter((k) => opencodeSet.has(k)).sort();

  const zcodeProviders = new Set();
  const rules = zcodeDoc?.config?.providerConfigRules?.providerRules;
  if (Array.isArray(rules)) {
    for (const rule of rules) {
      if (rule && rule.providerId) zcodeProviders.add(rule.providerId);
    }
  }
  // OpenCode declares providers as objects keyed by provider id: `providers` is
  // the current form and `provider` the deprecated legacy form of the same shape
  // (opencode.ai/config.json). Union both so either export style is compared.
  const opencodeProviders = new Set();
  for (const key of ['providers', 'provider']) {
    const map = opencodeDoc?.[key];
    if (map && typeof map === 'object' && !Array.isArray(map)) {
      for (const pid of Object.keys(map)) {
        if (pid) opencodeProviders.add(pid);
      }
    }
  }
  const providerPresence = [...new Set([...zcodeProviders, ...opencodeProviders])].map((pid) => ({
    providerId: pid,
    inZcode: zcodeProviders.has(pid),
    inOpenCode: opencodeProviders.has(pid),
  }));
  providerPresence.sort((a, b) => a.providerId.localeCompare(b.providerId));

  const diff = [
    `ZCode keys: ${zcodeKeys.length} (${zcodeKeys.join(', ')})`,
    `OpenCode keys: ${opencodeKeys.length} (${opencodeKeys.join(', ')})`,
    `Only in ZCode: ${zcodeOnly.length} (${zcodeOnly.join(', ') || 'none'})`,
    `Only in OpenCode: ${opencodeOnly.length} (${opencodeOnly.join(', ') || 'none'})`,
    `Shared: ${shared.length} (${shared.join(', ') || 'none'})`,
    `Providers declared by ZCode: ${zcodeProviders.size}`,
    `Providers declared by OpenCode: ${opencodeProviders.size}`,
  ].join('\n');

  return { zcodeOnly, opencodeOnly, shared, providerPresence, diff };
}

/**
 * Check that every agent definition still carries what the team protocol requires.
 *
 * @param {Array<{file: string, text: string}>} files
 * @returns {{total: number, compliant: number, gaps: Array<{file: string, gap: string}>}}
 */
export function auditAgentCompliance(files) {
  const gaps = [];
  let compliant = 0;
  for (const f of files || []) {
    const text = String(f.text || '');
    const issues = [];
    if (!/^skills:\s*\[.*team-protocol.*\]/m.test(text)) issues.push('no team-protocol skill grant');
    if (!/^requiredMcpServers:\s*\[.*context7.*\]/m.test(text)) issues.push('context7 is not a required MCP server');
    if (!/^model:\s*\S+/m.test(text)) issues.push('no model pin');
    if (!/^name:\s*\S+/m.test(text)) issues.push('no name — the agent type can never be dispatched');
    if (issues.length) {
      for (const gap of issues) gaps.push({ file: f.file, gap });
    } else {
      compliant += 1;
    }
  }
  return { total: (files || []).length, compliant, gaps };
}

/**
 * One line that says whether the machine is healthy.
 *
 * @param {Object} report
 * @returns {string}
 */
export function renderDoctorVerdict(report) {
  const r = report || {};
  const bits = [];
  bits.push(`provider-config:${r.providerConfig?.ok ? 'ok' : 'BROKEN'}`);
  bits.push(`providers:${r.providerConfig?.fatal ? '0' : `${r.readiness?.usable?.length ?? 0} usable`}`);
  bits.push(`agents:${r.agents?.compliant ?? 0}/${r.agents?.total ?? 0} compliant`);
  if (r.budget) bits.push(`models:${r.budget.funded} funded/${r.budget.warn} warn/${r.budget.blocked} blocked`);
  if (r.seats) bits.push(`seats:${r.seats.active} active/${r.seats.total} idle`);
  const fatal = Boolean(r.providerConfig?.fatal) || (r.agents?.gaps?.length ?? 0) > 0;
  return `${fatal ? 'DOCTOR: ATTENTION' : 'DOCTOR: HEALTHY'} · ${bits.join(' · ')}`;
}

/**
 * Render the full doctor report.
 *
 * @param {Object} report
 * @returns {string[]}
 */
export function renderDoctor(report) {
  const r = report || {};
  const lines = [];
  lines.push(renderDoctorVerdict(r));
  lines.push('');
  lines.push('PROVIDER CONFIG');
  if (r.providerConfig?.ok) {
    lines.push('  ok — the file passes the schema rules ZCode enforces');
  } else {
    for (const p of r.providerConfig?.problems || []) {
      lines.push(`  ${p.fatal ? 'FATAL' : 'warn'}  ${p.path}: ${p.message}`);
      lines.push(`         fix: ${p.fix}`);
    }
    if (r.providerConfig?.fatal) {
      lines.push('         ZCode rejects the WHOLE file when one rule has an unrecognized key.');
      lines.push('         It then degrades to an empty in-memory config and every provider vanishes.');
    }
  }
  lines.push('');
  lines.push('PROVIDERS');
  const blockedModelsText = (p) => (p.blockedModels || []).map((m) => `${m.model} ${m.state}`).join(', ');
  for (const p of r.readiness?.usable || []) {
    const note = p.blockedModelKeys?.length ? `  (${p.blockedModelKeys.length} blocked: ${blockedModelsText(p)})` : '';
    lines.push(`  ${'ok'.padEnd(9)}${String(p.providerId).padEnd(24)} ${p.modelCount} models  ${p.hasBaseUrl ? p.templateId || 'custom' : 'no baseUrl'}${note}`);
  }
  for (const p of r.readiness?.unusable || []) {
    if (p.status === 'degraded') {
      lines.push(`  ${'degraded'.padEnd(9)}${String(p.providerId).padEnd(24)} ${p.modelCount} models  every model blocked: ${blockedModelsText(p)}`);
      continue;
    }
    lines.push(`  ${'blocked'.padEnd(9)}${String(p.providerId).padEnd(24)} ${p.blockedBy.join(', ')}`);
  }
  if (r.agents) {
    lines.push('');
    lines.push('AGENTS');
    lines.push(`  ${r.agents.compliant}/${r.agents.total} carry the protocol grant, the context7 requirement and a model pin`);
    for (const g of (r.agents.gaps || []).slice(0, 20)) lines.push(`  ${g.file}: ${g.gap}`);
    if ((r.agents.gaps || []).length > 20) lines.push(`  ... ${r.agents.gaps.length - 20} more`);
  }
  if (r.budget) {
    lines.push('');
    lines.push('MODEL BUDGET');
    lines.push(`  funded=${r.budget.funded} warn=${r.budget.warn} blocked=${r.budget.blocked}`);
    for (const key of r.budget.blockedKeys || []) lines.push(`  blocked  ${key}`);
    for (const key of r.budget.warnKeys || []) lines.push(`  warn     ${key}`);
  }
  if (r.seats) {
    lines.push('');
    lines.push('SEATS');
    lines.push(`  ${r.seats.total} registered, ${r.seats.active} active`);
  }
  return lines;
}
