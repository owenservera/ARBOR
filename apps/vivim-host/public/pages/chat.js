import { resolveDesktopDestination } from '/mobile/control-language.mjs';
// The Host owns command authority. This page stores chat text separately from any effect.
(() => {
  'use strict';
  const STATE_URL = '/api/state';
  const MUTATE_URL = '/api/mutate';
  const CONTROL_URL = '/api/host/control/';
  const ACTOR = 'owner-browser';
  const POLL_MS = 1500;

  const $ = id => document.getElementById(id);
  const log = $('log');
  const rev = $('rev');
  const form = $('f');
  const input = $('t');
  const sendBtn = $('send');
  const authStatus = $('control-status');
  const result = $('control-result');
  const recent = $('control-recent');
  const lockButton = $('control-logout');
  if (!log || !form || !input || !result) return;

  let pollTimer = null;
  let csrfProof = null;
  let busy = false;
  let pending = null;

  function element(tag, className = '', value) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (value !== undefined) node.textContent = String(value);
    return node;
  }
  function button(label, action, secondary = false) {
    const node = element('button', secondary ? 'secondary' : '', label);
    node.type = 'button';
    node.addEventListener('click', action);
    return node;
  }
  function card(heading) {
    const node = element('div', 'control-card');
    if (heading) node.append(element('h3', '', heading));
    result.replaceChildren(node);
    return node;
  }
  function notice(message, warning = false) {
    const node = card('Host Control');
    node.append(element('p', warning ? 'warning' : '', message));
  }
  function setBusy(next) {
    busy = next;
    sendBtn.disabled = next;
    input.disabled = next;
    lockButton.disabled = next;
  }
  function locked(message = 'Commands locked. Open the VIVIM desktop owner session to approve PC changes.') {
    csrfProof = null;
    pending = null;
    authStatus.textContent = message;
    lockButton.hidden = true;
    recent.replaceChildren();
    notice('Chat messages can still be saved. Host effects require desktop owner authentication.');
  }
  function unlocked() {
    authStatus.textContent = 'Owner session active · effects need explicit approval';
    lockButton.hidden = false;
  }
  async function json(url, options = {}) {
    const response = await fetch(url, { credentials: 'same-origin', cache: 'no-store', ...options });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(body.error || body.code || ('HTTP ' + response.status));
      error.code = body.code || null;
      error.status = response.status;
      throw error;
    }
    return body;
  }
  async function controlApi(route, body) {
    if (!csrfProof) throw new Error('Trusted desktop owner session required');
    const options = body === undefined ? {} : {
      method: 'POST', headers: { 'content-type': 'application/json',
        'x-vivim-control': '1', 'x-vivim-ui-csrf': csrfProof }, body: JSON.stringify(body)
    };
    try {
      return await json(CONTROL_URL + route, options);
    } catch (error) {
      if (error.status === 401) locked('Owner session expired. Reopen VIVIM on this PC to unlock.');
      throw error;
    }
  }
  // The native Host supplies a one-time code in a fragment, never a bearer secret.
  // The fragment is erased BEFORE any HTTP request. A reload restores only the HttpOnly cookie.
  async function ownerSession() {
    const fragment = window.location.hash || '';
    const match = fragment.match(/^#control-session=([a-f0-9]{64})$/);
    if (fragment.startsWith('#control-session=')) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
      if (!match) throw new Error('Invalid desktop launch code');
      const opened = await json(CONTROL_URL + 'ui-exchange', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-vivim-control': '1' },
        body: JSON.stringify({ code: match[1] })
      });
      if (!/^[a-f0-9]{64}$/.test(opened.csrf || ''))
        throw new Error('Owner session exchange did not return a CSRF proof');
      csrfProof = opened.csrf;
    } else {
      const response = await fetch(CONTROL_URL + 'ui-state', {
        method: 'GET', credentials: 'same-origin', cache: 'no-store'
      });
      if (!response.ok) return false;
      const state = await response.json().catch(() => ({}));
      if (!/^[a-f0-9]{64}$/.test(state.csrf || '')) return false;
      csrfProof = state.csrf;
    }
    unlocked();
    return true;
  }
  function intentNode(intent) {
    const wrap = element('div', 'intent');
    wrap.append(element('span', 'outcome ' + String(intent?.outcome ?? 'none').replace(/[^a-z0-9_-]/gi, '-'),
      'Interpretation only: ' + String(intent?.outcome ?? 'none') + ' · not executed'));
    if (intent?.canonical) wrap.append(element('span', 'canonical', ' · ' + intent.canonical));
    if (intent?.refusal) wrap.append(element('span', '', ' · ' + (intent.refusal.message ?? 'Refused')));
    return wrap;
  }
  function messageNode(m) {
    const node = element('div', 'msg ' + (m.who === 'user' ? 'user' : 'system'));
    node.append(element('div', 'who', m.who + (m.at ? ' · ' + m.at : '')));
    node.append(element('div', 'text', m.text));
    if (m.intent) node.append(intentNode(m.intent));
    return node;
  }
  async function refresh() {
    try {
      const state = await json(STATE_URL);
      rev.textContent = 'state rev ' + (state.revision ?? 0) +
        ' · wiki rev ' + (state.wikiRevision ?? 0);
      const messages = Array.isArray(state.chat) ? state.chat : [];
      log.replaceChildren(...(messages.length
        ? messages.map(messageNode)
        : [element('p', 'empty', 'Chat is empty — send a message')]));
      log.scrollTop = log.scrollHeight;
    } catch (error) {
      rev.textContent = 'Chat state unavailable (' + error.message + ') · retrying';
    }
  }
  function receiptDetails(node, receipt) {
    if (!receipt) return;
    const label = receipt.status === 'applied' ? 'Applied by Host'
      : receipt.status === 'failed' ? 'Failed without effect' : 'Outcome uncertain';
    node.append(element('p', receipt.status === 'applied' ? '' : 'warning',
      label + (receipt.replayed ? ' · existing receipt' : '') + ' · ' + (receipt.at || 'time unknown')));
    if (receipt.error) node.append(element('p', 'warning',
      (receipt.error.code || 'ERROR') + ': ' + (receipt.error.message || 'Unknown error')));
    if (receipt.result !== undefined) node.append(element('pre', '', JSON.stringify(receipt.result, null, 2)));
    node.append(element('p', '', 'Host receipt: ' + receipt.planId +
      ' · live acceptance: ' + (receipt.liveAcceptance ?? 'pending')));
    if (receipt.undo && receipt.status === 'applied') {
      node.append(button('Review undo (requires approval)', () => void submitPlan({
        actionId: receipt.undo.actionId, args: receipt.undo.args
      }), true));
    }
  }
  async function observeTheme(node, receipt) {
    if (receipt.status !== 'applied' || receipt.actionId !== 'ui.theme.set_preset') return;
    try {
      const observed = await controlApi('plan', { actionId: 'ui.theme.show', args: {} });
      if (observed.outcome === 'done') node.append(element('p', '',
        'Host readback: theme ' + observed.result.preset + ' · revision ' + observed.result.revision));
    } catch (error) {
      node.append(element('p', 'warning', 'Theme readback unavailable: ' + error.message));
    }
  }
  function recoveredPlan(record) {
    pending = null; // Inspect never recreates an approval from a stored plan.
    const node = card(record.actionId + ' · ' + record.state);
    node.append(element('p', '', 'Original Host plan: ' + record.planId));
    if (record.state === 'uncertain') node.append(element('p', 'warning',
      'The effect may have happened. Do not retry; inspect your PC state.'));
    if (record.receipt) receiptDetails(node, record.receipt);
    else node.append(element('p', '',
      'No completed receipt exists. Re-reading a plan never executes it.'));
  }
  async function inspectPlan(planId) {
    if (!csrfProof) return;
    try { recoveredPlan(await controlApi('plans/' + encodeURIComponent(planId))); }
    catch (error) { notice('Could not inspect original plan: ' + error.message, true); }
  }
  async function refreshRecent(restoreLatest = false) {
    if (!csrfProof) return;
    try {
      const rows = (await controlApi('recent')).items || [];
      recent.replaceChildren();
      if (rows.length) {
        recent.append(element('strong', '', 'Recent Host decisions'));
        for (const row of rows.slice(0, 6)) {
          const item = element('div', 'history-row');
          item.append(element('span', '', row.actionId + ' · ' + row.state));
          item.append(button('Inspect', () => void inspectPlan(row.planId), true));
          recent.append(item);
        }
        if (restoreLatest && !pending) await inspectPlan(rows[0].planId);
      }
    } catch (error) {
      recent.replaceChildren(element('p', 'warning', 'Host history unavailable: ' + error.message));
    }
  }
  function planView(plan) {
    pending = null;
    if (plan.outcome === 'done') {
      const node = card(plan.title + ' · Host read only');
      const meaning = plan.language?.vec?.proposal;
      if (meaning?.schema === 'vivim.command-intent/0.1' && meaning.canonical)
        node.append(element('pre', '', meaning.canonical));
      node.append(element('pre', '', JSON.stringify(plan.result, null, 2)));
      return;
    }
    if (plan.outcome !== 'approval_required') {
      const node = card('Host interpretation · ' + String(plan.outcome ?? 'unavailable'));
      node.append(element('p', plan.outcome === 'refused' || plan.outcome === 'unavailable' ? 'warning' : '',
        (plan.question || plan.refusal?.message || plan.message ||
          (plan.outcome === 'unavailable' ? (plan.precondition || 'Action unavailable') :
            'No executable command was identified')) + ' · No Host effect was executed.'));
      if (Array.isArray(plan.choiceDetails) && plan.choiceDetails.length) {
        node.append(element('strong', '', 'Possible actions'));
        for (const choice of plan.choiceDetails.slice(0, 8))
          node.append(element('p', '', (choice.title || choice.actionId) + ' · ' + (choice.risk || 'unknown risk')));
      } else if (Array.isArray(plan.choices) && plan.choices.length) {
        node.append(element('p', '', 'Possible actions: ' + plan.choices.slice(0, 8).join(', ')));
      }
      if (Array.isArray(plan.missing) && plan.missing.length)
        node.append(element('p', '', 'Missing details: ' +
          plan.missing.slice(0, 8).map(item => item.arg).filter(Boolean).join(', ')));
      return;
    }
    const expected = { planId: plan.planId, planDigest: plan.planDigest };
    pending = expected;
    const node = card('Approve exactly this Host action?');
    node.append(element('p', '', plan.title + ' · ' + plan.actionId + ' · ' + plan.risk));
    const meaning = plan.language?.vec?.proposal;
    if (meaning?.schema === 'vivim.command-intent/0.1' && meaning.canonical)
      node.append(element('pre', '', meaning.canonical));
    node.append(element('pre', '', JSON.stringify(plan.args, null, 2)));
    if (plan.preview) {
      node.append(element('p', '', 'Wiki section: ' + plan.preview.target +
        ' · expected revision ' + plan.preview.expectedRevision));
      node.append(element('strong', '', 'Before'));
      node.append(element('pre', '', plan.preview.before));
      node.append(element('strong', '', 'After'));
      node.append(element('pre', '', plan.preview.after));
    }
    node.append(element('p', '', 'Digest: ' + plan.planDigest + ' · expires ' +
      new Date(plan.expiresAt).toLocaleString()));
    if (plan.liveAcceptance !== 'verified') node.append(element('p', 'warning',
      'Executor wired; live acceptance still pending.'));
    const actions = element('div', 'control-actions');
    actions.append(button('Approve & apply on PC', () => void apply(expected)));
    actions.append(button('Cancel · no Host change', () => {
      if (pending !== expected) return;
      pending = null;
      notice('Cancelled. No Host command was executed.');
    }, true));
    node.append(actions);
  }
  async function submitPlan(body) {
    if (!csrfProof || busy) return;
    pending = null;
    setBusy(true);
    notice('Validating the requested action against the Host catalog…');
    try { planView(await controlApi('plan', body)); }
    catch (error) { notice('Host planning failed: ' + error.message + '. No Host effect was executed.', true); }
    finally { setBusy(false); }
  }
  async function apply(expected) {
    if (busy || !csrfProof || !expected || pending !== expected) return;
    pending = null; // Consume the click before awaiting HTTP. Never resend automatically.
    setBusy(true);
    notice('Waiting for Host execution status. If the response is lost, inspect the original plan.');
    try {
      const receipt = await controlApi('execute', expected);
      const node = card(receipt.actionId + ' · ' + receipt.status);
      receiptDetails(node, receipt);
      await observeTheme(node, receipt);
      await refreshRecent();
      await refresh();
    } catch (error) {
      if (error.status === 401) {
        locked('Owner authorization rejected. Reopen the VIVIM desktop app to unlock.');
      } else {
        const node = card('Execution response unconfirmed');
        node.append(element('p', 'warning',
          'A Host effect may have happened. Do not retry. ' + error.message));
        node.append(button('Check original plan', () => void inspectPlan(expected.planId), true));
      }
    } finally { setBusy(false); }
  }
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (busy) return;
    const text = input.value.trim();
    if (!text) return;
    const destination=resolveDesktopDestination(text);
    if(destination){
      pending=null;
      if(destination.href)window.location.assign(destination.href);
      else notice('That screen requires the paired VIVIM PWA.',true);
      return;
    }
    pending = null; // The next message invalidates an unaccepted local preview.
    input.value = '';
    setBusy(true);
    let stored = false;
    try {
      await json(MUTATE_URL, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ schemaVersion: 1, actor: ACTOR, kind: 'chat-send', text })
      });
      stored = true;
      await refresh();
      if (csrfProof) {
        try { planView(await controlApi('plan', { text })); }
        catch (error) {
          notice('Message recorded, but command planning failed: ' + error.message +
            '. No Host effect was confirmed.', true);
        }
      } else notice('Message recorded. Host commands are locked until your desktop owner session is opened.');
    } catch (error) {
      notice('Message could not be recorded: ' + error.message + '. No command was executed.', true);
    } finally {
      if (!stored) input.value = text;
      setBusy(false);
      input.focus();
    }
  });
  lockButton.addEventListener('click', async () => {
    if (busy || !csrfProof) return;
    setBusy(true);
    try { await controlApi('ui-logout', {}); }
    catch (error) { notice('Could not lock owner session: ' + error.message, true); }
    finally {
      locked('Owner commands locked. Reopen the desktop app to unlock.');
      setBusy(false);
    }
  });

  async function start() {
    void refresh();
    if (!pollTimer) pollTimer = setInterval(() => { void refresh(); }, POLL_MS);
    try {
      if (await ownerSession()) await refreshRecent(true);
      else locked();
    } catch (error) { locked('Owner session unavailable: ' + error.message); }
  }
  void start();
})();
