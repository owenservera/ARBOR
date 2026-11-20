# File: studio/ui-preview/preview-fixture.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | studio/ui-preview/preview-fixture.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 8755 B |
| Lines | 140 |
| Hash | 53a568b850b6 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| CID | const | 3 | no | const CID = &#39;c-&#39; + &#39;a&#39;.repeat(40); |
| CID2 | const | 4 | no | const CID2 = &#39;c-&#39; + &#39;b&#39;.repeat(40); |
| PID | const | 5 | no | const PID = &#39;p-11111111-1111-4111-8111-111111111111&#39;; |
| NID | const | 6 | no | const NID = &#39;n-22222222-2222-4222-8222-222222222222&#39;; |
| OID | const | 7 | no | const OID = &#39;o-33333333-3333-4333-8333-333333333333&#39;; |
| NOW | const | 8 | no | const NOW = &#39;2026-10-28T00:00:00.000Z&#39;; |
| identity | const | 9 | no | const identity = { nativeThreadId: null, accountId: null, state: &#39;unknown&#39;, accountHint: &#39;preview data only&#39; }; |
| source | const | 10 | no | const source = { kind: &#39;preview-fixture&#39;, sessionId: &#39;preview-only&#39;, providerUrl: null }; |
| coverage | const | 11 | no | const coverage = { state: &#39;partial&#39;, fullNativeThread: &#39;unknown&#39;, richContent: &#39;as-recorded&#39;, acceptance: &#39;not-assessed&#39; }; |
| conversations | const | 12 | no | const conversations = [ |
| makeMessage | function | 16 | no | const makeMessage = (id, index, role, text, blocks = []) =&gt; ({ id: id + &#39;:turn:&#39; + index, role, text, blocks, redactions: 0, truncated: false, source: { kind: &#39;preview-fixture&#39;, sessionId: &#39;preview-o… |
| details | const | 20 | no | const details = { |
| projects | const | 36 | no | const projects = [ |
| notes | const | 40 | no | const notes = [ |
| objects | const | 44 | no | const objects = [{ id: OID, kind: &#39;source-reference&#39;, objectType: &#39;conversation&#39;, |
| collections | const | 46 | no | const collections = { conversations, projects, notes, objects, selections: [] }; |
| page | function | 47 | no | const page = (items) =&gt; ({ items, total: items.length, offset: 0, limit: 50, nextOffset: null }); |
| json | function | 48 | no | const json = (code, value) =&gt; new Response(JSON.stringify(value), { status: code, headers: { &#39;content-type&#39;: &#39;application/json; charset=utf-8&#39;, &#39;cache-control&#39;: &#39;no-store&#39; }, }); |
| recordById | function | 51 | no | const recordById = (collection, id) =&gt; collection.find(x =&gt; x.id === id) ?? null; |
| previewResponse | function | 53 | yes | export function previewResponse(path, method = &#39;GET&#39;) { |
| pathname | const | 67 | no | const pathname = path.split(&#39;?&#39;)[0]; |
| base | const | 70 | no | const base = &#39;/api/v1/world/&#39; + kind; |
| id | const | 73 | no | const id = decodeURIComponent(pathname.slice(base.length + 1)); |
| args | const | 79 | no | const args = new URLSearchParams(path.split(&#39;?&#39;)[1] ?? &#39;&#39;); |
| q | const | 80 | no | const q = (args.get(&#39;q&#39;) ?? &#39;&#39;).toLocaleLowerCase(); |
| kind | const | 81 | no | const kind = args.get(&#39;kind&#39;) ?? &#39;&#39;; |
| records | const | 82 | no | const records = [ |
| actualFetch | const | 111 | no | const actualFetch = globalThis.fetch.bind(globalThis); |
| raw | const | 113 | no | const raw = typeof input === &#39;string&#39; ? input : input?.url; |
| url | const | 114 | no | const url = new URL(String(raw), location.href); |
| method | const | 116 | no | const method = String(options.method \|\| input?.method \|\| &#39;GET&#39;).toUpperCase(); |
| target | const | 130 | no | const target = event.target?.closest?.( &#39;#btnConnect, #btnSend, #btnSendAgain, #btnRead, #btnReadMore, #btnFinish, #worldCreate, #worldSave&#39; ); |
| message | const | 136 | no | const message = &#39;UI preview only — this action requires your local VIVIM Harness. No data or provider request was sent.&#39;; |
| notice | const | 137 | no | const notice = document.getElementById(&#39;vivimWelcomeStatus&#39;) ?? document.getElementById(&#39;announce&#39;); |

## Imports

_No imports._

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
/* VIVIM UI PREVIEW ONLY — synthetic records, no provider accounts, no real browser/CDP.
   Every /api/v1 request is intercepted. Mutations always fail closed. */
const CID = 'c-' + 'a'.repeat(40);
const CID2 = 'c-' + 'b'.repeat(40);
const PID = 'p-11111111-1111-4111-8111-111111111111';
const NID = 'n-22222222-2222-4222-8222-222222222222';
const OID = 'o-33333333-3333-4333-8333-333333333333';
const NOW = '2026-10-28T00:00:00.000Z';
const identity = { nativeThreadId: null, accountId: null, state: 'unknown', accountHint: 'preview data only' };
const source = { kind: 'preview-fixture', sessionId: 'preview-only', providerUrl: null };
const coverage = { state: 'partial', fullNativeThread: 'unknown', richContent: 'as-recorded', acceptance: 'not-assessed' };
const conversations = [
  { id: CID, title: 'DEMO · VIVIM integration plan', status: 'complete', sessionId: 'preview-only', identity, source, createdAt: NOW },
  { id: CID2, title: 'DEMO · Native AI research', status: 'complete', sessionId: 'preview-only', identity, source, createdAt: NOW },
];
const makeMessage = (id, index, role, text, blocks = []) => ({
  id: id + ':turn:' + index, role, text, blocks, redactions: 0, truncated: false,
  source: { kind: 'preview-fixture', sessionId: 'preview-only', key: 'PREVIEW_FIXTURE', index },
});
const details = {
  [CID]: { ...conversations[0], messages: [
    makeMessage(CID, 0, 'user', 'Describe a local-first personal AI world.'),
    makeMessage(CID, 1, 'assistant', 'VIVIM brings your saved AI conversations, local projects, notes, and knowledge relationships together. This text is demonstration data, not a provider reply.', [
      { type: 'heading', level: 2, text: 'Your AI, your world' },
      { type: 'paragraph', text: 'Keep the source evidence, explicit identity and local organization together.' },
    ]),
  ], coverage },
  [CID2]: { ...conversations[1], messages: [
    makeMessage(CID2, 0, 'user', 'How would you preserve code, tables and unknown content?'),
    makeMessage(CID2, 1, 'assistant', 'Render recorded parts without modifying the original evidence. The preview includes a synthetic code block and a synthetic table.', [
      { type: 'code', language: 'js', text: "const vivim = { data: 'local', owner: 'you' };" },
      { type: 'table', rows: [['Type', 'Handling'], ['Code', 'Preserve text'], ['Unknown', 'Keep inert']] },
    ]),
  ], coverage },
};
const projects = [
  { id: PID, kind: 'project', title: 'DEMO · VIVIM Integration', conversationIds: [CID, CID2],
    noteIds: [NID], memberIds: [OID], version: 1, savedAt: NOW },
];
const notes = [
  { id: NID, kind: 'note', title: 'DEMO · Product UX', body: 'A calm dark interface, focused navigation, source-aware AI conversations and local-first trust.',
    commentsOn: [], version: 1, savedAt: NOW },
];
const objects = [{ id: OID, kind: 'source-reference', objectType: 'conversation',
  title: 'DEMO · Source reference', conversationId: CID, source, availability: 'locally-available', version: 1 }];
const collections = { conversations, projects, notes, objects, selections: [] };
const page = (items) => ({ items, total: items.length, offset: 0, limit: 50, nextOffset: null });
const json = (code, value) => new Response(JSON.stringify(value), {
  status: code, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
});
const recordById = (collection, id) => collection.find(x => x.id === id) ?? null;

export function previewResponse(path, method = 'GET') {
  if (typeof path !== 'string' || !path.startsWith('/api/v1/')) return null;
  // Preview is a read-only gallery — even harmless-looking REST POSTs are refused.
  if (method !== 'GET') return json(405, { code: 'PREVIEW_READ_ONLY',
    error: 'This frontend preview is read-only. No provider actions or local writes are available.' });
  if (path === '/api/v1/conversation-targets') return json(200, {
    sites: [
      { id: 'chatgpt', url: 'https://chatgpt.com' },
      { id: 'claude', url: 'https://claude.ai' },
      { id: 'gemini', url: 'https://gemini.google.com' },
    ],
    targets: [],
  });
  if (path === '/api/v1/conversations') return json(200, { conversations: [] });
  const pathname = path.split('?')[0];
  if (pathname === '/api/v1/world/namespace') return json(200, { id: 'w-preview', kind: 'namespace', schema: 'vivim.world/1' });
  for (const [kind, records] of Object.entries(collections)) {
    const base = '/api/v1/world/' + kind;
    if (pathname === base) return json(200, page(records));
    if (pathname.startsWith(base + '/')) {
      const id = decodeURIComponent(pathname.slice(base.length + 1));
      const record = kind === 'conversations' ? details[id] : recordById(records, id);
      return record ? json(200, record) : json(404, { code: 'WORLD_NOT_FOUND', error: 'Demo record missing' });
    }
  }
  if (pathname === '/api/v1/world/search') {
    const args = new URLSearchParams(path.split('?')[1] ?? '');
    const q = (args.get('q') ?? '').toLocaleLowerCase();
```

_First 80 of 141 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
