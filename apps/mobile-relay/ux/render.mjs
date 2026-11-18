// Phone surface rendering: Today, World and Me.
// Text only. Every Host string lands in a text node, never in markup. The only controls are
// navigation and one read ("check again") — no effect, no send and no approval is issued here,
// so nothing on these screens can claim that something happened.

const NOT_AVAILABLE_TITLE = 'Not available yet';

function dom(host) {
  if (host && host.ownerDocument) return host.ownerDocument;
  return typeof document !== 'undefined' ? document : null;
}
function make(doc, tag, cls, text) {
  const node = doc.createElement(tag);
  if (cls) node.className = cls;
  if (text != null) node.textContent = text;
  return node;
}
function card(doc, title) {
  const section = make(doc, 'section', 'ux-card');
  if (title) section.append(make(doc, 'h2', 'ux-card-title', title));
  return section;
}
function rows(doc, items) {
  const list = make(doc, 'dl', 'ux-rows');
  for (const item of items || []) {
    const row = make(doc, 'div', 'ux-row');
    row.append(make(doc, 'dt', 'ux-k', item.label), make(doc, 'dd', 'ux-v', item.value));
    list.append(row);
  }
  return list;
}
function items(doc, entries, options = {}) {
  const list = make(doc, 'ul', 'ux-list');
  for (const entry of entries || []) {
    const row = make(doc, 'li', 'ux-item');
    row.append(make(doc, 'strong', 'ux-item-title', entry.title));
    if (entry.detail) row.append(make(doc, 'span', 'ux-item-detail', entry.detail));
    if (entry.action?.tab && typeof options.onNavigate === 'function' &&
        ['today', 'talk', 'build', 'world', 'me', 'control'].includes(entry.action.tab)) {
      const open = make(doc, 'button', 'btn sm ux-secondary', entry.action.label || 'Open');
      open.type = 'button';
      open.addEventListener('click', () => options.onNavigate(entry.action.tab));
      row.append(open);
    }
    if (entry.jumpTarget && typeof options.onNavigate === 'function') {
      const jump = make(doc, 'button', 'btn sm ux-secondary', 'Jump');
      jump.type = 'button';
      jump.addEventListener('click', () => options.onNavigate('world'));
      row.append(jump);
    }
    list.append(row);
  }
  return list;
}
function gaps(doc, lines) {
  const section = card(doc, NOT_AVAILABLE_TITLE);
  for (const line of lines || []) section.append(make(doc, 'p', 'ux-gap', line));
  return section;
}
function foot(doc, action) {
  const wrap = make(doc, 'div', 'ux-foot');
  const button = make(doc, 'button', 'btn pri ux-primary', action.label);
  button.type = 'button';
  button.addEventListener('click', () => { if (typeof action.onClick === 'function') action.onClick(); });
  wrap.append(button);
  if (action.detail) wrap.append(make(doc, 'p', 'ux-foot-note', action.detail));
  return wrap;
}
function shell(doc) {
  const wrap = make(doc, 'section', 'ux');
  const scroll = make(doc, 'div', 'ux-scroll');
  wrap.append(scroll);
  return { wrap, scroll };
}

/* ---------------- Today ---------------- */

