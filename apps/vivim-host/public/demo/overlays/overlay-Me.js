/* DEMO overlay Me — Me screen group (SPEC tab-me).
   Fixture-fed: GET /demo/fixture/tab-me.json, same-origin only.
   Renders one screen group into the passed #demo-phone/#demo-active slot.
   Exports mount(slotEl[, step]) / unmount(slotEl). No inline script, no cross-origin network. */
(function () {
  'use strict';

  const ITEM_ID = 'tab-me';
  const SCREEN = 'Me';
  const FIXTURE_URL = '/demo/fixture/tab-me.json';
  const NOT_AVAILABLE = 'Not available yet — the Host did not send this to the phone.';

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
    const snapshot = at(mockData, 'statusObj.snapshot') || at(mockData, 'snapshot') || {};
    const personalAgent = at(mockData, 'personalAgent') ?? at(snapshot, 'personalAgent');
    const worldId = at(mockData, 'worldId') ?? at(snapshot, 'bootstrap.worldId');
    const device = at(mockData, 'device');
    const ctx = at(mockData, 'ctx');
    const manifest = at(mockData, 'manifest');

    // Identity: personalAgent → agentId/scope/identityAssurance/initialized
    rows.push(plain(personalAgent)
      ? ['Personal agent', clip(personalAgent.agentId ?? '', 30) + ' · scope ' + clip(personalAgent.scope ?? '', 20) + ' · ' + clip(personalAgent.identityAssurance ?? '', 20) + ' · initialized ' + (personalAgent.initialized === true ? 'Yes' : 'No')]
      : ['Personal agent', NOT_AVAILABLE]);

    // World: bootstrap.worldId
    rows.push(worldId !== undefined ? ['World', clip(worldId, 30)] : ['World', NOT_AVAILABLE]);

    // Phone connection: device.status + device.scopes + ctx.mode
    rows.push(plain(device)
      ? ['Phone connection', clip(device.status ?? '', 20) + (Array.isArray(device.scopes) && device.scopes.length ? ' · scopes ' + device.scopes.map(s => clip(s, 20)).join(' · ') : '') + (plain(ctx) && ctx.mode ? ' · mode ' + clip(ctx.mode, 20) : '')]
      : ['Phone connection', NOT_AVAILABLE]);

    // Signed-in AI: manifest.providers[] → id + signedIn
    rows.push(plain(manifest) && Array.isArray(manifest.providers) && manifest.providers.length
      ? ['Signed-in AI', manifest.providers.map(p => clip(plain(p) ? p.id ?? '' : '', 20) + (plain(p) && p.signedIn === true ? ' ✓' : ' ✗')).join(' · ')]
      : ['Signed-in AI', NOT_AVAILABLE]);

    // Activity record: commands[] receipts newest-first (updatedAt desc)
    if (Array.isArray(mockData.commands) && mockData.commands.length) {
      const ordered = mockData.commands.slice().sort((a, b) => String(plain(b) ? b.updatedAt ?? '' : '').localeCompare(String(plain(a) ? a.updatedAt ?? '' : '')));
      rows.push(['Activity record', ordered.map(c => clip((c.id ? c.id + ' ' : '') + (c.text ?? c.mode ?? ''), 60) + ' — ' + clip(c.status ?? 'unknown', 16) + ' · ' + clip(c.updatedAt ?? '', 30)).join('   ')]);
    } else {
      rows.push(['Activity record', NOT_AVAILABLE]);
    }
    return rows;
  }

  function mount(el, step) {
    if (!el || el.nodeType !== 1) throw new Error('overlay-Me: mount requires a slot element');
    el.textContent = '';
    function render(s) {
      const panel = document.createElement('div');
      panel.className = 'demo-overlay demo-overlay-me';
      const head = document.createElement('div'); head.className = 'demo-overlay-head';
      const id = document.createElement('span'); id.className = 'demo-overlay-id'; id.textContent = s.itemId;
      const screen = document.createElement('h2'); screen.className = 'demo-overlay-screen'; screen.textContent = s.screen;
      head.appendChild(id); head.appendChild(screen);
      panel.appendChild(head);
      const state = document.createElement('p'); state.className = 'demo-current'; state.textContent = s.currentState;
      panel.appendChild(state);
      buildRows(s.mockData).forEach(pair => {
        const row = document.createElement('div'); row.className = 'phone-row';
        const k = document.createElement('div'); k.className = 'phone-k'; k.textContent = pair[0];
        const v = document.createElement('div'); v.className = 'phone-v'; v.textContent = pair[1];
        row.appendChild(k); row.appendChild(v);
        panel.appendChild(row);
      });
      const acc = document.createElement('p'); acc.className = 'demo-acceptance'; acc.textContent = 'Q: ' + s.acceptanceQuestion;
      panel.appendChild(acc);
      el.appendChild(panel);
    }
    if (step) { render(step); return el; }
    fetch(FIXTURE_URL, { method: 'GET' })
      .then(function (res) {
        if (!res.ok) throw new Error('overlay-Me fixture fetch failed (HTTP ' + res.status + ')');
        return res.json();
      })
      .then(function (data) {
        if (!plain(data) || data.itemId !== ITEM_ID) throw new Error('overlay-Me: fixture itemId mismatch');
        render(data);
      })
      .catch(function (err) {
        const gap = document.createElement('p'); gap.className = 'demo-error';
        gap.textContent = NOT_AVAILABLE + ' (' + String(err && err.message ? err.message : err) + ')';
        el.appendChild(gap);
      });
    return el;
  }

  function unmount(el) {
    if (el && el.nodeType === 1) el.textContent = '';
  }

  const host = typeof window !== 'undefined' ? window : globalThis;
  host.overlayMe = { mount: mount, unmount: unmount };
})();
