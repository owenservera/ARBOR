# File: studio/src/mcp/runtime.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/mcp/runtime.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 10223 B |
| Lines | 219 |
| Hash | d4decb8bf887 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| previewRecord | function | 12 | no | function previewRecord(record) { |
| out | const | 13 | no | const out = { seq: record.seq, t: record.t, k: record.k, sid: record.sid }; |
| previewEvent | function | 23 | no | function previewEvent(event) { |
| out | const | 24 | no | const out = { ...event }; |
| cap | function | 25 | no | const cap = (value) =&gt; (typeof value === &#39;string&#39; &amp;&amp; value.length &gt; 4000 ? `${value.slice(0, 4000)}… [truncated]` : value); |
| createRuntime | function | 31 | yes | export function createRuntime({ env = process.env } = {}) { |
| paths | const | 32 | no | const paths = ensureDataDirs(dataPaths(defaultDataDir(env))); |
| profileStore | const | 34 | no | const profileStore = new ProfileStore(paths.profiles); |
| familyStore | const | 35 | no | const familyStore = new FamilyStore(paths.families); |
| learner | const | 36 | no | const learner = new ScopedLearner(paths.learner); |
| recorder | const | 37 | no | const recorder = new Recorder({ sessionsDir: paths.sessions, profileStore, familyStore, port: settings.cdpPort, learner, }); |
| deriving | const | 40 | no | const deriving = new Set(); |
| replayCache | const | 41 | no | const replayCache = new Map(); |
| hub | variable | 42 | no | let hub; |
| deriveSession | function | 43 | no | async function deriveSession(session, profileName) { |
| profile | const | 51 | no | const profile = profileName |
| result | const | 54 | no | const result = await derive(session, profile, { families: familyStore, learner }); |
| captureResponse | function | 78 | no | function captureResponse() { |
| text | const | 97 | no | const text = Buffer.isBuffer(chunk) ? chunk.toString(&#39;utf8&#39;) : String(chunk ?? &#39;&#39;); |
| split | variable | 99 | no | let split; |
| frame | const | 101 | no | const frame = this._sse.slice(0, split); |
| event | variable | 104 | no | let event = &#39;message&#39;, data = &#39;&#39;; |
| text | const | 117 | no | const text = Buffer.isBuffer(chunk) ? chunk.toString(&#39;utf8&#39;) : String(chunk); |
| callRoute | function | 129 | yes | export async function callRoute(hub, method, pathname, body = {}) { |
| res | const | 130 | no | const res = captureResponse(); |
| req | const | 131 | no | const req = { method, headers: {} }; |
| url | const | 132 | no | const url = new URL(pathname, &#39;http://127.0.0.1&#39;); |
| parseBody | function | 137 | no | function parseBody(res) { |
| listTools | function | 143 | yes | export async function listTools(runtime) { |
| res | const | 144 | no | const res = await callRoute(runtime.hub, &#39;GET&#39;, &#39;/api/v1/integrations/tools&#39;); |
| parsed | const | 145 | no | const parsed = parseBody(res); |
| schema | const | 150 | no | const schema = tool.inputSchema &amp;&amp; tool.inputSchema.type === &#39;object&#39; |
| protocolArgumentError | function | 162 | no | function protocolArgumentError(res, parsed) { |
| message | const | 163 | no | const message = parsed.json ? String(parsed.value?.error ?? &#39;&#39;) : &#39;&#39;; |
| code | const | 164 | no | const code = parsed.json ? parsed.value?.code : undefined; |
| toolError | function | 170 | no | function toolError(res, parsed) { |
| payload | const | 171 | no | const payload = parsed.json |
| sseError | const | 174 | no | const sseError = [...res.sseEvents].reverse().find((event) =&gt; event.event === &#39;error&#39;); |
| body | const | 175 | no | const body = sseError &amp;&amp; payload.error === &#39;Tool failed&#39; ? sseError.data : payload; |
| structured | const | 176 | no | const structured = body &amp;&amp; typeof body === &#39;object&#39; ? body : { error: String(body) }; |
| callTool | function | 184 | yes | export async function callTool(runtime, name, args) { |
| res | const | 188 | no | const res = await callRoute(runtime.hub, &#39;POST&#39;, &#39;/api/v1/integrations/tools/call&#39;, { name, arguments: args }); |
| parsed | const | 189 | no | const parsed = parseBody(res); |
| argumentError | const | 190 | no | const argumentError = protocolArgumentError(res, parsed); |
| sseError | const | 196 | no | const sseError = [...res.sseEvents].reverse().find((event) =&gt; event.event === &#39;error&#39;); |
| text | const | 197 | no | const text = parsed.value.content.find((item) =&gt; item?.type === &#39;text&#39;)?.text; |
| result | const | 199 | no | const result = { |
| complete | const | 209 | no | const complete = [...res.sseEvents].reverse().find((event) =&gt; event.event === &#39;complete&#39;); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ../replay/derive.mjs | import | 2 | [studio/src/replay/derive.mjs](../replay/derive.mjs.md) |
| ../capture/recorder.mjs | import | 3 | [studio/src/capture/recorder.mjs](../capture/recorder.mjs.md) |
| ../profiles/profiles.mjs | import | 4 | [studio/src/profiles/profiles.mjs](../profiles/profiles.mjs.md) |
| ../families/families.mjs | import | 5 | [studio/src/families/families.mjs](../families/families.mjs.md) |
| ../intel/learn.mjs | import | 6 | [studio/src/intel/learn.mjs](../intel/learn.mjs.md) |
| ../config.mjs | import | 7 | [studio/src/config.mjs](../config.mjs.md) |
| ../studio/http.mjs | import | 8 | [studio/src/studio/http.mjs](../studio/http.mjs.md) |
| ../studio/integration-hub.mjs | import | 9 | [studio/src/studio/integration-hub.mjs](../studio/integration-hub.mjs.md) |
| ./jsonrpc.mjs | import | 10 | [studio/src/mcp/jsonrpc.mjs](./jsonrpc.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/src/mcp/server-stdio.mjs](./server-stdio.mjs.md) | ./runtime.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// In-process integration hub. Optional derive-all and mirror modules stay unloaded until a tool calls them.
import { derive } from '../replay/derive.mjs';
import { Recorder } from '../capture/recorder.mjs';
import { ProfileStore } from '../profiles/profiles.mjs';
import { FamilyStore } from '../families/families.mjs';
import { ScopedLearner } from '../intel/learn.mjs';
import { dataPaths, defaultDataDir, ensureDataDirs, resolveSettings } from '../config.mjs';
import { problem, storageName } from '../studio/http.mjs';
import { createIntegrationHub } from '../studio/integration-hub.mjs';
import { ErrorCode, RpcError } from './jsonrpc.mjs';

function previewRecord(record) {
  const out = { seq: record.seq, t: record.t, k: record.k, sid: record.sid };
  for (const key of ['n', 'url', 'method', 'status', 'mime', 'policy', 'kind', 'event', 'reason']) {
    if (record[key] !== undefined) out[key] = record[key];
  }
  if (record.error || record.errorText) out.error = record.error ?? record.errorText;
  if (record.redactions) out.redactions = record.redactions.length;
  if (record.droppedRecords) out.droppedRecords = record.droppedRecords;
  return out;
}

function previewEvent(event) {
  const out = { ...event };
  const cap = (value) => (typeof value === 'string' && value.length > 4000 ? `${value.slice(0, 4000)}… [truncated]` : value);
  out.data = cap(out.data);
  out.text = cap(out.text);
  return out;
}

export function createRuntime({ env = process.env } = {}) {
  const paths = ensureDataDirs(dataPaths(defaultDataDir(env)));
  const { settings } = resolveSettings({ configFile: paths.config, env });
  const profileStore = new ProfileStore(paths.profiles);
  const familyStore = new FamilyStore(paths.families);
  const learner = new ScopedLearner(paths.learner);
  const recorder = new Recorder({
    sessionsDir: paths.sessions, profileStore, familyStore, port: settings.cdpPort, learner,
  });
  const deriving = new Set();
  const replayCache = new Map();
  let hub;
  async function deriveSession(session, profileName) {
    if (deriving.has(session.id)) throw problem(409, 'Session derivation is already running', 'DERIVATION_BUSY');
    if (['recording', 'stopping'].includes(recorder.state) && recorder.session?.id === session.id) {
      throw problem(409, 'Stop capture before deriving this session', 'SESSION_ACTIVE');
    }
    deriving.add(session.id);
    replayCache.delete(session.id);
    try {
      const profile = profileName
        ? profileStore.load(storageName(profileName, 'profile'))
        : session.kv.get('PROFILE_SNAPSHOT') ?? profileStore.load(session.meta.profile?.name ?? 'generic');
      const result = await derive(session, profile, { families: familyStore, learner });
      hub.publish('session.derived', {
        id: session.id, records: result.records, knowledge: result.knowledge,
        recordCounts: result.recordCounts, familyCounts: result.familyCounts,
      }, session.id);
      return result;
    } finally { deriving.delete(session.id); }
  }
  hub = createIntegrationHub({
    paths, profileStore, learner, recorder, deriveSession,
    previewRecord, previewEvent,
    getPort: () => settings.studioPort,
    cdpPort: settings.cdpPort,
    deriving,
    invalidateReplay: (id) => replayCache.delete(id),
  });
  return {
    paths,
    hub,
    close() { return hub.close(); },
  };
}

// Minimal response the hub's HTTP adapter can write without opening a socket.
function captureResponse() {
  return {
    statusCode: 200,
```

_First 80 of 220 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
