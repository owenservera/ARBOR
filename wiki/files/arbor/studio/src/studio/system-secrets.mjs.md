# File: studio/src/studio/system-secrets.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/studio/system-secrets.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 4502 B |
| Lines | 98 |
| Hash | 7e06e717617b |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| PATTERNS | const | 11 | no | const PATTERNS = [ |
| maskSecret | function | 22 | no | function maskSecret(secret) { |
| keep | const | 23 | no | const keep = String(secret ?? &#39;&#39;).slice(0, 4); |
| maskedExcerpt | function | 28 | no | function maskedExcerpt(line, secretStart, secretLen, masked) { |
| withMask | const | 29 | no | const withMask = line.slice(0, secretStart) + masked + line.slice(secretStart + secretLen); |
| half | const | 31 | no | const half = 40; |
| start | variable | 32 | no | let start = Math.max(0, secretStart - half); |
| scanSource | function | 42 | yes | export function scanSource(text, filename) { |
| file | const | 43 | no | const file = String(filename ?? &#39;&#39;); |
| findings | const | 44 | no | const findings = []; |
| lines | const | 45 | no | const lines = String(text ?? &#39;&#39;).split(/\\r?\\n/); |
| line | const | 47 | no | const line = lines[i]; |
| lineNo | const | 48 | no | const lineNo = i + 1; |
| rx | const | 50 | no | const rx = new RegExp(pat.regex.source, (pat.regex.ignoreCase ? &#39;i&#39; : &#39;&#39;) + &#39;g&#39;); |
| secret | const | 52 | no | const secret = m[pat.secret] ?? m[0]; |
| secretStart | const | 53 | no | const secretStart = m.index + m[0].indexOf(String(secret)); |
| scanTree | function | 70 | yes | export async function scanTree({ roots, extensions = [&#39;.mjs&#39;, &#39;.js&#39;], maxFiles = 400 } = {}) { |
| fs | const | 71 | no | const fs = await import(&#39;node:fs&#39;); |
| path | const | 72 | no | const path = await import(&#39;node:path&#39;); |
| rootList | const | 73 | no | const rootList = Array.isArray(roots) ? roots.slice() : [roots]; |
| exts | const | 74 | no | const exts = new Set(extensions); |
| filesScanned | variable | 75 | no | let filesScanned = 0; |
| fileFindings | const | 76 | no | const fileFindings = []; |
| seen | const | 77 | no | const seen = new Set(); |
| stack | const | 78 | no | const stack = rootList.map((r) =&gt; path.resolve(String(r))); |
| dir | const | 80 | no | const dir = stack.pop(); |
| entries | variable | 81 | no | let entries; |
| full | const | 84 | no | const full = path.join(dir, entry.name); |
| key | const | 87 | no | const key = path.resolve(full); |
| text | variable | 90 | no | let text; |
| r | const | 93 | no | const r = scanSource(text, full); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | dynamic | 71 | external |
| node:path | dynamic | 72 | external |

## Dependents

_No dependents._

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 2 | context | — | — | Source-text secret scan: regex patterns over file contents (sibling to NO_SECRET_ARGS, |
| 4 | owner | atlas | — | atlas |
| 5 | task | — | — | VC-32 |
| 6 | invariant | — | — | scanSource never reports prose, process.env reads or already-masked placeholders as findings. |
| 7 | invariant | — | — | scanTree reports ok === true only when zero findings were produced across every scanned file. |

## Excerpt

```javascript
/**
 * @hq:context Source-text secret scan: regex patterns over file contents (sibling to NO_SECRET_ARGS,
 * which only checks atom arguments), producing masked excerpts. Never touches argv or atom args.
 * @hq:owner atlas
 * @hq:task VC-32
 * @hq:invariant scanSource never reports prose, process.env reads or already-masked placeholders as findings.
 * @hq:invariant scanTree reports ok === true only when zero findings were produced across every scanned file.
 */
// Patterns run line by line over source text. `secret` names the capture group holding the secret
// (0 = the whole match). Everything here is source text only -- no environment, no CLI arguments.
const PATTERNS = [
  { kind: 'private-key', regex: /-----BEGIN [A-Z ]*PRIVATE KEY-----/, secret: 0 },
  { kind: 'bearer-token', regex: /Authorization\s*:\s*Bearer\s+([A-Za-z0-9\.\-_]{20,})/, secret: 1 },
  { kind: 'credential-value', regex: /sk-[A-Za-z0-9]{20,}/, secret: 0 },
  { kind: 'credential-value', regex: /ghp_[A-Za-z0-9]{20,}/, secret: 0 },
  { kind: 'credential-value', regex: /AKIA[0-9A-Z]{16}/, secret: 0 },
  { kind: 'secret-assignment', regex: /(password|secret|token|api[_-]?key)\s*[:=]\s*['"]([^'"]{8,})['"]/i, secret: 2 },
  { kind: 'cookie-value', regex: /cookie\s*[:=]\s*['"]([^'"]{8,})['"]/i, secret: 1 },
];

/** Keep at most four leading characters of a secret; mask the rest with ***. */
function maskSecret(secret) {
  const keep = String(secret ?? '').slice(0, 4);
  return secret.length > 4 ? keep + '***' : keep;
}

/** <=80 char excerpt of `line` with the secret at [secretStart, secretStart+secretLen) masked. */
function maskedExcerpt(line, secretStart, secretLen, masked) {
  const withMask = line.slice(0, secretStart) + masked + line.slice(secretStart + secretLen);
  if (withMask.length <= 80) return withMask;
  const half = 40;
  let start = Math.max(0, secretStart - half);
  let end = Math.min(withMask.length, start + 80);
  if (end - start < 80) start = Math.max(0, end - 80);
  return withMask.slice(start, end);
}

/**
 * Scan one source text for secrets.
 * @returns { { file: string, findings: Array<{ kind: string, pattern: string, line: number, excerpt: string }> } }
 */
export function scanSource(text, filename) {
  const file = String(filename ?? '');
  const findings = [];
  const lines = String(text ?? '').split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNo = i + 1;
    for (const pat of PATTERNS) {
      const rx = new RegExp(pat.regex.source, (pat.regex.ignoreCase ? 'i' : '') + 'g');
      for (const m of line.matchAll(rx)) {
        const secret = m[pat.secret] ?? m[0];
        const secretStart = m.index + m[0].indexOf(String(secret));
        findings.push({
          kind: pat.kind,
          pattern: pat.regex.source,
          line: lineNo,
          excerpt: maskedExcerpt(line, secretStart, secret.length, maskSecret(secret)),
        });
      }
    }
  }
  return { file, findings };
}

/**
 * Scan a tree of files for secrets.
 * @returns { { schema: string, filesScanned: number, findings: Array<{ file, findings }>, ok: boolean } }
 */
export async function scanTree({ roots, extensions = ['.mjs', '.js'], maxFiles = 400 } = {}) {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const rootList = Array.isArray(roots) ? roots.slice() : [roots];
  const exts = new Set(extensions);
  let filesScanned = 0;
  const fileFindings = [];
  const seen = new Set();
  const stack = rootList.map((r) => path.resolve(String(r)));
  while (stack.length > 0 && filesScanned < maxFiles) {
    const dir = stack.pop();
```

_First 80 of 99 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
