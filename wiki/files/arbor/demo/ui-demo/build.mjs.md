# File: demo/ui-demo/build.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | demo/ui-demo/build.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 2628 B |
| Lines | 47 |
| Hash | 99aeca6e6a52 |
| Test | no |
| Generated | no |
| Component | demo |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| here | const | 9 | no | const here = path.dirname(fileURLToPath(import.meta.url)); |
| repo | const | 10 | no | const repo = path.resolve(here, &#39;..&#39;, &#39;..&#39;); |
| mobileRelay | const | 11 | no | const mobileRelay = path.join(repo, &#39;apps&#39;, &#39;mobile-relay&#39;); |
| hostPublic | const | 12 | no | const hostPublic = path.join(repo, &#39;apps&#39;, &#39;vivim-host&#39;, &#39;public&#39;); |
| defaultOutput | const | 13 | no | const defaultOutput = path.join(here, &#39;dist&#39;); |
| buildDemo | function | 15 | yes | export function buildDemo(outputDir = defaultOutput) { |
| indexPath | const | 31 | no | const indexPath = path.join(outputDir, &#39;index.html&#39;); |
| html | variable | 32 | no | let html = readFileSync(indexPath, &#39;utf8&#39;); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 5 | external |
| node:path | import | 6 | external |
| node:url | import | 7 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [demo/ui-demo/serve.mjs](./serve.mjs.md) | ./build.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// VIVIM UI demo build — baseline walkthrough harness.
// Copies the real PWA entry files into dist/, injects the mocked-transport fixture
// and the walkthrough controller script tag. Backend zero: product files are static;
// every product-API read comes from the fixture layer and every product-API write is 405'd.
import { readFileSync, writeFileSync, mkdirSync, cpSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '..', '..');
const mobileRelay = path.join(repo, 'apps', 'mobile-relay');
const hostPublic = path.join(repo, 'apps', 'vivim-host', 'public');
const defaultOutput = path.join(here, 'dist');

export function buildDemo(outputDir = defaultOutput) {
  rmSync(outputDir, { recursive: true, force: true });
  mkdirSync(outputDir, { recursive: true });

  // 1. Real PWA entry files (as specified by the harness brief).
  cpSync(path.join(mobileRelay, 'index.html'), path.join(outputDir, 'index.html'));
  cpSync(path.join(mobileRelay, 'app.js'), path.join(outputDir, 'app.js'));
  cpSync(path.join(mobileRelay, 'ux'), path.join(outputDir, 'ux'), { recursive: true });
  cpSync(path.join(mobileRelay, 'generative-ui'), path.join(outputDir, 'generative-ui'), { recursive: true });
  cpSync(path.join(hostPublic, 'vivim-tokens.css'), path.join(outputDir, 'vivim-tokens.css'));

  // 2. Fixture module (mocked transport) + walkthrough controller.
  cpSync(path.join(here, 'fixture', 'mocked-transport.mjs'), path.join(outputDir, 'mocked-transport.mjs'));
  cpSync(path.join(here, 'controller.js'), path.join(outputDir, 'controller.js'));

  // 3. Inject into the copied entry: design tokens + fixture + controller script tags.
  const indexPath = path.join(outputDir, 'index.html');
  let html = readFileSync(indexPath, 'utf8');
  if (!html.includes('</head>') || !html.includes('</body>')) {
    throw new Error('Copied PWA entry has changed; review the demo builder');
  }
  html = html.replace('</head>', '<link rel="stylesheet" href="/vivim-tokens.css">\n</head>');
  html = html.replace('</body>', '<script type="module" src="/mocked-transport.mjs"></script>\n<script type="module" src="/controller.js"></script>\n</body>');
  writeFileSync(indexPath, html);
  return {
    outputDir,
    files: ['index.html', 'app.js', 'ux/', 'generative-ui/', 'vivim-tokens.css', 'mocked-transport.mjs', 'controller.js']
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.stdout.write(JSON.stringify(buildDemo()) + '\n');
}
```

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
