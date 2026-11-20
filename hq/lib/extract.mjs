// hq/lib/extract.mjs — symbol, import and annotation extraction.
// CONTRACT (hq/CONTRACT.md): deterministic, dependency-free, 1-based lines.
//
// Design: every extractor is a pure function over `{lang, text}`. Comments and
// string literals are masked before symbol scanning so declarations inside
// comments/strings are never emitted. Annotations are scanned from a comment
// walk that is string-aware. Nothing here touches the filesystem or the clock.

const MAX_LINES = 30000;
const MAX_SIGNATURE = 240;
const MAX_ANNOTATION_TEXT = 500;

const KINDS = new Set([
  'function', 'class', 'method', 'const', 'type', 'interface', 'enum', 'route',
  'export', 'variable', 'struct', 'trait', 'module', 'table', 'view',
  'procedure', 'test',
]);

const ANNOTATION_KINDS = [
  'context', 'why', 'invariant', 'see', 'todo', 'owner', 'task', 'risk', 'deprecated',
];

// Statement-introducing words: never a return type at the start of a method
// declaration. (`void`, `static`, `public` are legal type/modifier words and
// deliberately absent.)
const STATEMENT_WORDS = new Set([
  'return', 'throw', 'new', 'else', 'if', 'for', 'while', 'switch', 'catch',
  'do', 'case', 'default', 'break', 'continue', 'yield', 'await', 'using',
  'delete', 'typeof', 'goto', 'sizeof', 'co_await', 'co_return', 'co_yield',
  'assert', 'raise', 'pass', 'include', 'require',
]);

// Structural/control words that must never surface as symbol names.
const CONTROL = new Set([
  'if', 'for', 'while', 'switch', 'catch', 'return', 'function', 'class',
  'const', 'let', 'var', 'import', 'from', 'use',
  'else', 'do', 'try', 'new', 'throw', 'case', 'default', 'break', 'continue',
  'typeof', 'instanceof', 'void', 'delete', 'yield', 'await', 'export',
  'extends', 'implements', 'package', 'def', 'end', 'then', 'begin', 'unless',
  'elif', 'except', 'finally', 'with', 'as', 'is', 'in', 'of', 'not', 'and',
  'or', 'assert', 'lambda', 'pass', 'raise', 'go', 'defer', 'select', 'range',
  'chan', 'struct', 'enum', 'interface', 'type', 'module', 'namespace', 'trait',
  'impl', 'fn', 'pub', 'static', 'public', 'private', 'protected', 'internal',
  'final', 'abstract', 'async', 'super', 'this', 'true', 'false', 'null',
  'undefined', 'override', 'virtual', 'sealed', 'readonly', 'where', 'match',
  'loop', 'until', 'foreach', 'using', 'record', 'init', 'func',
]);

// ---------------------------------------------------------------------------
// language helpers
// ---------------------------------------------------------------------------

function normLang(lang) {
  const l = String(lang ?? '').trim().toLowerCase();
  switch (l) {
    case 'js': case 'jsx': case 'node': return 'javascript';
    case 'ts': case 'tsx': return 'typescript';
    case 'cs': case 'c#': return 'csharp';
    case 'c++': case 'cc': case 'cxx': case 'h': case 'hpp': case 'hh': return 'cpp';
    case 'bash': case 'sh': case 'zsh': case 'shellscript': return 'shell';
    case 'ps1': case 'pwsh': case 'pwsh1': return 'powershell';
    case 'py': return 'python';
    default: return l;
  }
}

function commentCfg(lang) {
  switch (lang) {
    case 'python':
      return { line: ['#'], block: [] };
    case 'ruby':
      return { line: ['#'], block: [] };
    case 'shell':
      return { line: ['#'], block: [] };
    case 'powershell':
      return { line: ['#'], block: [{ start: '<#', end: '#>' }] };
    case 'lua':
      return { line: ['--'], block: [{ start: '--[[', end: ']]' }] };
    case 'sql':
      return { line: ['--'], block: [{ start: '/*', end: '*/' }] };
    case 'markdown': case 'text': case 'html': case 'mdx':
      return { line: [], block: [{ start: '<!--', end: '-->' }] };
    case 'vue': case 'svelte':
      return {
        line: ['//'],
        block: [{ start: '/*', end: '*/' }, { start: '<!--', end: '-->' }],
      };
    case 'php':
      return { line: ['//', '#'], block: [{ start: '/*', end: '*/' }] };
    default:
      return { line: ['//'], block: [{ start: '/*', end: '*/' }] };
  }
}

function toLines(text) {
  const raw = String(text ?? '').split(/\r?\n/);
  return raw.length > MAX_LINES ? raw.slice(0, MAX_LINES) : raw;
}

function indentOf(line) {
  const ws = /^[ \t]*/.exec(line)[0];
  let n = 0;
  for (const ch of ws) n += ch === '\t' ? 4 : 1;
  return n;
}

