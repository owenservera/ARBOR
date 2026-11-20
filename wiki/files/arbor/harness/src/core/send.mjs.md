# File: harness/src/core/send.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | harness/src/core/send.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 10460 B |
| Lines | 118 |
| Hash | 827e14bcf622 |
| Test | no |
| Generated | no |
| Component | harness |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| digestPayload | export | 2 | yes | export { digestPayload, threadKeyFor } |
| threadKeyFor | export | 2 | yes | export { digestPayload, threadKeyFor } |
| snapshotExpression | function | 5 | yes | export function snapshotExpression(provider) { |
| p | const | 7 | no | const p = ${JSON.stringify(provider)}; |
| first | function | 8 | no | const first = xs =&gt; (xs \|\| []).map(s =&gt; document.querySelector(s)).find(Boolean); |
| composer | const | 9 | no | const composer = first(p.composer?.selectors); |
| text | function | 11 | no | const text = e =&gt; e ? ((&#39;value&#39; in e ? e.value : e.innerText) \|\| &#39;&#39;).trim() : &#39;&#39;; |
| norm | function | 13 | no | const norm = t =&gt; t.replace(/\\\\s+/g, &#39; &#39;).trim(); |
| turnText | function | 14 | no | const turnText = e =&gt; p.user?.lineSelector ? Array.from(e.querySelectorAll(p.user.lineSelector)).map(l =&gt; (l.innerText \|\| &#39;&#39;).trim()).join(&#39;\\\\n&#39;) : text(e); |
| users | const | 15 | no | const users = Array.from(document.querySelectorAll((p.user?.selectors \|\| []).join(&#39;,&#39;) \|\| &#39;[data-message-author-role=&quot;user&quot;], [data-testid=&quot;user-message&quot;], [data-role=&quot;user&quot;]&#39;)).map(e =&gt; norm(turnTex… |
| assistants | const | 16 | no | const assistants = Array.from(document.querySelectorAll((p.assistant?.containerSelectors \|\| []).join(&#39;,&#39;) \|\| &#39;[data-message-author-role=&quot;assistant&quot;]&#39;)); |
| focusExpression | function | 20 | yes | export function focusExpression(provider) { |
| p | const | 22 | no | const p = ${JSON.stringify(provider)}; |
| sleep | function | 27 | no | const sleep = ms =&gt; new Promise(resolve =&gt; setTimeout(resolve, ms)); |
| threadId | function | 28 | no | function threadId(profile, url) { |
| u | const | 29 | no | const u = new URL(url); if (!profile.hosts.includes(u.hostname)) return null; |
| regex | const | 31 | no | const regex = profile.threadPattern instanceof RegExp ? new RegExp(profile.threadPattern.source, profile.threadPattern.flags.replace(/[gy]/g,&#39;&#39;)) : new RegExp(profile.threadPattern); |
| sendOnce | function | 34 | yes | export async function sendOnce({ page, provider, journal, requestId, threadUrl, prompt, approval, observeTimeoutMs = 1000, pollIntervalMs = 100, readyTimeoutMs = 0, threadUrlTimeoutMs = 0 }) { |
| payloadDigest | const | 35 | no | const payloadDigest = digestPayload(prompt); |
| normalizedThread | const | 36 | no | const normalizedThread = threadUrl === &#39;new&#39; \|\| threadUrl == null ? null : threadUrl; |
| created | const | 37 | no | const created = await journal.create({ requestId, provider:provider.id, threadKey:threadKeyFor(provider, normalizedThread), payloadDigest }); |
| result | function | 38 | no | const result = rec =&gt; ({ state:rec.state, submitted:rec.submitted, ...(rec.reason ? { reason:rec.reason } : {}), requestId, threadUrl:normalizedThread }); |
| block | function | 40 | no | const block = async reason =&gt; result(await journal.update(requestId, { state:&#39;blocked&#39;, submitted:&#39;no&#39;, reason })); |
| snap | variable | 42 | no | let snap; |
| readyBy | const | 46 | no | const readyBy = Date.now() + Math.max(0, readyTimeoutMs); |
| onHost | function | 47 | no | const onHost = u =&gt; { try { return provider.hosts.includes(new URL(u).hostname); } catch { return false; } }; |
| readUrl | function | 48 | no | const readUrl = () =&gt; Promise.resolve().then(() =&gt; page.url()).catch(() =&gt; &#39;about:blank&#39;); |
| url | variable | 49 | no | let url = await readUrl(); |
| current | const | 51 | no | const current = new URL(url); |
| visible | variable | 65 | no | let visible = false; |
| focused | const | 71 | no | const focused = await page.evaluate(focusExpression(provider)); |
| typed | const | 74 | no | const typed = await page.evaluate(snapshotExpression(provider)); |
| ws | function | 79 | no | const ws = t =&gt; t.replace(/\\s+/g, &#39; &#39;).trim(); |
| sameAllowingUrlSpace | function | 80 | no | const sameAllowingUrlSpace = (p, c) =&gt; { let i = 0, j = 0; while (i &lt; p.length \|\| j &lt; c.length) { if (p[i] === c[j]) { i++; j++; } else if (c[j] === &#39; &#39; &amp;&amp; /^https?:\\/\\//.test(c.slice(j + 1, j + 9)))… |
| normPrompt | const | 91 | no | const normPrompt = prompt.replace(/\\s+/g, &#39; &#39;).trim(); |
| unmark | function | 95 | no | const unmark = t =&gt; t.normalize(&#39;NFKC&#39;).replace(/[^\\p{L}\\p{N}]+/gu, &#39;&#39;); |
| PREFIX | const | 99 | no | const PREFIX = 1500; const core = unmark(normPrompt); |
| truncated | function | 100 | no | const truncated = t =&gt; { const m = String(t).match(/^([\\s\\S]*?)\\s*…?\\s*Show more\\s*$/i); return m ? unmark(m[1]) : null; }; |
| isOurs | function | 101 | no | const isOurs = t =&gt; { if (t === normPrompt \|\| unmark(t) === core) return true; const v = truncated(t); return v !== null &amp;&amp; v.length &gt;= PREFIX &amp;&amp; v.length &lt; core.length &amp;&amp; core.startsWith(v); }; |
| readUrlSafe | function | 102 | no | const readUrlSafe = () =&gt; Promise.resolve().then(() =&gt; page.url()).catch(() =&gt; null); |
| waitThreadUrl | function | 104 | no | const waitThreadUrl = async () =&gt; { |
| url | variable | 106 | no | let url = await readUrlSafe(); |
| safeThreadId | function | 110 | no | const safeThreadId = url =&gt; { try { return threadId(provider, url); } catch { return null; } }; |
| deadline | const | 111 | no | const deadline = Date.now() + Math.max(0, observeTimeoutMs); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./journal.mjs | import | 1 | [harness/src/core/journal.mjs](./journal.mjs.md) |
| ./journal.mjs | export_from | 2 | [harness/src/core/journal.mjs](./journal.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [harness/scripts/signin-check.mjs](../../scripts/signin-check.mjs.md) | ../src/core/send.mjs |
| [harness/test/core/core.test.mjs](../../test/core/core.test.mjs.md) | ../../src/core/send.mjs |
| [harness/test/core/core.test.mjs](../../test/core/core.test.mjs.md) | ../../src/core/send.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
import { digestPayload, threadKeyFor } from './journal.mjs';
export { digestPayload, threadKeyFor } from './journal.mjs';

// Expressions return only the DOM data needed for preflight and attribution.
export function snapshotExpression(provider) {
  return `(() => { /* harness:snapshot */
    const p = ${JSON.stringify(provider)};
    const first = xs => (xs || []).map(s => document.querySelector(s)).find(Boolean);
    const composer = first(p.composer?.selectors);
    /* Rich editors (ProseMirror) report an empty composer as a lone newline: compare trimmed text. */
    const text = e => e ? (('value' in e ? e.value : e.innerText) || '').trim() : '';
    /* Some providers render one user turn as several line elements: join them, then normalize whitespace. */
    const norm = t => t.replace(/\\s+/g, ' ').trim();
    const turnText = e => p.user?.lineSelector ? Array.from(e.querySelectorAll(p.user.lineSelector)).map(l => (l.innerText || '').trim()).join('\\n') : text(e);
    const users = Array.from(document.querySelectorAll((p.user?.selectors || []).join(',') || '[data-message-author-role="user"], [data-testid="user-message"], [data-role="user"]')).map(e => norm(turnText(e)));
    const assistants = Array.from(document.querySelectorAll((p.assistant?.containerSelectors || []).join(',') || '[data-message-author-role="assistant"]'));
    return { authWall: !!first(p.preflight?.authWallSelectors), composer: !!composer, composerText:text(composer), userTurns:users, assistantTurns:assistants.length, buttonSelector:(p.send?.buttonSelectors || []).find(s => document.querySelector(s)) || null };
  })()`;
}
export function focusExpression(provider) {
  return `(() => { /* harness:focus */
    const p = ${JSON.stringify(provider)};
    for (const s of (p.composer?.selectors || [])) { const e = document.querySelector(s); if (e) { e.focus(); return document.activeElement === e || e.contains(document.activeElement); } }
    return false;
  })()`;
}
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
function threadId(profile, url) {
  const u = new URL(url); if (!profile.hosts.includes(u.hostname)) return null;
  if (!profile.threadPattern) return null;
  const regex = profile.threadPattern instanceof RegExp ? new RegExp(profile.threadPattern.source, profile.threadPattern.flags.replace(/[gy]/g,'')) : new RegExp(profile.threadPattern);
  return regex.exec(u.pathname)?.groups?.id ?? null;
}
export async function sendOnce({ page, provider, journal, requestId, threadUrl, prompt, approval, observeTimeoutMs = 1000, pollIntervalMs = 100, readyTimeoutMs = 0, threadUrlTimeoutMs = 0 }) {
  const payloadDigest = digestPayload(prompt);
  const normalizedThread = threadUrl === 'new' || threadUrl == null ? null : threadUrl;
  const created = await journal.create({ requestId, provider:provider.id, threadKey:threadKeyFor(provider, normalizedThread), payloadDigest });
  const result = rec => ({ state:rec.state, submitted:rec.submitted, ...(rec.reason ? { reason:rec.reason } : {}), requestId, threadUrl:normalizedThread });
  if (!created.created) return result(created.existing || {state:'uncertain', submitted:'unknown'});
  const block = async reason => result(await journal.update(requestId, { state:'blocked', submitted:'no', reason }));
  if (!approval || approval.requestId !== requestId || approval.payloadDigest !== payloadDigest || approval.provider !== provider.id || approval.threadUrl !== normalizedThread || !Number.isFinite(approval.expiresAt) || approval.expiresAt <= Date.now() || !approval.approvedAt) return block('APPROVAL_INVALID');
  let snap;
  try {
    // Read-only readiness wait: a fresh tab may still be on about:blank, and SPAs often render the
    // composer after load. Nothing is typed meanwhile; binding is checked on the final URL.
    const readyBy = Date.now() + Math.max(0, readyTimeoutMs);
    const onHost = u => { try { return provider.hosts.includes(new URL(u).hostname); } catch { return false; } };
    const readUrl = () => Promise.resolve().then(() => page.url()).catch(() => 'about:blank');
    let url = await readUrl();
    while (!onHost(url) && Date.now() < readyBy) { await sleep(Math.min(250, readyBy - Date.now())); url = await readUrl(); }
    const current = new URL(url);
    if (!provider.hosts.includes(current.hostname)) return block('BINDING_MISMATCH');
    if (normalizedThread) { const expected = threadId(provider, normalizedThread); if (!expected || threadId(provider, url) !== expected || new URL(normalizedThread).hostname !== current.hostname) return block('BINDING_MISMATCH'); }
    snap = await page.evaluate(snapshotExpression(provider));
    while ((!snap.composer || snap.authWall) && Date.now() < readyBy) { await sleep(Math.min(250, readyBy - Date.now())); snap = await page.evaluate(snapshotExpression(provider)); }
    if (snap.authWall) return block('AUTH_WALL');
    if (!snap.composer) return block('COMPOSER_MISSING');
    if (snap.composerText !== '') return block('DRAFT_PRESENT');
    if (!Array.isArray(snap.userTurns) || !Number.isInteger(snap.assistantTurns)) return block('BASELINE_UNAVAILABLE');
    // Some sites (Qwen) silently drop a send from a hidden background tab: bring the harness's own
    // tab to the front first, and refuse to type if it is still hidden.
    if (provider.send.foreground) {
      if (typeof page.bringToFront !== 'function') return block('FOREGROUND_UNSUPPORTED');
      await page.bringToFront();
      let visible = false;
      for (let i = 0; i < 20 && !visible; i++) { visible = await page.evaluate('document.visibilityState') === 'visible'; if (!visible) await sleep(100); }
      if (!visible) return block('FOREGROUND_FAILED');
    }
    await journal.update(requestId, { state:'typing', boundary:{ userTurns:snap.userTurns.length, assistantTurns:snap.assistantTurns } });
    // Input.insertText goes to the focused element: focus the composer first (never clears or edits it).
    const focused = await page.evaluate(focusExpression(provider));
    if (focused !== true) return block('COMPOSER_NOT_FOCUSABLE');
    await page.insertText(prompt);
    const typed = await page.evaluate(snapshotExpression(provider));
    // Rich editors (ProseMirror) render blank lines as extra empty paragraphs in innerText: the typed
    // text must match exactly up to whitespace runs (every non-whitespace character still has to match).
    // ChatGPT also inserts a space before auto-linked URLs.
    // One-directional: the composer may ADD a space before http(s)://; a space missing from it never matches.
    const ws = t => t.replace(/\s+/g, ' ').trim();
    const sameAllowingUrlSpace = (p, c) => { let i = 0, j = 0; while (i < p.length || j < c.length) { if (p[i] === c[j]) { i++; j++; } else if (c[j] === ' ' && /^https?:\/\//.test(c.slice(j + 1, j + 9))) j++; else return false; } return true; };
```

_First 80 of 119 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
