// Contract (converged ledger): same-origin relative fetches only.
  const STATE_URL = '/api/state';
  const MUTATE_URL = '/api/mutate';
  const ACTOR = 'owner-browser';
  const POLL_MS = 1500;

  const log = document.getElementById('log');
  const rev = document.getElementById('rev');
  const form = document.getElementById('f');
  const input = document.getElementById('t');
  const sendBtn = document.getElementById('send');
  let pollTimer = null;

  function esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  function outcomeClass(o) { return String(o ?? 'none').replace(/[^a-z0-9]/gi, '-'); }

  function renderIntent(ir) {
    const chips = document.createElement('div');
    chips.className = 'intent';
    const o = document.createElement('span');
    o.className = 'outcome ' + outcomeClass(ir && ir.outcome);
    o.textContent = esc(String(ir && ir.outcome !== undefined ? ir.outcome : 'none'));
    chips.appendChild(o);
    if (ir && ir.canonical) { const c = document.createElement('span'); c.className = 'canonical'; c.textContent = esc(ir.canonical); chips.appendChild(c); }
    if (ir && ir.refusal) { const r = document.createElement('span'); r.textContent = esc(ir.refusal.message ?? ''); chips.appendChild(r); }
    return chips;
  }

  function renderMsg(m) {
    const el = document.createElement('div');
    el.className = 'msg ' + (m.who === 'user' ? 'user' : 'system');
    let intentHtml = '';
    if (m.intent) intentHtml = renderIntent(m.intent).outerHTML;
    el.innerHTML = '<div class="who">' + esc(m.who) + (m.at ? ' · ' + esc(m.at) : '') + '</div><div class="text">' + esc(m.text) + '</div>' + intentHtml;
    return el;
  }

  function renderIntentChip(ir) {
    const el = document.createElement('div');
    el.className = 'msg system';
    el.innerHTML = '<div class="who">intent · ' + esc(new Date().toISOString()) + '</div><div class="text">returned intent IR</div>' + renderIntent(ir).outerHTML;
    return el;
  }

  async function fetchJson(url, init) {
    const res = await fetch(url, init);
    if (!res.ok) throw new Error('HTTP ' + res.status + ' ' + url);
    return res.json();
  }

  async function refresh() {
    try {
      const s = await fetchJson(STATE_URL);
      rev.textContent = 'state rev ' + (s.revision ?? 0) + ' · wiki rev ' + (s.wikiRevision ?? 0);
      const chat = Array.isArray(s.chat) ? s.chat : [];
      if (!chat.length) { log.replaceChildren(document.createElement('div')).className = 'empty'; log.firstChild.textContent = 'chat is empty — send a message'; return; }
      log.replaceChildren(...chat.map(renderMsg));
    } catch (err) {
      rev.textContent = 'state error';
    }
    log.scrollTop = log.scrollHeight;
  }

  function startPoll() {
    if (pollTimer) return;
    refresh();
    pollTimer = setInterval(refresh, POLL_MS);
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    sendBtn.disabled = true;
    try {
      await fetchJson(MUTATE_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ schemaVersion: 1, actor: ACTOR, kind: 'chat-send', text })
      });
      // The refreshed Host state is the only rendered record; no invented optimistic chip.
    } catch (err) {
      log.appendChild(renderMsg({ who: 'system', text: 'send failed: ' + String(err), at: new Date().toISOString() }));
    } finally {
      sendBtn.disabled = false;
      input.focus();
      await refresh();
    }
  });

  startPoll();
