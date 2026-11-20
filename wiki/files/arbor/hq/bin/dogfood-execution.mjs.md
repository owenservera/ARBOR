# File: hq/bin/dogfood-execution.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/bin/dogfood-execution.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 43166 B |
| Lines | 1088 |
| Hash | c011f62f173a |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| HERE | const | 26 | no | const HERE = import.meta.dirname ?? import.meta.dir; |
| ROOT | const | 27 | no | const ROOT = resolve(HERE, &#39;..&#39;, &#39;..&#39;); |
| DESIGN_PATH | const | 28 | no | const DESIGN_PATH = join(ROOT, &#39;docs&#39;, &#39;architecture&#39;, &#39;DOG-FOOD-DESIGN.md&#39;); |
| LEDGER_PATH | const | 29 | no | const LEDGER_PATH = join(ROOT, &#39;dogfood&#39;, &#39;learnings.jsonl&#39;); |
| HARNESS_DEFAULT | const | 30 | no | const HARNESS_DEFAULT = &#39;C:/0-BlackBoxProject-0/vivim-web-harness&#39;; |
| UI_DEFAULT | const | 31 | no | const UI_DEFAULT = &#39;C:/0-BlackBoxProject-0/vivim-ui&#39;; |
| LEARNING_SCHEMA | const | 33 | yes | export const LEARNING_SCHEMA = &#39;hq.dogfood-execution-learning/1&#39;; |
| STAGES | const | 34 | yes | export const STAGES = [&#39;design&#39;, &#39;product-path&#39;, &#39;harness-suite&#39;, &#39;studio-suite&#39;, &#39;shipped-dependency&#39;]; |
| KINDS | const | 35 | no | const KINDS = [&#39;works&#39;, &#39;breaks&#39;, &#39;gap&#39;, &#39;blocked&#39;]; |
| CRITERIA | const | 36 | no | const CRITERIA = [&#39;C1&#39;, &#39;C2&#39;, &#39;C3&#39;, &#39;C4&#39;, &#39;C5&#39;, &#39;C6&#39;, &#39;none&#39;]; |
| hash12 | function | 42 | no | const hash12 = (text, size = 12) =&gt; |
| clip | function | 45 | no | const clip = (text, max = 400) =&gt; { |
| s | const | 46 | no | const s = String(text ?? &#39;&#39;).replace(/\\s+/g, &#39; &#39;).trim(); |
| clean | function | 51 | no | const clean = (text) =&gt; clip(redactSecrets(String(text ?? &#39;&#39;)), 400); |
| argValue | function | 53 | no | function argValue(argv, name, fallback) { |
| i | const | 54 | no | const i = argv.indexOf(`--${name}`); |
| hasFlag | function | 57 | no | function hasFlag(argv, name) { |
| runCommand | function | 68 | no | function runCommand(cmd, args, cwd, timeoutMs = 300000) { |
| r | const | 69 | no | const r = spawnSync(cmd, args, { cwd, encoding: &#39;utf8&#39;, timeout: timeoutMs, maxBuffer: 64 * 1024 * 1024, |
| parseDesign | function | 94 | yes | export function parseDesign(text) { |
| src | const | 95 | no | const src = String(text ?? &#39;&#39;); |
| criteria | const | 96 | no | const criteria = [...new Set([...src.matchAll(/\\*\\*(C[1-6])\\s*\\u2014/g)].map((m) =&gt; m[1]))]; |
| blocked | const | 97 | no | const blocked = [...new Set([...src.matchAll(/openrouter\\/[A-Za-z0-9._/-]+/g)].map((m) =&gt; m[0]))]; |
| sentenceMatch | const | 98 | no | const sentenceMatch = /such as\\s+&quot;([^&quot;]{6,120})&quot;/.exec(src); |
| sentence | const | 99 | no | const sentence = sentenceMatch ? sentenceMatch[1] : null; |
| harnessMatch | const | 100 | no | const harnessMatch = /[A-Za-z]:[\\/][^\\s&quot;&#39;`,)]*vivim-web-harness\|vivim-web-harness/.exec(src); |
| makeRow | function | 122 | yes | export function makeRow(input) { |
| kind | const | 123 | no | const kind = KINDS.includes(input.kind) ? input.kind : &#39;gap&#39;; |
| criterion | const | 124 | no | const criterion = CRITERIA.includes(input.criterion) ? input.criterion : &#39;none&#39;; |
| rule | const | 125 | no | const rule = clean(input.rule); |
| evidence | const | 126 | no | const evidence = input.evidence &amp;&amp; typeof input.evidence === &#39;object&#39; ? input.evidence : {}; |
| safeEvidence | const | 127 | no | const safeEvidence = {}; |
| validateRow | function | 153 | yes | export function validateRow(row) { |
| errors | const | 154 | no | const errors = []; |
| serialized | const | 163 | no | const serialized = JSON.stringify(row); |
| captureLearnings | function | 174 | yes | export function captureLearnings(rows, file) { |
| problems | const | 176 | no | const problems = []; |
| prefix | variable | 185 | no | let prefix = &#39;&#39;; |
| current | const | 187 | no | const current = readFileSync(file, &#39;utf8&#39;); |
| tokenizeSelector | function | 202 | no | function tokenizeSelector(sel) { |
| parts | const | 203 | no | const parts = []; |
| buf | variable | 204 | no | let buf = &#39;&#39;; |
| depth | variable | 205 | no | let depth = 0; |
| quote | variable | 206 | no | let quote = null; |
| parseAttr | function | 231 | no | function parseAttr(body) { |
| m | const | 232 | no | const m = /^\\s*([\\w:-]+)\\s*(?:(\\^=\|\\$=\|\\*=\|~=\|=)\\s*(?:&quot;([^&quot;]*)&quot;\|&#39;([^&#39;]*)&#39;\|([^\\s\\]]+)))?\\s*(i\|s)?\\s*$/.exec(body); |
| parseCompound | function | 242 | no | function parseCompound(src) { |
| out | const | 243 | no | const out = { tag: null, id: null, classes: [], attrs: [], not: [] }; |
| i | variable | 244 | no | let i = 0; |
| s | const | 245 | no | const s = String(src); |
| ch | const | 247 | no | const ch = s[i]; |
| m | const | 250 | no | const m = /^#([\\w-]+)/.exec(s.slice(i)); |
| m | const | 254 | no | const m = /^\\.([\\w-]+)/.exec(s.slice(i)); |
| body | const | 259 | no | const body = end === -1 ? s.slice(i + 1) : s.slice(i + 1, end); |
| pseudo | const | 267 | no | const pseudo = /^:[\\w-]+/.exec(s.slice(i)); |
| tag | const | 270 | no | const tag = /^[\\w-]+/.exec(s.slice(i)); |
| matchesAttr | function | 277 | no | function matchesAttr(el, attr) { |
| raw | const | 278 | no | const raw = el.attrs[attr.name]; |
| hay | const | 281 | no | const hay = attr.ci ? String(raw).toLowerCase() : String(raw); |
| needle | const | 282 | no | const needle = attr.ci ? String(attr.value ?? &#39;&#39;).toLowerCase() : String(attr.value ?? &#39;&#39;); |
| matchesCompound | function | 291 | no | function matchesCompound(el, compound) { |
| matchesChain | function | 300 | no | function matchesChain(el, compounds) { |
| index | variable | 303 | no | let index = compounds.length - 2; |
| node | variable | 304 | no | let node = el.parent; |
| queryAll | function | 314 | no | function queryAll(scope, selector) { |
| out | const | 315 | no | const out = []; |
| trimmed | const | 317 | no | const trimmed = part.trim(); |
| compounds | const | 319 | no | const compounds = tokenizeSelector(trimmed).map(parseCompound); |
| makeEl | function | 327 | no | function makeEl(doc, tag, opts = {}) { |
| el | const | 328 | no | const el = { |
| node | variable | 339 | no | let node = other; |
| appendTo | function | 354 | no | function appendTo(parent, child) { |
| makeDoc | function | 361 | no | function makeDoc() { |
| doc | const | 362 | no | const doc = { activeElement: null }; |
| html | const | 363 | no | const html = makeEl(doc, &#39;html&#39;); |
| body | const | 364 | no | const body = makeEl(doc, &#39;body&#39;); |
| out | const | 369 | no | const out = []; |
| walk | function | 370 | no | const walk = (node) =&gt; { |
| buildForSelector | function | 385 | no | function buildForSelector(doc, selector, opts = {}) { |
| first | const | 386 | no | const first = String(selector).split(&#39;,&#39;)[0].trim(); |
| compounds | const | 387 | no | const compounds = tokenizeSelector(first).map(parseCompound); |
| node | variable | 388 | no | let node = doc.body; |
| last | variable | 389 | no | let last = null; |
| attrs | const | 391 | no | const attrs = {}; |
| el | const | 393 | no | const el = makeEl(doc, compound.tag ?? &#39;div&#39;, { id: compound.id ?? &#39;&#39;, classes: compound.classes, attrs, innerText: opts.text ?? &#39;&#39;, |
| makePage | function | 410 | no | function makePage({ doc, threadUrl, provider, replyText }) { |
| effects | const | 411 | no | const effects = []; |
| composerSelector | const | 412 | no | const composerSelector = provider?.composer?.selectors?.[0] ?? &#39;textarea&#39;; |
| composer | const | 413 | no | const composer = buildForSelector(doc, composerSelector); |
| userSelector | const | 414 | no | const userSelector = provider?.user?.selectors?.[0] ?? &#39;[data-message-author-role=&quot;user&quot;]&#39;; |
| assistantSelector | const | 415 | no | const assistantSelector = provider?.assistant?.containerSelectors?.[0] ?? &#39;article&#39;; |
| page | const | 416 | no | const page = { |
| text | const | 432 | no | const text = composer.innerText; |
| user | const | 435 | no | const user = buildForSelector(doc, userSelector, { text }); |
| assistant | const | 437 | no | const assistant = buildForSelector(doc, assistantSelector, { text: replyText }); |
| stageDesign | function | 450 | no | function stageDesign(ctx) { |
| text | const | 461 | no | const text = readFileSync(ctx.designPath, &#39;utf8&#39;); |
| design | const | 462 | no | const design = parseDesign(text); |
| rows | const | 463 | no | const rows = [makeRow({ stage: &#39;design&#39;, kind: design.target &amp;&amp; design.criteria.length === 6 ? &#39;works&#39; : &#39;breaks&#39;, criterion: &#39;C3&#39;, rule: design.target &amp;&amp; design.criteria.length === 6 |
| auditProviderProfiles | function | 510 | no | async function auditProviderProfiles(providersDir) { |
| offenders | const | 511 | no | const offenders = []; |
| profile | variable | 514 | no | let profile; |
| stageProductPath | function | 532 | no | async function stageProductPath(ctx) { |
| rows | const | 533 | no | const rows = []; |
| harnessSrc | const | 534 | no | const harnessSrc = join(ctx.harnessDir, &#39;harness&#39;, &#39;src&#39;); |
| registry | const | 547 | no | const registry = join(harnessSrc, &#39;providers&#39;, &#39;index.mjs&#39;); |
| mod | const | 549 | no | const mod = await import(pathToFileURL(registry).href); |
| code | const | 560 | no | const code = err?.code ? String(err.code) : String(err?.name ?? &#39;ERROR&#39;); |
| offenders | const | 561 | no | const offenders = await auditProviderProfiles(join(harnessSrc, &#39;providers&#39;)); |
| providerFile | const | 574 | no | const providerFile = join(harnessSrc, &#39;providers&#39;, `${ctx.provider}.mjs`); |
| provider | variable | 575 | no | let provider = null; |
| core | const | 601 | no | const core = { |
| journalMod | variable | 606 | no | let journalMod; |
| sendMod | variable | 607 | no | let sendMod; |
| replyMod | variable | 608 | no | let replyMod; |
| prompt | const | 625 | no | const prompt = ctx.sentence ?? &#39;build me a booking app&#39;; |
| replyText | const | 626 | no | const replyText = &#39;Here is the app plan: one screen, one table, one owner.&#39;; |
| threadId | const | 627 | no | const threadId = &#39;3f2b8c1a-9e4d-4c7b-8a11-2d6f9e0b5c47&#39;; |
| threadUrl | const | 628 | no | const threadUrl = `https://${provider.hosts[0]}/c/${threadId}`; |
| requestId | const | 629 | no | const requestId = &#39;dogfood-exec-1&#39;; |
| journalDir | const | 630 | no | const journalDir = join(tmpdir(), `dogfood-exec-${Date.now()}`); |
| journal | const | 631 | no | const journal = journalMod.createJournal({ dir: journalDir }); |
| doc | const | 632 | no | const doc = makeDoc(); |
| page | const | 633 | no | const page = makePage({ doc, threadUrl, provider, replyText }); |
| approval | const | 634 | no | const approval = { |
| sent | variable | 643 | no | let sent; |
| receiptPath | const | 669 | no | const receiptPath = join(journalDir, `${requestId}.json`); |
| receipt | const | 670 | no | const receipt = existsSync(receiptPath) ? readFileSync(receiptPath, &#39;utf8&#39;) : &#39;&#39;; |
| effectsBefore | const | 692 | no | const effectsBefore = page.effects.length; |
| repeat | variable | 693 | no | let repeat = null; |
| noResend | const | 701 | no | const noResend = page.effects.length === effectsBefore &amp;&amp; repeat?.state === sent.state; |
| reply | variable | 716 | no | let reply = null; |
| leaks | const | 738 | no | const leaks = []; |
| suiteRows | function | 769 | no | function suiteRows({ stage, criterion, label, cmd, args, cwd, timeoutMs, ctx }) { |
| result | const | 770 | no | const result = runCommand(cmd, args, cwd, timeoutMs); |
| out | const | 771 | no | const out = `${result.stdout}\\n${result.stderr}`; |
| tests | const | 772 | no | const tests = Number(/tests\\s+(\\d+)/.exec(out)?.[1] ?? 0); |
| passed | const | 773 | no | const passed = Number(/pass\\s+(\\d+)/.exec(out)?.[1] ?? 0); |
| failed | const | 774 | no | const failed = Number(/fail\\s+(\\d+)/.exec(out)?.[1] ?? 0); |
| failures | const | 776 | no | const failures = [...out.matchAll(/^\\u2716\\s+(.+)$/gm)] |
| codes | const | 779 | no | const codes = [...new Set([...out.matchAll(/code:\\s*&#39;([A-Z_]+)&#39;/g)].map((m) =&gt; m[1]))]; |
| sites | const | 780 | no | const sites = [...new Set([...out.matchAll(/at file:\\/\\/\\/(.+?):(\\d+):(\\d+)/g)].map((m) =&gt; `${m[1].split(&#39;/&#39;).slice(-4).join(&#39;/&#39;)}:${m[2]}`))].slice(0, 6); |
| rows | const | 781 | no | const rows = [makeRow({ stage, kind: failed === 0 &amp;&amp; result.status === 0 ? &#39;works&#39; : &#39;breaks&#39;, criterion, rule: failed === 0 &amp;&amp; result.status === 0 |
| stageHarnessSuite | function | 807 | no | function stageHarnessSuite(ctx) { |
| dir | const | 808 | no | const dir = join(ctx.harnessDir, &#39;harness&#39;); |
| stageStudioSuite | function | 832 | no | function stageStudioSuite(ctx) { |
| dir | const | 833 | no | const dir = join(ctx.harnessDir, &#39;studio&#39;); |
| RUNTIME_FORBIDDEN | const | 856 | no | const RUNTIME_FORBIDDEN = [ |
| listFiles | function | 862 | no | function listFiles(dir, out = []) { |
| full | const | 866 | no | const full = join(dir, entry.name); |
| stageShippedDependency | function | 874 | no | function stageShippedDependency(ctx) { |
| targets | const | 875 | no | const targets = [ |
| rows | const | 879 | no | const rows = []; |
| hits | const | 892 | no | const hits = []; |
| mentions | const | 893 | no | const mentions = new Set(); |
| text | variable | 896 | no | let text = &#39;&#39;; |
| line | const | 903 | no | const line = text.split(/\\r?\\n/).findIndex((l) =&gt; pattern.re.test(l)); |
| manifests | const | 916 | no | const manifests = []; |
| manifest | const | 918 | no | const manifest = join(target.dir, name); |
| pkg | const | 921 | no | const pkg = JSON.parse(readFileSync(manifest, &#39;utf8&#39;)); |
| unique | const | 931 | no | const unique = []; |
| firstHit | const | 933 | no | const firstHit = unique[0]; |
| STAGE_IMPL | const | 961 | no | const STAGE_IMPL = { |
| runExercise | function | 978 | yes | export async function runExercise(opts = {}) { |
| ctx | const | 979 | no | const ctx = { |
| rows | const | 990 | no | const rows = []; |
| main | function | 1012 | yes | export async function main(argv = process.argv.slice(2)) { |
| stages | const | 1013 | no | const stages = String(argValue(argv, &#39;stages&#39;, STAGES.join(&#39;,&#39;))) |
| out | const | 1017 | no | const out = argValue(argv, &#39;out&#39;, LEDGER_PATH); |
| dryRun | const | 1018 | no | const dryRun = hasFlag(argv, &#39;dry-run&#39;); |
| opts | const | 1019 | no | const opts = { |
| counts | const | 1048 | no | const counts = rows.reduce((acc, row) =&gt; ({ ...acc, [row.kind]: (acc[row.kind] ?? 0) + 1 }), {}); |
| breaks | const | 1049 | no | const breaks = rows.filter((row) =&gt; row.kind === &#39;breaks&#39;).length; |
| verdict | const | 1050 | no | const verdict = breaks ? &#39;MORE-WORK&#39; : &#39;DONE&#39;; |
| invokedDirectly | const | 1075 | no | const invokedDirectly = import.meta.main ?? (() =&gt; { try { return process.argv[1] ? pathToFileURL(process.argv[1]).href === import.meta.url : false; } catch { return false; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 18 | external |
| node:crypto | import | 19 | external |
| node:path | import | 20 | external |
| node:child_process | import | 21 | external |
| node:url | import | 22 | external |
| node:os | import | 23 | external |
| ../lib/dogfood.mjs | import | 24 | [hq/lib/dogfood.mjs](../lib/dogfood.mjs.md) |

## Dependents

_No dependents._

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 3 | context | — | — | WO-028 dogfood execution runner - reads the WO-027 dogfood design, drives the real |
| 7 | owner | hq | — | hq |
| 8 | task | — | — | WO-028 |
| 9 | see | — | docs/architecture/DOG-FOOD-DESIGN.md | docs/architecture/DOG-FOOD-DESIGN.md |
| 10 | see | — | hq/bin/dogfood.mjs | hq/bin/dogfood.mjs |
| 11 | invariant | — | — | read-only against provider and browser state: this runner never sends, never |
| 13 | invariant | — | — | a row exists only from evidence this run produced: the exact command, the exit |
| 15 | invariant | — | — | a broken capture is a failure, never a quiet success: if a row cannot be validated |

## Excerpt

```javascript
#!/usr/bin/env node
/**
 * @hq:context WO-028 dogfood execution runner - reads the WO-027 dogfood design, drives the real
 *   VIVIM product path that design names (harness provider profiles, the send/journal/reply path,
 *   the Studio conversation runtime, the shipped surfaces) and captures what works and what breaks
 *   as append-only learning rows.
 * @hq:owner hq
 * @hq:task WO-028
 * @hq:see docs/architecture/DOG-FOOD-DESIGN.md
 * @hq:see hq/bin/dogfood.mjs
 * @hq:invariant read-only against provider and browser state: this runner never sends, never
 *   approves, never drives Chrome. It writes the learning ledger and a temp workspace, nothing else.
 * @hq:invariant a row exists only from evidence this run produced: the exact command, the exit
 *   code, the failing reason. Nothing is inferred from prose.
 * @hq:invariant a broken capture is a failure, never a quiet success: if a row cannot be validated
 *   or written, the runner exits non-zero.
 */
import { appendFileSync, existsSync, mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';
import { redactSecrets } from '../lib/dogfood.mjs';

const HERE = import.meta.dirname ?? import.meta.dir;
const ROOT = resolve(HERE, '..', '..');
const DESIGN_PATH = join(ROOT, 'docs', 'architecture', 'DOG-FOOD-DESIGN.md');
const LEDGER_PATH = join(ROOT, 'dogfood', 'learnings.jsonl');
const HARNESS_DEFAULT = 'C:/0-BlackBoxProject-0/vivim-web-harness';
const UI_DEFAULT = 'C:/0-BlackBoxProject-0/vivim-ui';

export const LEARNING_SCHEMA = 'hq.dogfood-execution-learning/1';
export const STAGES = ['design', 'product-path', 'harness-suite', 'studio-suite', 'shipped-dependency'];
const KINDS = ['works', 'breaks', 'gap', 'blocked'];
const CRITERIA = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'none'];

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */

const hash12 = (text, size = 12) =>
  createHash('sha256').update(String(text)).digest('hex').slice(0, size);

const clip = (text, max = 400) => {
  const s = String(text ?? '').replace(/\s+/g, ' ').trim();
  return s.length > max ? `${s.slice(0, Math.max(0, max - 1))}...` : s;
};

/** A persisted row never carries a credential. */
const clean = (text) => clip(redactSecrets(String(text ?? '')), 400);

function argValue(argv, name, fallback) {
  const i = argv.indexOf(`--${name}`);
  return i === -1 ? fallback : argv[i + 1];
}
function hasFlag(argv, name) {
  return argv.includes(`--${name}`);
}

/**
 * Run a command without a shell and capture its output. The exact argv is the evidence.
 * @param {string} cmd
 * @param {string[]} args
 * @param {string} cwd
 * @param {number} timeoutMs
 */
function runCommand(cmd, args, cwd, timeoutMs = 300000) {
  const r = spawnSync(cmd, args, {
    cwd,
    encoding: 'utf8',
    timeout: timeoutMs,
    maxBuffer: 64 * 1024 * 1024,
    windowsHide: true,
  });
  return {
    command: [cmd, ...args].join(' '),
    cwd,
    status: r.status === null ? -1 : r.status,
    signal: r.signal ?? null,
```

_First 80 of 1089 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
