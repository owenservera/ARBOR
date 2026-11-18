// First-run welcome and the Start-here page. Pure card content plus a small DOM mount; all text via textContent.
export const WELCOME_KEY = 'vivim.welcome.v1';

const DONE = new Set(['complete', 'done']);
export function learning(bootstrap) {
  const passes = bootstrap?.progress?.passes ?? [];
  const finished = passes.filter(p => DONE.has(p.status)).length;
  const titles = (bootstrap?.cards ?? []).map(c => c.title).filter(Boolean).slice(0, 3);
  let state = 'idle';
  if (passes.length) state = finished === passes.length ? 'done' : passes.some(p => p.status === 'running') ? 'running' : finished ? 'running' : 'waiting';
  return { state, finished, total: passes.length, titles };
}

export function welcomeCards(bootstrap) {
  const l = learning(bootstrap);
  const learned = l.state === 'done'
    ? { title: 'VIVIM has learned your style', body: l.titles.length ? 'So far it picked up: ' + l.titles.join(' · ') + '. You can correct or remove anything in Self.' : 'Your look is set. VIVIM only keeps what it can back up, and leaves the rest blank.' }
    : l.state === 'idle'
      ? { title: 'Your look starts neutral', body: 'Approve personalizing on your PC and VIVIM will shape this app to you in the background. Until then you can pick a look yourself.' }
      : { title: 'VIVIM is learning your style', body: `${l.finished} of ${l.total} questions answered. This runs on your PC in the background; your app updates by itself.` };
  return [
    { id: 'space', eyebrow: 'WELCOME', title: 'This is your space', body: 'Build is where you say what you want in your own words. Talk is a chat with any AI you signed in to. You can use either first.' },
    { id: 'propose', eyebrow: 'HOW IT WORKS', title: 'Your AI proposes. You decide.', body: 'Suggestions show up as dashed drafts. Nothing becomes real until you tap Activate, and Undo puts it back.' },
    { id: 'proof', eyebrow: 'HOW IT WORKS', title: 'Every result is checked', body: 'A teal receipt means your PC saw it happen. If VIVIM is not sure something was sent, it says so and never sends it twice.' },
    { id: 'learned', eyebrow: 'RIGHT NOW', ...learned }
  ];
}

export function mountWelcome({ host, startHost, storage = window.localStorage }) {
  let bootstrap = null, index = 0, lastTourSig = '';
  const seen = () => { try { return storage.getItem(WELCOME_KEY) === '1'; } catch { return true; } };
  const mark = () => { try { storage.setItem(WELCOME_KEY, '1'); } catch { /* the tour may repeat; never blocks */ } };
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };

  function renderTour() {
    const cards = welcomeCards(bootstrap), card = cards[index];
    lastTourSig = JSON.stringify(cards);
    host.replaceChildren();
    const sheet = el('div', 'tour-sheet'); sheet.setAttribute('role', 'dialog'); sheet.setAttribute('aria-modal', 'true'); sheet.setAttribute('aria-labelledby', 'tour-title');
    const title = el('h2', null, card.title); title.id = 'tour-title';
    const dots = el('div', 'tour-dots'); cards.forEach((_, i) => dots.append(el('i', i === index ? 'on' : '')));
    const back = el('button', 'btn', 'Back'); back.type = 'button'; back.hidden = index === 0; back.onclick = () => { index--; renderTour(); };
    const next = el('button', 'btn pri', index === cards.length - 1 ? 'Start building' : 'Next'); next.type = 'button';
    next.onclick = () => { if (index === cards.length - 1) close(true); else { index++; renderTour(); } };
    const skip = el('button', 'tour-skip', 'Skip'); skip.type = 'button'; skip.onclick = () => close(true);
    sheet.append(el('span', 'tour-eyebrow', card.eyebrow), title, el('p', null, card.body), dots, el('div', 'tour-actions', null));
    sheet.lastChild.append(back, next); sheet.append(skip);
    host.append(sheet); host.hidden = false; next.focus();
  }
  function close(done) { if (done) mark(); host.hidden = true; host.replaceChildren(); window.dispatchEvent(new CustomEvent('vivim:tour-closed')); }

  function renderStart() {
    if (!startHost) return;
    startHost.replaceChildren();
    const l = learning(bootstrap);
    const wrap = el('div', 'start-wrap');
    wrap.append(el('span', 'tour-eyebrow', 'START HERE'), el('h2', null, 'Make this app yours'));
    const status = el('div', 'start-status ' + l.state);
    status.append(el('strong', null, l.state === 'done' ? 'Your style is learned' : l.state === 'idle' ? 'Not personalized yet' : 'Learning your style…'),
      el('small', null, l.state === 'idle' ? 'Approve it on your PC (Setup, step 3).' : `${l.finished} of ${l.total} done`));
    wrap.append(status);
    const list = el('ol', 'start-list');
    for (const c of welcomeCards(bootstrap).slice(0, 3)) { const li = el('li'); li.append(el('strong', null, c.title), el('span', null, c.body)); list.append(li); }
    wrap.append(list);
    const replay = el('button', 'btn', 'Replay the welcome'); replay.type = 'button'; replay.onclick = () => { index = 0; renderTour(); };
    wrap.append(replay);
    startHost.append(wrap);
  }

  window.addEventListener('vivim:bootstrap-status', e => {
    bootstrap = e.detail?.snapshot?.bootstrap ?? bootstrap; renderStart();
    // Re-render the open tour only when its content actually changed: replacing the
    // sheet on every status event swaps the clicked button mid-interaction.
    const sig = JSON.stringify(welcomeCards(bootstrap));
    if (!host.hidden && sig !== lastTourSig) renderTour();
  });
  window.addEventListener('vivim:paired', e => { if (e.detail?.paired && !seen()) { index = 0; renderTour(); } });
  renderStart();
  return { open() { index = 0; renderTour(); } };
}
