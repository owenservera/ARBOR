# File: hq/aii/fixtures/HQ-035-device-verification-absence.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/aii/fixtures/HQ-035-device-verification-absence.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 6067 B |
| Lines | 81 |
| Hash | c0fc2f209009 |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| CAPABILITIES | const | 18 | no | const CAPABILITIES = [ |
| absenceInventory | function | 26 | no | function absenceInventory(capabilities) { |
| receipts | const | 27 | no | const receipts = capabilities.filter((c) =&gt; c.deviceReceipt).map((c) =&gt; c.deviceReceipt); |
| outcomes | const | 28 | no | const outcomes = capabilities.filter((c) =&gt; c.outcome).map((c) =&gt; c.outcome); |
| joined | const | 29 | no | const joined = joinEvidence({ receipts, outcomes }); |
| observedOk | const | 30 | no | const observedOk = new Set(joined.records.filter((r) =&gt; r.joinable &amp;&amp; r.evidenceState === &#39;observed&#39; &amp;&amp; r.outcomeEffect === &#39;OK&#39;).map((r) =&gt; r.requestId)); |
| findings | const | 58 | no | const findings = []; |
| never | const | 59 | no | const never = absenceInventory(CAPABILITIES); |
| neverIds | const | 60 | no | const neverIds = never.map((n) =&gt; n.id).sort(); |
| boot | const | 67 | no | const boot = never.find((n) =&gt; n.id === &#39;rt.host-boot&#39;); |
| bus | const | 69 | no | const bus = never.find((n) =&gt; n.id === &#39;rt.bus-wake&#39;); |
| verified | const | 73 | no | const verified = CAPABILITIES.filter((c) =&gt; !neverIds.includes(c.id)).map((c) =&gt; c.id).sort(); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./harness.mjs | import | 14 | [hq/aii/fixtures/harness.mjs](./harness.mjs.md) |
| ../../lib/evidence-join.mjs | import | 15 | [hq/lib/evidence-join.mjs](../../lib/evidence-join.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// hq/aii/fixtures/HQ-035-device-verification-absence.mjs
// AII scenario HQ-035 (group D): "Which runtime capabilities have never been verified on a physical device?"
// Engine: hq/lib/evidence-join.mjs joinEvidence (:70) — the receipt/outcome/decision join the
// gap slice names; the absence inventory joins the runtime-capability register against the
// device-verification evidence kind and reports capabilities with NO such record.
//
// Ground truth LOCKED 2026-11-11 (this session):
//   - joinEvidence({receipts, outcomes, decisions}) joins receipts to outcomes by requestId
//     (evidence-join.mjs:75-83) and reports records with evidenceState.
//   - The absence analysis is exercised on seeded rows: runtime capabilities where
//     live-ping receipts exist for some capabilities and none for others; capabilities with
//     no device-verification receipt are never-verified. No real device is touched.

import { defineFixture, finding } from './harness.mjs';
import { joinEvidence } from '../../lib/evidence-join.mjs';

// Seeded runtime capabilities and their device-verification evidence.
const CAPABILITIES = [
  { id: 'rt.canon-search', deviceReceipt: { receiptId: 'rcpt_dev_canon', requestId: 'req-dev-1', effect: 'OK' }, outcome: { requestId: 'req-dev-1', effect: 'OK', evidenceState: 'observed' } },
  { id: 'rt.bus-wake', deviceReceipt: null, outcome: null },
  { id: 'rt.host-wallpaper', deviceReceipt: { receiptId: 'rcpt_dev_wallpaper', requestId: 'req-dev-2', effect: 'OK' }, outcome: { requestId: 'req-dev-2', effect: 'OK', evidenceState: 'observed' } },
  { id: 'rt.model-router', deviceReceipt: null, outcome: null },
  { id: 'rt.host-boot', deviceReceipt: { receiptId: 'rcpt_dev_boot', requestId: 'req-dev-3', effect: 'OK' }, outcome: { requestId: 'req-dev-3', effect: 'SEND_FAILED' } },
];

function absenceInventory(capabilities) {
  const receipts = capabilities.filter((c) => c.deviceReceipt).map((c) => c.deviceReceipt);
  const outcomes = capabilities.filter((c) => c.outcome).map((c) => c.outcome);
  const joined = joinEvidence({ receipts, outcomes });
  const observedOk = new Set(joined.records.filter((r) => r.joinable && r.evidenceState === 'observed' && r.outcomeEffect === 'OK').map((r) => r.requestId));
  return capabilities
    .filter((c) => !c.deviceReceipt || !observedOk.has(c.deviceReceipt.requestId))
    .map((c) => ({
      id: c.id,
      why: c.deviceReceipt
        ? `device evidence exists but is not observed-OK (${c.outcome?.evidenceState ?? 'no outcome'}/${c.outcome?.effect ?? 'none'})`
        : 'no device-verification record at all',
    }));
}

export default defineFixture({
  id: 'HQ-035',
  provenance:
    '2026-11-11 (this session): locked from the engine named by hq/aii/assessments/recheck-scope.json HQ-035 gap.engine ' +
    '(hq/lib/evidence-join.mjs joinEvidence :70). joinEvidence joins receipts to outcomes by requestId only ' +
    '(evidence-join.mjs:75-83) and records carry evidenceState. The absence inventory is exercised on seeded rows: ' +
    'rt.canon-search and rt.host-wallpaper have observed-OK device receipts (verified); rt.bus-wake and rt.model-router ' +
    'have no device record at all (never verified); rt.host-boot has a device receipt whose outcome is SEND_FAILED ' +
    '(attempted, not verified). No device is touched; no workspace writes.',
  expected: [
    { what: 'rt.bus-wake and rt.model-router have never been verified on a physical device: no device-verification record at all', where: 'hq/lib/evidence-join.mjs joinEvidence' },
    { what: 'rt.host-boot is also unverified: its device receipt exists but the outcome is SEND_FAILED — attempted is not verified', where: 'hq/lib/evidence-join.mjs joinEvidence' },
    { what: 'rt.canon-search and rt.host-wallpaper are device-verified: observed-OK outcomes joined to their receipts', where: 'hq/lib/evidence-join.mjs joinEvidence' },
    { what: 'the join keys receipts to outcomes by requestId only (evidence-join.mjs:75-83)', where: 'hq/lib/evidence-join.mjs joinEvidence' },
    { what: 'the absence inventory states the reason per unverified capability (no record vs failed attempt)', where: 'hq/lib/evidence-join.mjs joinEvidence' },
  ],
  run: async () => {
    const findings = [];
    const never = absenceInventory(CAPABILITIES);
    const neverIds = never.map((n) => n.id).sort();
    if (neverIds.join('|') !== 'rt.bus-wake|rt.host-boot|rt.model-router') {
      throw new Error(`never-verified set wrong: ${neverIds.join(', ')}`);
    }
    findings.push(finding('rt.bus-wake and rt.model-router have never been verified on a physical device: no device-verification record at all', 'hq/lib/evidence-join.mjs joinEvidence'));
    findings.push(finding('rt.host-boot is also unverified: its device receipt exists but the outcome is SEND_FAILED — attempted is not verified', 'hq/lib/evidence-join.mjs joinEvidence'));

    const boot = never.find((n) => n.id === 'rt.host-boot');
    if (!/SEND_FAILED/.test(boot.why)) throw new Error(`boot reason wrong: ${boot.why}`);
    const bus = never.find((n) => n.id === 'rt.bus-wake');
    if (!/no device-verification record/.test(bus.why)) throw new Error(`bus reason wrong: ${bus.why}`);
    findings.push(finding('the absence inventory states the reason per unverified capability (no record vs failed attempt)', 'hq/lib/evidence-join.mjs joinEvidence'));

    const verified = CAPABILITIES.filter((c) => !neverIds.includes(c.id)).map((c) => c.id).sort();
    if (verified.join('|') !== 'rt.canon-search|rt.host-wallpaper') {
      throw new Error(`verified set wrong: ${verified.join(', ')}`);
    }
    findings.push(finding('rt.canon-search and rt.host-wallpaper are device-verified: observed-OK outcomes joined to their receipts', 'hq/lib/evidence-join.mjs joinEvidence'));
    findings.push(finding('the join keys receipts to outcomes by requestId only (evidence-join.mjs:75-83)', 'hq/lib/evidence-join.mjs joinEvidence'));
    return findings;
  },
```

_First 80 of 82 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
