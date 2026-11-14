// Contract (converged ledger): same-origin relative fetches only.
  const WIKI_URL = '/api/wiki';
  const SURFACE_URL = '/api/file-surface';
  const ROADMAP_URL = '/api/roadmap';
  const JOURNAL_URL = '/api/journal';
  const MUTATE_URL = '/api/mutate';
  const ACTOR = 'owner-browser';
  const POLL_MS = 1000;

  const content = document.getElementById('content');
  const rev = document.getElementById('rev');
  const editForm = document.getElementById('edit');
  const editTarget = document.getElementById('edit-target');
  const editContent = document.getElementById('edit-content');
  const editSave = document.getElementById('edit-save');
  const editCancel = document.getElementById('edit-cancel');
  const editStatus = document.getElementById('edit-status');
  let editPage = null;
  let editSection = null;
  let currentWikiRevision = 0;
  let editRevision = null;
  let pollTimer = null;

  function esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  function el(tag) { return document.createElement(tag); }

  function sectionEl(page, section, body) {
    const node = el('div');
    node.className = 'section';
    node.dataset.wikiId = page + '/' + section;
    const h = el('h3'); h.textContent = section;
    const b = el('div'); b.className = 'body'; b.textContent = body ?? '';
    const meta = el('div'); meta.className = 'meta'; meta.textContent = 'data-wiki-id=' + node.dataset.wikiId + ' · click to edit';
    node.appendChild(h); node.appendChild(b); node.appendChild(meta);
    node.addEventListener('click', () => openEdit(page, section, body));
    return node;
  }

  function openEdit(page, section, body) {
    editPage = page; editSection = section;
    editRevision = currentWikiRevision;
    editTarget.textContent = page + '/' + section;
    editContent.value = body ?? '';
    editStatus.textContent = '';
    editForm.hidden = false;
  }

  editCancel.addEventListener('click', () => { editForm.hidden = true; editPage = null; editSection = null; });
  editForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (editPage == null || editSection == null) return;
    editSave.disabled = true;
    try {
      const result = await fetch(MUTATE_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-vivim-control': '1' },
        body: JSON.stringify({ schemaVersion: 1, actor: ACTOR, kind: 'wiki-edit', expectedRevision: editRevision, edit: { page: editPage, section: editSection, action: 'set-section', content: editContent.value } })
      });
      if (!result.ok) {
        const failure = await result.text();
        throw new Error('HTTP ' + result.status + ': ' + failure);
      }
      const acknowledged = await result.json();
      editStatus.textContent = 'saved at Wiki revision ' + acknowledged.wikiRevision;
      editForm.hidden = true;
      editPage = null; editSection = null;
      await refresh();
    } catch (err) {
      editStatus.textContent = 'save failed: ' + String(err);
    } finally {
      editSave.disabled = false;
    }
  });

  async function fetchJson(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error('HTTP ' + res.status + ' ' + url);
    return res.json();
  }

  function statusChip(status) {
    const span = el('span');
    span.className = 'status ' + String(status ?? '').replace(/[^a-z0-9]/gi, '-');
    span.textContent = status ?? '—';
    return span;
  }

  function renderRoadmap(roadmap) {
    const block = el('div'); block.className = 'block roadmap';
    const h = el('h2'); h.textContent = 'roadmap'; block.appendChild(h);
    let items = [];
    if (roadmap && Array.isArray(roadmap.buildQueue)) items = roadmap.buildQueue;
    else if (roadmap && roadmap.layers) {
      for (const layer of Object.values(roadmap.layers)) {
        if (Array.isArray(layer)) items = items.concat(layer);
      }
    }
    if (!items.length) { block.appendChild(el('div')).className = 'empty'; block.lastChild.textContent = 'roadmap empty'; return block; }
    const table = el('table');
    const thead = el('thead'); const trh = el('tr');
    ['id', 'status', 'note / title'].forEach((t, i) => { const th = el('th'); th.textContent = t; trh.appendChild(th); });
    thead.appendChild(trh); table.appendChild(thead);
    const tbody = el('tbody');
    for (const it of items) {
      const tr = el('tr');
      const tdId = el('td'); tdId.className = 'id'; tdId.textContent = it.itemId || it.id || '—';
      const tdSt = el('td'); tdSt.appendChild(statusChip(it.status));
      const tdNo = el('td'); tdNo.textContent = it.note || it.title || '';
      tr.appendChild(tdId); tr.appendChild(tdSt); tr.appendChild(tdNo);
      tbody.appendChild(tr);
    }
    table.appendChild(tbody); block.appendChild(table);
    return block;
  }

  function renderFileSurface(surface) {
    const block = el('div'); block.className = 'block';
    const h = el('h2'); h.textContent = 'file surface (reprogrammable)'; block.appendChild(h);
    const records = Array.isArray(surface) ? surface : surface && Array.isArray(surface.records) ? surface.records : [];
    if (!records.length) { block.appendChild(el('div')).className = 'empty'; block.lastChild.textContent = 'file surface empty'; return block; }
    for (const rec of records) {
      const r = el('div'); r.className = 'record';
      const path = el('div'); path.className = 'path'; path.textContent = rec.path ?? '—';
      const surfaceName = el('div'); surfaceName.className = 'surface'; surfaceName.textContent = 'surface: ' + esc(rec.surface ?? '—');
      const tags = el('div'); tags.className = 'tags';
      const commentIds = Array.isArray(rec.commentIds) ? rec.commentIds : rec.comments && Array.isArray(rec.comments) ? rec.comments.map(c => c.id) : [];
      const actionIds = Array.isArray(rec.actionIds) ? rec.actionIds : rec.actions && Array.isArray(rec.actions) ? rec.actions.map(a => a.id) : [];
      if (commentIds.length) { const t = el('span'); t.className = 'tag'; t.textContent = 'comments:' + commentIds.join(','); tags.appendChild(t); }
      if (actionIds.length) { const t = el('span'); t.className = 'tag'; t.textContent = 'nlcl:' + actionIds.join(','); tags.appendChild(t); }
      r.appendChild(path); r.appendChild(surfaceName); r.appendChild(tags);
      block.appendChild(r);
    }
    return block;
  }

  function renderJournal(journal) {
    const block = el('div'); block.className = 'block journal';
    const h = el('h2'); h.textContent = 'journal (live)'; block.appendChild(h);
    const entries = Array.isArray(journal) ? journal : journal && Array.isArray(journal.entries) ? journal.entries : [];
    if (!entries.length) { block.appendChild(el('div')).className = 'empty'; block.lastChild.textContent = 'journal empty'; return block; }
    const table = el('table');
    const thead = el('thead'); const trh = el('tr');
    ['receivedAt', 'round', 'verdicts'].forEach((t) => { const th = el('th'); th.textContent = t; trh.appendChild(th); });
    thead.appendChild(trh); table.appendChild(thead);
    const tbody = el('tbody');
    for (const e of entries.slice(-20)) {
      const tr = el('tr');
      const tdWhen = el('td'); tdWhen.className = 'when'; tdWhen.textContent = e.receivedAt ?? '—';
      const tdRound = el('td'); tdRound.textContent = e.round ?? '—';
      const tdV = el('td');
      const vs = Array.isArray(e.verdicts) ? e.verdicts : [];
      tdV.textContent = vs.length ? vs.map(v => (v.id || v.itemId) + '=' + (v.verdict ?? v.decision ?? '?')).join(', ') : '—';
      tr.appendChild(tdWhen); tr.appendChild(tdRound); tr.appendChild(tdV);
      tbody.appendChild(tr);
    }
    table.appendChild(tbody); block.appendChild(table);
    return block;
  }

  function renderWiki(wiki) {
    const pages = wiki && wiki.pages ? wiki.pages : {};
    const names = Object.keys(pages);
    if (!names.length) { const e = el('div'); e.className = 'empty'; e.textContent = 'wiki is empty — edit it from chat'; return e; }
    const block = el('div'); block.className = 'block';
    const h = el('h2'); h.textContent = 'wiki'; block.appendChild(h);
    for (const name of names) {
      const page = el('div'); page.className = 'page';
      const ph = el('h2'); ph.textContent = name;
      const secs = pages[name]?.sections ?? {};
      const secNames = Object.keys(secs);
      if (!secNames.length) { page.appendChild(ph); const e = el('div'); e.className = 'empty'; e.textContent = 'no sections'; page.appendChild(e); block.appendChild(page); continue; }
      page.appendChild(ph);
      for (const s of secNames) page.appendChild(sectionEl(name, s, secs[s]));
      block.appendChild(page);
    }
    return block;
  }

  async function refresh() {
    try {
      const [wiki, surface, roadmap, journal] = await Promise.all([
        fetchJson(WIKI_URL), fetchJson(SURFACE_URL), fetchJson(ROADMAP_URL), fetchJson(JOURNAL_URL)
      ]);
      currentWikiRevision = Number.isSafeInteger(wiki?.revision) ? wiki.revision : 0;
      rev.textContent = 'wiki rev ' + currentWikiRevision;
      content.replaceChildren(
        renderWiki(wiki),
        renderFileSurface(surface),
        renderRoadmap(roadmap),
        renderJournal(journal)
      );
    } catch (err) {
      rev.textContent = 'api error';
      content.replaceChildren(document.createElement('div')).className = 'empty';
      content.firstChild.textContent = 'wiki surface unavailable: ' + String(err);
    }
  }

  function startPoll() {
    if (pollTimer) return;
    refresh();
    pollTimer = setInterval(refresh, POLL_MS);
  }

  startPoll();
