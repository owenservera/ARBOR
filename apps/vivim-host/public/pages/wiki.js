// Host read-model only. The Wiki UI does not interpret NL, compile VEC, or publish effects.
// VEC/0.1 typed display seam: {schema:'vivim.vec-compile/0.1', domain:'wiki',
// product:'wiki-projection', outcome:'unsupported', code:'LEGACY_OWNER_NOT_MIGRATED',
// authorization:'none', executed:false, persisted:false}. No adapter is installed here.
const SOURCES = Object.freeze({
  wiki: { url: '/api/wiki', path: 'Host product journal → Wiki projection' },
  state: { url: '/api/state', path: 'Host product journal → chat state projection' },
  roadmap: { url: '/api/roadmap', path: 'docs/product/roadmap/roadmap.v1.json (keeper-owned)' },
  surface: { url: '/api/file-surface', path: 'data/demo-baseline/file-surface.v1.json (stage A)' },
  journal: { url: '/api/journal', path: 'Host data-root/product-state/journal.jsonl' }
});
const ACTOR = 'owner-browser';
const POLL_MS = 1600;
const MAX_ENTRY_BYTES = 4096;
const $ = id => document.getElementById(id);
const snapshots = Object.create(null);
let editSession = null;
let refreshing = false;
let busy = false;

