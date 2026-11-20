# File: packages/tierflow/src/ui/world.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | packages/tierflow/src/ui/world.ts |
| Language | TypeScript |
| Kind | source |
| Size | 47190 B |
| Lines | 1267 |
| Hash | 5878d73f5c4f |
| Test | no |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| ID_PATTERN | const | 39 | no | const ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/; |
| ACCENT_PATTERN | const | 42 | no | const ACCENT_PATTERN = /^#(?:[0-9a-fA-F]{3}\|[0-9a-fA-F]{6})$/; |
| STATE_PATH_PATTERN | const | 45 | no | const STATE_PATH_PATTERN = /^\\/[A-Za-z0-9_\\-/.]*$/; |
| PROP_NAME_PATTERN | const | 48 | no | const PROP_NAME_PATTERN = /^[A-Za-z0-9_\\-]{1,64}$/; |
| MAX_TITLE_LENGTH | const | 51 | no | const MAX_TITLE_LENGTH = 120; |
| REGISTERED_TRANSFORMS | const | 60 | yes | export const REGISTERED_TRANSFORMS: readonly string[] = Object.freeze([ &quot;identity&quot;, &quot;count&quot;, &quot;percent&quot;, &quot;ratio&quot;, |
| UiWorldErrorCode | type | 72 | yes | export type UiWorldErrorCode = |
| UiWorldError | class | 95 | yes | export class UiWorldError extends Error { |
| constructor | method | 100 | yes | constructor(code: UiWorldErrorCode, path: string, message: string) { |
| UiDocumentDiagnostic | interface | 108 | yes | export interface UiDocumentDiagnostic { |
| UiOperation | type | 123 | yes | export type UiOperation = |
| DeepMutable | type | 142 | no | type DeepMutable&lt;T&gt; = T extends readonly (infer U)[] |
| Collector | interface | 149 | no | interface Collector { |
| Inspection | interface | 154 | no | interface Inspection { |
| fail | function | 160 | no | function fail(collector: Collector, code: UiWorldErrorCode, path: string, message: string): void { |
| warn | function | 165 | no | function warn(collector: Collector, code: string, path: string, message: string): void { |
| firstError | function | 169 | no | function firstError(diagnostics: readonly UiDocumentDiagnostic[]): UiDocumentDiagnostic \| undefined { |
| throwFirstError | function | 173 | no | function throwFirstError(collector: Collector, fallbackPath: string): never { |
| failure | const | 174 | no | const failure = firstError(collector.diagnostics); |
| isRecord | function | 181 | no | function isRecord(value: unknown): value is Record&lt;string, unknown&gt; { |
| isScalar | function | 185 | no | function isScalar(value: unknown): value is UiScalar { |
| isLayerKind | function | 198 | no | function isLayerKind(value: unknown): value is UiLayerKind { |
| isShapeKind | function | 202 | no | function isShapeKind(value: unknown): value is UiShapeKind { |
| isObjectKind | function | 206 | no | function isObjectKind(value: unknown): value is UiObjectKind { |
| isRelationshipKind | function | 210 | no | function isRelationshipKind(value: unknown): value is UiRelationshipKind { |
| isWorldKind | function | 214 | no | function isWorldKind(value: unknown): value is UiWorldKind { |
| isPresent | function | 218 | no | function isPresent&lt;T&gt;(value: T \| null): value is T { |
| describeValue | function | 222 | no | function describeValue(value: unknown): string { |
| defineProp | function | 231 | no | function defineProp(target: Record&lt;string, UiScalar&gt;, key: string, value: UiScalar): void { |
| requireString | function | 235 | no | function requireString(value: unknown, path: string, code: UiWorldErrorCode): string { |
| collectId | function | 242 | no | function collectId( value: unknown, path: string, seen: Map&lt;string, string&gt;, code: UiWorldErrorCode, |
| firstUse | const | 253 | no | const firstUse = seen.get(value); |
| collectVec3 | function | 262 | no | function collectVec3( value: unknown, path: string, code: UiWorldErrorCode, collector: Collector, |
| before | const | 272 | no | const before = collector.errors; |
| vector | const | 273 | no | const vector: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 }; |
| axes | const | 274 | no | const axes = [&quot;x&quot;, &quot;y&quot;, &quot;z&quot;] as const; |
| component | const | 276 | no | const component = value[axis]; |
| collectTransform | function | 286 | no | function collectTransform( value: unknown, path: string, collector: Collector, ): DeepMutable&lt;UiTransform&gt; \| null { |
| before | const | 295 | no | const before = collector.errors; |
| position | const | 296 | no | const position = collectVec3(value[&quot;position&quot;], `${path}.position`, &quot;invalid_transform&quot;, collector); |
| rotation | const | 297 | no | const rotation = collectVec3(value[&quot;rotation&quot;], `${path}.rotation`, &quot;invalid_transform&quot;, collector); |
| scale | const | 298 | no | const scale = collectVec3(value[&quot;scale&quot;], `${path}.scale`, &quot;invalid_transform&quot;, collector); |
| axes | const | 301 | no | const axes = [&quot;x&quot;, &quot;y&quot;, &quot;z&quot;] as const; |
| collectProps | function | 313 | no | function collectProps( value: unknown, path: string, collector: Collector, ): Record&lt;string, UiScalar&gt; \| null { |
| before | const | 322 | no | const before = collector.errors; |
| props | const | 323 | no | const props: Record&lt;string, UiScalar&gt; = {}; |
| entry | const | 325 | no | const entry = value[key]; |
| collectObject | function | 335 | no | function collectObject( value: unknown, path: string, seen: Map&lt;string, string&gt;, collector: Collector, |
| before | const | 345 | no | const before = collector.errors; |
| id | const | 347 | no | const id = collectId(value[&quot;id&quot;], `${path}.id`, seen, &quot;invalid_object&quot;, collector); |
| layerValue | const | 349 | no | const layerValue = value[&quot;layer&quot;]; |
| layer | variable | 350 | no | let layer: UiLayerKind \| null = null; |
| kindValue | const | 357 | no | const kindValue = value[&quot;kind&quot;]; |
| kind | variable | 358 | no | let kind: UiObjectKind \| null = null; |
| shapeValue | const | 365 | no | const shapeValue = value[&quot;shape&quot;]; |
| shape | variable | 366 | no | let shape: UiShapeKind \| null = null; |
| title | variable | 373 | no | let title: string \| undefined; |
| titleValue | const | 374 | no | const titleValue = value[&quot;title&quot;]; |
| transform | const | 383 | no | const transform = collectTransform(value[&quot;transform&quot;], `${path}.transform`, collector); |
| props | variable | 385 | no | let props: Record&lt;string, UiScalar&gt; \| undefined; |
| propsValue | const | 386 | no | const propsValue = value[&quot;props&quot;]; |
| collected | const | 388 | no | const collected = collectProps(propsValue, `${path}.props`, collector); |
| object | const | 395 | no | const object: DeepMutable&lt;UiObject&gt; = { id, layer, kind, shape, transform }; |
| collectReference | function | 401 | no | function collectReference( value: unknown, path: string, objectIds: ReadonlySet&lt;string&gt; \| null, code: UiWorldErrorCode, |
| collectRelationship | function | 419 | no | function collectRelationship( value: unknown, path: string, seen: Map&lt;string, string&gt;, objectIds: ReadonlySet&lt;string&gt; \| null, |
| before | const | 430 | no | const before = collector.errors; |
| id | const | 432 | no | const id = collectId(value[&quot;id&quot;], `${path}.id`, seen, &quot;invalid_relationship&quot;, collector); |
| to | const | 434 | no | const to = collectReference(value[&quot;to&quot;], `${path}.to`, objectIds, &quot;invalid_relationship&quot;, collector); |
| kindValue | const | 436 | no | const kindValue = value[&quot;kind&quot;]; |
| kind | variable | 437 | no | let kind: UiRelationshipKind \| null = null; |
| label | variable | 444 | no | let label: string \| undefined; |
| labelValue | const | 445 | no | const labelValue = value[&quot;label&quot;]; |
| relationship | const | 460 | no | const relationship: DeepMutable&lt;UiRelationship&gt; = { id, from, to, kind }; |
| collectDataFlow | function | 465 | no | function collectDataFlow( value: unknown, path: string, seen: Map&lt;string, string&gt;, objectIds: ReadonlySet&lt;string&gt; \| null, |
| before | const | 476 | no | const before = collector.errors; |
| id | const | 478 | no | const id = collectId(value[&quot;id&quot;], `${path}.id`, seen, &quot;invalid_data_flow&quot;, collector); |
| pathValue | const | 480 | no | const pathValue = value[&quot;path&quot;]; |
| statePath | variable | 481 | no | let statePath: string \| null = null; |
| segments | const | 486 | no | const segments = statePath.slice(1).split(&quot;/&quot;); |
| targetObject | const | 492 | no | const targetObject = collectReference(value[&quot;targetObject&quot;], `${path}.targetObject`, objectIds, &quot;invalid_data_flow&quot;, collector); |
| targetPropValue | const | 494 | no | const targetPropValue = value[&quot;targetProp&quot;]; |
| targetProp | variable | 495 | no | let targetProp: string \| null = null; |
| directionValue | const | 502 | no | const directionValue = value[&quot;direction&quot;]; |
| direction | variable | 503 | no | let direction: UiFlowDirection \| null = null; |
| transformName | variable | 510 | no | let transformName: string \| undefined; |
| transformValue | const | 511 | no | const transformValue = value[&quot;transform&quot;]; |
| flow | const | 528 | no | const flow: DeepMutable&lt;UiDataFlow&gt; = { id, path: statePath, targetObject, targetProp, direction }; |
| collectWorld | function | 533 | no | function collectWorld(value: unknown, collector: Collector): DeepMutable&lt;UiWorld&gt; \| null { |
| before | const | 538 | no | const before = collector.errors; |
| id | const | 540 | no | const id = collectId(value[&quot;id&quot;], &quot;world.id&quot;, new Map&lt;string, string&gt;(), &quot;invalid_world&quot;, collector); |
| kindValue | const | 542 | no | const kindValue = value[&quot;kind&quot;]; |
| kind | variable | 543 | no | let kind: UiWorldKind \| null = null; |
| title | variable | 550 | no | let title: string \| null = null; |
| titleValue | const | 551 | no | const titleValue = value[&quot;title&quot;]; |
| trimmed | const | 555 | no | const trimmed = titleValue.trim(); |
| accentValue | const | 563 | no | const accentValue = value[&quot;accent&quot;]; |
| accent | variable | 564 | no | let accent: string \| null = null; |
| origin | const | 571 | no | const origin = collectVec3(value[&quot;origin&quot;], &quot;world.origin&quot;, &quot;invalid_world&quot;, collector); |
| unitsValue | const | 573 | no | const unitsValue = value[&quot;unitsPerMeter&quot;]; |
| unitsPerMeter | variable | 574 | no | let unitsPerMeter: number \| null = null; |
| reportContainsCycles | function | 594 | no | function reportContainsCycles( relationships: ReadonlyArray&lt;{ relation: DeepMutable&lt;UiRelationship&gt;; index: number } \| null&gt;, objectIds: ReadonlySet&lt;string&gt;, collector: Collector, ): void { |
| adjacency | const | 599 | no | const adjacency = new Map&lt;string, Array&lt;{ to: string; index: number }&gt;&gt;(); |
| edge | const | 602 | no | const edge = { to: entry.relation.to, index: entry.index }; |
| edges | const | 603 | no | const edges = adjacency.get(entry.relation.from); |
| state | const | 608 | no | const state = new Map&lt;string, 1 \| 2&gt;(); |
| idPath | const | 609 | no | const idPath: string[] = []; |
| pathIndex | const | 610 | no | const pathIndex = new Map&lt;string, number&gt;(); |
| frames | const | 611 | no | const frames: Array&lt;{ node: string; edges: ReadonlyArray&lt;{ to: string; index: number }&gt;; cursor: number }&gt; = []; |
| enter | function | 613 | no | const enter = (node: string): void =&gt; { |
| frame | const | 624 | no | const frame = frames[frames.length - 1]!; |
| edge | const | 632 | no | const edge = frame.edges[frame.cursor]!; |
| visited | const | 635 | no | const visited = state.get(edge.to); |
| start | const | 637 | no | const start = pathIndex.get(edge.to) ?? 0; |
| chain | const | 638 | no | const chain = [...idPath.slice(start), edge.to].join(&quot; -&gt; &quot;); |
| collectCrossRules | function | 655 | no | function collectCrossRules( objects: ReadonlyArray&lt;DeepMutable&lt;UiObject&gt; \| null&gt;, relationships: ReadonlyArray&lt;{ relation: DeepMutable&lt;UiRelationship&gt;; index: number } \| null&gt;, dataFlows: ReadonlyArr… |
| inbound | const | 664 | no | const inbound = new Map&lt;string, number&gt;(); |
| object | const | 671 | no | const object = objects[index] ?? null; |
| count | const | 673 | no | const count = inbound.get(object.id) ?? 0; |
| inspectDocument | function | 702 | no | function inspectDocument(input: unknown): Inspection { |
| collector | const | 703 | no | const collector: Collector = { diagnostics: [], errors: 0 }; |
| world | const | 714 | no | const world = collectWorld(input[&quot;world&quot;], collector); |
| seen | const | 715 | no | const seen = new Map&lt;string, string&gt;(); |
| objectsValue | const | 717 | no | const objectsValue = input[&quot;objects&quot;]; |
| objects | const | 718 | no | const objects: Array&lt;DeepMutable&lt;UiObject&gt; \| null&gt; = []; |
| objectIds | variable | 719 | no | let objectIds: Set&lt;string&gt; \| null = null; |
| titles | const | 735 | no | const titles = new Map&lt;string, string&gt;(); |
| object | const | 737 | no | const object = objects[index] ?? null; |
| firstUse | const | 739 | no | const firstUse = titles.get(object.title); |
| relationshipsValue | const | 752 | no | const relationshipsValue = input[&quot;relationships&quot;]; |
| relationships | const | 753 | no | const relationships: Array&lt;{ relation: DeepMutable&lt;UiRelationship&gt;; index: number } \| null&gt; = []; |
| relation | const | 758 | no | const relation = collectRelationship( relationshipsValue[index], `relationships[${index}]`, seen, objectIds, |
| dataFlowsValue | const | 769 | no | const dataFlowsValue = input[&quot;dataFlows&quot;]; |
| dataFlows | const | 770 | no | const dataFlows: Array&lt;{ flow: DeepMutable&lt;UiDataFlow&gt;; index: number } \| null&gt; = []; |
| flow | const | 775 | no | const flow = collectDataFlow(dataFlowsValue[index], `dataFlows[${index}]`, seen, objectIds, collector); |
| freezeVec3 | function | 798 | no | function freezeVec3(vector: DeepMutable&lt;UiVec3&gt;): UiVec3 { |
| freezeTransform | function | 802 | no | function freezeTransform(transform: DeepMutable&lt;UiTransform&gt;): UiTransform { |
| copyProps | function | 810 | no | function copyProps(props: Readonly&lt;Record&lt;string, UiScalar&gt;&gt;): Record&lt;string, UiScalar&gt; { |
| copy | const | 811 | no | const copy: Record&lt;string, UiScalar&gt; = {}; |
| value | const | 813 | no | const value = props[key]; |
| freezeObject | function | 820 | no | function freezeObject(object: DeepMutable&lt;UiObject&gt;): UiObject { |
| frozen | const | 821 | no | const frozen: { |
| freezeRelationship | function | 841 | no | function freezeRelationship(relationship: DeepMutable&lt;UiRelationship&gt;): UiRelationship { |
| frozen | const | 842 | no | const frozen: { id: string; from: string; to: string; kind: UiRelationshipKind; label?: string } = { |
| freezeDataFlow | function | 852 | no | function freezeDataFlow(flow: DeepMutable&lt;UiDataFlow&gt;): UiDataFlow { |
| frozen | const | 853 | no | const frozen: { |
| freezeWorld | function | 871 | no | function freezeWorld(world: DeepMutable&lt;UiWorld&gt;): UiWorld { |
| freezeDocument | function | 883 | no | function freezeDocument(document: DeepMutable&lt;UiDocument&gt;): UiDocument { |
| cloneVec3 | function | 893 | no | function cloneVec3(vector: UiVec3): DeepMutable&lt;UiVec3&gt; { |
| cloneObject | function | 897 | no | function cloneObject(object: UiObject): DeepMutable&lt;UiObject&gt; { |
| clone | const | 898 | no | const clone: DeepMutable&lt;UiObject&gt; = { |
| cloneRelationship | function | 914 | no | function cloneRelationship(relationship: UiRelationship): DeepMutable&lt;UiRelationship&gt; { |
| clone | const | 915 | no | const clone: DeepMutable&lt;UiRelationship&gt; = { |
| cloneDataFlow | function | 925 | no | function cloneDataFlow(flow: UiDataFlow): DeepMutable&lt;UiDataFlow&gt; { |
| clone | const | 926 | no | const clone: DeepMutable&lt;UiDataFlow&gt; = { |
| cloneDocument | function | 938 | no | function cloneDocument(document: UiDocument): DeepMutable&lt;UiDocument&gt; { |
| hasDocumentId | function | 955 | no | function hasDocumentId(document: DeepMutable&lt;UiDocument&gt;, id: string): boolean { |
| objectIndex | function | 963 | no | function objectIndex(document: DeepMutable&lt;UiDocument&gt;, objectId: string, path: string): number { |
| index | const | 964 | no | const index = document.objects.findIndex((object) =&gt; object.id === objectId); |
| addObject | function | 971 | no | function addObject(document: DeepMutable&lt;UiDocument&gt;, value: unknown, path: string): void { |
| collector | const | 972 | no | const collector: Collector = { diagnostics: [], errors: 0 }; |
| object | const | 973 | no | const object = collectObject(value, `${path}.object`, new Map&lt;string, string&gt;(), collector); |
| removeObject | function | 982 | no | function removeObject(document: DeepMutable&lt;UiDocument&gt;, objectIdValue: unknown, path: string): void { |
| objectId | const | 983 | no | const objectId = requireString(objectIdValue, `${path}.objectId`, &quot;invalid_object&quot;); |
| index | const | 984 | no | const index = objectIndex(document, objectId, `${path}.objectId`); |
| moveObject | function | 992 | no | function moveObject(document: DeepMutable&lt;UiDocument&gt;, objectIdValue: unknown, transformValue: unknown, path: string): void { |
| objectId | const | 993 | no | const objectId = requireString(objectIdValue, `${path}.objectId`, &quot;invalid_object&quot;); |
| index | const | 994 | no | const index = objectIndex(document, objectId, `${path}.objectId`); |
| collector | const | 995 | no | const collector: Collector = { diagnostics: [], errors: 0 }; |
| transform | const | 996 | no | const transform = collectTransform(transformValue, `${path}.transform`, collector); |
| setObjectProp | function | 1002 | no | function setObjectProp( document: DeepMutable&lt;UiDocument&gt;, objectIdValue: unknown, keyValue: unknown, value: unknown, |
| objectId | const | 1009 | no | const objectId = requireString(objectIdValue, `${path}.objectId`, &quot;invalid_object&quot;); |
| key | const | 1010 | no | const key = requireString(keyValue, `${path}.key`, &quot;invalid_object&quot;); |
| object | const | 1011 | no | const object = document.objects[objectIndex(document, objectId, `${path}.objectId`)]!; |
| props | const | 1024 | no | const props = object.props ?? {}; |
| setObjectLayer | function | 1029 | no | function setObjectLayer(document: DeepMutable&lt;UiDocument&gt;, objectIdValue: unknown, layerValue: unknown, path: string): void { |
| objectId | const | 1030 | no | const objectId = requireString(objectIdValue, `${path}.objectId`, &quot;invalid_object&quot;); |
| object | const | 1031 | no | const object = document.objects[objectIndex(document, objectId, `${path}.objectId`)]!; |
| setObjectKind | function | 1038 | no | function setObjectKind(document: DeepMutable&lt;UiDocument&gt;, objectIdValue: unknown, kindValue: unknown, path: string): void { |
| objectId | const | 1039 | no | const objectId = requireString(objectIdValue, `${path}.objectId`, &quot;invalid_object&quot;); |
| object | const | 1040 | no | const object = document.objects[objectIndex(document, objectId, `${path}.objectId`)]!; |
| addRelationship | function | 1047 | no | function addRelationship(document: DeepMutable&lt;UiDocument&gt;, value: unknown, path: string): void { |
| collector | const | 1048 | no | const collector: Collector = { diagnostics: [], errors: 0 }; |
| objectIds | const | 1049 | no | const objectIds = new Set(document.objects.map((object) =&gt; object.id)); |
| relationship | const | 1050 | no | const relationship = collectRelationship(value, `${path}.relationship`, new Map&lt;string, string&gt;(), objectIds, collector); |
| removeRelationship | function | 1063 | no | function removeRelationship(document: DeepMutable&lt;UiDocument&gt;, relationshipIdValue: unknown, path: string): void { |
| relationshipId | const | 1064 | no | const relationshipId = requireString(relationshipIdValue, `${path}.relationshipId`, &quot;invalid_relationship&quot;); |
| index | const | 1065 | no | const index = document.relationships.findIndex((relationship) =&gt; relationship.id === relationshipId); |
| addDataFlow | function | 1076 | no | function addDataFlow(document: DeepMutable&lt;UiDocument&gt;, value: unknown, path: string): void { |
| collector | const | 1077 | no | const collector: Collector = { diagnostics: [], errors: 0 }; |
| objectIds | const | 1078 | no | const objectIds = new Set(document.objects.map((object) =&gt; object.id)); |
| flow | const | 1079 | no | const flow = collectDataFlow(value, `${path}.dataFlow`, new Map&lt;string, string&gt;(), objectIds, collector); |
| removeDataFlow | function | 1088 | no | function removeDataFlow(document: DeepMutable&lt;UiDocument&gt;, dataFlowIdValue: unknown, path: string): void { |
| dataFlowId | const | 1089 | no | const dataFlowId = requireString(dataFlowIdValue, `${path}.dataFlowId`, &quot;invalid_data_flow&quot;); |
| index | const | 1090 | no | const index = document.dataFlows.findIndex((flow) =&gt; flow.id === dataFlowId); |
| setWorldTitle | function | 1097 | no | function setWorldTitle(document: DeepMutable&lt;UiDocument&gt;, value: unknown, path: string): void { |
| trimmed | const | 1101 | no | const trimmed = value.trim(); |
| applyOperation | function | 1108 | no | function applyOperation(document: DeepMutable&lt;UiDocument&gt;, operation: unknown, path: string): void { |
| parseUiDocument | function | 1162 | yes | export function parseUiDocument(input: unknown): UiDocument { |
| inspection | const | 1163 | no | const inspection = inspectDocument(input); |
| failure | const | 1164 | no | const failure = firstError(inspection.diagnostics); |
| validateUiDocument | function | 1181 | yes | export function validateUiDocument(input: unknown): UiDocumentDiagnostic[] { |
| defaultUiDocument | function | 1192 | yes | export function defaultUiDocument(kind: UiWorldKind = &quot;home&quot;): UiDocument { |
| uiDocumentHash | function | 1233 | yes | export function uiDocumentHash(document: UiDocument): string { |
| applyUiOperations | function | 1249 | yes | export function applyUiOperations(document: UiDocument, operations: UiOperation[]): UiDocument { |
| draft | const | 1253 | no | const draft = cloneDocument(parseUiDocument(document)); |
| inspection | const | 1258 | no | const inspection = inspectDocument(draft); |
| failure | const | 1259 | no | const failure = firstError(inspection.diagnostics); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./hash.ts | import | 16 | [packages/tierflow/src/ui/hash.ts](./hash.ts.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [packages/tierflow/src/ui/commands.ts](./commands.ts.md) | ./world.ts |
| [packages/tierflow/src/ui/commands.ts](./commands.ts.md) | ./world.ts |
| [packages/tierflow/src/visual-runtime/final-wave/integration/schema-boundary.ts](../visual-runtime/final-wave/integration/schema-boundary.ts.md) | ../../../ui/world.ts |
| [packages/tierflow/src/visual-runtime/final-wave/integration/world-visual-bridge.ts](../visual-runtime/final-wave/integration/world-visual-bridge.ts.md) | ../../../ui/world.ts |
| [packages/tierflow/src/visual-runtime/final-wave/lane-b/studio-editing.ts](../visual-runtime/final-wave/lane-b/studio-editing.ts.md) | ../../../ui/world.ts |
| [packages/tierflow/src/visual-runtime/final-wave/lane-b/studio-editing.ts](../visual-runtime/final-wave/lane-b/studio-editing.ts.md) | ../../../ui/world.ts |
| [packages/tierflow/src/visual-runtime/integration-3/compose.ts](../visual-runtime/integration-3/compose.ts.md) | ../../ui/world.ts |
| [packages/tierflow/src/visual-runtime/revisions/wave3-atomic-replay.ts](../visual-runtime/revisions/wave3-atomic-replay.ts.md) | ../../ui/world.ts |
| [packages/tierflow/tests/ui-commands.test.ts](../../tests/ui-commands.test.ts.md) | ../src/ui/world.ts |
| [packages/tierflow/tests/ui-world.test.ts](../../tests/ui-world.test.ts.md) | ../src/ui/world.ts |
| [packages/tierflow/tests/visual-runtime/final-wave/integration/world-visual-bridge.refusals.test.ts](../../tests/visual-runtime/final-wave/integration/world-visual-bridge.refusals.test.ts.md) | ../../../../src/ui/world.ts |
| [packages/tierflow/tests/visual-runtime/final-wave/integration/world-visual-bridge.test.ts](../../tests/visual-runtime/final-wave/integration/world-visual-bridge.test.ts.md) | ../../../../src/ui/world.ts |

## Annotations

_No annotations._

## Excerpt

```typescript
/**
 * World document model for the UI core.
 *
 * A document describes exactly one world: the infinite 3D canvas a user sees.
 * This module owns the document grammar and the semantic edits applied to it:
 * parsing, whole-document validation, the default world, content hashing, and
 * the operation log that turns a document into its next frozen revision.
 *
 * Everything here is pure. No I/O, no store, no transport, no adapter. A parsed
 * document is deeply frozen, so callers can share it across revisions without
 * defensive copying, and hashing it is deterministic. Validation is total:
 * `validateUiDocument` reports every problem with a path instead of stopping at
 * the first one, while `parseUiDocument` throws one typed error per document.
 */

import { contentHash } from "./hash.ts";
import {
  UI_LAYER_KINDS,
  UI_RELATIONSHIP_KINDS,
  UI_SCHEMA_VERSION,
  UI_SHAPE_KINDS,
  type UiDataFlow,
  type UiDocument,
  type UiFlowDirection,
  type UiLayerKind,
  type UiObject,
  type UiObjectKind,
  type UiRelationship,
  type UiRelationshipKind,
  type UiScalar,
  type UiShapeKind,
  type UiTransform,
  type UiVec3,
  type UiWorld,
  type UiWorldKind,
} from "./types.ts";

/** Ids are opaque, stable, and unique within one document. */
const ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

/** `#rgb` or `#rrggbb`. */
const ACCENT_PATTERN = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

/** Absolute state path under the exposed projection, no query, no expression. */
const STATE_PATH_PATTERN = /^\/[A-Za-z0-9_\-/.]*$/;

/** Property name a flow writes into an object. */
const PROP_NAME_PATTERN = /^[A-Za-z0-9_\-]{1,64}$/;

/** Longest accepted world title, object title and relationship label. */
const MAX_TITLE_LENGTH = 120;

/**
 * Deterministic transform names a data flow may reference.
 *
 * The set is closed on purpose: a renderer must be able to reproduce a value
 * from a path and a name alone, so no flow carries code, a function, or an
 * expression. An unregistered name is rejected rather than ignored.
 */
export const REGISTERED_TRANSFORMS: readonly string[] = Object.freeze([
  "identity",
  "count",
  "percent",
  "ratio",
  "duration",
  "label",
  "boolean",
  "currency",
]);

/** Stable failure codes of the world document model. */
export type UiWorldErrorCode =
  | "invalid_world"
  | "invalid_object"
  | "invalid_relationship"
  | "invalid_data_flow"
  | "invalid_transform"
  | "duplicate_id"
  | "missing_reference"
  | "cycle"
```

_First 80 of 1268 lines._

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
