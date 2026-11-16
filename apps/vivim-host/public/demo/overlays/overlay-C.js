/* DEMO overlay C — World screen group (SPEC A02).
   Fixture-fed: GET /demo/fixture/tab-world.json, same-origin only; falls back to
   the SPEC-authored mockData when the fixture is absent/unreadable (queue-mode
   steps A01-A08 have no fixtures yet). Renders one screen group into the passed
   #demo-phone/#demo-active slot. Exports mount(slotEl[, step]) / unmount(slotEl).
   No inline script, no cross-origin network. All text from fixture fields or the
   SPEC verbatim; missing Host data renders the honest NOT_AVAILABLE gap. */
(function () {
  'use strict';

  const ITEM_ID = 'A02';
  const SCREEN = 'World';
  const FIXTURE_URL = '/demo/fixture/tab-world.json';
  const NOT_AVAILABLE = 'Not available yet — the Host did not send this to the phone.';

  const ACCEPTANCE_QUESTION =
    'After an approved Wiki edit and Host refresh, does World show the edit as a new built item under the committed revision, and does undo behave correctly?';

  const SPEC_CURRENT_STATE =
    'World renders "What was built" from the Host revision (surfaceId/revision/status via worldModel/surfaceItems, model.mjs:182-228, surfaceItems model.mjs:53-72), shows running/queued/queue counts and changeHint/undo cue, with v-world panel at index.html:520-521.';

  // SPEC-authored mockData for A02 (World). Top-level revision/built/running/
  // queue/undoAvailable/changeHint (not statusObj.snapshot.bootstrap). Used when
  // no step is passed and the fixture cannot be read.
  const SPEC_MOCKDATA = {
    hostReported: true,
    revision: {
      surfaceId: 'vivim.ui-surface/1',
      revision: 7,
      status: 'committed',
      changeId: 'chg_001',
      parentRevision: 6
    },
    built: [
      { title: 'Wiki page · ARBOR roadmap', detail: 'Approved edit · revision 7' },
      { title: 'Chat journal entry', detail: 'Durable entry · source host-command' }
    ],
    running: [],
    queued: [],
    queue: { queued: 0, claimed: 0, done: 3, failed: 0 },
    undoAvailable: true,
    changeHint: 'Build proposes a change; your PC commits it as a new revision you can undo.',
    empty: false,
    emptyMessage: 'The Host committed revision 7, and it holds no components yet.',
    gaps: []
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
    const rev = plain(mockData.revision) ? mockData.revision : null;
    rows.push(['Committed revision',
      rev ? clip(rev.surfaceId ?? '', 30) + ' r' + rev.revision + ' · ' + clip(rev.status ?? '', 20)
        + (rev.changeId ? ' · ' + clip(rev.changeId, 20) : '')
        + (rev.parentRevision != null ? ' ← r' + rev.parentRevision : '')
        : NOT_AVAILABLE]);

    if (Array.isArray(mockData.built) && mockData.built.length) {
      rows.push(['What was built',
        mockData.built.map(b => clip(plain(b) ? b.title ?? '' : '', 40) + ' · ' + clip(plain(b) ? b.detail ?? '' : '', 60)).join('   ')]);
    } else {
      rows.push(['What was built', NOT_AVAILABLE]);
    }

    if (Array.isArray(mockData.running) && mockData.running.length) {
      rows.push(['What is running', mockData.running.map(r => clip(String(r), 60)).join('   ')]);
    } else {
      rows.push(['What is running', NOT_AVAILABLE]);
    }

    const q = plain(mockData.queue) ? mockData.queue : null;
    rows.push(['Queue',
      q ? 'queued ' + q.queued + ' · claimed ' + q.claimed + ' · done ' + q.done + ' · failed ' + q.failed
        : NOT_AVAILABLE]);

    rows.push(['Undo',
      mockData.undoAvailable === true ? 'available — undo cue exposed' : 'not available']);

    rows.push(['Change hint',
      typeof mockData.changeHint === 'string' && mockData.changeHint.trim()
        ? mockData.changeHint
        : NOT_AVAILABLE]);

    if (mockData.empty === true && typeof mockData.emptyMessage === 'string') {
      rows.push(['Empty', clip(mockData.emptyMessage, 80)]);
    }
    if (Array.isArray(mockData.gaps) && mockData.gaps.length) {
      rows.push(['Gaps', mockData.gaps.map(g => clip(String(g), 60)).join('   ')]);
    }
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
    panel.className = 'demo-overlay demo-overlay-world';
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
    if (!el || el.nodeType !== 1) throw new Error('overlay-C: mount requires a slot element');
    el.textContent = '';
    if (step) {
      renderPanel(el, resolve(step));
      return el;
    }
    fetch(FIXTURE_URL, { method: 'GET' })
      .then(function (res) {
        if (!res.ok) throw new Error('overlay-C fixture fetch failed (HTTP ' + res.status + ')');
        return res.json();
      })
      .then(function (data) {
        if (!plain(data) || !plain(data.mockData)) throw new Error('overlay-C: fixture is not a step');
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
  host.overlayC = { mount: mount, unmount: unmount };
})();
