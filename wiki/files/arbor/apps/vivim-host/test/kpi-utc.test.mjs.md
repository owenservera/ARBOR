# File: apps/vivim-host/test/kpi-utc.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/test/kpi-utc.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 14467 B |
| Lines | 230 |
| Hash | 00e622e9a947 |
| Test | yes |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| KPI_MODULE | const | 11 | no | const KPI_MODULE = &#39;../../../tools/kpi/utc-maturity.mjs&#39;; |
| KPI_PRESENT | const | 12 | no | const KPI_PRESENT = existsSync(new URL(KPI_MODULE, import.meta.url)); |
| KPI_SKIP | const | 13 | no | const KPI_SKIP = KPI_PRESENT |
| KPI | const | 16 | no | const KPI = KPI_PRESENT ? await import(KPI_MODULE) : {}; |
| NOW | const | 24 | no | const NOW = Date.parse(&#39;2026-11-01T12:00:00Z&#39;); |
| DAY | const | 25 | no | const DAY = 86_400_000; |
| tmp | function | 26 | no | const tmp = t =&gt; { const d = mkdtempSync(path.join(os.tmpdir(), &#39;vivim-kpi-test-&#39;)); t.after(() =&gt; rmSync(d, { recursive: true, force: true })); return d; }; |
| ledger | function | 27 | no | const ledger = (dir, entries, regressions = []) =&gt; { const f = path.join(dir, &#39;ledger.json&#39;); writeFileSync(f, JSON.stringify({ schema: &#39;vivim.utc-evidence/1&#39;, entries, regressions })); return f; }; |
| entry | function | 28 | no | const entry = (id, actionId, platform, daysAgo) =&gt; ({ id, actionId, platform, receiptId: &#39;ctl-&#39; + id.padStart(16, &#39;0&#39;).slice(-16), observedAt: new Date(NOW - daysAgo * DAY).toISOString() }); |
| ctxFor | function | 29 | no | const ctxFor = (t, opt = {}) =&gt; { const c = createContext({ now: NOW, runTests: false, ...opt }); t.after(() =&gt; c.close()); return c; }; |
| cat | const | 34 | no | const cat = loadKpiCatalog(); |
| broken | const | 38 | no | const broken = structuredClone(cat); |
| errs | const | 40 | no | const errs = validateKpiCatalog(broken); |
| caps | const | 62 | no | const caps = loadKpiCatalog().mechanics.evidenceCaps; |
| ctx | const | 68 | no | const ctx = ctxFor(t); |
| results | const | 69 | no | const results = collectAll(ctx); |
| ctx | const | 80 | no | const ctx = ctxFor(t); |
| rep | const | 81 | no | const rep = buildReport(ctx); |
| h | const | 82 | no | const h = rep.headline; |
| ctx | const | 92 | no | const ctx = ctxFor(t); |
| levels | const | 93 | no | const levels = actionMaturity(ctx, { integrity: 1, testsPass: 1 }); |
| unknownTests | const | 98 | no | const unknownTests = actionMaturity(ctx, { integrity: 1, testsPass: null }).filter(l =&gt; l.readiness === &#39;source_wired&#39;); |
| dir | const | 103 | no | const dir = tmp(t); |
| A | const | 104 | no | const A = &#39;ui.theme.set_preset&#39;; |
| lvl | function | 105 | no | const lvl = (entries, regressions = []) =&gt; { |
| ctx | const | 106 | no | const ctx = ctxFor(t, { evidenceFile: ledger(dir, entries, regressions) }); |
| bad | const | 116 | no | const bad = ctxFor(t, { evidenceFile: ledger(dir, [{ id: &#39;x&#39;, actionId: &#39;nope&#39;, platform: &#39;windows&#39;, receiptId: &#39;not-a-receipt&#39;, observedAt: &#39;yesterday&#39; }]) }); |
| dir | const | 122 | no | const dir = tmp(t); |
| exec | const | 123 | no | const exec = ctxFor(t).exec.map(a =&gt; a.id); |
| fresh | const | 124 | no | const fresh = ctxFor(t, { evidenceFile: ledger(dir, exec.map((id, i) =&gt; entry(String(i + 1), id, &#39;windows&#39;, 3))) }); |
| r | const | 125 | no | const r = collectAll(fresh).get(&#39;EVD-01&#39;); |
| stale | const | 127 | no | const stale = ctxFor(t, { evidenceFile: ledger(dir, exec.map((id, i) =&gt; entry(String(i + 1), id, &#39;windows&#39;, 30))) }); |
| s | const | 128 | no | const s = collectAll(stale).get(&#39;EVD-01&#39;); |
| dir | const | 133 | no | const dir = tmp(t); |
| runtime | const | 134 | no | const runtime = createBootstrapRuntime({ dataRoot: dir, file: &#39;:memory:&#39; }); |
| control | const | 137 | no | const control = createControlDispatcher({ dataRoot: dir, runtime }); |
| a | const | 138 | no | const a = { channel: &#39;desktop-owner-token&#39; }; |
| p | const | 140 | no | const p = control.plan({ text }); |
| orphan | const | 143 | no | const orphan = control.plan({ text: &#39;set my theme to ink&#39; }); // planned, never approved |
| ctx | const | 145 | no | const ctx = ctxFor(t, { journalDir: dir, platform: &#39;windows&#39; }); |
| r | const | 146 | no | const r = collectAll(ctx); |
| events | const | 154 | no | const events = path.join(dir, &#39;control&#39;, &#39;events.jsonl&#39;); |
| lines | const | 155 | no | const lines = readFileSync(events, &#39;utf8&#39;).split(&#39;\\n&#39;).filter(Boolean); |
| victim | const | 156 | no | const victim = JSON.parse(lines.find(l =&gt; JSON.parse(l).kind === &#39;applied&#39;)).planId; |
| ctx | const | 163 | no | const ctx = ctxFor(t); |
| fake | function | 164 | no | const fake = (map) =&gt; ({ catalog: { actions: [{ examples: [&#39;do x&#39;] }] }, planner: { planText: text =&gt; map[text] } }); |
| degraded | const | 165 | no | const degraded = COLLECTORS[&#39;saf.force&#39;](fake({ &#39;do x&#39;: { outcome: &#39;approval_required&#39;, actionId: &#39;a&#39;, requiresApproval: true }, &#39;!do x&#39;: { outcome: &#39;interpretation_required&#39; } })); |
| otherAction | const | 168 | no | const otherAction = COLLECTORS[&#39;saf.force&#39;](fake({ &#39;do x&#39;: { outcome: &#39;approval_required&#39;, actionId: &#39;a&#39;, requiresApproval: true }, &#39;!do x&#39;: { outcome: &#39;approval_required&#39;, actionId: &#39;b&#39;, requiresApp… |
| noApproval | const | 170 | no | const noApproval = COLLECTORS[&#39;saf.force&#39;](fake({ &#39;do x&#39;: { outcome: &#39;approval_required&#39;, actionId: &#39;a&#39;, requiresApproval: true }, &#39;!do x&#39;: { outcome: &#39;ready&#39;, actionId: &#39;a&#39;, requiresApproval: false … |
| ctx | const | 176 | no | const ctx = ctxFor(t); |
| r | const | 181 | no | const r = COLLECTORS[&#39;gov.risk&#39;](ctxFor(t)); |
| ctx | const | 186 | no | const ctx = ctxFor(t); |
| rep | const | 187 | no | const rep = buildReport(ctx); |
| p | const | 188 | no | const p = rep.priorities; |
| live | const | 191 | no | const live = p.find(x =&gt; x.id === &#39;LIVE-WINDOWS&#39;); |
| results | const | 195 | no | const results = collectAll(ctx); |
| r | const | 196 | no | const r = results.get(&#39;SAF-04&#39;); Object.assign(r, { value: 1, raw: 0, final: 0 }); r.detail = { violating: [&#39;plan x applied twice&#39;] }; |
| tripped | const | 197 | no | const tripped = buildReport(ctx, { results }); |
| ctx | const | 207 | no | const ctx = ctxFor(t); |
| dir | const | 215 | no | const dir = tmp(t), out = path.join(dir, &#39;snap.json&#39;); |
| write | const | 216 | no | const write = process.stdout.write.bind(process.stdout); |
| code | function | 217 | no | let code; |
| snap | const | 222 | no | const snap = JSON.parse(readFileSync(out, &#39;utf8&#39;)); |
| text | const | 226 | no | const text = JSON.stringify(snap); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:fs | import | 3 | external |
| node:os | import | 4 | external |
| node:path | import | 5 | external |
| ../bootstrap/runtime.mjs | import | 21 | [apps/vivim-host/bootstrap/runtime.mjs](../bootstrap/runtime.mjs.md) |
| ../control/dispatcher.mjs | import | 22 | [apps/vivim-host/control/dispatcher.mjs](../control/dispatcher.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// The KPI/UTC maturity module this suite covers is not present in this checkout
// (no commit in any branch ever added tools/kpi/utc-maturity.mjs). Rather than fail
// the gate on an absent artifact — or silently pass — the suite is skipped loudly
// and stays here for the day the module lands.
const KPI_MODULE = '../../../tools/kpi/utc-maturity.mjs';
const KPI_PRESENT = existsSync(new URL(KPI_MODULE, import.meta.url));
const KPI_SKIP = KPI_PRESENT
  ? false
  : `orphaned suite: ${KPI_MODULE} is absent from this checkout`;
const KPI = KPI_PRESENT ? await import(KPI_MODULE) : {};
const {
  COLLECTORS, createContext, collectAll, buildReport, rankPriorities, actionMaturity, rawScore,
  decayEvidence, defaultEvidence, attainable, loadKpiCatalog, validateKpiCatalog, main,
} = KPI;
import { createBootstrapRuntime } from '../bootstrap/runtime.mjs';
import { createControlDispatcher } from '../control/dispatcher.mjs';

const NOW = Date.parse('2026-11-01T12:00:00Z');
const DAY = 86_400_000;
const tmp = t => { const d = mkdtempSync(path.join(os.tmpdir(), 'vivim-kpi-test-')); t.after(() => rmSync(d, { recursive: true, force: true })); return d; };
const ledger = (dir, entries, regressions = []) => { const f = path.join(dir, 'ledger.json'); writeFileSync(f, JSON.stringify({ schema: 'vivim.utc-evidence/1', entries, regressions })); return f; };
const entry = (id, actionId, platform, daysAgo) => ({ id, actionId, platform, receiptId: 'ctl-' + id.padStart(16, '0').slice(-16), observedAt: new Date(NOW - daysAgo * DAY).toISOString() });
const ctxFor = (t, opt = {}) => { const c = createContext({ now: NOW, runTests: false, ...opt }); t.after(() => c.close()); return c; };

describe('KPI/UTC maturity (tools/kpi/utc-maturity.mjs)', { skip: KPI_SKIP }, () => {

test('catalog validates: unique ids, weights sum to 100, every atom has a collector', () => {
  const cat = loadKpiCatalog();
  assert.deepEqual(validateKpiCatalog(cat), []);
  assert.equal(cat.domains.reduce((s, d) => s + d.weight, 0), 100);
  assert.ok(cat.atoms.length >= 55);
  const broken = structuredClone(cat);
  broken.atoms.push({ ...broken.atoms[0] }); broken.domains[0].weight += 1; broken.atoms[1].collector = 'nope';
  const errs = validateKpiCatalog(broken);
  assert.ok(errs.some(e => /duplicate atom/.test(e)) && errs.some(e => /sum to 101/.test(e)) && errs.some(e => /no collector nope/.test(e)));
});

test('scoring maths: linear between red and green, both directions, clamped', () => {
  assert.equal(rawScore({ green: 100, red: 0 }, 50), 50);
  assert.equal(rawScore({ green: 100, red: 0 }, 150), 100);
  assert.equal(rawScore({ green: 0, red: 3 }, 0), 100);
  assert.equal(rawScore({ green: 0, red: 3 }, 3), 0);
  assert.equal(rawScore({ green: 0, red: 1 }, 7), 0, 'a zero-is-target atom scores 0 at the first occurrence');
});

test('evidence: kinds, native-Windows probes, freshness decay and ceilings', () => {
  assert.equal(defaultEvidence({ evidence: 'declared' }, 'unknown', 'linux'), 'E1');
  assert.equal(defaultEvidence({ evidence: 'static' }, 'unknown', 'linux'), 'E2');
  assert.equal(defaultEvidence({ evidence: 'probe' }, 'unknown', 'linux'), 'E2');
  assert.equal(defaultEvidence({ evidence: 'probe' }, 'unknown', 'windows'), 'E3');
  assert.equal(defaultEvidence({ evidence: 'journal' }, 'windows', 'linux'), 'E3');
  assert.equal(defaultEvidence({ evidence: 'journal' }, 'unknown', 'linux'), 'E2');
  assert.equal(decayEvidence('E4', 10), 'E4');
  assert.equal(decayEvidence('E4', 20), 'E3');
  assert.equal(decayEvidence('E3', 50), 'E1');
  const caps = loadKpiCatalog().mechanics.evidenceCaps;
  assert.equal(attainable({ evidence: 'static' }, caps), 60);
  assert.equal(attainable({ evidence: 'ledger:android' }, caps), 100);
});

test('every atom is collected or explicitly unmeasured, never silently scored', t => {
  const ctx = ctxFor(t);
  const results = collectAll(ctx);
  assert.equal(results.size, ctx.kpi.atoms.length);
  for (const r of results.values()) {
    if (r.measured) { assert.ok(r.raw >= 0 && r.raw <= 100); assert.ok(r.final <= r.cap && r.final <= r.raw); }
    else { assert.equal(r.final, null); assert.ok(r.reason); }
  }
  assert.equal(results.get('SAF-09').measured, false, 'journal gate is unverified without a journal');
  assert.equal(results.get('COV-02').measured, false, 'no user-facing rows classified: unknown, not zero');
});

test('report: coverage, ceiling, attainment and gates are consistent', t => {
  const ctx = ctxFor(t);
```

_First 80 of 231 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
