# File: apps/vivim-host/apk/pairing.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/apk/pairing.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 6228 B |
| Lines | 153 |
| Hash | 328d821718ff |
| Test | no |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| PAIRING_DIR_NAME | const | 10 | no | const PAIRING_DIR_NAME = &#39;pairing&#39;; |
| STATE_FILE | const | 11 | no | const STATE_FILE = &#39;pairing.json&#39;; |
| TOKEN_TTL_MS | const | 12 | no | const TOKEN_TTL_MS = 10 * 60 * 1000; // 10 minutes |
| MAX_TOKENS | const | 13 | no | const MAX_TOKENS = 32; // bounded memory: prune oldest beyond this |
| emptyState | function | 15 | no | const emptyState = () =&gt; ({ tokens: {}, pairing: { paired: false, deviceId: null, pairedAt: null, deviceInfo: null } }); |
| createPairingStore | function | 17 | yes | export function createPairingStore({ dataRoot }) { |
| dir | const | 19 | no | const dir = path.join(dataRoot, PAIRING_DIR_NAME); |
| statePath | const | 20 | no | const statePath = path.join(dir, STATE_FILE); |
| now | function | 22 | no | const now = () =&gt; Date.now(); |
| ensureDir | function | 24 | no | const ensureDir = () =&gt; { if (!existsSync(dir)) mkdirSync(dir, { recursive: true }); }; |
| loadState | function | 26 | no | const loadState = () =&gt; { |
| parsed | const | 28 | no | const parsed = JSON.parse(readFileSync(statePath, &#39;utf8&#39;)); |
| state | const | 29 | no | const state = emptyState(); |
| saveState | function | 41 | no | const saveState = (state) =&gt; { |
| pruneTokens | function | 49 | no | const pruneTokens = (state) =&gt; { |
| ts | const | 50 | no | const ts = now(); |
| entries | const | 54 | no | const entries = Object.entries(state.tokens).sort((a, b) =&gt; (a[1].createdAt \|\| 0) - (b[1].createdAt \|\| 0)); |
| invalid | function | 62 | no | const invalid = (message, status) =&gt; Object.assign(new Error(message), { status }); |
| createToken | function | 66 | no | const createToken = () =&gt; { |
| state | const | 67 | no | const state = pruneTokens(loadState()); |
| token | const | 68 | no | const token = randomBytes(32).toString(&#39;hex&#39;); // 64 hex chars |
| createdAt | const | 69 | no | const createdAt = now(); |
| expiresAt | const | 70 | no | const expiresAt = createdAt + TOKEN_TTL_MS; |
| consume | function | 78 | no | const consume = (token) =&gt; { |
| state | const | 80 | no | const state = pruneTokens(loadState()); |
| entry | const | 81 | no | const entry = state.tokens[token]; |
| getStatus | function | 96 | no | const getStatus = () =&gt; { |
| activate | function | 108 | no | const activate = (token, deviceInfo = {}) =&gt; { |
| state | const | 110 | no | const state = pruneTokens(loadState()); |
| entry | const | 111 | no | const entry = state.tokens[token]; |
| deviceId | const | 125 | no | const deviceId = createHash(&#39;sha256&#39;) |
| unpair | function | 145 | no | const unpair = () =&gt; { |
| state | const | 146 | no | const state = pruneTokens(loadState()); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 6 | external |
| node:fs | import | 7 | external |
| node:path | import | 8 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [apps/vivim-host/direct-phone.mjs](../direct-phone.mjs.md) | ./apk/pairing.mjs |
| [apps/vivim-host/server.mjs](../server.mjs.md) | ./apk/pairing.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// APK07 PC<->phone pairing store.
// The PC mints a short-lived, single-use token (rendered as a QR code). The phone
// scans it, then calls activate() exactly once to exchange the token for a deviceId.
// Tokens are never reusable, never persisted in plaintext logs, and expire after
// 10 minutes. Paired-device state lives beside the tokens in <dataRoot>/pairing/.
import { createHash, randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const PAIRING_DIR_NAME = 'pairing';
const STATE_FILE = 'pairing.json';
const TOKEN_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_TOKENS = 32; // bounded memory: prune oldest beyond this

const emptyState = () => ({ tokens: {}, pairing: { paired: false, deviceId: null, pairedAt: null, deviceInfo: null } });

export function createPairingStore({ dataRoot }) {
  if (!dataRoot) throw Object.assign(new Error('DATA_ROOT_REQUIRED'), { status: 400 });
  const dir = path.join(dataRoot, PAIRING_DIR_NAME);
  const statePath = path.join(dir, STATE_FILE);

  const now = () => Date.now();

  const ensureDir = () => { if (!existsSync(dir)) mkdirSync(dir, { recursive: true }); };

  const loadState = () => {
    try {
      const parsed = JSON.parse(readFileSync(statePath, 'utf8'));
      const state = emptyState();
      if (parsed && typeof parsed === 'object') {
        if (parsed.tokens && typeof parsed.tokens === 'object') state.tokens = parsed.tokens;
        if (parsed.pairing && typeof parsed.pairing === 'object') {
          state.pairing = { ...state.pairing, ...parsed.pairing };
          state.pairing.paired = Boolean(state.pairing.paired);
        }
      }
      return state;
    } catch { return emptyState(); }
  };

  const saveState = (state) => {
    ensureDir();
    writeFileSync(statePath, JSON.stringify(state, null, 2));
  };

  // Drop expired tokens and cap the map size so a long-lived PC install cannot grow
  // an unbounded token history. Expired tokens are useless anyway: their TTL is the
  // only thing that ever makes them valid.
  const pruneTokens = (state) => {
    const ts = now();
    for (const [token, entry] of Object.entries(state.tokens)) {
      if (!entry || ts > (entry.expiresAt || 0)) delete state.tokens[token];
    }
    const entries = Object.entries(state.tokens).sort((a, b) => (a[1].createdAt || 0) - (b[1].createdAt || 0));
    while (entries.length > MAX_TOKENS) {
      const [oldest] = entries.shift();
      delete state.tokens[oldest];
    }
    return state;
  };

  const invalid = (message, status) => Object.assign(new Error(message), { status });

  // Mint a one-time pairing token. The PC renders this as a QR code; only the phone
  // that scans it within the TTL can redeem it, and only once.
  const createToken = () => {
    const state = pruneTokens(loadState());
    const token = randomBytes(32).toString('hex'); // 64 hex chars
    const createdAt = now();
    const expiresAt = createdAt + TOKEN_TTL_MS;
    state.tokens[token] = { createdAt, expiresAt, usedAt: null, deviceId: null };
    saveState(state);
    return { token, expiresAt, createdAt, ttlMs: TOKEN_TTL_MS };
  };

  // Redeem a token without pairing a device. Single-use: returns a grant object on
  // the first valid call and null for unknown, expired or already-used tokens.
  const consume = (token) => {
    if (typeof token !== 'string' || !token) return null;
    const state = pruneTokens(loadState());
```

_First 80 of 154 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
