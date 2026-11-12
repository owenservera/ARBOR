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
