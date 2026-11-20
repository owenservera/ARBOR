# File: studio/src/capture/redact.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/capture/redact.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 4599 B |
| Lines | 85 |
| Hash | bf67787f14b0 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| KEEP_HEADERS | const | 11 | no | const KEEP_HEADERS = new Set([ &#39;content-type&#39;, &#39;content-length&#39;, &#39;content-encoding&#39;, &#39;transfer-encoding&#39;, &#39;cache-control&#39;, &#39;vary&#39;, &#39;date&#39;, &#39;server&#39;, &#39;accept&#39;, &#39;accept-encoding&#39;, &#39;accept-language&#39;, &#39;x… |
| DROP_HEADERS | const | 17 | no | const DROP_HEADERS = new Set([&#39;cookie&#39;, &#39;set-cookie&#39;, &#39;authorization&#39;, &#39;proxy-authorization&#39;]); |
| SECRET_PARAM | const | 18 | no | const SECRET_PARAM = /(token\|secret\|password\|passwd\|auth\|session\|sig\|signature\|key\|code\|credential\|jwt\|bearer\|otp\|nonce)/i; |
| DEFAULT_SENSITIVE_URL | const | 20 | yes | export const DEFAULT_SENSITIVE_URL = /\\/(auth\|oauth2?\|login\|logout\|signin\|signup\|session\|sessions\|token\|tokens\|sso\|saml\|callback\|account\\/(security\|password)\|csrf)(\\/\|\\?\|$)/i; |
| redactHeaders | function | 22 | yes | export function redactHeaders(headers) { |
| out | const | 24 | no | const out = {}; |
| n | const | 26 | no | const n = name.toLowerCase(); |
| redactUrl | function | 34 | yes | export function redactUrl(url) { |
| u | const | 36 | no | const u = new URL(url); |
| changed | variable | 37 | no | let changed = false; |
| isSensitiveUrl | function | 47 | yes | export function isSensitiveUrl(url, extraPatterns = []) { |
| pathPart | variable | 48 | no | let pathPart = url; |
| SECRET_PATTERNS | const | 55 | no | const SECRET_PATTERNS = [ |
| scrubSecrets | function | 62 | yes | export function scrubSecrets(buf) { |
| s | const | 64 | no | const s = buf.toString(&#39;latin1&#39;); |
| redactions | const | 65 | no | const redactions = []; |
| m | variable | 68 | no | let m; |
| full | const | 70 | no | const full = m[0]; |
| target | const | 71 | no | const target = group === 0 ? full : m[group]; |
| offset | const | 72 | no | const offset = m.index + (group === 0 ? 0 : full.indexOf(target)); |
| out | const | 77 | no | const out = Buffer.from(buf); |
| scrubText | function | 82 | yes | export function scrubText(text) { |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [studio/src/capture/live-tap.mjs](./live-tap.mjs.md) | ./redact.mjs |
| [studio/src/capture/network.mjs](./network.mjs.md) | ./redact.mjs |
| [studio/src/capture/privacy.mjs](./privacy.mjs.md) | ./redact.mjs |
| [studio/src/capture/stream-guard.mjs](./stream-guard.mjs.md) | ./redact.mjs |
| [studio/src/export/export.mjs](../export/export.mjs.md) | ../capture/redact.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Optional filtered-mode masking helpers. Local-raw capture deliberately bypasses these helpers
// to preserve full on-PC evidence; see capturePrivacy() in privacy.mjs.
//  1. Headers: only an allowlist keeps values; every other header keeps its name, value -> "[redacted]".
//     Cookie / Set-Cookie / Authorization are dropped entirely.
//  2. URLs: query parameters with credential-like names are masked.
//  3. Endpoints that look like auth/session/token exchanges are captured as metadata only (no body).
//  4. Body bytes are scanned for JWT-like tokens and credential-like JSON fields; matches are
//     overwritten in place with '*' (same length, so offsets stay valid) and the redaction is
//     recorded on the record, so the deviation from byte-faithful capture is always disclosed.

const KEEP_HEADERS = new Set([
  'content-type', 'content-length', 'content-encoding', 'transfer-encoding', 'cache-control', 'vary', 'date',
  'server', 'accept', 'accept-encoding', 'accept-language', 'x-content-type-options', 'access-control-allow-origin',
  'sec-fetch-dest', 'sec-fetch-mode', 'sec-fetch-site', 'origin', 'connection', 'upgrade', 'sec-websocket-protocol',
  'sec-websocket-extensions', 'last-modified', 'etag', 'expires', 'age', 'x-request-id', 'cf-cache-status', 'alt-svc',
]);
const DROP_HEADERS = new Set(['cookie', 'set-cookie', 'authorization', 'proxy-authorization']);
const SECRET_PARAM = /(token|secret|password|passwd|auth|session|sig|signature|key|code|credential|jwt|bearer|otp|nonce)/i;

export const DEFAULT_SENSITIVE_URL = /\/(auth|oauth2?|login|logout|signin|signup|session|sessions|token|tokens|sso|saml|callback|account\/(security|password)|csrf)(\/|\?|$)/i;

export function redactHeaders(headers) {
  if (!headers) return undefined;
  const out = {};
  for (const [name, value] of Object.entries(headers)) {
    const n = name.toLowerCase();
    if (DROP_HEADERS.has(n)) { out[name] = '[dropped]'; continue; }
    if (n === 'referer') { out[name] = redactUrl(String(value)); continue; }
    out[name] = KEEP_HEADERS.has(n) ? value : '[redacted]';
  }
  return out;
}

export function redactUrl(url) {
  try {
    const u = new URL(url);
    let changed = false;
    for (const k of [...u.searchParams.keys()]) {
      if (SECRET_PARAM.test(k)) { u.searchParams.set(k, '[redacted]'); changed = true; }
    }
    if (u.username || u.password) { u.username = ''; u.password = ''; changed = true; }
    if (u.hash && /(access_token|id_token|token)=/i.test(u.hash)) { u.hash = '#[redacted]'; changed = true; }
    return changed ? u.toString() : url;
  } catch { return url; }
}

export function isSensitiveUrl(url, extraPatterns = []) {
  let pathPart = url;
  try { const u = new URL(url); pathPart = u.pathname + u.search; } catch { /* keep */ }
  if (DEFAULT_SENSITIVE_URL.test(pathPart)) return true;
  return extraPatterns.some((p) => new RegExp(p, 'i').test(url));
}

// Patterns are applied to latin1-decoded bytes so offsets equal byte offsets.
const SECRET_PATTERNS = [
  { kind: 'jwt', re: /eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/g, group: 0 },
  { kind: 'json_credential', re: /"(?:access_?token|refresh_?token|id_?token|session_?token|accessToken|refreshToken|idToken|sessionToken|api_?key|apiKey|client_?secret|password|authorization|cookie|csrf_?token|csrfToken)"\s*:\s*"([^"\\]{6,})"/g, group: 1 },
  { kind: 'bearer', re: /Bearer\s+([A-Za-z0-9._~+/=-]{16,})/g, group: 1 },
];

// Returns { bytes, redactions:[{offset,length,kind}] }. Input/Output are Buffers.
export function scrubSecrets(buf) {
  if (!buf || !buf.length) return { bytes: buf, redactions: [] };
  const s = buf.toString('latin1');
  const redactions = [];
  for (const { kind, re, group } of SECRET_PATTERNS) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(s))) {
      const full = m[0];
      const target = group === 0 ? full : m[group];
      const offset = m.index + (group === 0 ? 0 : full.indexOf(target));
      redactions.push({ offset, length: Buffer.byteLength(target, 'latin1'), kind });
    }
  }
  if (!redactions.length) return { bytes: buf, redactions };
  const out = Buffer.from(buf);
  for (const r of redactions) out.fill(0x2a, r.offset, r.offset + r.length);
  return { bytes: out, redactions: redactions.sort((a, b) => a.offset - b.offset) };
}
```

_First 80 of 86 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
