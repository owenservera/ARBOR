# File: hq/lib/live-graph/wave1/lane-a.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | hq/lib/live-graph/wave1/lane-a.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 8598 B |
| Lines | 119 |
| Hash | 6bf0ed743bdc |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| INTENT_SCHEMA | const | 11 | yes | export const INTENT_SCHEMA = &#39;vivim.index-intent/0.1&#39;; |
| OUTPUT_SCHEMA | const | 12 | yes | export const OUTPUT_SCHEMA = &#39;vivim.wave1.code-observations/1&#39;; |
| idRe | const | 13 | no | const idRe = /^[a-z][a-z0-9._-]{2,79}$/; |
| shaRe | const | 14 | no | const shaRe = /^[a-f0-9]{40}$/i; |
| secretRe | const | 15 | no | const secretRe = /(^\|\\/)(?:\\.env[^/]*\|[^/]*\\.env\|[^/]*\\.(?:pem\|p12\|keystore)\|session\\.json\|storage-state\\.json\|release-profile\\.json\|cookies\|login data)(\\/\|$)/i; |
| hash | function | 16 | no | const hash = value =&gt; createHash(&#39;sha256&#39;).update(value).digest(&#39;hex&#39;); |
| stableId | function | 17 | yes | export const stableId = (...parts) =&gt; &#39;hqg1:&#39; + hash(JSON.stringify(parts)); |
| enclosed | function | 18 | no | const enclosed = (parent, child) =&gt; { |
| rel | const | 19 | no | const rel = relative(parent, child); |
| validateIntent | function | 22 | yes | export function validateIntent(input) { |
| seen | const | 28 | no | const seen = new Set(); |
| verifyRoots | function | 39 | yes | export function verifyRoots(intent, { git = execFileSync } = {}) { |
| roots | const | 40 | no | const roots = []; |
| path | const | 43 | no | const path = realpathSync(root.path); |
| top | variable | 45 | no | let top, head, dirty; |
| opts | const | 47 | no | const opts = {cwd:path, encoding:&#39;utf8&#39;, timeout:20000, windowsHide:true}; |
| checkOutputDirectory | function | 59 | yes | export function checkOutputDirectory(repoRoot, outputDir) { |
| base | const | 60 | no | const base = resolve(repoRoot,&#39;.hq&#39;,&#39;wave1-index-runs&#39;); |
| target | const | 61 | no | const target = resolve(outputDir); |
| path | variable | 63 | no | let path = target; |
| next | const | 67 | no | const next = resolve(path,&#39;..&#39;); |
| projectIndex | function | 77 | yes | export function projectIndex(db, intent, roots, {readSource, parseV2} = {}) { |
| all | function | 78 | no | const all = sql =&gt; db.prepare(sql).all(); |
| files | const | 79 | no | const files=[], symbols=[], imports=[], annotations=[], diagnostics=[]; |
| source | const | 80 | no | const source = new Map(); |
| ids | const | 81 | no | const ids = new Map(); |
| byRoot | const | 82 | no | const byRoot = new Map(roots.map(r=&gt;[r.id,r])); |
| root | const | 84 | no | const root=byRoot.get(f.root_id); |
| fileId | const | 89 | no | const fileId=stableId(intent.projectId,root.id,&#39;file&#39;,f.path); |
| f | const | 94 | no | const f=source.get(s.file_id);if(!f)continue; |
| f | const | 98 | no | const f=source.get(i.file_id);if(!f)continue; |
| f | const | 102 | no | const f=source.get(a.file_id);if(!f)continue; |
| bytes | const | 108 | no | const bytes=readSource(f.abs_path,&#39;utf8&#39;); |
| p | const | 110 | no | const p=parseV2(bytes,{projectId:intent.projectId,path:f.root.id+&#39;/&#39;+f.path,contentHash:f.hash}); |
| output | const | 116 | no | const output={schema:OUTPUT_SCHEMA,project:{id:intent.projectId,intentRevision:intent.revision,purpose:intent.purpose,questions:intent.questions,mode:intent.mode},roots:roots.map(r=&gt;({id:r.id,role:r.… |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 6 | external |
| node:child_process | import | 7 | external |
| node:fs | import | 8 | external |
| node:path | import | 9 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [hq/bin/wave1-lane-a.mjs](../../../bin/wave1-lane-a.mjs.md) | ../lib/live-graph/wave1/lane-a.mjs |
| [hq/test/live-graph-wave1-a.test.mjs](../../../test/live-graph-wave1-a.test.mjs.md) | ../lib/live-graph/wave1/lane-a.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
/**
 * VIVIM Rust Live Graph — Wave 1 / Lane A
 * Only data-only code observations. No KB/graph journal/Host writer or reset.
 * See hq/live-graph/wave1/lane-a/HANDOFF.md for local execution and blockers.
 */
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {existsSync, realpathSync, statSync, lstatSync} from 'node:fs';
import {resolve, relative, isAbsolute, sep, win32} from 'node:path';

export const INTENT_SCHEMA = 'vivim.index-intent/0.1';
export const OUTPUT_SCHEMA = 'vivim.wave1.code-observations/1';
const idRe = /^[a-z][a-z0-9._-]{2,79}$/;
const shaRe = /^[a-f0-9]{40}$/i;
const secretRe = /(^|\/)(?:\.env[^/]*|[^/]*\.env|[^/]*\.(?:pem|p12|keystore)|session\.json|storage-state\.json|release-profile\.json|cookies|login data)(\/|$)/i;
const hash = value => createHash('sha256').update(value).digest('hex');
export const stableId = (...parts) => 'hqg1:' + hash(JSON.stringify(parts));
const enclosed = (parent, child) => {
  const rel = relative(parent, child);
  return rel === '' || (rel !== '..' && !rel.startsWith('..' + sep) && !isAbsolute(rel));
};
export function validateIntent(input) {
  if (!input || input.schema !== INTENT_SCHEMA) throw Error('INTENT_SCHEMA_UNSUPPORTED');
  if (!idRe.test(input.projectId || '') || !Number.isSafeInteger(input.revision) || input.revision < 1) throw Error('INTENT_ID_OR_REVISION_INVALID');
  if (typeof input.purpose !== 'string' || !input.purpose.trim() || !Array.isArray(input.questions) || !input.questions.length || input.questions.some(q => typeof q !== 'string' || !q.trim())) throw Error('INTENT_QUESTIONS_REQUIRED');
  if (input.mode !== 'dev-observation-only' || input.effectsAllowed !== false) throw Error('INTENT_EFFECTS_FORBIDDEN');
  if (!Array.isArray(input.roots) || !input.roots.length) throw Error('INTENT_ROOTS_REQUIRED');
  const seen = new Set();
  for (const root of input.roots) {
    if (!idRe.test(root.id || '') || seen.has(root.id)) throw Error('INTENT_ROOT_ID_DUPLICATE_OR_INVALID');
    seen.add(root.id);
    if (typeof root.path !== 'string' || !(isAbsolute(root.path) || win32.isAbsolute(root.path)) || secretRe.test(root.path.replaceAll('\\','/'))) throw Error('INTENT_ROOT_PATH_INVALID');
    if (!shaRe.test(root.headSha || '')) throw Error('INTENT_ROOT_SHA_UNPINNED');
    if (typeof root.role !== 'string' || !root.role.trim()) throw Error('INTENT_ROOT_ROLE_REQUIRED');
    if (root.ignores !== undefined && (!Array.isArray(root.ignores) || root.ignores.some(i => typeof i !== 'string' || !i || i.includes('..')))) throw Error('INTENT_IGNORES_INVALID');
  }
  return structuredClone(input);
}
export function verifyRoots(intent, { git = execFileSync } = {}) {
  const roots = [];
  for (const root of intent.roots) {
    if (!existsSync(root.path) || !statSync(root.path).isDirectory()) throw Error('ROOT_NOT_DIRECTORY:' + root.id);
    const path = realpathSync(root.path);
    if (roots.some(r => enclosed(r.path, path) || enclosed(path, r.path))) throw Error('ROOT_SCOPE_OVERLAP:' + root.id);
    let top, head, dirty;
    try {
      const opts = {cwd:path, encoding:'utf8', timeout:20000, windowsHide:true};
      top = git('git',['rev-parse','--show-toplevel'],opts).trim();
      head = git('git',['rev-parse','HEAD'],opts).trim();
      dirty = git('git',['status','--porcelain=v1','--untracked-files=all'],opts).trim();
    } catch { throw Error('ROOT_GIT_UNVERIFIED:' + root.id); }
    if (resolve(top) !== resolve(path)) throw Error('ROOT_NOT_GIT_TOP:' + root.id);
    if (head.toLowerCase() !== root.headSha.toLowerCase()) throw Error('ROOT_HEAD_STALE:' + root.id);
    if (dirty) throw Error('ROOT_DIRTY_UNVERIFIED:' + root.id);
    roots.push({id:root.id,path,headSha:head,role:root.role,ignores:root.ignores || []});
  }
  return roots;
}
export function checkOutputDirectory(repoRoot, outputDir) {
  const base = resolve(repoRoot,'.hq','wave1-index-runs');
  const target = resolve(outputDir);
  if (target === base || !enclosed(base,target)) throw Error('OUTPUT_NOT_ISOLATED_DEV_RUN');
  let path = target;
  while (enclosed(resolve(repoRoot),path)) {
    if (existsSync(path) && lstatSync(path).isSymbolicLink()) throw Error('OUTPUT_SYMLINK_FORBIDDEN');
    if (path === resolve(repoRoot)) break;
    const next = resolve(path,'..');
    if (next === path) break;
    path = next;
  }
  return target;
}
/**
 * Export stable source evidence from the existing per-repository HQ index.
 * Only annotations are claims, static imports are NOT runtime communication.
 */
export function projectIndex(db, intent, roots, {readSource, parseV2} = {}) {
  const all = sql => db.prepare(sql).all();
  const files=[], symbols=[], imports=[], annotations=[], diagnostics=[];
  const source = new Map();
```

_First 80 of 120 lines._

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
