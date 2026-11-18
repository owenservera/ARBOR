// The Build canvas request screen. It asks the owner's main AI for a draft, shows it as a dashed
// proposal, and applies it only when the owner taps Activate. Sending and applying are injected, so
// this file never talks to a provider itself and never resends: a draft that is still pending is polled, not re-asked.
import { SUGGESTIONS, buildDesignPrompt, resolveBuildRequest, previewReply, failureText } from './build-composer.mjs';
import { renderSurface } from './generative-ui/renderer.mjs';
import { compileUiProposal } from './generative-ui/compiler.mjs';
import { validateSurface } from './generative-ui/catalog.mjs';

const PENDING_KEY = 'vivim.build.pending.v1';
const PAUSE = ms => new Promise(resolve => setTimeout(resolve, ms));
const LABELS = { chatgpt: 'ChatGPT', claude: 'Claude', gemini: 'Gemini', qwen: 'Qwen', zai: 'Z.ai', deepseek: 'DeepSeek' };

// Queue completion alone is never proof of a persisted Host UI revision.
export function committedUiRevision(command, surface) {
  let body = command?.result;
  try { if (typeof body === 'string') body = JSON.parse(body); }
  catch { throw new Error('Host commit confirmation unreadable'); }
  if (command?.status !== 'done' ||
      body?.schema !== 'vivim.bootstrap-command-worker/1' ||
      body.action !== 'apply-proposal' || body.persisted !== true ||
      !Number.isSafeInteger(body.revision) ||
      body.revision !== surface.revision + 1 ||
      body.parentRevision !== surface.revision ||
      body.surfaceId !== surface.surfaceId)
    throw new Error('Host did not confirm the expected persisted revision');
  return { committedRevision: body.revision, parentRevision: body.parentRevision,
    surfaceId: body.surfaceId };
}

export function buildRequestRoute(text) {
  const command = String(text ?? '').trim().replace(/\s+/g, ' ').toLowerCase();
  if (command === 'open the wiki') return { kind: 'navigate', tab: 'wiki' };
  if (command === 'show arbor progress projection' || command === 'preview an edit')
    return { kind: 'unsupported' };
  return { kind: 'design' };
}

// Recompile only for validation: the proposal and preview approved by the owner
// must remain identical on the currently loaded Host surface.
export function assertBuildPreviewCurrent(submitted, live) {
  if (!live || live.surfaceId !== submitted.surface.surfaceId ||
      live.revision !== submitted.surface.revision)
    throw new Error('Stale or unavailable Host surface revision');
  const fresh = compileUiProposal({ proposal: submitted.proposal, surface: live,
    approvedRefs: [], audience: 'phone' });
  if (fresh.proposalDigest !== submitted.preview.proposalDigest ||
      fresh.previewDigest !== submitted.preview.previewDigest)
    throw new Error('Stale or changed Host preview');
}

export function matchesCommittedUiReadback(proof, expected, live) {
  if (!live || !expected || live.surfaceId !== proof.surfaceId ||
      expected.surfaceId !== proof.surfaceId || expected.revision !== proof.parentRevision ||
      proof.committedRevision !== proof.parentRevision + 1 ||
      live.revision !== proof.committedRevision) return false;
  try {
    const actual = validateSurface(live, { refs: new Set() });
    const intended = validateSurface({ ...expected, revision: proof.committedRevision }, { refs: new Set() });
    return JSON.stringify(actual) === JSON.stringify(intended);
  } catch { return false; }
}

