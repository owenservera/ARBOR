// hq/aii/fixtures/HQ-027-disabled-by-config.mjs
// AII scenario HQ-027 (Group C): "Which features are implemented but disabled by configuration?"
// Engine: hq/lib/zcode-doctor.mjs -> featuresDisabledByConfig
//
// Ground truth LOCKED 2026-11-11 from the live machine's provider config:
//   bun hq/bin/hq.mjs zcode-doctor  -> providers with models but enabled != true
//   plus a direct run of featuresDisabledByConfig against
//   C:/Users/VIVIM.inc/.zcode/v2/provider_config.json
//
// Locked disabled-by-config set (providerId, enabled, modelCount):
//   zai-standard-api        enabled=false  24
//   ccr-router              enabled=false   5
//   cpa-free                enabled=false   6
//   deepseek                enabled=false   2
//   grok-build-oauth        enabled=false   3
//   account:zai-start-plan  enabled=undefined 2
//
// The fixture reads the real provider_config.json (read-only probe) and re-derives
// the disabled-by-config set live. No credentials are surfaced: featuresDisabledByConfig
// returns only providerId/enabled/modelCount/model names — never api keys or secrets.

import { defineFixture, finding } from './harness.mjs';
import { featuresDisabledByConfig } from '../../lib/zcode-doctor.mjs';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const EXPECTED = [
  { what: 'zai-standard-api disabled by configuration (enabled=false, 24 models)', where: 'hq/lib/zcode-doctor.mjs' },
  { what: 'ccr-router disabled by configuration (enabled=false, 5 models)', where: 'hq/lib/zcode-doctor.mjs' },
  { what: 'cpa-free disabled by configuration (enabled=false, 6 models)', where: 'hq/lib/zcode-doctor.mjs' },
  { what: 'deepseek disabled by configuration (enabled=false, 2 models)', where: 'hq/lib/zcode-doctor.mjs' },
  { what: 'grok-build-oauth disabled by configuration (enabled=false, 3 models)', where: 'hq/lib/zcode-doctor.mjs' },
  { what: 'account:zai-start-plan disabled by configuration (enabled=undefined, 2 models)', where: 'hq/lib/zcode-doctor.mjs' },
];

export default defineFixture({
  id: 'HQ-027',
  provenance:
    '2026-11-11: locked from live provider_config.json at C:/Users/VIVIM.inc/.zcode/v2/provider_config.json by running ' +
    'featuresDisabledByConfig (hq/lib/zcode-doctor.mjs) against the real doc; 6 providers declare models but have ' +
    'enabled !== true, so their implemented features are disabled by configuration.',
  expected: EXPECTED,
  run: async () => {
    const home = process.env.USERPROFILE || process.env.HOME || '';
    const configPath = join(home, '.zcode', 'v2', 'provider_config.json');
    const doc = JSON.parse(readFileSync(configPath, 'utf8'));
    const { disabled } = featuresDisabledByConfig(doc);
    return disabled.map((d) =>
      finding(
        `${d.providerId} disabled by configuration (enabled=${d.enabled}, ${d.modelCount} models)`,
        'hq/lib/zcode-doctor.mjs',
      )
    );
  },
});
