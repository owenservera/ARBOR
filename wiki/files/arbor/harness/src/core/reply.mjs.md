# File: harness/src/core/reply.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | harness/src/core/reply.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 8504 B |
| Lines | 54 |
| Hash | 335258204efd |
| Test | no |
| Generated | no |
| Component | harness |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| sleep | function | 2 | no | const sleep = ms =&gt; new Promise(resolve =&gt; setTimeout(resolve, ms)); |
| hasReplyText | function | 4 | yes | export const hasReplyText = text =&gt; typeof text === &#39;string&#39; &amp;&amp; text.trim().length &gt; 0; |
| TRUNCATED_TAIL | const | 7 | no | const TRUNCATED_TAIL = /(and\|or\|but\|so\|then\|thus\|hence\|therefore\|moreover\|furthermore\|however\|because\|since\|when\|where\|whether\|although\|though\|despite\|rather\|instead\|besides\|meanwhile\|consequently\|ac… |
| CONTINUE_MARKERS | const | 9 | no | const CONTINUE_MARKERS = /(continue\|go on\|keep going\|carry on\|proceed\|next\|then\|after that\|following that\|subsequently\|later\|afterwards\|then\|so\|thus\|therefore\|hence\|consequently\|accordingly\|moreover\|… |
| extractCodeBlocks | function | 10 | yes | export function extractCodeBlocks(domText) { |
| blocks | const | 12 | no | const blocks = []; |
| fenceRe | const | 13 | no | const fenceRe = /```(\\w*)\\n([\\s\\S]*?)\\n```/g; |
| m | variable | 14 | no | let m; |
| detectTruncation | function | 18 | yes | export function detectTruncation(text) { |
| trimmed | const | 20 | no | const trimmed = text.trim(); |
| detectContinueStyle | function | 27 | yes | export function detectContinueStyle(text) { |
| trimmed | const | 29 | no | const trimmed = text.trim(); |
| readReply | function | 34 | yes | export async function readReply({ page, provider, journal, requestId, timeoutMs = 30000, pollIntervalMs = 250, stableSamples = 3 }) { |
| rec | const | 35 | no | const rec = await journal.read(requestId); if (!rec) throw new Error(&#39;Journal request not found&#39;); |
| expression | const | 36 | no | const expression = `(() =&gt; { /* harness:reply */ const p = ${JSON.stringify(provider)}; const all = (p.assistant?.containerSelectors \|\| []).join(&#39;,&#39;); const nodes = all ? document.querySelectorAll(al… |
| deadline | const | 37 | no | const deadline = Date.now() + Math.max(0, timeoutMs); let last = &#39;&#39;, count = 0, complete = false, error = null, lastSample = null; |
| sample | const | 40 | no | const sample = lastSample; |
| eligible | const | 41 | no | const eligible = sample.count &gt; (rec.boundary?.assistantTurns ?? 0) &amp;&amp; hasReplyText(sample.text); |
| fullText | const | 43 | no | const fullText = eligible ? (sample.text + (sample.codeBlocks ? &#39;\\n\\n---code-block\\n\\n&#39; + sample.codeBlocks : &#39;&#39;)) : &#39;&#39;; |
| digest | const | 50 | no | const digest = last ? digestPayload(last) : null; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./journal.mjs | import | 1 | [harness/src/core/journal.mjs](./journal.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [harness/src/interface/router.mjs](../interface/router.mjs.md) | ../core/reply.mjs |
| [harness/test/core/core.test.mjs](../../test/core/core.test.mjs.md) | ../../src/core/reply.mjs |
| [harness/test/core/g3-reply.test.mjs](../../test/core/g3-reply.test.mjs.md) | ../../src/core/reply.mjs |
| [harness/test/core/reply-error.test.mjs](../../test/core/reply-error.test.mjs.md) | ../../src/core/reply.mjs |

## Annotations

_No annotations._

## Excerpt

````javascript
import { digestPayload } from './journal.mjs';
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
// This reader verifies text only; image-only and other nontext replies remain unconfirmed.
export const hasReplyText = text => typeof text === 'string' && text.trim().length > 0;
// A truncated reply ends mid-sentence or on a continuation token the model commonly
// resumes on; a continue-style reply signals "keep going" with an ellipsis or trailing conjunction.
const TRUNCATED_TAIL = /(and|or|but|so|then|thus|hence|therefore|moreover|furthermore|however|because|since|when|where|whether|although|though|despite|rather|instead|besides|meanwhile|consequently|accordingly|specifically|for example|namely|that is|in summary|to conclude|finally|first|second|third|lastly|above all|particularly|especially|chiefly|mainly|primarily|essentially|basically|generally|usually|typically|normally|ordinarily|commonly|frequently|often|sometimes|rarely|never|always|simply|just|only|barely|hardly|almost|nearly|quite|rather|fairly|pretty|relatively|comparatively|somewhat|slightly|moderately|considerably|significantly|substantially|dramatically|radically|fundamentally|essentially|primarily|mainly|chiefly|notably|especially|particularly|specifically|exactly|precisely|accurately|correctly|properly|appropriately|suitably|fittingly|relevantly|pertinently|appositely|aptly|happily|luckily|fortunately|promptly|immediately|instantly|straightaway|directly|forthwith|pronto|now|presently|shortly|soon|before long|right away|right now|at once|posthaste|double-quick|full tilt|top speed|maximum velocity|breakneck|headlong|rush|haste|hurry|speed|quickness|rapidity|swiftness|celerity|dispatch|expedition|alacrity|briskness|liveliness|vivacity|animation|spirit|vigor|energy|force|power|strength|might|main|muscle|sinew|vitality|verve|zest|zip|zing|bounce|spring|buoyancy|resilience|elasticity|flexibility|pliancy|suppleness|limberness|looseness|slackness|laxity|relaxation|ease|comfort|calm|serenity|tranquility|peace|quiet|stillness|silence|hush|still|mute|dumb|speechless|wordless|taciturn|reticent|reserved|restrained|controlled|checked|curbed|reined|bridled|held back|kept in check|kept in line|kept in order|kept in place|kept in position|kept in station|kept in post|kept in duty|kept in service|kept in use|kept in operation|kept in function|kept in working order|kept in good condition|kept in good repair|kept in good shape|kept in good standing|kept in good repute|kept in good favor|kept in good graces|kept in good humor|kept in good spirits|kept in good heart|kept in good mind|kept in good conscience|kept in good faith|kept in good order|kept in good sequence|kept in good arrangement|kept in good organization|kept in good system|kept in good method|kept in good manner|kept in good fashion|kept in good style|kept in good mode|kept in good form|kept in good trim|kept in good case|kept in good plight|kept in good state|kept in good condition|kept in good health|kept in good soundness|kept in good wholeness|kept in good completeness|kept in good fullness|kept in good totality|kept in good entirety|kept in good integrity|kept in good unity|kept in good solidarity|kept in good harmony|kept in good accord|kept in good agreement|kept in good conformity|kept in good compliance|kept in good accordance|kept in good consonance|kept in good resonance|kept in good sympathy|kept in good empathy|kept in good rapport|kept in good affinity|kept in good connection|kept in good relationship|kept in good association|kept in good affiliation|kept in good alliance|kept in good partnership|kept in good cooperation|kept in good collaboration|kept in good coordination|kept in good unison|kept in good concert|kept in good chorus|kept in good choir|kept in good ensemble|kept in good group|kept in good team|kept in good squad|kept in good crew|kept in good gang|kept in good band|kept in good company|kept in good society|kept in good community|kept in good collective|kept in good commune|kept in good fraternity|kept in good sorority|kept in good club|kept in good guild|kept in good union|kept in good league|kept in good federation|kept in good confederation|kept in good coalition|kept in good combination|kept in good consolidation|kept in good merger|kept in good amalgamation|kept in good fusion|kept in good blending|kept in good mixing|kept in good mingling|kept in good intermingling|kept in good interweaving|kept in good intertwining|kept in good interlacing|is|are|was|were|be|been|being|have|has|had|do|does|did|can|could|will|would|shall|should|may|might|must|ought)$/i;
// Continuation markers that indicate the model expects to keep writing.
const CONTINUE_MARKERS = /(continue|go on|keep going|carry on|proceed|next|then|after that|following that|subsequently|later|afterwards|then|so|thus|therefore|hence|consequently|accordingly|moreover|furthermore|in addition|besides|also|likewise|similarly|correspondingly|equally|likewise|again|further|additionally|plus|and|plus|as well|too|either|neither|nor|both|not only|but also|either|or|neither|nor|whether|or|either|or|neither|nor|both|and|not only|but also)/i;
export function extractCodeBlocks(domText) {
  // Rendered DOM may contain fenced code blocks; extract them separately from prose.
  const blocks = [];
  const fenceRe = /```(\w*)\n([\s\S]*?)\n```/g;
  let m;
  while ((m = fenceRe.exec(domText)) !== null) blocks.push({ lang: m[1] || 'text', code: m[2] });
  return blocks;
}
export function detectTruncation(text) {
  if (!text) return null;
  const trimmed = text.trim();
  if (!trimmed) return null;
  // Ends mid-token or on a continuation word => likely truncated.
  if (TRUNCATED_TAIL.test(trimmed)) return 'truncated';
  if (/…$|\.\.\.$|,$|;$|:$|&$|-$|\\$|{$|}$|\[$|\]$|\($|\)$/.test(trimmed)) return 'truncated';
  return null;
}
export function detectContinueStyle(text) {
  if (!text) return null;
  const trimmed = text.trim();
  if (!trimmed) return null;
  if (/^continue/i.test(trimmed) || /^go on/i.test(trimmed) || /^carry on/i.test(trimmed)) return 'continue-style';
  return null;
}
export async function readReply({ page, provider, journal, requestId, timeoutMs = 30000, pollIntervalMs = 250, stableSamples = 3 }) {
  const rec = await journal.read(requestId); if (!rec) throw new Error('Journal request not found');
  const expression = `(() => { /* harness:reply */ const p = ${JSON.stringify(provider)}; const all = (p.assistant?.containerSelectors || []).join(','); const nodes = all ? document.querySelectorAll(all) : []; const e = nodes[nodes.length-1]; const ex = (p.assistant?.excludeSelectors || []).join(','); const readText = n => (n.innerText || n.textContent || ''); const text = !e ? '' : !ex ? readText(e) : Array.from(e.children).filter(c => !c.matches(ex) && !c.querySelector(ex)).map(readText).join('\\n\\n'); const codeBlocks = Array.from(e ? e.querySelectorAll('pre code') : []).map(c => c.textContent || c.innerText || '').join('\\n\\n---code-block\\n\\n'); return { text, codeBlocks, streaming:(p.assistant?.streamingSelectors || []).some(s => !!document.querySelector(s)), count:nodes.length, error:(p.assistant?.errorTexts || []).find(t => (document.body.innerText || '').includes(t)) || null }; })()`;
  const deadline = Date.now() + Math.max(0, timeoutMs); let last = '', count = 0, complete = false, error = null, lastSample = null;
  do {
    lastSample = await page.evaluate(expression);
    const sample = lastSample;
    const eligible = sample.count > (rec.boundary?.assistantTurns ?? 0) && hasReplyText(sample.text);
    if (sample.error && !eligible) { error = sample.error; break; }
    const fullText = eligible ? (sample.text + (sample.codeBlocks ? '\n\n---code-block\n\n' + sample.codeBlocks : '')) : '';
    if (eligible && !sample.streaming && fullText === last) count++; else count = eligible && !sample.streaming ? 1 : 0;
    last = eligible ? fullText : '';
    if (count >= Math.max(1, stableSamples)) { complete = true; break; }
    if (Date.now() >= deadline) break;
    await sleep(Math.min(pollIntervalMs, Math.max(0, deadline-Date.now())));
  } while (true);
  const digest = last ? digestPayload(last) : null;
  if (digest) await journal.update(requestId, { replyDigest:digest });
  if (error) await journal.update(requestId, { reason:'PROVIDER_ERROR' });
  return { text:last, complete, digest, codeBlocks: lastSample ? lastSample.codeBlocks : undefined, ...(error ? { error } : {}) };
}
````

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
