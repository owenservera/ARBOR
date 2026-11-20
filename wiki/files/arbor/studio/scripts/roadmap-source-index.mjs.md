# File: studio/scripts/roadmap-source-index.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | studio/scripts/roadmap-source-index.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 5924 B |
| Lines | 109 |
| Hash | 8b69b2039028 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| ROOT | const | 14 | no | const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), &#39;..&#39;); |
| ROADMAP | const | 15 | no | const ROADMAP = &#39;docs/agents/CHATGPT-200-ROADMAP-OBJECTIVES.md&#39;; |
| SYMBOL_INDEX | const | 16 | no | const SYMBOL_INDEX = &#39;docs/agents/CHATGPT-100-SOURCE-INDEX.json&#39;; |
| CANDIDATES | const | 17 | no | const CANDIDATES = &#39;docs/agents/CHATGPT-200-SOURCE-CANDIDATES.json&#39;; |
| OUTPUT | const | 18 | no | const OUTPUT = &#39;docs/agents/CHATGPT-200-ROADMAP-SOURCE-INDEX.json&#39;; |
| idFor | function | 19 | no | const idFor = (n) =&gt; String(n).padStart(3, &#39;0&#39;); |
| buildRoadmapSourceIndex | function | 21 | yes | export function buildRoadmapSourceIndex(markdown, sourceIndex, candidates = {}) { |
| objectives | const | 28 | no | const objectives = [], ids = new Set(), sections = new Map(); |
| section | variable | 29 | no | let section = null, pillar = null; |
| heading | const | 31 | no | const heading = line.match(/^##\\s+(\\d{2})\\s+—\\s+(.+?)\\s*$/); |
| pillarMatch | const | 41 | no | const pillarMatch = line.match(/^\\*Pillar:\\s+(.+?)\\*\\s*$/); |
| objective | const | 43 | no | const objective = line.match(/^\\*\\*(\\d{3})\\.\\*\\*\\s+(.+?)\\s*$/); |
| id | const | 45 | no | const id = objective[1], number = Number(id), expectedSection = 11 + Math.floor((number - 101) / 10); |
| candidate | const | 53 | no | const candidate = candidates[id] ?? null; |
| candidateSourceKeys | const | 57 | no | const candidateSourceKeys = candidate ? [...new Set(candidate.sourceKeys)] : []; |
| missing | const | 71 | no | const missing = Array.from({ length: 100 }, (_, i) =&gt; idFor(i + 101)).filter((id) =&gt; !ids.has(id)); |
| missingSections | const | 73 | no | const missingSections = Array.from({ length: 10 }, (_, i) =&gt; String(i + 11)).filter((id) =&gt; !sections.has(id)); |
| unmatched | const | 75 | no | const unmatched = Object.keys(candidates).filter((id) =&gt; !ids.has(id)); |
| main | function | 88 | no | function main() { |
| mode | const | 89 | no | const mode = process.argv[2]; |
| roadmap | const | 91 | no | const roadmap = fs.readFileSync(path.join(ROOT, ROADMAP), &#39;utf8&#39;); |
| symbols | const | 92 | no | const symbols = JSON.parse(fs.readFileSync(path.join(ROOT, SYMBOL_INDEX), &#39;utf8&#39;)); |
| candidates | const | 93 | no | const candidates = JSON.parse(fs.readFileSync(path.join(ROOT, CANDIDATES), &#39;utf8&#39;)); |
| result | const | 94 | no | const result = buildRoadmapSourceIndex(roadmap, symbols, candidates); |
| json | const | 95 | no | const json = JSON.stringify(result, null, 2) + &#39;\\n&#39;; |
| destination | const | 96 | no | const destination = path.join(ROOT, OUTPUT); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 10 | external |
| node:path | import | 11 | external |
| node:url | import | 12 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
#!/usr/bin/env node
/**
 * Stage roadmap objectives 101–200 without conflating candidate source paths
 * with implemented capability or real-world acceptance evidence.
 *
 * Usage:
 *   node scripts/roadmap-source-index.mjs
 *   node scripts/roadmap-source-index.mjs --check
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ROADMAP = 'docs/agents/CHATGPT-200-ROADMAP-OBJECTIVES.md';
const SYMBOL_INDEX = 'docs/agents/CHATGPT-100-SOURCE-INDEX.json';
const CANDIDATES = 'docs/agents/CHATGPT-200-SOURCE-CANDIDATES.json';
const OUTPUT = 'docs/agents/CHATGPT-200-ROADMAP-SOURCE-INDEX.json';
const idFor = (n) => String(n).padStart(3, '0');

export function buildRoadmapSourceIndex(markdown, sourceIndex, candidates = {}) {
  if (typeof markdown !== 'string' || !sourceIndex?.keys || typeof sourceIndex.keys !== 'object') {
    throw new TypeError('Roadmap Markdown and source symbol index are required');
  }
  if (!candidates || typeof candidates !== 'object' || Array.isArray(candidates)) {
    throw new TypeError('Candidates must be an object keyed by objective ID');
  }
  const objectives = [], ids = new Set(), sections = new Map();
  let section = null, pillar = null;
  for (const [lineNumber, line] of markdown.split(/\r?\n/).entries()) {
    const heading = line.match(/^##\s+(\d{2})\s+—\s+(.+?)\s*$/);
    if (heading) {
      section = { id: heading[1], name: heading[2].trim() };
      pillar = null;
      if (Number(section.id) >= 11 && Number(section.id) <= 20) {
        if (sections.has(section.id)) throw new Error('Duplicate roadmap section ' + section.id);
        sections.set(section.id, section.name);
      }
      continue;
    }
    const pillarMatch = line.match(/^\*Pillar:\s+(.+?)\*\s*$/);
    if (pillarMatch) { pillar = pillarMatch[1].trim(); continue; }
    const objective = line.match(/^\*\*(\d{3})\.\*\*\s+(.+?)\s*$/);
    if (!objective) continue;
    const id = objective[1], number = Number(id), expectedSection = 11 + Math.floor((number - 101) / 10);
    if (number < 101 || number > 200 || ids.has(id)) {
      throw new Error('Out-of-range or duplicate roadmap objective ' + id + ' at line ' + (lineNumber + 1));
    }
    if (!section || Number(section.id) !== expectedSection || !pillar) {
      throw new Error('Missing or incorrect section/pillar for ' + id + ' at line ' + (lineNumber + 1));
    }
    ids.add(id);
    const candidate = candidates[id] ?? null;
    if (candidate !== null && (!candidate || !Array.isArray(candidate.sourceKeys) || !candidate.sourceKeys.length || !candidate.gap)) {
      throw new Error('Invalid candidate entry for ' + id);
    }
    const candidateSourceKeys = candidate ? [...new Set(candidate.sourceKeys)] : [];
    for (const key of candidateSourceKeys) {
      if (typeof key !== 'string' || !Object.hasOwn(sourceIndex.keys, key)) {
        throw new Error('Unresolved candidate source key for ' + id + ': ' + String(key));
      }
    }
    objectives.push({
      id, sectionId: section.id, section: section.name, pillar,
      objective: objective[2].trim(),
      sourceReviewState: candidate ? 'candidate-only' : 'unassessed',
      candidateSourceKeys,
      firstMissingEvidence: candidate?.gap ?? null,
    });
  }
  const missing = Array.from({ length: 100 }, (_, i) => idFor(i + 101)).filter((id) => !ids.has(id));
  if (missing.length) throw new Error('Missing roadmap objectives: ' + missing.join(', '));
  const missingSections = Array.from({ length: 10 }, (_, i) => String(i + 11)).filter((id) => !sections.has(id));
  if (missingSections.length) throw new Error('Missing roadmap sections: ' + missingSections.join(', '));
  const unmatched = Object.keys(candidates).filter((id) => !ids.has(id));
  if (unmatched.length) throw new Error('Unknown candidate IDs: ' + unmatched.join(', '));
  objectives.sort((a, b) => a.id.localeCompare(b.id));
  return {
    schemaVersion: 1, roadmap: ROADMAP, sourceIndex: SYMBOL_INDEX, candidateFile: CANDIDATES,
    evidence: 'Candidate source keys identify adjacent inspected code only. This index does not establish complete implementation, functional acceptance, or live provider verification.',
```

_First 80 of 110 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
