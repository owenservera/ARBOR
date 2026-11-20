# File: packages/tierflow/tests/visual-runtime/experience.test.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | packages/tierflow/tests/visual-runtime/experience.test.ts |
| Language | TypeScript |
| Kind | source |
| Size | 11311 B |
| Lines | 171 |
| Hash | 2f83fb33e6d7 |
| Test | yes |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| NOW | const | 8 | no | const NOW = Date.UTC(2026, 10, 6, 16, 0); |
| evid | const | 9 | no | const evid: OnboardingEvidence = { |
| stateAt | function | 19 | no | const stateAt = (current: JourneyState[&#39;current&#39;]): JourneyState =&gt; |
| s | const | 23 | no | const s = newJourney(); |
| ack | const | 28 | no | const ack = transitionJourney(s, &#39;acknowledge_privacy&#39;, evid, NOW); |
| s | variable | 33 | no | let s: JourneyState = newJourney(); |
| transition | const | 36 | no | const transition = transitionJourney(s, &#39;next&#39;, evid, NOW); |
| v | const | 41 | no | const v = projectJourney(s, evid, NOW); |
| bad | const | 47 | no | const bad: OnboardingEvidence = { ...evid, provider: { source: &#39;studio&#39;, proof: &#39;tab_ready&#39;, observedAtMs: NOW } }; |
| t | const | 48 | no | const t = transitionJourney(stateAt(&#39;provider&#39;), &#39;next&#39;, bad, NOW); |
| skipped | const | 68 | no | const skipped = transitionJourney(stateAt(&#39;pairing&#39;), &#39;skip&#39;, { ...evid, phone: undefined }, NOW); |
| token | const | 75 | no | const token = &#39;f&#39;.repeat(64); |
| v | const | 76 | no | const v = projectJourney(stateAt(&#39;pairing&#39;), evid, NOW); |
| s | variable | 91 | no | let s = stateAt(&#39;provider&#39;); |
| v | const | 96 | no | const v = projectJourney(s, evid, NOW); |
| s | const | 103 | no | const s = { ...newJourney(), current: id }; |
| step | const | 104 | no | const step = projectJourney(s, {}, NOW).steps.find(s =&gt; s.id === id); |
| recovery | function | 110 | no | const recovery = (overrides: Partial&lt;RecoveryInput&gt; = {}): RecoveryInput =&gt; ({ authority: &#39;host&#39;, stage: &#39;uncertain&#39;, operationKind: &#39;provider_send&#39;, offline: false, canCancel: true, canRequestUndo: … |
| v | const | 116 | no | const v = projectRecovery(recovery({ stage })); |
| v | const | 124 | no | const v = projectRecovery(recovery({ stage })); |
| base | const | 136 | no | const base = recovery({ authority: &#39;ui&#39;, operationKind: &#39;ui_revision&#39;, stage: &#39;applied&#39;, statusCheckedByAuthority: true }); |
| unsigned | const | 143 | no | const unsigned = projectRecovery(recovery({ stage: &#39;applied&#39;, receipt: { ref: &#39;journal:01&#39;, signatureState: &#39;unsigned&#39; } })); |
| verified | const | 145 | no | const verified = projectRecovery(recovery({ stage: &#39;applied&#39;, receipt: { ref: &#39;receipt:01&#39;, signatureState: &#39;verified&#39; } })); |
| deliberatelyInvalid | function | 154 | no | const deliberatelyInvalid = (patch: Readonly&lt;Record&lt;string, unknown&gt;&gt;): RecoveryInput =&gt; |
| s | const | 161 | no | const s = transitionJourney(stateAt(&#39;desktop&#39;), &#39;cancel&#39;, evid, NOW).state; |
| actions | const | 162 | no | const actions = projectJourney(s, evid, NOW).steps[1]?.actions; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| ../../src/visual-runtime/experience/onboarding.ts | import | 3 | [packages/tierflow/src/visual-runtime/experience/onboarding.ts](../../src/visual-runtime/experience/onboarding.ts.md) |
| ../../src/visual-runtime/experience/recovery.ts | import | 7 | [packages/tierflow/src/visual-runtime/experience/recovery.ts](../../src/visual-runtime/experience/recovery.ts.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```typescript
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  newJourney, projectJourney, transitionJourney, PAIRING_QR_ACCESSIBLE_NAME,
  PRIVACY_EXPLANATION, type JourneyState, type OnboardingEvidence,
} from '../../src/visual-runtime/experience/onboarding.ts';
import { projectRecovery, type RecoveryInput } from '../../src/visual-runtime/experience/recovery.ts';
const NOW = Date.UTC(2026, 10, 6, 16, 0);
const evid: OnboardingEvidence = {
  desktop: { computerReady: 'yes', dedicatedBrowserReady: 'yes' },
  provider: { source: 'studio', proof: 'provider_authenticated', observedAtMs: NOW - 10_000 },
  owner: { source: 'host', selectionConfirmed: 'yes' },
  phone: { source: 'host', enrolled: 'yes', permission: 'yes' },
  capability: { source: 'host', supported: 'yes', permitted: 'yes' },
  preview: { source: 'ui', safePreviewVerified: true },
  outcome: { source: 'host', state: 'applied', evidenceRef: 'receipt-001' },
  restart: { reconciled: true },
};
const stateAt = (current: JourneyState['current']): JourneyState =>
  ({ ...newJourney(), current, privacyAcknowledged: true });

test('initial state needs owner acknowledgement, and never mutates external state', () => {
  const s = newJourney();
  assert.equal(s.current, 'privacy');
  assert.equal(projectJourney(s, evid, NOW).steps[0]?.status, 'blocked');
  assert.equal(transitionJourney(s, 'next', evid, NOW).accepted, false);
  assert.equal(s.privacyAcknowledged, false);
  const ack = transitionJourney(s, 'acknowledge_privacy', evid, NOW);
  assert.equal(ack.accepted, true);
  assert.equal(transitionJourney(ack.state, 'next', evid, NOW).state.current, 'desktop');
});
test('complete fixture first-use navigation through receipt and restart', () => {
  let s: JourneyState = newJourney();
  s = transitionJourney(s, 'acknowledge_privacy', evid, NOW).state;
  for (const expected of ['desktop', 'provider', 'owner', 'pairing', 'discover', 'preview', 'receipt', 'resume']) {
    const transition = transitionJourney(s, 'next', evid, NOW);
    assert.equal(transition.accepted, true);
    s = transition.state;
    assert.equal(s.current, expected);
  }
  const v = projectJourney(s, evid, NOW);
  assert.equal(v.progress.completed, 9);
  assert.equal(v.progress.total, 9);
  assert.equal(transitionJourney(s, 'next', evid, NOW).accepted, false);
});
test('tab ready is not login verified, even from Studio', () => {
  const bad: OnboardingEvidence = { ...evid, provider: { source: 'studio', proof: 'tab_ready', observedAtMs: NOW } };
  const t = transitionJourney(stateAt('provider'), 'next', bad, NOW);
  assert.equal(t.accepted, false);
  assert.match(t.reason ?? '', /does not prove sign-in/i);
});
test('no sign-in proof from untrusted source or stale/future observation', () => {
  for (const provider of [
    { source: 'other', proof: 'provider_authenticated', observedAtMs: NOW },
    { source: 'studio', proof: 'provider_authenticated', observedAtMs: NOW - 300_001 },
    { source: 'studio', proof: 'provider_authenticated', observedAtMs: NOW + 1 },
    { source: 'studio', proof: 'signed_out', observedAtMs: NOW },
  ] as const) {
    assert.equal(transitionJourney(stateAt('provider'), 'next', { ...evid, provider }, NOW).accepted, false);
  }
});
test('no progression from browser readiness alone, and no owner grant via UI claim', () => {
  assert.equal(transitionJourney(stateAt('desktop'), 'next', { ...evid, desktop: { computerReady: 'yes', dedicatedBrowserReady: 'unknown' } }, NOW).accepted, false);
  assert.equal(transitionJourney(stateAt('owner'), 'next', { ...evid, owner: { source: 'other', selectionConfirmed: 'yes' } }, NOW).accepted, false);
});
test('optional phone skip requires current pairing step and does not claim paired state', () => {
  assert.equal(transitionJourney(stateAt('provider'), 'skip', evid, NOW).accepted, false);
  const skipped = transitionJourney(stateAt('pairing'), 'skip', { ...evid, phone: undefined }, NOW);
  assert.equal(skipped.accepted, true);
  assert.equal(skipped.state.current, 'discover');
  assert.equal(skipped.state.pairingSkipped, true);
  assert.equal(projectJourney(skipped.state, evid, NOW).steps[4]?.status, 'skipped');
});
test('QR accessible name excludes bearer token and privacy copy acknowledges data leaving PC', () => {
  const token = 'f'.repeat(64);
  const v = projectJourney(stateAt('pairing'), evid, NOW);
  assert.equal(v.pairingQrAccessibleName, PAIRING_QR_ACCESSIBLE_NAME);
  assert.equal(v.pairingQrAccessibleName.includes(token), false);
  assert.doesNotMatch(v.pairingQrAccessibleName, /https?:\/\//);
  assert.match(PRIVACY_EXPLANATION, /provider websites/);
```

_First 80 of 172 lines._

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
