# File: studio/eval/fixtures-v2.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | studio/eval/fixtures-v2.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 9546 B |
| Lines | 122 |
| Hash | 5914fc347441 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| hex | function | 5 | no | const hex = (r, n) =&gt; Array.from({ length: n }, () =&gt; Math.floor(r() * 16).toString(16)).join(&#39;&#39;); |
| pick | function | 6 | no | const pick = (r, a) =&gt; a[Math.floor(r() * a.length)]; |
| W | const | 7 | no | const W = &#39;alpha bravo charlie delta echo foxtrot golf hotel india juliet kilo lima mike november oscar papa quebec romeo sierra tango uniform victor whiskey xray yankee zulu&#39;.split(&#39; &#39;); |
| words | function | 8 | no | const words = (r, n) =&gt; Array.from({ length: n }, () =&gt; pick(r, W)).join(&#39; &#39;); |
| S | function | 9 | no | const S = (group, value, extra = {}) =&gt; ({ value, source: { kind: &#39;event&#39;, group, ...extra } }); |
| shuffle | function | 11 | no | function shuffle(arr, r) { const a = arr.slice(); for (let i = a.length - 1; i &gt; 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; } |
| crmContacts | function | 13 | no | function crmContacts() { |
| r | const | 14 | no | const r = rng(9001); |
| accounts | const | 15 | no | const accounts = Array.from({ length: 5 }, (_, i) =&gt; ({ account_number: `AC-${1001 + i}`, company: `${words(r, 2)} Ltd`, industry: pick(r, [&#39;retail&#39;, &#39;energy&#39;, &#39;media&#39;]), arr_usd: Math.floor(r() * 90… |
| contacts | const | 16 | no | const contacts = Array.from({ length: 14 }, (_, i) =&gt; ({ contactId: 501 + i, account: accounts[i % 5].account_number, first_name: pick(r, W), last_name: pick(r, W), title: pick(r, [&#39;CTO&#39;, &#39;CFO&#39;, &#39;VP … |
| samples | const | 17 | no | const samples = [S(&#39;GET crm/api/accounts :: (object)&#39;, { accounts, total: 5 }, { seq: 1, t: 10 })]; |
| ticketingSse | function | 33 | no | function ticketingSse() { |
| r | const | 34 | no | const r = rng(9002); |
| tickets | const | 35 | no | const tickets = Array.from({ length: 6 }, (_, i) =&gt; ({ ticketNo: `T-${70 + i}`, subject: words(r, 5), priority: pick(r, [&#39;low&#39;, &#39;high&#39;, &#39;urgent&#39;]), status: &#39;open&#39;, assignee: pick(r, [&#39;ana&#39;, &#39;bo&#39;, &#39;cy… |
| samples | const | 36 | no | const samples = []; |
| seq | variable | 37 | no | let seq = 0; |
| iotTelemetry | function | 55 | no | function iotTelemetry() { |
| r | const | 56 | no | const r = rng(9003); |
| devs | const | 57 | no | const devs = [&#39;sensor-7&#39;, &#39;sensor-9&#39;, &#39;pump-2&#39;, &#39;valve-11&#39;]; |
| samples | const | 58 | no | const samples = []; |
| chatNearDuplicates | function | 66 | no | function chatNearDuplicates() { |
| r | const | 67 | no | const r = rng(9004); |
| base | const | 68 | no | const base = []; |
| stem | const | 71 | no | const stem = words(r, 14); |
| samples | const | 74 | no | const samples = [], truth = []; |
| dom | variable | 75 | no | let dom = 0; |
| text | const | 77 | no | const text = pass === 0 ? b.text.split(&#39; &#39;).slice(0, Math.max(3, b.text.split(&#39; &#39;).length - 4)).join(&#39; &#39;) : b.text; |
| catalogTwoSites | function | 84 | no | function catalogTwoSites() { |
| r | const | 85 | no | const r = rng(9005); |
| a | const | 86 | no | const a = [S(&#39;GET shop-a/api/products :: [array]&#39;, Array.from({ length: 10 }, (_, i) =&gt; ({ sku: `SKU-${3000 + i}`, title: `${words(r, 3)} widget`, price_cents: Math.floor(r() * 9000) + 100, in_stock:… |
| b | const | 87 | no | const b = [S(&#39;POST shop-b/graphql :: (object)&#39;, { data: { products: Array.from({ length: 10 }, (_, i) =&gt; ({ product: { code: `P${hex(r, 6).toUpperCase()}`, name: `${words(r, 3)} gadget`, pricing: { a… |
| rareVariant | function | 98 | no | function rareVariant() { |
| r | const | 99 | no | const r = rng(9006); |
| items | const | 100 | no | const items = []; |
| orderShuffled | function | 110 | no | function orderShuffled() { |
| base | const | 111 | no | const base = crmContacts(); |
| driftV2 | function | 115 | no | function driftV2() { |
| r | const | 116 | no | const r = rng(9008); |
| v1 | const | 117 | no | const v1 = Array.from({ length: 15 }, (_, i) =&gt; ({ id: `x${i}`, name: `${words(r, 3)}`, price: +(r() * 40).toFixed(2), category: pick(r, [&#39;a&#39;, &#39;b&#39;]) })); |
| v2 | const | 118 | no | const v2 = Array.from({ length: 15 }, (_, i) =&gt; ({ id: `x${i}`, title: `${words(r, 3)}`, price: (r() * 40).toFixed(2), tags: [pick(r, W)] })); |
| FIXTURES_V2 | const | 122 | yes | export const FIXTURES_V2 = { crmContacts, ticketingSse, iotTelemetry, chatNearDuplicates, catalogTwoSites, rareVariant, orderShuffled, driftV2 }; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./fixtures.mjs | import | 3 | [studio/eval/fixtures.mjs](./fixtures.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/eval/run.mjs](./run.mjs.md) | ./fixtures-v2.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Held-out v2: written before measuring, never used to tune. Adversarial by design.
// If any of these is later inspected to fix an algorithm, it must be marked "seen" in results.
import { rng } from './fixtures.mjs';

const hex = (r, n) => Array.from({ length: n }, () => Math.floor(r() * 16).toString(16)).join('');
const pick = (r, a) => a[Math.floor(r() * a.length)];
const W = 'alpha bravo charlie delta echo foxtrot golf hotel india juliet kilo lima mike november oscar papa quebec romeo sierra tango uniform victor whiskey xray yankee zulu'.split(' ');
const words = (r, n) => Array.from({ length: n }, () => pick(r, W)).join(' ');
const S = (group, value, extra = {}) => ({ value, source: { kind: 'event', group, ...extra } });

function shuffle(arr, r) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

function crmContacts() {
  const r = rng(9001);
  const accounts = Array.from({ length: 5 }, (_, i) => ({ account_number: `AC-${1001 + i}`, company: `${words(r, 2)} Ltd`, industry: pick(r, ['retail', 'energy', 'media']), arr_usd: Math.floor(r() * 900000) }));
  const contacts = Array.from({ length: 14 }, (_, i) => ({ contactId: 501 + i, account: accounts[i % 5].account_number, first_name: pick(r, W), last_name: pick(r, W), title: pick(r, ['CTO', 'CFO', 'VP Sales', 'Engineer']), last_activity: `2026-10-${String(1 + (i % 20)).padStart(2, '0')}T12:00:00Z` }));
  const samples = [S('GET crm/api/accounts :: (object)', { accounts, total: 5 }, { seq: 1, t: 10 })];
  for (let p = 0; p < 3; p++) samples.push(S('GET crm/api/contacts :: (object)', { page: p + 1, contacts: contacts.slice(p * 5, p * 5 + 6).map((c) => ({ ...c, title: r() < 0.3 ? 'Director' : c.title })) }, { seq: 2 + p, t: 20 + p }));
  return {
    name: 'v2-crm-contacts', split: 'heldout2', samples, patchGroups: new Set(),
    gt: {
      types: [
        { name: 'account', key: 'account_number', fields: { account_number: { type: 'string', role: 'id' }, company: { type: 'string', role: 'title' }, industry: { type: 'string', role: 'category' }, arr_usd: { type: 'integer', role: 'measure' } } },
        { name: 'contact', key: 'contactId', fields: { contactId: { type: 'integer', role: 'id' }, account: { type: 'string', role: 'reference' }, first_name: { type: 'string', role: 'title' }, last_name: { type: 'string', role: 'title' }, title: { type: 'string', role: 'category' }, last_activity: { type: 'string', role: 'timestamp' } } },
      ],
      extras: [['accounts', 'total'], ['page', 'contacts']],
      relationships: [{ from: 'contact', field: 'account', to: 'account' }],
      identity: { contact: 14 },
    },
  };
}

function ticketingSse() {
  const r = rng(9002);
  const tickets = Array.from({ length: 6 }, (_, i) => ({ ticketNo: `T-${70 + i}`, subject: words(r, 5), priority: pick(r, ['low', 'high', 'urgent']), status: 'open', assignee: pick(r, ['ana', 'bo', 'cy']) }));
  const samples = [];
  let seq = 0;
  for (const t of tickets) samples.push(S('GET help/stream :: ticket.created', { event: 'ticket.created', data: { ticket: t } }, { seq: seq++, t: seq * 10 }));
  for (let k = 0; k < 10; k++) { const t = tickets[k % 6]; samples.push(S('GET help/stream :: ticket.updated', { event: 'ticket.updated', data: { ticket: { ...t, status: pick(r, ['pending', 'solved']) } } }, { seq: seq++, t: seq * 10 })); }
  for (let k = 0; k < 9; k++) samples.push(S('GET help/stream :: comment.added', { event: 'comment.added', data: { comment: { commentId: `cm_${hex(r, 10)}`, ticketNo: tickets[k % 6].ticketNo, author: pick(r, ['ana', 'bo', 'customer']), text: words(r, 18) } } }, { seq: seq++, t: seq * 10 }));
  return {
    name: 'v2-ticketing-sse', split: 'heldout2', samples, patchGroups: new Set(),
    gt: {
      types: [
        { name: 'ticket', key: 'ticketNo', fields: { ticketNo: { type: 'string', role: 'id' }, subject: { type: 'string', role: 'title' }, priority: { type: 'string', role: 'category' }, status: { type: 'string', role: 'category' }, assignee: { type: 'string', role: 'category' } } },
        { name: 'comment', key: 'commentId', fields: { commentId: { type: 'string', role: 'id' }, ticketNo: { type: 'string', role: 'reference' }, author: { type: 'string', role: 'category' }, text: { type: 'string', role: 'text' } } },
      ],
      extras: [['event', 'data'], ['ticket'], ['comment']],
      relationships: [{ from: 'comment', field: 'ticketNo', to: 'ticket' }],
      identity: { ticket: 6 },
    },
  };
}

function iotTelemetry() {
  const r = rng(9003);
  const devs = ['sensor-7', 'sensor-9', 'pump-2', 'valve-11'];
  const samples = [];
  for (let n = 0; n < 80; n++) samples.push(S('WS iot/live :: (object)', { d: devs[n % 4], t: 1792600000 + n * 5, v: +(15 + r() * 15).toFixed(2), u: n % 4 === 2 ? 'bar' : 'C' }, { seq: n, t: n * 5 }));
  return {
    name: 'v2-iot-telemetry', split: 'heldout2', samples, patchGroups: new Set(),
    gt: { types: [{ name: 'reading', key: 'd', fields: { d: { type: 'string', role: 'id' }, t: { type: 'integer', role: 'timestamp' }, v: { type: 'number', role: 'measure' }, u: { type: 'string', role: 'category' } } }], relationships: [], identity: { reading: 4 } },
  };
}

function chatNearDuplicates() {
  const r = rng(9004);
  const base = [];
  for (let i = 0; i < 5; i++) base.push({ role: i % 2 ? 'assistant' : 'user', text: words(r, 20) });
  // Two different turns that start identically and differ only at the end.
  const stem = words(r, 14);
  base.push({ role: 'assistant', text: `${stem} ${words(r, 6)}` });
  base.push({ role: 'assistant', text: `${stem} ${words(r, 6)}` });
  const samples = [], truth = [];
  let dom = 0;
  for (let pass = 0; pass < 3; pass++) base.forEach((b, i) => {
    const text = pass === 0 ? b.text.split(' ').slice(0, Math.max(3, b.text.split(' ').length - 4)).join(' ') : b.text;
    samples.push({ value: { role: b.role, text }, source: { kind: 'dom', group: 'page :: turns', domId: ++dom, t: pass * 1000 + i } });
    truth.push(i);
  });
```

_First 80 of 123 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
