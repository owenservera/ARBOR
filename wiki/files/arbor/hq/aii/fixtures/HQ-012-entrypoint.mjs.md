# File: hq/aii/fixtures/HQ-012-entrypoint.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/aii/fixtures/HQ-012-entrypoint.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 4105 B |
| Lines | 55 |
| Hash | 19a09a93faef |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| findings | const | 24 | no | const findings = []; |
| fs | const | 25 | no | const fs = await import(&#39;node:fs&#39;); |
| pj | const | 28 | no | const pj = JSON.parse(fs.readFileSync(&#39;package.json&#39;, &#39;utf8&#39;)); |
| file | const | 33 | no | const file = runHq([&#39;file&#39;, &#39;hq/bin/hq.mjs&#39;]); |
| lines | const | 35 | no | const lines = file.stdout.split(&#39;\\n&#39;); |
| pathLine | const | 36 | no | const pathLine = lines[0] ?? &#39;&#39;; |
| metaLine | const | 39 | no | const metaLine = lines[1] ?? &#39;&#39;; |
| m | const | 40 | no | const m = /^javascript \\\| source \\\| \\d+ lines/.exec(metaLine); |
| src | const | 45 | no | const src = fs.readFileSync(&#39;hq/bin/hq.mjs&#39;, &#39;utf8&#39;).split(/\\r?\\n/); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./harness.mjs | import | 10 | [hq/aii/fixtures/harness.mjs](./harness.mjs.md) |
| node:fs | dynamic | 25 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// hq/aii/fixtures/HQ-012-entrypoint.mjs — AII benchmark fixture (PRD HQ-PRD-AII-001).
// Scenario HQ-012 (group B): "Where does the application really start executing?"
// Ground truth locked from live outputs 2026-11-11:
//   package.json:13 scripts.hq = "bun hq/bin/hq.mjs" (the bin entry point).
//   bun hq/bin/hq.mjs file hq/bin/hq.mjs -> "repos-hq/hq/bin/hq.mjs" / "javascript | source | N lines"
//     (cmdFile hq/bin/hq.mjs:639-669). The line count drifts as concurrent lanes edit the engine,
//     so it is re-derived live rather than pinned.
//   hq/bin/hq.mjs:1-2 shebang "#!/usr/bin/env node" + CLI surface comment;
//     hq/bin/hq.mjs:85 assertToolchain() is the first real work (before any command runs).
import { defineFixture, finding, runHq } from './harness.mjs';

export default defineFixture({
  id: 'HQ-012',
  provenance: 'Locked at authoring time 2026-11-11 from cat package.json (scripts.hq = bun hq/bin/hq.mjs), bun hq/bin/hq.mjs file hq/bin/hq.mjs (repos-hq/hq/bin/hq.mjs, javascript source), and direct reading of hq/bin/hq.mjs lines 1-2 (shebang + CLI surface) and line 85 (assertToolchain first real work). Re-derived at run time by re-reading package.json, re-running hq file, and re-reading hq/bin/hq.mjs.',
  expected: [
    { what: 'package.json scripts.hq = bun hq/bin/hq.mjs (the bin entry point)', where: 'package.json' },
    { what: 'hq file hq/bin/hq.mjs reports repos-hq/hq/bin/hq.mjs', where: 'hq/bin/hq.mjs file hq/bin/hq.mjs' },
    { what: /^hq file hq\/bin\/hq\.mjs reports javascript \| source \| \d+ lines$/, where: 'hq/bin/hq.mjs file hq/bin/hq.mjs' },
    { what: 'hq/bin/hq.mjs line 1 shebang #!/usr/bin/env node', where: 'hq/bin/hq.mjs line 1' },
    { what: 'hq/bin/hq.mjs line 2 declares the HQ command surface', where: 'hq/bin/hq.mjs line 2' },
    { what: 'hq/bin/hq.mjs line 85 assertToolchain() is the first real work', where: 'hq/bin/hq.mjs line 85' },
  ],
  run: async () => {
    const findings = [];
    const fs = await import('node:fs');

    // package.json registers the hq entry point.
    const pj = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    if (pj.scripts.hq !== 'bun hq/bin/hq.mjs') throw new Error(`unexpected scripts.hq: ${pj.scripts.hq}`);
    findings.push(finding('package.json scripts.hq = bun hq/bin/hq.mjs (the bin entry point)', 'package.json'));

    // hq file reports the indexed entry-point file metadata.
    const file = runHq(['file', 'hq/bin/hq.mjs']);
    if (file.exit !== 0) throw new Error(`hq file failed: exit=${file.exit} stderr=${file.stderr}`);
    const lines = file.stdout.split('\n');
    const pathLine = lines[0] ?? '';
    if (pathLine !== 'repos-hq/hq/bin/hq.mjs') throw new Error(`unexpected hq file path line: ${JSON.stringify(pathLine)}`);
    findings.push(finding('hq file hq/bin/hq.mjs reports repos-hq/hq/bin/hq.mjs', 'hq/bin/hq.mjs file hq/bin/hq.mjs'));
    const metaLine = lines[1] ?? '';
    const m = /^javascript \| source \| \d+ lines/.exec(metaLine);
    if (!m) throw new Error(`unexpected hq file meta line: ${JSON.stringify(metaLine)}`);
    findings.push(finding(`hq file hq/bin/hq.mjs reports ${m[0]}`, 'hq/bin/hq.mjs file hq/bin/hq.mjs'));

    // The source itself: shebang, CLI surface comment, and the first real work.
    const src = fs.readFileSync('hq/bin/hq.mjs', 'utf8').split(/\r?\n/);
    if (src[0] !== '#!/usr/bin/env node') throw new Error(`unexpected line 1: ${JSON.stringify(src[0])}`);
    findings.push(finding('hq/bin/hq.mjs line 1 shebang #!/usr/bin/env node', 'hq/bin/hq.mjs line 1'));
    if (!src[1].includes('hq/bin/hq.mjs — HQ command surface')) throw new Error(`unexpected line 2: ${JSON.stringify(src[1])}`);
    findings.push(finding('hq/bin/hq.mjs line 2 declares the HQ command surface', 'hq/bin/hq.mjs line 2'));
    if (src[84] !== 'assertToolchain();') throw new Error(`unexpected line 85: ${JSON.stringify(src[84])}`);
    findings.push(finding('hq/bin/hq.mjs line 85 assertToolchain() is the first real work', 'hq/bin/hq.mjs line 85'));

    return findings;
  },
});
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
