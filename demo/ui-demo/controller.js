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
    },
    {
      itemId: 'tab-me',
      screen: 'Me',
      currentState: 'Me shows identity rows (Personal agent vivim-local-7, Scope household, Assurance device-bound, Initialized Yes, World arbor-home-01), device rows (This phone Paired · Direct to your PC, device grant, "Other devices — the Host does not send a device list to the phone"), permission rows (grant scopes, signed-in AI openai + anthropic), and the last eight command receipts.',
      proposedUpgrade: 'baseline — current view, no upgrade proposed',
      acceptanceQuestion: 'Are identity, devices, permissions and receipts the right self-service surface, with honest "not sent to the phone" rows where data is missing?',
      mockText: `personalAgent:{agentId:'vivim-local-7',scope:'household',identityAssurance:'device-bound',initialized:true}; bootstrap.worldId:'arbor-home-01'; ctx:{paired:true,mode:'direct',deviceStatus:'granted',scopes:['chat.send','build.propose','media.read']}; manifest.providers:[{id:'openai',signedIn:true},{id:'anthropic',signedIn:true},{id:'gemini',signedIn:false}]; commands:[{id:'cmd-7',mode:'relay-chat',text:'Draft the demo outline',status:'done',updatedAt:'2026-11-13T08:40:00Z'},{id:'cmd-9',mode:'relay-chat',text:'Summarize the intake notes',status:'failed',updatedAt:'2026-11-13T09:12:00Z'}] — feeds meModel()`,
      rows: [
        ['Identity', 'Personal agent vivim-local-7 · Scope household · Assurance device-bound · Initialized Yes · World arbor-home-01'],
        ['Device', 'This phone — Paired · Direct to your PC · device grant'],
        ['Other devices', 'Not sent to the phone (the Host does not send a device list)'],
        ['Permissions', 'scopes: chat.send · build.propose · media.read'],
        ['Signed-in AI', 'openai ✓ · anthropic ✓ · gemini ✗'],
        ['Command receipts', 'cmd-7 Draft the demo outline — done · cmd-9 Summarize the intake notes — failed']
      ]
    },
    {
      itemId: 'tab-control',
      screen: 'Control',
      currentState: 'Control shows "Control your VIVIM" with the textarea placeholder "Set my theme to dusk, or stop all traffic", the "Preview action" button feeding the result pane, a Recent Host control decisions card, and the footer note that preview never changes settings and applied actions need separate approval and return Host receipts.',
      proposedUpgrade: 'baseline — current view, no upgrade proposed',
      acceptanceQuestion: 'Is the preview-then-explicit-approve flow, with unsupported requests refused, worded clearly enough that you would trust it on your home PC?',
      mockText: `controlRequest:'Set my theme to dusk'; previewResult:{ok:true,action:'set-theme',params:{theme:'dusk'},receipt:'pending-approval',note:'Preview only — nothing changed yet'}; controlActivity:[{id:'dec-3',request:'Stop all traffic',decision:'approved',receipt:'host:rcpt-51',at:'2026-11-13T07:55:00Z'}]`,
      rows: [
        ['Request', 'Set my theme to dusk'],
        ['Preview result', 'set-theme theme=dusk · receipt pending-approval · Preview only — nothing changed yet'],
        ['Recent decision', 'dec-3 "Stop all traffic" — approved · host:rcpt-51 · 2026-11-13T07:55:00Z'],
        ['Footer', 'Preview never changes settings · approval + Host receipts required · unsupported requests refused']
      ]
    }
  ];

  // --- state (notes, tags, decision per step) persisted to localStorage ---
  const EMPTY = () => ({ notes: '', tags: [], decision: null });
  let state = STEPS.map(EMPTY);
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length === STEPS.length) {
        state = parsed.map(s => ({
          notes: typeof s.notes === 'string' ? s.notes : '',
          tags: Array.isArray(s.tags) ? s.tags.filter(t => TAGS.includes(t)) : [],
          decision: s.decision == null ? null : (s.decision === 'approve' || s.decision === 'revise' ? s.decision : null)
        }));
      }
    }
  } catch { /* ignore storage issues */ }
  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
  }
  function counts() {
    let approve = 0, revise = 0;
    state.forEach(s => { if (s.decision === 'approve') approve++; else if (s.decision === 'revise') revise++; });
    return { approve, revise };
  }

  // --- DOM ---
  let stripEl, activeEl, progressEl, statusEl;
  let activeIndex = 0;

  function injectStyles() {
    if (document.getElementById('vivim-demo-styles')) return;
    const style = document.createElement('style');
    style.id = 'vivim-demo-styles';
    style.textContent = `
      :root{--demo-bg:#111214;--demo-s1:#18191c;--demo-s2:#202226;--demo-bd:#2e3035;--demo-tx:#eeece7;--demo-mu:#aeaba4;--demo-ac:#ec7b67;--demo-ok:#5cc8cf}
      *{box-sizing:border-box}
      body{margin:0;background:var(--demo-bg);color:var(--demo-tx);font:15px/1.5 "Geist","Segoe UI Variable Text",system-ui,sans-serif;overflow:auto}
      .demo-shell{max-width:760px;margin:0 auto;padding:16px 12px 40px}
      .demo-header{display:flex;align-items:baseline;gap:12px;margin-bottom:10px}
      .demo-header h1{font:600 18px/1.2 "Space Grotesk","Segoe UI Variable Display",system-ui,sans-serif;letter-spacing:-.02em;margin:0}
      .demo-progress{font:500 12px/1.6 ui-monospace;color:var(--demo-mu);border:1px solid var(--demo-bd);border-radius:10px;padding:4px 10px;background:var(--demo-s2)}
      .demo-strip{display:flex;gap:6px;overflow-x:auto;overflow-y:hidden;margin-bottom:14px;padding-bottom:6px;scrollbar-width:none}
      .demo-strip::-webkit-scrollbar{display:none}
      .demo-step-chip{flex:none;display:flex;align-items:center;gap:8px;border:1px solid var(--demo-bd);border-radius:10px;background:var(--demo-s2);color:var(--demo-mu);font:500 12.5px/1.4 ui-monospace;padding:6px 10px;cursor:pointer;white-space:nowrap}
      .demo-step-chip.current{border-color:var(--demo-ac);color:var(--demo-tx);background:var(--demo-ac)}
      .demo-step-chip .demo-chip-dot{width:8px;height:8px;border-radius:50%;background:var(--demo-mu);flex:none}
      .demo-step-chip.current .demo-chip-dot{background:#1a0a06}
      .demo-step-chip .demo-chip-verdict{font-size:10px;padding:1px 6px;border-radius:8px;background:rgba(0,0,0,0.35);color:#c9c8c4;margin-left:6px}
      .demo-active{display:flex;flex-direction:column;gap:12px}
      .demo-step-head{display:flex;align-items:baseline;justify-content:space-between;gap:8px}
      .demo-step-id{font:500 11px/1.4 ui-monospace;letter-spacing:.08em;text-transform:uppercase;color:var(--demo-mu)}
      .demo-step-head h2{font:600 22px/1.2 "Space Grotesk","Segoe UI Variable Display",system-ui,sans-serif;letter-spacing:-.02em;margin:0}
      .demo-badge{font:500 11px/1.4 ui-monospace;color:#9ab8ee;border:1px solid #2a4a5d;background:#0b2430;border-radius:8px;padding:3px 8px}
      .phone-frame{display:flex;justify-content:center}
      .phone{border:1px solid var(--demo-bd);border-radius:18px;background:#0c0d0f;width:min(100%,340px);padding:14px 10px 16px;box-shadow:0 20px 60px #000a}
      .phone-screen{border:1px solid var(--demo-s2);border-radius:12px;background:var(--demo-s1);min-height:300px;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:10px}
      .phone-row{display:flex;gap:10px;align-items:flex-start}
      .phone-k{font:500 11.5px/1.5 ui-monospace;color:var(--demo-mu);flex:0 0 130px;white-space:nowrap}
      .phone-v{color:var(--demo-tx);font-size:14px;line-height:1.45;overflow-wrap:anywhere}
      .phone-v.card{border:1px dashed var(--demo-mu);background:var(--demo-s2);border-radius:8px;padding:8px 10px;font-size:13px}
      .phone-banner{font:500 11px/1.4 ui-monospace;color:#9ab8ee;text-align:center;border:1px solid #2a4a5d;background:#0b2430;border-radius:8px;padding:6px 8px;letter-spacing:.05em}
      .demo-acceptance{font:500 12.5px/1.55;color:var(--demo-mu);margin:0 0 8px}
      .demo-feed{background:#0c0d0f;border:1px solid var(--demo-bd);border-radius:10px;padding:10px 12px;font:11.5px/1.5 "JetBrains Mono",ui-monospace,monospace;color:var(--demo-mu);overflow:auto;max-height:170px;white-space:pre-wrap;overflow-wrap:anywhere}
      .demo-notes{display:flex;flex-direction:column;gap:8px}
      .demo-notes label{font:500 11px/1.4 ui-monospace;letter-spacing:.08em;text-transform:uppercase;color:var(--demo-mu)}
      #demo-notes{flex:1;min-height:78px;background:var(--demo-s2);border:1px solid var(--demo-bd);border-radius:8px;color:var(--demo-tx);padding:10px 12px;font:13px/1.5 "Geist",system-ui,sans-serif;resize:vertical}
      .demo-tags{display:flex;gap:6px;flex-wrap:wrap}
      .demo-tag{border:1px solid var(--demo-bd);background:var(--demo-s2);color:var(--demo-mu);font:500 11px/1.4 ui-monospace;border-radius:10px;padding:2px 8px;cursor:pointer}
      .demo-tag.on{border-color:var(--demo-ac);color:var(--demo-tx)}
      .demo-decision{display:flex;gap:8px;margin-top:6px}
      .demo-btn{border:1px solid var(--demo-bd);background:var(--demo-s2);color:var(--demo-tx);font:550 13px/1.4;min-height:40px;padding:0 14px;border-radius:8px;cursor:pointer}
      .demo-btn:hover{background:var(--demo-s1)}
      .demo-btn.pri{background:var(--demo-ac);border-color:var(--demo-ac);color:#1a0a06;font-weight:600}
      .demo-btn.pri:hover{background:#d96a57}
      .demo-btn.active{border-color:var(--demo-ok);color:var(--demo-ok)}
      .demo-decision-chip{font:500 11px/1.4 ui-monospace;margin-top:4px}
      .demo-footer{position:sticky;bottom:0;background:var(--demo-bg);padding:12px 0;display:flex;gap:10px;align-items:center;justify-content:flex-end;flex-wrap:wrap;margin-top:8px;border-top:1px solid var(--demo-bd)}
      .demo-status{font:500 12px/1.6 ui-monospace;color:var(--demo-ok);margin-right:auto;white-space:nowrap}
      .demo-section{font:500 11px/1.4 ui-monospace;letter-spacing:.08em;text-transform:uppercase;color:var(--demo-mu);margin:6px 0 2px}
    `;
    document.head.appendChild(style);
  }

  function createShell() {
    // Hide the PWA chrome so the walkthrough owns the page; the copied PWA assets stay served.
    for (const sel of ['#app', '#pairbox', '#top', '#welcome', '#dbg']) {
      const el = document.querySelector(sel);
      if (el) el.hidden = true;
    }
    document.body.style.margin = '0';
    shell = document.createElement('div');
    shell.className = 'demo-shell';
    shell.innerHTML = `
      <header class="demo-header">
        <h1>ARBOR baseline · VIVIM Direct walkthrough</h1>
        <div class="demo-progress" id="demo-progress">approved 0 · revise 0 of ${STEPS.length}</div>
      </header>
      <div class="demo-section">Steps</div>
      <div class="demo-strip" id="demo-strip"></div>
      <div class="demo-active" id="demo-active"></div>
      <footer class="demo-footer">
        <div class="demo-status" id="demo-status"></div>
        <button class="demo-btn" id="demo-submit">Submit round</button>
        <button class="demo-btn pri" id="demo-approve-all">Approve all · submit</button>
      </footer>
    `;
    document.body.insertBefore(shell, document.body.firstChild);

    stripEl = document.getElementById('demo-strip');
    activeEl = document.getElementById('demo-active');
    progressEl = document.getElementById('demo-progress');
    statusEl = document.getElementById('demo-status');

    buildStrip();
    renderActive();
    bind();
  }

  function buildStrip() {
    stripEl.innerHTML = '';
    STEPS.forEach((step, i) => {
      const chip = document.createElement('button');
      chip.className = 'demo-step-chip' + (i === activeIndex ? ' current' : '');
      chip.type = 'button';
      chip.setAttribute('role', 'tab');
      chip.setAttribute('aria-selected', i === activeIndex);
      const dot = document.createElement('span'); dot.className = 'demo-chip-dot';
      const name = document.createElement('span'); name.textContent = step.screen;
      const verdict = document.createElement('span'); verdict.className = 'demo-chip-verdict';
      verdict.textContent = state[i].decision || '—';
      chip.appendChild(dot); chip.appendChild(name); chip.appendChild(verdict);
      chip.addEventListener('click', () => { activeIndex = i; renderAll(); });
      stripEl.appendChild(chip);
    });
  }

  function screenHtml(step) {
    const rows = step.rows.map(r => `
      <div class="phone-row">
        <div class="phone-k">${esc(r[0])}</div>
        <div class="phone-v">${esc(r[1])}</div>
      </div>`).join('');
    return `
      <div class="demo-section">Screen (current view)</div>
      ${rows}
      <div class="phone-banner">Baseline · current view only · no overlays · ${esc(step.proposedUpgrade)}</div>
    `;
  }

  function renderActive() {
    const step = STEPS[activeIndex];
    const s = state[activeIndex];
    const tagHtml = TAGS.map(t => `<span class="demo-tag${s.tags.includes(t) ? ' on' : ''}" data-tag="${esc(t)}">${esc(t)}</span>`).join('');
    const decisionHtml = s.decision ? `<span class="demo-decision-chip">${esc(s.decision)}</span>` : '<span class="demo-decision-chip">— not decided</span>';
    activeEl.innerHTML = `
      <div class="demo-step-head">
        <div><span class="demo-step-id">${esc(step.itemId)}</span><h2>${esc(step.screen)}</h2></div>
        <span class="demo-badge">baseline · current view · no overlays</span>
      </div>
      <div class="phone-frame"><div class="phone"><div class="phone-screen">${screenHtml(step)}</div></div></div>
      <p class="demo-acceptance">Q: ${esc(step.acceptanceQuestion)}</p>
      <div class="demo-section">Mock data feed (fixture)</div>
      <div class="demo-feed">${esc(step.mockText)}</div>
      <div class="demo-notes">
        <label>Notes <span class="demo-step-id">(${esc(step.itemId)})</span></label>
        <textarea id="demo-notes" placeholder="Notes for this step…">${esc(s.notes)}</textarea>
        <div class="demo-tags">${tagHtml}</div>
        <div class="demo-decision">
          <button class="demo-btn${s.decision === 'approve' ? ' active pri' : ''}" id="demo-btn-approve" type="button">Approve</button>
          <button class="demo-btn${s.decision === 'revise' ? ' active' : ''}" id="demo-btn-revise" type="button">Revise</button>
        </div>
        ${decisionHtml}
      </div>
    `;
    const textarea = document.getElementById('demo-notes');
    textarea.addEventListener('input', () => { state[activeIndex].notes = textarea.value; save(); renderProgress(); });
    document.querySelectorAll('.demo-tag').forEach(el => {
      el.addEventListener('click', () => {
        const tag = el.getAttribute('data-tag');
        const idx = state[activeIndex].tags.indexOf(tag);
        if (idx >= 0) state[activeIndex].tags.splice(idx, 1);
        else state[activeIndex].tags.push(tag);
        save(); renderActive(); renderProgress();
      });
    });
    document.getElementById('demo-btn-approve').addEventListener('click', () => setDecision('approve'));
    document.getElementById('demo-btn-revise').addEventListener('click', () => setDecision('revise'));
  }

  function setDecision(decision) {
    state[activeIndex].decision = decision;
    save();
    buildStrip();
    renderActive();
    renderProgress();
  }

  function renderAll() {
    buildStrip();
    renderActive();
    renderProgress();
  }

  function renderProgress() {
    const c = counts();
    progressEl.textContent = `approved ${c.approve} · revise ${c.revise} of ${STEPS.length}`;
    buildStrip();
    statusEl.textContent = '';
  }

  function bind() {
    document.getElementById('demo-submit').addEventListener('click', () => submitRound(false));
    document.getElementById('demo-approve-all').addEventListener('click', () => {
      state.forEach(s => { s.decision = 'approve'; });
      save();
      buildStrip(); renderActive(); renderProgress();
      submitRound(true);
    });
  }

  function verdicts() {
    return STEPS.map((step, i) => ({
      itemId: step.itemId,
      screen: step.screen,
      decision: state[i].decision,
      notes: state[i].notes,
      tags: state[i].tags.slice()
    }));
  }

  async function submitRound(approveAll) {
    const payload = { round: String(Date.now()), approveAll, verdicts: verdicts() };
    statusEl.textContent = 'Submitting…';
    try {
      const res = await fetch('/feedback', {
        method: 'POST',
        headers: { 'content-type': 'application/json; charset=utf-8' },
        body: JSON.stringify(payload)
      });
      const stored = await res.json();
      if (res.ok) {
        statusEl.textContent = `Round ${esc(String(stored.round))} submitted (approveAll=${approveAll}) · ${stored.verdicts.length} verdicts`;
      } else {
        statusEl.textContent = 'Submit failed (HTTP ' + res.status + ')';
      }
    } catch (err) {
      statusEl.textContent = 'Submit failed: ' + esc(err.message);
    }
  }

  injectStyles();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', createShell);
  else createShell();
})();