// Connection, what needs the owner, what is running, and one primary next action.
export function renderToday(host, model, options = {}) {
  const doc = dom(host);
  if (!doc || !host || typeof host.replaceChildren !== 'function') return;
  const m = model || {};
  const { wrap, scroll } = shell(doc);

  const connection = card(doc, 'Connection');
  const tone = m.connection?.tone === 'bad' ? 'bad' : m.connection?.tone === 'warn' ? 'warn' : 'ok';
  connection.append(make(doc, 'p', 'ux-conn ux-conn-' + tone, m.connection?.value || 'Connecting…'));
  if (m.connection?.detail) connection.append(make(doc, 'p', 'ux-note', m.connection.detail));
  if (m.hostReported !== true) {
    connection.append(make(doc, 'p', 'ux-note', 'Your PC has not reported yet. Everything below is what this phone already knows.'));
  }
  scroll.append(connection);

  // These are the five already-shipped phone sections, not duplicate pages or
  // claimed live capabilities. Navigation stays local; Host effects remain gated.
  if (typeof options.onNavigate === 'function') {
    const explore = card(doc, 'Explore your VIVIM');
    explore.append(make(doc, 'p', 'ux-note',
      'The same phone interface is available here. Connect your PC to use protected actions.'));
    const shortcuts = make(doc, 'div', 'ux-surface-tiles');
    const routes = [
      ['talk', 'Talk', 'AI conversations and requests'],
      ['build', 'Build', 'Design and preview interfaces'],
      ['world', 'World', 'Things you have built'],
      ['wiki', 'Wiki', 'Host notes, personal tasks and knowledge'],
      ['me', 'Me', 'Your device and preferences'],
      ['control', 'Control', 'Review PC changes']
    ];
    for (const [tab, title, description] of routes) {
      const button = make(doc, 'button', 'ux-surface-tile');
      button.type = 'button';
      button.setAttribute('aria-label', 'Open ' + title);
      button.append(make(doc, 'strong', '', title), make(doc, 'small', '', description));
      button.addEventListener('click', () => {
        options.onNavigate(tab);
      });
      shortcuts.append(button);
    }
    explore.append(shortcuts);
    if (typeof options.onExplore === 'function') {
      const search = make(doc, 'button', 'btn sm ux-secondary', 'Find any feature');
      search.type = 'button';
      search.addEventListener('click', () => options.onExplore());
      explore.append(search);
    }
    if (typeof options.onCapture === 'function') {
      const capture = make(doc, 'button', 'btn sm ux-secondary', 'Quick capture · works offline');
      capture.type = 'button';
      capture.addEventListener('click', () => options.onCapture());
      explore.append(capture);
    }
    if (typeof options.onRecordVoice === 'function') {
      const voice = make(doc,'button','btn sm ux-secondary','Record voice · local only');
      voice.type='button';
      voice.addEventListener('click',()=>options.onRecordVoice());
      explore.append(voice);
    }
    scroll.append(explore);
  }

  // Lane M: one small, truthful mission card over facts already sent by the Host.
  // Details are optional, and no control here can approve or re-execute anything.
  if (m.mission?.schema === 'vivim.mission-card/1') {
    const mission = m.mission;
    const section = card(doc, 'Your request');
    section.append(make(doc, 'strong', 'ux-item-title', mission.title),
      make(doc, 'p', 'ux-note', mission.phase),
      make(doc, 'p', 'ux-item-detail', mission.message));
    if (mission.needsYou) section.append(make(doc, 'p', 'ux-note', 'Needs your attention: ' +
      (mission.action || 'Review this request on your PC.')));
    else section.append(make(doc, 'p', 'ux-note', 'This record requests no action from you right now.'));
    if (mission.outcome?.text) {
      section.append(make(doc, 'strong', 'ux-item-title', mission.outcome.label || 'Result'));
      section.append(make(doc, 'p', 'ux-item-detail', mission.outcome.text));
    }
    const details = make(doc, 'details', 'ux-details');
    details.append(make(doc, 'summary', '', 'Details'));
    details.append(make(doc, 'p', 'ux-note', 'Finish time: not reliably available.'));
    if (mission.progress?.total) details.append(make(doc, 'p', 'ux-note',
      mission.progress.complete + ' of ' + mission.progress.total + ' steps finished.'));
    details.append(make(doc, 'p', 'ux-note',
      'Source: ' + (mission.source === 'host-command' ? 'PC command receipt' : 'PC conversation state') +
      '. An outside effect is not confirmed by this card alone.'));
    section.append(details);
    scroll.append(section);
  }

  if (typeof options.onAskVivim === 'function') {
    const ask = card(doc, 'Ask VIVIM');
    ask.append(make(doc, 'p', 'ux-note', 'Use plain words to check your PC or propose a change. No action runs without the Host contract and approval.'));
    const open = make(doc, 'button', 'btn sm ux-secondary', 'Ask about my PC');
    open.type = 'button';
    open.addEventListener('click', () => options.onAskVivim('show status'));
    ask.append(open);
    scroll.append(ask);
  }

  const attention = card(doc, 'Needs you');
  if ((m.attention || []).length) attention.append(items(doc, m.attention, options));
  else attention.append(make(doc, 'p', 'ux-empty', m.attentionEmpty || 'Nothing needs you right now.'));
  scroll.append(attention);

  if (m.pocketAvailable === true && typeof options.onOpenPocket === 'function') {
    const pocket = card(doc, 'Capture offline');
    pocket.append(make(doc, 'p', 'ux-note', 'Save notes, files, audiobooks or voice directly on this phone, even without your PC. Local captures are not automatically imported.'));
    const open = make(doc, 'button', 'btn sm ux-secondary', 'Open Pocket');
    open.type = 'button';
    open.addEventListener('click', () => options.onOpenPocket());
    pocket.append(open);
    scroll.append(pocket);
  }

  if ((m.running || []).length) {
    const running = card(doc, 'Running');
    running.append(items(doc, m.running));
    scroll.append(running);
  }

  if ((m.gaps || []).length) scroll.append(gaps(doc, m.gaps));

  if (typeof options.onReplay === 'function') {
    const replay = make(doc, 'button', 'btn sm ux-secondary', 'Replay the introduction');
    replay.type = 'button';
    replay.addEventListener('click', () => options.onReplay());
    scroll.append(replay);
  }

  const next = options.nextBatch || m.next || { label: 'Build something', tab: 'build' };
  wrap.append(foot(doc, {
    label: next.label,
    detail: next.detail,
    onClick: () => { if (typeof options.onNavigate === 'function') options.onNavigate(next.tab); }
  }));
  host.replaceChildren(wrap);
}

