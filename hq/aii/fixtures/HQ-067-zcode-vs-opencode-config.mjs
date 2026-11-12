// hq/aii/fixtures/HQ-067-zcode-vs-opencode-config.mjs
// AII scenario HQ-067 (Group H): "How do my ZCode and OpenCode configurations differ?"
// Engine: hq/lib/zcode-doctor.mjs -> diffOpenCodeConfig
//
// Ground truth LOCKED 2026-11-11 from the live machine configs:
//   ZCode provider_config.json:   C:/Users/VIVIM.inc/.zcode/v2/provider_config.json
//   OpenCode settings export:     C:/Users/VIVIM.inc/.opencode/config.json
//
// The live ZCode provider_config.json is under active modification (its distinct
// providerId count moved 17 -> 20 -> 21 during 2026-11-11T19:5x-20:08Z while this
// fixture was being repaired), so a live re-derivation races the config writer and
// the locked provider count goes stale within minutes. Ground truth is therefore
// re-locked to a SANITIZED SNAPSHOT captured 2026-11-11T20:08Z, and run() verifies
// the engine deterministically against that snapshot.
//
// Locked diff (snapshot, captured from the live files):
//   ZCode keys:   2 (schemaVersion, config)
//   OpenCode keys: 3 ($schema, mcp, plugin)
//   Only in ZCode:     2 (config, schemaVersion)
//   Only in OpenCode:  3 ($schema, mcp, plugin)
//   Shared: 0 (none)
//   Providers declared by ZCode: 21
//
// The snapshot embeds ONLY the fields diffOpenCodeConfig reads — top-level key
// names and providerRule providerIds. No api keys, tokens, baseUrl, model lists,
// or other config content is included. The engine call itself is unchanged.

import { defineFixture, finding } from './harness.mjs';
import { diffOpenCodeConfig } from '../../lib/zcode-doctor.mjs';

// Sanitized snapshot of C:/Users/VIVIM.inc/.zcode/v2/provider_config.json,
// captured 2026-11-11T20:08:18Z (mtime of the live file at capture time).
// providerIds verbatim from config.providerConfigRules.providerRules.
const ZCODE_SNAPSHOT = {
  schemaVersion: 1,
  config: {
    providerConfigRules: {
      providerRules: [
        { providerId: 'account:zai-start-plan' },
        { providerId: 'ccr-router' },
        { providerId: 'claude-code-oauth' },
        { providerId: 'codex-oauth' },
        { providerId: 'cpa-free' },
        { providerId: 'deepseek' },
        { providerId: 'grok-build-oauth' },
        { providerId: 'kilocode-free' },
        { providerId: 'minimax' },
        { providerId: 'minimax-m-plan' },
        { providerId: 'minimax-m-plan-cn' },
        { providerId: 'new-provider' },
        { providerId: 'new-provider-2' },
        { providerId: 'new-provider-3' },
        { providerId: 'new-provider-4' },
        { providerId: 'new-provider-5' },
        { providerId: 'openai' },
        { providerId: 'opencode-zen-chat-2' },
        { providerId: 'openrouter' },
        { providerId: 'openrouter-2' },
        { providerId: 'zai-standard-api' },
      ],
    },
  },
};

// Sanitized snapshot of C:/Users/VIVIM.inc/.opencode/config.json — top-level key
// names only; values are inert placeholders the engine never reads.
const OPENCODE_SNAPSHOT = {
  $schema: 'snapshot-placeholder',
  mcp: 'snapshot-placeholder',
  plugin: 'snapshot-placeholder',
};

const EXPECTED = [
  { what: 'ZCode keys: 2 (config, schemaVersion)', where: 'hq/lib/zcode-doctor.mjs' },
  { what: 'OpenCode keys: 3 ($schema, mcp, plugin)', where: 'hq/lib/zcode-doctor.mjs' },
  { what: 'Only in ZCode: 2 (config, schemaVersion)', where: 'hq/lib/zcode-doctor.mjs' },
  { what: 'Only in OpenCode: 3 ($schema, mcp, plugin)', where: 'hq/lib/zcode-doctor.mjs' },
  { what: 'Shared: 0 (none)', where: 'hq/lib/zcode-doctor.mjs' },
  { what: 'Providers declared by ZCode: 21', where: 'hq/lib/zcode-doctor.mjs' },
];

export default defineFixture({
  id: 'HQ-067',
  provenance:
    '2026-11-11: locked from live configs by running diffOpenCodeConfig (hq/lib/zcode-doctor.mjs) against the real ' +
    'ZCode provider_config.json (C:/Users/VIVIM.inc/.zcode/v2/provider_config.json) and the real OpenCode settings ' +
    'export (C:/Users/VIVIM.inc/.opencode/config.json); ZCode has 2 top-level keys, OpenCode has 3, zero shared keys. ' +
    'REFRESH 2026-11-11T20:08Z: the live provider_config.json is under active modification while the AII round runs — ' +
    'its distinct providerId count moved 17 (morning lock) -> 20 (mtime 2026-11-11T19:57:58Z) -> 21 (mtime ' +
    '2026-11-11T20:08:18Z) within one hour, so the live-re-derivation fixture raced the config writer and its locked ' +
    'provider count went stale twice during this repair. Ground truth re-locked to a sanitized snapshot captured at ' +
    '2026-11-11T20:08Z (top-level key names + providerRule providerIds only; no secrets embedded) and run() now feeds ' +
    'that snapshot to the unchanged engine, making verification deterministic. Top-level key sets unchanged from the ' +
    'morning lock; provider count locked at 21.',
  expected: EXPECTED,
  run: async () => {
    const { zcodeOnly, opencodeOnly, shared, providerPresence } = diffOpenCodeConfig(ZCODE_SNAPSHOT, OPENCODE_SNAPSHOT);
    const zcodeKeys = Object.keys(ZCODE_SNAPSHOT).sort();
    const opencodeKeys = Object.keys(OPENCODE_SNAPSHOT).sort();
    const findings = [];
    findings.push(finding(`ZCode keys: ${zcodeKeys.length} (${zcodeKeys.join(', ')})`, 'hq/lib/zcode-doctor.mjs'));
    findings.push(finding(`OpenCode keys: ${opencodeKeys.length} (${opencodeKeys.join(', ')})`, 'hq/lib/zcode-doctor.mjs'));
    findings.push(finding(`Only in ZCode: ${zcodeOnly.length} (${zcodeOnly.join(', ') || 'none'})`, 'hq/lib/zcode-doctor.mjs'));
    findings.push(finding(`Only in OpenCode: ${opencodeOnly.length} (${opencodeOnly.join(', ') || 'none'})`, 'hq/lib/zcode-doctor.mjs'));
    findings.push(finding(`Shared: ${shared.length} (${shared.join(', ') || 'none'})`, 'hq/lib/zcode-doctor.mjs'));
    findings.push(finding(`Providers declared by ZCode: ${providerPresence.length}`, 'hq/lib/zcode-doctor.mjs'));
    return findings;
  },
});
