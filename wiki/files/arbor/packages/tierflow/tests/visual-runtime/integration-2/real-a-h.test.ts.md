# File: packages/tierflow/tests/visual-runtime/integration-2/real-a-h.test.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../../projects/arbor.md) |
| Path | packages/tierflow/tests/visual-runtime/integration-2/real-a-h.test.ts |
| Language | TypeScript |
| Kind | source |
| Size | 58091 B |
| Lines | 1225 |
| Hash | 93e8268fb02a |
| Test | yes |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| HERE | const | 56 | no | const HERE = dirname(fileURLToPath(import.meta.url)); |
| REPO_ROOT | const | 57 | no | const REPO_ROOT = resolvePath(HERE, &#39;../../..&#39;); |
| SRC_ROOT | const | 58 | no | const SRC_ROOT = resolvePath(REPO_ROOT, &#39;src/visual-runtime&#39;); |
| digestOf | function | 60 | no | const digestOf = (value: unknown): string =&gt; sha256Hex(canonicalJson(value)); |
| NOW_MS | const | 63 | no | const NOW_MS = 1_792_000_000_000; |
| SESSION_TTL_MS | const | 64 | no | const SESSION_TTL_MS = 60_000; |
| OWNER_REF | const | 65 | no | const OWNER_REF = &#39;owner_a&#39;; |
| ACTOR_REF | const | 66 | no | const ACTOR_REF = &#39;actor_a&#39;; |
| DEVICE_REF | const | 67 | no | const DEVICE_REF = &#39;desktop_1&#39;; |
| SESSION_REF | const | 68 | no | const SESSION_REF = &#39;session_1&#39;; |
| WORLD_REF | const | 69 | no | const WORLD_REF = &#39;world_a&#39;; |
| DOCUMENT_ID | const | 70 | no | const DOCUMENT_ID = &#39;doc.integration2.real&#39;; |
| POLICY_REVISION | const | 71 | no | const POLICY_REVISION = &#39;policy-1&#39;; |
| HOST_WORLD | const | 72 | no | const HOST_WORLD = &#39;world-1&#39;; |
| HOST_CATALOG_VERSION | const | 73 | no | const HOST_CATALOG_VERSION = 1; |
| ACTION_REF_ID | const | 74 | no | const ACTION_REF_ID = &#39;fixture.preview&#39;; |
| ACTION_REF_VERSION | const | 75 | no | const ACTION_REF_VERSION = 1; |
| SEMANTIC_ID | const | 76 | no | const SEMANTIC_ID = &#39;vivim.preview@1&#39;; |
| HOST_ACTION_ID | const | 77 | no | const HOST_ACTION_ID = &#39;vivim.preview&#39;; |
| CANONICAL_DOCUMENT | const | 85 | no | const CANONICAL_DOCUMENT = { |
| LANE_MODULE_PROVENANCE | const | 120 | no | const LANE_MODULE_PROVENANCE = [ |
| expected | const | 141 | no | const expected = resolvePath(SRC_ROOT, entry.rel); |
| source | const | 146 | no | const source = readFileSync(expected, &#39;utf8&#39;); |
| source | const | 162 | no | const source = readFileSync(fileURLToPath(import.meta.url), &#39;utf8&#39;); |
| importSpecifiers | const | 163 | no | const importSpecifiers = [...source.matchAll(/from\\s+&#39;([^&#39;]+)&#39;/g)].map((match) =&gt; match[1]!); |
| laneImports | const | 164 | no | const laneImports = importSpecifiers.filter((specifier) =&gt; specifier.includes(&#39;src/visual-runtime/&#39;)); |
| resolved | const | 171 | no | const resolved = resolvePath(HERE, specifier); |
| adapterSource | const | 180 | no | const adapterSource = readFileSync(resolvePath(SRC_ROOT, &#39;integration-2/action-adapter.mjs&#39;), &#39;utf8&#39;); |
| ChainResult | interface | 189 | no | interface ChainResult { |
| runChain | function | 234 | no | async function runChain(): Promise&lt;ChainResult&gt; { |
| validation | const | 236 | no | const validation = validateUiDocument(CANONICAL_DOCUMENT, { knownActions: [{ id: ACTION_REF_ID, version: ACTION_REF_VERSION }], }); |
| laneADiagnostics | const | 241 | no | const laneADiagnostics = validation.ok |
| document | const | 245 | no | const document = validation.document; |
| actionRefs | const | 246 | no | const actionRefs = document.nodes.flatMap((node) =&gt; (node.actionRefs ?? []).map((ref) =&gt; ({ id: ref.id, version: ref.version })), ); |
| cardNode | const | 251 | no | const cardNode = document.nodes.find((node) =&gt; node.id === &#39;panel&#39;); |
| bOnA | const | 252 | no | const bOnA = cardNode |
| bNative | const | 255 | no | const bNative = inspectComponent({ id: &#39;panel&#39;, type: &#39;card&#39;, props: { title: &#39;Shared project path&#39; }, children: [], |
| laneBColumns | const | 262 | no | const laneBColumns = [320, 360, 1280].map((viewportPx) =&gt; { const resolved = resolveLayout( { mode: &#39;grid&#39;, gapPx: 12, paddingPx: 16, minItemWidthPx: 160, maxColumns: 4 }, viewportPx, 2, |
| resolved | const | 263 | no | const resolved = resolveLayout( { mode: &#39;grid&#39;, gapPx: 12, paddingPx: 16, minItemWidthPx: 160, maxColumns: 4 }, viewportPx, 2, ); |
| rawPlan | const | 272 | no | const rawPlan = renderUiDocument(document, { viewportPx: 1280 }); |
| adapted | const | 273 | no | const adapted = projectInertActionRefs(document); |
| adaptedPlan | const | 274 | no | const adaptedPlan = renderUiDocument(adapted.rendererDocument, { viewportPx: 1280 }); |
| adaptedInspection | const | 275 | no | const adaptedInspection = inspectRenderPlan(adaptedPlan); |
| argsSchema | const | 278 | no | const argsSchema = { target: { type: &#39;enum&#39; as const, values: [FIXTURE_IDS.alpha] } }; |
| argsSchemaHash | const | 279 | no | const argsSchemaHash = digestOf(argsSchema); |
| sourceHash | const | 280 | no | const sourceHash = digestOf({ source: &#39;fixture.host-catalog&#39;, semanticId: SEMANTIC_ID, catalogVersion: HOST_CATALOG_VERSION }); |
| target | const | 281 | no | const target = { owner: &#39;host_effect&#39; as const, actionId: HOST_ACTION_ID, catalogVersion: HOST_CATALOG_VERSION }; |
| rows | const | 282 | no | const rows: CrosswalkRow[] = [{ |
| descriptors | const | 292 | no | const descriptors: ActionDescriptor[] = [{ |
| compileContext | const | 306 | no | const compileContext = { |
| exactText | const | 311 | no | const exactText = toExactText(SEMANTIC_ID, { target: FIXTURE_IDS.alpha }) ?? &#39;&#39;; |
| compiledText | const | 312 | no | const compiledText = compileVisualCommand({ commandId: &#39;cmd-real-text&#39;, source: { surface: &#39;text&#39;, inputDigest: digestOf({ surface: &#39;text&#39;, text: exactText }) }, text: exactText, expectedVersions: { … |
| compiledTouch | const | 318 | no | const compiledTouch = compileVisualCommand({ commandId: &#39;cmd-real-touch&#39;, source: { surface: &#39;touch&#39;, inputDigest: digestOf({ surface: &#39;touch&#39;, text: exactText }) }, selection: { semanticId: SEMANTIC… |
| compiledKeyboard | const | 324 | no | const compiledKeyboard = compileVisualCommand({ commandId: &#39;cmd-real-keyboard&#39;, source: { surface: &#39;keyboard&#39;, inputDigest: digestOf({ surface: &#39;keyboard&#39;, text: exactText }) }, selection: { semantic… |
| shapeOf | function | 330 | no | const shapeOf = (command: { semanticRef: unknown; target: unknown; args: unknown; risk: unknown; capability: unknown }): string =&gt; |
| triModalParity | const | 338 | no | const triModalParity = |
| crosswalk | const | 344 | no | const crosswalk = resolveCrosswalk(SEMANTIC_ID, rows, descriptors); |
| argumentsAccepted | const | 345 | no | const argumentsAccepted = |
| store | const | 349 | no | const store = new UiRevisionFixtureStore(); |
| principal | const | 350 | no | const principal = { |
| created | const | 359 | no | const created = store.createDraft(principal, &#39;draft-real&#39;, DOCUMENT_ID, document); |
| edited | const | 361 | no | const edited = store.editDraft(principal, &#39;draft-real&#39;, created.value.draftRevision, document); |
| preview | const | 363 | no | const preview = store.preview(principal, &#39;draft-real&#39;); |
| previewMatchesEdit | const | 364 | no | const previewMatchesEdit = preview.ok &amp;&amp; preview.value.documentDigest === edited.value.documentDigest; |
| documentsAfterPreview | const | 365 | no | const documentsAfterPreview = store.snapshot().documents.length; |
| publishCommand | const | 366 | no | const publishCommand = { |
| published | const | 373 | no | const published = store.publish(principal, publishCommand); |
| replay | const | 374 | no | const replay = store.publish(principal, publishCommand); |
| catalogDigest | const | 377 | no | const catalogDigest = digestOf({ catalog: &#39;fixture.host-catalog&#39;, version: HOST_CATALOG_VERSION }); |
| host | const | 378 | no | const host = createHostCapabilityFixture({ catalogVersion: HOST_CATALOG_VERSION, catalogDigest, actions: [{ actionId: HOST_ACTION_ID, |
| hostContext | const | 392 | no | const hostContext = { |
| hostCommand | const | 421 | no | const hostCommand = { |
| prepared | const | 428 | no | const prepared = host.prepare(hostCommand, hostContext); |
| denied | const | 429 | no | const denied = host.prepare(hostCommand, { ...hostContext, grant: null }); |
| broker | const | 432 | no | const broker = mutableFixtureBroker(fixtureTrustedContext()); |
| knowledge | const | 433 | no | const knowledge = createFixtureKnowledgeClient(canonicalKnowledgeFixtures(), broker.broker, { now: () =&gt; NOW_MS }); |
| boundPage | const | 434 | no | const boundPage = await knowledge.query({ schema: &#39;vivim.knowledge-query/1&#39;, requestId: &#39;req-real-bound&#39;, personalWorldRef: WORLD_REF, purpose: &#39;task&#39;, |
| boundItem | const | 443 | no | const boundItem = boundPage.items[0]; |
| boundProjection | const | 444 | no | const boundProjection = projectKnowledgePage(boundPage); |
| crossOwnerPage | const | 445 | no | const crossOwnerPage = await knowledge.query({ schema: &#39;vivim.knowledge-query/1&#39;, requestId: &#39;req-real-cross&#39;, personalWorldRef: WORLD_REF, purpose: &#39;task&#39;, |
| afterTombstone | const | 455 | no | const afterTombstone = await knowledge.query({ schema: &#39;vivim.knowledge-query/1&#39;, requestId: &#39;req-real-tombstone&#39;, personalWorldRef: WORLD_REF, purpose: &#39;task&#39;, |
| recovery | const | 466 | no | const recovery = projectRecovery({ authority: &#39;host&#39;, stage: &#39;denied&#39;, operationKind: &#39;host_effect&#39;, reasonCode: denied.kind === &#39;denied&#39; ? denied.reasonCode : &#39;GRANT_MISSING&#39;, |
| capability | const | 476 | no | const capability = host.describeForPrincipal({ ...hostContext, grant: null }, HOST_ACTION_ID); |
| help | const | 477 | no | const help = projectCapabilityHelp( { actionId: capability.actionId, title: &#39;Preview shared project path&#39;, explanation: &#39;Inerts the shared project path against the owner-scoped knowledge record.&#39;, |
| chain | const | 555 | no | const chain = await runChain(); |
| chain | const | 584 | no | const chain = await runChain(); |
| chain | const | 596 | no | const chain = await runChain(); |
| chain | const | 604 | no | const chain = await runChain(); |
| stale | const | 621 | no | const stale = validateUiDocument( { ...CANONICAL_DOCUMENT, nodes: CANONICAL_DOCUMENT.nodes.map((node) =&gt; node.id === &#39;action-button&#39; |
| unknown | const | 637 | no | const unknown = validateUiDocument( { ...CANONICAL_DOCUMENT, nodes: CANONICAL_DOCUMENT.nodes.map((node) =&gt; node.id === &#39;action-button&#39; |
| store | const | 653 | no | const store = new UiRevisionFixtureStore(); |
| right | const | 654 | no | const right = { |
| wrongActor | const | 659 | no | const wrongActor = { ...right, actorRef: &#39;actor_intruder&#39; }; |
| wrongOwner | const | 660 | no | const wrongOwner = { ...right, ownerRef: &#39;owner_intruder&#39; }; |
| noScope | const | 661 | no | const noScope = { ...right, scopes: [&#39;ui:read&#39;] as const }; |
| created | const | 664 | no | const created = store.createDraft(right, &#39;draft-principal&#39;, DOCUMENT_ID, { schema: &#39;x&#39; }); |
| published | const | 666 | no | const published = store.publish(right, { commandId: &#39;cmd-principal&#39;, documentId: DOCUMENT_ID, expectedRevision: 0, draftId: &#39;draft-principal&#39;, documentDigest: created.value.documentDigest, }); |
| foreignOwnerRead | const | 671 | no | const foreignOwnerRead = store.readCurrent(wrongOwner, DOCUMENT_ID); |
| foreignActorEdit | const | 676 | no | const foreignActorEdit = store.editDraft(wrongActor, &#39;draft-principal&#39;, created.value.draftRevision, { schema: &#39;y&#39; }); |
| foreignActorPreview | const | 679 | no | const foreignActorPreview = store.preview(wrongActor, &#39;draft-principal&#39;); |
| unscoped | const | 684 | no | const unscoped = store.publish(noScope, { commandId: &#39;cmd-unscoped&#39;, documentId: DOCUMENT_ID, expectedRevision: 1, draftId: &#39;draft-principal&#39;, documentDigest: created.value.documentDigest, }); |
| forged | const | 694 | no | const forged = canonicalKnowledgeFixtures().map((row) =&gt; row.stableId === FIXTURE_IDS.alpha ? { ...row, ownerRef: &#39;owner_attacker&#39;, provenance: [&#39;forged/1&#39;] } : row, ); |
| broker | const | 697 | no | const broker = mutableFixtureBroker(fixtureTrustedContext()); |
| knowledge | const | 698 | no | const knowledge = createFixtureKnowledgeClient(forged, broker.broker, { now: () =&gt; NOW_MS }); |
| page | const | 699 | no | const page = await knowledge.query({ schema: &#39;vivim.knowledge-query/1&#39;, requestId: &#39;req-forged&#39;, personalWorldRef: WORLD_REF, purpose: &#39;task&#39;, |
| projection | const | 709 | no | const projection = projectKnowledgePage(page); |
| rows | const | 715 | no | const rows = canonicalKnowledgeFixtures(); |
| strict | const | 716 | no | const strict = mutableFixtureBroker(fixtureTrustedContext()); |
| strictClient | const | 717 | no | const strictClient = createFixtureKnowledgeClient(rows, strict.broker, { now: () =&gt; NOW_MS }); |
| strictPage | const | 718 | no | const strictPage = await strictClient.query({ schema: &#39;vivim.knowledge-query/1&#39;, requestId: &#39;req-redacted-strict&#39;, personalWorldRef: WORLD_REF, purpose: &#39;task&#39;, |
| permissive | const | 729 | no | const permissive = mutableFixtureBroker(fixtureTrustedContext({ maySeeRedactedMarkers: true })); |
| permissiveClient | const | 730 | no | const permissiveClient = createFixtureKnowledgeClient(rows, permissive.broker, { now: () =&gt; NOW_MS }); |
| permissivePage | const | 731 | no | const permissivePage = await permissiveClient.query({ schema: &#39;vivim.knowledge-query/1&#39;, requestId: &#39;req-redacted-permissive&#39;, personalWorldRef: WORLD_REF, purpose: &#39;task&#39;, |
| broker | const | 747 | no | const broker = mutableFixtureBroker(fixtureTrustedContext()); |
| knowledge | const | 748 | no | const knowledge = createFixtureKnowledgeClient(canonicalKnowledgeFixtures(), broker.broker, { now: () =&gt; NOW_MS }); |
| afterTombstone | const | 750 | no | const afterTombstone = await knowledge.query({ schema: &#39;vivim.knowledge-query/1&#39;, requestId: &#39;req-tomb&#39;, personalWorldRef: WORLD_REF, purpose: &#39;task&#39;, |
| revokedPage | const | 762 | no | const revokedPage = await knowledge.query({ schema: &#39;vivim.knowledge-query/1&#39;, requestId: &#39;req-revoked&#39;, personalWorldRef: WORLD_REF, purpose: &#39;task&#39;, |
| withHtml | const | 776 | no | const withHtml = validateUiDocument( { ...CANONICAL_DOCUMENT, nodes: CANONICAL_DOCUMENT.nodes.map((node) =&gt; node.id === &#39;panel&#39; ? { ...node, props: { title: &#39;&lt;script&gt;alert(1)&lt;/script&gt;&#39; } } : node, |
| withUrl | const | 788 | no | const withUrl = validateUiDocument( { ...CANONICAL_DOCUMENT, nodes: CANONICAL_DOCUMENT.nodes.map((node) =&gt; node.id === &#39;panel&#39; ? { ...node, props: { title: &#39;javascript:alert(1)&#39; } } : node, |
| dangling | const | 801 | no | const dangling = validateUiDocument( { ...CANONICAL_DOCUMENT, nodes: CANONICAL_DOCUMENT.nodes.map((node) =&gt; node.id === &#39;grid-1&#39; ? { ...node, children: [&#39;cell-a&#39;, &#39;ghost-1&#39;] } : node, |
| unsafePlan | const | 814 | no | const unsafePlan = renderUiDocument( { ...CANONICAL_DOCUMENT, nodes: CANONICAL_DOCUMENT.nodes.map((node) =&gt; node.id === &#39;action-button&#39; ? { ...node, props: { label: &#39;ok&#39;, onClick: &#39;alert(1)&#39; } } : no… |
| store | const | 828 | no | const store = new UiRevisionFixtureStore(); |
| principal | const | 829 | no | const principal = { |
| created | const | 834 | no | const created = store.createDraft(principal, &#39;draft-cas&#39;, DOCUMENT_ID, { schema: &#39;x&#39; }); |
| edited | const | 836 | no | const edited = store.editDraft(principal, &#39;draft-cas&#39;, created.value.draftRevision, { schema: &#39;y&#39; }); |
| staleBase | const | 840 | no | const staleBase = store.publish(principal, { commandId: &#39;cmd-cas-stale&#39;, documentId: DOCUMENT_ID, expectedRevision: 7, draftId: &#39;draft-cas&#39;, documentDigest: edited.value.documentDigest, }); |
| wrongDigest | const | 848 | no | const wrongDigest = store.publish(principal, { commandId: &#39;cmd-cas-digest&#39;, documentId: DOCUMENT_ID, expectedRevision: 0, draftId: &#39;draft-cas&#39;, documentDigest: `sha256:${&#39;0&#39;.repeat(64)}`, }); |
| store | const | 857 | no | const store = new UiRevisionFixtureStore(); |
| principal | const | 858 | no | const principal = { |
| created | const | 863 | no | const created = store.createDraft(principal, &#39;draft-idem&#39;, DOCUMENT_ID, { schema: &#39;x&#39; }); |
| command | const | 865 | no | const command = { |
| first | const | 869 | no | const first = store.publish(principal, command); |
| conflicting | const | 872 | no | const conflicting = store.publish(principal, { ...command, expectedRevision: 1 }); |
| store | const | 878 | no | const store = new UiRevisionFixtureStore(); |
| principal | const | 879 | no | const principal = { |
| created | const | 884 | no | const created = store.createDraft(principal, &#39;draft-crash&#39;, DOCUMENT_ID, { schema: &#39;x&#39; }); |
| published | const | 887 | no | const published = store.publish(principal, { commandId: &#39;cmd-crash&#39;, documentId: DOCUMENT_ID, expectedRevision: 0, draftId: &#39;draft-crash&#39;, documentDigest: created.value.documentDigest, }); |
| store | const | 898 | no | const store = new UiRevisionFixtureStore(); |
| principal | const | 899 | no | const principal = { |
| created | const | 904 | no | const created = store.createDraft(principal, &#39;draft-ack&#39;, DOCUMENT_ID, { schema: &#39;x&#39; }); |
| command | const | 907 | no | const command = { |
| published | const | 911 | no | const published = store.publish(principal, command); |
| outcome | const | 915 | no | const outcome = store.getCommandOutcome(principal, &#39;publish&#39;, command); |
| retry | const | 919 | no | const retry = store.publish(principal, command); |
| catalogDigest | const | 926 | no | const catalogDigest = digestOf({ catalog: &#39;fixture.host-catalog&#39;, version: HOST_CATALOG_VERSION }); |
| host | const | 927 | no | const host = createHostCapabilityFixture({ catalogVersion: HOST_CATALOG_VERSION, catalogDigest, actions: [ { |
| base | const | 941 | no | const base = { |
| commandFor | function | 956 | no | const commandFor = (actionId: string) =&gt; ({ schema: &#39;vivim.visual-command/1&#39; as const, commandId: `cmd-${actionId}`, target: { owner: &#39;host_effect&#39; as const, actionId, catalogVersion: HOST_CATALOG_VE… |
| r2Phone | const | 964 | no | const r2Phone = host.prepare(commandFor(&#39;vivim.r2&#39;), base); |
| r2Desktop | const | 970 | no | const r2Desktop = host.prepare(commandFor(&#39;vivim.r2&#39;), { ...base, surface: &#39;desktop&#39; }); |
| r3 | const | 975 | no | const r3 = host.prepare(commandFor(&#39;vivim.r3&#39;), { ...base, surface }); |
| catalogDigest | const | 983 | no | const catalogDigest = digestOf({ catalog: &#39;fixture.host-catalog&#39;, version: HOST_CATALOG_VERSION }); |
| context | const | 984 | no | const context = { |
| claim | const | 999 | no | const claim = { |
| noObservation | const | 1006 | no | const noObservation = projectObservedHostOutcome(claim, null, context); |
| uncertainReceipt | const | 1013 | no | const uncertainReceipt = projectObservedHostOutcome( claim, { receipt: { schema: &#39;vivim.control-receipt/1&#39;, planId: &#39;plan-1&#39;, planDigest: &#39;digest-1&#39;, |
| duplicate | const | 1030 | no | const duplicate = projectObservedHostOutcome({ ...claim, state: &#39;planned&#39; }, null, context); |
| catalogDigest | const | 1036 | no | const catalogDigest = digestOf({ catalog: &#39;fixture.host-catalog&#39;, version: HOST_CATALOG_VERSION }); |
| context | const | 1037 | no | const context = { |
| claim | const | 1052 | no | const claim = { |
| forged | const | 1057 | no | const forged = projectObservedHostOutcome( claim, { receipt: { schema: &#39;vivim.control-receipt/1&#39;, planId: &#39;plan-1&#39;, planDigest: &#39;digest-1&#39;, |
| catalogDigest | const | 1077 | no | const catalogDigest = digestOf({ catalog: &#39;fixture.host-catalog&#39;, version: HOST_CATALOG_VERSION }); |
| host | const | 1078 | no | const host = createHostCapabilityFixture({ catalogVersion: HOST_CATALOG_VERSION, catalogDigest, actions: [{ actionId: HOST_ACTION_ID, catalogVersion: HOST_CATALOG_VERSION, risk: &#39;R1&#39;, readiness: &#39;ver… |
| context | const | 1086 | no | const context = { |
| forged | const | 1101 | no | const forged = host.prepare( { schema: &#39;vivim.visual-command/1&#39;, commandId: &#39;cmd-forged&#39;, target: { owner: &#39;host_effect&#39;, actionId: HOST_ACTION_ID, catalogVersion: HOST_CATALOG_VERSION }, |
| catalogDigest | const | 1119 | no | const catalogDigest = digestOf({ catalog: &#39;fixture.host-catalog&#39;, version: HOST_CATALOG_VERSION }); |
| host | const | 1120 | no | const host = createHostCapabilityFixture({ catalogVersion: HOST_CATALOG_VERSION, catalogDigest, actions: [{ actionId: HOST_ACTION_ID, catalogVersion: HOST_CATALOG_VERSION, risk: &#39;R1&#39;, readiness: &#39;ver… |
| context | const | 1128 | no | const context = { |
| command | const | 1143 | no | const command = { |
| wrongPrincipal | const | 1151 | no | const wrongPrincipal = host.prepare(command, { ...context, actorRef: &#39;actor_intruder&#39; }); |
| unauthenticated | const | 1157 | no | const unauthenticated = host.prepare(command, { ...context, authenticated: false }); |
| revoked | const | 1163 | no | const revoked = host.prepare(command, { ...context, grant: { ...context.grant, status: &#39;revoked&#39; } }); |
| outOfScope | const | 1166 | no | const outOfScope = host.prepare(command, { ...context, grant: { ...context.grant, scopes: [&#39;vivim:other&#39;] } }); |
| argsSchema | const | 1172 | no | const argsSchema = { target: { type: &#39;enum&#39; as const, values: [FIXTURE_IDS.alpha] } }; |
| argsSchemaHash | const | 1173 | no | const argsSchemaHash = digestOf(argsSchema); |
| sourceHash | const | 1174 | no | const sourceHash = digestOf({ source: &#39;fixture.host-catalog&#39;, semanticId: SEMANTIC_ID, catalogVersion: HOST_CATALOG_VERSION }); |
| target | const | 1175 | no | const target = { owner: &#39;host_effect&#39; as const, actionId: HOST_ACTION_ID, catalogVersion: HOST_CATALOG_VERSION }; |
| rows | const | 1176 | no | const rows: CrosswalkRow[] = [{ |
| descriptors | const | 1182 | no | const descriptors: ActionDescriptor[] = [{ |
| context | const | 1186 | no | const context = { |
| unknown | const | 1190 | no | const unknown = compileVisualCommand({ commandId: &#39;cmd-unknown&#39;, source: { surface: &#39;text&#39;, inputDigest: digestOf({ surface: &#39;text&#39;, text: &#39;unknown&#39; }) }, text: toExactText(&#39;vivim.unknown@1&#39;, { targe… |
| badArgs | const | 1200 | no | const badArgs = compileVisualCommand({ commandId: &#39;cmd-badargs&#39;, source: { surface: &#39;text&#39;, inputDigest: digestOf({ surface: &#39;text&#39;, text: &#39;bad&#39; }) }, text: toExactText(SEMANTIC_ID, { target: &#39;kn_doe… |
| recovery | const | 1210 | no | const recovery = projectRecovery({ authority: &#39;host&#39;, stage: &#39;denied&#39;, operationKind: &#39;host_effect&#39;, reasonCode: &#39;GRANT_MISSING&#39;, |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 28 | external |
| node:assert/strict | import | 29 | external |
| node:fs | import | 30 | external |
| node:path | import | 31 | external |
| node:url | import | 32 | external |
| ../../../src/visual-runtime/document/validate.ts | import | 37 | [packages/tierflow/src/visual-runtime/document/validate.ts](../../../src/visual-runtime/document/validate.ts.md) |
| ../../../src/visual-runtime/document/schema.ts | import | 38 | [packages/tierflow/src/visual-runtime/document/schema.ts](../../../src/visual-runtime/document/schema.ts.md) |
| ../../../src/visual-runtime/components/catalog.ts | import | 39 | [packages/tierflow/src/visual-runtime/components/catalog.ts](../../../src/visual-runtime/components/catalog.ts.md) |
| ../../../src/visual-runtime/components/layout.ts | import | 40 | [packages/tierflow/src/visual-runtime/components/layout.ts](../../../src/visual-runtime/components/layout.ts.md) |
| ../../../src/visual-runtime/render/dom.ts | import | 41 | [packages/tierflow/src/visual-runtime/render/dom.ts](../../../src/visual-runtime/render/dom.ts.md) |
| ../../../src/visual-runtime/render/inspect.ts | import | 42 | [packages/tierflow/src/visual-runtime/render/inspect.ts](../../../src/visual-runtime/render/inspect.ts.md) |
| ../../../src/visual-runtime/command/compile.ts | import | 43 | [packages/tierflow/src/visual-runtime/command/compile.ts](../../../src/visual-runtime/command/compile.ts.md) |
| ../../../src/visual-runtime/command/crosswalk.ts | import | 44 | [packages/tierflow/src/visual-runtime/command/crosswalk.ts](../../../src/visual-runtime/command/crosswalk.ts.md) |
| ../../../src/visual-runtime/knowledge/client.ts | import | 45 | [packages/tierflow/src/visual-runtime/knowledge/client.ts](../../../src/visual-runtime/knowledge/client.ts.md) |
| ../../../src/visual-runtime/knowledge/fixtures.ts | import | 46 | [packages/tierflow/src/visual-runtime/knowledge/fixtures.ts](../../../src/visual-runtime/knowledge/fixtures.ts.md) |
| ../../../src/visual-runtime/knowledge/projection.ts | import | 47 | [packages/tierflow/src/visual-runtime/knowledge/projection.ts](../../../src/visual-runtime/knowledge/projection.ts.md) |
| ../../../src/visual-runtime/revisions/fixture-store.ts | import | 48 | [packages/tierflow/src/visual-runtime/revisions/fixture-store.ts](../../../src/visual-runtime/revisions/fixture-store.ts.md) |
| ../../../src/visual-runtime/host/fixture.ts | import | 49 | [packages/tierflow/src/visual-runtime/host/fixture.ts](../../../src/visual-runtime/host/fixture.ts.md) |
| ../../../src/visual-runtime/host/outcome.ts | import | 50 | [packages/tierflow/src/visual-runtime/host/outcome.ts](../../../src/visual-runtime/host/outcome.ts.md) |
| ../../../src/visual-runtime/experience/recovery.ts | import | 51 | [packages/tierflow/src/visual-runtime/experience/recovery.ts](../../../src/visual-runtime/experience/recovery.ts.md) |
| ../../../src/visual-runtime/experience/help.ts | import | 52 | [packages/tierflow/src/visual-runtime/experience/help.ts](../../../src/visual-runtime/experience/help.ts.md) |
| ../../../src/visual-runtime/integration-2/action-adapter.mjs | import | 53 | [packages/tierflow/src/visual-runtime/integration-2/action-adapter.mjs](../../../src/visual-runtime/integration-2/action-adapter.mjs.md) |
| ../../../src/ui/hash.ts | import | 54 | [packages/tierflow/src/ui/hash.ts](../../../src/ui/hash.ts.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```typescript
/**
 * I2-C step 3 — Integration 2 real A–H composition, at the closure order's
 * proposed path `tests/visual-runtime/integration-2/real-a-h.test.ts`.
 *
 * Integrator-owned path (see VIVIM-VISUAL-RUNTIME/WAVE-2/WAVE-3-OWNERSHIP.md:
 * `tests/visual-runtime/integration-2/**`). No lane-owned path is modified by
 * this file.
 *
 * WHAT THIS FILE PROVES
 *   1. Import provenance: every lane entrypoint exercised below is the real
 *      committed module, resolved from this file's own source directory. No
 *      mocked A–H entrypoint is imported. The only non-lane import is the
 *      integrator's own inert adapter and the repo's own hash helper.
 *   2. A single document crosses all eight lanes in one process, in the order
 *      document -> component -> render -> typed tri-modal command ->
 *      preview/replay -> Host deny -> accessible help/recovery.
 *   3. The adversarial negatives required by I2-C step 5 actually refuse.
 *
 * EVIDENCE LEVEL
 *   `real_module_integration` for every lane call: the real committed module
 *   is invoked in-process. It is NOT `server_e2e`, NOT `native_desktop`, NOT
 *   `android_device` and NOT `live_cutover_verified` — no live Host, KB,
 *   Studio, Android, provider browser or device is contacted, and no file is
 *   written. The KB and Host boundaries use the lanes' own committed
 *   `createFixtureKnowledgeClient` / `createHostCapabilityFixture` fixtures,
 *   which are external transport doubles, clearly labelled below.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, realpathSync } from 'node:fs';
import { dirname, resolve as resolvePath } from 'node:path';
import { fileURLToPath } from 'node:url';

// ---------------------------------------------------------------------------
// REAL lane entrypoints. No mock, no stub, no re-implementation.
// ---------------------------------------------------------------------------
import { validateUiDocument } from '../../../src/visual-runtime/document/validate.ts';
import { UI_DOCUMENT_SCHEMA } from '../../../src/visual-runtime/document/schema.ts';
import { inspectComponent } from '../../../src/visual-runtime/components/catalog.ts';
import { resolveLayout } from '../../../src/visual-runtime/components/layout.ts';
import { renderUiDocument } from '../../../src/visual-runtime/render/dom.ts';
import { inspectRenderPlan, snapshotRenderPlan } from '../../../src/visual-runtime/render/inspect.ts';
import { compileVisualCommand, toExactText } from '../../../src/visual-runtime/command/compile.ts';
import { resolveCrosswalk, checkArguments, type ActionDescriptor, type CrosswalkRow } from '../../../src/visual-runtime/command/crosswalk.ts';
import { createFixtureKnowledgeClient } from '../../../src/visual-runtime/knowledge/client.ts';
import { canonicalKnowledgeFixtures, fixtureTrustedContext, mutableFixtureBroker, FIXTURE_IDS } from '../../../src/visual-runtime/knowledge/fixtures.ts';
import { projectKnowledgePage } from '../../../src/visual-runtime/knowledge/projection.ts';
import { UiRevisionFixtureStore } from '../../../src/visual-runtime/revisions/fixture-store.ts';
import { createHostCapabilityFixture } from '../../../src/visual-runtime/host/fixture.ts';
import { projectObservedHostOutcome } from '../../../src/visual-runtime/host/outcome.ts';
import { projectRecovery } from '../../../src/visual-runtime/experience/recovery.ts';
import { projectCapabilityHelp } from '../../../src/visual-runtime/experience/help.ts';
import { projectInertActionRefs } from '../../../src/visual-runtime/integration-2/action-adapter.mjs';
import { canonicalJson, sha256Hex } from '../../../src/ui/hash.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolvePath(HERE, '../../..');
const SRC_ROOT = resolvePath(REPO_ROOT, 'src/visual-runtime');

const digestOf = (value: unknown): string => sha256Hex(canonicalJson(value));

// Fixed, deterministic constants: no wall clock, no randomness, no I/O writes.
const NOW_MS = 1_792_000_000_000;
const SESSION_TTL_MS = 60_000;
const OWNER_REF = 'owner_a';
const ACTOR_REF = 'actor_a';
const DEVICE_REF = 'desktop_1';
const SESSION_REF = 'session_1';
const WORLD_REF = 'world_a';
const DOCUMENT_ID = 'doc.integration2.real';
const POLICY_REVISION = 'policy-1';
const HOST_WORLD = 'world-1';
const HOST_CATALOG_VERSION = 1;
const ACTION_REF_ID = 'fixture.preview';
const ACTION_REF_VERSION = 1;
const SEMANTIC_ID = 'vivim.preview@1';
const HOST_ACTION_ID = 'vivim.preview';

/**
 * The one canonical Lane A document. Lane A's schema is the authority for it:
```

_First 80 of 1226 lines._

---

[HQ wiki](../../../../../../../index.md) · [Symbols](../../../../../../../symbols.md) · [Dependency graph](../../../../../../../graph.md) · [Documentation](../../../../../../../docs.md) · [Changes](../../../../../../../changes.md) · [Open tasks](../../../../../../../todos.md) · [Deprecated](../../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../../protocol.md) · [Glossary](../../../../../../../glossary.md) · [Using HQ](../../../../../../../context.md) · [Capabilities](../../../../../../../capabilities.md) · [Search index](../../../../../../../search.json) · [Browser view](../../../../../../../index.html)
