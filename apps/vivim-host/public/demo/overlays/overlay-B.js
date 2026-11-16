/* DEMO overlay B — Build screen group (SPEC A05).
   Fixture-fed: GET /demo/fixture/tab-build.json, same-origin only; falls back to
   the SPEC-authored mockData when the fixture is absent/unreadable (queue-mode
   steps A01-A08 have no fixtures yet). Renders one screen group into the passed
   #demo-phone/#demo-active slot. Exports mount(slotEl[, step]) / unmount(slotEl).
   No inline script, no cross-origin network. All text from fixture fields or the
   SPEC verbatim; missing Host data renders the honest NOT_AVAILABLE gap. */
(function () {
  'use strict';

  const ITEM_ID = 'A05';
  const SCREEN = 'Build';
  const FIXTURE_URL = '/demo/fixture/tab-build-verify.json';
  const NOT_AVAILABLE = 'Not available yet — the Host did not send this to the phone.';

  const ACCEPTANCE_QUESTION =
    'Does Build show product proof (committed revision + test receipts + commit SHA) after a scoped repair, propose the next batch via the footer next action, and update Running lane queue counts while keeping unattended actions within preauthorized boundaries?';

  const SPEC_CURRENT_STATE =
    'Build applies proposals via sendProposal/onApplied (app.js:1192-1228), renderWorld shows running/queued/queue counts (render.mjs:231-245), nextAction (model.mjs:379-395) and footer (render.mjs:199-205) drive navigation, and goTab (app.js:359-378) switches tabs.';

  // SPEC-authored mockData for A05 (Build). Used when no step is passed and the
  // fixture cannot be read. Nothing here is invented beyond the SPEC.
  const SPEC_MOCKDATA = {
    proposalId: 'prop_001',
    applied: true,
    proof: {
      committedRevision: 9,
      surfaceId: 'vivim.ui-surface/1',
      testReceipts: ['scripts/acceleration/live-host-check.test.mjs'],
      commitSHA: '3dae90c'
    },
    nextBatch: {
      label: 'Build something',
      tab: 'build',
      detail: 'Next scoped repair ready'
    },
    queue: { queued: 1, claimed: 0, done: 4, failed: 0 }
  };

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
    rows.push(['Proposal',
      clip(mockData.proposalId ?? '', 24) + ' · applied ' + (mockData.applied === true ? 'yes' : 'no')]);

    const proof = plain(mockData.proof) ? mockData.proof : null;
    if (proof) {
      rows.push(['Committed revision',
        clip(proof.surfaceId ?? '', 30) + ' r' + proof.committedRevision
        + ' · commit ' + clip(proof.commitSHA ?? '', 12)]);
      if (Array.isArray(proof.testReceipts) && proof.testReceipts.length) {
        rows.push(['Test receipts', proof.testReceipts.map(r => clip(r, 50)).join('   ')]);
      } else {
        rows.push(['Test receipts', NOT_AVAILABLE]);
      }
    } else {
      rows.push(['Committed revision', NOT_AVAILABLE]);
      rows.push(['Test receipts', NOT_AVAILABLE]);
    }

    const next = plain(mockData.nextBatch) ? mockData.nextBatch : null;
    rows.push(['Next batch',
      next ? clip(next.label ?? '', 30) + ' · ' + clip(next.detail ?? '', 60) + ' → ' + clip(next.tab ?? '', 20)
        : NOT_AVAILABLE]);

    const q = plain(mockData.queue) ? mockData.queue : null;
    rows.push(['Running lane queue',
      q ? 'queued ' + q.queued + ' · claimed ' + q.claimed + ' · done ' + q.done + ' · failed ' + q.failed
        : NOT_AVAILABLE]);
    return rows;
  }

  function resolve(step) {
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
    if (!el || el.nodeType !== 1) throw new Error('overlay-B: mount requires a slot element');
    el.textContent = '';
    if (step) {
      renderPanel(el, resolve(step));
      return el;
    }
    fetch(FIXTURE_URL, { method: 'GET' })
      .then(function (res) {
        if (!res.ok) throw new Error('overlay-B fixture fetch failed (HTTP ' + res.status + ')');
        return res.json();
      })
      .then(function (data) {
        if (!plain(data) || !plain(data.mockData)) throw new Error('overlay-B: fixture is not a step');
        renderPanel(el, resolve(data));
      })
      .catch(function (err) {
        renderPanel(el, resolve(null));
      });
    return el;
  }

  function unmount(el) {
    if (el && el.nodeType === 1) el.textContent = '';
  }

  const host = typeof window !== 'undefined' ? window : globalThis;
  host.overlayB = { mount: mount, unmount: unmount };
})();
