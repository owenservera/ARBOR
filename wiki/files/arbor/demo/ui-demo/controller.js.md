# File: demo/ui-demo/controller.js

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | demo/ui-demo/controller.js |
| Language | JavaScript |
| Kind | source |
| Size | 24580 B |
| Lines | 367 |
| Hash | 025b13c84654 |
| Test | no |
| Generated | no |
| Component | demo |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| TAGS | const | 11 | no | const TAGS = [&#39;layout&#39;, &#39;copy&#39;, &#39;flow&#39;, &#39;other&#39;]; |
| STORAGE_KEY | const | 12 | no | const STORAGE_KEY = &#39;vivim-demo-walkthrough-v1&#39;; |
| esc | function | 14 | no | const esc = s =&gt; String(s == null ? &#39;&#39; : s) |
| STEPS | const | 17 | no | const STEPS = [ |
| EMPTY | function | 115 | no | const EMPTY = () =&gt; ({ notes: &#39;&#39;, tags: [], decision: null }); |
| state | variable | 116 | no | let state = STEPS.map(EMPTY); |
| raw | const | 118 | no | const raw = localStorage.getItem(STORAGE_KEY); |
| parsed | const | 120 | no | const parsed = JSON.parse(raw); |
| save | function | 130 | no | function save() { |
| counts | function | 133 | no | function counts() { |
| approve | variable | 134 | no | let approve = 0, revise = 0; |
| stripEl | variable | 140 | no | let stripEl, activeEl, progressEl, statusEl; |
| activeIndex | variable | 141 | no | let activeIndex = 0; |
| injectStyles | function | 143 | no | function injectStyles() { |
| style | const | 145 | no | const style = document.createElement(&#39;style&#39;); |
| createShell | function | 197 | no | function createShell() { |
| el | const | 200 | no | const el = document.querySelector(sel); |
| buildStrip | function | 232 | no | function buildStrip() { |
| chip | const | 235 | no | const chip = document.createElement(&#39;button&#39;); |
| dot | const | 240 | no | const dot = document.createElement(&#39;span&#39;); dot.className = &#39;demo-chip-dot&#39;; |
| name | const | 241 | no | const name = document.createElement(&#39;span&#39;); name.textContent = step.screen; |
| verdict | const | 242 | no | const verdict = document.createElement(&#39;span&#39;); verdict.className = &#39;demo-chip-verdict&#39;; |
| screenHtml | function | 250 | no | function screenHtml(step) { |
| rows | const | 251 | no | const rows = step.rows.map(r =&gt; ` &lt;div class=&quot;phone-row&quot;&gt; &lt;div class=&quot;phone-k&quot;&gt;${esc(r[0])}&lt;/div&gt; &lt;div class=&quot;phone-v&quot;&gt;${esc(r[1])}&lt;/div&gt; &lt;/div&gt;`).join(&#39;&#39;); |
| renderActive | function | 263 | no | function renderActive() { |
| step | const | 264 | no | const step = STEPS[activeIndex]; |
| s | const | 265 | no | const s = state[activeIndex]; |
| tagHtml | const | 266 | no | const tagHtml = TAGS.map(t =&gt; `&lt;span class=&quot;demo-tag${s.tags.includes(t) ? &#39; on&#39; : &#39;&#39;}&quot; data-tag=&quot;${esc(t)}&quot;&gt;${esc(t)}&lt;/span&gt;`).join(&#39;&#39;); |
| decisionHtml | const | 267 | no | const decisionHtml = s.decision ? `&lt;span class=&quot;demo-decision-chip&quot;&gt;${esc(s.decision)}&lt;/span&gt;` : &#39;&lt;span class=&quot;demo-decision-chip&quot;&gt;— not decided&lt;/span&gt;&#39;; |
| textarea | const | 288 | no | const textarea = document.getElementById(&#39;demo-notes&#39;); |
| tag | const | 292 | no | const tag = el.getAttribute(&#39;data-tag&#39;); |
| idx | const | 293 | no | const idx = state[activeIndex].tags.indexOf(tag); |
| setDecision | function | 303 | no | function setDecision(decision) { |
| renderAll | function | 311 | no | function renderAll() { |
| renderProgress | function | 317 | no | function renderProgress() { |
| c | const | 318 | no | const c = counts(); |
| bind | function | 324 | no | function bind() { |
| verdicts | function | 334 | no | function verdicts() { |
| submitRound | function | 344 | no | async function submitRound(approveAll) { |
| payload | const | 345 | no | const payload = { round: String(Date.now()), approveAll, verdicts: verdicts() }; |
| res | const | 348 | no | const res = await fetch(&#39;/feedback&#39;, { method: &#39;POST&#39;, headers: { &#39;content-type&#39;: &#39;application/json; charset=utf-8&#39; }, body: JSON.stringify(payload) }); |
| stored | const | 353 | no | const stored = await res.json(); |

## Imports

_No imports._

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
/* VIVIM UI demo — walkthrough controller (baseline mode).
   Shows each spec step's screen in a phone frame (current view only, no overlays),
   collects per-step notes + tags (layout/copy/flow/other) and an approve/revise
   verdict (persisted to localStorage), and posts one round JSON
   {round, approveAll, verdicts} to POST /feedback on Submit / Approve-all.
   No product API is read or written. */

(() => {
  'use strict';

  const TAGS = ['layout', 'copy', 'flow', 'other'];
  const STORAGE_KEY = 'vivim-demo-walkthrough-v1';

  const esc = s => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const STEPS = [
    {
      itemId: 'tab-today',
      screen: 'Today',
      currentState: `Today shows the 'Direct to your PC' connection row, one attention card 'A send is uncertain — Send uncertain — inspect original receipt. Nothing was resent.', running rows 'Chat · openai — Send observed — awaiting reply' and 'Learning your look · palette — Running on your PC', the day's selected mission, and exactly one primary next action 'Open Talk'.`,
      proposedUpgrade: 'baseline — current view, no upgrade proposed',
      acceptanceQuestion: `Does Today's single honest next action plus attention rows earn its place as the launch tab you judge the day by?`,
      mockText: `/status snapshot {snapshot:{live:{conversations:[{id:'conv-2',provider:'anthropic',messages:[{id:'m-5',state:'uncertain',commandId:'cmd-8'}]},{id:'conv-1',provider:'openai',model:'gpt-5',messages:[{id:'m-9',state:'waiting_reply'}]}]},bootstrap:{progress:{passes:[{pass:'palette',status:'running'}]}},bridge:{queued:1,claimed:0,done:3,failed:1}},commands:[{id:'cmd-9',mode:'relay-chat',text:'Summarize the intake notes',consumer:'harness',status:'failed',updatedAt:'2026-11-13T09:12:00Z'},{id:'cmd-7',mode:'relay-chat',text:'Draft the demo outline',consumer:'harness',status:'done',updatedAt:'2026-11-13T08:40:00Z'}]}, ctx:{connection:'Direct to your PC',connectionTone:'ok',paired:true,pendingSend:false}} — feeds todayModel()`,
      rows: [
        ['Connection', "Direct to your PC · tone ok · paired"],
        ['Attention card', `A send is uncertain — Send uncertain — inspect original receipt. Nothing was resent.`],
        ['Running rows', `Chat · openai — Send observed — awaiting reply  ·  Learning your look · palette — Running on your PC`],
        ['Bridge', 'queued 1 · claimed 0 · done 3 · failed 1'],
        ['Commands', `cmd-9 Summarize the intake notes — failed  ·  cmd-7 Draft the demo outline — done`],
        ['Primary next action', 'Open Talk']
      ]
    },
    {
      itemId: 'tab-talk',
      screen: 'Talk',
      currentState: 'Talk shows the conversations drawer, a "New chat" thread with the "Talk to" selector (VIVIM · my PC / My AIs / PC sessions), the user\'s message as a solid bubble and the assistant reply as a framed attributed bubble, and the composer dock rail (✦ VIVIM · ◇ My AIs · ▤ PC sessions plus ⌂ Home, ◷ Recents, ◎ Context, ⌁ Feed) above provider chips and send.',
      proposedUpgrade: 'baseline — current view, no upgrade proposed',
      acceptanceQuestion: 'Is this composer-first chat with three destination modes the right primary interface, or does the dock rail need trimming?',
      mockText: `conversations:[{id:'conv-1',title:'Demo outline',provider:'openai',model:'gpt-5',messages:[{role:'user',text:'Draft the demo outline'},{role:'assistant',state:'waiting_reply',text:'Here is a first outline…'}]}]; providers:[{id:'openai',label:'OpenAI',signedIn:true},{id:'anthropic',label:'Anthropic',signedIn:true}]; focusViews:['Today','World','Build']; rustContext:{state:'Not loaded · Direct connection only'}`,
      rows: [
        ['Conversations drawer', 'Present'],
        ['Thread', 'New chat · "Demo outline" · openai · gpt-5'],
        ['Talk to', 'VIVIM · my PC / My AIs / PC sessions'],
        ['User bubble', 'Draft the demo outline (solid)'],
        ['Assistant bubble', 'Here is a first outline… — waiting_reply (framed, attributed)'],
        ['Dock rail', '✦ VIVIM · ◇ My AIs · ▤ PC sessions | ⌂ ◷ ◎ ⌁'],
        ['Providers', 'OpenAI signed in · Anthropic signed in'],
        ['Rust context', 'Not loaded · Direct connection only']
      ]
    },
    {
      itemId: 'tab-build',
      screen: 'Build',
      currentState: 'Build shows the compose area for describing a wanted change above the Host\'s text-only proposal card for it — dashed-border proposal with a done status and a rendered proposal-preview — whose committed result is a vivim.ui-surface/1 revision your PC can undo.',
      proposedUpgrade: 'baseline — current view, no upgrade proposed',
      acceptanceQuestion: 'Is the propose → preview → approve-on-PC loop legible enough that you would trust the preview matches what you asked for?',
      mockText: `composeInput:'Show a card listing the three demo beats'; proposal:{id:'prop-1',title:'Demo beats card',status:'done',description:'Adds a card listing the three demo beats',preview:{type:'card',id:'c1',title:'Demo beats',children:[{type:'text',props:{value:'1. Pair · 2. Talk · 3. Build'}}]}}; revision:{surfaceId:'surf-1',revision:12,parentRevision:11,changeId:'chg-88',status:'committed'}`,
      rows: [
        ['Compose input', 'Show a card listing the three demo beats'],
        ['Proposal', `Demo beats card — done · 'Adds a card listing the three demo beats' (dashed border)`],
        ['Proposal preview', 'card "Demo beats" → 1. Pair · 2. Talk · 3. Build'],
        ['Revision', 'surf-1 r12 ← r11 · chg-88 · committed (undoable on your PC)']
      ]
    },
    {
      itemId: 'tab-world',
      screen: 'World',
      currentState: 'World lists "the things that exist now" — built items flattened from the Host-committed vivim.ui-surface/1 tree (e.g. card "Demo beats"), running rows with live-state labels, queued command receipts, bridge counts queued/claimed/done/failed, an undo-available row, and plainly named gaps where the Host sent nothing.',
      proposedUpgrade: 'baseline — current view, no upgrade proposed',
      acceptanceQuestion: 'Is built-things + running + queue counts + undo the right inventory for World, and are the plain "not available" gaps acceptable?',
      mockText: `revision:{surfaceId:'surf-1',revision:12,changeId:'chg-88',parentRevision:11,status:'committed',tree:{type:'stack',children:[{type:'card',id:'c1',props:{title:'Demo beats',description:'The three beats of the walkthrough'}},{type:'text',id:'t1',props:{value:'1. Pair · 2. Talk · 3. Build'}},{type:'button',id:'b1',props:{label:'Open outline',intent:'open.outline'}}]}}; live:{conversations:[{id:'conv-1',provider:'openai',messages:[{state:'waiting_reply'}]}]}; bridge:{queued:1,claimed:0,done:3,failed:1}; bootstrap:{undo:{available:true}}; commands:[{id:'cmd-9',mode:'relay-chat',text:'Summarize the intake notes',status:'queued',updatedAt:'2026-11-13T09:05:00Z'}] — feeds worldModel()`,
      rows: [
        ['Surface tree (committed)', 'card "Demo beats" · text "1. Pair · 2. Talk · 3. Build" · button "Open outline" (open.outline)'],
        ['Running rows', 'conv-1 · openai · waiting_reply'],
        ['Bridge', 'queued 1 · claimed 0 · done 3 · failed 1'],
        ['Undo', 'available'],
        ['Commands', 'cmd-9 Summarize the intake notes — queued'],
        ['Gaps', 'Plainly named where the Host sent nothing']
      ]
```

_First 80 of 368 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