/* ---------------- World ---------------- */

// The things that exist now: what was built, what is running, what the owner can change.
export function renderWorld(host, model, options = {}) {
  const doc = dom(host);
  if (!doc || !host || typeof host.replaceChildren !== 'function') return;
  const m = model || {};
  const { wrap, scroll } = shell(doc);

  const built = card(doc, 'What was built');
  if (m.revision) {
    const parts = ['Host revision ' + (m.revision.revision ?? '?')];
    if (m.revision.surfaceId) parts.push(m.revision.surfaceId);
    if (m.revision.status) parts.push(m.revision.status);
    built.append(make(doc, 'p', 'ux-meta', parts.join(' · ')));
  }
  if ((m.built || []).length) {
    built.append(items(doc, m.built.map(b => ({ title: b.title, detail: b.detail, jumpTarget: b.jumpTarget }))));
  } else {
    built.append(make(doc, 'p', 'ux-empty', m.emptyMessage || 'Nothing here yet — build something in Build.'));
  }
  scroll.append(built);

  const running = card(doc, 'What is running');
  if ((m.running || []).length) {
    running.append(items(doc, m.running.map(r => ({ title: r.label, detail: r.detail }))));
  } else {
    running.append(make(doc, 'p', 'ux-empty', 'The Host reported no work in flight.'));
  }
  if ((m.queued || []).length) {
    running.append(items(doc, m.queued.map(q => ({ title: q.label, detail: 'Waiting on your PC · ' + q.status }))));
  }
  if (m.queue) {
    const counts = ['queued', 'claimed', 'done', 'failed']
      .filter(k => Number.isFinite(m.queue[k]))
      .map(k => k + ' ' + m.queue[k]);
    if (counts.length) running.append(make(doc, 'p', 'ux-meta', counts.join(' · ')));
  }
  scroll.append(running);

  const media = card(doc, 'My Media Library');
  const library = m.media || { state: 'idle' };
  if (library.state === 'ready') {
    media.append(make(doc, 'p', 'ux-meta',
      String(library.total ?? 0) + ' tracked · ' + String(library.favorites ?? 0) + ' favorites' +
      (library.hasMore ? ' · showing first ' + library.shown : '')));
    const listed = Array.isArray(library.items) ? library.items : [];
    if (listed.length) {
      const rows = make(doc, 'ul', 'ux-list');
      for (const item of listed) {
        const entry = make(doc, 'li', 'ux-item');
        entry.append(make(doc, 'strong', 'ux-item-title', item.title));
        entry.append(make(doc, 'span', 'ux-item-detail',
          (item.favorite ? 'Favorite · ' : '') + item.kind + ' · ' + item.state));
        if (item.playable === true && /^[a-f0-9]{32}$/.test(item.mediaId || '') &&
            typeof options.onPlayMedia === 'function') {
          const play = make(doc, 'button', 'btn sm ux-secondary', 'Play');
          play.type = 'button';
          play.setAttribute('aria-label', 'Play ' + item.title);
          play.addEventListener('click', () => options.onPlayMedia(item.mediaId, item.title));
          entry.append(play);
        } else if (item.state === 'complete') {
          entry.append(make(doc, 'span', 'ux-item-detail',
            'No verified playable file mapped on this PC'));
        }
        rows.append(entry);
      }
      media.append(rows);
    } else media.append(make(doc, 'p', 'ux-empty', 'No tracked movies or shows in the PC library.'));
    media.append(make(doc, 'p', 'ux-note', library.playback === 'available'
      ? 'Stream from your PC over your private Direct connection. Only mapped, verified local files can play.'
      : 'HQ tracks download states, not playable files. The PC owner must configure an explicit playback mapping before Play appears.'));
  } else {
    const messages = {
      idle: 'Checking the owner-approved PC media catalog…',
      loading: 'Reading the media catalog on your PC…',
      'direct-only': 'Connect directly to your paired PC to see your media.',
      'not-authorized': 'This phone needs an approved control:read grant to view media.',
      unavailable: 'The PC media catalog is missing, unavailable or unreadable.'
    };
    media.append(make(doc, 'p', 'ux-empty', messages[library.state] ||
      'The PC has not confirmed its media catalog.'));
    if (library.reason) media.append(make(doc, 'p', 'ux-meta', library.reason));
  }
  if (library.state === 'ready' && typeof options.onMediaPage === 'function' &&
      Number.isSafeInteger(library.total) && library.total > 0) {
    const offset = Number.isSafeInteger(library.offset) ? library.offset : 0;
    const shown = Number.isSafeInteger(library.shown) ? library.shown : 0;
    const pageSize = Number.isSafeInteger(library.pageSize) && library.pageSize > 0
      ? library.pageSize : 25;
    if (offset > 0 || library.hasMore === true) {
      const pager = make(doc, 'div', 'ux-media-pager');
      const previous = make(doc, 'button', 'btn sm ux-secondary', 'Previous');
      previous.type = 'button';
      previous.disabled = offset === 0;
      previous.addEventListener('click', () => {
        if (offset > 0) options.onMediaPage(Math.max(0, offset - pageSize));
      });
      const range = make(doc, 'span', 'ux-meta',
        (shown ? String(offset + 1) + '–' + String(offset + shown) : 'No items') +
        ' of ' + library.total);
      const next = make(doc, 'button', 'btn sm ux-secondary', 'Next');
      next.type = 'button';
      next.disabled = library.hasMore !== true || shown === 0;
      next.addEventListener('click', () => {
        if (library.hasMore === true && shown > 0) options.onMediaPage(offset + shown);
      });
      pager.append(previous, range, next);
      media.append(pager);
    }
  }
  if (typeof options.onRefreshMedia === 'function' && library.state !== 'direct-only') {
    const refresh = make(doc, 'button', 'btn sm ux-secondary', 'Refresh library');
    refresh.type = 'button';
    refresh.addEventListener('click', () => options.onRefreshMedia());
    media.append(refresh);
  }
  scroll.append(media);

  if (typeof options.onAskVivim === 'function') {
    const ask = card(doc, 'Talk to VIVIM');
    ask.append(make(doc, 'p', 'ux-note', 'Ask for a supported Host action in everyday language. Your World is never changed without approval.'));
    const open = make(doc, 'button', 'btn sm ux-secondary', 'What can I ask VIVIM?');
    open.type = 'button'; open.addEventListener('click', () => options.onAskVivim('what can I say?'));
    ask.append(open); scroll.append(ask);
  }

  const change = card(doc, 'What you can change');
  change.append(make(doc, 'p', 'ux-note', m.changeHint || 'Build proposes a change; your PC commits it as a new revision.'));
  if (m.undoAvailable === true) {
    change.append(make(doc, 'p', 'ux-note', 'Your PC reports an undo is available for the current look.'));
  }
  scroll.append(change);

  if ((m.gaps || []).length) scroll.append(gaps(doc, m.gaps));

  wrap.append(foot(doc, {
    label: 'Build something',
    detail: 'Describe what you want; your PC proposes it and you approve it.',
    onClick: () => { if (typeof options.onNavigate === 'function') options.onNavigate('build'); }
  }));
  host.replaceChildren(wrap);
}

