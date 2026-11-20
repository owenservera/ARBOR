# File: packages/tierflow/src/theme.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | packages/tierflow/src/theme.ts |
| Language | TypeScript |
| Kind | source |
| Size | 6633 B |
| Lines | 155 |
| Hash | 793cf0e00aba |
| Test | no |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| TOKENS_SCHEMA | const | 10 | yes | export const TOKENS_SCHEMA = &#39;vivim.tokens/1&#39;; |
| ThemeTokenTable | type | 13 | yes | export type ThemeTokenTable = Readonly&lt;Record&lt;string, string&gt;&gt;; |
| THEMES | const | 21 | yes | export const THEMES = { |
| BASE_TOKENS | const | 91 | yes | export const BASE_TOKENS = { |
| FontFaceToken | interface | 120 | yes | export interface FontFaceToken { |
| FONT_FACES | const | 126 | yes | export const FONT_FACES: readonly FontFaceToken[] = [ |
| TypeClassToken | interface | 133 | yes | export interface TypeClassToken { |
| TYPE_SCALE | const | 142 | yes | export const TYPE_SCALE: readonly TypeClassToken[] = [ |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [packages/tierflow/scripts/generate-host-tokens.mjs](../scripts/generate-host-tokens.mjs.md) | ../src/theme.ts |

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 2 | context | — | — | Canonical VIVIM design-token source — the single theme authority whose generated copy is consumed by the harness host at vivim-web-harness/apps/vivim-host/public/vivim-tokens.css. |
| 3 | owner | one-app-m5 | — | one-app-m5 |
| 4 | task | — | — | M5 vivim-ui token authority (one-app fan-out 2026-11-09) |
| 5 | see | — | ../../vivim-web-harness/apps/vivim-host/public/vivim-tokens.css | ../../vivim-web-harness/apps/vivim-host/public/vivim-tokens.css |
| 6 | invariant | — | — | Regeneration must never drop a custom property the host uses (parity oracle in test/generate-host-tokens.test.mjs). |

## Excerpt

```typescript
/**
 * @hq:context Canonical VIVIM design-token source — the single theme authority whose generated copy is consumed by the harness host at vivim-web-harness/apps/vivim-host/public/vivim-tokens.css.
 * @hq:owner one-app-m5
 * @hq:task M5 vivim-ui token authority (one-app fan-out 2026-11-09)
 * @hq:see ../../vivim-web-harness/apps/vivim-host/public/vivim-tokens.css
 * @hq:invariant Regeneration must never drop a custom property the host uses (parity oracle in test/generate-host-tokens.test.mjs).
 */

/** Schema identifier stamped into every generated artifact. */
export const TOKENS_SCHEMA = 'vivim.tokens/1';

/** Custom properties keyed by CSS custom-property name (leading `--` included). */
export type ThemeTokenTable = Readonly<Record<string, string>>;

/**
 * Theme palettes. `bone` is the default light theme (also applied to `:root`);
 * `graphite` is the dark theme and seeds the prefers-color-scheme fallback.
 * Values mirror the harness vivim-tokens.css exactly — the initial canonical
 * set was captured from the host so generation starts parity-true.
 */
export const THEMES = {
  bone: {
    '--paper': '#f5f3ef',
    '--surface': '#fbfaf7',
    '--surface-raised': '#ffffff',
    '--grid': '#e9e5dd',
    '--line': '#dfdad1',
    '--line-strong': '#8c8579',
    '--ink': '#121212',
    '--ink-muted': '#57534c',
    '--pencil': '#6e6a63',
    '--mark': '#a8382a',
    '--on-mark': '#ffffff',
    '--mark-soft': '#f6e6e1',
    '--focus': '#a8382a',
    '--verified': '#0b6f78',
    '--uncertain': '#8a5300',
    '--danger': '#a01e3c',
    '--info': '#2b4f86',
    '--memory-recent': '#efebe4',
    '--memory-saved': '#e2dccf',
    '--memory-core': '#121212',
    '--on-core': '#f5f3ef',
    '--role-planner': '#2f4fb5',
    '--role-builder': '#0e6b5e',
    '--role-reviewer': '#963067',
    '--role-verifier': '#4d6a14',
    '--role-researcher': '#94480a',
    '--role-synthesizer': '#5a3fae',
    '--role-scribe': '#4a5260',
    '--shadow-sm': '0 1px 0 #1212120f',
    '--shadow-md': '0 12px 32px #12121229',
    '--shadow-lg': '0 24px 64px #1212123d',
  },
  graphite: {
    '--paper': '#111214',
    '--surface': '#18191c',
    '--surface-raised': '#202226',
    '--grid': '#1d1f22',
    '--line': '#2e3035',
    '--line-strong': '#73767d',
    '--ink': '#eeece7',
    '--ink-muted': '#aeaba4',
    '--pencil': '#9c9a94',
    '--mark': '#ec7b67',
    '--on-mark': '#1a0a06',
    '--mark-soft': '#3a1f1a',
    '--focus': '#ec7b67',
    '--verified': '#5cc8cf',
    '--uncertain': '#f0b45a',
    '--danger': '#ff8fa3',
    '--info': '#9ab8ee',
    '--memory-recent': '#1c1d20',
    '--memory-saved': '#2a2c30',
    '--memory-core': '#eeece7',
    '--on-core': '#111214',
    '--role-planner': '#93a8f5',
    '--role-builder': '#5fd0bd',
    '--role-reviewer': '#efa0cf',
    '--role-verifier': '#acd471',
```

_First 80 of 156 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