function element(tag, className, text) {
  const result = document.createElement(tag);
  if (className) result.className = className;
  if (text !== undefined) result.textContent = String(text);
  return result;
}
function present(value, fallback = '—') { return value === undefined || value === null ? fallback : String(value); }
function statusChip(status) {
  const value = present(status, 'unknown');
  const chip = element('span', 'status ' + value.replace(/[^a-z0-9]/gi, '-'), value);
  return chip;
}
function isWikiDocument(wiki) {
  return wiki && Number.isSafeInteger(wiki.revision) && wiki.revision >= 0 &&
    wiki.pages && typeof wiki.pages === 'object' && !Array.isArray(wiki.pages);
}
function entriesOf(journal) {
  return Array.isArray(journal) ? journal : Array.isArray(journal?.entries) ? journal.entries : [];
}
function fileRecords(surface) {
  // The committed vivim.file-surface/1 Stage-A registry uses `files`, not `records`.
  return Array.isArray(surface?.files) ? surface.files :
    Array.isArray(surface?.records) ? surface.records : Array.isArray(surface) ? surface : [];
}
function sourceRecord(key) { return snapshots[key]?.data; }
function observedEdit(page, section, content) {
  const journal = sourceRecord('journal');
  if (!journal) return 'provenance not observed';
  const matched = entriesOf(journal).some(entry => entry?.kind === 'wiki-edit' &&
    entry.edit?.page === page && entry.edit?.section === section && entry.edit?.content === content);
  return matched ? 'journal-backed edit observed' : 'seed / no edit record observed';
}
function sectionEl(page, section, text, revision) {
  const wrapper = element('article', 'section');
  wrapper.dataset.wikiId = page + '/' + section;
  wrapper.dataset.revision = String(revision);
  const head = element('div', 'section-head');
  head.appendChild(element('h4', '', section));
  const edit = element('button', '', 'Edit');
  edit.type = 'button';
  edit.setAttribute('aria-label', `Edit Wiki section ${page}/${section}`);
  edit.addEventListener('click', () => openEdit(page, section, text, revision));
  head.appendChild(edit);
  wrapper.appendChild(head);
  wrapper.appendChild(element('p', 'body', text));
  wrapper.appendChild(element('div', 'meta', `data-wiki-id=${page}/${section} · Wiki rev ${revision} · ${observedEdit(page, section, text)}`));
  return wrapper;
}
function renderWiki(wiki) {
  const root = element('div', 'stack');
  const pages = Object.entries(wiki.pages || {});
  if (!pages.length) return element('p', 'empty', 'No Wiki pages in the Host projection.');
  for (const [name, page] of pages) {
    const card = element('section', 'page');
    card.appendChild(element('h3', '', name));
    const sections = Object.entries(page?.sections || {});
    if (!sections.length) card.appendChild(element('p', 'empty', 'No sections.'));
    for (const [section, body] of sections) card.appendChild(sectionEl(name, section, present(body, ''), wiki.revision));
    root.appendChild(card);
  }
  return root;
}
function renderRoadmap(roadmap) {
  const root = element('div');
  const items = Array.isArray(roadmap?.buildQueue) ? roadmap.buildQueue : [];
  if (!items.length) return element('p', 'empty', 'No canonical buildQueue records returned; no synthetic queue substituted.');
  const active = items.filter(item => item.status === 'in-progress').length;
  const accepted = items.filter(item => item.ownerAcceptance === 'ACCEPTED').length;
  root.appendChild(element('p', 'queue-summary', `${items.length} canonical work orders · ${active} in progress · ${accepted} owner-accepted`));
  const scroll = element('div', 'table-scroll');
  const table = element('table');
  const head = element('thead');
  const hr = element('tr');
  for (const col of ['ID', 'Status', 'Verification / acceptance', 'Work / dependencies']) hr.appendChild(element('th', '', col));
  head.appendChild(hr);
  table.appendChild(head);
  const body = element('tbody');
  for (const item of items) {
    const row = element('tr');
    row.appendChild(element('td', '', item.itemId || item.id || '—'));
    const status = element('td'); status.appendChild(statusChip(item.status)); row.appendChild(status);
    row.appendChild(element('td', '', `${present(item.verification, 'unreported')} / ${present(item.ownerAcceptance, 'unreported')}`));
    row.appendChild(element('td', '', `${present(item.note, item.title || '')}${item.dependsOn?.length ? ` · needs ${item.dependsOn.join(', ')}` : ''}`));
    body.appendChild(row);
  }
  table.appendChild(body);
  scroll.appendChild(table);
  root.appendChild(scroll);
  return root;
}
function renderFileSurface(surface) {
  const root = element('div');
  const records = fileRecords(surface);
  root.appendChild(element('p', 'queue-summary', `${records.length} indexed files · ${present(surface?.generatorVersion, 'generator not identified')} · generated registry, not executable capability`));
  if (!records.length) { root.appendChild(element('p', 'empty', 'No source-index records returned.')); return root; }
  for (const record of records.slice(0, 16)) {
    const details = element('details', 'record');
    details.appendChild(element('summary', '', present(record.path)));
    details.appendChild(element('p', 'body', present(record.surface, 'No description.')));
    details.appendChild(element('p', 'record-meta',
      `sourceDigest=${present(record.sourceDigest, 'unprovided')} · comments=${(record.commentIds || []).length} · actions=${(record.actionIds || []).length}`));
    root.appendChild(details);
  }
  if (records.length > 16) root.appendChild(element('p', 'empty', `Showing 16/${records.length} source records.`));
  return root;
}
function renderJournal(journal) {
  const root = element('div');
  const entries = entriesOf(journal);
  root.appendChild(element('p', 'queue-summary', `${entries.length} append records observed · newest 12 shown · not an acceptance receipt`));
  if (!entries.length) { root.appendChild(element('p', 'empty', 'Journal empty; seed Wiki may still be visible.')); return root; }
  const scroll = element('div', 'table-scroll');
  const table = element('table');
  const head = element('thead'); const hr = element('tr');
  for (const col of ['Received', 'Kind / actor', 'Reference / revision']) hr.appendChild(element('th', '', col));
  head.appendChild(hr); table.appendChild(head);
  const body = element('tbody');
  for (const entry of entries.slice(-12).reverse()) {
    const row = element('tr');
    row.appendChild(element('td', '', present(entry.receivedAt)));
    row.appendChild(element('td', '', `${present(entry.kind, 'demo-verdict')} · ${present(entry.actor, 'demo')}`));
    const ref = entry.kind === 'wiki-edit' ? `${present(entry.edit?.page)}/${present(entry.edit?.section)}` :
      entry.kind === 'chat-send' ? 'chat message (text not displayed)' : present(entry.round, '—');
    row.appendChild(element('td', '', `${ref} · product rev ${present(entry.revision, '—')} · Wiki rev ${present(entry.wikiRevision, '—')}`));
    body.appendChild(row);
  }
  table.appendChild(body); scroll.appendChild(table); root.appendChild(scroll);
  return root;
}
function linesDiff(before, after) {
  const a = String(before).split('\n'), b = String(after).split('\n');
  let start = 0;
  while (start < a.length && start < b.length && a[start] === b[start]) start++;
  let end = 0;
  while (end < a.length - start && end < b.length - start && a[a.length - end - 1] === b[b.length - end - 1]) end++;
  const removed = a.slice(start, a.length - end), added = b.slice(start, b.length - end);
  if (!removed.length && !added.length) return 'No content change.';
  const out = [];
  if (start) out.push(`  ${start} unchanged line(s) above`);
  for (const line of removed.slice(0, 40)) out.push('- ' + line);
  if (removed.length > 40) out.push(`- … ${removed.length - 40} more removed line(s)`);
  for (const line of added.slice(0, 40)) out.push('+ ' + line);
  if (added.length > 40) out.push(`+ … ${added.length - 40} more added line(s)`);
  if (end) out.push(`  ${end} unchanged line(s) below`);
  return out.join('\n');
}
function mutationEnvelope(session, revision, text) {
  return { schemaVersion: 1, actor: ACTOR, kind: 'wiki-edit', expectedRevision: revision,
    edit: { page: session.page, section: session.section, action: 'set-section', content: text } };
}
function bytesOf(value) { return new TextEncoder().encode(JSON.stringify(value)).byteLength; }
function setEditorStatus(message) { $('edit-status').textContent = message; }
function closeEditor() {
  if (busy) return;
  editSession = null;
  $('edit-shell').hidden = true;
  $('edit-preview').hidden = true;
  $('edit-save').hidden = true;
  $('edit-rebase').hidden = true;
}
function invalidatePreview(message = 'Draft changed. Review again before sending.') {
  if (!editSession || editSession.acknowledged) return;
  editSession.preview = null;
  $('edit-preview').hidden = true;
  $('edit-save').hidden = true;
  setEditorStatus(message);
}
function openEdit(page, section, text, revision) {
  if (editSession) { setEditorStatus('Close the current editor before switching sections; your draft is preserved.'); $('edit-content').focus(); return; }
  editSession = { page, section, original: text, revision, preview: null, acknowledged: null };
  $('edit-target').textContent = `${page}/${section}`;
  $('edit-rev').textContent = `opening Wiki rev ${revision}`;
  $('edit-content').value = text;
  $('edit-content').disabled = false;
  $('edit-review').hidden = false;
  $('edit-preview').hidden = true;
  $('edit-save').hidden = true;
  $('edit-rebase').hidden = true;
  $('edit-shell').hidden = false;
  setEditorStatus('Edit a bounded existing section, then review against a fresh Host revision. No changes sent yet.');
  $('edit-content').focus();
}
function markStale(revision) {
  if (!editSession || editSession.acknowledged) return;
  editSession.preview = null;
  $('edit-save').hidden = true;
  $('edit-rebase').hidden = false;
  setEditorStatus(`Stale revision: opened at ${editSession.revision}, Host now at ${revision}. Draft preserved. Load latest baseline and review again.`);
}
function checkEditorRevision() {
  if (!editSession || editSession.acknowledged) return;
  const wiki = sourceRecord('wiki');
  if (isWikiDocument(wiki) && wiki.revision !== editSession.revision) markStale(wiki.revision);
}
async function getJson(key) {
  const response = await fetch(SOURCES[key].url, { cache: 'no-store', signal: AbortSignal.timeout(5000) });
  if (!response.ok) throw new Error(`HTTP ${response.status} ${SOURCES[key].url}`);
  const data = await response.json();
  if (key === 'wiki' && !isWikiDocument(data)) throw new Error('Invalid Wiki revision/schema');
  if (key === 'state' && (!data || !Number.isSafeInteger(data.revision))) throw new Error('Invalid Host state revision');
  if (key === 'roadmap' && !Array.isArray(data?.buildQueue)) throw new Error('Invalid canonical roadmap queue');
  if (key === 'surface' && !Array.isArray(data?.files) && !Array.isArray(data?.records) && !Array.isArray(data)) throw new Error('Invalid file-surface registry');
  if (key === 'journal' && !Array.isArray(data) && !Array.isArray(data?.entries)) throw new Error('Invalid journal records');
  return data;
}
function revisionLabel(key, data) {
  if (key === 'wiki') return `Wiki rev ${data.revision}`;
  if (key === 'state') return `state rev ${data.revision} / Wiki rev ${present(data.wikiRevision)}`;
  if (key === 'roadmap') return `batch ${present(data.acceleration?.activeBatch)} · ${data.buildQueue.length} rows · no content rev`;
  if (key === 'surface') return `${fileRecords(data).length} indexed files · ${present(data.generatorVersion)} · generated seed`;
  return `${entriesOf(data).length} entries · count is not a revision`;
}
function updateSourceMeta(key) {
  if (key === 'state') return; // state revision is already shown in the synchronization strip
  const field = $(key + '-source');
  if (!field) return;
  const snap = snapshots[key];
  field.className = 'source-meta' + (snap?.error ? snap?.data ? ' stale' : ' error' : '');
  field.textContent = `${SOURCES[key].path} · ${SOURCES[key].url} · ${snap?.data ? revisionLabel(key, snap.data) : 'not observed'}${snap?.error ? ` · stale/unavailable: ${snap.error}` : ' · Host read observed; independent acceptance not implied'}`;
}
function ingest(key, data) {
  const signature = JSON.stringify(data);
  const previous = snapshots[key];
  const changed = !previous || previous.signature !== signature;
  snapshots[key] = { data, signature, error: null, observedAt: new Date().toISOString() };
  updateSourceMeta(key);
  if (changed) {
    if (key === 'wiki') $('wiki-view').replaceChildren(renderWiki(data));
    if (key === 'roadmap') $('roadmap-view').replaceChildren(renderRoadmap(data));
    if (key === 'surface') $('surface-view').replaceChildren(renderFileSurface(data));
    if (key === 'journal') {
      $('journal-view').replaceChildren(renderJournal(data));
      if (sourceRecord('wiki')) $('wiki-view').replaceChildren(renderWiki(sourceRecord('wiki')));
    }
  }
  if (key === 'wiki') {
    $('rev').textContent = `Wiki revision: ${data.revision}`;
    checkEditorRevision();
    checkReadback(data);
  }
  if (key === 'state') $('state-rev').textContent = `Chat state: ${data.revision} · Wiki ${present(data.wikiRevision)}`;
}
function checkReadback(wiki) {
  const session = editSession;
  if (!session?.acknowledged) return;
  const ack = session.acknowledged;
  if (wiki.revision >= ack.wikiRevision && wiki.pages?.[session.page]?.sections?.[session.section] === ack.content) {
    session.acknowledged.confirmed = true;
    $('edit-review').hidden = true;
    $('edit-save').hidden = true;
    $('edit-content').disabled = true;
    setEditorStatus(`Host acknowledged rev ${ack.wikiRevision}; fresh GET /api/wiki confirms the exact content. Independent A02/A04 acceptance still pending.`);
  } else if (wiki.revision >= ack.wikiRevision) {
    setEditorStatus(`Host acknowledged rev ${ack.wikiRevision}, but readback does not match. Do not submit again; inspect Host journal.`);
  }
}
function renderSync() {
  const keys = Object.keys(SOURCES);
  const seen = keys.filter(key => !!snapshots[key]?.data).length;
  const failures = keys.filter(key => !!snapshots[key]?.error);
  const wiki = sourceRecord('wiki');
  const state = sourceRecord('state');
  const journal = sourceRecord('journal');
  const edits = entriesOf(journal).filter(entry => entry?.kind === 'wiki-edit').length;
  $('source-mode').textContent = seen === keys.length && failures.length === 0
    ? `Host live read-through · ${edits ? 'journal-backed edits observed' : 'seed/demo baseline'}`
    : `Host sources ${seen}/${keys.length} · ${failures.length ? 'partial / stale' : 'loading'}`;
  const mismatch = wiki && state && wiki.revision !== state.wikiRevision;
  $('sync-status').textContent = failures.length ? `Retry pending: ${failures.map(k => SOURCES[k].url).join(', ')}. Last good views retained.` :
    mismatch ? 'Cross-endpoint Wiki revisions differ in this polling cycle; rechecking.' :
      `Observed ${seen}/${keys.length} Host sources · source data is not independent verification`;
}
async function refresh() {
  if (refreshing) return;
  refreshing = true;
  try {
    const keys = Object.keys(SOURCES);
    const responses = await Promise.allSettled(keys.map(getJson));
    responses.forEach((result, index) => {
      const key = keys[index];
      if (result.status === 'fulfilled') ingest(key, result.value);
      else {
        snapshots[key] = { ...snapshots[key], error: String(result.reason?.message || result.reason) };
        updateSourceMeta(key);
      }
    });
    renderSync();
  } finally { refreshing = false; }
}
async function rebase() {
  const session = editSession;
  if (!session || busy || session.acknowledged) return;
  busy = true;
  try {
    const wiki = await getJson('wiki');
    ingest('wiki', wiki);
    const current = wiki.pages?.[session.page]?.sections?.[session.section];
    if (typeof current !== 'string') { setEditorStatus('Target no longer exists. Draft preserved; cannot rebase.'); return; }
    session.original = current;
    session.revision = wiki.revision;
    session.preview = null;
    $('edit-rev').textContent = `fresh Wiki rev ${wiki.revision}`;
    $('edit-preview').hidden = true;
    $('edit-save').hidden = true;
    $('edit-rebase').hidden = true;
    setEditorStatus('Latest Host baseline loaded; draft preserved. Review the new diff before confirming.');
  } catch (error) { setEditorStatus(`Baseline refresh failed: ${error}. Draft preserved.`); }
  finally { busy = false; }
}
async function review() {
  const session = editSession;
  if (!session || busy || session.acknowledged) return;
  busy = true;
  try {
    const wiki = await getJson('wiki');
    ingest('wiki', wiki);
    if (wiki.revision !== session.revision) { markStale(wiki.revision); return; }
    const latest = wiki.pages?.[session.page]?.sections?.[session.section];
    if (typeof latest !== 'string' || latest !== session.original) {
      markStale(wiki.revision);
      setEditorStatus('Section source differs from opening baseline. Draft preserved; load fresh baseline.');
      return;
    }
    const proposed = $('edit-content').value;
    if (proposed === latest) { invalidatePreview('No change to review.'); return; }
    if (bytesOf(mutationEnvelope(session, wiki.revision, proposed)) > MAX_ENTRY_BYTES) {
      invalidatePreview('Change exceeds Host 4KB journal entry limit. Shorten the draft; nothing was sent.'); return;
    }
    session.preview = { revision: wiki.revision, before: latest, after: proposed };
    $('edit-rev').textContent = `reviewed Wiki rev ${wiki.revision}`;
    $('edit-before').textContent = latest;
    $('edit-after').textContent = proposed;
    $('edit-diff').textContent = linesDiff(latest, proposed);
    $('edit-preview-meta').textContent = `Target ${session.page}/${session.section} · expectedRevision=${wiki.revision} · explicit Host acknowledgement required`;
    $('edit-preview').hidden = false;
    $('edit-save').hidden = false;
    $('edit-rebase').hidden = true;
    setEditorStatus('Preview only. Confirm to request one revision-guarded Host journal append.');
  } catch (error) { invalidatePreview(`Cannot review without fresh Host Wiki: ${error}. Draft preserved.`); }
  finally { busy = false; }
}
async function submitEdit(event) {
  event.preventDefault();
  const session = editSession;
  if (!session || !session.preview || busy || session.acknowledged) return;
  busy = true;
  let requestSent = false;
  const reviewed = session.preview;
  $('edit-save').disabled = true;
  try {
    // This new GET after review prevents a knowingly stale confirmation; Host CAS is final.
    const fresh = await getJson('wiki');
    ingest('wiki', fresh);
    if (fresh.revision !== reviewed.revision ||
        fresh.pages?.[session.page]?.sections?.[session.section] !== reviewed.before ||
        $('edit-content').value !== reviewed.after) {
      markStale(fresh.revision);
      setEditorStatus('Revision or draft changed after preview. Nothing sent; review against the latest Host snapshot.');
      return;
    }
    const payload = mutationEnvelope(session, reviewed.revision, reviewed.after);
    if (bytesOf(payload) > MAX_ENTRY_BYTES) { invalidatePreview('Entry exceeds 4KB; nothing sent.'); return; }
    requestSent = true;
    const result = await fetch('/api/mutate', {
      method: 'POST', headers: { 'content-type': 'application/json', 'x-vivim-control': '1' },
      body: JSON.stringify(payload), cache: 'no-store', signal: AbortSignal.timeout(5000)
    });
    if (!result.ok) {
      const detail = (await result.text()).slice(0, 240);
      if (result.status === 409) { markStale(fresh.revision); }
      setEditorStatus(`Host refused HTTP ${result.status}: ${detail}. Draft preserved; no save claimed.`);
      return;
    }
    const acknowledgement = await result.json();
    if (acknowledgement?.kind !== 'wiki-edit' || acknowledgement?.actor !== ACTOR ||
        acknowledgement?.wikiRevision !== payload.expectedRevision + 1 ||
        acknowledgement?.edit?.page !== session.page || acknowledgement?.edit?.section !== session.section ||
        acknowledgement?.edit?.content !== payload.edit.content ||
        typeof acknowledgement.receivedAt !== 'string') {
      // Unknown acknowledgement is not proof. Do not blindly retry a possibly-applied edit.
      session.acknowledged = { wikiRevision: payload.expectedRevision + 1, content: payload.edit.content, confirmed: false };
      $('edit-save').hidden = true;
      setEditorStatus('Host reply was not a valid Wiki edit receipt. Outcome unknown; check journal/readback before retrying.');
      return;
    }
    session.acknowledged = { wikiRevision: acknowledgement.wikiRevision, content: payload.edit.content, confirmed: false };
    $('edit-save').hidden = true;
    setEditorStatus(`Host acknowledged rev ${acknowledgement.wikiRevision}; checking fresh Wiki readback…`);
    try { ingest('wiki', await getJson('wiki')); }
    catch (error) { setEditorStatus(`Host acknowledged but readback failed: ${error}. Do not resubmit; retry source refresh.`); }
  } catch (error) {
    // Transport failure can mean request reached Host: preserve draft, do not claim success.
    if (requestSent && session && !session.acknowledged) {
      session.acknowledged = { wikiRevision: reviewed.revision + 1, content: reviewed.after, confirmed: false };
      $('edit-save').hidden = true;
    }
    setEditorStatus(requestSent
      ? `Network/receipt uncertainty: ${error}. Check live Wiki/journal before considering another edit; draft preserved.`
      : `Fresh revision check failed before any POST: ${error}. Draft preserved; retry review.`);
  } finally { busy = false; $('edit-save').disabled = false; renderSync(); }
}

$('refresh-now').addEventListener('click', () => { void refresh(); });
$('edit-content').addEventListener('input', () => invalidatePreview());
$('edit-review').addEventListener('click', () => { void review(); });
$('edit-rebase').addEventListener('click', () => { void rebase(); });
$('edit-cancel').addEventListener('click', closeEditor);
$('edit').addEventListener('submit', event => { void submitEdit(event); });
document.addEventListener('visibilitychange', () => { if (!document.hidden) void refresh(); });
void refresh();
setInterval(() => { if (!document.hidden) void refresh(); }, POLL_MS);
