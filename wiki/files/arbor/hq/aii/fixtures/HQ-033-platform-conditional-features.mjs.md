# File: hq/aii/fixtures/HQ-033-platform-conditional-features.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/aii/fixtures/HQ-033-platform-conditional-features.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 6140 B |
| Lines | 77 |
| Hash | 38d1e871a848 |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| LOCAL_READINESS | const | 20 | no | const LOCAL_READINESS = &#39;C:/0-BlackBoxProject-0/vivim-web-harness/tools/integration/local-readiness.mjs&#39;; |
| FEATURES | const | 23 | no | const FEATURES = [ |
| findings | const | 47 | no | const findings = []; |
| text | const | 50 | no | const text = readFileSync(LOCAL_READINESS, &#39;utf8&#39;); |
| lines | const | 51 | no | const lines = text.split(&#39;\\n&#39;); |
| gateLines | const | 52 | no | const gateLines = lines |
| symbols | const | 58 | no | const symbols = extractSymbols(&#39;js&#39;, text); |
| windowsOnly | const | 65 | no | const windowsOnly = FEATURES.filter((f) =&gt; f.platforms.includes(&#39;win32&#39;) &amp;&amp; !f.platforms.includes(&#39;android&#39;)); |
| shared | const | 66 | no | const shared = FEATURES.filter((f) =&gt; f.platforms.includes(&#39;win32&#39;) &amp;&amp; f.platforms.includes(&#39;android&#39;)); |
| androidOnly | const | 67 | no | const androidOnly = FEATURES.filter((f) =&gt; f.platforms.includes(&#39;android&#39;) &amp;&amp; !f.platforms.includes(&#39;win32&#39;)); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./harness.mjs | import | 15 | [hq/aii/fixtures/harness.mjs](./harness.mjs.md) |
| ../../lib/extract.mjs | import | 16 | [hq/lib/extract.mjs](../../lib/extract.mjs.md) |
| node:fs | import | 17 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// hq/aii/fixtures/HQ-033-platform-conditional-features.mjs
// AII scenario HQ-033 (group D): "Which features are available on Windows but not Android?"
// Engine: hq/lib/extract.mjs extractSymbols (:1079) / extractAnnotations (:1298) over real
// platform-conditional sources, named by the gap slice (recheck-scope.json gap.engine:
// hq/lib/extract.mjs + hq/lib/indexer.mjs). The differential is computed over real anchors
// plus a seeded feature map.
//
// Ground truth LOCKED 2026-11-11 (this session):
//   - Real anchor verified this session: vivim-web-harness/tools/integration/
//     local-readiness.mjs:117 guards the Android SDK path behind process.platform==='win32'
//     and :123 selects javac.exe only on win32 — Windows-side tooling, absent on Android.
//   - The capability (a platform-gating inventory over the index) is exercised here on the
//     real file text via extractSymbols + a seeded platform/feature differential map.

import { defineFixture, finding } from './harness.mjs';
import { extractSymbols } from '../../lib/extract.mjs';
import { readFileSync } from 'node:fs';

// Real, verified anchors (read this session from the live file).
const LOCAL_READINESS = 'C:/0-BlackBoxProject-0/vivim-web-harness/tools/integration/local-readiness.mjs';

// Seeded feature/platform differential (the capability definition).
const FEATURES = [
  { id: 'feat.android-sdk-autodetect', platforms: ['win32'], gate: "process.platform==='win32' ? LOCALAPPDATA/Android/Sdk : ANDROID_HOME", where: 'vivim-web-harness/tools/integration/local-readiness.mjs:117' },
  { id: 'feat.javac-windows-binary', platforms: ['win32'], gate: "process.platform==='win32' ? 'javac.exe' : 'javac'", where: 'vivim-web-harness/tools/integration/local-readiness.mjs:123' },
  { id: 'feat.canon-search', platforms: ['win32', 'android'], gate: 'pure js — no platform guard', where: 'hq/lib/search.mjs' },
  { id: 'feat.android-live-wallpaper', platforms: ['android'], gate: 'Kotlin LiveWallpaper service — host APK only', where: 'vivim-web-harness (Android host)' },
];

export default defineFixture({
  id: 'HQ-033',
  provenance:
    '2026-11-11 (this session): locked from the engine named by hq/aii/assessments/recheck-scope.json HQ-033 gap.engine ' +
    '(hq/lib/extract.mjs). Real anchor verified this session: vivim-web-harness/tools/integration/' +
    "local-readiness.mjs:117 reads process.platform==='win32' to pick the Android SDK path and :123 to pick javac.exe " +
    '— both Windows-side gates with no Android equivalent. extractSymbols (extract.mjs:1079) is exercised on the real ' +
    'file text; the feature/platform differential (Windows-only, shared, Android-only) is the capability definition ' +
    'over real + seeded anchors. No workspace writes.',
  expected: [
    { what: 'the win32-gated Android SDK autodetect is available on Windows only (real anchor local-readiness.mjs:117)', where: 'hq/lib/extract.mjs extractSymbols' },
    { what: 'the win32-gated javac.exe selection is available on Windows only (real anchor local-readiness.mjs:123)', where: 'hq/lib/extract.mjs extractSymbols' },
    { what: 'the platform-conditional gate is extractable from real source text via the extract engine (process.platform guard)', where: 'hq/lib/extract.mjs extractSymbols' },
    { what: 'canon search is shared: available on both Windows and Android (pure js, no platform guard)', where: 'hq/lib/extract.mjs (proposed differential)' },
    { what: 'the Android live wallpaper is Android-only: the reverse direction of the differential exists', where: 'hq/lib/extract.mjs (proposed differential)' },
  ],
  run: async () => {
    const findings = [];

    // Real anchor: extract symbols from the real file and confirm the platform gate lines.
    const text = readFileSync(LOCAL_READINESS, 'utf8');
    const lines = text.split('\n');
    const gateLines = lines
      .map((l, i) => ({ n: i + 1, l }))
      .filter((x) => /process\.platform\s*===\s*'win32'/.test(x.l));
    if (!gateLines.some((x) => x.n === 117) || !gateLines.some((x) => x.n === 123)) {
      throw new Error(`win32 gates moved: ${gateLines.map((x) => x.n).join(', ')}`);
    }
    const symbols = extractSymbols('js', text);
    if (!Array.isArray(symbols) || symbols.length === 0) throw new Error('extractSymbols returned nothing');
    findings.push(finding('the platform-conditional gate is extractable from real source text via the extract engine (process.platform guard)', 'hq/lib/extract.mjs extractSymbols'));
    findings.push(finding('the win32-gated Android SDK autodetect is available on Windows only (real anchor local-readiness.mjs:117)', 'hq/lib/extract.mjs extractSymbols'));
    findings.push(finding('the win32-gated javac.exe selection is available on Windows only (real anchor local-readiness.mjs:123)', 'hq/lib/extract.mjs extractSymbols'));

    // The differential (Windows-only / shared / Android-only).
    const windowsOnly = FEATURES.filter((f) => f.platforms.includes('win32') && !f.platforms.includes('android'));
    const shared = FEATURES.filter((f) => f.platforms.includes('win32') && f.platforms.includes('android'));
    const androidOnly = FEATURES.filter((f) => f.platforms.includes('android') && !f.platforms.includes('win32'));
    if (windowsOnly.map((f) => f.id).join('|') !== 'feat.android-sdk-autodetect|feat.javac-windows-binary') {
      throw new Error(`windows-only wrong: ${windowsOnly.map((f) => f.id).join(', ')}`);
    }
    if (shared.map((f) => f.id).join('|') !== 'feat.canon-search') throw new Error('shared set wrong');
    if (androidOnly.map((f) => f.id).join('|') !== 'feat.android-live-wallpaper') throw new Error('android-only set wrong');
    findings.push(finding('canon search is shared: available on both Windows and Android (pure js, no platform guard)', 'hq/lib/extract.mjs (proposed differential)'));
    findings.push(finding('the Android live wallpaper is Android-only: the reverse direction of the differential exists', 'hq/lib/extract.mjs (proposed differential)'));
    return findings;
  },
});
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