/* ---------------- Me ---------------- */

// Identity, phone connection, permissions and the recent activity record the Host returned.
export function renderMe(host, model, options = {}) {
  const doc = dom(host);
  if (!doc || !host || typeof host.replaceChildren !== 'function') return;
  const m = model || {};
  const { wrap, scroll } = shell(doc);

  const identity = card(doc, 'Identity');
  identity.append(rows(doc, m.identity));
  scroll.append(identity);

  const devices = card(doc, 'Phone Connection');
  devices.append(rows(doc, m.devices));
  scroll.append(devices);

  if (typeof options.onAskVivim === 'function') {
    const ask = card(doc, 'Ask about devices');
    ask.append(make(doc, 'p', 'ux-note', 'Review the paired devices and their Host-reported permissions.'));
    const open = make(doc, 'button', 'btn sm ux-secondary', 'Show paired phones');
    open.type = 'button'; open.addEventListener('click', () => options.onAskVivim('show paired phones'));
    ask.append(open); scroll.append(ask);
  }

  const permissions = card(doc, 'Permissions');
  permissions.append(rows(doc, m.permissions));
  scroll.append(permissions);

  if (m.webMemoryNavigation === true && typeof options.onNavigate === 'function') {
    const memory = card(doc, 'Observed web memory');
    memory.append(make(doc, 'p', 'ux-note', 'Browse privacy-filtered PC browsing evidence in Control. A separate device grant is required; missing history remains missing.'));
    const open = make(doc, 'button', 'btn sm ux-secondary', 'Open web memory');
    open.type = 'button';
    open.addEventListener('click', () => options.onNavigate('control'));
    memory.append(open);
    scroll.append(memory);
  }

  if (typeof options.onInstall === 'function') {
    const install = card(doc, 'Install VIVIM');
    install.append(make(doc, 'p', 'ux-note',
      'Your browser says VIVIM can be added to this device. Installation is confirmed by your browser, not by Host.'));
    const action = make(doc, 'button', 'btn sm ux-secondary', 'Install on this device');
    action.type = 'button';
    action.addEventListener('click', () => options.onInstall());
    install.append(action);
    scroll.append(install);
  }

  if (m.readiness?.schema === 'vivim.pwa-readiness/1') {
    const state = card(doc, 'Device readiness');
    state.append(make(doc,'p','ux-note',
      m.readiness.ready + ' of ' + m.readiness.checks.length +
      ' checks ready · ' + m.readiness.actionable + ' need attention. No Host effects run here.'));
    const urgent = m.readiness.checks.filter(c=>c.state==='blocked'||c.state==='attention');
    if (urgent.length) {
      const urgentList = make(doc,'ul','ux-list');
      for(const c of urgent.slice(0,4)){
        const line = make(doc,'li','ux-item');
        line.append(make(doc,'strong','ux-item-title',c.label),
          make(doc,'span','ux-item-detail',c.detail));
        urgentList.append(line);
      }
      state.append(urgentList);
    }
    const all = make(doc,'details','ux-details');
    all.append(make(doc,'summary','','All ' + m.readiness.checks.length + ' checks'));
    for(const c of m.readiness.checks){
      const line = make(doc,'p','ux-note',c.label+' · '+c.state+' — '+c.detail);
      all.append(line);
    }
    state.append(all);
    const tools = make(doc,'div','readiness-actions');
    if(typeof options.onCheckReadiness==='function'){
      const check = make(doc,'button','btn sm ux-secondary','Check connection');
      check.type='button';check.addEventListener('click',()=>options.onCheckReadiness());
      tools.append(check);
    }
    if(typeof options.onCopyReadiness==='function'){
      const copy = make(doc,'button','btn sm ux-secondary','Copy safe report');
      copy.type='button';copy.addEventListener('click',()=>options.onCopyReadiness());
      tools.append(copy);
    }
    state.append(tools);
    scroll.append(state);
  }

  const activity = card(doc, 'Activity Record');
  if ((m.activity?.rows || []).length) {
    activity.append(items(doc, m.activity.rows.map(r => ({
      title: r.label,
      detail: r.status + (r.at ? ' · ' + r.at : '')
    }))));
  } else {
    activity.append(make(doc, 'p', 'ux-empty', m.activity?.emptyMessage || 'Not available yet — the Host has returned no receipts to this phone.'));
  }
  scroll.append(activity);

  if ((m.gaps || []).length) scroll.append(gaps(doc, m.gaps));

  wrap.append(foot(doc, {
    label: 'Check again',
    detail: 'Read the current state from your PC. Nothing is changed.',
    onClick: () => { if (typeof options.onRefresh === 'function') options.onRefresh(); }
  }));
  host.replaceChildren(wrap);
}
