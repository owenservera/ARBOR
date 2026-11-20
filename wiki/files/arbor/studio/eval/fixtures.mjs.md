# File: studio/eval/fixtures.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | studio/eval/fixtures.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 18172 B |
| Lines | 204 |
| Hash | 90c0387af484 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| rng | function | 7 | yes | export function rng(seed) { let a = seed &gt;&gt;&gt; 0; return () =&gt; { a = (a + 0x6D2B79F5) \| 0; let t = Math.imul(a ^ (a &gt;&gt;&gt; 15), 1 \| a); t = (t + Math.imul(t ^ (t &gt;&gt;&gt; 7), 61 \| t)) ^ t; return ((t ^ (t &gt;&gt;&gt; … |
| hex | function | 8 | no | const hex = (r, n) =&gt; Array.from({ length: n }, () =&gt; Math.floor(r() * 16).toString(16)).join(&#39;&#39;); |
| uuid | function | 9 | no | const uuid = (r) =&gt; `${hex(r, 8)}-${hex(r, 4)}-4${hex(r, 3)}-a${hex(r, 3)}-${hex(r, 12)}`; |
| pick | function | 10 | no | const pick = (r, a) =&gt; a[Math.floor(r() * a.length)]; |
| WORDS | const | 11 | no | const WORDS = &#39;data model capture stream entity record field value table chart page user team plan review update report signal layer shape graph event state change system local agent browser profile&#39;… |
| sentence | function | 12 | no | const sentence = (r, n) =&gt; Array.from({ length: n }, () =&gt; pick(r, WORDS)).join(&#39; &#39;); |
| S | function | 13 | no | const S = (group, value, extra = {}) =&gt; ({ value, source: { kind: &#39;event&#39;, group, endpoint: group.split(&#39; :: &#39;)[0], ...extra } }); |
| chatPathOps | function | 16 | no | function chatPathOps() { |
| r | const | 17 | no | const r = rng(11); const convs = [uuid(r), uuid(r)]; const samples = []; const patchGroups = new Set([&#39;POST host/backend/conversation :: (object)&#39;]); |
| msgs | const | 18 | no | const msgs = []; |
| id | const | 20 | no | const id = uuid(r), cid = convs[i % 2], text = sentence(r, 30); |
| doc | const | 21 | no | const doc = { message: { id, author: { role: &#39;assistant&#39; }, create_time: 1792500000 + i * 60, content: { content_type: &#39;text&#39;, parts: [text] }, status: &#39;finished_successfully&#39; }, conversation_id: cid… |
| elements | const | 28 | no | const elements = msgs.map((m, i) =&gt; ({ id: `el-${i}`, text: `Assistant said: ${m.text} Copy Share`, firstT: 1000 + i * 1000, lastT: 1400 + i * 1000 })); |
| dashboardTicks | function | 46 | no | function dashboardTicks() { |
| r | const | 47 | no | const r = rng(22); const syms = [&#39;AAA&#39;, &#39;BBB&#39;, &#39;CCC&#39;, &#39;DDD&#39;, &#39;EEE&#39;]; const samples = []; |
| feedPages | function | 55 | no | function feedPages() { |
| r | const | 56 | no | const r = rng(33); const samples = []; const all = []; |
| workspaceMixed | function | 66 | no | function workspaceMixed() { |
| r | const | 67 | no | const r = rng(101); const samples = []; const patchGroups = new Set([&#39;POST app/api/assist :: message_start&#39;, &#39;POST app/api/assist :: content_block_delta&#39;]); |
| conv | const | 68 | no | const conv = uuid(r); |
| msgs | const | 69 | no | const msgs = []; |
| text | const | 71 | no | const text = sentence(r, 28); |
| doc | const | 72 | no | const doc = { message: { id: `msg_${hex(r, 20)}`, role: &#39;assistant&#39;, model: &#39;model-x&#39;, stop_reason: &#39;end_turn&#39;, conversation_uuid: conv }, blocks: { 0: { type: &#39;text&#39;, text } } }; |
| regions | const | 77 | no | const regions = [&#39;north&#39;, &#39;south&#39;, &#39;east&#39;, &#39;west&#39;]; |
| blocks | function | 79 | no | const blocks = () =&gt; [{ kind: &#39;p&#39;, text: sentence(r, 20) }, { kind: &#39;img&#39;, src: `/media/${hex(r, 6)}.png`, alt: sentence(r, 3) }, { kind: &#39;code&#39;, lang: &#39;sql&#39;, code: &#39;select * from t&#39; }, { kind: &#39;p&#39;, … |
| services | const | 81 | no | const services = [&#39;api&#39;, &#39;db&#39;, &#39;cache&#39;]; |
| elements | const | 83 | no | const elements = [ |
| dynamicSchema | function | 105 | no | function dynamicSchema() { |
| r | const | 106 | no | const r = rng(202); const v1 = [], v2 = []; |
| nestedHetero | function | 112 | no | function nestedHetero() { |
| r | const | 113 | no | const r = rng(303); const nodes = []; let k = 0; |
| nid | function | 114 | no | const nid = () =&gt; `n${++k}-${hex(r, 4)}`; |
| comments | const | 121 | no | const comments = Array.from({ length: 6 }, (_, i) =&gt; ({ cid: `c-${hex(r, 8)}`, node_ref: nodes[i * 2].nid, author: pick(r, [&#39;ana&#39;, &#39;ben&#39;]), body: sentence(r, 15), created: `2026-10-0${i + 1}T09:00:00… |
| samples | const | 122 | no | const samples = [S(&#39;GET docs/api/page :: (object)&#39;, { page: { id: `pg-${hex(r, 8)}`, nodes }, comments }, { seq: 1 })]; |
| multiPageWorkflow | function | 136 | no | function multiPageWorkflow() { |
| r | const | 137 | no | const r = rng(404); const samples = []; const steps = [&#39;details&#39;, &#39;documents&#39;, &#39;review&#39;].map((l, i) =&gt; ({ step_id: `st_${hex(r, 6)}`, label: l, order: i + 1 })); |
| app | const | 138 | no | const app = `APP-${Math.floor(r() * 90000) + 10000}`; |
| twoSitesSameEntities | function | 153 | no | function twoSitesSameEntities() { |
| r | const | 154 | no | const r = rng(505); |
| users | const | 155 | no | const users = Array.from({ length: 4 }, (_, i) =&gt; ({ id: 100 + i, full_name: `User ${pick(r, WORDS)} ${i}`, email: `u${i}@example.org` })); |
| tasks | const | 156 | no | const tasks = Array.from({ length: 12 }, (_, i) =&gt; ({ id: 1000 + i, title: `Task ${sentence(r, 4)}`, due_date: `2026-11-${String(1 + i).padStart(2, &#39;0&#39;)}`, assignee_id: users[i % 4].id, project_id: 7… |
| a | const | 157 | no | const a = [S(&#39;GET a.example/api/tasks :: [array]&#39;, tasks, { seq: 1 }), S(&#39;GET a.example/api/users :: [array]&#39;, users, { seq: 2 })]; |
| owners | const | 158 | no | const owners = Array.from({ length: 3 }, (_, i) =&gt; ({ uuid: uuid(r), displayName: `Owner ${i}` })); |
| edges | const | 159 | no | const edges = Array.from({ length: 12 }, (_, i) =&gt; ({ node: { uuid: uuid(r), name: `Item ${sentence(r, 4)}`, dueAt: `2026-12-${String(1 + i).padStart(2, &#39;0&#39;)}T00:00:00Z`, completed: i % 4 === 0, owne… |
| b | const | 160 | no | const b = [S(&#39;POST b.example/graphql :: (object)&#39;, { data: { tasks: { edges, pageInfo: { hasNextPage: false, endCursor: hex(r, 12) } } } }, { seq: 1 })]; |
| unknownFormat | function | 171 | no | function unknownFormat() { |
| r | const | 172 | no | const r = rng(606); const samples = []; const orders = []; |
| seq | variable | 174 | no | let seq = 0; |
| frame | const | 176 | no | const frame = n % 4 === 3 ? `HB\|${1792500000 + n}` : `EVT\|order.updated\|${JSON.stringify({ order_ref: orders[n % 6], status: pick(r, [&#39;new&#39;, &#39;paid&#39;, &#39;shipped&#39;]), total: +(r() * 300).toFixed(2), items… |
| ev | const | 177 | no | const ev = decodeWsPayload({ opcode: 1, payload: frame }); |
| keylessRerender | function | 192 | no | function keylessRerender() { |
| r | const | 193 | no | const r = rng(707); const base = Array.from({ length: 8 }, () =&gt; ({ role: pick(r, [&#39;user&#39;, &#39;assistant&#39;]), text: sentence(r, 24) })); |
| samples | const | 194 | no | const samples = []; const truth = []; |
| dom | variable | 195 | no | let dom = 0; |
| text | const | 197 | no | const text = pass === 0 ? b.text.split(&#39; &#39;).slice(0, 20).join(&#39; &#39;) : pass === 1 ? b.text : b.text + &#39; (edited)&#39;; |
| FIXTURES | const | 204 | yes | export const FIXTURES = { chatPathOps, dashboardTicks, feedPages, workspaceMixed, dynamicSchema, nestedHetero, multiPageWorkflow, twoSitesSameEntities, unknownFormat, keylessRerender }; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ../src/decode/decoders.mjs | import | 4 | [studio/src/decode/decoders.mjs](../src/decode/decoders.mjs.md) |
| ../src/intel/corpus.mjs | import | 5 | [studio/src/intel/corpus.mjs](../src/intel/corpus.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/eval/fixtures-v2.mjs](./fixtures-v2.mjs.md) | ./fixtures.mjs |
| [studio/eval/run.mjs](./run.mjs.md) | ./fixtures.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Ground-truth fixtures for measuring discovery and learning. Deterministic (seeded).
// split 'dev'      : patterns used while designing the algorithms.
// split 'heldout'  : different conventions and structures, NOT used for tuning.
import { decodeWsPayload } from '../src/decode/decoders.mjs';
import { discriminatorOf } from '../src/intel/corpus.mjs';

export function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const hex = (r, n) => Array.from({ length: n }, () => Math.floor(r() * 16).toString(16)).join('');
const uuid = (r) => `${hex(r, 8)}-${hex(r, 4)}-4${hex(r, 3)}-a${hex(r, 3)}-${hex(r, 12)}`;
const pick = (r, a) => a[Math.floor(r() * a.length)];
const WORDS = 'data model capture stream entity record field value table chart page user team plan review update report signal layer shape graph event state change system local agent browser profile'.split(' ');
const sentence = (r, n) => Array.from({ length: n }, () => pick(r, WORDS)).join(' ');
const S = (group, value, extra = {}) => ({ value, source: { kind: 'event', group, endpoint: group.split(' :: ')[0], ...extra } });

// ------------------------------------------------------------------ dev
function chatPathOps() {
  const r = rng(11); const convs = [uuid(r), uuid(r)]; const samples = []; const patchGroups = new Set(['POST host/backend/conversation :: (object)']);
  const msgs = [];
  for (let i = 0; i < 6; i++) {
    const id = uuid(r), cid = convs[i % 2], text = sentence(r, 30);
    const doc = { message: { id, author: { role: 'assistant' }, create_time: 1792500000 + i * 60, content: { content_type: 'text', parts: [text] }, status: 'finished_successfully' }, conversation_id: cid };
    samples.push({ value: doc, source: { kind: 'assembled', group: 'POST host/backend/conversation :: (assembled)', sid: `p:${i}`, seq: i * 10, t: 1000 + i * 1000 } });
    samples.push(S('POST host/backend/conversation :: (object)', { p: '/message/content/parts/0', o: 'append', v: text.slice(0, 10) }, { sid: `p:${i}`, seq: i * 10 + 1 }));
    msgs.push({ id, text, sid: `p:${i}` });
  }
  samples.push(S('GET host/backend/conversations :: (object)', { items: convs.map((c, i) => ({ id: c, title: `Conversation about ${sentence(r, 3)}`, update_time: `2026-10-2${i}T10:00:00Z` })), total: 2, limit: 28 }, { seq: 1 }));
  samples.push(S('GET host/backend/conversations :: (object)', { items: convs.map((c, i) => ({ id: c, title: `Conversation about ${sentence(r, 3)}`, update_time: `2026-10-2${i}T11:00:00Z` })), total: 2, limit: 28 }, { seq: 2 }));
  const elements = msgs.map((m, i) => ({ id: `el-${i}`, text: `Assistant said: ${m.text} Copy Share`, firstT: 1000 + i * 1000, lastT: 1400 + i * 1000 }));
  elements.push({ id: 'el-nav', text: 'New chat Search chats Library Settings', firstT: 0, lastT: 0 });
  return {
    name: 'chat-path-ops', split: 'dev', samples, patchGroups,
    gt: {
      types: [
        { name: 'message', key: 'id', fields: { id: { type: 'string', role: 'id' }, author: { type: 'object' }, create_time: { type: 'integer', role: 'timestamp' }, content: { type: 'object' }, status: { type: 'string', role: 'category' } } },
        { name: 'conversation', key: 'id', fields: { id: { type: 'string', role: 'id' }, title: { type: 'string', role: 'title' }, update_time: { type: 'string', role: 'timestamp' } } },
        { name: 'turn', key: null, fields: { message: { type: 'object' }, conversation_id: { type: 'string', role: 'reference' } } },
      ],
      extras: [['content_type', 'parts'], ['items', 'total', 'limit']],
      relationships: [{ from: 'turn', field: 'conversation_id', to: 'conversation' }],
      rendered: msgs.map((m, i) => ({ subject: m.sid, text: m.text, element: `el-${i}` })),
    },
    elements,
  };
}

function dashboardTicks() {
  const r = rng(22); const syms = ['AAA', 'BBB', 'CCC', 'DDD', 'EEE']; const samples = [];
  for (let n = 0; n < 60; n++) samples.push(S('WS host/ws-ticks :: tick', { type: 'tick', seq: n, symbol: syms[n % 5], price: +(100 + r() * 50).toFixed(2), ts: 1792500000000 + n * 40 }, { seq: n, t: n * 40 }));
  return {
    name: 'dashboard-ticks', split: 'dev', samples, patchGroups: new Set(),
    gt: { types: [{ name: 'tick', key: 'symbol', fields: { type: { type: 'string', role: 'category' }, seq: { type: 'integer', role: 'count' }, symbol: { type: 'string', role: 'id' }, price: { type: 'number', role: 'measure' }, ts: { type: 'integer', role: 'timestamp' } } }], relationships: [], identity: { tick: 5 } },
  };
}

function feedPages() {
  const r = rng(33); const samples = []; const all = [];
  for (let i = 0; i < 21; i++) all.push({ id: `post-${uuid(r).slice(0, 8)}`, title: `${sentence(r, 6)}`, url: `https://example.org/p/${i}`, published_at: `2026-09-${String(1 + i).padStart(2, '0')}T08:00:00Z`, author: pick(r, ['ana', 'ben', 'cy']), summary: sentence(r, 25) });
  for (let p = 0; p < 4; p++) samples.push(S('GET host/api/posts :: (object)', { page: p + 1, next: p < 3 ? p + 2 : null, results: all.slice(p * 5, p * 5 + 6) }, { seq: p, t: p * 500 }));
  return {
    name: 'feed-pages', split: 'dev', samples, patchGroups: new Set(),
    gt: { types: [{ name: 'post', key: 'id', fields: { id: { type: 'string', role: 'id' }, title: { type: 'string', role: 'title' }, url: { type: 'string', role: 'url' }, published_at: { type: 'string', role: 'timestamp' }, author: { type: 'string', role: 'category' }, summary: { type: 'string', role: 'text' } } }], extras: [['page', 'next', 'results']], relationships: [], identity: { post: 21 } },
  };
}

// ------------------------------------------------------------------ held-out
function workspaceMixed() {
  const r = rng(101); const samples = []; const patchGroups = new Set(['POST app/api/assist :: message_start', 'POST app/api/assist :: content_block_delta']);
  const conv = uuid(r);
  const msgs = [];
  for (let i = 0; i < 4; i++) {
    const text = sentence(r, 28);
    const doc = { message: { id: `msg_${hex(r, 20)}`, role: 'assistant', model: 'model-x', stop_reason: 'end_turn', conversation_uuid: conv }, blocks: { 0: { type: 'text', text } } };
    samples.push({ value: doc, source: { kind: 'assembled', group: 'POST app/api/assist :: (assembled)', sid: `a:${i}`, t: 2000 + i * 900 } });
    samples.push(S('POST app/api/assist :: content_block_delta', { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: 'x' } }, { sid: `a:${i}` }));
    msgs.push({ sid: `a:${i}`, text });
  }
  const regions = ['north', 'south', 'east', 'west'];
  for (let poll = 0; poll < 5; poll++) samples.push(S('GET app/api/sheet :: (object)', { rows: regions.map((g, i) => ({ row_key: `R${i + 1}`, region: g, revenue: +(1000 + r() * 900).toFixed(2), units: Math.floor(r() * 90) + 10, updated: `2026-10-21T1${poll}:00:00Z` })) }, { seq: poll, t: poll * 300 }));
  const blocks = () => [{ kind: 'p', text: sentence(r, 20) }, { kind: 'img', src: `/media/${hex(r, 6)}.png`, alt: sentence(r, 3) }, { kind: 'code', lang: 'sql', code: 'select * from t' }, { kind: 'p', text: sentence(r, 18) }];
  samples.push(S('GET app/api/doc :: (object)', { doc: { docId: `d-${hex(r, 10)}`, title: 'Quarterly review', sections: [1, 2, 3].map((n) => ({ sec_id: `s${n}-${hex(r, 6)}`, heading: `Section ${n} ${sentence(r, 2)}`, blocks: blocks() })) } }, { seq: 1 }));
```

_First 80 of 205 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
