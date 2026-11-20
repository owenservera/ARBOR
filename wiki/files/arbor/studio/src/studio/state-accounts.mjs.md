# File: studio/src/studio/state-accounts.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/studio/state-accounts.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 4282 B |
| Lines | 98 |
| Hash | 70afaa046142 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| SITE_CATALOG | const | 10 | yes | export const SITE_CATALOG = [ |
| SIGNED_IN_PATHS | const | 23 | no | const SIGNED_IN_PATHS = [/\\/chat\\b/, /\\/c\\//, /\\/app\\//, /\\/conversation/i, /\\/@me/, /\\/account/i]; |
| POSITIVE_SIGNALS | const | 27 | no | const POSITIVE_SIGNALS = [ |
| SIGN_IN_SIGNALS | const | 35 | no | const SIGN_IN_SIGNALS = [ |
| parseUrl | function | 40 | no | function parseUrl(url) { |
| u | variable | 42 | no | let u; |
| matchText | function | 49 | no | function matchText(haystack, patterns) { |
| m | const | 51 | no | const m = haystack.match(p); |
| siteForUrl | function | 57 | yes | export function siteForUrl(url) { |
| parsed | const | 58 | no | const parsed = parseUrl(url); |
| hh | const | 63 | no | const hh = String(h).toLowerCase(); |
| detectAccount | function | 73 | yes | export function detectAccount(input = {}) { |
| parsed | const | 75 | no | const parsed = parseUrl(url); |
| site | const | 76 | no | const site = parsed ? siteForUrl(url) : null; |
| haystack | const | 77 | no | const haystack = String(title ?? &#39;&#39;) + &#39;\\n&#39; + String(text ?? &#39;&#39;); |
| pathname | const | 78 | no | const pathname = parsed ? parsed.pathname : &#39;&#39;; |
| positive | variable | 80 | no | let positive = matchText(haystack, POSITIVE_SIGNALS); |
| pathSignal | variable | 81 | no | let pathSignal = null; |
| evidence | const | 86 | no | const evidence = pathSignal |
| wall | const | 92 | no | const wall = matchText(haystack, SIGN_IN_SIGNALS); |

## Imports

_No imports._

## Dependents

_No dependents._

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 2 | context | — | — | Site catalog of AI provider webapps and pure account/signed-in state detection from URL, title and page text. |
| 3 | owner | vivim-orchestrator | — | vivim-orchestrator |
| 4 | task | — | — | state-accounts |

## Excerpt

```javascript
/**
 * @hq:context Site catalog of AI provider webapps and pure account/signed-in state detection from URL, title and page text.
 * @hq:owner vivim-orchestrator
 * @hq:task state-accounts
 *
 * Pure functions: no browser, no network, no credentials, no cookies, no tokens.
 * detectAccount never returns 'yes' from an absence of evidence.
 */

export const SITE_CATALOG = [
  { id: 'chatgpt', label: 'ChatGPT', hosts: ['chatgpt.com', 'www.chatgpt.com', 'chat.openai.com'], seat: 'vivim-seat-chatgpt' },
  { id: 'claude', label: 'Claude', hosts: ['claude.ai', 'www.claude.ai'], seat: 'vivim-seat-claude' },
  { id: 'gemini', label: 'Gemini', hosts: ['gemini.google.com'], seat: 'vivim-seat-gemini' },
  { id: 'deepseek', label: 'DeepSeek', hosts: ['chat.deepseek.com'], seat: 'vivim-seat-deepseek' },
  { id: 'zai', label: 'Z.ai', hosts: ['chat.z.ai', 'z.ai', 'www.z.ai'], seat: 'vivim-seat-zai' },
  { id: 'qwen', label: 'Qwen Chat', hosts: ['chat.qwen.ai', 'qwen.ai'], seat: 'vivim-seat-qwen' },
  { id: 'minimax', label: 'MiniMax', hosts: ['agent.minimax.cn', 'minimax.io', 'chat.minimax.io'], seat: 'vivim-seat-minimax' },
  { id: 'kimi', label: 'Kimi', hosts: ['www.kimi.com', 'kimi.com', 'kimi.moonshot.cn'], seat: 'vivim-seat-kimi' },
];

// Paths that, for a known site, are only reachable when signed in (a conversation, the app shell,
// the account page). Root paths and generic pages do not match.
const SIGNED_IN_PATHS = [/\/chat\b/, /\/c\//, /\/app\//, /\/conversation/i, /\/@me/, /\/account/i];

// Positive, observed affordances that the account is signed in: profile/avatar/account chrome or
// a sign-out action. Whole-word only so 'profiles', 'signing', 'logout' do not false-positive.
const POSITIVE_SIGNALS = [
  /\bsign ?out\b/i, /\bsignout\b/i, /\blog ?out\b/i,
  /\bmy ?account\b/i, /\baccount ?settings\b/i,
  /\bprofile\b/i, /\bavatar\b/i,
  /个人中心/, /我的账户/, /\b账户\b/, /退出登录/
];

// Explicit sign-in / 登录 affordances: the page is asking the user to authenticate.
const SIGN_IN_SIGNALS = [
  /\bsign ?in\b/i, /\bsignin\b/i, /\blog ?in\b/i,
  /登录/, /\bcreate ?account\b/i, /\bsign ?up\b/i
];

function parseUrl(url) {
  if (typeof url !== 'string' || !url.trim()) return null;
  let u;
  try { u = new URL(url.trim()); } catch { return null; }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
  return { hostname: u.hostname.toLowerCase(), pathname: u.pathname };
}

// First matching substring from the patterns, or null.
function matchText(haystack, patterns) {
  for (const p of patterns) {
    const m = haystack.match(p);
    if (m) return m[0];
  }
  return null;
}

export function siteForUrl(url) {
  const parsed = parseUrl(url);
  if (!parsed) return null;
  const { hostname } = parsed;
  for (const site of SITE_CATALOG) {
    for (const h of site.hosts) {
      const hh = String(h).toLowerCase();
      if (hostname === hh || hostname.endsWith('.' + hh)) return site.id;
    }
  }
  return null;
}

// Pure function of { url, title, text }: site resolution plus signed-in state.
// 'yes' only on positive evidence (profile/account/avatar affordance, or a signed-in-only path
// for a known site); 'no' only on an explicit sign-in/登录 affordance; otherwise 'unknown'.
export function detectAccount(input = {}) {
  const { url, title, text = '' } = input;
  const parsed = parseUrl(url);
  const site = parsed ? siteForUrl(url) : null;
  const haystack = String(title ?? '') + '\n' + String(text ?? '');
  const pathname = parsed ? parsed.pathname : '';

  let positive = matchText(haystack, POSITIVE_SIGNALS);
```

_First 80 of 99 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
