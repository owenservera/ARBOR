# File: packages/tierflow/src/visual-runtime/final-wave/lane-h/verification.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../../../projects/arbor.md) |
| Path | packages/tierflow/src/visual-runtime/final-wave/lane-h/verification.ts |
| Language | TypeScript |
| Kind | source |
| Size | 14181 B |
| Lines | 232 |
| Hash | 623738e16727 |
| Test | no |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| FINAL_H_SCHEMA | const | 5 | yes | export const FINAL_H_SCHEMA = &#39;vivim.final-wave-verification/1&#39; as const; |
| LANES | const | 6 | yes | export const LANES = [&#39;A&#39;,&#39;B&#39;,&#39;C&#39;,&#39;D&#39;,&#39;E&#39;,&#39;F&#39;,&#39;G&#39;,&#39;H&#39;] as const; |
| Lane | type | 7 | yes | export type Lane = typeof LANES[number]; |
| ProofKind | type | 8 | yes | export type ProofKind = &#39;real-module-fixture&#39; \| &#39;source-audit&#39; \| &#39;native-windows&#39; \| |
| CheckId | type | 11 | yes | export type CheckId = typeof REQUIRED_5[number][&#39;id&#39;] \| typeof REQUIRED_6[number][&#39;id&#39;]; |
| CheckSpec | type | 12 | yes | export type CheckSpec = Readonly&lt;{id: string; kind: ProofKind; why: string}&gt;; |
| REQUIRED_5 | const | 15 | yes | export const REQUIRED_5 = [ |
| REQUIRED_6 | const | 28 | yes | export const REQUIRED_6 = [ |
| SourcePins | interface | 49 | yes | export interface SourcePins { |
| CheckOutcome | type | 54 | yes | export type CheckOutcome = &#39;pass&#39; \| &#39;fail&#39; \| &#39;unrun&#39;; |
| Proof | interface | 55 | yes | export interface Proof { |
| LaneHandoff | interface | 68 | yes | export interface LaneHandoff { |
| NegativeWitness | interface | 76 | yes | export interface NegativeWitness { |
| NEGATIVE_INVARIANTS | const | 82 | yes | export const NEGATIVE_INVARIANTS = [ |
| NegativeInvariant | type | 87 | yes | export type NegativeInvariant = typeof NEGATIVE_INVARIANTS[number]; |
| VerificationInput | interface | 89 | yes | export interface VerificationInput { |
| CheckResult | interface | 104 | yes | export interface CheckResult { readonly id: string; readonly status: CheckOutcome; readonly reason: string } |
| GateResult | interface | 105 | yes | export interface GateResult { |
| VerificationResult | interface | 113 | yes | export interface VerificationResult { |
| SHA | const | 122 | no | const SHA = /^[0-9a-f]{40}$/; |
| CLASS_NEEDS_DEVICE | const | 123 | no | const CLASS_NEEDS_DEVICE: ReadonlySet&lt;ProofKind&gt; = new Set([ &#39;native-windows&#39;,&#39;native-android&#39;,&#39;live-host&#39;,&#39;live-hq&#39;,&#39;signed-artifact&#39;,&#39;human-observation&#39;,&#39;rollback-drill&#39; ]); |
| evaluateChecks | function | 127 | no | function evaluateChecks(specs: readonly CheckSpec[],input:VerificationInput): CheckResult[] { |
| matches | const | 129 | no | const matches = input.proofs.filter(p =&gt; p.id === spec.id); |
| p | const | 132 | no | const p = matches[0]!; |
| report | function | 145 | no | function report(checks: CheckResult[], prerequisites: string[]):GateResult { |
| missing | const | 146 | no | const missing = [...prerequisites,...checks.filter(x=&gt;x.status!==&#39;pass&#39;).map(x=&gt;`${x.id}: ${x.reason}`)]; |
| evaluateFinalWave | function | 154 | yes | export function evaluateFinalWave(input: VerificationInput): VerificationResult { |
| hard | const | 155 | no | const hard: string[] = []; |
| entries | const | 158 | no | const entries = new Map&lt;Lane,LaneHandoff&gt;(); |
| validChecks | const | 171 | no | const validChecks = new Map([...evaluateChecks(REQUIRED_5,input),...evaluateChecks(REQUIRED_6,input)].map(c=&gt;[c.id,c.status])); |
| witness | const | 173 | no | const witness=input.negativeWitnesses[invariant]; |
| g5pre | const | 178 | no | const g5pre=[...hard]; |
| gate5 | const | 181 | no | const gate5=report(evaluateChecks(REQUIRED_5,input),g5pre); |
| g6pre | const | 182 | no | const g6pre=[...hard]; |
| gate6 | const | 189 | no | const gate6=report(evaluateChecks(REQUIRED_6,input),g6pre); |
| SemanticObservation | interface | 194 | yes | export interface SemanticObservation { |
| verifyFourInputParity | function | 206 | yes | export function verifyFourInputParity(rows: readonly SemanticObservation[]):{ok:boolean;reasons:string[]} { |
| required | const | 207 | no | const required=[&#39;text&#39;,&#39;touch&#39;,&#39;keyboard&#39;,&#39;studio&#39;]; |
| reasons | const | 208 | no | const reasons:string[]=[]; |
| first | const | 211 | no | const first=rows[0]; |
| offlineRollbackDrillPlan | function | 222 | yes | export function offlineRollbackDrillPlan() { |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [packages/tierflow/src/visual-runtime/final-wave/integration/master.ts](../integration/master.ts.md) | ../lane-h/verification.ts |
| [packages/tierflow/src/visual-runtime/final-wave/integration/runner.ts](../integration/runner.ts.md) | ../lane-h/verification.ts |
| [packages/tierflow/tests/visual-runtime/final-wave/integration/master.test.ts](../../../../tests/visual-runtime/final-wave/integration/master.test.ts.md) | ../../../../src/visual-runtime/final-wave/lane-h/verification.ts |
| [packages/tierflow/tests/visual-runtime/final-wave/lane-h/verification.test.ts](../../../../tests/visual-runtime/final-wave/lane-h/verification.test.ts.md) | ../../../../src/visual-runtime/final-wave/lane-h/verification.ts |

## Annotations

_No annotations._

## Excerpt

```typescript
/**
 * Final Wave H: effect-free acceptance evaluator. NOT a release authority.
 * It does not publish UI, approve effects, sign binaries, modify stores or grant GO.
 */
export const FINAL_H_SCHEMA = 'vivim.final-wave-verification/1' as const;
export const LANES = ['A','B','C','D','E','F','G','H'] as const;
export type Lane = typeof LANES[number];
export type ProofKind = 'real-module-fixture' | 'source-audit' | 'native-windows' |
  'native-android' | 'live-host' | 'live-hq' | 'signed-artifact' |
  'human-observation' | 'rollback-drill';
export type CheckId = typeof REQUIRED_5[number]['id'] | typeof REQUIRED_6[number]['id'];
export type CheckSpec = Readonly<{id: string; kind: ProofKind; why: string}>;

/** Evidence requirements are not equivalent to implementation claims. */
export const REQUIRED_5 = [
  {id:'canonical-source-document',kind:'real-module-fixture',why:'same bounded canonical document and permissions'},
  {id:'four-input-semantic-parity',kind:'real-module-fixture',why:'text/touch/keyboard/existing Studio semanticRef+args+pins and digest'},
  {id:'preview-zero-effects',kind:'real-module-fixture',why:'draft/preview/diff invokes no Host effect'},
  {id:'cas-conflict-and-lost-ack',kind:'real-module-fixture',why:'stale edits, two-device CAS, lost ACK and idempotence'},
  {id:'restart-and-ui-only-undo',kind:'real-module-fixture',why:'persisted replay and no external-effect undo'},
  {id:'knowledge-provenance',kind:'real-module-fixture',why:'scoped stable knowledge ID/source version/redaction'},
  {id:'owner-denial-and-uncertainty',kind:'real-module-fixture',why:'denial and no retries after uncertain effect'},
  {id:'injection-and-foreign-scope',kind:'real-module-fixture',why:'foreign scope, injection, stale pins and unreviewed tools refused'},
  {id:'accessibility-edit',kind:'real-module-fixture',why:'keyboard/touch and 320/360/1280 focus semantics'},
  {id:'studio-nlcl-consumer-map',kind:'source-audit',why:'actual callers and schema bridge with rollback'},
  {id:'full-tierflow-verify',kind:'source-audit',why:'raw TypeScript, Bun and Rust repository-wide exit codes'},
] as const satisfies readonly CheckSpec[];
export const REQUIRED_6 = [
  {id:'exclusive-publisher-fence',kind:'live-host',why:'one writer across ACK loss/restart/rollback'},
  {id:'legacy-publisher-drained',kind:'live-host',why:'all active legacy write routes fenced'},
  {id:'windows-install-upgrade-rollback',kind:'native-windows',why:'real Windows signed desktop install/rollback'},
  {id:'android-apk-back-a11y',kind:'native-android',why:'real APK bridge, TalkBack, 320/360, Back'},
  {id:'pairing-replay-expiry',kind:'native-android',why:'real device replay/expiry/revocation refused'},
  {id:'host-r2-r3-and-owner-denial',kind:'live-host',why:'R2 phone refusal, R3 global refusal'},
  {id:'host-receipt-truth',kind:'live-host',why:'verified signed vs unsigned vs uncertain'},
  {id:'no-duplicate-provider-effect',kind:'live-host',why:'claim idempotence and uncertain no-retry'},
  {id:'hq-scope-tombstone-revocation',kind:'live-hq',why:'real broker provenance, no hidden counts'},
  {id:'offline-gap-recovery',kind:'native-android',why:'actual device offline purge/reconnect and version gaps'},
  {id:'stale-apk-backward-compatibility',kind:'native-android',why:'existing APK stale client behavior'},
  {id:'backup-migration-rollback',kind:'rollback-drill',why:'non-destructive snapshot/fence/dry-run/restore measured'},
  {id:'signed-binary-source-provenance',kind:'signed-artifact',why:'release binary, toolchain, signature and source SHAs'},
  {id:'latency-resource-energy',kind:'native-windows',why:'p50/p95 CPU RSS disk network energy on release hardware'},
  {id:'novice-first-task-observation',kind:'human-observation',why:'4/5 novice and <=3-step contextual help genuinely observed'},
  {id:'all-consumers-retired-or-adapted',kind:'source-audit',why:'100% release callers reconciled with authority map'},
  {id:'privacy-and-accessibility-native',kind:'native-android',why:'physical privacy, accessibility and release checks'},
  {id:'full-release-regression',kind:'source-audit',why:'Bun/TS/Rust/Node/native suites with raw exits'},
] as const satisfies readonly CheckSpec[];

export interface SourcePins {
  readonly tierflow: string;
  readonly harness: string;
  readonly hq: string;
}
export type CheckOutcome = 'pass' | 'fail' | 'unrun';
export interface Proof {
  readonly id: CheckId;
  readonly outcome: CheckOutcome;
  readonly kind: ProofKind;
  readonly source: Readonly<{repo: keyof SourcePins; sha: string}>;
  /** Raw log path, never a fabricated URL or uncaptured measurement. */
  readonly rawLog: string;
  readonly command: string;
  readonly exitCode: number | null;
  readonly observedAt: string;
  /** Physical/live evidence needs a real build or broker identifier, never 'fixture'. */
  readonly equipmentId?: string;
}
export interface LaneHandoff {
  readonly lane: Lane;
  readonly sha: string;
  readonly sourcePaths: readonly string[];
  readonly testPaths: readonly string[];
  readonly rawLogs: readonly string[];
  readonly status: 'implemented' | 'blocked' | 'unrun';
}
export interface NegativeWitness {
  readonly tested: boolean;
  /** true means forbidden behavior was observed => hard block. */
  readonly forbiddenObserved: boolean;
  readonly proofId: CheckId;
```

_First 80 of 232 lines._

---

[HQ wiki](../../../../../../../../index.md) · [Symbols](../../../../../../../../symbols.md) · [Dependency graph](../../../../../../../../graph.md) · [Documentation](../../../../../../../../docs.md) · [Changes](../../../../../../../../changes.md) · [Open tasks](../../../../../../../../todos.md) · [Deprecated](../../../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../../../protocol.md) · [Glossary](../../../../../../../../glossary.md) · [Using HQ](../../../../../../../../context.md) · [Capabilities](../../../../../../../../capabilities.md) · [Search index](../../../../../../../../search.json) · [Browser view](../../../../../../../../index.html)
