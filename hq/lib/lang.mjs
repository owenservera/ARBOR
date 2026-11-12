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
  if (/(^|\/)(test|tests|__tests__|spec|specs|fixtures?|e2e|cypress|playwright)\//.test(p)) return true;
  const name = basename(p);
  return /\.(test|spec)\.(mjs|js|cjs|ts|tsx|jsx|py|go|rs|java|kt|cs)$/.test(name)
    || /_test\.(py|go|rs|exs)$/.test(name)
    || /^test_.*\.py$/.test(name);
}

// Generated/vendored paths that should never be indexed as source of truth.
export function isGeneratedPath(path) {
  const p = toPosix(path).toLowerCase();
  return /(^|\/)(node_modules|dist|build|out|\.next|\.nuxt|\.svelte-kit|\.turbo|\.parcel-cache|coverage|generated|__generated__|gen|vendor|third_party)\//.test(p)
    || /\.(min|bundle)\.(js|css|mjs)$/.test(p)
    || /\.map$/.test(p)
    || /(^|\/)[^.]+\.lock$/.test(p)
    || /(^|\/)(package-lock\.json|bun\.lockb|yarn\.lock|pnpm-lock\.yaml)$/.test(p);
}

// componentOf — the ownership bucket used by the graph, feed and brief.
// `apps/foo/src/x` → `foo`; `harness/src/x` → `harness`; `README.md` → `root`.
export function componentOf(path, knownProjectNames = []) {
  const segs = toPosix(path).split('/').filter(Boolean);
  if (!segs.length) return 'root';
  if (segs.length === 1) return 'root';
  const first = segs[0];
  if (['apps', 'packages', 'services', 'modules', 'libs', 'projects'].includes(first) && segs[1]) return segs[1];
  if (first === 'src' && knownProjectNames.includes(segs[1])) return segs[1];
  return first;
}

export function languageLabel(lang) {
  const labels = {
    javascript: 'JavaScript', typescript: 'TypeScript', python: 'Python', go: 'Go',
    rust: 'Rust', java: 'Java', kotlin: 'Kotlin', scala: 'Scala', csharp: 'C#',
    fsharp: 'F#', vbnet: 'VB.NET', c: 'C', cpp: 'C++', ruby: 'Ruby', php: 'PHP',
    swift: 'Swift', lua: 'Lua', shell: 'Shell', powershell: 'PowerShell',
    sql: 'SQL', vue: 'Vue', svelte: 'Svelte', markdown: 'Markdown', text: 'Text',
    json: 'JSON', yaml: 'YAML', toml: 'TOML', ini: 'INI', xml: 'XML', html: 'HTML',
    css: 'CSS', csv: 'CSV', graphql: 'GraphQL', protobuf: 'Protobuf', other: 'Other',
  };
  return labels[lang] || lang;
}
