/* @vlang:surface apps/vivim-host/public/demo/controller.js
   @vlang:surface-desc: Walkthrough controller for the ARBOR baseline demo — the reprogrammable
   @vlang:surface-desc: surface is presentation and verdict wording only: live message state
   @vlang:surface-desc: labels (LIVE_STATE_LABELS), the honest gap string (NOT_AVAILABLE), the
   @vlang:surface-desc: tag vocabulary (TAGS), fixture validation messages, and per-step
   @vlang:surface-desc: render wording. NL-driven change accepts none of: new fetch targets
   @vlang:surface-desc: (C4 same-origin /demo/* only), DOM scope beyond #demo-* elements (C7),
   @vlang:surface-desc: inline script/style (C4), or verdict payload keys beyond the C8
   @vlang:surface-desc: {round, approveAll, verdicts} shape read by POST /demo/feedback.
   @vlang:surface-desc: NLCL linkage: no action in control/action-catalog.v1.json v7 targets
   @vlang:surface-desc: this file yet — actionIds stays empty until one is catalogued.
   @vlang:id: tag-vocabulary storage-key live-state-labels not-available-gap
   @vlang:id: fixture-validation mock-data-views walkthrough-state verdict-payload dom-anchors
   @vlang:action: */

/* VIVIM Host demo — walkthrough controller (baseline mode, fixture-fed).
   Loads /demo/fixture/index.json then each step file, validates the
   'vivim.demo-step/1' schema fail-closed (mismatch -> error card, never a
   partial screen), renders each step's rows into #demo-phone strictly from the
   step's mockData fields (C6 truthfulness: a row exists only when a fixture
   field produced it; missing Host data renders the honest NOT_AVAILABLE gap),
   collects per-step notes + tags (layout/copy/flow/other) and an approve/revise
   verdict (persisted to localStorage 'vivim-demo-walkthrough-v1'), and posts
   one round JSON {round, approveAll, verdicts} to POST /demo/feedback on
   Submit / Approve-all.
   CSP (C4): no inline script, no on* attributes, no injected styles — all
   presentation lives in /demo/demo.css. fetch() targets same-origin /demo/*
   only. Touches only #demo-* elements (C7) and never reaches into
   #demo-live-preview (no contentWindow/contentDocument access).
   No product API is read or written. */

