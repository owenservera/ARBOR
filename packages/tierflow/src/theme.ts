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
    '--role-researcher': '#f2ad6c',
    '--role-synthesizer': '#c3b2ff',
    '--role-scribe': '#b6bdc8',
  },
} as const satisfies Record<string, ThemeTokenTable>;

/**
 * Base tokens shared by every theme (spacing, radii, strokes, metrics,
 * font stacks). Declared once on `:root`, after the theme blocks.
 */
export const BASE_TOKENS = {
  '--space-1': '4px',
  '--space-2': '8px',
  '--space-3': '12px',
  '--space-4': '16px',
  '--space-5': '20px',
  '--space-6': '24px',
  '--space-8': '32px',
  '--space-10': '40px',
  '--space-12': '48px',
  '--space-16': '64px',
  '--radius-xs': '2px',
  '--radius-sm': '4px',
  '--radius-md': '6px',
  '--radius-lg': '8px',
  '--radius-pill': '999px',
  '--stroke-hair': '1px',
  '--stroke-draft': '1.5px',
  '--stroke-ink': '2px',
  '--control-h': '44px',
  '--touch-target': '48px',
  '--sidebar-w': '260px',
  '--content-max': '1120px',
  '--font-display': '"Space Grotesk", "Segoe UI Variable Display", system-ui, sans-serif',
  '--font-sans': '"Geist", "Segoe UI Variable Text", system-ui, sans-serif',
  '--font-mono': '"JetBrains Mono", "Cascadia Code", Consolas, ui-monospace, monospace',
} as const satisfies ThemeTokenTable;

/** Local font files the host loads; emitted as @font-face rules in declared order. */
export interface FontFaceToken {
  readonly family: string;
  readonly file: string;
  readonly weight: string;
}

export const FONT_FACES: readonly FontFaceToken[] = [
  { family: 'Space Grotesk', file: 'space-grotesk-latin-wght-normal.woff2', weight: '300 700' },
  { family: 'Geist', file: 'geist-latin-wght-normal.woff2', weight: '100 900' },
  { family: 'JetBrains Mono', file: 'jetbrains-mono-latin-wght-normal.woff2', weight: '100 800' },
];

/** Typographic classes emitted after the token blocks, in declared order. */
export interface TypeClassToken {
  readonly className: string;
  readonly fontFamily: string;
  readonly fontSize: string;
  readonly lineHeight: string;
  readonly fontWeight: string;
  readonly letterSpacing?: string;
}

export const TYPE_SCALE: readonly TypeClassToken[] = [
  { className: 'display', fontFamily: 'var(--font-display)', fontSize: '60px', lineHeight: '60px', fontWeight: '600', letterSpacing: '-0.045em' },
  { className: 'title', fontFamily: 'var(--font-display)', fontSize: '40px', lineHeight: '44px', fontWeight: '600', letterSpacing: '-0.035em' },
  { className: 'headline', fontFamily: 'var(--font-display)', fontSize: '26px', lineHeight: '32px', fontWeight: '600', letterSpacing: '-0.02em' },
  { className: 'figure', fontFamily: 'var(--font-display)', fontSize: '32px', lineHeight: '36px', fontWeight: '500', letterSpacing: '-0.02em' },
  { className: 'heading', fontFamily: 'var(--font-sans)', fontSize: '18px', lineHeight: '24px', fontWeight: '600', letterSpacing: '-0.01em' },
  { className: 'subheading', fontFamily: 'var(--font-sans)', fontSize: '15px', lineHeight: '22px', fontWeight: '600' },
  { className: 'body', fontFamily: 'var(--font-sans)', fontSize: '15px', lineHeight: '23px', fontWeight: '400' },
  { className: 'body-sm', fontFamily: 'var(--font-sans)', fontSize: '13px', lineHeight: '19px', fontWeight: '400' },
  { className: 'label', fontFamily: 'var(--font-sans)', fontSize: '13px', lineHeight: '16px', fontWeight: '550' },
  { className: 'eyebrow', fontFamily: 'var(--font-mono)', fontSize: '11px', lineHeight: '16px', fontWeight: '500', letterSpacing: '0.08em' },
  { className: 'code', fontFamily: 'var(--font-mono)', fontSize: '12.5px', lineHeight: '19px', fontWeight: '400' },
  { className: 'code-sm', fontFamily: 'var(--font-mono)', fontSize: '11px', lineHeight: '16px', fontWeight: '400' },
];
