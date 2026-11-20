# File: packages/tierflow/web/world.js

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | packages/tierflow/web/world.js |
| Language | JavaScript |
| Kind | source |
| Size | 144935 B |
| Lines | 3803 |
| Hash | b4e38abb1856 |
| Test | no |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| LAYERS | const | 20 | no | const LAYERS = Object.freeze([&quot;ground&quot;, &quot;structure&quot;, &quot;content&quot;, &quot;data&quot;, &quot;overlay&quot;]); |
| SHAPES | const | 21 | no | const SHAPES = Object.freeze([&quot;box&quot;, &quot;sphere&quot;, &quot;cylinder&quot;, &quot;plane&quot;, &quot;text&quot;, &quot;billboard&quot;]); |
| KINDS | const | 22 | no | const KINDS = Object.freeze([&quot;static&quot;, &quot;dynamic&quot;]); |
| RELATIONSHIP_KINDS | const | 23 | no | const RELATIONSHIP_KINDS = Object.freeze([&quot;contains&quot;, &quot;links&quot;, &quot;drives&quot;, &quot;mirrors&quot;]); |
| DEFAULT_ACCENT | const | 25 | no | const DEFAULT_ACCENT = &quot;#ff9d3d&quot;; |
| BG | const | 26 | no | const BG = &quot;#07080a&quot;; |
| NEAR | const | 27 | no | const NEAR = 0.08; |
| LAYER_META | const | 30 | no | const LAYER_META = Object.freeze({ ground: { label: &quot;Ground&quot;, order: 0, tint: &quot;#3a424e&quot;, alpha: 0.55 }, structure: { label: &quot;Structure&quot;, order: 1, tint: &quot;#7f8fa3&quot;, alpha: 0.92 }, content: { label: &quot;C… |
| SHAPE_LABEL | const | 38 | no | const SHAPE_LABEL = Object.freeze({ box: &quot;Box&quot;, sphere: &quot;Sphere&quot;, cylinder: &quot;Cylinder&quot;, plane: &quot;Plane&quot;, |
| OPERATION_LABEL | const | 47 | no | const OPERATION_LABEL = Object.freeze({ &quot;object.add&quot;: &quot;Add&quot;, &quot;object.remove&quot;: &quot;Remove&quot;, &quot;object.move&quot;: &quot;Move&quot;, &quot;object.setProp&quot;: &quot;Set property&quot;, |
| MONO | const | 61 | no | const MONO = &#39;ui-monospace, &quot;Cascadia Mono&quot;, &quot;Cascadia Code&quot;, &quot;SF Mono&quot;, Menlo, Consolas, monospace&#39;; |
| OPERATION_NAMES | const | 63 | no | const OPERATION_NAMES = Object.freeze([ &quot;object.add&quot;, &quot;object.remove&quot;, &quot;object.move&quot;, &quot;object.setProp&quot;, |
| clamp | function | 81 | no | function clamp(value, min, max) { |
| isObject | function | 85 | no | function isObject(value) { |
| isFiniteNumber | function | 89 | no | function isFiniteNumber(value) { |
| isVec3 | function | 93 | no | function isVec3(value) { |
| isTransform | function | 97 | no | function isTransform(value) { |
| isScalar | function | 101 | no | function isScalar(value) { |
| copyVec3 | function | 105 | no | function copyVec3(value) { |
| randomToken | function | 109 | no | function randomToken() { |
| cryptoApi | const | 110 | no | const cryptoApi = typeof globalThis.crypto === &quot;object&quot; ? globalThis.crypto : null; |
| readColorProp | function | 118 | no | function readColorProp(props) { |
| hexToRgb | function | 123 | no | function hexToRgb(hex) { |
| raw | variable | 125 | no | let raw = hex.replace(&quot;#&quot;, &quot;&quot;).trim(); |
| value | const | 128 | no | const value = Number.parseInt(raw, 16); |
| accentInk | function | 134 | no | function accentInk(hex) { |
| luminance | const | 138 | no | const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b; |
| mixHex | function | 142 | no | function mixHex(hex, target, amount) { |
| a | const | 143 | no | const a = hexToRgb(hex); |
| b | const | 144 | no | const b = hexToRgb(target); |
| t | const | 145 | no | const t = clamp(amount, 0, 1); |
| to | function | 146 | no | const to = (value) =&gt; Math.round(clamp(value, 0, 1) * 255).toString(16).padStart(2, &quot;0&quot;); |
| formatScalar | function | 150 | no | function formatScalar(value) { |
| formatVec3 | function | 157 | no | function formatVec3(position) { |
| normalizeOperation | function | 174 | no | function normalizeOperation(input) { |
| fail | function | 182 | no | const fail = (message) =&gt; ({ ok: false, code: &quot;INVALID_OPERATION&quot;, message: message }); |
| object | const | 186 | no | const object = input.object; |
| next | const | 193 | no | const next = { |
| key | const | 233 | no | const key = typeof input.key === &quot;string&quot; ? input.key : input.prop; |
| rel | const | 250 | no | const rel = input.relationship; |
| next | const | 255 | no | const next = { op: &quot;relationship.add&quot;, relationship: { id: rel.id, from: rel.from, to: rel.to, kind: rel.kind } }; |
| flow | const | 264 | no | const flow = input.dataFlow; |
| next | const | 272 | no | const next = { |
| copyScalarMap | function | 298 | no | function copyScalarMap(map) { |
| out | const | 299 | no | const out = {}; |
| isDocumentShaped | function | 307 | no | function isDocumentShaped(document) { |
| objectsOf | function | 316 | no | function objectsOf(document) { |
| findObject | function | 320 | no | function findObject(document, objectId) { |
| objects | const | 322 | no | const objects = objectsOf(document); |
| effectiveTitle | function | 334 | no | function effectiveTitle(object) { |
| applyOperationsToDocument | function | 349 | no | function applyOperationsToDocument(document, operations) { |
| world | variable | 351 | no | let world = document.world; |
| objects | variable | 352 | no | let objects = document.objects.slice(); |
| relationships | variable | 353 | no | let relationships = Array.isArray(document.relationships) ? document.relationships.slice() : []; |
| dataFlows | variable | 354 | no | let dataFlows = Array.isArray(document.dataFlows) ? document.dataFlows.slice() : []; |
| replaceObject | function | 356 | no | const replaceObject = (objectId, change) =&gt; { |
| props | const | 378 | no | const props = { ...(isObject(object.props) ? object.props : {}) }; |
| describeOperation | function | 418 | no | function describeOperation(op, document) { |
| target | function | 419 | no | const target = (objectId) =&gt; { |
| object | const | 420 | no | const object = findObject(document, objectId); |
| createHttp | function | 455 | no | function createHttp(options) { |
| baseUrl | const | 456 | no | const baseUrl = typeof options.baseUrl === &quot;string&quot; ? options.baseUrl.replace(/\\/+$/, &quot;&quot;) : &quot;&quot;; |
| fetchImpl | const | 457 | no | const fetchImpl = |
| send | function | 464 | no | async function send(method, path, body) { |
| headers | const | 468 | no | const headers = { accept: &quot;application/json&quot; }; |
| response | variable | 470 | no | let response; |
| payload | variable | 483 | no | let payload = null; |
| readApiError | function | 502 | no | function readApiError(payload, status) { |
| source | const | 503 | no | const source = isObject(payload) &amp;&amp; isObject(payload.error) ? payload.error : isObject(payload) ? payload : {}; |
| code | const | 504 | no | const code = typeof source.code === &quot;string&quot; &amp;&amp; source.code ? source.code : &quot;HTTP_&quot; + status; |
| message | const | 505 | no | const message = |
| error | const | 511 | no | const error = { code: code, message: message }; |
| pickRevisionNumber | function | 516 | no | function pickRevisionNumber(value) { |
| pickDocument | function | 523 | no | function pickDocument(value) { |
| pickDraft | function | 530 | no | function pickDraft(value) { |
| pickWorlds | function | 535 | no | function pickWorlds(value) { |
| createWorldClient | function | 558 | yes | export function createWorldClient(options = {}) { |
| settings | const | 559 | no | const settings = isObject(options) ? options : {}; |
| actorId | const | 560 | no | const actorId = typeof settings.actorId === &quot;string&quot; &amp;&amp; settings.actorId ? settings.actorId : &quot;studio&quot;; |
| http | const | 561 | no | const http = createHttp(settings); |
| onSelection | const | 562 | no | const onSelection = typeof settings.onSelection === &quot;function&quot; ? settings.onSelection : null; |
| onState | const | 563 | no | const onState = typeof settings.onState === &quot;function&quot; ? settings.onState : null; |
| loadDocument | const | 564 | no | const loadDocument = typeof settings.loadDocument === &quot;function&quot; ? settings.loadDocument : null; |
| commandSeq | variable | 565 | no | let commandSeq = 0; |
| nextCommandId | function | 567 | no | function nextCommandId(stage) { |
| state | const | 573 | no | const state = { |
| viewCache | variable | 587 | no | let viewCache = null; |
| destroyed | variable | 588 | no | let destroyed = false; |
| publishing | variable | 589 | no | let publishing = false; |
| viewDocument | function | 591 | no | function viewDocument() { |
| invalidate | function | 598 | no | function invalidate() { |
| snapshot | function | 602 | no | function snapshot() { |
| view | const | 603 | no | const view = viewDocument(); |
| selected | const | 604 | no | const selected = state.selectedId ? findObject(view \|\| state.document, state.selectedId) : null; |
| emit | function | 623 | no | function emit() { |
| notifySelection | function | 628 | no | function notifySelection() { |
| object | const | 630 | no | const object = state.selectedId ? findObject(viewDocument(), state.selectedId) : null; |
| next | const | 635 | no | const next = typeof objectId === &quot;string&quot; &amp;&amp; objectId ? objectId : null; |
| setDocument | function | 646 | no | function setDocument(document, revision) { |
| nextRevision | const | 648 | no | const nextRevision = Number.isInteger(revision) &amp;&amp; revision &gt;= 0 ? revision : 0; |
| current | const | 649 | no | const current = state.document; |
| sameWorld | const | 650 | no | const sameWorld = |
| view | const | 660 | no | const view = viewDocument(); |
| setWorlds | function | 669 | no | function setWorlds(worlds) { |
| setResolvedValues | function | 676 | no | function setResolvedValues(values) { |
| applyServerMessage | function | 689 | no | function applyServerMessage(message) { |
| frame | const | 690 | no | const frame = readFrame(message); |
| revision | const | 694 | no | const revision = pickRevisionNumber(frame.revision); |
| worldId | const | 696 | no | const worldId = typeof frame.worldId === &quot;string&quot; ? frame.worldId : null; |
| currentWorldId | const | 697 | no | const currentWorldId = state.document &amp;&amp; isObject(state.document.world) ? state.document.world.id : null; |
| document | const | 703 | no | const document = pickDocument(frame.revision) \|\| pickDocument(frame); |
| applied | const | 705 | no | const applied = revision &gt; state.revision \|\| currentWorldId === null; |
| loadedRevision | const | 716 | no | const loadedRevision = |
| worlds | const | 727 | no | const worlds = pickWorlds(frame); |
| draft | const | 734 | no | const draft = pickDraft(frame); |
| error | const | 764 | no | const error = { code: frame.code, message: typeof frame.message === &quot;string&quot; ? frame.message : frame.code }; |
| queueOperation | function | 775 | no | function queueOperation(op) { |
| candidate | variable | 776 | no | let candidate = op; |
| existing | const | 780 | no | const existing = findObject(viewDocument(), op.objectId); |
| normalized | const | 793 | no | const normalized = normalizeOperation(candidate); |
| clearOperations | function | 803 | no | function clearOperations() { |
| fail | function | 812 | no | function fail(stage, code, message, currentRevision) { |
| error | const | 813 | no | const error = { code: code, message: message }; |
| publish | function | 829 | no | async function publish() { |
| worldId | const | 838 | no | const worldId = state.document.world.id; |
| baseRevision | const | 839 | no | const baseRevision = state.revision; |
| applied | const | 840 | no | const applied = state.pending.slice(); |
| created | const | 847 | no | const created = await http.post(&quot;/api/ui/drafts&quot;, { commandId: nextCommandId(&quot;draft&quot;), actorId: actorId, worldId: worldId, baseRevision: baseRevision, |
| draft | const | 856 | no | const draft = pickDraft(created.body); |
| draftRevision | const | 860 | no | const draftRevision = Number.isInteger(draft.draftRevision) ? draft.draftRevision : 1; |
| editBody | const | 866 | no | const editBody = { |
| edited | const | 872 | no | const edited = await http.post(&quot;/api/ui/drafts/&quot; + encodeURIComponent(draft.draftId) + &quot;/edit&quot;, editBody); |
| editedDraft | const | 876 | no | const editedDraft = pickDraft(edited.body) \|\| draft; |
| preview | const | 878 | no | const preview = await http.post(&quot;/api/ui/drafts/&quot; + encodeURIComponent(draft.draftId) + &quot;/preview&quot;, { actorId: actorId, }); |
| publishBody | const | 888 | no | const publishBody = { |
| published | const | 895 | no | const published = await http.post(&quot;/api/ui/publish&quot;, publishBody); |
| revision | const | 900 | no | const revision = pickRevisionNumber(published.body); |
| previewPayload | const | 904 | no | const previewPayload = isObject(preview.body) ? preview.body : {}; |
| document | const | 905 | no | const document = |
| appliedSet | const | 911 | no | const appliedSet = new Set(applied); |
| view | const | 926 | no | const view = viewDocument(); |
| diagnostics | const | 933 | no | const diagnostics = Array.isArray(previewPayload.diagnostics) ? previewPayload.diagnostics : []; |
| destroy | function | 944 | no | function destroy() { |
| readFrame | function | 967 | no | function readFrame(message) { |
| nested | const | 969 | no | const nested = isObject(message.payload) ? message.payload : null; |
| kind | const | 970 | no | const kind = |
| frame | const | 979 | no | const frame = Object.assign({}, nested \|\| {}, message); |
| BILLBOARD_HEIGHT | const | 989 | no | const BILLBOARD_HEIGHT = 0.9; |
| halfExtentsFor | function | 991 | no | function halfExtentsFor(object) { |
| scale | const | 992 | no | const scale = object.transform &amp;&amp; isTransform(object.transform) ? object.transform.scale : { x: 1, y: 1, z: 1 }; |
| x | const | 993 | no | const x = Math.abs(scale.x) / 2; |
| y | const | 994 | no | const y = Math.abs(scale.y) / 2; |
| z | const | 995 | no | const z = Math.abs(scale.z) / 2; |
| buildScene | function | 1015 | no | function buildScene(document, resolved, accent) { |
| objects | const | 1016 | no | const objects = []; |
| inbound | const | 1017 | no | const inbound = new Map(); |
| flows | const | 1018 | no | const flows = isDocumentShaped(document) &amp;&amp; Array.isArray(document.dataFlows) ? document.dataFlows : []; |
| meta | const | 1027 | no | const meta = LAYER_META[object.layer] \|\| LAYER_META.content; |
| shape | const | 1028 | no | const shape = SHAPES.indexOf(object.shape) &gt;= 0 ? object.shape : &quot;box&quot;; |
| kind | const | 1029 | no | const kind = object.kind === &quot;dynamic&quot; ? &quot;dynamic&quot; : &quot;static&quot;; |
| tint | const | 1030 | no | const tint = readColorProp(object.props) \|\| meta.tint \|\| accent; |
| opacityProp | const | 1031 | no | const opacityProp = isObject(object.props) &amp;&amp; isFiniteNumber(object.props.opacity) ? object.props.opacity : null; |
| alpha | const | 1032 | no | const alpha = opacityProp === null ? meta.alpha : clamp(opacityProp, 0.04, 1); |
| half | const | 1033 | no | const half = halfExtentsFor({ shape: shape, transform: object.transform }); |
| radius | const | 1034 | no | const radius = Math.hypot(half.x, half.y, half.z); |
| values | const | 1036 | no | const values = isObject(resolved) &amp;&amp; isObject(resolved[object.id]) ? resolved[object.id] : null; |
| propName | const | 1037 | no | const propName = inbound.get(object.id); |
| value | variable | 1038 | no | let value = null; |
| keys | const | 1042 | no | const keys = Object.keys(values); |
| title | const | 1047 | no | const title = effectiveTitle(object); |
| byId | const | 1072 | no | const byId = new Map(objects.map((object) =&gt; [object.id, object])); |
| relationships | const | 1073 | no | const relationships = []; |
| rawRelationships | const | 1074 | no | const rawRelationships = isDocumentShaped(document) &amp;&amp; Array.isArray(document.relationships) ? document.relationships : []; |
| createCamera | function | 1094 | no | function createCamera() { |
| resetCamera | function | 1109 | no | function resetCamera(camera) { |
| cameraBasis | function | 1117 | no | function cameraBasis(camera) { |
| cp | const | 1118 | no | const cp = Math.cos(camera.pitch); |
| sp | const | 1119 | no | const sp = Math.sin(camera.pitch); |
| dir | const | 1120 | no | const dir = { x: cp * Math.sin(camera.yaw), y: sp, z: cp * Math.cos(camera.yaw) }; |
| eye | const | 1121 | no | const eye = { |
| forward | const | 1126 | no | const forward = { x: -dir.x, y: -dir.y, z: -dir.z }; |
| right | const | 1127 | no | const right = normalize(cross(forward, { x: 0, y: 1, z: 0 })); |
| up | const | 1128 | no | const up = cross(right, forward); |
| normalize | function | 1132 | no | function normalize(v) { |
| length | const | 1133 | no | const length = Math.hypot(v.x, v.y, v.z) \|\| 1; |
| cross | function | 1137 | no | function cross(a, b) { |
| dot | function | 1141 | no | function dot(a, b) { |
| stepCamera | function | 1145 | no | function stepCamera(camera, dt, reducedMotion) { |
| amount | const | 1146 | no | const amount = reducedMotion ? 1 : 1 - Math.exp(-dt * 11); |
| frameCamera | function | 1155 | no | function frameCamera(camera, scene) { |
| framing | const | 1162 | no | const framing = scene.objects.filter((object) =&gt; object.layer !== &quot;ground&quot; &amp;&amp; object.layer !== &quot;structure&quot;); |
| subjects | const | 1163 | no | const subjects = framing.length ? framing : scene.objects; |
| minX | variable | 1164 | no | let minX = Infinity, minY = Infinity, minZ = Infinity; |
| maxX | variable | 1165 | no | let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity; |
| centre | const | 1174 | no | const centre = { x: (minX + maxX) / 2, y: Math.max(0.6, (minY + maxY) / 2), z: (minZ + maxZ) / 2 }; |
| span | const | 1175 | no | const span = Math.max(maxX - minX, maxZ - minZ, maxY - minY, 4); |
| projectCameraPoint | function | 1181 | no | function projectCameraPoint(point, width, height, focal) { |
| toCameraSpace | function | 1186 | no | function toCameraSpace(basis, point) { |
| dx | const | 1187 | no | const dx = point.x - basis.eye.x; |
| dy | const | 1188 | no | const dy = point.y - basis.eye.y; |
| dz | const | 1189 | no | const dz = point.z - basis.eye.z; |
| projectPoint | function | 1197 | no | function projectPoint(basis, point, width, height, focal) { |
| projectSegment | function | 1201 | no | function projectSegment(basis, a, b, width, height, focal) { |
| ca | variable | 1202 | no | let ca = toCameraSpace(basis, a); |
| cb | variable | 1203 | no | let cb = toCameraSpace(basis, b); |
| t | const | 1206 | no | const t = (NEAR - ca.z) / (cb.z - ca.z); |
| t | const | 1209 | no | const t = (NEAR - cb.z) / (ca.z - cb.z); |
| pa | const | 1212 | no | const pa = projectCameraPoint(ca, width, height, focal); |
| pb | const | 1213 | no | const pb = projectCameraPoint(cb, width, height, focal); |
| screenRay | function | 1217 | no | function screenRay(basis, ndcX, ndcY, aspect) { |
| tan | const | 1218 | no | const tan = Math.tan(basis.fov / 2); |
| groundPointAt | function | 1226 | no | function groundPointAt(basis, ndcX, ndcY, aspect, planeY) { |
| dir | const | 1227 | no | const dir = screenRay(basis, ndcX, ndcY, aspect); |
| t | const | 1229 | no | const t = (planeY - basis.eye.y) / dir.y; |
| pickObject | function | 1235 | no | function pickObject(scene, basis, screenX, screenY, width, height, focal) { |
| best | variable | 1236 | no | let best = null; |
| projected | const | 1238 | no | const projected = projectPoint(basis, object.position, width, height, focal); |
| radiusPx | const | 1240 | no | const radiusPx = clamp((object.pickRadius * focal) / projected.z, 9, 220); |
| distance | const | 1241 | no | const distance = Math.hypot(projected.x - screenX, projected.y - screenY); |
| score | const | 1243 | no | const score = object.order * 10000 + distance; |
| gridSpacing | function | 1249 | no | function gridSpacing(distance) { |
| target | const | 1250 | no | const target = distance / 9; |
| power | const | 1251 | no | const power = Math.pow(10, Math.floor(Math.log10(Math.max(target, 0.01)))); |
| normalized | const | 1252 | no | const normalized = target / power; |
| step | const | 1253 | no | const step = normalized &lt; 1.5 ? 1 : normalized &lt; 3.5 ? 2 : 5; |
| gridLines | function | 1257 | no | function gridLines(camera) { |
| spacing | const | 1258 | no | const spacing = gridSpacing(camera.distance); |
| radius | const | 1259 | no | const radius = spacing * 30; |
| centreX | const | 1260 | no | const centreX = Math.round(camera.target.x / spacing) * spacing; |
| centreZ | const | 1261 | no | const centreZ = Math.round(camera.target.z / spacing) * spacing; |
| count | const | 1262 | no | const count = Math.floor(radius / spacing); |
| lines | const | 1263 | no | const lines = []; |
| offset | const | 1265 | no | const offset = i * spacing; |
| distance | const | 1266 | no | const distance = Math.abs(offset); |
| half | const | 1268 | no | const half = Math.sqrt(Math.max(0, radius * radius - distance * distance)); |
| fade | const | 1269 | no | const fade = Math.pow(1 - distance / radius, 1.4); |
| major | const | 1270 | no | const major = i % 5 === 0 ? 1.65 : 1; |
| alpha | const | 1271 | no | const alpha = clamp(0.3 * fade * major, 0, 0.42); |
| mat4Perspective | function | 1290 | no | function mat4Perspective(fov, aspect, near, far) { |
| f | const | 1291 | no | const f = 1 / Math.tan(fov / 2); |
| out | const | 1292 | no | const out = new Float32Array(16); |
| mat4LookAt | function | 1301 | no | function mat4LookAt(eye, target, up) { |
| z | const | 1302 | no | const z = normalize({ x: eye.x - target.x, y: eye.y - target.y, z: eye.z - target.z }); |
| x | const | 1303 | no | const x = normalize(cross(up, z)); |
| y | const | 1304 | no | const y = cross(z, x); |
| rotationRows | function | 1313 | no | function rotationRows(rotation) { |
| cx | const | 1314 | no | const cx = Math.cos(rotation.x), sx = Math.sin(rotation.x); |
| cy | const | 1315 | no | const cy = Math.cos(rotation.y), sy = Math.sin(rotation.y); |
| cz | const | 1316 | no | const cz = Math.cos(rotation.z), sz = Math.sin(rotation.z); |
| mat4FromTransform | function | 1324 | no | function mat4FromTransform(transform, overrideScale) { |
| scale | const | 1325 | no | const scale = overrideScale \|\| transform.scale; |
| r | const | 1326 | no | const r = rotationRows(transform.rotation); |
| out | const | 1327 | no | const out = new Float32Array(16); |
| mat4NormalFromTransform | function | 1344 | no | function mat4NormalFromTransform(transform) { |
| scale | const | 1345 | no | const scale = transform.scale; |
| r | const | 1346 | no | const r = rotationRows(transform.rotation); |
| out | const | 1347 | no | const out = new Float32Array(16); |
| mat4Billboard | function | 1361 | no | function mat4Billboard(centre, right, up, back, width, height) { |
| makeBoxMesh | function | 1374 | no | function makeBoxMesh() { |
| faces | const | 1375 | no | const faces = [ |
| positions | const | 1383 | no | const positions = []; |
| normals | const | 1384 | no | const normals = []; |
| indices | const | 1385 | no | const indices = []; |
| base | const | 1391 | no | const base = index * 4; |
| makeSphereMesh | function | 1397 | no | function makeSphereMesh(rings, segments) { |
| positions | const | 1398 | no | const positions = []; |
| normals | const | 1399 | no | const normals = []; |
| indices | const | 1400 | no | const indices = []; |
| phi | const | 1402 | no | const phi = (r / rings) * Math.PI; |
| y | const | 1403 | no | const y = Math.cos(phi) * 0.5; |
| radius | const | 1404 | no | const radius = Math.sin(phi) * 0.5; |
| theta | const | 1406 | no | const theta = (s / segments) * Math.PI * 2; |
| x | const | 1407 | no | const x = Math.cos(theta) * radius; |
| z | const | 1408 | no | const z = Math.sin(theta) * radius; |
| a | const | 1415 | no | const a = r * (segments + 1) + s; |
| b | const | 1416 | no | const b = a + segments + 1; |
| makeCylinderMesh | function | 1423 | no | function makeCylinderMesh(segments) { |
| positions | const | 1424 | no | const positions = []; |
| normals | const | 1425 | no | const normals = []; |
| indices | const | 1426 | no | const indices = []; |
| theta | const | 1428 | no | const theta = (s / segments) * Math.PI * 2; |
| x | const | 1429 | no | const x = Math.cos(theta) * 0.5; |
| z | const | 1430 | no | const z = Math.sin(theta) * 0.5; |
| a | const | 1435 | no | const a = s * 2; |
| centreIndex | const | 1439 | no | const centreIndex = positions.length / 3; |
| ringStart | const | 1442 | no | const ringStart = positions.length / 3; |
| theta | const | 1444 | no | const theta = (s / segments) * Math.PI * 2; |
| makePlaneMesh | function | 1456 | no | function makePlaneMesh() { |
| MESH_VS | const | 1468 | no | const MESH_VS = `#version 300 es |
| MESH_FS | const | 1484 | no | const MESH_FS = `#version 300 es |
| LINE_VS | const | 1504 | no | const LINE_VS = `#version 300 es |
| LINE_FS | const | 1515 | no | const LINE_FS = `#version 300 es |
| SPRITE_VS | const | 1524 | no | const SPRITE_VS = `#version 300 es |
| SPRITE_FS | const | 1536 | no | const SPRITE_FS = `#version 300 es |
| compileShader | function | 1547 | no | function compileShader(gl, type, source) { |
| shader | const | 1548 | no | const shader = gl.createShader(type); |
| log | const | 1553 | no | const log = gl.getShaderInfoLog(shader) \|\| &quot;shader compile failed&quot;; |
| createProgram | function | 1560 | no | function createProgram(gl, vertexSource, fragmentSource) { |
| vertex | const | 1561 | no | const vertex = compileShader(gl, gl.VERTEX_SHADER, vertexSource); |
| fragment | const | 1562 | no | const fragment = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource); |
| program | const | 1563 | no | const program = gl.createProgram(); |
| log | const | 1571 | no | const log = gl.getProgramInfoLog(program) \|\| &quot;program link failed&quot;; |
| uploadMesh | function | 1578 | no | function uploadMesh(gl, data) { |
| vao | const | 1579 | no | const vao = gl.createVertexArray(); |
| positions | const | 1580 | no | const positions = gl.createBuffer(); |
| normals | const | 1581 | no | const normals = gl.createBuffer(); |
| indices | const | 1582 | no | const indices = gl.createBuffer(); |
| createLineBuffer | function | 1598 | no | function createLineBuffer(gl) { |
| vao | const | 1599 | no | const vao = gl.createVertexArray(); |
| buffer | const | 1600 | no | const buffer = gl.createBuffer(); |
| uploadLines | function | 1611 | no | function uploadLines(gl, target, floats) { |
| createSpriteQuad | function | 1621 | no | function createSpriteQuad(gl) { |
| vao | const | 1622 | no | const vao = gl.createVertexArray(); |
| buffer | const | 1623 | no | const buffer = gl.createBuffer(); |
| createLabelTexture | function | 1647 | no | function createLabelTexture(text, accent, dynamic) { |
| measure | const | 1648 | no | const measure = createLabelTexture.canvas \|\| (createLabelTexture.canvas = document.createElement(&quot;canvas&quot;)); |
| context | const | 1649 | no | const context = measure.getContext(&quot;2d&quot;); |
| font | const | 1650 | no | const font = &#39;600 44px &#39; + MONO; |
| label | variable | 1652 | no | let label = text.length &gt; 42 ? text.slice(0, 41) + &quot;\\u2026&quot; : text; |
| width | variable | 1653 | no | let width = context.measureText(label).width; |
| pad | const | 1658 | no | const pad = 30; |
| height | const | 1661 | no | const height = measure.height; |
| ctx | const | 1662 | no | const ctx = measure.getContext(&quot;2d&quot;); |
| roundRect | function | 1678 | no | function roundRect(ctx, x, y, width, height, radius) { |
| r | const | 1679 | no | const r = Math.min(radius, width / 2, height / 2); |
| createWebglBackend | function | 1693 | no | function createWebglBackend(canvas) { |
| gl | const | 1694 | no | const gl = canvas.getContext(&quot;webgl2&quot;, { alpha: false, antialias: true, depth: true, powerPreference: &quot;low-power&quot;, |
| meshProgram | const | 1702 | no | const meshProgram = createProgram(gl, MESH_VS, MESH_FS); |
| lineProgram | const | 1703 | no | const lineProgram = createProgram(gl, LINE_VS, LINE_FS); |
| spriteProgram | const | 1704 | no | const spriteProgram = createProgram(gl, SPRITE_VS, SPRITE_FS); |
| meshes | const | 1706 | no | const meshes = { |
| spriteQuad | const | 1712 | no | const spriteQuad = createSpriteQuad(gl); |
| sceneLinesSteel | const | 1713 | no | const sceneLinesSteel = createLineBuffer(gl); |
| sceneLinesAccent | const | 1714 | no | const sceneLinesAccent = createLineBuffer(gl); |
| selectionLines | const | 1715 | no | const selectionLines = createLineBuffer(gl); |
| gridBuffer | const | 1716 | no | const gridBuffer = createLineBuffer(gl); |
| textures | const | 1717 | no | const textures = new Map(); |
| uniforms | const | 1719 | no | const uniforms = { |
| scene | variable | 1744 | no | let scene = null; |
| sceneReady | variable | 1745 | no | let sceneReady = false; |
| selectionId | variable | 1746 | no | let selectionId = null; |
| selectionDirty | variable | 1747 | no | let selectionDirty = true; |
| pushSegment | function | 1749 | no | function pushSegment(array, a, b, alpha) { |
| buildSceneLines | function | 1753 | no | function buildSceneLines() { |
| steel | const | 1754 | no | const steel = []; |
| accent | const | 1755 | no | const accent = []; |
| to | const | 1763 | no | const to = scene.byId.get(rel.to); |
| a | const | 1765 | no | const a = from.position; |
| b | const | 1766 | no | const b = to.position; |
| buildSelectionLines | function | 1785 | no | function buildSelectionLines() { |
| floats | const | 1786 | no | const floats = []; |
| object | const | 1788 | no | const object = scene.byId.get(selectionId); |
| SHAPE_DRAW | const | 1795 | no | const SHAPE_DRAW = { |
| draw | function | 1802 | no | function draw(frame) { |
| aspect | const | 1804 | no | const aspect = Math.max(width, 1) / Math.max(height, 1); |
| proj | const | 1805 | no | const proj = mat4Perspective(basis.fov, aspect, 0.1, 900); |
| view | const | 1806 | no | const view = mat4LookAt(basis.eye, camera.target, { x: 0, y: 1, z: 0 }); |
| grid | const | 1839 | no | const grid = gridLines(camera); |
| gridFloats | const | 1840 | no | const gridFloats = []; |
| line | const | 1842 | no | const line = grid.lines[i]; |
| rim | const | 1854 | no | const rim = hexToRgb(frame.accent \|\| DEFAULT_ACCENT).map((channel) =&gt; channel * 0.5); |
| layers | const | 1859 | no | const layers = []; |
| target | const | 1861 | no | const target = SHAPE_DRAW[object.shape]; |
| currentOrder | variable | 1865 | no | let currentOrder = -1; |
| entry | const | 1873 | no | const entry = SHAPE_DRAW[object.shape]; |
| transform | const | 1874 | no | const transform = { |
| model | const | 1881 | no | const model = mat4FromTransform(transform, override); |
| normalMatrix | const | 1882 | no | const normalMatrix = mat4NormalFromTransform(transform); |
| labels | const | 1897 | no | const labels = []; |
| object | const | 1921 | no | const object = entry.object; |
| text | const | 1922 | no | const text = entry.text; |
| key | const | 1923 | no | const key = (object.isDynamic ? text + &quot;\|&quot; + frame.accent + &quot;\|d&quot; : text + &quot;\|0\|s&quot;) + (entry.small ? &quot;\|s&quot; : &quot;&quot;); |
| texture | variable | 1924 | no | let texture = textures.get(key); |
| oldestKey | const | 1927 | no | const oldestKey = textures.keys().next().value; |
| oldest | const | 1928 | no | const oldest = textures.get(oldestKey); |
| label | const | 1932 | no | const label = createLabelTexture(text, frame.accent \|\| DEFAULT_ACCENT, object.isDynamic); |
| handle | const | 1933 | no | const handle = gl.createTexture(); |
| height | const | 1943 | no | const height = entry.height; |
| width | const | 1944 | no | const width = height * texture.aspect; |
| model | const | 1945 | no | const model = mat4Billboard(entry.centre, basis.right, basis.up, basis.forward, width, height); |
| dashLine | function | 1989 | no | function dashLine(array, a, b, alpha, duration, gap) { |
| length | const | 1990 | no | const length = Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z); |
| dx | const | 1992 | no | const dx = (b.x - a.x) / length; |
| dy | const | 1993 | no | const dy = (b.y - a.y) / length; |
| dz | const | 1994 | no | const dz = (b.z - a.z) / length; |
| travelled | variable | 1995 | no | let travelled = 0; |
| to | const | 1999 | no | const to = { x: a.x + dx * end, y: a.y + dy * end, z: a.z + dz * end }; |
| arrowHead | function | 2005 | no | function arrowHead(array, from, to, alpha) { |
| dir | const | 2006 | no | const dir = normalize({ x: to.x - from.x, y: to.y - from.y, z: to.z - from.z }); |
| side | const | 2007 | no | const side = normalize(cross(dir, { x: 0, y: 1, z: 0 })); |
| size | const | 2013 | no | const size = 0.32; |
| tip | const | 2014 | no | const tip = to; |
| base | const | 2015 | no | const base = { x: to.x - dir.x * size, y: to.y - dir.y * size, z: to.z - dir.z * size }; |
| left | const | 2016 | no | const left = { x: base.x + side.x * size * 0.55, y: base.y + side.y * size * 0.55, z: base.z + side.z * size * 0.55 }; |
| right | const | 2017 | no | const right = { x: base.x - side.x * size * 0.55, y: base.y - side.y * size * 0.55, z: base.z - side.z * size * 0.55 }; |
| appendBox | function | 2022 | no | function appendBox(array, object, alpha, cornersOnly) { |
| half | const | 2023 | no | const half = object.half; |
| p | const | 2024 | no | const p = object.position; |
| x0 | const | 2025 | no | const x0 = p.x - half.x, x1 = p.x + half.x; |
| y0 | const | 2026 | no | const y0 = p.y - half.y, y1 = p.y + half.y; |
| z0 | const | 2027 | no | const z0 = p.z - half.z, z1 = p.z + half.z; |
| corners | const | 2028 | no | const corners = [ |
| edges | const | 2032 | no | const edges = [ |
| to | const | 2040 | no | const to = corners[b]; |
| size | const | 2045 | no | const size = Math.min(half.x, half.y, half.z, 0.18) * 1.6 + 0.06; |
| to | const | 2048 | no | const to = corners[b]; |
| dx | const | 2049 | no | const dx = Math.sign(to.x - from.x) * Math.min(size, Math.abs(to.x - from.x)); |
| dy | const | 2050 | no | const dy = Math.sign(to.y - from.y) * Math.min(size, Math.abs(to.y - from.y)); |
| dz | const | 2051 | no | const dz = Math.sign(to.z - from.z) * Math.min(size, Math.abs(to.z - from.z)); |
| rgba | function | 2062 | no | function rgba(rgb, alpha) { |
| objectCorners | function | 2066 | no | function objectCorners(object) { |
| r | const | 2067 | no | const r = rotationRows(object.rotation); |
| h | const | 2068 | no | const h = object.half; |
| local | const | 2069 | no | const local = [ |
| BOX_FACES | const | 2080 | no | const BOX_FACES = [ |
| rotateLocal | function | 2089 | no | function rotateLocal(object, vector) { |
| r | const | 2090 | no | const r = rotationRows(object.rotation); |
| createCanvasBackend | function | 2098 | no | function createCanvasBackend(canvas) { |
| ctx | const | 2099 | no | const ctx = canvas.getContext(&quot;2d&quot;, { alpha: false }); |
| LIGHT | const | 2101 | no | const LIGHT = normalize({ x: 0.42, y: 0.86, z: 0.32 }); |
| strokeSegment | function | 2103 | no | function strokeSegment(basis, a, b, color, alpha, lineWidth, width, height, focal, dash) { |
| projected | const | 2104 | no | const projected = projectSegment(basis, a, b, width, height, focal); |
| drawGrid | function | 2118 | no | function drawGrid(basis, camera, width, height, focal, accent) { |
| grid | const | 2119 | no | const grid = gridLines(camera); |
| originA | const | 2123 | no | const originA = projectSegment(basis, { x: -1.4, y: 0.004, z: 0 }, { x: 1.4, y: 0.004, z: 0 }, width, height, focal); |
| originB | const | 2124 | no | const originB = projectSegment(basis, { x: 0, y: 0.004, z: -1.4 }, { x: 0, y: 0.004, z: 1.4 }, width, height, focal); |
| drawBox | function | 2138 | no | function drawBox(basis, object, width, height, focal) { |
| corners | const | 2139 | no | const corners = objectCorners(object); |
| projected | const | 2140 | no | const projected = corners.map((corner) =&gt; projectPoint(basis, corner, width, height, focal)); |
| faces | const | 2142 | no | const faces = []; |
| a | const | 2144 | no | const a = corners[face.indices[0]]; |
| b | const | 2145 | no | const b = corners[face.indices[1]]; |
| c | const | 2146 | no | const c = corners[face.indices[2]]; |
| centre | const | 2147 | no | const centre = { |
| normal | variable | 2152 | no | let normal = rotateLocal(object, face.normal); |
| towardEye | const | 2153 | no | const towardEye = { x: basis.eye.x - centre.x, y: basis.eye.y - centre.y, z: basis.eye.z - centre.z }; |
| depth | const | 2155 | no | const depth = toCameraSpace(basis, centre).z; |
| shade | const | 2156 | no | const shade = clamp(0.3 + 0.74 * Math.max(0, dot(normal, LIGHT)), 0.22, 1.05); |
| point | const | 2163 | no | const point = projected[index]; |
| rgb | const | 2168 | no | const rgb = [object.colorRgb[0] * entry.shade, object.colorRgb[1] * entry.shade, object.colorRgb[2] * entry.shade]; |
| drawSphere | function | 2177 | no | function drawSphere(basis, object, width, height, focal) { |
| centre | const | 2178 | no | const centre = projectPoint(basis, object.position, width, height, focal); |
| radius | const | 2180 | no | const radius = (object.half.x * focal) / centre.z; |
| drawCylinder | function | 2195 | no | function drawCylinder(basis, object, width, height, focal) { |
| upLocal | const | 2196 | no | const upLocal = { x: 0, y: object.half.y, z: 0 }; |
| upWorld | const | 2197 | no | const upWorld = rotateLocal(object, [upLocal.x, upLocal.y, upLocal.z]); |
| top | const | 2198 | no | const top = projectPoint(basis, { x: object.position.x + upWorld.x, y: object.position.y + upWorld.y, z: object.position.z + upWorld.z }, width, height, focal); |
| bottom | const | 2199 | no | const bottom = projectPoint(basis, { x: object.position.x - upWorld.x, y: object.position.y - upWorld.y, z: object.position.z - upWorld.z }, width, height, focal); |
| radius | const | 2201 | no | const radius = (object.half.x * focal) / ((top.z + bottom.z) / 2); |
| drawPlane | function | 2224 | no | function drawPlane(basis, object, width, height, focal) { |
| h | const | 2225 | no | const h = object.half; |
| local | const | 2226 | no | const local = [ |
| points | const | 2229 | no | const points = local.map((point) =&gt; { const rotated = rotateLocal(object, point); return projectPoint(basis, { x: object.position.x + rotated.x, y: object.position.y + rotated.y, z: object.position.z… |
| rotated | const | 2230 | no | const rotated = rotateLocal(object, point); |
| t | const | 2248 | no | const t = step / 4; |
| left | const | 2249 | no | const left = lerpPoint(points[0], points[3], t); |
| right | const | 2250 | no | const right = lerpPoint(points[1], points[2], t); |
| back | const | 2251 | no | const back = lerpPoint(points[0], points[1], t); |
| front | const | 2252 | no | const front = lerpPoint(points[3], points[2], t); |
| drawLabelPlate | function | 2263 | no | function drawLabelPlate(basis, object, frame, width, height, focal) { |
| centre | const | 2264 | no | const centre = projectPoint(basis, object.position, width, height, focal); |
| worldHeight | const | 2266 | no | const worldHeight = Math.max(0.35, Math.abs(object.scale.y) * BILLBOARD_HEIGHT); |
| projectedHeight | const | 2267 | no | const projectedHeight = (worldHeight * focal) / centre.z; |
| text | const | 2269 | no | const text = object.valueText !== null ? object.label + &quot; &quot; + object.valueText : object.label; |
| fontSize | const | 2270 | no | const fontSize = clamp(projectedHeight * 0.46, 9, 30); |
| textWidth | const | 2273 | no | const textWidth = ctx.measureText(text).width; |
| padding | const | 2274 | no | const padding = fontSize * 0.65; |
| plateWidth | const | 2275 | no | const plateWidth = Math.min(Math.max(textWidth + padding * 2, projectedHeight * 1.5), width * 0.6); |
| plateHeight | const | 2276 | no | const plateHeight = fontSize * 1.9; |
| x | const | 2277 | no | const x = centre.x - plateWidth / 2; |
| y | const | 2278 | no | const y = centre.y - plateHeight / 2; |
| drawValueChip | function | 2294 | no | function drawValueChip(basis, object, width, height, focal, accent) { |
| centre | const | 2296 | no | const centre = projectPoint(basis, object.position, width, height, focal); |
| radius | const | 2298 | no | const radius = (object.pickRadius * focal) / centre.z; |
| text | const | 2299 | no | const text = object.valueText; |
| textWidth | const | 2302 | no | const textWidth = ctx.measureText(text).width; |
| x | const | 2303 | no | const x = centre.x - textWidth / 2; |
| y | const | 2304 | no | const y = centre.y + clamp(radius, 8, 260) + 10; |
| drawSelection | function | 2317 | no | function drawSelection(basis, object, width, height, focal, accent) { |
| corners | const | 2318 | no | const corners = objectCorners(object); |
| minX | variable | 2319 | no | let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity; |
| point | const | 2321 | no | const point = projectPoint(basis, corner, width, height, focal); |
| pad | const | 2329 | no | const pad = 5; |
| tick | const | 2341 | no | const tick = Math.min(12, (maxX - minX) / 3, (maxY - minY) / 3); |
| cornersScreen | const | 2342 | no | const cornersScreen = [ |
| label | const | 2353 | no | const label = (LAYER_META[object.layer] ? LAYER_META[object.layer].label : object.layer) + &quot; \\u00b7 &quot; + (SHAPE_LABEL[object.shape] \|\| object.shape); |
| labelWidth | const | 2355 | no | const labelWidth = ctx.measureText(label).width; |
| draw | function | 2364 | no | function draw(frame) { |
| focal | const | 2366 | no | const focal = height / 2 / Math.tan(basis.fov / 2); |
| scale | const | 2370 | no | const scale = canvas.width / Math.max(width, 1); |
| to | const | 2377 | no | const to = frame.scene.byId.get(rel.to); |
| corners | const | 2380 | no | const corners = objectCorners(to); |
| projected | const | 2381 | no | const projected = corners.map((corner) =&gt; projectPoint(basis, corner, width, height, focal)); |
| projectedObjects | const | 2403 | no | const projectedObjects = []; |
| cameraSpace | const | 2405 | no | const cameraSpace = toCameraSpace(basis, object.position); |
| object | const | 2412 | no | const object = entry.object; |
| selected | const | 2439 | no | const selected = frame.scene.byId.get(selectedId); |
| lerpPoint | function | 2454 | no | function lerpPoint(a, b, t) { |
| probeWebgl | function | 2462 | no | function probeWebgl() { |
| probe | const | 2465 | no | const probe = document.createElement(&quot;canvas&quot;); |
| gl | const | 2466 | no | const gl = probe.getContext(&quot;webgl2&quot;, { alpha: false, antialias: false }); |
| mesh | const | 2468 | no | const mesh = createProgram(gl, MESH_VS, MESH_FS); |
| line | const | 2469 | no | const line = createProgram(gl, LINE_VS, LINE_FS); |
| sprite | const | 2470 | no | const sprite = createProgram(gl, SPRITE_VS, SPRITE_FS); |
| lose | const | 2474 | no | const lose = gl.getExtension(&quot;WEBGL_lose_context&quot;); |
| createStage | function | 2489 | no | function createStage(canvas, options = {}) { |
| handlers | const | 2490 | no | const handlers = { |
| camera | const | 2497 | no | const camera = createCamera(); |
| scene | variable | 2498 | no | let scene = buildScene(null, null, DEFAULT_ACCENT); |
| accent | variable | 2499 | no | let accent = DEFAULT_ACCENT; |
| documentRef | variable | 2500 | no | let documentRef = null; |
| resolvedRef | variable | 2501 | no | let resolvedRef = null; |
| selectedId | variable | 2502 | no | let selectedId = null; |
| active | variable | 2503 | no | let active = false; |
| destroyed | variable | 2504 | no | let destroyed = false; |
| width | variable | 2505 | no | let width = 1; |
| height | variable | 2506 | no | let height = 1; |
| dpr | variable | 2507 | no | let dpr = 1; |
| raf | variable | 2508 | no | let raf = 0; |
| lastFrame | variable | 2509 | no | let lastFrame = 0; |
| motionQuery | const | 2511 | no | const motionQuery = typeof window.matchMedia === &quot;function&quot; ? window.matchMedia(&quot;(prefers-reduced-motion: reduce)&quot;) : null; |
| reducedMotion | variable | 2512 | no | let reducedMotion = !!(motionQuery &amp;&amp; motionQuery.matches); |
| onMotionChange | function | 2513 | no | const onMotionChange = function () { |
| backend | variable | 2520 | no | let backend = null; |
| backendKind | variable | 2521 | no | let backendKind = &quot;canvas2d&quot;; |
| pointers | const | 2540 | no | const pointers = new Map(); |
| gesture | variable | 2541 | no | let gesture = null; |
| applySize | function | 2543 | no | function applySize() { |
| rect | const | 2545 | no | const rect = canvas.getBoundingClientRect(); |
| backingWidth | const | 2549 | no | const backingWidth = Math.max(1, Math.round(width * dpr)); |
| backingHeight | const | 2550 | no | const backingHeight = Math.max(1, Math.round(height * dpr)); |
| drawNow | function | 2558 | no | function drawNow() { |
| dt | const | 2577 | no | const dt = lastFrame ? Math.min(0.1, (now - lastFrame) / 1000) : 0.016; |
| setActive | function | 2584 | no | function setActive(flag) { |
| setDocument | function | 2596 | no | function setDocument(nextDocument, nextResolved, nextAccent) { |
| nextAccentColor | const | 2597 | no | const nextAccentColor = |
| previous | const | 2600 | no | const previous = documentRef; |
| worldChanged | const | 2601 | no | const worldChanged = |
| setSelection | function | 2614 | no | function setSelection(objectId) { |
| next | const | 2615 | no | const next = typeof objectId === &quot;string&quot; &amp;&amp; objectId ? objectId : null; |
| viewCentre | function | 2621 | no | function viewCentre() { |
| orbitCamera | function | 2625 | no | function orbitCamera(dx, dy) { |
| panCamera | function | 2630 | no | function panCamera(dx, dy) { |
| basis | const | 2631 | no | const basis = cameraBasis(camera); |
| groundForward | const | 2632 | no | const groundForward = normalize({ x: basis.forward.x, y: 0, z: basis.forward.z }); |
| speed | const | 2633 | no | const speed = camera.distance * 0.0019; |
| localPoint | function | 2638 | no | function localPoint(event) { |
| rect | const | 2639 | no | const rect = canvas.getBoundingClientRect(); |
| ndcFrom | function | 2648 | no | function ndcFrom(point) { |
| hitAt | function | 2652 | no | function hitAt(point) { |
| basis | const | 2653 | no | const basis = cameraBasis(camera); |
| focal | const | 2654 | no | const focal = point.height / 2 / Math.tan(basis.fov / 2); |
| onPointerDown | function | 2658 | no | function onPointerDown(event) { |
| values | const | 2668 | no | const values = Array.from(pointers.values()); |
| point | const | 2682 | no | const point = localPoint(event); |
| object | const | 2683 | no | const object = hitAt(point); |
| basis | const | 2686 | no | const basis = cameraBasis(camera); |
| ndc | const | 2687 | no | const ndc = ndcFrom(point); |
| ground | const | 2688 | no | const ground = groundPointAt(basis, ndc.x, ndc.y, point.width / point.height, object.position.y); |
| onPointerMove | function | 2708 | no | function onPointerMove(event) { |
| values | const | 2713 | no | const values = Array.from(pointers.values()); |
| distance | const | 2714 | no | const distance = Math.hypot(values[0].x - values[1].x, values[0].y - values[1].y); |
| midX | const | 2715 | no | const midX = (values[0].x + values[1].x) / 2; |
| midY | const | 2716 | no | const midY = (values[0].y + values[1].y) / 2; |
| dx | const | 2729 | no | const dx = event.clientX - gesture.lastX; |
| dy | const | 2730 | no | const dy = event.clientY - gesture.lastY; |
| point | const | 2745 | no | const point = localPoint(event); |
| ndc | const | 2746 | no | const ndc = ndcFrom(point); |
| basis | const | 2747 | no | const basis = cameraBasis(camera); |
| ground | const | 2748 | no | const ground = groundPointAt(basis, ndc.x, ndc.y, point.width / point.height, gesture.y); |
| position | const | 2750 | no | const position = { |
| target | const | 2759 | no | const target = scene.byId.get(gesture.id); |
| endPointer | function | 2768 | no | function endPointer(event) { |
| remaining | const | 2776 | no | const remaining = Array.from(pointers.values())[0]; |
| onWheel | function | 2781 | no | function onWheel(event) { |
| nudgeSelection | function | 2786 | no | function nudgeSelection(key, fine) { |
| object | const | 2787 | no | const object = scene.byId.get(selectedId); |
| step | const | 2789 | no | const step = fine ? 0.25 : 1; |
| basis | const | 2790 | no | const basis = cameraBasis(camera); |
| forward | const | 2791 | no | const forward = normalize({ x: basis.forward.x, y: 0, z: basis.forward.z }); |
| position | const | 2792 | no | const position = copyVec3(object.position); |
| onKeyDown | function | 2815 | no | function onKeyDown(event) { |
| key | const | 2817 | no | const key = event.key; |
| basis | const | 2846 | no | const basis = cameraBasis(camera); |
| focal | const | 2847 | no | const focal = height / 2 / Math.tan(basis.fov / 2); |
| object | const | 2848 | no | const object = pickObject(scene, basis, width / 2, height / 2, width, height, focal); |
| hadSelection | const | 2852 | no | const hadSelection = Boolean(selectedId); |
| onContextMenu | function | 2858 | no | function onContextMenu(event) { |
| observer | const | 2870 | no | const observer = |
| fillSelect | function | 2924 | no | function fillSelect(select, entries, value) { |
| option | const | 2927 | no | const option = document.createElement(&quot;option&quot;); |
| setFieldValue | function | 2935 | no | function setFieldValue(input, value) { |
| text | const | 2937 | no | const text = String(value); |
| clearNode | function | 2941 | no | function clearNode(node) { |
| element | function | 2945 | no | function element(tag, className, text) { |
| node | const | 2946 | no | const node = document.createElement(tag); |
| defaultScale | function | 2952 | no | function defaultScale(shape) { |
| buildObject | function | 2969 | no | function buildObject(layer, kind, shape, title, centre) { |
| scale | const | 2970 | no | const scale = defaultScale(shape); |
| restingY | const | 2971 | no | const restingY = shape === &quot;plane&quot; ? 0 : shape === &quot;billboard&quot; \|\| shape === &quot;text&quot; ? 1.4 : scale.y / 2; |
| createStudio | function | 2994 | no | function createStudio(root, deps) { |
| client | const | 2995 | no | const client = deps.client; |
| stage | const | 2996 | no | const stage = deps.stage; |
| onWorldChange | const | 2997 | no | const onWorldChange = deps.onWorldChange; |
| a11yList | const | 2998 | no | const a11yList = deps.a11yList; |
| a11ySummary | const | 2999 | no | const a11ySummary = deps.a11ySummary; |
| el | const | 3001 | no | const el = { |
| lastView | variable | 3042 | no | let lastView = null; |
| lastSelectedId | variable | 3043 | no | let lastSelectedId = null; |
| lastWorldSignature | variable | 3044 | no | let lastWorldSignature = &quot;&quot;; |
| worldsSignature | variable | 3045 | no | let worldsSignature = &quot;&quot;; |
| collapsed | variable | 3046 | no | let collapsed = false; |
| say | function | 3048 | no | function say(text) { |
| queue | function | 3052 | no | function queue(op) { |
| result | const | 3053 | no | const result = client.queueOperation(op); |
| setCollapsed | function | 3058 | no | function setCollapsed(next) { |
| label | const | 3063 | no | const label = el.collapse.querySelector(&quot;.studio__collapse-label&quot;); |
| renderWorlds | function | 3067 | no | function renderWorlds(state) { |
| signature | const | 3068 | no | const signature = state.worlds |
| id | const | 3070 | no | const id = typeof world.id === &quot;string&quot; ? world.id : typeof world.worldId === &quot;string&quot; ? world.worldId : &quot;&quot;; |
| currentId | const | 3076 | no | const currentId = state.view &amp;&amp; state.view.world ? state.view.world.id : &quot;&quot;; |
| id | const | 3079 | no | const id = typeof world.id === &quot;string&quot; ? world.id : typeof world.worldId === &quot;string&quot; ? world.worldId : &quot;&quot;; |
| option | const | 3081 | no | const option = document.createElement(&quot;option&quot;); |
| objectCount | const | 3090 | no | const objectCount = state.view.objects.length; |
| renderObjects | function | 3103 | no | function renderObjects(state) { |
| view | const | 3109 | no | const view = state.view; |
| grouped | const | 3116 | no | const grouped = new Map(LAYERS.map((layer) =&gt; [layer, []])); |
| total | variable | 3120 | no | let total = 0; |
| items | const | 3122 | no | const items = grouped.get(layer); |
| group | const | 3125 | no | const group = element(&quot;div&quot;, &quot;studio__layer&quot;); |
| head | const | 3127 | no | const head = element(&quot;div&quot;, &quot;studio__layer-head&quot;); |
| list | const | 3132 | no | const list = element(&quot;ul&quot;, &quot;studio__list&quot;); |
| item | const | 3134 | no | const item = document.createElement(&quot;li&quot;); |
| button | const | 3135 | no | const button = document.createElement(&quot;button&quot;); |
| title | const | 3140 | no | const title = effectiveTitle(object); |
| shape | const | 3141 | no | const shape = SHAPE_LABEL[object.shape] \|\| object.shape; |
| value | const | 3142 | no | const value = state.resolved &amp;&amp; state.resolved[object.id] ? state.resolved[object.id] : null; |
| valueText | variable | 3143 | no | let valueText = &quot;&quot;; |
| keys | const | 3145 | no | const keys = Object.keys(value); |
| glyph | const | 3153 | no | const glyph = element(&quot;span&quot;, &quot;studio__glyph&quot;); |
| name | const | 3156 | no | const name = element(&quot;span&quot;, &quot;studio__object-name&quot;, title); |
| meta | const | 3157 | no | const meta = element(&quot;span&quot;, &quot;studio__object-meta&quot;, shape + (object.kind === &quot;dynamic&quot; ? &quot; \\u00b7 live&quot; : &quot;&quot;)); |
| body | const | 3158 | no | const body = element(&quot;span&quot;, &quot;studio__object-body&quot;); |
| syncInspector | function | 3174 | no | function syncInspector(state) { |
| object | const | 3175 | no | const object = state.selected; |
| rotation | const | 3188 | no | const rotation = object.transform.rotation; |
| scale | const | 3189 | no | const scale = object.transform.scale; |
| resolved | const | 3198 | no | const resolved = state.resolved &amp;&amp; state.resolved[object.id] ? state.resolved[object.id] : null; |
| row | const | 3201 | no | const row = element(&quot;li&quot;, &quot;studio__value&quot;); |
| flows | const | 3211 | no | const flows = state.view &amp;&amp; Array.isArray(state.view.dataFlows) |
| row | const | 3216 | no | const row = element(&quot;li&quot;, &quot;studio__value&quot;); |
| inbound | const | 3225 | no | const inbound = flows.filter((flow) =&gt; flow.direction === &quot;inbound&quot;); |
| warning | variable | 3226 | no | let warning = &quot;&quot;; |
| renderOps | function | 3236 | no | function renderOps(state) { |
| documentView | const | 3241 | no | const documentView = state.view \|\| state.document; |
| item | const | 3243 | no | const item = document.createElement(&quot;li&quot;); |
| renderA11y | function | 3251 | no | function renderA11y(state) { |
| view | const | 3254 | no | const view = state.view; |
| layers | const | 3259 | no | const layers = new Set(view.objects.map((object) =&gt; object.layer)); |
| list | const | 3268 | no | const list = document.createElement(&quot;ul&quot;); |
| item | const | 3271 | no | const item = document.createElement(&quot;li&quot;); |
| button | const | 3272 | no | const button = document.createElement(&quot;button&quot;); |
| title | const | 3276 | no | const title = effectiveTitle(object); |
| detail | const | 3278 | no | const detail = document.createElement(&quot;span&quot;); |
| render | function | 3290 | no | function render(state) { |
| revision | const | 3291 | no | const revision = state.view ? state.revision : 0; |
| button | const | 3336 | no | const button = event.target.closest(&quot;[data-object-id]&quot;); |
| button | const | 3343 | no | const button = event.target.closest(&quot;[data-object-id]&quot;); |
| state | const | 3350 | no | const state = client.getState(); |
| object | const | 3351 | no | const object = state.selected; |
| value | const | 3353 | no | const value = el.title.value.trim(); |
| object | const | 3363 | no | const object = client.getState().selected; |
| object | const | 3369 | no | const object = client.getState().selected; |
| commitPosition | function | 3374 | no | function commitPosition() { |
| state | const | 3375 | no | const state = client.getState(); |
| object | const | 3376 | no | const object = state.selected; |
| next | const | 3378 | no | const next = { x: Number(el.x.value), y: Number(el.y.value), z: Number(el.z.value) }; |
| current | const | 3384 | no | const current = object.transform.position; |
| object | const | 3403 | no | const object = client.getState().selected; |
| layer | const | 3413 | no | const layer = el.addLayer.value; |
| kind | const | 3414 | no | const kind = el.addKind.value; |
| shape | const | 3415 | no | const shape = el.addShape.value; |
| title | const | 3416 | no | const title = el.addTitle.value.trim() \|\| SHAPE_LABEL[shape] \|\| &quot;Object&quot;; |
| object | const | 3417 | no | const object = buildObject(layer, kind, shape, title, stage.viewCentre()); |
| result | const | 3434 | no | const result = await client.publish(); |
| suffix | const | 3436 | no | const suffix = Number.isInteger(result.currentRevision) ? &quot; Current revision &quot; + result.currentRevision + &quot;.&quot; : &quot;&quot;; |
| warnings | const | 3440 | no | const warnings = result.diagnostics.filter((diagnostic) =&gt; diagnostic &amp;&amp; diagnostic.severity !== &quot;info&quot;); |
| normalizeWorld | function | 3459 | no | function normalizeWorld(world) { |
| id | const | 3461 | no | const id = typeof world.id === &quot;string&quot; ? world.id : typeof world.worldId === &quot;string&quot; ? world.worldId : null; |
| resolveValues | function | 3473 | no | function resolveValues(document, projection) { |
| resolved | const | 3474 | no | const resolved = {}; |
| flows | const | 3476 | no | const flows = Array.isArray(document.dataFlows) ? document.dataFlows : []; |
| value | const | 3481 | no | const value = projection[flow.path]; |
| emptySurface | function | 3489 | no | function emptySurface() { |
| createWorldSurface | function | 3512 | yes | export function createWorldSurface(options = {}) { |
| settings | const | 3514 | no | const settings = isObject(options) ? options : {}; |
| byId | function | 3515 | no | const byId = function (id) { |
| surface | const | 3519 | no | const surface = settings.surface \|\| byId(&quot;world&quot;); |
| mount | const | 3520 | no | const mount = settings.mount \|\| byId(&quot;world-mount&quot;); |
| canvas | const | 3521 | no | const canvas = settings.canvas \|\| byId(&quot;world-canvas&quot;); |
| studioRoot | const | 3522 | no | const studioRoot = settings.studio \|\| byId(&quot;studio&quot;); |
| toggleButton | const | 3523 | no | const toggleButton = settings.toggle \|\| byId(&quot;btn-world&quot;); |
| noticeNode | const | 3524 | no | const noticeNode = byId(&quot;world-notice&quot;); |
| a11yList | const | 3525 | no | const a11yList = byId(&quot;world-a11y-list&quot;); |
| a11ySummary | const | 3526 | no | const a11ySummary = byId(&quot;world-a11y-summary&quot;); |
| chipTitle | const | 3527 | no | const chipTitle = byId(&quot;world-title&quot;); |
| chipRev | const | 3528 | no | const chipRev = byId(&quot;world-rev&quot;); |
| chipState | const | 3529 | no | const chipState = byId(&quot;world-state&quot;); |
| pendingDot | const | 3530 | no | const pendingDot = byId(&quot;world-pending-dot&quot;); |
| closeButton | const | 3531 | no | const closeButton = byId(&quot;world-close&quot;); |
| http | const | 3535 | no | const http = createHttp({ fetch: settings.fetch }); |
| app | const | 3536 | no | const app = document.querySelector(&quot;.app&quot;); |
| isOpen | variable | 3537 | no | let isOpen = false; |
| currentWorldId | variable | 3538 | no | let currentWorldId = null; |
| worlds | variable | 3539 | no | let worlds = []; |
| pollTimer | variable | 3540 | no | let pollTimer = 0; |
| refreshToken | variable | 3541 | no | let refreshToken = 0; |
| backendNotice | variable | 3542 | no | let backendNotice = &quot;&quot;; |
| serviceNotice | variable | 3543 | no | let serviceNotice = &quot;&quot;; |
| destroyed | variable | 3544 | no | let destroyed = false; |
| renderNotice | function | 3546 | no | function renderNotice() { |
| text | const | 3548 | no | const text = serviceNotice \|\| backendNotice; |
| setNotice | function | 3554 | no | function setNotice(text) { |
| client | const | 3559 | no | const client = createWorldClient({ actorId: settings.actorId \|\| &quot;studio&quot;, baseUrl: settings.baseUrl \|\| &quot;&quot;, fetch: settings.fetch, commandIdFactory: settings.commandIdFactory, |
| response | const | 3565 | no | const response = await http.get(&quot;/api/ui/worlds/&quot; + encodeURIComponent(worldId)); |
| body | const | 3567 | no | const body = isObject(response.body) ? response.body : {}; |
| stage | const | 3575 | no | const stage = createStage(canvas, { onSelect: function (objectId) { client.select(objectId); }, onCommit: function (objectId, position) { |
| state | const | 3580 | no | const state = client.getState(); |
| object | const | 3581 | no | const object = state.view ? findObject(state.view, objectId) : null; |
| studio | const | 3609 | no | const studio = createStudio(studioRoot, { client: client, stage: stage, onWorldChange: function (worldId) { if (worldId &amp;&amp; worldId !== currentWorldId) loadWorld(worldId); |
| render | function | 3619 | no | function render(nextState) { |
| view | const | 3620 | no | const view = nextState.view; |
| world | const | 3621 | no | const world = view &amp;&amp; isObject(view.world) ? view.world : null; |
| accent | const | 3622 | no | const accent = world &amp;&amp; typeof world.accent === &quot;string&quot; ? world.accent : DEFAULT_ACCENT; |
| loadState | function | 3639 | no | async function loadState() { |
| response | const | 3640 | no | const response = await http.get(&quot;/api/ui/state&quot;); |
| body | const | 3642 | no | const body = isObject(response.body) ? response.body : {}; |
| projection | const | 3643 | no | const projection = isObject(body.projection) ? body.projection : {}; |
| current | const | 3644 | no | const current = client.getState(); |
| loadWorld | function | 3648 | no | async function loadWorld(worldId) { |
| token | const | 3649 | no | const token = ++refreshToken; |
| response | const | 3650 | no | const response = await http.get(&quot;/api/ui/worlds/&quot; + encodeURIComponent(worldId)); |
| body | const | 3657 | no | const body = isObject(response.body) ? response.body : {}; |
| refresh | function | 3670 | no | async function refresh() { |
| token | const | 3672 | no | const token = ++refreshToken; |
| response | const | 3673 | no | const response = await http.get(&quot;/api/ui/worlds&quot;); |
| raw | const | 3679 | no | const raw = pickWorlds(response.body) \|\| []; |
| params | const | 3687 | no | const params = new URLSearchParams(window.location.search); |
| requested | const | 3688 | no | const requested = params.get(&quot;world&quot;); |
| home | const | 3689 | no | const home = worlds.find((world) =&gt; world.kind === &quot;home&quot;) \|\| worlds[0]; |
| wanted | const | 3690 | no | const wanted = worlds.some((world) =&gt; world.id === requested) ? requested : home.id; |
| startPolling | function | 3697 | no | function startPolling() { |
| stopPolling | function | 3704 | no | function stopPolling() { |
| open | function | 3709 | no | function open() { |
| close | function | 3725 | no | function close() { |
| toggleOpen | function | 3737 | no | function toggleOpen() { |
| applyServerMessage | function | 3742 | no | function applyServerMessage(message) { |
| result | const | 3743 | no | const result = client.applyServerMessage(message); |
| state | const | 3745 | no | const state = client.getState(); |
| worldId | const | 3746 | no | const worldId = state.document &amp;&amp; state.document.world ? state.document.world.id : currentWorldId; |
| onToggleClick | function | 3753 | no | function onToggleClick() { |
| onCloseClick | function | 3757 | no | function onCloseClick() { |
| onWindowKeyDown | function | 3761 | no | function onWindowKeyDown(event) { |
| active | const | 3763 | no | const active = document.activeElement; |
| tag | const | 3764 | no | const tag = active &amp;&amp; active.tagName ? active.tagName : &quot;&quot;; |
| params | const | 3776 | no | const params = new URLSearchParams(window.location.search); |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [packages/tierflow/tests/world-client.test.ts](../tests/world-client.test.ts.md) | ../web/world.js |
| [packages/tierflow/web/app.js](./app.js.md) | ./world.js |

## Annotations

_No annotations._

## Excerpt

```javascript
/**
 * The world surface.
 *
 * A world is data: five ordered layers, placed objects, typed relationships and
 * data flows. This module renders that data as an infinite 3D canvas and hosts
 * the studio that edits it.
 *
 * Three parts, in dependency order:
 *
 * 1. `createWorldClient` — transport-neutral. It holds the applied document,
 *    the pending semantic operations and the publish sequence. It never touches
 *    the DOM, so it is imported directly by the test suite.
 * 2. The renderer — WebGL2 when the browser provides it, a Canvas2D painter's
 *    algorithm otherwise. Both backends consume the same scene description.
 * 3. The studio and the surface boot — plain DOM, no framework, no build step.
 *
 * The module evaluates no downloaded code and has no dependencies.
 */

const LAYERS = Object.freeze(["ground", "structure", "content", "data", "overlay"]);
const SHAPES = Object.freeze(["box", "sphere", "cylinder", "plane", "text", "billboard"]);
const KINDS = Object.freeze(["static", "dynamic"]);
const RELATIONSHIP_KINDS = Object.freeze(["contains", "links", "drives", "mirrors"]);

const DEFAULT_ACCENT = "#ff9d3d";
const BG = "#07080a";
const NEAR = 0.08;

/** Presentation of each canonical layer. `order` is the real render order. */
const LAYER_META = Object.freeze({
  ground: { label: "Ground", order: 0, tint: "#3a424e", alpha: 0.55 },
  structure: { label: "Structure", order: 1, tint: "#7f8fa3", alpha: 0.92 },
  content: { label: "Content", order: 2, tint: "#c3cbd6", alpha: 1 },
  data: { label: "Data", order: 3, tint: null, alpha: 1 },
  overlay: { label: "Overlay", order: 4, tint: "#eef1f5", alpha: 1 },
});

const SHAPE_LABEL = Object.freeze({
  box: "Box",
  sphere: "Sphere",
  cylinder: "Cylinder",
  plane: "Plane",
  text: "Text",
  billboard: "Billboard",
});

const OPERATION_LABEL = Object.freeze({
  "object.add": "Add",
  "object.remove": "Remove",
  "object.move": "Move",
  "object.setProp": "Set property",
  "object.setLayer": "Set layer",
  "object.setKind": "Set kind",
  "relationship.add": "Add relationship",
  "relationship.remove": "Remove relationship",
  "dataFlow.add": "Bind data",
  "dataFlow.remove": "Unbind data",
  "world.setTitle": "Rename world",
});

const MONO = 'ui-monospace, "Cascadia Mono", "Cascadia Code", "SF Mono", Menlo, Consolas, monospace';

const OPERATION_NAMES = Object.freeze([
  "object.add",
  "object.remove",
  "object.move",
  "object.setProp",
  "object.setLayer",
  "object.setKind",
  "relationship.add",
  "relationship.remove",
  "dataFlow.add",
  "dataFlow.remove",
  "world.setTitle",
]);

/* ------------------------------------------------------------------ */
/* Small shared helpers                                                */
/* ------------------------------------------------------------------ */
```

_First 80 of 3804 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
