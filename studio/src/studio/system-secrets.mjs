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
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { continue; }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) { stack.push(full); continue; }
      if (!exts.has(path.extname(entry.name))) continue;
      const key = path.resolve(full);
      if (seen.has(key)) continue;
      seen.add(key);
      let text;
      try { text = fs.readFileSync(full, 'utf8'); } catch { continue; }
      filesScanned += 1;
      const r = scanSource(text, full);
      if (r.findings.length > 0) fileFindings.push({ file: full, findings: r.findings });
    }
  }
  return { schema: 'vivim.system-secrets/1', filesScanned, findings: fileFindings, ok: fileFindings.length === 0 };
}
