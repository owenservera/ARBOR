# File: studio/src/studio/lan-pair.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/studio/lan-pair.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 15392 B |
| Lines | 310 |
| Hash | fe5b31c7c91f |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| VIRTUAL_NAME | const | 15 | no | const VIRTUAL_NAME = /vethernet\|virtualbox\|vmware\|vbox\|wsl\|docker\|hyper-v\|bluetooth\|veth\|virbr\|^br-\|utun\|awdl\|llw\|loopback/i; |
| rankOf | function | 17 | no | function rankOf(name, address) { |
| rank | variable | 19 | no | let rank = a === 192 &amp;&amp; b === 168 ? 0 : a === 10 ? 1 : a === 172 &amp;&amp; b &gt;= 16 &amp;&amp; b &lt;= 31 ? 2 : 3; |
| lanAddresses | function | 25 | yes | export function lanAddresses(interfaces = os.networkInterfaces()) { |
| found | const | 26 | no | const found = []; |
| family | const | 29 | no | const family = typeof entry.family === &#39;string&#39; ? entry.family : entry.family === 4 ? &#39;IPv4&#39; : &#39;IPv6&#39;; |
| pickLanAddress | function | 38 | yes | export function pickLanAddress(addresses, preferred) { |
| wanted | const | 39 | no | const wanted = typeof preferred === &#39;string&#39; ? preferred.trim() : preferred; |
| isCookieSafeToken | function | 51 | yes | export function isCookieSafeToken(token) { |
| lanHostHeaders | function | 56 | yes | export function lanHostHeaders(port, addresses = lanAddresses()) { |
| hosts | const | 57 | no | const hosts = addresses.map((a) =&gt; `${a.address}:${port}`); |
| name | const | 58 | no | const name = os.hostname().toLowerCase(); |
| pairingUrl | function | 64 | yes | export function pairingUrl({ address, port, token }) { |
| PAIRING_FILE | const | 72 | yes | export const PAIRING_FILE = &#39;pairing.json&#39;; |
| TOKEN_BYTES | const | 73 | no | const TOKEN_BYTES = 32; // base64url =&gt; 43 characters, cookie-safe |
| pairingTokenPath | function | 76 | yes | export function pairingTokenPath(root) { |
| mintToken | function | 80 | no | const mintToken = () =&gt; randomBytes(TOKEN_BYTES).toString(&#39;base64url&#39;); |
| restrictToOwner | function | 83 | no | function restrictToOwner(file) { |
| user | const | 86 | no | const user = process.env.USERNAME; |
| parseStored | function | 92 | no | function parseStored(text) { |
| data | variable | 93 | no | let data; |
| readPairingToken | function | 105 | yes | export function readPairingToken(root) { |
| writePairingToken | function | 109 | no | function writePairingToken(root, token, { createdAt, rotatedAt }) { |
| file | const | 110 | no | const file = pairingTokenPath(root); |
| body | const | 112 | no | const body = `${JSON.stringify({ schema: &#39;vivim.pairing.v1&#39;, token, createdAt, rotatedAt }, null, 2)}\\n`; |
| tmp | const | 113 | no | const tmp = `${file}.${process.pid}.tmp`; |
| ensurePairingToken | function | 122 | yes | export function ensurePairingToken(root, now = () =&gt; new Date().toISOString()) { |
| existing | const | 123 | no | const existing = readPairingToken(root); |
| stamp | const | 125 | no | const stamp = now(); |
| resetPairingToken | function | 130 | yes | export function resetPairingToken(root, now = () =&gt; new Date().toISOString()) { |
| previous | const | 131 | no | const previous = readPairingToken(root); |
| stamp | const | 132 | no | const stamp = now(); |
| pairingTokenStamp | function | 137 | yes | export function pairingTokenStamp(root) { |
| QR_L | const | 145 | no | const QR_L = { 1: [26, 7, 1], 2: [44, 10, 1], 3: [70, 15, 1], 4: [100, 20, 1], 5: [134, 26, 1], 6: [172, 18, 2], 7: [196, 20, 2], 8: [242, 24, 2], 9: [292, 30, 2], 10: [346, 18, 4] }; |
| QR_ALIGN | const | 146 | no | const QR_ALIGN = { 1: [], 2: [6, 18], 3: [6, 22], 4: [6, 26], 5: [6, 30], 6: [6, 34], 7: [6, 22, 38], 8: [6, 24, 42], 9: [6, 26, 46], 10: [6, 28, 50] }; |
| bit | function | 147 | no | const bit = (x, i) =&gt; ((x &gt;&gt;&gt; i) &amp; 1) !== 0; |
| gfMul | function | 149 | no | function gfMul(x, y) { |
| z | variable | 150 | no | let z = 0; |
| rsDivisor | function | 154 | no | function rsDivisor(degree) { |
| r | const | 155 | no | const r = new Array(degree).fill(0); r[degree - 1] = 1; |
| root | variable | 156 | no | let root = 1; |
| rsRemainder | function | 163 | no | function rsRemainder(data, divisor) { |
| r | const | 164 | no | const r = new Array(divisor.length).fill(0); |
| factor | const | 166 | no | const factor = b ^ r.shift(); r.push(0); |
| buildCodewords | function | 172 | no | function buildCodewords(bytes, version) { |
| dataCw | const | 174 | no | const dataCw = total - eccLen * blocks; |
| bits | const | 175 | no | const bits = []; |
| push | function | 176 | no | const push = (v, n) =&gt; { for (let i = n - 1; i &gt;= 0; i--) bits.push((v &gt;&gt;&gt; i) &amp; 1); }; |
| data | const | 181 | no | const data = []; |
| shortCount | const | 185 | no | const shortCount = blocks - (total % blocks); |
| shortLen | const | 186 | no | const shortLen = Math.floor(total / blocks); |
| divisor | const | 187 | no | const divisor = rsDivisor(eccLen); |
| list | const | 188 | no | const list = []; |
| len | const | 190 | no | const len = shortLen - eccLen + (i &lt; shortCount ? 0 : 1); |
| dat | const | 191 | no | const dat = data.slice(k, k + len); k += len; |
| ecc | const | 192 | no | const ecc = rsRemainder(dat, divisor); |
| out | const | 196 | no | const out = []; |
| qrEncode | function | 204 | yes | export function qrEncode(text) { |
| bytes | const | 205 | no | const bytes = [...Buffer.from(String(text), &#39;utf8&#39;)]; |
| version | variable | 206 | no | let version = 0; |
| size | const | 212 | no | const size = version * 4 + 17; |
| modules | const | 213 | no | const modules = Array.from({ length: size }, () =&gt; new Array(size).fill(false)); |
| isFn | const | 214 | no | const isFn = Array.from({ length: size }, () =&gt; new Array(size).fill(false)); |
| setFn | function | 215 | no | const setFn = (x, y, dark) =&gt; { modules[y][x] = dark; isFn[y][x] = true; }; |
| drawFormat | function | 217 | no | const drawFormat = (mask) =&gt; { |
| data | const | 218 | no | const data = (1 &lt;&lt; 3) \| mask; // ECC level L = 01 |
| rem | variable | 219 | no | let rem = data; |
| bits | const | 221 | no | const bits = ((data &lt;&lt; 10) \| rem) ^ 0x5412; |
| finder | function | 229 | no | const finder = (cx, cy) =&gt; { |
| x | const | 231 | no | const x = cx + dx, y = cy + dy; |
| pos | const | 237 | no | const pos = QR_ALIGN[version]; |
| rem | variable | 244 | no | let rem = version; |
| bits | const | 246 | no | const bits = (version &lt;&lt; 12) \| rem; |
| a | const | 248 | no | const a = size - 11 + (i % 3), b = Math.floor(i / 3); |
| codewords | const | 253 | no | const codewords = buildCodewords(bytes, version); |
| n | variable | 254 | no | let n = 0; |
| x | const | 258 | no | const x = right - j; |
| y | const | 259 | no | const y = ((right + 1) &amp; 2) === 0 ? size - 1 - vert : vert; |
| MASKS | const | 264 | no | const MASKS = [ |
| applyMask | function | 269 | no | const applyMask = (m) =&gt; { for (let y = 0; y &lt; size; y++) for (let x = 0; x &lt; size; x++) if (!isFn[y][x] &amp;&amp; MASKS[m](x, y)) modules[y][x] = !modules[y][x]; }; |
| penalty | function | 271 | no | const penalty = () =&gt; { |
| p | variable | 272 | no | let p = 0, dark = 0; |
| run | variable | 274 | no | let run = 1; |
| cur | const | 276 | no | const cur = vertical ? modules[b][a] : modules[a][b], prev = vertical ? modules[b - 1][a] : modules[a][b - 1]; |
| best | variable | 286 | no | let best = 0, bestPenalty = Infinity; |
| p | const | 289 | no | const p = penalty(); |
| qrToTerminal | function | 300 | yes | export function qrToTerminal(text, { quiet = 4, ansi = true } = {}) { |
| m | const | 301 | no | const m = qrEncode(text), n = m.length, total = n + quiet * 2; |
| dark | function | 302 | no | const dark = (x, y) =&gt; x &gt;= quiet &amp;&amp; y &gt;= quiet &amp;&amp; x &lt; n + quiet &amp;&amp; y &lt; n + quiet &amp;&amp; m[y - quiet][x - quiet]; |
| lines | const | 303 | no | const lines = []; |
| line | variable | 305 | no | let line = &#39;&#39;; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:os | import | 9 | external |
| node:path | import | 10 | external |
| node:crypto | import | 11 | external |
| node:child_process | import | 12 | external |
| node:fs | import | 13 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/bin/commands/capture.mjs](../../bin/commands/capture.mjs.md) | ../../src/studio/lan-pair.mjs |
| [studio/scripts/windows/launcher-helper.mjs](../../scripts/windows/launcher-helper.mjs.md) | ../../src/studio/lan-pair.mjs |
| [studio/src/studio/server.mjs](./server.mjs.md) | ./lan-pair.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// LAN pairing helpers (opt-in only; see startStudio `lanPair`). Pure functions plus a minimal in-tree
// QR encoder (byte mode, error-correction level L, versions 1-10 = up to 271 bytes) so no npm
// dependency is needed. Nothing here opens a socket or changes any default behavior.
//
// Stored pairing token: phone access must survive a restart, so the token lives in
// `<data root>/pairing.json` (user-only permissions where the OS allows it) instead of being minted
// per run. `CAPTURE_STUDIO_TOKEN` / an explicit option still wins. `resetPairingToken` rotates the
// file; a running Studio re-reads it, so old phone cookies stop working without a restart.
import os from 'node:os';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { chmodSync, mkdirSync, readFileSync, renameSync, statSync, writeFileSync } from 'node:fs';

const VIRTUAL_NAME = /vethernet|virtualbox|vmware|vbox|wsl|docker|hyper-v|bluetooth|veth|virbr|^br-|utun|awdl|llw|loopback/i;

function rankOf(name, address) {
  const [a, b] = address.split('.').map(Number);
  let rank = a === 192 && b === 168 ? 0 : a === 10 ? 1 : a === 172 && b >= 16 && b <= 31 ? 2 : 3;
  if (VIRTUAL_NAME.test(name)) rank += 10; // WSL/Hyper-V/Docker adapters are never what a phone can reach
  return rank;
}

/** Non-loopback, non-link-local IPv4 addresses, best candidate first. */
export function lanAddresses(interfaces = os.networkInterfaces()) {
  const found = [];
  for (const [name, list] of Object.entries(interfaces)) {
    for (const entry of list ?? []) {
      const family = typeof entry.family === 'string' ? entry.family : entry.family === 4 ? 'IPv4' : 'IPv6';
      if (family !== 'IPv4' || entry.internal || entry.address.startsWith('169.254.')) continue;
      found.push({ name, address: entry.address, rank: rankOf(name, entry.address) });
    }
  }
  return found.sort((x, y) => x.rank - y.rank);
}

/** The preferred address (must be one of this machine's own addresses) or the best candidate. */
export function pickLanAddress(addresses, preferred) {
  const wanted = typeof preferred === 'string' ? preferred.trim() : preferred;
  if (wanted) {
    const match = addresses.find((a) => a.address === wanted);
    if (!match) throw new Error(`--lan-host ${wanted} is not a non-loopback IPv4 address of this machine (available: ${addresses.map((a) => a.address).join(', ') || 'none found'})`);
    return match;
  }
  return addresses[0] ?? null;
}

/** True when a token is long enough for LAN exposure and can travel verbatim in the Set-Cookie header
 *  (RFC 6265 cookie-octets subset: base64/base64url/hex). Spaces, quotes, `;`, `,`, `\` or control
 *  characters would split or break the cookie, so the phone could never stay signed in. */
export function isCookieSafeToken(token) {
  return typeof token === 'string' && /^[A-Za-z0-9._~+/=-]{16,512}$/.test(token);
}

/** Host header values this machine legitimately answers to in LAN-pair mode (exact matches, no wildcards). */
export function lanHostHeaders(port, addresses = lanAddresses()) {
  const hosts = addresses.map((a) => `${a.address}:${port}`);
  const name = os.hostname().toLowerCase();
  if (/^[a-z0-9-]+$/.test(name)) hosts.push(`${name}:${port}`, `${name}.local:${port}`);
  return hosts;
}

/** The URL a phone opens; the token query is exchanged for a cookie and stripped by the server. */
export function pairingUrl({ address, port, token }) {
  return `http://${address}:${port}/mobile?token=${encodeURIComponent(token)}`;
}

// ---------------------------------------------------------------------------------------------
// Stored pairing token (`<root>/pairing.json`). Never logged or printed by itself: only the pairing
// link/QR that the owner explicitly asks for carries it.
// ---------------------------------------------------------------------------------------------
export const PAIRING_FILE = 'pairing.json';
const TOKEN_BYTES = 32; // base64url => 43 characters, cookie-safe

/** Path of the stored pairing token inside a data folder. */
export function pairingTokenPath(root) {
  return path.join(root, PAIRING_FILE);
}

const mintToken = () => randomBytes(TOKEN_BYTES).toString('base64url');
```

_First 80 of 311 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
