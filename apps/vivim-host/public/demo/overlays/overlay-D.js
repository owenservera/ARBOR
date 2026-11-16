/* DEMO overlay D — unmappable screen group A01 · A03 · A06 · A07 · A08.
   No fixture exists for these items: renders the honest NOT_AVAILABLE gap
   plus each item's acceptance question verbatim from the SPEC. No screen,
   no mockData, no invented visual change — nothing to accept until the
   mapper assigns a screen with cited inventory evidence. No network. */
(function () {
  'use strict';

  const GROUP = 'A01 · A03 · A06 · A07 · A08';
  const SCREEN = 'unmappable';
  const NOT_AVAILABLE = 'Not available yet — the Host did not send this to the phone.';
  const GAP = 'Unmappable group: no screen or code evidence in the tab inventories exists for queue items A01, A03, A06, A07, A08, so no screen, state, or visual change can be grounded.';
  const UNMAPPED_Q =
    'A08 was marked unmappable by the mapper; what screen, currentState, proposedUpgrade and mockData should this step carry once remapped?';

  const ITEMS = [
    { id: 'A01', q: 'A01 was marked unmappable by the mapper; what screen, currentState, proposedUpgrade and mockData should this step carry once remapped?' },
    { id: 'A03', q: 'A03 was marked unmappable by the mapper; what screen, currentState, proposedUpgrade and mockData should this step carry once remapped?' },
    { id: 'A06', q: 'A06 was marked unmappable by the mapper; what screen, currentState, proposedUpgrade and mockData should this step carry once remapped?' },
    { id: 'A07', q: 'A07 was marked unmappable by the mapper; what screen, currentState, proposedUpgrade and mockData should this step carry once remapped?' },
    { id: 'A08', q: 'A08 was marked unmappable by the mapper; what screen, currentState, proposedUpgrade and mockData should this step carry once remapped?' }
  ];

  function mount(el) {
    if (!el || el.nodeType !== 1) throw new Error('overlay-D: mount requires a slot element');
    el.textContent = '';
    const panel = document.createElement('div');
    panel.className = 'demo-overlay demo-overlay-unmappable';
    const head = document.createElement('div'); head.className = 'demo-overlay-head';
    const id = document.createElement('span'); id.className = 'demo-overlay-id'; id.textContent = GROUP;
    const screen = document.createElement('h2'); screen.className = 'demo-overlay-screen'; screen.textContent = SCREEN;
    head.appendChild(id); head.appendChild(screen);
    panel.appendChild(head);
    const gap = document.createElement('p'); gap.className = 'demo-error'; gap.textContent = NOT_AVAILABLE + ' ' + GAP;
    panel.appendChild(gap);
    ITEMS.forEach(it => {
      const row = document.createElement('div'); row.className = 'phone-row';
      const k = document.createElement('div'); k.className = 'phone-k'; k.textContent = it.id;
      const v = document.createElement('div'); v.className = 'phone-v'; v.textContent = 'unmappable — no screen or inventory evidence assigned';
      row.appendChild(k); row.appendChild(v);
      panel.appendChild(row);
      const q = document.createElement('p'); q.className = 'demo-acceptance'; q.textContent = 'Q: ' + it.q;
      panel.appendChild(q);
    });
    el.appendChild(panel);
    return el;
  }

  function unmount(el) {
    if (el && el.nodeType === 1) el.textContent = '';
  }

  const host = typeof window !== 'undefined' ? window : globalThis;
  host.overlayD = { mount: mount, unmount: unmount };
})();
