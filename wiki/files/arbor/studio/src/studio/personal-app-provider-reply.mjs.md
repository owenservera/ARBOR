# File: studio/src/studio/personal-app-provider-reply.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/studio/personal-app-provider-reply.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 8678 B |
| Lines | 141 |
| Hash | b13454e116c8 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| PROVIDER_REPLY_SOURCE | const | 9 | yes | export const PROVIDER_REPLY_SOURCE = &#39;provider-reply&#39;; |
| CONVERSATION_ID | const | 10 | no | const CONVERSATION_ID = /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,127}$/; |
| FENCE | const | 11 | no | const FENCE = /```[ \\t]*([A-Za-z0-9_-]*)[ \\t]*\\r?\\n([\\s\\S]*?)\\r?\\n?```/g; |
| CONTROL | const | 12 | no | const CONTROL = /[\\u0000-\\u001f\\u007f]/; |
| SMART_SINGLE | const | 17 | no | const SMART_SINGLE = /[\\u2018\\u2019\\u201A\\u201B]/g; |
| SMART_DOUBLE | const | 18 | no | const SMART_DOUBLE = /[\\u201C\\u201D\\u201E\\u201F]/g; |
| straightenQuotes | function | 19 | no | const straightenQuotes = text =&gt; text.replace(SMART_SINGLE, &quot;&#39;&quot;).replace(SMART_DOUBLE, &#39;&quot;&#39;); |
| DIGEST | const | 20 | no | const DIGEST = /^[a-f0-9]{64}$/; |
| digestOf | function | 21 | no | const digestOf = text =&gt; createHash(&#39;sha256&#39;).update(text, &#39;utf8&#39;).digest(&#39;hex&#39;); |
| ambiguous | function | 22 | no | const ambiguous = () =&gt; problem(400, &#39;This saved answer contains more than one possible design. Choose another answer, or ask your AI for one app design, then preview it again. Nothing was changed.&#39;,… |
| designProblem | function | 27 | no | function designProblem(error) { |
| guidance | const | 28 | no | const guidance = { |
| emptyReply | function | 36 | no | const emptyReply = () =&gt; problem(409, &#39;This saved answer has no text to use as a design. Choose another answer or ask your AI for a new design.&#39;, &#39;PROVIDER_REPLY_EMPTY&#39;); |
| proposalFromReply | function | 38 | no | const proposalFromReply = text =&gt; { |
| jsonObjectsIn | function | 45 | no | function jsonObjectsIn(text) { |
| found | const | 46 | no | const found = []; |
| depth | variable | 49 | no | let depth = 0, inString = false, end = -1; |
| c | const | 51 | no | const c = text[j]; |
| slice | const | 58 | no | const slice = text.slice(i, end + 1); |
| value | const | 60 | no | const value = JSON.parse(slice); |
| extractProposalText | function | 73 | yes | export function extractProposalText(replyText) { |
| text | const | 74 | no | const text = straightenQuotes(String(replyText ?? &#39;&#39;)); |
| blocks | const | 75 | no | const blocks = [...text.matchAll(FENCE)] |
| whole | const | 80 | no | const whole = text.trim(); |
| objects | const | 82 | no | const objects = whole.length &lt;= 100_000 ? jsonObjectsIn(whole) : []; // bounded scan; huge replies fail the compiler size cap anyway |
| createProviderReplyBuilder | function | 87 | yes | export function createProviderReplyBuilder({ apps, readStoredConversation } = {}) { |
| observedReply | function | 91 | no | async function observedReply({ conversation, turnId }) { |
| stored | const | 101 | no | const stored = await readStoredConversation(conversation); |
| turn | const | 102 | no | const turn = Array.isArray(stored?.turns) ? stored.turns.find(item =&gt; item?.id === turnId) : null; |
| reply | const | 104 | no | const reply = turn.reply; |
| replyDigest | const | 109 | no | const replyDigest = digestOf(reply.text); |
| preview | function | 120 | no | async function preview({ id, conversation, turnId } = {}) { |
| result | const | 123 | no | const result = apps.previewChange({ id, proposal: proposalFromReply(replyText) }); |
| apply | function | 127 | no | async function apply({ id, conversation, turnId, replyDigest, expectedVersion, approval } = {}) { |
| result | const | 136 | no | const result = apps.applyChange({ id, expectedVersion, proposal: proposalFromReply(replyText), approval }); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 6 | external |
| ./http.mjs | import | 7 | [studio/src/studio/http.mjs](./http.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/src/studio/personal-app-ai-design.mjs](./personal-app-ai-design.mjs.md) | ./personal-app-provider-reply.mjs |
| [studio/src/studio/personal-app-routes.mjs](./personal-app-routes.mjs.md) | ./personal-app-provider-reply.mjs |

## Annotations

_No annotations._

## Excerpt

````javascript
// Opt-in bridge: an ALREADY-STORED, ALREADY-OBSERVED provider reply -> the existing personal app compiler.
// Pure consumption: the only conversation capability received is a stored-snapshot reader
// (the same read-only seam as get_conversation). This module never submits, reads a live page,
// reconciles, resends, opens a browser, or touches the network. It never auto-applies:
// apply requires the same explicit 'user-confirmed' approval and CAS version as human proposals.
import { createHash } from 'node:crypto';
import { problem } from './http.mjs';

export const PROVIDER_REPLY_SOURCE = 'provider-reply';
const CONVERSATION_ID = /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,127}$/;
const FENCE = /```[ \t]*([A-Za-z0-9_-]*)[ \t]*\r?\n([\s\S]*?)\r?\n?```/g;
const CONTROL = /[\u0000-\u001f\u007f]/;
// Providers/pages sometimes render plain-prose JSON with typographic ("smart") quotes
// (U+2018/'/U+2019, U+201C/"/U+201D) instead of the straight ASCII quotes JSON requires.
// Straightening them is lossless for JSON structure and only changes incidental styling
// inside any label text, so it is applied unconditionally before any parse attempt.
const SMART_SINGLE = /[\u2018\u2019\u201A\u201B]/g;
const SMART_DOUBLE = /[\u201C\u201D\u201E\u201F]/g;
const straightenQuotes = text => text.replace(SMART_SINGLE, "'").replace(SMART_DOUBLE, '"');
const DIGEST = /^[a-f0-9]{64}$/;
const digestOf = text => createHash('sha256').update(text, 'utf8').digest('hex');
const ambiguous = () => problem(400,
  'This saved answer contains more than one possible design. Choose another answer, or ask your AI for one app design, then preview it again. Nothing was changed.', 'PROVIDER_REPLY_AMBIGUOUS');

// Keep the compiler's stable codes/statuses (including CAS conflicts) while giving
// the saved-reply picker a useful next step rather than a raw JSON/schema error.
function designProblem(error) {
  const guidance = {
    PERSONAL_APP_INVALID: 'This saved answer is not an app design VIVIM can use. Choose another answer, or ask your AI for a screen design for this app, then preview it again. Nothing was changed.',
    PERSONAL_APP_VERSION_CONFLICT: 'This design is for another app or an older version. Choose a design for this app as it is now, then preview it again. Nothing was changed.',
    PERSONAL_APP_SCREEN_EXISTS: 'This design repeats a screen your app already has. Choose another answer, or ask your AI for different screens. Nothing was changed.',
    PERSONAL_APP_LIMIT: 'This design would add too many screens. Ask your AI for fewer screens, or use another app. Nothing was changed.',
  };
  return guidance[error?.code] ? problem(error.status ?? 400, guidance[error.code], error.code) : error;
}
const emptyReply = () => problem(409,
  'This saved answer has no text to use as a design. Choose another answer or ask your AI for a new design.', 'PROVIDER_REPLY_EMPTY');
const proposalFromReply = text => {
  if (!text.trim()) throw emptyReply();
  return extractProposalText(text);
};

// Top-level {...} spans of prose that parse as JSON objects. Quotes are only tracked INSIDE a brace span,
// so apostrophes/quotes in the surrounding prose cannot desynchronise the scan.
function jsonObjectsIn(text) {
  const found = [];
  for (let i = 0; i < text.length; i++) {
    if (text[i] !== '{') continue;
    let depth = 0, inString = false, end = -1;
    for (let j = i; j < text.length && end < 0; j++) {
      const c = text[j];
      if (inString) { if (c === '\\') j++; else if (c === '"') inString = false; }
      else if (c === '"') inString = true;
      else if (c === '{') depth++;
      else if (c === '}' && --depth === 0) end = j;
    }
    if (end < 0) break; // unbalanced from here on: nothing further can close
    const slice = text.slice(i, end + 1);
    try {
      const value = JSON.parse(slice);
      if (value && typeof value === 'object' && !Array.isArray(value) && !found.includes(slice)) found.push(slice);
      i = end; // a valid object's inner braces are never separate candidates
    } catch { /* not JSON: keep scanning from the next brace (it may open the real object) */ }
  }
  return found;
}

// Providers usually wrap JSON in a markdown fence. A ```json fence always counts; a bare ``` fence counts
// only when it holds an object (so an extra shell/code snippet next to the JSON is not "ambiguous").
// More than one candidate is refused rather than guessed. Without fences: a reply that starts with '{' is
// passed whole (so the compiler reports the real JSON error); otherwise exactly one embedded JSON object
// (page-captured replies render a code block as "json Copy code {...}"). The compiler stays the sole judge.
export function extractProposalText(replyText) {
  const text = straightenQuotes(String(replyText ?? ''));
  const blocks = [...text.matchAll(FENCE)]
    .filter(([, tag, body]) => (tag ? tag.toLowerCase() === 'json' : body.trim().startsWith('{')))
    .map(match => match[2].trim());
  if (blocks.length > 1) throw ambiguous();
  if (blocks.length === 1) return blocks[0];
  const whole = text.trim();
````

_First 80 of 142 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
