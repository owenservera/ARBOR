# File: hq/aii/fixtures/HQ-067-zcode-vs-opencode-config.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/aii/fixtures/HQ-067-zcode-vs-opencode-config.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 5984 B |
| Lines | 109 |
| Hash | d0b389a73e0c |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| ZCODE_SNAPSHOT | const | 34 | no | const ZCODE_SNAPSHOT = { |
| OPENCODE_SNAPSHOT | const | 67 | no | const OPENCODE_SNAPSHOT = { |
| EXPECTED | const | 73 | no | const EXPECTED = [ |
| zcodeKeys | const | 98 | no | const zcodeKeys = Object.keys(ZCODE_SNAPSHOT).sort(); |
| opencodeKeys | const | 99 | no | const opencodeKeys = Object.keys(OPENCODE_SNAPSHOT).sort(); |
| findings | const | 100 | no | const findings = []; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./harness.mjs | import | 28 | [hq/aii/fixtures/harness.mjs](./harness.mjs.md) |
| ../../lib/zcode-doctor.mjs | import | 29 | [hq/lib/zcode-doctor.mjs](../../lib/zcode-doctor.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
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
```

_First 80 of 110 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
