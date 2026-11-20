# File: apps/mobile-relay/bootstrap-f01.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | apps/mobile-relay/bootstrap-f01.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 8510 B |
| Lines | 162 |
| Hash | 75c7bc11dc1b |
| Test | no |
| Generated | no |
| Component | mobile-relay |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| F01_SCHEMA | const | 5 | yes | export const F01_SCHEMA = &#39;vivim.bootstrap-fast/1&#39;; |
| F01_PROFILE_SCHEMA | const | 6 | yes | export const F01_PROFILE_SCHEMA = &#39;vivim.bootstrap-profile/1&#39;; |
| KINDS | const | 7 | no | const KINDS = [&#39;project&#39;, &#39;interest&#39;, &#39;goal&#39;, &#39;practice&#39;]; |
| FRESHNESS | const | 8 | no | const FRESHNESS = [&#39;current&#39;, &#39;historical&#39;, &#39;unknown&#39;]; |
| BASIS | const | 9 | no | const BASIS = [&#39;explicitly_stated&#39;, &#39;provider_memory_report&#39;, &#39;tentative_inference&#39;]; |
| MAX_FOCUS | const | 10 | no | const MAX_FOCUS = 3; |
| MAX_UNKNOWNS | const | 11 | no | const MAX_UNKNOWNS = 5; |
| MAX_CARDS | const | 12 | no | const MAX_CARDS = 3; |
| MAX_BOUNDARIES | const | 13 | no | const MAX_BOUNDARIES = 8; |
| CONTROL | const | 14 | no | const CONTROL = /[\\u0000-\\u001f\\u007f]/; |
| URLISH | const | 15 | no | const URLISH = /(?:https?:\\/\\/\|www\\.\|javascript:\|data:text\\/html\|&lt;script\|&lt;\\/)/i; |
| NAME_ONLY | const | 16 | no | const NAME_ONLY = /^[A-Z][a-z]+ [A-Z][a-z]+$/; |
| fail | function | 18 | no | function fail(reason) { throw new TypeError(&#39;Invalid F01 recognition: &#39; + reason); } |
| text | function | 19 | no | function text(value, limit, name, { allowName = false } = {}) { |
| v | const | 21 | no | const v = value.trim(); |
| object | function | 28 | no | function object(value, allowed, name) { |
| bounded | function | 32 | no | function bounded(value, max, name) { |
| ROOT | const | 38 | no | const ROOT = [&#39;schema&#39;, &#39;generationId&#39;, &#39;passId&#39;, &#39;communication&#39;, &#39;focus&#39;, &#39;unknowns&#39;, &#39;suggestedCards&#39;, &#39;boundaries&#39;]; |
| COMMUNICATION | const | 39 | no | const COMMUNICATION = [&#39;language&#39;, &#39;tone&#39;, &#39;responseStyle&#39;]; |
| parseF01Response | function | 41 | yes | export function parseF01Response(source) { |
| raw | variable | 42 | no | let raw = source; |
| communication | const | 52 | no | const communication = {}; |
| focus | const | 60 | no | const focus = bounded(raw.focus ?? [], MAX_FOCUS, &#39;focus&#39;).map((item, i) =&gt; { object(item, [&#39;label&#39;, &#39;kind&#39;, &#39;freshness&#39;, &#39;basis&#39;, &#39;explanation&#39;], &#39;focus[&#39; + i + &#39;]&#39;); if (!KINDS.includes(item.kind))… |
| unknowns | const | 74 | no | const unknowns = bounded(raw.unknowns ?? [], MAX_UNKNOWNS, &#39;unknowns&#39;) |
| labels | const | 77 | no | const labels = new Set(focus.map(f =&gt; f.label.toLowerCase())); |
| suggestedCards | const | 78 | no | const suggestedCards = bounded(raw.suggestedCards ?? [], MAX_CARDS, &#39;suggestedCards&#39;).map((card, i) =&gt; { object(card, [&#39;title&#39;, &#39;focus&#39;], &#39;suggestedCards[&#39; + i + &#39;]&#39;); const title = text(card.title, … |
| title | const | 80 | no | const title = text(card.title, 64, &#39;card title&#39;); |
| link | const | 82 | no | const link = text(card.focus, 80, &#39;card focus&#39;); |
| boundaries | const | 90 | no | const boundaries = bounded(raw.boundaries ?? [], MAX_BOUNDARIES, &#39;boundaries&#39;).map((b, i) =&gt; { object(b, [&#39;trait&#39;, &#39;basis&#39;, &#39;hard&#39;], &#39;boundaries[&#39; + i + &#39;]&#39;); if (!BASIS.includes(b.basis)) fail(&#39;boun… |
| claimId | function | 105 | yes | export function claimId(worldId, section, label) { |
| value | const | 106 | no | const value = worldId + &#39;\\u0000&#39; + section + &#39;\\u0000&#39; + label.toLowerCase(); |
| hash | variable | 107 | no | let hash = 0x811c9dc5; |
| providerStatus | function | 116 | yes | export function providerStatus(basis) { |
| compileF01Profile | function | 120 | yes | export function compileF01Profile(input, { worldId, requestId } = {}) { |
| profile | const | 123 | no | const profile = parseF01Response(input); |
| claims | const | 124 | no | const claims = []; |
| cards | const | 151 | no | const cards = profile.suggestedCards.map((card, i) =&gt; ({ id: claimId(worldId, &#39;card&#39;, card.title), title: card.title, ...(card.focus ? { focus: card.focus } : {}), rank: i, source: &#39;F01&#39; })); |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [apps/mobile-relay/bootstrap-prompts.mjs](./bootstrap-prompts.mjs.md) | ./bootstrap-f01.mjs |
| [apps/vivim-host/bootstrap/service.mjs](../vivim-host/bootstrap/service.mjs.md) | ../../mobile-relay/bootstrap-f01.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Trusted deterministic compiler for ChatGPT F01 "recognise me" replies.
// Bounded, dependency-free, no DOM/network/storage effect: the Host assigns claim
// ids, provenance and revisions after this returns. A provider statement is never
// owner confirmation.
export const F01_SCHEMA = 'vivim.bootstrap-fast/1';
export const F01_PROFILE_SCHEMA = 'vivim.bootstrap-profile/1';
const KINDS = ['project', 'interest', 'goal', 'practice'];
const FRESHNESS = ['current', 'historical', 'unknown'];
const BASIS = ['explicitly_stated', 'provider_memory_report', 'tentative_inference'];
const MAX_FOCUS = 3;
const MAX_UNKNOWNS = 5;
const MAX_CARDS = 3;
const MAX_BOUNDARIES = 8;
const CONTROL = /[\u0000-\u001f\u007f]/;
const URLISH = /(?:https?:\/\/|www\.|javascript:|data:text\/html|<script|<\/)/i;
const NAME_ONLY = /^[A-Z][a-z]+ [A-Z][a-z]+$/;

function fail(reason) { throw new TypeError('Invalid F01 recognition: ' + reason); }
function text(value, limit, name, { allowName = false } = {}) {
  if (typeof value !== 'string') fail(name + ' must be text');
  const v = value.trim();
  if (!v || v.length > limit) fail(name + ' length');
  if (CONTROL.test(v)) fail(name + ' control characters');
  if (URLISH.test(v)) fail(name + ' must not contain links, markup or scripts');
  if (!allowName && NAME_ONLY.test(v)) fail(name + ' looks like an unverified personal name');
  return v;
}
function object(value, allowed, name) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(name + ' must be an object');
  for (const key of Object.keys(value)) if (!allowed.includes(key)) fail('unsupported ' + name + ' field: ' + key);
}
function bounded(value, max, name) {
  if (!Array.isArray(value) || value.length > max) fail(name + ' must be an array of at most ' + max);
  return value;
}

// `blocks` is optional and additive: the documented F01 prompt omits it and stays valid.
const ROOT = ['schema', 'generationId', 'passId', 'communication', 'focus', 'unknowns', 'suggestedCards', 'boundaries'];
const COMMUNICATION = ['language', 'tone', 'responseStyle'];

export function parseF01Response(source) {
  let raw = source;
  if (typeof source === 'string') {
    if (source.length > 12000) fail('oversized response');
    try { raw = JSON.parse(source); } catch { fail('expected one JSON object, no Markdown fences'); }
  }
  object(raw, ROOT, 'response');
  if (raw.schema !== F01_SCHEMA) fail('schema');
  if (raw.passId !== 'F01') fail('passId');
  if (typeof raw.generationId !== 'string' || !/^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,95}$/.test(raw.generationId)) fail('generationId');

  const communication = {};
  if (raw.communication !== undefined) {
    object(raw.communication, COMMUNICATION, 'communication');
    if (raw.communication.language !== undefined) communication.language = text(raw.communication.language, 48, 'language');
    if (raw.communication.tone !== undefined) communication.tone = text(raw.communication.tone, 80, 'tone');
    if (raw.communication.responseStyle !== undefined) communication.responseStyle = text(raw.communication.responseStyle, 120, 'responseStyle');
  }

  const focus = bounded(raw.focus ?? [], MAX_FOCUS, 'focus').map((item, i) => {
    object(item, ['label', 'kind', 'freshness', 'basis', 'explanation'], 'focus[' + i + ']');
    if (!KINDS.includes(item.kind)) fail('focus kind');
    if (!FRESHNESS.includes(item.freshness)) fail('focus freshness');
    if (!BASIS.includes(item.basis)) fail('focus basis');
    return {
      label: text(item.label, 80, 'focus label'),
      kind: item.kind,
      freshness: item.freshness,
      basis: item.basis,
      explanation: text(item.explanation, 200, 'focus explanation')
    };
  });

  const unknowns = bounded(raw.unknowns ?? [], MAX_UNKNOWNS, 'unknowns')
    .map((u, i) => text(u, 120, 'unknowns[' + i + ']'));

  const labels = new Set(focus.map(f => f.label.toLowerCase()));
  const suggestedCards = bounded(raw.suggestedCards ?? [], MAX_CARDS, 'suggestedCards').map((card, i) => {
    object(card, ['title', 'focus'], 'suggestedCards[' + i + ']');
    const title = text(card.title, 64, 'card title');
```

_First 80 of 163 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
