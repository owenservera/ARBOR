# File: studio/src/studio/world-note-units.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/studio/world-note-units.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 8112 B |
| Lines | 124 |
| Hash | 83fc994a9b65 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| NOTE_UNIT_SCHEMA | const | 11 | yes | export const NOTE_UNIT_SCHEMA = &#39;vivim.note-units/1&#39;; |
| NOTE_BLOCK_TYPES | const | 12 | yes | export const NOTE_BLOCK_TYPES = Object.freeze([&#39;heading&#39;, &#39;paragraph&#39;, &#39;list-item&#39;, &#39;code&#39;, &#39;quote&#39;, &#39;divider&#39;]); |
| NOTE_UNIT_LIMITS | const | 13 | yes | export const NOTE_UNIT_LIMITS = Object.freeze({ maxBlocks: 2000, maxBodyChars: 200000, maxBlockTextChars: 200000, maxUnitIdChars: 64 }); |
| BLOCK_TYPE_RE | const | 14 | no | const BLOCK_TYPE_RE = /^[a-z][a-z0-9_+#-]{0,63}$/; |
| UNIT_ID_RE | const | 15 | no | const UNIT_ID_RE = /^u-[a-z0-9]{1,60}$/; |
| FORBIDDEN | const | 16 | no | const FORBIDDEN = new Set([&#39;__proto__&#39;, &#39;constructor&#39;, &#39;prototype&#39;]); |
| digest | function | 17 | no | const digest = (value) =&gt; createHash(&#39;sha256&#39;).update(value).digest(&#39;hex&#39;); |
| fail | function | 18 | no | const fail = (message) =&gt; problem(400, message, &#39;WORLD_INVALID_INPUT&#39;); |
| NOTE_UNIT_REF_RE | const | 22 | yes | export const NOTE_UNIT_REF_RE = /^(n-[a-z0-9-]{1,60})#(u-[a-z0-9]{1,60}(?:-[0-9]{1,6})?)$/; |
| parseNoteUnitRef | function | 24 | yes | export function parseNoteUnitRef(value) { |
| noteUnitRef | function | 29 | yes | export const noteUnitRef = (noteId, unitId) =&gt; `${noteId}#${unitId}`; |
| validateNoteBlocks | function | 31 | yes | export function validateNoteBlocks(value) { |
| total | variable | 34 | no | let total = 0; |
| seen | const | 35 | no | const seen = new Set(); |
| text | const | 42 | no | const text = block.text === undefined ? &#39;&#39; : block.text; |
| unitId | variable | 47 | no | let unitId; |
| label | const | 53 | no | const label = block.label === undefined ? null : block.label; |
| noteBodyFromBlocks | function | 60 | yes | export const noteBodyFromBlocks = (blocks) =&gt; blocks.map((block) =&gt; block.text).filter((text) =&gt; typeof text === &#39;string&#39; &amp;&amp; text.length &gt; 0).join(&#39;\\n\\n&#39;); |
| assignUnitIds | function | 64 | no | function assignUnitIds(entries, noteId) { |
| taken | const | 65 | no | const taken = new Set(entries.map((entry) =&gt; entry.unitId).filter(Boolean)); |
| occurrences | const | 66 | no | const occurrences = new Map(); |
| base | const | 69 | no | const base = `u-${digest(entry.text).slice(0, 16)}`; |
| seen | variable | 70 | no | let seen = occurrences.get(base) ?? 0, id; |
| noteUnits | function | 78 | yes | export function noteUnits(note) { |
| noteId | const | 79 | no | const noteId = typeof note?.id === &#39;string&#39; ? note.id : null; |
| blocks | const | 80 | no | const blocks = Array.isArray(note?.blocks) &amp;&amp; note.blocks.length ? note.blocks : null; |
| entries | const | 82 | no | const entries = blocks.map((block) =&gt; ({ unitId: typeof block?.unitId === &#39;string&#39; &amp;&amp; UNIT_ID_RE.test(block.unitId) ? block.unitId : null, type: typeof block?.type === &#39;string&#39; &amp;&amp; BLOCK_TYPE_RE.test(… |
| body | const | 93 | no | const body = typeof note?.body === &#39;string&#39; ? note.body : &#39;&#39;; |
| resolveNoteUnit | function | 102 | yes | export function resolveNoteUnit(units, address) { |
| index | variable | 105 | no | let index = null; |
| noteUnitAddressing | function | 119 | yes | export const noteUnitAddressing = (note) =&gt; { |
| units | const | 120 | no | const units = noteUnits(note); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 8 | external |
| ./http.mjs | import | 9 | [studio/src/studio/http.mjs](./http.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/src/studio/world-relations.mjs](./world-relations.mjs.md) | ./world-note-units.mjs |
| [studio/src/studio/world-search.mjs](./world-search.mjs.md) | ./world-note-units.mjs |
| [studio/src/studio/world-service.mjs](./world-service.mjs.md) | ./world-note-units.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Atomic note knowledge units (VD-0046). A note keeps its plain-text `body`; authoring may also
// supply discrete `blocks`. Units are the addressable projection of that content:
//   - `path` reuses the existing `[blockIndex]` partPath convention (world-search / selections),
//   - `id` is a local digest of the unit's own text, so an unchanged unit keeps the same address
//     when neighbouring units are edited, inserted or reordered,
//   - a plain note with no block structure is exactly one implicit unit covering the whole body.
// Unit ids never depend on the note id, so they survive export/import re-identification.
import { createHash } from 'node:crypto';
import { problem } from './http.mjs';

export const NOTE_UNIT_SCHEMA = 'vivim.note-units/1';
export const NOTE_BLOCK_TYPES = Object.freeze(['heading', 'paragraph', 'list-item', 'code', 'quote', 'divider']);
export const NOTE_UNIT_LIMITS = Object.freeze({ maxBlocks: 2000, maxBodyChars: 200000, maxBlockTextChars: 200000, maxUnitIdChars: 64 });
const BLOCK_TYPE_RE = /^[a-z][a-z0-9_+#-]{0,63}$/;
const UNIT_ID_RE = /^u-[a-z0-9]{1,60}$/;
const FORBIDDEN = new Set(['__proto__', 'constructor', 'prototype']);
const digest = (value) => createHash('sha256').update(value).digest('hex');
const fail = (message) => problem(400, message, 'WORLD_INVALID_INPUT');

// Public address form used by relations/export: a note id plus a local unit fragment.
// Computed unit ids may carry an occurrence suffix (`u-<digest>-2`), so the fragment grammar allows it.
export const NOTE_UNIT_REF_RE = /^(n-[a-z0-9-]{1,60})#(u-[a-z0-9]{1,60}(?:-[0-9]{1,6})?)$/;

export function parseNoteUnitRef(value) {
  if (typeof value !== 'string') return null;
  const match = NOTE_UNIT_REF_RE.exec(value);
  return match ? { noteId: match[1], unitId: match[2], ref: value } : null;
}
export const noteUnitRef = (noteId, unitId) => `${noteId}#${unitId}`;

export function validateNoteBlocks(value) {
  if (!Array.isArray(value)) throw fail('Note blocks must be an array');
  if (value.length < 1 || value.length > NOTE_UNIT_LIMITS.maxBlocks) throw fail(`Note blocks must contain 1..${NOTE_UNIT_LIMITS.maxBlocks} units`);
  let total = 0;
  const seen = new Set();
  return value.map((block, index) => {
    if (!block || typeof block !== 'object' || Array.isArray(block)) throw fail(`Note block ${index} must be an object`);
    if (Object.keys(block).some((key) => FORBIDDEN.has(key))) throw fail(`Note block ${index} contains a forbidden key`);
    if (Object.keys(block).some((key) => !['unitId', 'type', 'text', 'label'].includes(key))) throw fail(`Note block ${index} has an unknown field`);
    const type = block.type === undefined ? 'paragraph' : block.type;
    if (typeof type !== 'string' || !BLOCK_TYPE_RE.test(type)) throw fail(`Note block ${index} has an invalid type`);
    const text = block.text === undefined ? '' : block.text;
    if (typeof text !== 'string') throw fail(`Note block ${index} text must be a string`);
    if (text.length > NOTE_UNIT_LIMITS.maxBlockTextChars) throw fail(`Note block ${index} text is too long`);
    total += text.length;
    if (total > NOTE_UNIT_LIMITS.maxBodyChars) throw fail(`Note blocks exceed ${NOTE_UNIT_LIMITS.maxBodyChars} characters of text`);
    let unitId;
    if (block.unitId !== undefined) {
      if (typeof block.unitId !== 'string' || !UNIT_ID_RE.test(block.unitId)) throw fail(`Note block ${index} unitId must look like u-<token>`);
      if (seen.has(block.unitId)) throw fail(`Duplicate note unit id ${block.unitId}`);
      seen.add(block.unitId); unitId = block.unitId;
    }
    const label = block.label === undefined ? null : block.label;
    if (label !== null && (typeof label !== 'string' || label.length > 200)) throw fail(`Note block ${index} label must be a short string`);
    return { unitId, type, text, label };
  });
}

// Canonical plain text of a block note. `body` stays the one stored, searchable, exported text.
export const noteBodyFromBlocks = (blocks) => blocks.map((block) => block.text).filter((text) => typeof text === 'string' && text.length > 0).join('\n\n');

// Stable, content-derived unit id. Identical texts in one note are disambiguated by occurrence, and
// a computed id never takes an id an author already claimed, so every address is unique in its note.
function assignUnitIds(entries, noteId) {
  const taken = new Set(entries.map((entry) => entry.unitId).filter(Boolean));
  const occurrences = new Map();
  return entries.map((entry) => {
    if (entry.unitId) return { ...entry, id: entry.unitId, stability: 'authored' };
    const base = `u-${digest(entry.text).slice(0, 16)}`;
    let seen = occurrences.get(base) ?? 0, id;
    do { seen += 1; id = seen === 1 ? base : `${base}-${seen}`; } while (taken.has(id));
    occurrences.set(base, seen); taken.add(id);
    return { ...entry, id, stability: 'content-digest' };
  }).map((entry, index) => ({ ...entry, noteId, index, path: [index] }));
}

// The addressable units of a note, in body order. Never mutates or re-stores the record.
export function noteUnits(note) {
  const noteId = typeof note?.id === 'string' ? note.id : null;
  const blocks = Array.isArray(note?.blocks) && note.blocks.length ? note.blocks : null;
```

_First 80 of 125 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
