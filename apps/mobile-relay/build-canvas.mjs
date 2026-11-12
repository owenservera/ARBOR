// The Build canvas request screen. It asks the owner's main AI for a draft, shows it as a dashed
// proposal, and applies it only when the owner taps Activate. Sending and applying are injected, so
// this file never talks to a provider itself and never resends: a draft that is still pending is polled, not re-asked.
import { SUGGESTIONS, buildDesignPrompt, resolveBuildRequest, previewReply, failureText, blankSurface } from './build-composer.mjs';
import { renderSurface } from './generative-ui/renderer.mjs';

const PENDING_KEY = 'vivim.build.pending.v1';
const PAUSE = ms => new Promise(resolve => setTimeout(resolve, ms));
const LABELS = { chatgpt: 'ChatGPT', claude: 'Claude', gemini: 'Gemini', qwen: 'Qwen', zai: 'Z.ai', deepseek: 'DeepSeek' };

export function mountBuildCanvas({ host, request, getSurface, getProvider, send, apply, onApplied = () => {}, storage = window.localStorage }) {
  let state = { name: 'idle' }, text = '', run = 0;
  const el = (tag, cls, content) => { const e = document.createElement(tag); if (cls) e.className = cls; if (content != null) e.textContent = content; return e; };
  const current = () => getSurface?.() ?? blankSurface();
  const empty = () => !current().tree?.children?.length;
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
        const surface = current(), out = previewReply({ reply: record.result, surface });
        return out.ok ? set({ name: 'ready', ...out, surface, origin: 'ai' }) : set({ name: 'error', message: out.reason });
      }
      if (Date.now() - started > 600000) return set({ name: 'error', message: 'No answer yet. Check your PC. VIVIM has not sent this twice.' });
      if (Date.now() - started > 180000 && state.name === 'waiting') set({ name: 'waiting', note: 'Still waiting. It can take a few minutes. VIVIM will not send it again.' });
    }
  }

  async function ask() {
    // A known UI grammar is compiled locally to the same unprivileged proposal IR.
    // No model send; actual activation still goes through the paired Host.
    const surface = current();
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
    // Unknown/complex request: preserve the existing explicitly bounded model
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

  async function activate() {
    const { proposal, surface } = state;
    set({ ...state, name: 'applying' });
    try { await apply(proposal, surface); await onApplied(); text = ''; set({ name: 'done' }); }
    catch (error) { set({ name: 'error', message: /stale|revision/i.test(error.message) ? 'Your app changed in the meantime. Ask again.' : "That didn't apply. Your app is unchanged." }); }
  }
  async function undo() {
    set({ name: 'done', undoing: true });
    try { await command({ text: 'undo-ui-revision', kind: 'command', consumer: 'bootstrap', mode: 'bootstrap', action: 'undo-ui-revision' }); await onApplied(); set({ name: 'idle', note: 'Undone. Your app is back as it was.' }); }
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
    if (state.summary.unknowns.length) card.append(el('p', 'muted', "VIVIM doesn't know: " + state.summary.unknowns.join('; ')));
    const view = el('div', 'proposal-preview');
    try { renderSurface(view, state.preview.surface, { audience: 'phone', approvedRefs: [], onIntent: () => {} }); } catch { view.textContent = 'Preview unavailable.'; }
    const actions = el('div', 'compose-row');
    const yes = el('button', 'btn pri', state.name === 'applying' ? 'Adding…' : 'Activate'); yes.type = 'button'; yes.disabled = state.name === 'applying'; yes.onclick = activate;
    const change = el('button', 'btn', 'Change it'); change.type = 'button'; change.onclick = () => set({ name: 'idle' });
    const no = el('button', 'btn', 'Not now'); no.type = 'button'; no.onclick = () => { text = ''; set({ name: 'idle' }); };
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
    else if (state.name === 'done') {
      const ok = el('div', 'proposal is-done'); ok.setAttribute('role', 'status');
      ok.append(el('span', 'tour-eyebrow', 'ADDED'), el('h3', null, state.undoing ? 'Undoing…' : 'Added to your app.'));
      if (!state.undoing) { const u = el('button', 'btn', 'Undo'); u.type = 'button'; u.onclick = undo; const more = el('button', 'btn', 'Ask for something else'); more.type = 'button'; more.onclick = () => set({ name: 'idle' }); const row = el('div', 'compose-row'); row.append(u, more); ok.append(row); }
      host.append(ok);
    } else if (state.name === 'error') {
      const bad = el('div', 'proposal is-error'); bad.setAttribute('role', 'alert');
      const retry = el('button', 'btn', 'Try again'); retry.type = 'button'; retry.onclick = () => set({ name: 'idle' });
      bad.append(el('span', 'tour-eyebrow', 'NOT CHANGED'), el('p', null, state.message), retry); host.append(bad);
    } else host.append(composer());
  }

  const pending = saved();
  if (pending?.id && Date.now() - pending.at < 3600000) { const token = ++run; state = { name: 'waiting', note: 'Picking up where you left off…' }; watch(pending.id, token); }
  render();
  return { refresh: render };
}