(() => {
  'use strict';

  const TAGS = ['layout', 'copy', 'flow', 'other'];
  const STORAGE_KEY = 'vivim-demo-walkthrough-v1';
  const FEEDBACK_URL = '/demo/feedback';
  const INDEX_URL = '/demo/fixture/index.json';
  const FIXTURE_BASE = '/demo/fixture/';
  const INDEX_SCHEMA = 'vivim.demo-steps/1';
  const STEP_SCHEMA = 'vivim.demo-step/1';

  // Canonical phone labels for a live message state — verbatim values from
  // apps/mobile-relay/ux/model.mjs:17-28 (LIVE_STATE_LABELS). The browser
  // controller cannot import that module (not in the server ASSETS allowlist),
  // so the map is embedded verbatim here; C6 keeps the wording in lockstep.
  const LIVE_STATE_LABELS = Object.freeze({
    created: 'Intent recorded',
    remote_queued: 'Queued on PC',
    claimed: 'Claimed by worker — not sent',
    send_authorized: 'Send authorized — not observed',
    waiting_reply: 'Send observed — awaiting reply',
    reply_observed: 'Reply observed — delivery unconfirmed',
    delivered: 'Delivery acknowledged',
    uncertain: 'Send uncertain — inspect original receipt',
    failed_before_send: 'Failed before send',
    failed_after_send: 'Possible send — review required'
  });
  // Honest gap string — verbatim from apps/mobile-relay/ux/model.mjs:14
  // (NOT_AVAILABLE). Rendered wherever a fixture field set is absent.
  const NOT_AVAILABLE = 'Not available yet — the Host did not send this to the phone.';

  const esc = s => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const clip = (v, n) => {
    const s = String(v ?? '').replace(/\s+/g, ' ').trim();
    return s.length > n ? s.slice(0, n - 1) + '…' : s;
  };
  const plain = v => !!v && typeof v === 'object' && !Array.isArray(v);

  // Read a dotted path off an object; undefined when any hop is missing.
  const at = (obj, path) => path.split('.').reduce((o, k) => (plain(o) || Array.isArray(o)) && k in o ? o[k] : undefined, obj);
  // First defined candidate — tolerates either mockData key spelling for the
  // same SPEC field (e.g. snapshot at .snapshot or .statusObj.snapshot).
  const pick = (md, ...paths) => {
    for (const p of paths) {
      const v = at(md, p);
      if (v !== undefined) return v;
    }
    return undefined;
  };

  // --- fixture loading + fail-closed schema validation (C5) ---
  function fail(msg) { throw new Error('Demo fixture invalid: ' + msg); }

  async function loadJson(url) {
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) throw new Error('Demo fixture fetch failed: ' + url + ' (HTTP ' + res.status + ')');
    try { return await res.json(); } catch (err) { throw new Error('Demo fixture is not JSON: ' + url); }
  }

  function stepFileUrl(file) {
    // C4: fetch only same-origin /demo/*. Reject anything else fail-closed.
    if (typeof file !== 'string' || file.length === 0) fail('step file missing');
    const url = file.startsWith('/') ? file : FIXTURE_BASE + file;
    if (!url.startsWith(FIXTURE_BASE)) fail('step file escapes /demo/fixture/: ' + file);
    return url;
  }

  function validateIndex(index) {
    if (!plain(index)) fail('index.json is not an object');
    if (index.schema !== INDEX_SCHEMA) fail('index schema ' + JSON.stringify(index.schema) + ' !== ' + INDEX_SCHEMA);
    if (typeof index.demoTitle !== 'string' || !index.demoTitle.trim()) fail('demoTitle missing');
    if (!Array.isArray(index.steps) || index.steps.length === 0) fail('steps missing or empty');
    const seen = new Set();
    index.steps.forEach((s, i) => {
      if (!plain(s)) fail('steps[' + i + '] is not an object');
      for (const k of ['itemId', 'screen', 'file']) {
        if (typeof s[k] !== 'string' || !s[k].trim()) fail('steps[' + i + '].' + k + ' missing');
      }
      if (seen.has(s.itemId)) fail('duplicate itemId ' + s.itemId);
      seen.add(s.itemId);
    });
    return index;
  }

  function validateStep(step, indexEntry) {
    if (!plain(step)) fail(indexEntry.itemId + ': step file is not an object');
    if (step.schema !== STEP_SCHEMA) fail(indexEntry.itemId + ': schema ' + JSON.stringify(step.schema) + ' !== ' + STEP_SCHEMA);
    if (step.itemId !== indexEntry.itemId) fail(indexEntry.itemId + ': step itemId mismatch (' + JSON.stringify(step.itemId) + ')');
    if (step.screen !== indexEntry.screen) fail(indexEntry.itemId + ': step screen mismatch (' + JSON.stringify(step.screen) + ')');
    for (const k of ['currentState', 'proposedUpgrade', 'acceptanceQuestion']) {
      if (typeof step[k] !== 'string' || !step[k].trim()) fail(indexEntry.itemId + ': ' + k + ' missing');
    }
    if (!plain(step.mockData)) fail(indexEntry.itemId + ': mockData missing or not an object');
    return step;
  }

  async function loadSteps() {
    const index = validateIndex(await loadJson(INDEX_URL));
    const files = index.steps.map(s => stepFileUrl(s.file));
    const raws = await Promise.all(files.map(f => loadJson(f)));
    const steps = raws.map((raw, i) => validateStep(raw, index.steps[i]));
    return { demoTitle: index.demoTitle, steps };
  }

  // --- per-step mockData views (tolerant field lookup over the SPEC names) ---
  function views(md) {
    const snapshot = pick(md, 'statusObj.snapshot', 'snapshot');
    return {
      ctx: pick(md, 'ctx'),
      commands: pick(md, 'commands'),
      live: pick(md, 'live') ?? pick(snapshot, 'live'),
      bootstrap: pick(md, 'bootstrap') ?? pick(snapshot, 'bootstrap'),
      bridge: pick(md, 'bridge') ?? pick(snapshot, 'bridge'),
      convs: pick(md, 'convs', 'conversations'),
      cmds: pick(md, 'cmds'),
      manifest: pick(md, 'manifest'),
      media: pick(md, 'media'),
      personalAgent: pick(md, 'personalAgent') ?? pick(snapshot, 'personalAgent'),
      worldId: pick(md, 'worldId') ?? pick(snapshot, 'bootstrap.worldId'),
      device: pick(md, 'device'),
      control: pick(md, 'control', 'controlLanguage'),
      plan: pick(md, 'plan', 'planResponse'),
      receipt: pick(md, 'receipt', 'executeReceipt'),
      recent: pick(md, 'recent', 'controlRecent')
    };
  }

  // Message-state label for a live message: fixture-embedded label string
  // verbatim when present (C6), else the canonical LIVE_STATE_LABELS value,
  // else the honest gap (never an invented label).
  function liveLabel(msg) {
    if (!plain(msg)) return NOT_AVAILABLE;
    if (typeof msg.label === 'string' && msg.label.trim()) return msg.label;
    if (typeof msg.state === 'string' && LIVE_STATE_LABELS[msg.state]) return LIVE_STATE_LABELS[msg.state];
    return NOT_AVAILABLE;
  }

  // Flatten a committed vivim.ui surface tree into 'card "title" · text "value"'
  // fragments — every word after the type comes from tree props (C6).
  function flattenTree(tree) {
    const out = [];
    const walk = node => {
      if (!plain(node)) return;
      const props = plain(node.props) ? node.props : {};
      if (node.type === 'card') out.push('card "' + clip(props.title ?? '', 60) + '"');
      else if (node.type === 'text') out.push('text "' + clip(props.value ?? '', 60) + '"');
      else if (node.type === 'button') out.push('button "' + clip(props.label ?? '', 60) + '"');
      else if (typeof node.type === 'string') out.push(node.type);
      if (Array.isArray(node.children)) node.children.forEach(walk);
    };
    walk(tree);
    return out;
  }

  // Flatten bridge counts in canonical order, only over fields present.
  function bridgeText(bridge) {
    if (!plain(bridge)) return null;
    const parts = [];
    for (const k of ['queued', 'claimed', 'done', 'failed']) {
      if (bridge[k] !== undefined) parts.push(k + ' ' + bridge[k]);
    }
    return parts.length ? parts.join(' · ') : null;
  }

  function cmdText(c) {
    if (!plain(c)) return '';
    return clip((c.id ? c.id + ' ' : '') + (c.text ?? c.mode ?? ''), 60) + ' — ' + (c.status ?? 'unknown');
  }

  // Row builders keyed by SPEC itemId. Each returned [label, value] pair carries
  // a comment naming the mockData field(s) it renders (C6 label→field mapping).
  // A row is emitted only when its field set exists; a whole absent section
  // renders the NOT_AVAILABLE gap instead of an invented row.
  const RENDERERS = {
    'tab-today': (md, v) => {
      const rows = [];
      // Connection: ctx.connection + ctx.connectionTone + ctx.paired (surfaceContext app.js:383-411)
      rows.push(v.ctx
        ? ['Connection', clip(v.ctx.connection ?? '', 60) + ' · tone ' + clip(v.ctx.connectionTone ?? '', 20) + ' · ' + (v.ctx.paired ? 'paired' : 'not paired')]
        : ['Connection', NOT_AVAILABLE]);
      // Running rows: snapshot.live.conversations[] → provider id + model + LIVE_STATE_LABELS of messages[0].state
      if (plain(v.live) && v.live.state === 'ok' && Array.isArray(v.live.conversations) && v.live.conversations.length) {
        v.live.conversations.forEach(c => {
          const msg = Array.isArray(c.messages) ? c.messages[0] : null;
          rows.push(['Running', 'Chat · ' + clip(c.provider ?? '', 30) + (c.model ? ' · ' + clip(c.model, 30) : '') + ' · ' + liveLabel(msg)]);
        });
      } else {
        rows.push(['Running', NOT_AVAILABLE]);
      }
      // Needs-you item: commands[] entries with status 'failed' → id + text + status
      if (Array.isArray(v.commands)) {
        v.commands.filter(c => plain(c) && c.status === 'failed')
          .forEach(c => rows.push(['Needs you', cmdText(c)]));
      } else {
        rows.push(['Needs you', NOT_AVAILABLE]);
      }
      // Learning passes: snapshot.bootstrap.progress.passes[] — empty array means no row (C6)
      const passes = at(v.bootstrap ?? {}, 'progress.passes');
      if (Array.isArray(passes) && passes.length) {
        rows.push(['Learning passes', passes.map(p => clip(plain(p) ? (p.pass ?? '') : String(p), 40)).join(' · ')]);
      }
      return rows;
    },

    'tab-talk': (md, v) => {
      const rows = [];
      // Conversations drawer: S.convs[] → id + title + provider + model
      rows.push(Array.isArray(v.convs) && v.convs.length
        ? ['Conversations', v.convs.map(c => clip((plain(c) ? (c.id ?? '') + ' ' : '') + (plain(c) ? (c.title ?? '') : ''), 40) + ' · ' + clip(plain(c) ? c.provider ?? '' : '', 20) + (plain(c) && c.model ? ' · ' + clip(c.model, 20) : '')).join('   ')]
        : ['Conversations', NOT_AVAILABLE]);
      // Thread: S.cmds[0] → target.provider + conversationId + text (user bubble)
      const cmd = Array.isArray(v.cmds) && plain(v.cmds[0]) ? v.cmds[0] : null;
      rows.push(cmd
        ? ['Your message', clip(cmd.text ?? '', 80) + ' · ' + clip(at(cmd, 'target.provider') ?? cmd.provider ?? '', 20) + (cmd.conversationId ? ' · ' + clip(cmd.conversationId, 20) : '')]
        : ['Your message', NOT_AVAILABLE]);
      // Reply badge: snapshot.live.conversations[].messages[0] state → LIVE_STATE_LABELS ('Send observed — awaiting reply')
      const liveConv = plain(v.live) && Array.isArray(v.live.conversations) ? v.live.conversations.find(c => plain(c) && (!cmd || c.id === cmd.conversationId)) ?? (plain(v.live) && Array.isArray(v.live.conversations) ? v.live.conversations[0] : null) : null;
      const msg = liveConv && Array.isArray(liveConv.messages) ? liveConv.messages[0] : null;
      rows.push(['Reply state', liveConv ? liveLabel(msg) : NOT_AVAILABLE]);
      // Provider chips: S.manifest.providers[] → label (or id) + signedIn
      rows.push(plain(v.manifest) && Array.isArray(v.manifest.providers) && v.manifest.providers.length
        ? ['Providers', v.manifest.providers.map(p => clip((plain(p) ? (p.label ?? p.id ?? '') : ''), 20) + (plain(p) && p.signedIn ? ' signed in' : ' not signed in')).join(' · ')]
        : ['Providers', NOT_AVAILABLE]);
      return rows;
    },

    'tab-build': (md, v) => {
      const rows = [];
      // Committed revision: snapshot.bootstrap.uiRevision → surfaceId/revision/parentRevision/changeId/status
      const rev = at(v.bootstrap ?? {}, 'uiRevision');
      rows.push(plain(rev)
        ? ['Committed revision', clip(rev.surfaceId ?? '', 30) + ' r' + rev.revision + (rev.parentRevision != null ? ' ← r' + rev.parentRevision : '') + (rev.changeId ? ' · ' + clip(rev.changeId, 20) : '') + ' · ' + clip(rev.status ?? '', 20)]
        : ['Committed revision', NOT_AVAILABLE]);
      // Committed surface: snapshot.bootstrap.surface.tree → flattened card/text fragments
      const tree = at(v.bootstrap ?? {}, 'surface.tree');
      const flat = tree ? flattenTree(tree) : [];
      rows.push(flat.length ? ['Committed surface', flat.join(' · ')] : ['Committed surface', NOT_AVAILABLE]);
      // Undo: snapshot.bootstrap.undo.available
      const undo = at(v.bootstrap ?? {}, 'undo');
      rows.push(plain(undo) ? ['Undo', undo.available ? 'available' : 'not available'] : ['Undo', NOT_AVAILABLE]);
      // Proposal receipt: commands[] (proposal polling receipt) → id/status/result.applied
      rows.push(Array.isArray(v.commands) && v.commands.length
        ? ['Proposal receipt', v.commands.map(c => cmdText(c) + (plain(c) && plain(c.result) && c.result.applied ? ' · applied' : '')).join('   ')]
        : ['Proposal receipt', NOT_AVAILABLE]);
      return rows;
    },

    'tab-world': (md, v) => {
      const rows = [];
      // Built items: snapshot.bootstrap.surface.tree (committed revision) → flattened fragments
      const tree = at(v.bootstrap ?? {}, 'surface.tree');
      const flat = tree ? flattenTree(tree) : [];
      rows.push(flat.length ? ['What was built', flat.join(' · ')] : ['What was built', NOT_AVAILABLE]);
      // Running: snapshot.live.conversations[] → provider + LIVE_STATE_LABELS
      if (plain(v.live) && Array.isArray(v.live.conversations) && v.live.conversations.length) {
        v.live.conversations.forEach(c => {
          const msg = Array.isArray(c.messages) ? c.messages[0] : null;
          rows.push(['What is running', 'Chat · ' + clip(c.provider ?? '', 30) + (c.model ? ' · ' + clip(c.model, 30) : '') + ' · ' + liveLabel(msg)]);
        });
      } else {
        rows.push(['What is running', NOT_AVAILABLE]);
      }
      // Bridge counts: snapshot.bridge → queued/claimed/done/failed
      rows.push(bridgeText(v.bridge) ? ['Bridge', bridgeText(v.bridge)] : ['Bridge', NOT_AVAILABLE]);
      // Queued commands: commands[] with status queued/failed → id + text + status
      if (Array.isArray(v.commands)) {
        const open = v.commands.filter(c => plain(c) && (c.status === 'queued' || c.status === 'failed'));
        if (open.length) rows.push(['Command queue', open.map(cmdText).join('   ')]);
      } else {
        rows.push(['Command queue', NOT_AVAILABLE]);
      }
      // Undo: snapshot.bootstrap.undo.available
      const undo = at(v.bootstrap ?? {}, 'undo');
      if (plain(undo)) rows.push(['Undo', undo.available ? 'available' : 'not available']);
      // Media library: S.media → state/total/favorites summary + items[] (title/kind/playable/favorite)
      if (plain(v.media)) {
        rows.push(['My Media Library', clip(v.media.state ?? '', 20) + ' · ' + v.media.total + ' tracked · ' + v.media.favorites + ' favorites']);
        if (Array.isArray(v.media.items)) {
          v.media.items.forEach(m => rows.push(['Media', clip(plain(m) ? m.title ?? '' : '', 40) + ' · ' + clip(plain(m) ? m.kind ?? '' : '', 20) + (plain(m) && m.playable ? ' · playable' : '') + (plain(m) && m.favorite ? ' · favorite' : '')]));
        }
      } else {
        rows.push(['My Media Library', NOT_AVAILABLE]);
      }
      return rows;
    },

    'tab-me': (md, v) => {
      const rows = [];
      // Identity: snapshot.personalAgent → agentId/scope/identityAssurance/initialized
      rows.push(plain(v.personalAgent)
        ? ['Personal agent', clip(v.personalAgent.agentId ?? '', 30) + ' · scope ' + clip(v.personalAgent.scope ?? '', 20) + ' · ' + clip(v.personalAgent.identityAssurance ?? '', 20) + ' · initialized ' + (v.personalAgent.initialized ? 'Yes' : 'No')]
        : ['Personal agent', NOT_AVAILABLE]);
      // World: snapshot.bootstrap.worldId
      rows.push(v.worldId !== undefined ? ['World', clip(v.worldId, 30)] : ['World', NOT_AVAILABLE]);
      // Device: S.device.status + S.device.scopes + ctx.mode; no readiness fixture in
      // the SPEC, so no Device readiness row is rendered (C6 / SPEC tab-me mockData).
      rows.push(plain(v.device)
        ? ['Phone connection', clip(v.device.status ?? '', 20) + (Array.isArray(v.device.scopes) && v.device.scopes.length ? ' · scopes ' + v.device.scopes.map(s => clip(s, 20)).join(' · ') : '') + (plain(v.ctx) && v.ctx.mode ? ' · mode ' + clip(v.ctx.mode, 20) : '')]
        : ['Phone connection', NOT_AVAILABLE]);
      // Signed-in AI: S.manifest.providers[] → id + signedIn
      rows.push(plain(v.manifest) && Array.isArray(v.manifest.providers) && v.manifest.providers.length
        ? ['Signed-in AI', v.manifest.providers.map(p => clip(plain(p) ? p.id ?? '' : '', 20) + (plain(p) && p.signedIn ? ' ✓' : ' ✗')).join(' · ')]
        : ['Signed-in AI', NOT_AVAILABLE]);
      // Activity record: commands[] receipts newest-first (updatedAt desc)
      rows.push(Array.isArray(v.commands) && v.commands.length
        ? ['Activity record', v.commands.slice().sort((a, b) => String(plain(b) ? b.updatedAt ?? '' : '').localeCompare(String(plain(a) ? a.updatedAt ?? '' : ''))).map(cmdText).join('   ')]
        : ['Activity record', NOT_AVAILABLE]);
      return rows;
    },

    'tab-control': (md, v) => {
      const rows = [];
      // Catalog chip: control.catalog.actions[] → 'N of N cataloged' + per-action id/title/risk/readiness
      const actions = at(v.control ?? {}, 'catalog.actions');
      if (Array.isArray(actions) && actions.length) {
        rows.push(['Available commands', actions.length + ' of ' + actions.length + ' cataloged · ' + actions.map(a => clip(plain(a) ? (a.id ?? '') + ' ' + (a.title ?? '') : '', 40) + ' · risk ' + clip(plain(a) ? a.risk ?? '' : '', 10) + ' · ' + clip(plain(a) ? a.readiness ?? '' : '', 12)).join('   ')]);
        // Examples: control.catalog.actions[].examples[]
        const ex = actions.filter(a => plain(a) && Array.isArray(a.examples)).flatMap(a => a.examples);
        if (ex.length) rows.push(['Examples', ex.map(e => clip(e, 40)).join(' · ')]);
      } else {
        rows.push(['Available commands', NOT_AVAILABLE]);
      }
      // World themes: control.world.themes[]
      const themes = at(v.control ?? {}, 'world.themes');
      rows.push(Array.isArray(themes) && themes.length ? ['Themes', themes.map(t => clip(t, 20)).join(' · ')] : ['Themes', NOT_AVAILABLE]);
      // Approval card: plan response → outcome/title/args/risk/planDigest/expiresAt
      rows.push(plain(v.plan)
        ? ['Approval card', clip(v.plan.title ?? '', 40) + ' · ' + Object.entries(plain(v.plan.args) ? v.plan.args : {}).map(([k, val]) => k + '=' + clip(val, 20)).join(', ') + ' · risk ' + clip(v.plan.risk ?? '', 10) + ' · Exact plan ' + clip(v.plan.planDigest ?? '', 9) + ' · expires ' + clip(v.plan.expiresAt ?? '', 30) + (v.plan.outcome ? ' · ' + clip(v.plan.outcome, 24) : '')]
        : ['Approval card', NOT_AVAILABLE]);
      // Execute receipt: receipt → status/actionId/planId/at/result/undo
      rows.push(plain(v.receipt)
        ? ['Execute receipt', clip(v.receipt.status ?? '', 16) + ' · ' + clip(v.receipt.actionId ?? '', 20) + ' · plan ' + clip(v.receipt.planId ?? '', 16) + ' · at ' + clip(v.receipt.at ?? '', 30) + (plain(v.receipt.result) ? ' · ' + Object.entries(v.receipt.result).map(([k, val]) => k + '=' + clip(val, 20)).join(', ') : '')]
        : ['Execute receipt', NOT_AVAILABLE]);
      // Undo path: receipt.undo.actionId
      const undo = at(v.receipt ?? {}, 'undo');
      rows.push(plain(undo) ? ['Undo', 'actionId ' + clip(undo.actionId ?? '', 24)] : ['Undo', NOT_AVAILABLE]);
      // Recent Host decisions: control recent items[] → actionId/state/createdAt
      rows.push(plain(v.recent) && Array.isArray(v.recent.items) && v.recent.items.length
        ? ['Recent Host decisions', v.recent.items.map(i => clip(plain(i) ? i.actionId ?? '' : '', 20) + ' — ' + clip(plain(i) ? i.state ?? '' : '', 16) + ' · ' + clip(plain(i) ? i.createdAt ?? '' : '', 30)).join('   ')]
        : ['Recent Host decisions', NOT_AVAILABLE]);
      return rows;
    }
  };

  function rowsFor(step) {
    const render = RENDERERS[step.itemId];
    if (!render) fail('no renderer for itemId ' + step.itemId);
    return render(step.mockData, views(step.mockData));
  }

  // --- walkthrough state: notes, tags, decision per step (C8, mirrors
  // demo/ui-demo/controller.js:115-132 read-validate/save) ---
  const EMPTY = () => ({ notes: '', tags: [], decision: null });
  let state = [];
  function adoptState(n) {
    // Adopt persisted state only when its length matches the loaded step count.
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length === n) {
          state = parsed.map(s => ({
            notes: typeof s.notes === 'string' ? s.notes : '',
            tags: Array.isArray(s.tags) ? s.tags.filter(t => TAGS.includes(t)) : [],
            decision: s.decision == null ? null : (s.decision === 'approve' || s.decision === 'revise' ? s.decision : null)
          }));
          return;
        }
      }
    } catch { /* ignore storage issues */ }
    state = Array.from({ length: n }, EMPTY);
  }
  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* ignore storage issues */ }
  }
  function counts() {
    let approve = 0, revise = 0;
    state.forEach(s => { if (s.decision === 'approve') approve++; else if (s.decision === 'revise') revise++; });
    return { approve, revise };
  }

  // --- DOM (only #demo-* elements, C7) ---
  let shellEl, stripEl, activeEl, progressEl, statusEl, phoneEl, acceptanceEl, feedEl, notesEl, tagsEl;
  let submitBtn, approveAllBtn;
  let demoTitle = '';
  let steps = [];
  let activeIndex = 0;
  let loaded = false;

  function el(id) { return document.getElementById(id); }

  function bindShell() {
    shellEl = el('demo-shell');
    stripEl = el('demo-strip');
    activeEl = el('demo-active');
    progressEl = el('demo-progress');
    statusEl = el('demo-status');
    phoneEl = el('demo-phone');
    acceptanceEl = el('demo-acceptance');
    feedEl = el('demo-feed');
    notesEl = el('demo-notes');
    tagsEl = el('demo-tags');
    submitBtn = el('demo-submit');
    approveAllBtn = el('demo-approve-all');
    if (!shellEl || !stripEl || !activeEl || !progressEl || !statusEl || !phoneEl || !acceptanceEl || !feedEl || !notesEl || !tagsEl || !submitBtn || !approveAllBtn) {
      throw new Error('Demo shell markup missing one or more #demo-* anchors (C7)');
    }
    // Round buttons stay disabled until the fixture loads (or on fail-closed error).
    submitBtn.disabled = true;
    approveAllBtn.disabled = true;
    progressEl.textContent = 'steps —';
    submitBtn.addEventListener('click', () => submitRound(false));
    approveAllBtn.addEventListener('click', () => {
      state.forEach(s => { s.decision = 'approve'; });
      save();
      renderAll();
      submitRound(true);
    });
    notesEl.addEventListener('input', () => {
      if (!loaded) return;
      state[activeIndex].notes = notesEl.value;
      save();
      renderProgress();
    });
  }

  function buildStrip() {
    stripEl.textContent = '';
    steps.forEach((step, i) => {
      const chip = document.createElement('button');
      chip.className = 'demo-step-chip' + (i === activeIndex ? ' current' : '');
      chip.type = 'button';
      chip.setAttribute('role', 'tab');
      chip.setAttribute('aria-selected', i === activeIndex ? 'true' : 'false');
      const dot = document.createElement('span'); dot.className = 'demo-chip-dot';
      const name = document.createElement('span'); name.textContent = step.screen;
      const verdict = document.createElement('span'); verdict.className = 'demo-chip-verdict';
      verdict.textContent = state[i].decision || '—';
      chip.appendChild(dot); chip.appendChild(name); chip.appendChild(verdict);
      chip.addEventListener('click', () => { activeIndex = i; renderAll(); });
      stripEl.appendChild(chip);
    });
  }

  function renderPhone(step) {
    phoneEl.textContent = '';
    for (const [k, v] of rowsFor(step)) {
      const row = document.createElement('div'); row.className = 'phone-row';
      const key = document.createElement('div'); key.className = 'phone-k'; key.textContent = k;
      const val = document.createElement('div'); val.className = 'phone-v'; val.textContent = v;
      row.appendChild(key); row.appendChild(val);
      phoneEl.appendChild(row);
    }
    const banner = document.createElement('div'); banner.className = 'phone-banner';
    banner.textContent = 'Baseline · current view only · no overlays · ' + step.proposedUpgrade;
    phoneEl.appendChild(banner);
  }

  function renderNotes(step) {
    const s = state[activeIndex];
    acceptanceEl.textContent = 'Q: ' + step.acceptanceQuestion;
    feedEl.textContent = JSON.stringify(step.mockData, null, 2);
    notesEl.value = s.notes;
    tagsEl.textContent = '';
    TAGS.forEach(t => {
      const tag = document.createElement('button');
      tag.type = 'button';
      tag.className = 'demo-tag' + (s.tags.includes(t) ? ' on' : '');
      tag.setAttribute('data-tag', t);
      tag.textContent = t;
      tag.addEventListener('click', () => {
        const tags = state[activeIndex].tags;
        const idx = tags.indexOf(t);
        if (idx >= 0) tags.splice(idx, 1);
        else tags.push(t);
        save();
        renderAll();
      });
      tagsEl.appendChild(tag);
    });
    // Decision buttons are rebuilt into #demo-active on each render (below).
  }

  function renderActive() {
    const step = steps[activeIndex];
    const s = state[activeIndex];
    activeEl.textContent = '';
    const head = document.createElement('div'); head.className = 'demo-step-head';
    const headL = document.createElement('div');
    const idSpan = document.createElement('span'); idSpan.className = 'demo-step-id'; idSpan.textContent = step.itemId;
    const h = document.createElement('h2'); h.className = 'heading'; h.textContent = step.screen;
    headL.appendChild(idSpan); headL.appendChild(h);
    const badge = document.createElement('span'); badge.className = 'demo-badge'; badge.textContent = 'baseline · current view · no overlays';
    head.appendChild(headL); head.appendChild(badge);
    activeEl.appendChild(head);

    const stateP = document.createElement('p'); stateP.className = 'body-sm demo-current';
    stateP.textContent = step.currentState;
    activeEl.appendChild(stateP);

    renderPhone(step);
    renderNotes(step);

    const decision = document.createElement('div'); decision.className = 'demo-decision';
    const approve = document.createElement('button');
    approve.type = 'button';
    approve.className = 'demo-btn' + (s.decision === 'approve' ? ' active pri' : '');
    approve.textContent = 'Approve';
    approve.addEventListener('click', () => setDecision('approve'));
    const revise = document.createElement('button');
    revise.type = 'button';
    revise.className = 'demo-btn' + (s.decision === 'revise' ? ' active' : '');
    revise.textContent = 'Revise';
    revise.addEventListener('click', () => setDecision('revise'));
    decision.appendChild(approve); decision.appendChild(revise);
    activeEl.appendChild(decision);
    const chip = document.createElement('span'); chip.className = 'demo-decision-chip';
    chip.textContent = s.decision ? s.decision : '— not decided';
    activeEl.appendChild(chip);
  }

  function setDecision(decision) {
    state[activeIndex].decision = decision;
    save();
    renderAll();
  }

  function renderProgress() {
    const c = counts();
    progressEl.textContent = 'approved ' + c.approve + ' · revise ' + c.revise + ' of ' + steps.length;
  }

  function renderAll() {
    buildStrip();
    renderActive();
    renderProgress();
  }

  function showError(err) {
    // Fail-closed (C5): an error card replaces any partial render. Never show a
    // half-loaded screen or an invented step.
    loaded = false;
    steps = [];
    state = [];
    activeEl.textContent = '';
    phoneEl.textContent = '';
    acceptanceEl.textContent = '';
    feedEl.textContent = '';
    notesEl.value = '';
    tagsEl.textContent = '';
    stripEl.textContent = '';
    const card = document.createElement('div'); card.className = 'demo-error';
    const title = document.createElement('p'); title.className = 'heading'; title.textContent = 'Demo failed to load';
    const body = document.createElement('p'); body.className = 'body-sm'; body.textContent = String(err && err.message ? err.message : err);
    const hint = document.createElement('p'); hint.className = 'body-sm';
    hint.textContent = 'No walkthrough steps were rendered. Fix the fixture and reload.';
    card.appendChild(title); card.appendChild(body); card.appendChild(hint);
    activeEl.appendChild(card);
    progressEl.textContent = 'steps 0';
    statusEl.textContent = 'Fixture error — nothing rendered (fail-closed)';
    submitBtn.disabled = true;
    approveAllBtn.disabled = true;
  }

  function verdicts() {
    return steps.map((step, i) => ({
      itemId: step.itemId,
      screen: step.screen,
      decision: state[i].decision,
      notes: state[i].notes,
      tags: state[i].tags.slice()
    }));
  }

  async function submitRound(approveAll) {
    if (!loaded) return;
    // C8 payload shape (mirrors demo/ui-demo/controller.js:344-362, URL → /demo/feedback).
    const payload = { round: String(Date.now()), approveAll, verdicts: verdicts() };
    statusEl.textContent = 'Submitting…';
    submitBtn.disabled = true;
    approveAllBtn.disabled = true;
    try {
      const res = await fetch(FEEDBACK_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json; charset=utf-8' },
        body: JSON.stringify(payload)
      });
      let stored = null;
      try { stored = await res.json(); } catch { /* non-JSON body → handled below */ }
      if (res.ok && stored) {
        const n = Array.isArray(stored.verdicts) ? stored.verdicts.length : payload.verdicts.length;
        statusEl.textContent = 'Round ' + String(stored.round) + ' submitted (approveAll=' + approveAll + ') · ' + n + ' verdicts';
      } else {
        statusEl.textContent = 'Submit failed (HTTP ' + res.status + ')';
      }
    } catch (err) {
      statusEl.textContent = 'Submit failed: ' + String(err && err.message ? err.message : err);
    } finally {
      submitBtn.disabled = false;
      approveAllBtn.disabled = false;
    }
  }

  async function init() {
    try {
      bindShell();
    } catch (err) {
      // Shell anchors missing — report into whatever anchors do exist, else console.
      console.error(err);
      const any = el('demo-status') || el('demo-active');
      if (any) any.textContent = String(err.message || err);
      return;
    }
    statusEl.textContent = 'Loading fixture…';
    try {
      const loadedSteps = await loadSteps();
      demoTitle = loadedSteps.demoTitle;
      steps = loadedSteps.steps;
      adoptState(steps.length);
      activeIndex = 0;
      loaded = true;
      submitBtn.disabled = false;
      approveAllBtn.disabled = false;
      renderAll();
      statusEl.textContent = '';
    } catch (err) {
      showError(err);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