function okName(name) {
  if (!name) return false;
  const n = String(name);
  if (CONTROL.has(n.toLowerCase())) return false;
  if (!/^[A-Za-z_$#~@][\w$.:?!-]*$/.test(n)) return false;
  return true;
}

function mk(name, kind, line, endLine, signature, exported) {
  return {
    name,
    kind: KINDS.has(kind) ? kind : 'type',
    line,
    end_line: Math.max(line, endLine || line),
    signature: signature || name,
    exported: Boolean(exported),
  };
}

// ---------------------------------------------------------------------------
// lexing: comments + strings
// ---------------------------------------------------------------------------

// Return one entry per comment line: {line (1-based), text}. Strings are
// skipped so `const s = "# not a comment"` never yields a comment.
function scanComments(lines, cfg) {
  const out = [];
  let block = null;
  for (let li = 0; li < lines.length; li++) {
    const line = lines[li];
    let i = 0;
    while (i < line.length) {
      if (block) {
        const idx = line.indexOf(block.end, i);
        if (idx === -1) {
          out.push({ line: li + 1, text: cleanComment(line.slice(i)) });
          i = line.length;
        } else {
          out.push({ line: li + 1, text: cleanComment(line.slice(i, idx)) });
          i = idx + block.end.length;
          block = null;
        }
        continue;
      }
      const ch = line[i];
      if (ch === '"' || ch === "'" || ch === '`') {
        i = skipString(line, i);
        continue;
      }
      let started = null;
      for (const b of cfg.block) {
        if (line.startsWith(b.start, i)) { started = b; break; }
      }
      if (started) {
        block = started;
        i += started.start.length;
        continue;
      }
      let lineMarker = null;
      for (const m of cfg.line) {
        if (line.startsWith(m, i)) { lineMarker = m; break; }
      }
      if (lineMarker) {
        out.push({ line: li + 1, text: cleanComment(line.slice(i + lineMarker.length)) });
        break;
      }
      i++;
    }
  }
  return out;
}

function skipString(line, start) {
  const q = line[start];
  for (let j = start + 1; j < line.length; j++) {
    if (line[j] === '\\') { j++; continue; }
    if (line[j] === q) return j + 1;
  }
  return line.length;
}

function cleanComment(text) {
  return String(text ?? '')
    .replace(/^\s*\*+\s?/, '')
    .replace(/\s*\*\/\s*$/, '')
    .replace(/\s*-->\s*$/, '')
    .replace(/\s*#>\s*$/, '')
    .trim();
}

// Return the source with comments blanked (columns preserved). When
// `blankStrings` is true, string interiors are blanked too; import/annotation
// scanning keeps string contents.
function maskCode(lines, cfg, blankStrings) {
  const out = new Array(lines.length);
  let block = null;
  for (let li = 0; li < lines.length; li++) {
    const line = lines[li];
    const chars = line.split('');
    let i = 0;
    if (block) {
      const idx = line.indexOf(block.end, 0);
      if (idx === -1) {
        out[li] = ' '.repeat(line.length);
        continue;
      }
      const stop = Math.min(chars.length, idx + block.end.length);
      for (let k = 0; k < stop; k++) chars[k] = ' ';
      i = idx + block.end.length;
      block = null;
    }
    while (i < line.length) {
      const ch = line[i];
      if (ch === '"' || ch === "'" || ch === '`') {
        const end = skipString(line, i);
        if (blankStrings) {
          const closed = end > i + 1 && line[end - 1] === ch;
          const stop = closed ? end - 1 : end;
          for (let k = i + 1; k < stop; k++) chars[k] = ' ';
        }
        i = end;
        continue;
      }
      let started = null;
      for (const b of cfg.block) {
        if (line.startsWith(b.start, i)) { started = b; break; }
      }
      if (started) {
        const idx = line.indexOf(started.end, i + started.start.length);
        if (idx === -1) {
          for (let k = i; k < chars.length; k++) chars[k] = ' ';
          block = started;
          i = line.length;
        } else {
          const stop = idx + started.end.length;
          for (let k = i; k < stop; k++) chars[k] = ' ';
          i = stop;
        }
        continue;
      }
      let isLineComment = false;
      for (const m of cfg.line) {
        if (line.startsWith(m, i)) { isLineComment = true; break; }
      }
      if (isLineComment) {
        for (let k = i; k < chars.length; k++) chars[k] = ' ';
        break;
      }
      i++;
    }
    out[li] = chars.join('');
  }
  return out;
}

// For .vue/.svelte: keep only <script> blocks (line numbers preserved).
function scriptOnly(codeLines, originalLines) {
  const active = new Array(codeLines.length).fill(false);
  let inScript = false;
  let any = false;
  for (let i = 0; i < originalLines.length; i++) {
    const t = originalLines[i];
    if (!inScript && /<script\b/i.test(t)) {
      inScript = true;
      active[i] = true;
      any = true;
      if (/<\/script>/i.test(t)) inScript = false;
      continue;
    }
    if (inScript) {
      active[i] = true;
      if (/<\/script>/i.test(t)) inScript = false;
    }
  }
  if (!any) return codeLines;
  return codeLines.map((line, i) => (active[i] ? line : ''));
}

// ---------------------------------------------------------------------------
// structural helpers
// ---------------------------------------------------------------------------

function braceDepths(codeLines) {
  const depths = new Array(codeLines.length).fill(0);
  let depth = 0;
  for (let i = 0; i < codeLines.length; i++) {
    depths[i] = depth;
    const s = codeLines[i];
    for (let c = 0; c < s.length; c++) {
      if (s[c] === '{') depth++;
      else if (s[c] === '}') depth = Math.max(0, depth - 1);
    }
  }
  return depths;
}

// Match the first `{` at/after startLine to its closing `}` (best effort).
// A bodyless declaration (`type X = ...;`, `fun f() = 1`) must not borrow the
// brace of the next declaration: stop at `;` or at an obvious new declaration.
function braceRange(codeLines, startLine, depthBefore = null) {
  const stopRe = /^\s*(?:export|import|class|interface|enum|type|function|const|let|var|def|fn|func|fun|impl|struct|trait|mod|using|namespace|record|object|protocol|extension|actor|case|data|pub|val|attr)\b/;
  let depth = depthBefore ? (depthBefore[startLine] || 0) : 0;
  let startDepth = 0;
  let found = false;
  const openLine = startLine;
  for (let i = startLine; i < codeLines.length; i++) {
    const s = codeLines[i];
    if (i > startLine && !found) {
      const trimmed = s.trim();
      if (!trimmed) continue;
      if (stopRe.test(trimmed)) break;
      if (i - startLine > 6) break;
    }
    for (let c = 0; c < s.length; c++) {
      if (s[c] === '{') {
        if (!found) { found = true; startDepth = depth; }
        depth++;
      } else if (s[c] === ';' && !found) {
        return { openLine, closeLine: startLine, bodyDepth: startDepth + 1 };
      } else if (s[c] === '}') {
        depth--;
        if (found && depth === startDepth) {
          return { openLine, closeLine: i, bodyDepth: startDepth + 1 };
        }
      }
    }
  }
  return { openLine, closeLine: startLine, bodyDepth: startDepth + 1 };
}

function makeSignature(lines, idx, prefix = '') {
  let text = String(lines[idx] ?? '').trim();
  let balance = countChar(text, '(') - countChar(text, ')');
  let j = idx;
  while (balance > 0 && j + 1 < lines.length && j - idx < 4) {
    j++;
    const next = String(lines[j] ?? '').trim();
    text = text ? `${text} ${next}` : next;
    balance += countChar(next, '(') - countChar(next, ')');
  }
  let s = text.replace(/\s+/g, ' ').trim();
  if (prefix) s = `${prefix} ${s}`.replace(/\s+/g, ' ').trim();
  return s.length > MAX_SIGNATURE ? s.slice(0, MAX_SIGNATURE) : s;
}

function countChar(s, ch) {
  let n = 0;
  for (let i = 0; i < s.length; i++) if (s[i] === ch) n++;
  return n;
}

function firstNonBlankLine(lines, from) {
  for (let i = from; i < lines.length; i++) {
    const t = lines[i].trim();
    if (t) return { index: i, text: t };
  }
  return null;
}

// ---------------------------------------------------------------------------
// JavaScript / TypeScript / Vue / Svelte
// ---------------------------------------------------------------------------

function jsSymbols(lines, code, codeKeep) {
  const out = [];
  const n = code.length;
  const depthBefore = braceDepths(code);
  const classes = [];

  for (let i = 0; i < n; i++) {
    const t = code[i];
    if (!t || !t.trim()) continue;

    let m = /^\s*(export\s+(?:default\s+)?)?(?:declare\s+)?(?:abstract\s+)?class\s+([A-Za-z_$][\w$]*)/.exec(t);
    if (m && okName(m[2])) {
      const range = braceRange(code, i, depthBefore);
      out.push(mk(m[2], 'class', i + 1, range.closeLine + 1, makeSignature(lines, i), Boolean(m[1])));
      classes.push({ open: range.openLine, close: range.closeLine, bodyDepth: range.bodyDepth });
      continue;
    }

    m = /^\s*(export\s+(?:default\s+)?)?(?:declare\s+)?interface\s+([A-Za-z_$][\w$]*)/.exec(t);
    if (m && okName(m[2])) {
      const range = braceRange(code, i, depthBefore);
      out.push(mk(m[2], 'interface', i + 1, range.closeLine + 1, makeSignature(lines, i), Boolean(m[1])));
      continue;
    }

    m = /^\s*(export\s+(?:default\s+)?)?type\s+([A-Za-z_$][\w$]*)\s*(?:<[^>]*>)?\s*=/.exec(t);
    if (m && okName(m[2])) {
      const range = braceRange(code, i, depthBefore);
      out.push(mk(m[2], 'type', i + 1, range.closeLine + 1, makeSignature(lines, i), Boolean(m[1])));
      continue;
    }

    m = /^\s*(export\s+(?:default\s+)?)?(?:declare\s+)?(?:const\s+)?enum\s+([A-Za-z_$][\w$]*)/.exec(t);
    if (m && okName(m[2])) {
      const range = braceRange(code, i, depthBefore);
      out.push(mk(m[2], 'enum', i + 1, range.closeLine + 1, makeSignature(lines, i), Boolean(m[1])));
      continue;
    }

    m = /^\s*(export\s+)?(?:declare\s+)?(?:namespace|module)\s+([A-Za-z_$][\w$]*)\s*\{/.exec(t);
    if (m && okName(m[2])) {
      const range = braceRange(code, i, depthBefore);
      out.push(mk(m[2], 'module', i + 1, range.closeLine + 1, makeSignature(lines, i), Boolean(m[1])));
      continue;
    }

    m = /^\s*(export\s+(?:default\s+)?)?(?:declare\s+)?(?:async\s+)?function\s*\*?\s*([A-Za-z_$][\w$]*)/.exec(t);
    if (m && okName(m[2])) {
      const range = braceRange(code, i, depthBefore);
      out.push(mk(m[2], 'function', i + 1, range.closeLine + 1, makeSignature(lines, i), Boolean(m[1])));
      continue;
    }

    m = /^\s*(export\s+(?:default\s+)?)?(const|let|var)\s+([A-Za-z_$][\w$]*)\s*/.exec(t);
    if (m && okName(m[3])) {
      const isFn = jsIsFunctionBinding(code, i);
      const kind = isFn ? 'function' : (m[2] === 'const' ? 'const' : 'variable');
      const range = braceRange(code, i, depthBefore);
      out.push(mk(m[3], kind, i + 1, isFn ? range.closeLine + 1 : i + 1, makeSignature(lines, i), Boolean(m[1])));
      continue;
    }

    m = /^\s*export\s+default\s+([A-Za-z_$][\w$]*)\s*;?\s*$/.exec(t);
    if (m && okName(m[1])) {
      out.push(mk(m[1], 'export', i + 1, i + 1, makeSignature(lines, i), true));
      continue;
    }

    m = /^\s*export\s*\{([^}]*)\}/.exec(t);
    if (m) {
      for (const raw of m[1].split(',')) {
        const part = raw.trim();
        if (!part) continue;
        const asMatch = /\bas\s+([A-Za-z_$][\w$]*)\s*$/.exec(part);
        const name = asMatch ? asMatch[1] : part.split(/\s+/)[0];
        if (okName(name)) out.push(mk(name, 'export', i + 1, i + 1, m[0].trim(), true));
      }
    }

    m = /^\s*(?:module\.)?exports\.([A-Za-z_$][\w$]*)\s*=/.exec(t);
    if (m && okName(m[1])) {
      out.push(mk(m[1], 'export', i + 1, i + 1, makeSignature(lines, i), true));
    }
  }

  // class members
  for (const cls of classes) {
    for (let j = cls.open + 1; j < cls.close; j++) {
      if (depthBefore[j] !== cls.bodyDepth) continue;
      const t = code[j];
      if (!t || !t.trim()) continue;
      const m = /^\s*(?:(?:public|private|protected|static|async|abstract|readonly|override|declare)\s+)*([A-Za-z_$][\w$]*)\s*(?:<[^>]*>)?\s*\(/.exec(t);
      if (!m || !okName(m[1]) || CONTROL.has(m[1].toLowerCase())) continue;
      const range = braceRange(code, j, depthBefore);
      out.push(mk(m[1], 'method', j + 1, range.closeLine + 1, makeSignature(lines, j), !/\bprivate\b/.test(t)));
    }
  }

  // routes: app|router|server|fastify.get('path')
  const routeRe = /^\s*(?:app|router|server|fastify)\s*\.\s*(get|post|put|patch|delete|all)\s*\(\s*(['"`])([^'"`]+)\2/;
  for (let i = 0; i < n; i++) {
    const m = routeRe.exec(codeKeep[i] || '');
    if (m) {
      const method = m[1].toLowerCase();
      const routePath = m[3];
      out.push(mk(routePath, 'route', i + 1, i + 1, `${method.toUpperCase()} ${routePath}`, false));
    }
  }

  return out;
}

function jsIsFunctionBinding(code, idx) {
  const span = code.slice(idx, idx + 4).join(' ');
  const eq = span.indexOf('=');
  if (eq === -1) return false;
  const rhs = span.slice(eq + 1).trim();
  if (/^(?:async\s+)?function\b/.test(rhs)) return true;
  if (/^(?:async\s+)?(?:<[^>]*>\s*)?\([^)]*\)\s*(?::[^=]+)?=>/.test(rhs)) return true;
  if (/^(?:async\s+)?[A-Za-z_$][\w$]*\s*=>/.test(rhs)) return true;
  return false;
}

// ---------------------------------------------------------------------------
// Python
// ---------------------------------------------------------------------------

function pythonSymbols(lines, code) {
  const out = [];
  const stack = [];
  for (let i = 0; i < lines.length; i++) {
    const t = code[i];
    if (!t || !t.trim()) continue;
    const indent = indentOf(t);
    while (stack.length && stack[stack.length - 1].indent >= indent) stack.pop();
    const parent = stack[stack.length - 1];

    let m = /^(\s*)(async\s+)?def\s+([A-Za-z_]\w*)\s*\(/.exec(t);
    if (m && okName(m[3])) {
      const kind = parent && parent.kind === 'class' ? 'method' : 'function';
      const end = pythonEnd(lines, i, indent);
      const deco = pythonDecorator(lines, i, indent);
      out.push(mk(m[3], kind, i + 1, end, makeSignature(lines, i, deco), !m[3].startsWith('_')));
      stack.push({ indent, kind: 'def' });
      continue;
    }

    m = /^(\s*)class\s+([A-Za-z_]\w*)/.exec(t);
    if (m && okName(m[2])) {
      const end = pythonEnd(lines, i, indent);
      const deco = pythonDecorator(lines, i, indent);
      out.push(mk(m[2], 'class', i + 1, end, makeSignature(lines, i, deco), !m[2].startsWith('_')));
      stack.push({ indent, kind: 'class' });
      continue;
    }

    if (indent === 0 && !parent) {
      m = /^([A-Za-z_]\w*)\s*(?::[^=]+)?=(?!=)/.exec(t);
      if (m && okName(m[1])) {
        out.push(mk(m[1], 'variable', i + 1, i + 1, makeSignature(lines, i), !m[1].startsWith('_')));
      }
    }
  }
  return out;
}

function pythonDecorator(lines, idx, indent) {
  let prev = idx - 1;
  while (prev >= 0 && !String(lines[prev] ?? '').trim()) prev--;
  if (prev < 0) return '';
  const t = lines[prev].trim();
  if (!t.startsWith('@') || indentOf(lines[prev]) !== indent) return '';
  return t;
}

function pythonEnd(lines, idx, indent) {
  let last = idx;
  for (let j = idx + 1; j < lines.length; j++) {
    const t = lines[j];
    if (!t.trim()) continue;
    if (indentOf(t) <= indent) break;
    last = j;
  }
  return last + 1;
}

// ---------------------------------------------------------------------------
// Go
// ---------------------------------------------------------------------------

function goSymbols(lines, code) {
  const out = [];
  const depthBefore = braceDepths(code);
  for (let i = 0; i < lines.length; i++) {
    const t = code[i];
    if (!t || !t.trim()) continue;

    let m = /^\s*func\s+(?:\(([^)]*)\)\s*)?([A-Za-z_]\w*)\s*[\(\[]/.exec(t);
    if (m && okName(m[2])) {
      const receiver = m[1] ? m[1].trim() : '';
      const kind = receiver ? 'method' : 'function';
      const range = braceRange(code, i, depthBefore);
      out.push(mk(m[2], kind, i + 1, range.closeLine + 1, makeSignature(lines, i), /^[A-Z]/.test(m[2])));
      continue;
    }

    m = /^\s*type\s+([A-Za-z_]\w*)\s+(struct|interface)\b/.exec(t);
    if (m && okName(m[1])) {
      const range = braceRange(code, i, depthBefore);
      out.push(mk(m[1], m[2], i + 1, range.closeLine + 1, makeSignature(lines, i), /^[A-Z]/.test(m[1])));
      continue;
    }

    m = /^\s*type\s+([A-Za-z_]\w*)\s*(?:\[[^\]]*\])?\s*=/.exec(t);
    if (m && okName(m[1])) {
      out.push(mk(m[1], 'type', i + 1, i + 1, makeSignature(lines, i), /^[A-Z]/.test(m[1])));
      continue;
    }

    m = /^\s*(const|var)\s+([A-Za-z_]\w*)/.exec(t);
    if (m && okName(m[2])) {
      out.push(mk(m[2], m[1] === 'const' ? 'const' : 'variable', i + 1, i + 1, makeSignature(lines, i), /^[A-Z]/.test(m[2])));
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Rust
// ---------------------------------------------------------------------------

function rustSymbols(lines, code) {
  const out = [];
  const depthBefore = braceDepths(code);
  const impls = [];
  for (let i = 0; i < lines.length; i++) {
    if (/^\s*(?:pub(?:\([^)]*\))?\s+)?impl\b/.test(code[i])) {
      const range = braceRange(code, i, depthBefore);
      impls.push(range);
    }
  }
  const inImpl = (i) => impls.some((r) => i > r.openLine && i < r.closeLine);

  for (let i = 0; i < lines.length; i++) {
    const t = code[i];
    if (!t || !t.trim()) continue;

    let m = /^\s*(pub(?:\([^)]*\))?\s+)?(?:(?:async|const|unsafe|extern(?:\s+"[^"]*")?|default)\s+)*fn\s+([A-Za-z_]\w*)/.exec(t);
    if (m && okName(m[2])) {
      const range = braceRange(code, i, depthBefore);
      out.push(mk(m[2], inImpl(i) ? 'method' : 'function', i + 1, range.closeLine + 1, makeSignature(lines, i), Boolean(m[1])));
      continue;
    }

    m = /^\s*(pub(?:\([^)]*\))?\s+)?struct\s+([A-Za-z_]\w*)/.exec(t);
    if (m && okName(m[2])) {
      const range = braceRange(code, i, depthBefore);
      out.push(mk(m[2], 'struct', i + 1, range.closeLine + 1, makeSignature(lines, i), Boolean(m[1])));
      continue;
    }

    m = /^\s*(pub(?:\([^)]*\))?\s+)?enum\s+([A-Za-z_]\w*)/.exec(t);
    if (m && okName(m[2])) {
      const range = braceRange(code, i, depthBefore);
      out.push(mk(m[2], 'enum', i + 1, range.closeLine + 1, makeSignature(lines, i), Boolean(m[1])));
      continue;
    }

    m = /^\s*(pub(?:\([^)]*\))?\s+)?trait\s+([A-Za-z_]\w*)/.exec(t);
    if (m && okName(m[2])) {
      const range = braceRange(code, i, depthBefore);
      out.push(mk(m[2], 'trait', i + 1, range.closeLine + 1, makeSignature(lines, i), Boolean(m[1])));
      continue;
    }

    m = /^\s*(pub(?:\([^)]*\))?\s+)?mod\s+([A-Za-z_]\w*)/.exec(t);
    if (m && okName(m[2])) {
      const range = braceRange(code, i, depthBefore);
      out.push(mk(m[2], 'module', i + 1, range.closeLine + 1, makeSignature(lines, i), Boolean(m[1])));
      continue;
    }

    m = /^\s*(pub(?:\([^)]*\))?\s+)?(const|static)\s+([A-Za-z_]\w*)\s*:/.exec(t);
    if (m && okName(m[3])) {
      out.push(mk(m[3], 'const', i + 1, i + 1, makeSignature(lines, i), Boolean(m[1])));
      continue;
    }

    m = /^\s*(pub(?:\([^)]*\))?\s+)?type\s+([A-Za-z_]\w*)/.exec(t);
    if (m && okName(m[2])) {
      out.push(mk(m[2], 'type', i + 1, i + 1, makeSignature(lines, i), Boolean(m[1])));
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// C-family statically typed languages (C#, Java, Kotlin, Scala, Swift, PHP)
// ---------------------------------------------------------------------------

function matchType(lang, t) {
  let re;
  switch (lang) {
    case 'csharp':
      re = /^(\s*(?:(?:public|private|protected|internal|static|sealed|abstract|partial|readonly|unsafe|new|file)\s+)*)(class|interface|enum|record|struct)\s+([A-Za-z_]\w*)/;
      break;
    case 'java':
      re = /^(\s*(?:(?:public|private|protected|static|final|abstract|sealed|non-sealed|strictfp)\s+)*)(class|interface|enum|record)\s+([A-Za-z_]\w*)/;
      break;
    case 'kotlin':
      re = /^(\s*(?:(?:public|private|protected|internal|open|final|abstract|sealed|data|enum|annotation|value|inline|fun|expect|actual)\s+)*)(class|interface|object)\s+([A-Za-z_]\w*)/;
      break;
    case 'scala':
      re = /^(\s*(?:(?:private|protected|final|abstract|sealed|implicit|override|case|lazy|open)\s+)*)(class|trait|object|enum)\s+([A-Za-z_]\w*)/;
      break;
    case 'swift':
      re = /^(\s*(?:(?:public|private|internal|fileprivate|open|final|indirect)\s+)*)(class|struct|enum|protocol|extension|actor)\s+([A-Za-z_]\w*)/;
      break;
    case 'php':
      re = /^(\s*(?:(?:abstract|final|readonly)\s+)*)(class|interface|trait|enum)\s+([A-Za-z_]\w*)/;
      break;
    default:
      return null;
  }
  const m = re.exec(t);
  if (!m) return null;
  let keyword = m[2].toLowerCase();
  if ((lang === 'kotlin' || lang === 'scala') && /\benum\b/.test(m[1])) keyword = 'enum';
  const kindMap = {
    class: 'class', interface: 'interface', enum: 'enum', record: 'class',
    struct: 'struct', trait: 'trait', object: 'class', protocol: 'interface',
    extension: 'type', actor: 'class',
  };
  return { name: m[3], kind: kindMap[keyword] || 'type', prefix: m[1], keyword };
}

function modernLangSymbols(lines, code, lang) {
  const out = [];
  const depthBefore = braceDepths(code);
  const types = [];

  for (let i = 0; i < lines.length; i++) {
    const t = code[i];
    if (!t || !t.trim()) continue;
    const tm = matchType(lang, t);
    if (tm && okName(tm.name)) {
      const range = braceRange(code, i, depthBefore);
      types.push({ name: tm.name, open: range.openLine, close: range.closeLine, bodyDepth: range.bodyDepth });
      out.push(mk(tm.name, tm.kind, i + 1, range.closeLine + 1, makeSignature(lines, i), modernExported(t, lang)));
    }
  }

  for (const type of types) {
    for (let j = type.open + 1; j < type.close; j++) {
      if (depthBefore[j] !== type.bodyDepth) continue;
      const t = code[j];
      if (!t || !t.trim()) continue;
      let name = null;

      if (lang === 'kotlin') {
        const m = /^\s*(?:(?:public|private|protected|internal|override|open|final|abstract|suspend|inline|operator|tailrec|external|expect|actual|infix|const)\s+)*fun\s+(?:<[^>]*>\s*)?(?:[A-Za-z_][\w.<>?, ]*\.)?([A-Za-z_]\w*)\s*\(/.exec(t);
        if (m) name = m[1];
      } else if (lang === 'scala') {
        const m = /^\s*(?:(?:override|final|private|protected|implicit|inline|transparent)\s+)*def\s+([A-Za-z_]\w*)/.exec(t);
        if (m) name = m[1];
      } else if (lang === 'swift') {
        const m = /^\s*(?:(?:public|private|internal|fileprivate|open|static|final|override|mutating|nonmutating|convenience|required|@\w+)\s+)*func\s+([A-Za-z_]\w*)/.exec(t);
        if (m) name = m[1];
      } else if (lang === 'php') {
        const m = /^\s*(?:(?:public|private|protected|static|final|abstract)\s+)*function\s+&?\s*([A-Za-z_]\w*)\s*\(/.exec(t);
        if (m) name = m[1];
      } else {
        const m = /^\s*((?:(?:public|private|protected|internal|static|final|abstract|override|virtual|sealed|async|synchronized|native|default|extern|unsafe|new|readonly|partial|strictfp|volatile|transient)\s+)*)(?:<[^>]*>\s*)?([A-Za-z_$][\w$<>\[\],.?\s]*?)\s+([A-Za-z_$]\w*)\s*(?:<[^>]*>)?\s*\(/.exec(t);
        if (m) {
          const first = m[2].trim().split(/\s+/)[0];
          if (!STATEMENT_WORDS.has(first.toLowerCase()) && !CONTROL.has(m[3].toLowerCase())) {
            const beforeParen = t.slice(0, t.indexOf('('));
            if (!beforeParen.includes('=')) name = m[3];
          }
        }
        if (!name) {
          const ctor = /^\s*(?:(?:public|private|protected|internal)\s+)+([A-Z][A-Za-z_]\w*)\s*\(/.exec(t);
          if (ctor && ctor[1] === type.name) name = ctor[1];
        }
      }

      if (!name || !okName(name)) continue;
      const range = braceRange(code, j, depthBefore);
      out.push(mk(name, 'method', j + 1, range.closeLine + 1, makeSignature(lines, j), modernExported(t, lang)));
    }
  }

  if (lang === 'php') {
    for (let i = 0; i < lines.length; i++) {
      const m = /^\s*(?:(?:public|private|protected)\s+)?const\s+([A-Za-z_]\w*)/.exec(code[i]);
      if (m && okName(m[1])) {
        out.push(mk(m[1], 'const', i + 1, i + 1, makeSignature(lines, i), !/\b(private|protected)\b/.test(code[i])));
      }
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const t = code[i];
    if (!t || !t.trim()) continue;
    let m = null;
    if (lang === 'kotlin') m = /^\s*(?:(?:public|private|protected|internal|override|open|final|abstract|suspend|inline|operator)\s+)*fun\s+(?:<[^>]*>\s*)?([A-Za-z_]\w*)\s*\(/.exec(t);
    else if (lang === 'scala') m = /^\s*(?:(?:override|final|private|protected|implicit|inline|transparent)\s+)*def\s+([A-Za-z_]\w*)/.exec(t);
    else if (lang === 'swift') m = /^\s*(?:(?:public|private|internal|fileprivate|open|static|final|override|mutating|nonmutating|convenience|required|@\w+)\s+)*func\s+([A-Za-z_]\w*)/.exec(t);
    else if (lang === 'php') m = /^\s*(?:(?:public|private|protected|static|final|abstract)\s+)*function\s+&?\s*([A-Za-z_]\w*)\s*\(/.exec(t);
    if (!m || !okName(m[1])) continue;
    const range = braceRange(code, i, depthBefore);
    out.push(mk(m[1], 'function', i + 1, range.closeLine + 1, makeSignature(lines, i), modernExported(t, lang)));
  }

  return out;
}

function modernExported(t, lang) {
  if (lang === 'kotlin' || lang === 'scala') {
    return !/\b(private|protected|internal)\b/.test(t);
  }
  if (lang === 'swift') return /\b(public|open)\b/.test(t);
  if (lang === 'php') return !/\b(private|protected)\b/.test(t);
  return /\bpublic\b/.test(t);
}

// ---------------------------------------------------------------------------
// C / C++
// ---------------------------------------------------------------------------

function cSymbols(lines, code, lang) {
  const out = [];
  const depthBefore = braceDepths(code);
  const types = [];

  for (let i = 0; i < lines.length; i++) {
    const t = code[i];
    if (!t || !t.trim()) continue;
    const m = /^\s*(?:template\s*<[^>]*>\s*)?(class|struct|enum(?:\s+class)?|namespace|union)\s+([A-Za-z_]\w*)/.exec(t);
    if (m && okName(m[2])) {
      const keyword = m[1].toLowerCase();
      const kind = keyword.startsWith('enum') ? 'enum'
        : keyword === 'namespace' ? 'module'
          : keyword === 'union' ? 'struct' : 'class';
      const range = braceRange(code, i, depthBefore);
      types.push({ open: range.openLine, close: range.closeLine, bodyDepth: range.bodyDepth });
      out.push(mk(m[2], kind, i + 1, range.closeLine + 1, makeSignature(lines, i), !/\bstatic\b/.test(t)));
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const t = code[i];
    if (!t || !t.trim()) continue;
    const trimmed = t.trim();
    if (trimmed.startsWith('#') || trimmed.startsWith('//') || trimmed.startsWith('*')) continue;
    if (/^(?:using|typedef|namespace|return|else|case|new|delete|throw|goto|template)\b/.test(trimmed)) continue;

    const insideType = types.some((r) => i > r.open && i < r.close && depthBefore[i] === r.bodyDepth);
    const allowed = depthBefore[i] === 0 || insideType;
    if (!allowed) continue;
    if (!t.includes('(')) continue;

    let stmt = t;
    let k = i;
    while (!stmt.includes(')') && k + 1 < lines.length && k - i < 4) {
      k++;
      stmt += ` ${code[k]}`;
    }
    const openParen = stmt.indexOf('(');
    const closeParen = stmt.lastIndexOf(')');
    if (openParen < 0 || closeParen < openParen) continue;
    const before = stmt.slice(0, openParen).trim();
    const nameMatch = /([A-Za-z_~][\w]*)$/.exec(before);
    if (!nameMatch) continue;
    const name = nameMatch[1];
    if (!okName(name)) continue;
    const beforeName = before.slice(0, before.length - name.length).trim();
    if (!beforeName) continue;
    const firstWord = beforeName.split(/\s+/)[0];
    if (STATEMENT_WORDS.has(firstWord.toLowerCase())) continue;

    const afterParen = stmt.slice(closeParen + 1);
    let hasBrace = afterParen.includes('{');
    if (!hasBrace) {
      const next = firstNonBlankLine(code, k + 1);
      hasBrace = Boolean(next && next.text.startsWith('{'));
    }
    if (!hasBrace) continue;
    if (/;\s*$/.test(afterParen)) continue;

    const range = braceRange(code, i, depthBefore);
    out.push(mk(name, insideType ? 'method' : 'function', i + 1, range.closeLine + 1, makeSignature(lines, i), !/\bstatic\b/.test(trimmed)));
  }

  return out;
}

// ---------------------------------------------------------------------------
// Ruby
// ---------------------------------------------------------------------------

function rubySymbols(lines, code) {
  const out = [];
  const stack = [];
  for (let i = 0; i < lines.length; i++) {
    const t = code[i];
    if (!t || !t.trim()) continue;
    const indent = indentOf(t);
    while (stack.length && stack[stack.length - 1].indent >= indent) stack.pop();

    let m = /^(\s*)def\s+(?:self\.)?([A-Za-z_]\w*[?!=]?)/.exec(t);
    if (m && okName(m[2])) {
      const parent = stack[stack.length - 1];
      const kind = parent ? 'method' : 'function';
      out.push(mk(m[2], kind, i + 1, rubyEnd(lines, i), makeSignature(lines, i), !/\bprivate\b/.test(t)));
      stack.push({ indent, kind: 'def' });
      continue;
    }

    m = /^(\s*)class\s+([A-Za-z_]\w*(?:::\w+)*)/.exec(t);
    if (m && okName(m[2])) {
      out.push(mk(m[2], 'class', i + 1, rubyEnd(lines, i), makeSignature(lines, i), true));
      stack.push({ indent, kind: 'class' });
      continue;
    }

    m = /^(\s*)module\s+([A-Za-z_]\w*)/.exec(t);
    if (m && okName(m[2])) {
      out.push(mk(m[2], 'module', i + 1, rubyEnd(lines, i), makeSignature(lines, i), true));
      stack.push({ indent, kind: 'module' });
      continue;
    }

    m = /^\s*(attr_accessor|attr_reader|attr_writer)\s+(.+)$/.exec(t);
    if (m) {
      for (const raw of m[2].split(',')) {
        const name = raw.trim().replace(/^:/, '').replace(/[^\w?!]/g, '');
        if (okName(name)) out.push(mk(name, 'variable', i + 1, i + 1, makeSignature(lines, i), true));
      }
    }
  }
  return out;
}

function rubyEnd(lines, idx) {
  let depth = 0;
  for (let j = idx; j < lines.length; j++) {
    const t = lines[j].trim();
    if (!t || t.startsWith('#')) continue;
    if (j === idx) depth++;
    else if (/^(def|class|module|if|unless|case|begin|while|until|for)\b/.test(t)) depth++;
    else if (/\bdo\s*(?:\||$)/.test(t)) depth++;
    if (j > idx && /^end\b/.test(t)) {
      depth--;
      if (depth <= 0) return j + 1;
    }
  }
  return idx + 1;
}

// ---------------------------------------------------------------------------
// Swift is handled by modernLangSymbols; Lua, SQL, shell
// ---------------------------------------------------------------------------

function luaSymbols(lines, code) {
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const t = code[i];
    if (!t || !t.trim()) continue;
    let m = /^\s*(local\s+)?function\s+([A-Za-z_][\w.:]*)/.exec(t);
    if (m && okName(m[2])) {
      out.push(mk(m[2], 'function', i + 1, luaEnd(lines, i), makeSignature(lines, i), !m[1]));
      continue;
    }
    m = /^\s*(local\s+)?([A-Za-z_][\w.:]*)\s*=\s*function\b/.exec(t);
    if (m && okName(m[2])) {
      out.push(mk(m[2], 'function', i + 1, luaEnd(lines, i), makeSignature(lines, i), !m[1]));
    }
  }
  return out;
}

function luaEnd(lines, idx) {
  let depth = 1;
  for (let j = idx + 1; j < lines.length; j++) {
    const t = lines[j].trim();
    if (!t || t.startsWith('--')) continue;
    if (/^(function|if|for|while|repeat|do)\b/.test(t)) depth++;
    if (/^(end|until)\b/.test(t)) {
      depth--;
      if (depth <= 0) return j + 1;
    }
  }
  return idx + 1;
}

function sqlSymbols(lines) {
  const out = [];
  const re = /^\s*CREATE\s+(?:OR\s+REPLACE\s+)?(TABLE|VIEW|INDEX|FUNCTION|PROCEDURE)\s+(?:IF\s+NOT\s+EXISTS\s+)?([`"\[\]\w.$]+)/i;
  for (let i = 0; i < lines.length; i++) {
    const m = re.exec(lines[i]);
    if (!m) continue;
    const keyword = m[1].toUpperCase();
    const name = m[2].replace(/^[`"[]+|[`"\]]+$/g, '');
    if (!name) continue;
    const kind = keyword === 'VIEW' ? 'view'
      : keyword === 'PROCEDURE' ? 'procedure'
        : keyword === 'FUNCTION' ? 'function' : 'table';
    let end = i + 1;
    for (let j = i; j < lines.length; j++) {
      if (/;\s*$/.test(lines[j])) { end = j + 1; break; }
    }
    out.push(mk(name, kind, i + 1, end, makeSignature(lines, i), true));
  }
  return out;
}

function shellSymbols(lines, code, lang) {
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const t = code[i];
    if (!t || !t.trim()) continue;
    let name = null;
    if (lang === 'powershell') {
      const m = /^\s*(?:function|filter)\s+(?:global:|script:|local:|private:)?([A-Za-z_][\w-]*)/i.exec(t);
      if (m) name = m[1];
    } else {
      let m = /^\s*function\s+([A-Za-z_][\w.:-]*)/.exec(t);
      if (!m) m = /^\s*([A-Za-z_][\w-]*)\s*\(\s*\)\s*\{/.exec(t);
      if (m) name = m[1];
    }
    if (!name || !okName(name)) continue;
    const range = braceRange(code, i);
    out.push(mk(name, 'function', i + 1, range.closeLine + 1, makeSignature(lines, i), true));
  }
  return out;
}

// ---------------------------------------------------------------------------
// finalization
// ---------------------------------------------------------------------------

function finalizeSymbols(list, lines) {
  const seen = new Set();
  const out = [];
  const total = lines.length;
  for (const s of list) {
    if (!s || !s.name) continue;
    if (s.kind !== 'route' && !okName(s.name)) continue;
    const line = Math.max(1, Math.min(total, Number(s.line) || 1));
    let end = Math.max(line, Math.min(total, Number(s.end_line) || line));
    if (!Number.isFinite(end) || end < line) end = line;
    const key = `${s.name}\u0000${line}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const rawSig = String(s.signature || lines[line - 1] || s.name);
    const signature = rawSig.replace(/\s+/g, ' ').trim().slice(0, MAX_SIGNATURE);
    out.push({
      name: s.name,
      kind: KINDS.has(s.kind) ? s.kind : 'type',
      line,
      end_line: end,
      signature,
      exported: Boolean(s.exported),
    });
  }
  out.sort((a, b) => a.line - b.line || (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  return out;
}

function finalizeImports(list) {
  const seen = new Set();
  const out = [];
  for (const item of list) {
    if (!item || !item.specifier) continue;
    const key = `${item.specifier}\u0000${item.kind}\u0000${item.line}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ specifier: item.specifier, kind: item.kind, line: item.line });
  }
  out.sort((a, b) => a.line - b.line || (a.specifier < b.specifier ? -1 : a.specifier > b.specifier ? 1 : 0));
  return out;
}

function finalizeAnnotations(list) {
  const seen = new Set();
  const out = [];
  for (const a of list) {
    if (!a || !a.kind) continue;
    const key = `${a.line}\u0000${a.kind}\u0000${a.text}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ line: a.line, kind: a.kind, text: a.text, owner: a.owner ?? null, ref: a.ref ?? null });
  }
  out.sort((a, b) => a.line - b.line
    || (a.kind < b.kind ? -1 : a.kind > b.kind ? 1 : 0)
    || (a.text < b.text ? -1 : a.text > b.text ? 1 : 0));
  return out;
}

// ---------------------------------------------------------------------------
// public API
// ---------------------------------------------------------------------------

/**
 * @param {string} lang
 * @param {string} text
 * @returns {Array<{name:string, kind:string, line:number, end_line:number, signature:string, exported:boolean}>}
 */
export function extractSymbols(lang, text) {
  const L = normLang(lang);
  const lines = toLines(text);
  if (!lines.length) return [];
  const cfg = commentCfg(L);
  let code = maskCode(lines, cfg, true);
  let codeKeep = maskCode(lines, cfg, false);
  if (L === 'vue' || L === 'svelte') {
    code = scriptOnly(code, lines);
    codeKeep = scriptOnly(codeKeep, lines);
  }

  let raw = [];
  switch (L) {
    case 'javascript':
    case 'typescript':
    case 'vue':
    case 'svelte':
      raw = jsSymbols(lines, code, codeKeep);
      break;
    case 'python':
      raw = pythonSymbols(lines, code);
      break;
    case 'go':
      raw = goSymbols(lines, code);
      break;
    case 'rust':
      raw = rustSymbols(lines, code);
      break;
    case 'csharp':
    case 'java':
    case 'kotlin':
    case 'scala':
    case 'swift':
    case 'php':
      raw = modernLangSymbols(lines, code, L);
      break;
    case 'c':
    case 'cpp':
      raw = cSymbols(lines, code, L);
      break;
    case 'ruby':
      raw = rubySymbols(lines, code);
      break;
    case 'lua':
      raw = luaSymbols(lines, code);
      break;
    case 'sql':
      raw = sqlSymbols(codeKeep);
      break;
    case 'shell':
    case 'powershell':
      raw = shellSymbols(lines, code, L);
      break;
    default:
      raw = [];
  }
  return finalizeSymbols(raw, lines);
}

/**
 * @param {string} lang
 * @param {string} text
 * @returns {Array<{specifier:string, kind:string, line:number}>}
 */
export function extractImports(lang, text) {
  const L = normLang(lang);
  const lines = toLines(text);
  if (!lines.length) return [];
  const cfg = commentCfg(L);
  const code = maskCode(lines, cfg, false);
  const out = [];

  if (L === 'javascript' || L === 'typescript' || L === 'vue' || L === 'svelte') {
    for (let i = 0; i < lines.length; i++) {
      const t = code[i];
      if (!t || !t.trim()) continue;

      if (/^\s*import\b/.test(t) && !/^\s*import\s*\(/.test(t)) {
        let stmt = t;
        let j = i;
        while (j - i < 10 && !/['"]/.test(stmt.slice(stmt.indexOf('import') + 6)) && j + 1 < lines.length) {
          j++;
          stmt += ` ${code[j].trim()}`;
        }
        const m = /^\s*import\s+(?:type\s+)?(?:[\s\S]*?\sfrom\s+)?(['"])([^'"]+)\1/.exec(stmt);
        if (m) out.push({ specifier: m[2], kind: 'import', line: i + 1 });
      }

      if (/^\s*export\b/.test(t)) {
        let stmt = t;
        let j = i;
        while (j - i < 10 && !/['"]/.test(stmt) && j + 1 < lines.length) {
          j++;
          stmt += ` ${code[j].trim()}`;
        }
        const m = /^\s*export\s+[\s\S]*?\sfrom\s*(['"])([^'"]+)\1/.exec(stmt);
        if (m) out.push({ specifier: m[2], kind: 'export_from', line: i + 1 });
      }

      const dyn = /\bimport\s*\(\s*(['"])([^'"]+)\1\s*\)/g;
      let dm;
      while ((dm = dyn.exec(t)) !== null) {
        out.push({ specifier: dm[2], kind: 'dynamic', line: i + 1 });
      }
      const req = /\brequire\s*\(\s*(['"])([^'"]+)\1\s*\)/g;
      let rm;
      while ((rm = req.exec(t)) !== null) {
        out.push({ specifier: rm[2], kind: 'require', line: i + 1 });
      }
    }
    return finalizeImports(out);
  }

  if (L === 'python') {
    for (let i = 0; i < lines.length; i++) {
      const t = code[i];
      if (!t || !t.trim()) continue;
      let m = /^\s*from\s+([.\w]+)\s+import\s+/.exec(t);
      if (m) {
        out.push({ specifier: m[1], kind: 'import', line: i + 1 });
        continue;
      }
      m = /^\s*import\s+(.+)$/.exec(t);
      if (m) {
        for (const raw of m[1].split(',')) {
          const mod = raw.trim().replace(/\s+as\s+\w+$/, '').trim();
          if (mod) out.push({ specifier: mod, kind: 'import', line: i + 1 });
        }
      }
    }
    return finalizeImports(out);
  }

  if (L === 'go') {
    let inBlock = false;
    for (let i = 0; i < lines.length; i++) {
      const t = code[i];
      if (!t || !t.trim()) continue;
      if (!inBlock) {
        const single = /^\s*import\s+(?:[A-Za-z_.]\w*\s+)?(["`])([^"`]+)\1/.exec(t);
        if (single) {
          out.push({ specifier: single[2], kind: 'import', line: i + 1 });
          continue;
        }
        if (/^\s*import\s*\(/.test(t)) inBlock = true;
        continue;
      }
      if (/^\s*\)/.test(t)) { inBlock = false; continue; }
      const m = /^\s*(?:[A-Za-z_.]\w*\s+)?(["`])([^"`]+)\1/.exec(t);
      if (m) out.push({ specifier: m[2], kind: 'import', line: i + 1 });
    }
    return finalizeImports(out);
  }

  if (L === 'rust') {
    for (let i = 0; i < lines.length; i++) {
      const t = code[i];
      if (!t || !t.trim()) continue;
      let m = /^\s*(?:pub\s+)?use\s+([^;]+);?/.exec(t);
      if (m) {
        out.push({ specifier: m[1].trim(), kind: 'use', line: i + 1 });
        continue;
      }
      m = /^\s*(?:pub\s+)?mod\s+([A-Za-z_]\w*)\s*;/.exec(t);
      if (m) out.push({ specifier: m[1], kind: 'mod', line: i + 1 });
    }
    return finalizeImports(out);
  }

  if (L === 'c' || L === 'cpp') {
    for (let i = 0; i < lines.length; i++) {
      const m = /^\s*#\s*include\s*[<"]([^>"]+)[>"]/.exec(code[i]);
      if (m) out.push({ specifier: m[1], kind: 'include', line: i + 1 });
    }
    return finalizeImports(out);
  }

  if (L === 'csharp') {
    for (let i = 0; i < lines.length; i++) {
      const m = /^\s*(?:global\s+)?using\s+(?:static\s+)?([A-Za-z_][\w.]*)\s*;/.exec(code[i]);
      if (m) out.push({ specifier: m[1], kind: 'use', line: i + 1 });
    }
    return finalizeImports(out);
  }

  if (L === 'java' || L === 'kotlin' || L === 'scala') {
    for (let i = 0; i < lines.length; i++) {
      const m = /^\s*import\s+(?:static\s+)?([A-Za-z_][\w.*]*)\s*;?/.exec(code[i]);
      if (m) out.push({ specifier: m[1], kind: 'import', line: i + 1 });
    }
    return finalizeImports(out);
  }

  if (L === 'ruby') {
    for (let i = 0; i < lines.length; i++) {
      let m = /^\s*require_relative\s+(['"])([^'"]+)\1/.exec(code[i]);
      if (!m) m = /^\s*require\s+(['"])([^'"]+)\1/.exec(code[i]);
      if (m) out.push({ specifier: m[2], kind: 'require', line: i + 1 });
    }
    return finalizeImports(out);
  }

  if (L === 'php') {
    for (let i = 0; i < lines.length; i++) {
      const m = /^\s*(?:require_once|require|include_once|include)\s*\(?\s*(['"])([^'"]+)\1/.exec(code[i]);
      if (m) out.push({ specifier: m[2], kind: 'include', line: i + 1 });
    }
    return finalizeImports(out);
  }

  return [];
}

/**
 * @param {string} lang
 * @param {string} text
 * @returns {Array<{line:number, kind:string, text:string, owner:string|null, ref:string|null}>}
 */
export function extractAnnotations(lang, text) {
  const L = normLang(lang);
  const lines = toLines(text);
  if (!lines.length) return [];
  const cfg = commentCfg(L);
  const comments = scanComments(lines, cfg);
  const out = [];
  const tagRe = new RegExp(`@hq:(${ANNOTATION_KINDS.join('|')})\\b`, 'gi');

  for (const comment of comments) {
    const raw = comment.text;
    if (!raw || !raw.includes('@hq:')) continue;
    const hits = [...raw.matchAll(tagRe)];
    for (let k = 0; k < hits.length; k++) {
      const hit = hits[k];
      const kind = hit[1].toLowerCase();
      const start = hit.index + hit[0].length;
      const end = k + 1 < hits.length ? hits[k + 1].index : raw.length;
      let rest = raw.slice(start, end);

      let owner = null;
      const paren = /^\s*\(([^)]*)\)/.exec(rest);
      if (paren) {
        owner = paren[1].trim() || null;
        rest = rest.slice(paren[0].length);
      }
      let body = rest.replace(/^\s*:\s*/, '').trim();
      if (!body && owner && (kind === 'owner' || kind === 'see')) body = owner;
      body = body.replace(/\s+/g, ' ').trim().slice(0, MAX_ANNOTATION_TEXT);

      let ref = null;
      if (kind === 'see') {
        const rm = /([A-Za-z0-9_.\/\\@-]+):(\d+)(?:-(\d+))?/.exec(body);
        if (rm) ref = rm[0];
        else {
          const token = body.split(/\s+/)[0];
          if (token && /[\/.]/.test(token)) ref = token;
        }
      }

      if (kind === 'owner' && !owner && body) {
        const first = body.split(/\s+/)[0].replace(/[,;:]+$/, '');
        if (first) owner = first;
      }

      out.push({ line: comment.line, kind, text: body, owner, ref });
    }
  }

  return finalizeAnnotations(out);
}

// ---------------------------------------------------------------------------
// route surface: implemented routes and their mount wiring
// ---------------------------------------------------------------------------

// Framework route registration: <receiver>.<method>(<path>, handler)
const ROUTE_METHOD_RE = /^\s*([A-Za-z_$][\w$]*)\s*\.\s*(get|post|put|patch|delete|all|options|head)\s*\(\s*(['"`])([^'"`]+)\3/;
// Framework mount: <receiver>.use([<prefix>,] <target>)
const MOUNT_RE = /^\s*([A-Za-z_$][\w$]*)\s*\.\s*use\s*\(\s*(?:(['"`])([^'"`]*)\2\s*,\s*)?([A-Za-z_$][\w$]*)\s*\)/;
// Local declaration: const <name> = <rhs>
const DECL_RE = /^\s*(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=/;
// Router factory marker: express.Router() / Router() / new Router()
const ROUTER_FACTORY_RE = /\bRouter\s*\(/;

/**
 * extractRouteSurface — implemented routes plus the wiring that mounts them.
 *
 * A route is MOUNTED when it is registered directly on a receiver that is not
 * a locally-created router (that receiver is the application/server itself),
 * or when its receiver is a locally-created router that some `.use()` call
 * hands to a parent. A route on a locally-created router that no `.use()`
 * call ever names is UNMOUNTED: implemented, but never reachable.
 *
 * Scope: one file. Cross-file mount resolution is a graph-level concern
 * (see hq/lib/graph.mjs reachableRoutes), not an extraction concern.
 *
 * @param {string} lang
 * @param {string} text
 * @returns {{routes: Array<{receiver:string, method:string, path:string, line:number, mounted:boolean, mountedBy:string[]}>,
 *            mounts: Array<{receiver:string, prefix:string|null, target:string, line:number}>,
 *            unmounted: Array<object>}}
 */
export function extractRouteSurface(lang, text) {
  const L = normLang(lang);
  const empty = { routes: [], mounts: [], unmounted: [] };
  if (L !== 'javascript' && L !== 'typescript' && L !== 'vue' && L !== 'svelte') return empty;
  const lines = toLines(text);
  if (!lines.length) return empty;
  const cfg = commentCfg(L);
  // blankStrings=false keeps string literals, so route paths stay readable.
  const code = maskCode(lines, cfg, false);

  const routers = new Set();
  const mounts = [];
  const routes = [];

  for (let i = 0; i < lines.length; i++) {
    const t = code[i];
    if (!t || !t.trim()) continue;

    const decl = DECL_RE.exec(t);
    if (decl && ROUTER_FACTORY_RE.test(t)) routers.add(decl[1]);

    const mount = MOUNT_RE.exec(t);
    if (mount) {
      mounts.push({ receiver: mount[1], prefix: mount[3] ?? null, target: mount[4], line: i + 1 });
    }

    const route = ROUTE_METHOD_RE.exec(t);
    if (route) {
      routes.push({ receiver: route[1], method: route[2].toUpperCase(), path: route[4], line: i + 1 });
    }
  }

  const mountedTargets = new Set(mounts.map((m) => m.target));
  for (const r of routes) {
    r.mounted = routers.has(r.receiver) ? mountedTargets.has(r.receiver) : true;
    r.mountedBy = mounts.filter((m) => m.target === r.receiver).map((m) => (m.prefix == null ? '' : m.prefix));
  }

  return { routes, mounts, unmounted: routes.filter((r) => !r.mounted) };
}
