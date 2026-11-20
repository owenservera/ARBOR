# File: packages/tierflow/tests/visual-runtime/wave3-e-experience.test.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | packages/tierflow/tests/visual-runtime/wave3-e-experience.test.ts |
| Language | TypeScript |
| Kind | source |
| Size | 17242 B |
| Lines | 290 |
| Hash | b3a57e6b69d3 |
| Test | yes |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| NOW | const | 15 | no | const NOW = Date.UTC(2026, 10, 6, 16, 0, 0); |
| hash | function | 16 | no | const hash = (s: string): string =&gt; createHash(&#39;sha256&#39;).update(s).digest(&#39;hex&#39;); |
| SEMANTIC_ID | const | 17 | no | const SEMANTIC_ID = &#39;vivim.preview@1&#39;; |
| ACTION_ID | const | 18 | no | const ACTION_ID = &#39;vivim.preview&#39;; |
| CATALOG_DIGEST | const | 19 | no | const CATALOG_DIGEST = hash(&#39;synthetic founder host catalog v1&#39;); |
| ROW_HASH | const | 20 | no | const ROW_HASH = hash(&#39;synthetic reviewed crosswalk row v1&#39;); |
| ARGS_HASH | const | 21 | no | const ARGS_HASH = hash(&#39;synthetic {target:enum:alpha}&#39;); |
| EXACT | const | 22 | no | const EXACT = toExactText(SEMANTIC_ID, { target: FIXTURE_IDS.alpha })!; |
| fixtures | function | 24 | no | function fixtures(rows: CanonicalKnowledgeRecord[] = canonicalKnowledgeFixtures()) { |
| auth | const | 25 | no | const auth = mutableFixtureBroker(fixtureTrustedContext({ sessionExpiresAt: NOW + 600_000, grantExpiresAt: NOW + 600_000 })); |
| knowledgeClient | const | 26 | no | const knowledgeClient = createFixtureKnowledgeClient(rows, auth.broker, { now: () =&gt; NOW }); |
| host | const | 27 | no | const host = createHostCapabilityFixture({ catalogVersion: 1, catalogDigest: CATALOG_DIGEST, actions: [{ actionId: ACTION_ID, catalogVersion: 1, risk: &#39;R1&#39;, readiness: &#39;verified&#39;, requiredScopes: [&#39;v… |
| hostContext | const | 33 | no | const hostContext: TrustedFixtureHostContext = { |
| target | const | 39 | no | const target = { owner: &#39;host_effect&#39; as const, actionId: ACTION_ID, catalogVersion: 1 }; |
| rowsForCompile | const | 40 | no | const rowsForCompile: CrosswalkRow[] = [{ |
| descriptors | const | 48 | no | const descriptors: ActionDescriptor[] = [{ |
| input | const | 53 | no | const input: FounderJourneyInput = { |
| run | function | 68 | no | const run = (patch: Partial&lt;FounderJourneyInput&gt; = {}) =&gt; { |
| f | const | 69 | no | const f = fixtures(); |
| f | const | 74 | no | const f = fixtures(); |
| view | const | 75 | no | const view = await projectFounderWorkspaceJourney(f.input); |
| f | const | 112 | no | const f = fixtures(); |
| view | const | 113 | no | const view = await projectFounderWorkspaceJourney({ ...f.input, viewportPx }); |
| f | const | 124 | no | const f = fixtures(); |
| candidate | const | 125 | no | const candidate = f.input.commandInput; |
| variants | const | 126 | no | const variants: CommandInput[] = [candidate, |
| views | const | 132 | no | const views = await Promise.all(variants.map(commandInput =&gt; projectFounderWorkspaceJourney({ ...f.input, commandInput }))); |
| f | const | 140 | no | const f = fixtures(); |
| view | const | 141 | no | const view = await projectFounderWorkspaceJourney({ ...f.input, earlierSourceVersions: { [FIXTURE_IDS.alpha]: &#39;rev-2&#39;, [FIXTURE_IDS.beta]: &#39;rev-3&#39; } }); |
| staleTarget | const | 146 | no | const staleTarget = await projectFounderWorkspaceJourney({ ...f.input, commandInput: { commandId: &#39;cmd_bad&#39;, source: { surface: &#39;touch&#39;, inputDigest: hash(&#39;bad&#39;) }, selection: { semanticId: SEMANTIC_… |
| f | const | 154 | no | const f = fixtures(); |
| view | const | 155 | no | const view = await projectFounderWorkspaceJourney({ ...f.input, projectStableIds: [&#39;kn_not_found&#39;] }); |
| cases | const | 164 | no | const cases = [ |
| f | const | 171 | no | const f = fixtures(); |
| view | const | 173 | no | const view = await projectFounderWorkspaceJourney(f.input); |
| f | const | 184 | no | const f = fixtures(); |
| calls | variable | 185 | no | let calls = 0; |
| intercepted | const | 186 | no | const intercepted: KnowledgeClient = { query: async query =&gt; { |
| page | const | 187 | no | const page = await f.knowledgeClient.query(query); |
| view | const | 191 | no | const view = await projectFounderWorkspaceJourney({ ...f.input, knowledgeClient: intercepted }); |
| f | const | 198 | no | const f = fixtures(); |
| before | const | 199 | no | const before = await projectFounderWorkspaceJourney(f.input); |
| after | const | 202 | no | const after = await projectFounderWorkspaceJourney(f.input); |
| f | const | 210 | no | const f = fixtures(); |
| view | const | 212 | no | const view = await projectFounderWorkspaceJourney(f.input); |
| after | const | 217 | no | const after = await projectFounderWorkspaceJourney(f.input); |
| rows | const | 222 | no | const rows = canonicalKnowledgeFixtures().map(row =&gt; row.stableId === FIXTURE_IDS.alpha ? { ...row, label: &#39;&lt;img src=x onerror=alert(1)&gt;&#39;, summary: &#39;javascript:alert(1)&#39; } : row); |
| f | const | 224 | no | const f = fixtures(rows); |
| view | const | 225 | no | const view = await projectFounderWorkspaceJourney(f.input); |
| rows | const | 232 | no | const rows = canonicalKnowledgeFixtures().map(row =&gt; row.stableId === FIXTURE_IDS.alpha ? { ...row, evidenceRefs: [] } : row); |
| f | const | 234 | no | const f = fixtures(rows); |
| view | const | 235 | no | const view = await projectFounderWorkspaceJourney(f.input); |
| f | const | 241 | no | const f = fixtures(); |
| unknown | const | 242 | no | const unknown = await projectFounderWorkspaceJourney({ ...f.input, commandInput: { commandId: &#39;unknown&#39;, source: { surface: &#39;touch&#39;, inputDigest: hash(&#39;unknown&#39;) }, selection: { semanticId: &#39;vivim.no… |
| stale | const | 247 | no | const stale = await projectFounderWorkspaceJourney({ ...f.input, commandInput: { ...f.input.commandInput, expectedVersions: { policy: &#39;policy_old&#39; } } }); |
| row | const | 250 | no | const row = f.input.commandContext.rows[0]!; |
| desc | const | 251 | no | const desc = f.input.commandContext.descriptors[0]!; |
| risky | const | 252 | no | const risky = await projectFounderWorkspaceJourney({ ...f.input, commandContext: { ...f.input.commandContext, rows: [{ ...row, risk: &#39;R3&#39; }], descriptors: [{ ...desc, risk: &#39;R3&#39; }] } }); |
| f | const | 261 | no | const f = fixtures(); |
| secret | const | 262 | no | const secret = &#39;f&#39;.repeat(64); |
| view | const | 263 | no | const view = await projectFounderWorkspaceJourney({ ...f.input, onboardingState: { ...newJourney(), current: &#39;provider&#39;, privacyAcknowledged: true } }); |
| view | const | 273 | no | const view = await run(); |
| f | const | 282 | no | const f = fixtures(); |
| wrongHostContext | const | 286 | no | const wrongHostContext = { ...f.hostContext, ownerRef: &#39;owner_b&#39; }; |
| view | const | 287 | no | const view = await projectFounderWorkspaceJourney({ ...f.input, hostContext: wrongHostContext }); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 2 | external |
| node:assert/strict | import | 3 | external |
| node:crypto | import | 4 | external |
| ../../src/visual-runtime/experience/wave3-journey-fixture.ts | import | 5 | [packages/tierflow/src/visual-runtime/experience/wave3-journey-fixture.ts](../../src/visual-runtime/experience/wave3-journey-fixture.ts.md) |
| ../../src/visual-runtime/knowledge/client.ts | import | 6 | [packages/tierflow/src/visual-runtime/knowledge/client.ts](../../src/visual-runtime/knowledge/client.ts.md) |
| ../../src/visual-runtime/knowledge/fixtures.ts | import | 7 | [packages/tierflow/src/visual-runtime/knowledge/fixtures.ts](../../src/visual-runtime/knowledge/fixtures.ts.md) |
| ../../src/visual-runtime/host/fixture.ts | import | 8 | [packages/tierflow/src/visual-runtime/host/fixture.ts](../../src/visual-runtime/host/fixture.ts.md) |
| ../../src/visual-runtime/command/compile.ts | import | 9 | [packages/tierflow/src/visual-runtime/command/compile.ts](../../src/visual-runtime/command/compile.ts.md) |
| ../../src/visual-runtime/command/crosswalk.ts | import | 10 | [packages/tierflow/src/visual-runtime/command/crosswalk.ts](../../src/visual-runtime/command/crosswalk.ts.md) |
| ../../src/visual-runtime/experience/onboarding.ts | import | 11 | [packages/tierflow/src/visual-runtime/experience/onboarding.ts](../../src/visual-runtime/experience/onboarding.ts.md) |
| ../../src/visual-runtime/host/port.ts | import | 12 | [packages/tierflow/src/visual-runtime/host/port.ts](../../src/visual-runtime/host/port.ts.md) |
| ../../src/visual-runtime/command/ir.ts | import | 13 | [packages/tierflow/src/visual-runtime/command/ir.ts](../../src/visual-runtime/command/ir.ts.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```typescript
/** Lane E: real Wave 2 imports with synthetic external KB/Host transport fixtures only. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { projectFounderWorkspaceJourney, type FounderJourneyInput } from '../../src/visual-runtime/experience/wave3-journey-fixture.ts';
import { createFixtureKnowledgeClient, type CanonicalKnowledgeRecord, type KnowledgeClient } from '../../src/visual-runtime/knowledge/client.ts';
import { canonicalKnowledgeFixtures, FIXTURE_IDS, fixtureTrustedContext, mutableFixtureBroker } from '../../src/visual-runtime/knowledge/fixtures.ts';
import { createHostCapabilityFixture } from '../../src/visual-runtime/host/fixture.ts';
import { toExactText } from '../../src/visual-runtime/command/compile.ts';
import type { CrosswalkRow, ActionDescriptor } from '../../src/visual-runtime/command/crosswalk.ts';
import { newJourney } from '../../src/visual-runtime/experience/onboarding.ts';
import type { TrustedFixtureHostContext } from '../../src/visual-runtime/host/port.ts';
import type { CommandInput } from '../../src/visual-runtime/command/ir.ts';

const NOW = Date.UTC(2026, 10, 6, 16, 0, 0);
const hash = (s: string): string => createHash('sha256').update(s).digest('hex');
const SEMANTIC_ID = 'vivim.preview@1';
const ACTION_ID = 'vivim.preview';
const CATALOG_DIGEST = hash('synthetic founder host catalog v1');
const ROW_HASH = hash('synthetic reviewed crosswalk row v1');
const ARGS_HASH = hash('synthetic {target:enum:alpha}');
const EXACT = toExactText(SEMANTIC_ID, { target: FIXTURE_IDS.alpha })!;

function fixtures(rows: CanonicalKnowledgeRecord[] = canonicalKnowledgeFixtures()) {
  const auth = mutableFixtureBroker(fixtureTrustedContext({ sessionExpiresAt: NOW + 600_000, grantExpiresAt: NOW + 600_000 }));
  const knowledgeClient = createFixtureKnowledgeClient(rows, auth.broker, { now: () => NOW });
  const host = createHostCapabilityFixture({
    catalogVersion: 1, catalogDigest: CATALOG_DIGEST,
    actions: [{ actionId: ACTION_ID, catalogVersion: 1, risk: 'R1', readiness: 'verified',
      requiredScopes: ['vivim:preview'], argsSchema: { target: { type: 'enum', values: [FIXTURE_IDS.alpha] } },
      evidence: 'verified', prerequisites: [] }],
  });
  const hostContext: TrustedFixtureHostContext = {
    schema: 'fixture.trusted-host-context/1', authenticated: true, ownerRef: 'owner_a', actorRef: 'actor_a',
    deviceRef: 'desktop_1', sessionRef: 'session_1', worldRef: 'world_a', surface: 'desktop',
    nowMs: NOW, sessionExpiresAtMs: NOW + 600_000, worldRevision: 'world-1', policyRevision: 'policy-1',
    catalogVersion: 1, catalogDigest: CATALOG_DIGEST, availabilityByAction: { [ACTION_ID]: 'yes' }, grant: null,
  };
  const target = { owner: 'host_effect' as const, actionId: ACTION_ID, catalogVersion: 1 };
  const rowsForCompile: CrosswalkRow[] = [{
    semanticRef: { id: SEMANTIC_ID, version: '1', sourceHash: ROW_HASH },
    target, argsSchema: { target: { type: 'enum', values: [FIXTURE_IDS.alpha] } },
    argsSchemaHash: ARGS_HASH, risk: 'R1', riskSource: { authority: 'host_catalog', sourceHash: ROW_HASH },
    implementationStatus: 'verified', reviewedEnabled: true,
  }];
  // The compiler's reviewed descriptor may be stale about the current owner's grant;
  // Host, NOT compiler, remains the final refusal authority.
  const descriptors: ActionDescriptor[] = [{
    target, argsSchemaHash: ARGS_HASH, sourceHash: ROW_HASH, risk: 'R1', implementationStatus: 'verified',
    capability: { supportedByBuild: true, availableNow: 'yes', permittedForActor: 'yes',
      verifiedByEvidence: true, reasonCodes: [] },
  }];
  const input: FounderJourneyInput = {
    knowledgeBroker: auth.broker, knowledgeClient, host, hostContext,
    workspaceRef: 'workspace_a', documentId: 'founder_workspace', requestId: 'req_founder',
    projectStableIds: [FIXTURE_IDS.alpha, FIXTURE_IDS.beta, FIXTURE_IDS.stale],
    commandInput: { commandId: 'cmd_founder', source: { surface: 'text', inputDigest: hash(EXACT) },
      text: EXACT, expectedVersions: { policy: 'policy-1' } },
    commandContext: { rows: rowsForCompile, descriptors, currentVersions: { kb: 'fixture-epoch-1',
      hostWorld: 'world-1', policy: 'policy-1', uiRevision: '0' } },
    hostCatalogDigest: CATALOG_DIGEST, onboardingState: newJourney(), onboardingEvidence: {
      provider: { source: 'studio', proof: 'tab_ready', observedAtMs: NOW },
      owner: { source: 'other', selectionConfirmed: 'yes' },
    }, viewportPx: 360, nowMs: NOW,
  };
  return { auth, knowledgeClient, host, hostContext, input };
}
const run = (patch: Partial<FounderJourneyInput> = {}) => {
  const f = fixtures();
  return projectFounderWorkspaceJourney({ ...f.input, ...patch });
};

 test('novice workspace uses real KB projection, canonical document/renderer, typed candidate and actual Host denial', async () => {
  const f = fixtures();
  const view = await projectFounderWorkspaceJourney(f.input);
  assert.equal(view.schema, 'vivim.founder-journey-fixture/1');
  assert.equal(view.evidenceClass, 'synthetic-real-module-fixture');
  assert.equal(view.state, 'partial'); // one explicit stale project
  assert.equal(view.projects.length, 3);
  assert.equal(view.projects.filter(x => x.title === 'Shared project path').length, 2);
```

_First 80 of 290 lines._

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
