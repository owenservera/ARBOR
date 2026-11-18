/* DEMO overlay A — Build screen group (SPEC A04).
   Fixture-fed: GET /demo/fixture/tab-build.json, same-origin only; falls back to
   the SPEC-authored mockData when the fixture is absent/unreadable (queue-mode
   steps A01-A08 have no fixtures yet). Renders one screen group into the passed
   #demo-phone/#demo-active slot. Exports mount(slotEl[, step]) / unmount(slotEl).
   No inline script, no cross-origin network. All text from fixture fields or the
   SPEC verbatim; missing Host data renders the honest NOT_AVAILABLE gap. */
(function () {
  'use strict';

  const ITEM_ID = 'A04';
  const SCREEN = 'Build';
  const FIXTURE_URL = '/demo/fixture/tab-build.json';
  const NOT_AVAILABLE = 'Not available yet — the Host did not send this to the phone.';

  const ACCEPTANCE_QUESTION =
    'Does Build render each of the three intents as a guarded proposal (is-done/is-error), refuse to publish when stale or unapproved, and navigate to World for \'open the wiki\' without introducing a second visual publisher?';

  // SPEC-authored mockData for A04 (Build). Used when no step is passed and the
  // fixture cannot be read. Nothing here is invented beyond the SPEC.
  const SPEC_MOCKDATA = {
    intent: 'show ARBOR progress projection',
    compiled: {
      kind: 'visual-update',
      surfaceId: 'vivim.ui-surface/1',
      revision: 8,
      guarded: true,
      publishable: false,
      reason: 'pending owner approval'
    },
    proposal: {
      status: 'pending',
      preview: 'ARBOR progress projection · source-backed revision 8',
      state: 'is-done'
    },
    approvalRequired: true
  };

  const SPEC_CURRENT_STATE =
    'Build tab switches via renderTabs/goTab (app.js:359-378), mounts the build surface via mountBuild/mountCompose/sendProposal/onApplied (app.js:1192-1228), and proposal CSS .proposal.is-done/.is-error/.proposal-preview exists at index.html:170-174.';

  const clip = (v, n) => {
    const s = String(v ?? '').replace(/\s+/g, ' ').trim();
    return s.length > n ? s.slice(0, n - 1) + '…' : s;
  };
  const plain = v => !!v && typeof v === 'object' && !Array.isArray(v);
  const at = (obj, path) => path.split('.').reduce((o, k) => (o != null && typeof o === 'object' && k in o) ? o[k] : undefined, obj);

  // Rows rendered strictly from the step fixture: a row exists only when a
  // fixture field produced it; missing Host data renders the honest gap.
  function buildRows(mockData) {
    const rows = [];
    const intent = typeof mockData.intent === 'string' && mockData.intent.trim()
      ? mockData.intent
      : undefined;
    rows.push(['Intent', intent !== undefined ? intent : NOT_AVAILABLE]);

    const compiled = plain(mockData.compiled) ? mockData.compiled : null;
    if (compiled) {
      rows.push(['Compiled',
        clip(compiled.kind ?? '', 20) + ' · ' + clip(compiled.surfaceId ?? '', 30) + ' r' + compiled.revision
        + ' · guarded ' + compiled.guarded + ' · publishable ' + compiled.publishable
        + (compiled.reason ? ' · ' + clip(compiled.reason, 40) : '')]);
    } else {
      rows.push(['Compiled', NOT_AVAILABLE]);
    }

    const proposal = plain(mockData.proposal) ? mockData.proposal : null;
    if (proposal) {
      rows.push(['Proposal',
        clip(proposal.status ?? '', 20) + ' · ' + clip(proposal.preview ?? '', 60) + ' · ' + clip(proposal.state ?? '', 16)]);
    } else {
      rows.push(['Proposal', NOT_AVAILABLE]);
    }

    rows.push(['Approval required',
      mockData.approvalRequired === true ? 'yes — publish blocked until owner approves' : 'no']);
    return rows;
  }

  function resolve(step) {
    // Caller-fed step wins; otherwise the embedded SPEC mockData.
    const md = step && plain(step.mockData) ? step.mockData : SPEC_MOCKDATA;
    const state = step && typeof step.currentState === 'string' ? step.currentState : SPEC_CURRENT_STATE;
    const question = step && typeof step.acceptanceQuestion === 'string' ? step.acceptanceQuestion : ACCEPTANCE_QUESTION;
    const id = step && typeof step.itemId === 'string' ? step.itemId : ITEM_ID;
    const screen = step && typeof step.screen === 'string' ? step.screen : SCREEN;
    return { id, screen, state, question, md };
  }

  function renderPanel(el, s) {
    el.textContent = '';
    const panel = document.createElement('div');
    panel.className = 'demo-overlay demo-overlay-build';
    const head = document.createElement('div'); head.className = 'demo-overlay-head';
    const id = document.createElement('span'); id.className = 'demo-overlay-id'; id.textContent = s.id;
    const screen = document.createElement('h2'); screen.className = 'demo-overlay-screen'; screen.textContent = s.screen;
    head.appendChild(id); head.appendChild(screen);
    panel.appendChild(head);
    const state = document.createElement('p'); state.className = 'demo-current'; state.textContent = s.state;
    panel.appendChild(state);
    buildRows(s.md).forEach(pair => {
      const row = document.createElement('div'); row.className = 'phone-row';
      const k = document.createElement('div'); k.className = 'phone-k'; k.textContent = pair[0];
      const v = document.createElement('div'); v.className = 'phone-v'; v.textContent = pair[1];
      row.appendChild(k); row.appendChild(v);
      panel.appendChild(row);
    });
    const acc = document.createElement('p'); acc.className = 'demo-acceptance'; acc.textContent = 'Q: ' + s.question;
    panel.appendChild(acc);
    el.appendChild(panel);
  }

  function mount(el, step) {
    if (!el || el.nodeType !== 1) throw new Error('overlay-A: mount requires a slot element');
    el.textContent = '';
    if (step) {
      renderPanel(el, resolve(step));
      return el;
    }
    fetch(FIXTURE_URL, { method: 'GET' })
      .then(function (res) {
        if (!res.ok) throw new Error('overlay-A fixture fetch failed (HTTP ' + res.status + ')');
        return res.json();
      })
      .then(function (data) {
        if (!plain(data) || !plain(data.mockData)) throw new Error('overlay-A: fixture is not a step');
        renderPanel(el, resolve(data));
      })
      .catch(function (err) {
        // Fixture absent for queue-mode steps: render the SPEC-authored data as
        // an honest fallback rather than inventing transport state.
        renderPanel(el, resolve(null));
      });
    return el;
  }

  function unmount(el) {
    if (el && el.nodeType === 1) el.textContent = '';
  }

  const host = typeof window !== 'undefined' ? window : globalThis;
  host.overlayA = { mount: mount, unmount: unmount };
})();
