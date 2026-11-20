# File: hq/lib/lang.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/lib/lang.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 5167 B |
| Lines | 121 |
| Hash | d9a8315737d0 |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| BY_EXT | const | 5 | no | const BY_EXT = { |
| BINARY_EXT | const | 38 | no | const BINARY_EXT = new Set([ &#39;.png&#39;, &#39;.jpg&#39;, &#39;.jpeg&#39;, &#39;.gif&#39;, &#39;.webp&#39;, &#39;.bmp&#39;, &#39;.ico&#39;, &#39;.tif&#39;, &#39;.tiff&#39;, &#39;.woff&#39;, &#39;.woff2&#39;, &#39;.ttf&#39;, &#39;.otf&#39;, &#39;.eot&#39;, &#39;.zip&#39;, &#39;.gz&#39;, &#39;.tgz&#39;, &#39;.bz2&#39;, &#39;.xz&#39;, &#39;.7z&#39;, &#39;.rar&#39;,… |
| DOC_LANGS | const | 49 | no | const DOC_LANGS = new Set([&#39;markdown&#39;, &#39;text&#39;]); |
| CONFIG_LANGS | const | 50 | no | const CONFIG_LANGS = new Set([&#39;json&#39;, &#39;yaml&#39;, &#39;toml&#39;, &#39;ini&#39;, &#39;xml&#39;]); |
| DATA_LANGS | const | 51 | no | const DATA_LANGS = new Set([&#39;csv&#39;]); |
| detectLang | function | 53 | yes | export function detectLang(path) { |
| p | const | 54 | no | const p = toPosix(path); |
| ext | const | 55 | no | const ext = extname(p).toLowerCase(); |
| lang | const | 56 | no | const lang = BY_EXT[ext] \|\| &#39;other&#39;; |
| kind | variable | 57 | no | let kind = &#39;source&#39;; |
| isSourceLang | function | 66 | yes | export function isSourceLang(lang) { |
| isDocPath | function | 70 | yes | export function isDocPath(path) { |
| isConfigPath | function | 74 | yes | export function isConfigPath(path) { |
| isTestPath | function | 79 | yes | export function isTestPath(path) { |
| p | const | 80 | no | const p = toPosix(path).toLowerCase(); |
| name | const | 82 | no | const name = basename(p); |
| isGeneratedPath | function | 89 | yes | export function isGeneratedPath(path) { |
| p | const | 90 | no | const p = toPosix(path).toLowerCase(); |
| componentOf | function | 100 | yes | export function componentOf(path, knownProjectNames = []) { |
| segs | const | 101 | no | const segs = toPosix(path).split(&#39;/&#39;).filter(Boolean); |
| first | const | 104 | no | const first = segs[0]; |
| languageLabel | function | 110 | yes | export function languageLabel(lang) { |
| labels | const | 111 | no | const labels = { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:path | import | 2 | external |
| ./util.mjs | import | 3 | [hq/lib/util.mjs](./util.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [hq/lib/indexer.mjs](./indexer.mjs.md) | ./lang.mjs |
| [hq/lib/lake.mjs](./lake.mjs.md) | ./lang.mjs |
| [hq/lib/walk.mjs](./walk.mjs.md) | ./lang.mjs |
| [hq/lib/wiki.mjs](./wiki.mjs.md) | ./lang.mjs |
| [hq/test/context-ranking.test.mjs](../test/context-ranking.test.mjs.md) | ../lib/lang.mjs |
| [hq/test/context.test.mjs](../test/context.test.mjs.md) | ../lib/lang.mjs |
| [hq/test/foundation.test.mjs](../test/foundation.test.mjs.md) | ../lib/lang.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// hq/lib/lang.mjs — language + file-kind detection. Deterministic, extension-first.
import { extname, basename } from 'node:path';
import { toPosix } from './util.mjs';

const BY_EXT = {
  '.mjs': 'javascript', '.js': 'javascript', '.cjs': 'javascript', '.jsx': 'javascript',
  '.ts': 'typescript', '.tsx': 'typescript', '.mts': 'typescript', '.cts': 'typescript',
  '.py': 'python', '.pyi': 'python',
  '.go': 'go',
  '.rs': 'rust',
  '.java': 'java',
  '.kt': 'kotlin', '.kts': 'kotlin',
  '.scala': 'scala',
  '.cs': 'csharp', '.fs': 'fsharp', '.vb': 'vbnet',
  '.c': 'c', '.h': 'c',
  '.cc': 'cpp', '.cpp': 'cpp', '.cxx': 'cpp', '.hpp': 'cpp', '.hh': 'cpp', '.hxx': 'cpp',
  '.rb': 'ruby',
  '.php': 'php',
  '.swift': 'swift',
  '.lua': 'lua',
  '.sh': 'shell', '.bash': 'shell', '.zsh': 'shell',
  '.ps1': 'powershell', '.psm1': 'powershell',
  '.sql': 'sql',
  '.vue': 'vue', '.svelte': 'svelte',
  '.md': 'markdown', '.mdx': 'markdown', '.markdown': 'markdown',
  '.txt': 'text', '.rst': 'text',
  '.json': 'json', '.jsonc': 'json', '.json5': 'json',
  '.yaml': 'yaml', '.yml': 'yaml',
  '.toml': 'toml',
  '.ini': 'ini', '.cfg': 'ini', '.conf': 'ini', '.properties': 'ini',
  '.xml': 'xml', '.html': 'html', '.htm': 'html',
  '.css': 'css', '.scss': 'css', '.sass': 'css', '.less': 'css',
  '.csv': 'csv', '.tsv': 'csv',
  '.graphql': 'graphql', '.gql': 'graphql',
  '.proto': 'protobuf',
};

const BINARY_EXT = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.ico', '.tif', '.tiff',
  '.woff', '.woff2', '.ttf', '.otf', '.eot',
  '.zip', '.gz', '.tgz', '.bz2', '.xz', '.7z', '.rar',
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  '.exe', '.dll', '.so', '.dylib', '.bin', '.o', '.a', '.lib', '.obj', '.pdb',
  '.mp3', '.mp4', '.mov', '.avi', '.mkv', '.wav', '.flac',
  '.class', '.jar', '.war', '.apk', '.aab', '.msi', '.dmg', '.iso',
  '.pyc', '.pyo', '.wasm', '.sqlite', '.sqlite3', '.db',
]);

const DOC_LANGS = new Set(['markdown', 'text']);
const CONFIG_LANGS = new Set(['json', 'yaml', 'toml', 'ini', 'xml']);
const DATA_LANGS = new Set(['csv']);

export function detectLang(path) {
  const p = toPosix(path);
  const ext = extname(p).toLowerCase();
  const lang = BY_EXT[ext] || 'other';
  let kind = 'source';
  if (BINARY_EXT.has(ext)) kind = 'binary';
  else if (DOC_LANGS.has(lang)) kind = 'doc';
  else if (CONFIG_LANGS.has(lang)) kind = 'config';
  else if (DATA_LANGS.has(lang)) kind = 'data';
  else if (lang === 'other') kind = 'other';
  return { lang, kind, ext };
}

export function isSourceLang(lang) {
  return !['other', 'markdown', 'text', 'json', 'yaml', 'toml', 'ini', 'xml', 'csv', 'binary'].includes(lang);
}

export function isDocPath(path) {
  return detectLang(path).kind === 'doc';
}

export function isConfigPath(path) {
  return detectLang(path).kind === 'config';
}

// Test paths: directory conventions and filename suffixes.
export function isTestPath(path) {
  const p = toPosix(path).toLowerCase();
```

_First 80 of 122 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