export function mountBuildCanvas({ host, request, getSurface, getProvider, send, apply, onApplied = () => {}, navigate = () => {}, storage = window.localStorage }) {
  let state = { name: 'idle' }, text = '', run = 0;
  const el = (tag, cls, content) => { const e = document.createElement(tag); if (cls) e.className = cls; if (content != null) e.textContent = content; return e; };
  const current = () => getSurface?.() ?? null;
  const empty = () => !current()?.tree?.children?.length;
  const saved = () => { try { return JSON.parse(storage.getItem(PENDING_KEY) || 'null'); } catch { return null; } };
  const keep = value => { try { value ? storage.setItem(PENDING_KEY, JSON.stringify(value)) : storage.removeItem(PENDING_KEY); } catch { /* the pending note is a convenience */ } };
  const set = next => { state = next; render(); };

  async function command(body) {
    const created = await request('commands', { method: 'POST', body: JSON.stringify(body) });
    if (!created?.id) throw new Error('not acknowledged');
    for (let i = 0; i < 25; i++) {
      await PAUSE(1200);
      const record = await request('commands/' + created.id);
      if (record?.status === 'done') return record;
      if (record?.status === 'failed') throw new Error(String(record.result || 'failed').slice(0, 160));
    }
    throw new Error('pending');
  }

  async function watch(id, token) {
    const started = Date.now();
    while (token === run) {
      await PAUSE(Date.now() - started < 180000 ? 2500 : 8000);
      if (token !== run) return;
      let record;
      try { record = await request('commands/' + id); } catch { continue; }
      if (record?.status === 'failed') { keep(null); return set({ name: 'error', message: failureText(record.result) }); }
      if (record?.status === 'done') {
        keep(null);
        const surface = current();
        if (!surface) return set({ name: 'error', message: 'Host screen unavailable. Reconnect and ask again.' });
        const out = previewReply({ reply: record.result, surface });
        return out.ok ? set({ name: 'ready', ...out, surface, origin: 'ai' }) : set({ name: 'error', message: out.reason });
      }
      if (Date.now() - started > 600000) return set({ name: 'error', message: 'No answer yet. Check your PC. VIVIM has not sent this twice.' });
      if (Date.now() - started > 180000 && state.name === 'waiting') set({ name: 'waiting', note: 'Still waiting. It can take a few minutes. VIVIM will not send it again.' });
    }
  }

  async function ask() {
    if (state.name !== 'idle') return;
    const route = buildRequestRoute(text);
    if (route.kind === 'navigate') {
      ++run;
      text = '';
      set({ name: 'idle' });
      navigate(route.tab);
      return;
    }
    if (route.kind === 'unsupported')
      return set({ name: 'idle', error: 'That is not a Build design request. Nothing changed.' });
    const surface = current();
    if (!surface) return set({ name: 'idle', error: 'Connect to the Host and load your current app before building.' });
    const local = resolveBuildRequest({ request: text, surface });
    if (local.outcome === 'candidate') {
      ++run;
      return set({ name: 'ready', ...local, surface, origin: 'vec' });
    }
    if (local.outcome === 'clarification_required') {
      return set({ name: 'idle', error: local.code === 'UI_TARGET_AMBIGUOUS'
        ? 'More than one component has that name. Rename or select one first.'
        : 'I could not find that component on your current screen.' });
    }
    if (local.outcome === 'refused') {
      return set({ name: 'idle', error: 'That edit could not be safely previewed. Nothing changed.' });
    }
    if (local.code === 'COMPLEX_REQUEST')
      return set({ name: 'idle', error: 'Request one change at a time. Nothing changed.' });
    // Unknown design request: preserve the existing explicitly bounded model
    // proposal path. It still cannot apply a change until the owner taps Activate.
    const provider = getProvider();
    let prompt;
    try { prompt = buildDesignPrompt({ request: text, surface }); }
    catch (error) { return set({ name: 'idle', error: error.message }); }
    const token = ++run;
    set({ name: 'waiting', note: `Asking ${LABELS[provider] ?? 'your AI'}…` });
    try {
      const id = await send(prompt, provider);
      keep({ id, at: Date.now() });
      watch(id, token);
    } catch { set({ name: 'idle', error: "VIVIM couldn't confirm that went through, so it won't send it again on its own. Check Talk on your PC, then try again." }); }
  }

  async function refreshCommittedScreen(proof) {
    try { await onApplied(proof); }
    catch {
      // The existing phone surface owns the authenticated status read and repaint.
      // If the shell callback fails, request that same read-only refresh, never a write.
      window.dispatchEvent(new Event('vivim:bootstrap-refresh'));
    }
  }

  async function waitForReadback(proof, expected) {
    for (let i = 0; i < 12; i++) {
      const view = getSurface?.();
      if (matchesCommittedUiReadback(proof, expected, view)) return true;
      await PAUSE(750);
    }
    return false;
  }
  async function activate() {
    if (state.name !== 'ready') return;
    const submitted = state;
    try { assertBuildPreviewCurrent(submitted, current()); }
    catch { return set({ name: 'error', message: 'Your preview is no longer current. Load the Host screen and ask again.' }); }
    set({ ...submitted, name: 'applying' });
    let proof;
    try {
      proof = committedUiRevision(await apply(submitted.proposal, submitted.surface), submitted.surface);
    } catch (error) {
      return set({ name: 'uncertain', message: 'No matching Host confirmation was received. Check the live screen before another change. VIVIM did not resend.' });
    }
    await refreshCommittedScreen(proof);
    const confirmed = await waitForReadback(proof, submitted.preview.surface);
    text = '';
    set({ name: confirmed ? 'done' : 'awaiting-readback',
      proof, expected: submitted.preview.surface });
  }
  async function undo() {
    set({ name: 'done', undoing: true });
    try { await command({ text: 'undo-ui-revision', kind: 'command', consumer: 'bootstrap', mode: 'bootstrap', action: 'undo-ui-revision' }); await onApplied(); set({ name: 'idle', note: 'Host responded to undo. Check the live screen for its current state.' }); }
    catch { set({ name: 'error', message: "Couldn't undo from here. Open History on your PC." }); }
  }

  function composer() {
    const box = el('div', 'compose-box');
    const label = el('label', null, empty() ? 'What would you like to create?' : 'What would you like to change?'); label.htmlFor = 'build-text'; label.className = empty() ? 'compose-title' : 'compose-label';
    const area = el('textarea'); area.id = 'build-text'; area.rows = 3; area.maxLength = 400; area.value = text; area.placeholder = empty() ? 'Describe it in your own words' : 'For example: show my projects as a timeline';
    area.oninput = () => { text = area.value; go.disabled = !text.trim(); };
    const go = el('button', 'btn pri', 'Preview change'); go.type = 'button'; go.disabled = !text.trim(); go.onclick = ask;
    const chips = el('div', 'chips compose-chips');
    for (const s of SUGGESTIONS) { const chip = el('button', 'chip', s); chip.type = 'button'; chip.onclick = () => { text = s; render(); document.getElementById('build-text')?.focus(); }; chips.append(chip); }
    box.append(label, area, el('div', 'compose-row'), chips);
    box.querySelector('.compose-row').append(el('small', 'muted', 'Known edits stay local. Other requests use your AI. Activate to save.'), go);
    if (state.error) { const e = el('p', 'compose-error', state.error); e.setAttribute('role', 'alert'); box.append(e); }
    if (state.note) box.append(el('p', 'muted', state.note));
    return box;
  }

  function proposalCard() {
    const card = el('article', 'proposal');
    card.append(el('span', 'tour-eyebrow', state.origin === 'vec' ? 'COMPILED LOCALLY · NO AI' : 'PROPOSED BY YOUR AI'), el('h3', null, state.summary.explanation));
    card.append(el('p', 'muted', `${state.summary.changes} ${state.summary.changes === 1 ? 'change' : 'changes'} to your app. Preview below.`));
    card.append(el('p', 'muted', `Surface ${state.proposal.surfaceId} · source revision ${state.proposal.baseRevision} · approval required`));
    const typed = el('details', 'proposal-details');
    typed.append(el('summary', null, 'Typed UI proposal'), el('pre', null, JSON.stringify(state.proposal, null, 2)));
    card.append(typed);
    if (state.summary.unknowns.length) card.append(el('p', 'muted', "VIVIM doesn't know: " + state.summary.unknowns.join('; ')));
    if (state.origin === 'vec' && state.detail?.capabilityId) {
      const d = state.detail;
      card.append(el('p', 'muted', d.capabilityId + ' · revision ' + d.baseRevision + ' → ' + d.targetRevision));
      const swatch = el('span', 'color-swatch');
      swatch.setAttribute('role', 'img');
      swatch.setAttribute('aria-label', 'Proposed ' + d.property + ' color ' + d.value);
      swatch.style.backgroundColor = d.value;
      swatch.style.display = 'inline-block';
      swatch.style.width = '36px'; swatch.style.height = '36px';
      swatch.style.border = '1px solid currentColor'; swatch.style.borderRadius = '6px';
      card.append(el('p', 'muted', 'Proposed ' + d.property + ': ' + d.value), swatch);
    }
    const view = el('div', 'proposal-preview');
    let previewVisible = true;
    try { renderSurface(view, state.preview.surface, { audience: 'phone', approvedRefs: [], onIntent: () => {} }); }
    catch { previewVisible = false; view.textContent = 'Preview unavailable. Activation is disabled.'; }
    const actions = el('div', 'compose-row');
    const yes = el('button', 'btn pri', state.name === 'applying' ? 'Adding…' : 'Activate'); yes.type = 'button'; yes.disabled = state.name === 'applying' || !previewVisible; yes.onclick = activate;
    const change = el('button', 'btn', 'Change it'); change.type = 'button'; change.disabled = state.name === 'applying'; change.onclick = () => { if (state.name === 'ready') set({ name: 'idle' }); };
    const no = el('button', 'btn', 'Not now'); no.type = 'button'; no.disabled = state.name === 'applying'; no.onclick = () => { if (state.name === 'ready') { text = ''; set({ name: 'idle' }); } };
    actions.append(yes, change, no);
    card.append(view, actions);
    return card;
  }

  function render() {
    host.replaceChildren();
    if (state.name === 'waiting') {
      const wait = el('div', 'proposal is-wait'); wait.setAttribute('role', 'status');
      wait.append(el('span', 'tour-eyebrow', 'WORKING'), el('h3', null, state.note), el('p', 'muted', 'Your PC sends this once and waits for the answer. You can leave this screen; it keeps going.'));
      host.append(wait);
    } else if (state.name === 'ready' || state.name === 'applying') host.append(proposalCard());
    else if (state.name === 'done' || state.name === 'awaiting-readback') {
      const confirmed = state.name === 'done';
      const ok = el('div', 'proposal is-done'); ok.setAttribute('role', 'status');
      ok.append(el('span', 'tour-eyebrow', confirmed ? 'HOST + LIVE SCREEN VERIFIED' : 'HOST SAVED · SCREEN PENDING'),
        el('h3', null, state.undoing ? 'Undoing…' :
          confirmed ? 'Your app is updated.' : 'Host saved the change; waiting for screen readback.'));
      if (state.proof) {
        const p = state.proof;
        const panel = el('div', 'proof-panel');
        panel.append(el('p', 'ux-meta', 'Host committed revision ' + p.committedRevision + ' · previous ' + p.parentRevision));
        panel.append(el('p', 'ux-meta', 'Surface ' + p.surfaceId));
        ok.append(panel);
      }
      if (!state.undoing) {
        const row = el('div', 'compose-row');
        if (!confirmed) {
          const check = el('button', 'btn', 'Check live screen'); check.type = 'button';
          check.onclick = async () => {
            const view = state;
            await refreshCommittedScreen(view.proof);
            if (await waitForReadback(view.proof, view.expected) && state === view) set({ ...view, name: 'done' });
          };
          row.append(check);
        }
        const undoButton = el('button', 'btn', 'Undo');
        undoButton.type = 'button'; undoButton.onclick = undo;
        const more = el('button', 'btn', 'Ask for something else');
        more.type = 'button'; more.onclick = () => set({ name: 'idle' });
        if (confirmed) row.append(undoButton, more);
        ok.append(row);
      }
      host.append(ok);
    } else if (state.name === 'uncertain') {
      const bad = el('div', 'proposal is-error'); bad.setAttribute('role', 'alert');
      bad.append(el('span', 'tour-eyebrow', 'OUTCOME UNCONFIRMED'), el('p', null, state.message));
      const check = el('button', 'btn', 'Refresh live screen'); check.type = 'button';
      check.onclick = () => refreshCommittedScreen();
      const reset = el('button', 'btn', 'Return to Build'); reset.type = 'button';
      reset.onclick = () => { text = ''; set({ name: 'idle' }); };
      bad.append(check, reset); host.append(bad);
    } else if (state.name === 'error') {
      const bad = el('div', 'proposal is-error'); bad.setAttribute('role', 'alert');
      const retry = el('button', 'btn', 'Try again'); retry.type = 'button'; retry.onclick = () => set({ name: 'idle' });
      bad.append(el('span', 'tour-eyebrow', 'NO SUCCESS CONFIRMED'), el('p', null, state.message), retry); host.append(bad);
    } else host.append(composer());
  }

  const pending = saved();
  if (pending?.id && Date.now() - pending.at < 3600000) { const token = ++run; state = { name: 'waiting', note: 'Picking up where you left off…' }; watch(pending.id, token); }
  render();
  return { refresh: render };
}
