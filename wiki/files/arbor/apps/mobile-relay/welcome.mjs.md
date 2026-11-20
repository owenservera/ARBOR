# File: apps/mobile-relay/welcome.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | apps/mobile-relay/welcome.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 5795 B |
| Lines | 80 |
| Hash | aa121e817646 |
| Test | no |
| Generated | no |
| Component | mobile-relay |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| WELCOME_KEY | const | 2 | yes | export const WELCOME_KEY = &#39;vivim.welcome.v1&#39;; |
| DONE | const | 4 | no | const DONE = new Set([&#39;complete&#39;, &#39;done&#39;]); |
| learning | function | 5 | yes | export function learning(bootstrap) { |
| passes | const | 6 | no | const passes = bootstrap?.progress?.passes ?? []; |
| finished | const | 7 | no | const finished = passes.filter(p =&gt; DONE.has(p.status)).length; |
| titles | const | 8 | no | const titles = (bootstrap?.cards ?? []).map(c =&gt; c.title).filter(Boolean).slice(0, 3); |
| state | variable | 9 | no | let state = &#39;idle&#39;; |
| welcomeCards | function | 14 | yes | export function welcomeCards(bootstrap) { |
| l | const | 15 | no | const l = learning(bootstrap); |
| learned | const | 16 | no | const learned = l.state === &#39;done&#39; |
| mountWelcome | function | 29 | yes | export function mountWelcome({ host, startHost, storage = window.localStorage }) { |
| bootstrap | variable | 30 | no | let bootstrap = null, index = 0, lastTourSig = &#39;&#39;; |
| seen | function | 31 | no | const seen = () =&gt; { try { return storage.getItem(WELCOME_KEY) === &#39;1&#39;; } catch { return true; } }; |
| mark | function | 32 | no | const mark = () =&gt; { try { storage.setItem(WELCOME_KEY, &#39;1&#39;); } catch { /* the tour may repeat; never blocks */ } }; |
| el | function | 33 | no | const el = (tag, cls, text) =&gt; { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }; |
| renderTour | function | 35 | no | function renderTour() { |
| cards | const | 36 | no | const cards = welcomeCards(bootstrap), card = cards[index]; |
| sheet | const | 39 | no | const sheet = el(&#39;div&#39;, &#39;tour-sheet&#39;); sheet.setAttribute(&#39;role&#39;, &#39;dialog&#39;); sheet.setAttribute(&#39;aria-modal&#39;, &#39;true&#39;); sheet.setAttribute(&#39;aria-labelledby&#39;, &#39;tour-title&#39;); |
| title | const | 40 | no | const title = el(&#39;h2&#39;, null, card.title); title.id = &#39;tour-title&#39;; |
| dots | const | 41 | no | const dots = el(&#39;div&#39;, &#39;tour-dots&#39;); cards.forEach((_, i) =&gt; dots.append(el(&#39;i&#39;, i === index ? &#39;on&#39; : &#39;&#39;))); |
| back | const | 42 | no | const back = el(&#39;button&#39;, &#39;btn&#39;, &#39;Back&#39;); back.type = &#39;button&#39;; back.hidden = index === 0; back.onclick = () =&gt; { index--; renderTour(); }; |
| next | const | 43 | no | const next = el(&#39;button&#39;, &#39;btn pri&#39;, index === cards.length - 1 ? &#39;Start building&#39; : &#39;Next&#39;); next.type = &#39;button&#39;; |
| skip | const | 45 | no | const skip = el(&#39;button&#39;, &#39;tour-skip&#39;, &#39;Skip&#39;); skip.type = &#39;button&#39;; skip.onclick = () =&gt; close(true); |
| close | function | 50 | no | function close(done) { if (done) mark(); host.hidden = true; host.replaceChildren(); window.dispatchEvent(new CustomEvent(&#39;vivim:tour-closed&#39;)); } |
| renderStart | function | 52 | no | function renderStart() { |
| l | const | 55 | no | const l = learning(bootstrap); |
| wrap | const | 56 | no | const wrap = el(&#39;div&#39;, &#39;start-wrap&#39;); |
| status | const | 58 | no | const status = el(&#39;div&#39;, &#39;start-status &#39; + l.state); |
| list | const | 62 | no | const list = el(&#39;ol&#39;, &#39;start-list&#39;); |
| replay | const | 65 | no | const replay = el(&#39;button&#39;, &#39;btn&#39;, &#39;Replay the welcome&#39;); replay.type = &#39;button&#39;; replay.onclick = () =&gt; { index = 0; renderTour(); }; |
| sig | const | 74 | no | const sig = JSON.stringify(welcomeCards(bootstrap)); |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [apps/mobile-relay/app.js](./app.js.md) | ./welcome.mjs |
| [apps/mobile-relay/test/build-composer.test.mjs](./test/build-composer.test.mjs.md) | ../welcome.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
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
```

_First 80 of 81 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
