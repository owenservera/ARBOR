# File: hq/aii/fixtures/HQ-027-disabled-by-config.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/aii/fixtures/HQ-027-disabled-by-config.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 2980 B |
| Lines | 55 |
| Hash | 8609d1267463 |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| EXPECTED | const | 27 | no | const EXPECTED = [ |
| home | const | 44 | no | const home = process.env.USERPROFILE \|\| process.env.HOME \|\| &#39;&#39;; |
| configPath | const | 45 | no | const configPath = join(home, &#39;.zcode&#39;, &#39;v2&#39;, &#39;provider_config.json&#39;); |
| doc | const | 46 | no | const doc = JSON.parse(readFileSync(configPath, &#39;utf8&#39;)); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./harness.mjs | import | 22 | [hq/aii/fixtures/harness.mjs](./harness.mjs.md) |
| ../../lib/zcode-doctor.mjs | import | 23 | [hq/lib/zcode-doctor.mjs](../../lib/zcode-doctor.mjs.md) |
| node:fs | import | 24 | external |
| node:path | import | 25 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
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
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
