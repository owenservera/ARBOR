# File: studio/ui-preview/build.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | studio/ui-preview/build.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 2927 B |
| Lines | 40 |
| Hash | 974535466ff5 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| here | const | 6 | no | const here = path.dirname(fileURLToPath(import.meta.url)); |
| root | const | 7 | no | const root = path.resolve(here, &#39;..&#39;); |
| source | const | 8 | no | const source = path.join(root, &#39;src&#39;, &#39;studio&#39;, &#39;ui&#39;); |
| defaultOutput | const | 9 | no | const defaultOutput = path.join(here, &#39;dist&#39;); |
| modules | const | 10 | no | const modules = [&#39;chat.mjs&#39;, &#39;world-view.mjs&#39;, &#39;universal-chat.mjs&#39;]; |
| jsTag | const | 11 | no | const jsTag = &#39;&lt;script type=&quot;module&quot; src=&quot;/ui/chat.mjs&quot;&gt;&lt;/script&gt;&#39;; |
| css | const | 12 | no | const css = [ |
| badge | const | 19 | no | const badge = &#39;&lt;aside class=&quot;vivim-preview-label&quot; role=&quot;status&quot;&gt;VIVIM UI PREVIEW · DEMO DATA&lt;span&gt;Read-only sample content. No provider connection or data writes.&lt;/span&gt;&lt;/aside&gt;&#39;; |
| buildPreview | function | 21 | yes | export function buildPreview(outputDir = defaultOutput) { |
| html | variable | 22 | no | let html = readFileSync(path.join(source, &#39;chat.html&#39;), &#39;utf8&#39;); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 2 | external |
| node:path | import | 3 | external |
| node:url | import | 4 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/ui-preview/serve.mjs](./serve.mjs.md) | ./build.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Frontend-only preview; generated files always come from the canonical Harness UI.
import { readFileSync, writeFileSync, mkdirSync, cpSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const source = path.join(root, 'src', 'studio', 'ui');
const defaultOutput = path.join(here, 'dist');
const modules = ['chat.mjs', 'world-view.mjs', 'universal-chat.mjs'];
const jsTag = '<script type="module" src="/ui/chat.mjs"></script>';
const css = [
  '.vivim-preview-label { position: fixed; right: 16px; bottom: 16px; z-index: 999; max-width: min(320px, calc(100vw - 32px));',
  'padding: 12px 15px; border: 1px solid #7194c8; border-radius: 12px; background: #081626ef;',
  'color: #e8f1ff; box-shadow: 0 8px 36px #0009; font: 700 12px/1.4 Segoe UI,system-ui,sans-serif; text-align: center; }',
  '.vivim-preview-label span { display: block; color: #a7bddb; font-size: 11px; font-weight: 400; }',
  '.vivim-preview-disabled { color: #8eabc8; font-size: 12px; border: 1px solid #2c3d54; border-radius: 8px; padding: 10px; }',
].join('\n');
const badge = '<aside class="vivim-preview-label" role="status">VIVIM UI PREVIEW · DEMO DATA<span>Read-only sample content. No provider connection or data writes.</span></aside>';

export function buildPreview(outputDir = defaultOutput) {
  let html = readFileSync(path.join(source, 'chat.html'), 'utf8');
  if (!html.includes(jsTag) || !html.includes('<body class="vivim-app">') || !html.includes('</style>'))
    throw new Error('Canonical VIVIM HTML has changed; review the preview builder');
  html = html.replace(jsTag, '<script type="module" src="/ui/preview-fixture.mjs"></script>\n' + jsTag)
    .replace('</style>', css + '\n</style>')
    .replace('<body class="vivim-app">', '<body class="vivim-app vivim-preview">')
    .replace('</body>', badge + '\n</body>')
    .replace('<a href="/">Advanced Studio</a>', '<span class="vivim-preview-disabled">Advanced Studio · local only</span>')
    .replace('<a href="/drive">Calibrate sites</a>', '<span class="vivim-preview-disabled">Site calibration · local only</span>')
    .replace('Connect your AI</button>', 'Explore connection UI</button>');
  rmSync(outputDir, { recursive: true, force: true });
  mkdirSync(path.join(outputDir, 'ui'), { recursive: true });
  writeFileSync(path.join(outputDir, 'index.html'), html);
  for (const name of modules) cpSync(path.join(source, name), path.join(outputDir, 'ui', name));
  cpSync(path.join(here, 'preview-fixture.mjs'), path.join(outputDir, 'ui', 'preview-fixture.mjs'));
  return { outputDir, modules, htmlBytes: Buffer.byteLength(html) };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  process.stdout.write(JSON.stringify(buildPreview()) + '\n');
```

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
