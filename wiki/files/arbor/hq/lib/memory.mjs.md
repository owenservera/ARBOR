# File: hq/lib/memory.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/lib/memory.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 8562 B |
| Lines | 257 |
| Hash | d82f8cbef895 |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| MEMORY_TIERS | const | 8 | yes | export const MEMORY_TIERS = [&#39;now&#39;, &#39;later&#39;, &#39;canon&#39;]; |
| ORIGINS | const | 10 | no | const ORIGINS = [&#39;user&#39;, &#39;agent&#39;, &#39;observed&#39;, &#39;imported&#39;]; |
| TEXT_CAP | const | 11 | no | const TEXT_CAP = 10_000; |
| memoryError | function | 13 | no | function memoryError(code, message) { |
| error | const | 14 | no | const error = new Error(`${code}: ${message \|\| `hq memory: ${code}`}`); |
| assertTier | function | 19 | no | function assertTier(tier, fallback = null) { |
| assertOrigin | function | 27 | no | function assertOrigin(origin) { |
| normalizeText | function | 34 | no | function normalizeText(value) { |
| text | const | 35 | no | const text = String(value ?? &#39;&#39;).trim(); |
| normalizeEvidence | function | 40 | no | function normalizeEvidence(evidence) { |
| parsed | const | 43 | no | const parsed = safeJsonParse(evidence, null); |
| noteId | function | 50 | no | function noteId(text, tier, key) { |
| resolveProjectId | function | 56 | no | function resolveProjectId(db, project) { |
| row | const | 59 | no | const row = db.prepare(&#39;SELECT id FROM projects WHERE id = ?&#39;).get(project); |
| row | const | 63 | no | const row = db.prepare(&#39;SELECT id FROM projects WHERE name = ?&#39;).get(project.trim()); |
| row | const | 68 | no | const row = db.prepare(&#39;SELECT id FROM projects WHERE id = ?&#39;).get(project.id); |
| row | const | 72 | no | const row = db.prepare(&#39;SELECT id FROM projects WHERE name = ?&#39;).get(String(project.name)); |
| path | const | 76 | no | const path = String(project.path); |
| row | const | 77 | no | const row = db.prepare(&#39;SELECT id FROM projects WHERE path = ?&#39;).get(path); |
| info | const | 80 | no | const info = db.prepare( &#39;INSERT INTO projects(name, path, kind, added_at) VALUES (?, ?, ?, ?)&#39;, ).run(String(project.name), path, &#39;dir&#39;, nowISO()); |
| mapNote | function | 90 | no | function mapNote(row) { |
| NOTE_SELECT | const | 109 | no | const NOTE_SELECT = ` |
| getNoteRow | function | 115 | no | function getNoteRow(db, id) { |
| addNote | function | 122 | yes | export function addNote(db, { text, tier = &#39;now&#39;, project = null, key = null, |
| body | const | 131 | no | const body = normalizeText(text); |
| projectId | const | 134 | no | const projectId = resolveProjectId(db, project); |
| noteKey | const | 135 | no | const noteKey = typeof key === &#39;string&#39; &amp;&amp; key.trim() ? key.trim() : null; |
| id | const | 136 | no | const id = noteId(body, tier, noteKey); |
| existing | const | 137 | no | const existing = getNoteRow(db, id); |
| stamp | const | 140 | no | const stamp = nowISO(); |
| conf | const | 141 | no | const conf = Number.isFinite(Number(confidence)) ? clamp(Number(confidence), 0, 1) : 1; |
| promoteNote | function | 161 | yes | export function promoteNote(db, { id, toTier, confirmedByOwner = false } = {}) { |
| row | const | 162 | no | const row = getNoteRow(db, id); |
| archiveNote | function | 191 | yes | export function archiveNote(db, { id } = {}) { |
| info | const | 192 | no | const info = db.prepare(` UPDATE notes SET status = &#39;archived&#39;, updated_at = ? WHERE id = ? AND status != &#39;archived&#39; `).run(nowISO(), String(id)); |
| clampLimit | function | 202 | no | function clampLimit(limit, fallback) { |
| n | const | 203 | no | const n = Number(limit); |
| escapeLike | function | 208 | no | function escapeLike(value) { |
| matchesQuery | function | 212 | no | function matchesQuery(tokens) { |
| clause | const | 213 | no | const clause = &quot;(lower(n.text) LIKE ? ESCAPE &#39;\\\\&#39; OR lower(coalesce(n.key, &#39;&#39;)) LIKE ? ESCAPE &#39;\\\\&#39;)&quot;; |
| needle | const | 215 | no | const needle = `%${escapeLike(t)}%`; |
| listNotes | function | 220 | yes | export function listNotes(db, { tier = null, project = null, query = null, status = &#39;active&#39;, limit = 50 } = {}) { |
| params | const | 222 | no | const params = []; |
| projectId | const | 229 | no | const projectId = resolveProjectId(db, project); |
| tokens | const | 239 | no | const tokens = tokenize(query); |
| sql | const | 245 | no | const sql = `${NOTE_SELECT} |
| searchNotes | function | 253 | yes | export function searchNotes(db, { query = &#39;&#39;, limit = 20 } = {}) { |
| tokens | const | 254 | no | const tokens = tokenize(query); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./schema.mjs | import | 4 | [hq/lib/schema.mjs](./schema.mjs.md) |
| ./nomenclature.mjs | import | 5 | [hq/lib/nomenclature.mjs](./nomenclature.mjs.md) |
| ./util.mjs | import | 6 | [hq/lib/util.mjs](./util.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [hq/bin/hq.mjs](../bin/hq.mjs.md) | ../lib/memory.mjs |
| [hq/bin/hq.mjs](../bin/hq.mjs.md) | ../lib/memory.mjs |
| [hq/bin/hq.mjs](../bin/hq.mjs.md) | ../lib/memory.mjs |
| [hq/bin/hq.mjs](../bin/hq.mjs.md) | ../lib/memory.mjs |
| [hq/bin/hq.mjs](../bin/hq.mjs.md) | ../lib/memory.mjs |
| [hq/bin/hq.mjs](../bin/hq.mjs.md) | ../lib/memory.mjs |
| [hq/lib/kb-intake.mjs](./kb-intake.mjs.md) | ./memory.mjs |
| [hq/lib/kb.mjs](./kb.mjs.md) | ./memory.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// hq/lib/memory.mjs — personal + agent memory with VIVIM tiers and provenance.
// Tiers: now (Immediate), later (Curated), canon (owner-confirmed).
// Provenance (origin, evidence, confidence) always survives promotion.
import { transaction } from './schema.mjs';
import { memoryTierLabel } from './nomenclature.mjs';
import { clamp, nowISO, safeJsonParse, sha256, tokenize } from './util.mjs';

export const MEMORY_TIERS = ['now', 'later', 'canon'];

const ORIGINS = ['user', 'agent', 'observed', 'imported'];
const TEXT_CAP = 10_000;

function memoryError(code, message) {
  const error = new Error(`${code}: ${message || `hq memory: ${code}`}`);
  error.code = code;
  return error;
}

function assertTier(tier, fallback = null) {
  if (fallback != null && tier == null) return fallback;
  if (!MEMORY_TIERS.includes(tier)) {
    throw memoryError('MEMORY_INVALID_TIER', `hq memory: invalid tier "${tier}" (now|later|canon)`);
  }
  return tier;
}

function assertOrigin(origin) {
  if (!ORIGINS.includes(origin)) {
    throw memoryError('MEMORY_INVALID_ORIGIN', `hq memory: invalid origin "${origin}" (user|agent|observed|imported)`);
  }
  return origin;
}

function normalizeText(value) {
  const text = String(value ?? '').trim();
  if (!text) throw memoryError('MEMORY_EMPTY', 'hq memory: note text is empty');
  return text.length > TEXT_CAP ? text.slice(0, TEXT_CAP) : text;
}

function normalizeEvidence(evidence) {
  if (Array.isArray(evidence)) return evidence;
  if (typeof evidence === 'string' && evidence.trim()) {
    const parsed = safeJsonParse(evidence, null);
    if (Array.isArray(parsed)) return parsed;
    return [evidence.trim()];
  }
  return [];
}

function noteId(text, tier, key) {
  return 'note_' + sha256(text + '\0' + tier + '\0' + (key || '')).slice(0, 24);
}

// Resolve a project reference (name, id, or {name,path}) to a projects.id.
// Unknown projects resolve to null so notes remain workspace-level.
function resolveProjectId(db, project) {
  if (project == null) return null;
  if (typeof project === 'number' && Number.isInteger(project)) {
    const row = db.prepare('SELECT id FROM projects WHERE id = ?').get(project);
    return row ? row.id : null;
  }
  if (typeof project === 'string' && project.trim()) {
    const row = db.prepare('SELECT id FROM projects WHERE name = ?').get(project.trim());
    return row ? row.id : null;
  }
  if (typeof project === 'object') {
    if (Number.isInteger(project.id)) {
      const row = db.prepare('SELECT id FROM projects WHERE id = ?').get(project.id);
      if (row) return row.id;
    }
    if (project.name) {
      const row = db.prepare('SELECT id FROM projects WHERE name = ?').get(String(project.name));
      if (row) return row.id;
    }
    if (project.path) {
      const path = String(project.path);
      const row = db.prepare('SELECT id FROM projects WHERE path = ?').get(path);
      if (row) return row.id;
      if (project.name) {
        const info = db.prepare(
```

_First 80 of 258 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
