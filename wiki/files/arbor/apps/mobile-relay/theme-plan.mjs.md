# File: apps/mobile-relay/theme-plan.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | apps/mobile-relay/theme-plan.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 3844 B |
| Lines | 74 |
| Hash | bd17e8f9ad3c |
| Test | no |
| Generated | no |
| Component | mobile-relay |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| ID | const | 6 | no | const ID = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,95}$/; |
| PRESET_NAMES | const | 7 | no | const PRESET_NAMES = Object.freeze({ tide: &#39;Tide&#39;, dusk: &#39;Dusk&#39;, ember: &#39;Ember&#39;, grove: &#39;Grove&#39;, ink: &#39;Ink&#39;, dawn: &#39;Dawn&#39; }); |
| presetNames | function | 9 | yes | export function presetNames() { return { ...PRESET_NAMES }; } |
| hasPreset | function | 10 | yes | export function hasPreset(name) { return Object.hasOwn(THEME_PRESETS, name); } |
| mix | function | 12 | no | function mix(a, b, fraction) { |
| bytes | const | 13 | no | const bytes = [1, 3, 5].map(n =&gt; { const x = Number.parseInt(a.slice(n, n + 2), 16), y = Number.parseInt(b.slice(n, n + 2), 16); return Math.round(x * (1 - fraction) + y * fraction).toString(16).padS… |
| x | const | 14 | no | const x = Number.parseInt(a.slice(n, n + 2), 16), y = Number.parseInt(b.slice(n, n + 2), 16); |
| luminance | function | 19 | no | function luminance(color) { |
| linear | function | 20 | no | const linear = x =&gt; { const v = x / 255; return v &lt;= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }; |
| rgb | const | 21 | no | const rgb = [1, 3, 5].map(i =&gt; linear(Number.parseInt(color.slice(i, i + 2), 16))); |
| contrast | function | 24 | no | function contrast(a, b) { |
| x | const | 25 | no | const x = luminance(a), y = luminance(b); |
| fail | function | 28 | no | function fail(reason) { throw new TypeError(&#39;Invalid theme plan: &#39; + reason); } |
| surfaceVariables | function | 31 | yes | export function surfaceVariables(palette) { |
| ink | const | 32 | no | const ink = readableForeground(palette.background); |
| surface | variable | 33 | no | let surface = mix(palette.background, palette.secondary, .18); |
| raised | variable | 35 | no | let raised = mix(palette.background, palette.secondary, .34); |
| compilePresetRenderPlan | function | 45 | yes | export function compilePresetRenderPlan(preset, { worldId, revision = 0, reducedMotion = false, source = &#39;provisional&#39; } = {}) { |
| theme | const | 49 | no | const theme = makeProvisionalTheme(worldId, preset); |
| paint | const | 50 | no | const paint = compileVisualTheme(theme, { reducedMotion }); |
| vars | const | 51 | no | const vars = { |
| compileProvisionalPlan | function | 70 | yes | export function compileProvisionalPlan(worldId, { reducedMotion = false } = {}) { |
| VISUAL_THEME_SCHEMA | export | 74 | yes | export { VISUAL_THEME_SCHEMA } |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./visual-theme.mjs | import | 3 | [apps/mobile-relay/visual-theme.mjs](./visual-theme.mjs.md) |
| ./bootstrap-f02.mjs | import | 4 | [apps/mobile-relay/bootstrap-f02.mjs](./bootstrap-f02.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [apps/vivim-host/bootstrap/service.mjs](../vivim-host/bootstrap/service.mjs.md) | ../../mobile-relay/theme-plan.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// One render-plan shape for every first-paint source (curated preset or validated
// F02). Pure: no DOM, storage, network or provider access.
import { THEME_PRESETS, VISUAL_THEME_SCHEMA, makeProvisionalTheme, compileVisualTheme, readableForeground } from './visual-theme.mjs';
import { RENDER_PLAN_SCHEMA, F02_FONT_STACKS } from './bootstrap-f02.mjs';

const ID = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,95}$/;
const PRESET_NAMES = Object.freeze({ tide: 'Tide', dusk: 'Dusk', ember: 'Ember', grove: 'Grove', ink: 'Ink', dawn: 'Dawn' });

export function presetNames() { return { ...PRESET_NAMES }; }
export function hasPreset(name) { return Object.hasOwn(THEME_PRESETS, name); }

function mix(a, b, fraction) {
  const bytes = [1, 3, 5].map(n => {
    const x = Number.parseInt(a.slice(n, n + 2), 16), y = Number.parseInt(b.slice(n, n + 2), 16);
    return Math.round(x * (1 - fraction) + y * fraction).toString(16).padStart(2, '0');
  });
  return '#' + bytes.join('');
}
function luminance(color) {
  const linear = x => { const v = x / 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; };
  const rgb = [1, 3, 5].map(i => linear(Number.parseInt(color.slice(i, i + 2), 16)));
  return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
}
function contrast(a, b) {
  const x = luminance(a), y = luminance(b);
  return (Math.max(x, y) + .05) / (Math.min(x, y) + .05);
}
function fail(reason) { throw new TypeError('Invalid theme plan: ' + reason); }

// Contrast-safe surface tokens shared by the F02 compiler and the curated presets.
export function surfaceVariables(palette) {
  const ink = readableForeground(palette.background);
  let surface = mix(palette.background, palette.secondary, .18);
  if (contrast(ink, surface) < 4.5) surface = palette.background;
  let raised = mix(palette.background, palette.secondary, .34);
  if (contrast(ink, raised) < 4.5) raised = surface;
  return {
    '--bg': palette.background, '--s1': surface, '--s2': raised,
    '--bd': mix(surface, ink, .16), '--tx': ink, '--mu': mix(ink, palette.background, .20),
    '--ac': palette.accent, '--ac2': mix(palette.background, palette.accent, .2),
    '--vivim-accent-ink': readableForeground(palette.accent)
  };
}

export function compilePresetRenderPlan(preset, { worldId, revision = 0, reducedMotion = false, source = 'provisional' } = {}) {
  if (!hasPreset(preset)) fail('unknown preset');
  if (typeof worldId !== 'string' || !ID.test(worldId)) fail('world scope required');
  if (!Number.isSafeInteger(revision) || revision < 0) fail('revision');
  const theme = makeProvisionalTheme(worldId, preset);
  const paint = compileVisualTheme(theme, { reducedMotion });
  const vars = {
    ...surfaceVariables(theme.palette),
    '--vivim-background-image': paint.backgroundImage,
    '--vivim-font-family': F02_FONT_STACKS.system,
    '--vivim-base-font-size': '15px',
    '--vivim-heading-font-size': '28px',
    '--vivim-corner-radius': '14px',
    '--vivim-spacing-scale': '1',
    '--vivim-appearance': theme.appearance
  };
  return {
    schema: RENDER_PLAN_SCHEMA, pass: 'F00', worldId, revision, provisional: source === 'provisional',
    status: source === 'provisional' ? 'provisional' : 'active', preset,
    theme: { ...theme, source: { kind: source === 'owner-choice' ? 'owner-choice' : 'provisional', ref: 'preset.' + preset } },
    typography: { fontFamily: 'system', fontSizePx: 15, headingSizePx: 28, radiusPx: 14, spacingScale: 1 },
    cssVariables: vars, motion: paint.motion, assertions: { preferences: [], dislikes: [], unknowns: [] }
  };
}

export function compileProvisionalPlan(worldId, { reducedMotion = false } = {}) {
  return compilePresetRenderPlan('lab', { worldId, reducedMotion, source: 'provisional' });
}

export { VISUAL_THEME_SCHEMA };
```

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
