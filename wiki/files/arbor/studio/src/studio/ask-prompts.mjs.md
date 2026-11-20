# File: studio/src/studio/ask-prompts.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/studio/ask-prompts.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 9372 B |
| Lines | 137 |
| Hash | 632f2926a98b |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| MAX_PROMPT_CHARS | const | 11 | no | const MAX_PROMPT_CHARS = 9000; // stays under compare-service&#39;s hard 10,000-char question cap |
| MAX_DIFF_CHARS | const | 12 | no | const MAX_DIFF_CHARS = 4000; |
| MAX_FILES_CHARS | const | 13 | no | const MAX_FILES_CHARS = 3500; |
| MAX_QUESTION_CHARS | const | 14 | no | const MAX_QUESTION_CHARS = 2000; |
| HARD_CUT_MARKER | const | 15 | no | const HARD_CUT_MARKER = &#39;\\n…(cut off to stay under the size limit)&#39;; |
| ROLE_NAMES | const | 17 | yes | export const ROLE_NAMES = [&#39;reviewer&#39;, &#39;implementer&#39;, &#39;explainer&#39;, &#39;copywriter&#39;]; |
| ROLES | const | 22 | no | const ROLES = { |
| roleSpec | function | 45 | yes | export function roleSpec(role) { |
| spec | const | 46 | no | const spec = ROLES[role]; |
| SECRET_PATH_RE | const | 58 | no | const SECRET_PATH_RE = /(^\|[\\\\/])(\\.env(\\..+)?\|\\.npmrc\|\\.netrc\|\\.git-credentials\|\\.htpasswd\|id_(rsa\|dsa\|ecdsa\|ed25519)(\\.pub)?\|[^\\\\/]*\\.(pem\|key\|ppk\|pfx\|p12\|keystore\|jks)\|[^\\\\/]*credentials[^\\\\/]*\|[^… |
| isSecretPath | function | 59 | yes | export const isSecretPath = (p) =&gt; SECRET_PATH_RE.test(String(p ?? &#39;&#39;).replace(/\\\\/g, &#39;/&#39;)); |
| DIFF_HEADER_RE | const | 62 | no | const DIFF_HEADER_RE = /^diff --git a\\/(.+?) b\\/(.+?)$/gm; |
| secretPathsInDiff | function | 63 | yes | export function secretPathsInDiff(diffText) { |
| found | const | 64 | no | const found = new Set(); |
| cap | function | 72 | no | function cap(text, max) { |
| s | const | 73 | no | const s = String(text ?? &#39;&#39;); |
| section | function | 76 | no | function section(title, body) { return body ? `\\n\\n--- ${title} ---\\n${body}` : &#39;&#39;; } |
| buildPrompt | function | 83 | yes | export function buildPrompt({ role = null, question = &#39;&#39;, diff = &#39;&#39;, diffRange = null, files = [] } = {}) { |
| spec | const | 84 | no | const spec = role ? roleSpec(role) : null; |
| warnings | const | 85 | no | const warnings = []; |
| header | const | 87 | no | const header = spec |
| q | const | 91 | no | const q = cap(question, MAX_QUESTION_CHARS); |
| SECTION_OVERHEAD | const | 97 | no | const SECTION_OVERHEAD = 200; // the two &quot;--- DIFF/FILES ---&quot; headers and their fences |
| room | const | 98 | no | const room = Math.max(0, MAX_PROMPT_CHARS - header.length - q.text.length - SECTION_OVERHEAD); |
| diffCap | const | 99 | no | const diffCap = Math.min(MAX_DIFF_CHARS, Math.floor(room * 0.6)); |
| filesCap | const | 100 | no | const filesCap = Math.min(MAX_FILES_CHARS, Math.max(0, room - diffCap)); |
| diffBlock | variable | 102 | no | let diffBlock = &#39;&#39;; |
| d | const | 106 | no | const d = cap(diff.trim(), diffCap); |
| filesBlock | variable | 112 | no | let filesBlock = &#39;&#39;; |
| budget | variable | 114 | no | let budget = filesCap; |
| parts | const | 115 | no | const parts = []; |
| filePath | const | 117 | no | const filePath = String(f?.path ?? &#39;(unnamed)&#39;), content = String(f?.content ?? &#39;&#39;); |
| take | const | 119 | no | const take = Math.min(budget, content.length); |
| trimmed | const | 120 | no | const trimmed = content.length &gt; take; |
| prompt | variable | 128 | no | let prompt = `${header}\\n\\nQuestion:\\n${q.text}${diffBlock}${filesBlock}`; |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [studio/bin/commands/ask.mjs](../../bin/commands/ask.mjs.md) | ../../src/studio/ask-prompts.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Tactical prompt-building for `studio ask` (bin/commands/ask.mjs): turns a developer --role plus
// a free-text question and optional git-diff / file context into ONE bounded, role-specific prompt
// string. That string becomes the "question" posted to the EXISTING /api/v1/compare route
// (src/studio/compare-service.mjs), which hard-caps a question at 10,000 characters — MAX_PROMPT_CHARS
// below stays under that with room for the route's own validation. Pure string building: no
// filesystem, network or git access here, so it is exercised offline by `studio ask --print-prompt`.
// Secret-looking paths (.env, credentials, private keys, …) are refused by the CALLER before their
// content ever reaches this module; isSecretPath/secretPathsInDiff are exported so the CLI and this
// module apply the exact same rule.

const MAX_PROMPT_CHARS = 9000;   // stays under compare-service's hard 10,000-char question cap
const MAX_DIFF_CHARS = 4000;
const MAX_FILES_CHARS = 3500;
const MAX_QUESTION_CHARS = 2000;
const HARD_CUT_MARKER = '\n…(cut off to stay under the size limit)';

export const ROLE_NAMES = ['reviewer', 'implementer', 'explainer', 'copywriter'];

// Each role is a bounded, explicit job: what to do, and EXACTLY what shape the answer must take.
// The output format is deliberately mechanical (findings list / single diff / plain prose / plain
// copy) so a plain-language caller can parse or forward the answer without re-asking the AI.
const ROLES = {
  reviewer: {
    label: 'code reviewer',
    instructions: 'Act as a careful, senior code reviewer for the VIVIM Harness codebase (a local-first AI-browser-automation tool). Review the question and any diff/files below. Report concrete, specific findings only — do not rewrite the code and do not restate the diff back.',
    outputFormat: 'Respond with a numbered list of findings, nothing else. Each line: "N. [SEVERITY] file:line — description", where SEVERITY is one of CRITICAL, HIGH, MEDIUM, LOW, NIT. If a finding has no clear file:line, write "file:?" rather than omitting the field. If there are no findings, respond with exactly: "No findings."',
  },
  implementer: {
    label: 'implementer',
    instructions: 'Act as an implementer for the VIVIM Harness codebase. Make the smallest correct change that satisfies the question, consistent with the existing code shown below.',
    outputFormat: 'Respond with ONE unified diff ONLY (git-style: "diff --git", "---", "+++", "@@" hunks — applyable with "git apply"). No prose before or after it, no explanation, no markdown code fences: output the raw diff text and nothing else.',
  },
  explainer: {
    label: 'explainer',
    instructions: 'Act as an explainer for a developer who does not know this part of the VIVIM Harness codebase yet. Explain the question and any diff/files below clearly and accurately.',
    outputFormat: 'Respond in plain prose: short paragraphs or a short bulleted list. Cover the "why", not only the "what". End with one short summary sentence.',
  },
  copywriter: {
    label: 'copywriter',
    instructions: 'Act as a copywriter for VIVIM, a consumer product. Write the user-facing wording the question asks for.',
    outputFormat: 'Respond in plain consumer wording only: no developer jargon (no "revision", "turn", "capture", "token", "endpoint", "API", "diff", "schema", "payload", etc.), no code, no markdown headers, short sentences. If several short texts are needed, list each on its own line prefixed by its purpose in parentheses, e.g. "(error title) …".',
  },
};

export function roleSpec(role) {
  const spec = ROLES[role];
  if (!spec) throw new RangeError(`Unknown role "${role}". Use one of: ${ROLE_NAMES.join(', ')}.`);
  return spec;
}

// A path that looks like it holds secrets. Checked by the CLI before reading --files content and
// before accepting a --diff range that touches such a path; never relied on as the only safeguard,
// but every such path is kept out of a prompt sent to a third-party AI website.
// Covers: .env* / .npmrc / .netrc / .git-credentials / .htpasswd, private keys (id_rsa, *.pem,
// *.key, *.ppk, *.keystore, *.jks, *.pfx, *.p12), anything named *credentials* / *secret* / *token*
// / *cookie*, and a browser profile directory or store under %APPDATA%/%LOCALAPPDATA% (Login Data,
// Local State, Cookies, Web Data, key4.db, logins.json) — a signed-in session is a credential too.
const SECRET_PATH_RE = /(^|[\\/])(\.env(\..+)?|\.npmrc|\.netrc|\.git-credentials|\.htpasswd|id_(rsa|dsa|ecdsa|ed25519)(\.pub)?|[^\\/]*\.(pem|key|ppk|pfx|p12|keystore|jks)|[^\\/]*credentials[^\\/]*|[^\\/]*secrets?\.(json|ya?ml|txt)|[^\\/]*(token|tokens)[-_.]?(store|jar|file|db)[^\\/]*|[^\\/]*tokens?\.(json|txt|ya?ml)|[^\\/]*cookies(\.sqlite|\.txt|\.db)?|[^\\/]*(login data|local state|web data|key[34]\.db|logins\.json)|[^\\/]*(chrome-profile|user data|mozilla|firefox|brave-browser|microsoft[\\/]edge))$/i;
export const isSecretPath = (p) => SECRET_PATH_RE.test(String(p ?? '').replace(/\\/g, '/'));

// Unified-diff file headers ("diff --git a/X b/Y") -> any touched path that looks secret.
const DIFF_HEADER_RE = /^diff --git a\/(.+?) b\/(.+?)$/gm;
export function secretPathsInDiff(diffText) {
  const found = new Set();
  for (const m of String(diffText ?? '').matchAll(DIFF_HEADER_RE)) {
    if (isSecretPath(m[1])) found.add(m[1]);
    if (isSecretPath(m[2])) found.add(m[2]);
  }
  return [...found];
}

function cap(text, max) {
  const s = String(text ?? '');
  return s.length <= max ? { text: s, trimmed: false } : { text: s.slice(0, max), trimmed: true };
}
function section(title, body) { return body ? `\n\n--- ${title} ---\n${body}` : ''; }

// @serves ask
// Build the bounded, role-specific prompt string. `role` is optional: with no role (but a diff
// and/or files), the question is still assembled with that context and no imposed output format.
```

_First 80 of 138 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
