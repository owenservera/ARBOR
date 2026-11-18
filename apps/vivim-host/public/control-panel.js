// Desktop Universal Text Control panel (UTC05).
// No direct mutations: text and catalog-based GUI both plan through the same Host dispatcher.
// Native Host issues a single-use launch code. After exchange the page holds only an
// ephemeral CSRF proof and an HttpOnly scoped cookie; never the PC owner capability.
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const form = $('host-command-form');
  if (!form) return;
  const unlock = $('host-control-unlock');
  const lock = $('host-control-lock');
  const text = $('host-command-text');
  const submit = $('host-command-submit');
  const examples = $('host-control-examples');
  const catalogBox = $('host-control-catalog');
  const result = $('host-control-result');
  const recent = $('host-control-recent');
  const status = $('host-control-auth-status');
  let csrfProof = null;
  let catalog = null;
  let pending = null;
  let busy = false;
  const deviceList = $('device-list');
  const deviceStatus = $('device-status');
  const quickPreference = $('host-remember-preference');
  const quickReview = $('host-remember-review');
  const preferenceList = $('host-preferences-list');
  const preferenceRefresh = $('host-preferences-refresh');

  function element(tag, className, textValue) {
    const n = document.createElement(tag);
    if (className) n.className = className;
    if (textValue !== undefined) n.textContent = String(textValue);
    return n;
  }
  function button(label, fn, kind = '') {
    const b = element('button', 'text-control-button ' + kind, label);
    b.type = 'button';
    b.addEventListener('click', fn);
    return b;
  }
  function say(message, kind = '') {
    result.replaceChildren(element('p', 'text-control-note ' + kind, message));
  }
  function setBusy(next) {
    busy = next;
    unlock.disabled = next;
    submit.disabled = next || !csrfProof;
    text.disabled = next || !csrfProof;
    if (quickPreference) quickPreference.disabled = next || !csrfProof;
    if (quickReview) quickReview.disabled = next || !csrfProof;
    if (preferenceRefresh) preferenceRefresh.disabled = next || !csrfProof;
  }
  function showLocked(message = 'Open the VIVIM desktop app to unlock private commands.') {
    status.textContent = message;
    lock.hidden = !csrfProof;
    submit.disabled = !csrfProof;
    text.disabled = !csrfProof;
    if (quickPreference) quickPreference.disabled = !csrfProof;
    if (quickReview) quickReview.disabled = !csrfProof;
    if (preferenceRefresh) preferenceRefresh.disabled = !csrfProof;
    if (!csrfProof) {
      pending = null;
      catalog = null;
      examples.replaceChildren();
      catalogBox.replaceChildren();
      recent.replaceChildren();
      deviceList?.replaceChildren();
      preferenceList?.replaceChildren();
      if (memoryItems) memoryItems.replaceChildren();
      if (memoryStatus) memoryStatus.textContent = 'Unlock Host Control to view private history.';
      if (memoryMore) memoryMore.hidden = true;
      if (deviceStatus) deviceStatus.textContent = 'Unlock Host Control to manage phones.';
      say('Nothing has been changed. The Host requires owner authentication before planning or execution.');
    }
  }
  async function api(route, body) {
    if (!csrfProof) throw new Error('Trusted desktop session required');
    const opts = { method: body === undefined ? 'GET' : 'POST', cache: 'no-store',
      credentials: 'same-origin', headers: {} };
    if (body !== undefined) {
      opts.headers['content-type'] = 'application/json';
      opts.headers['x-vivim-control'] = '1';
      opts.headers['x-vivim-ui-csrf'] = csrfProof;
      opts.body = JSON.stringify(body);
    }
    const response = await fetch('/api/host/control/' + route, opts);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(data.error || data.code || 'PC refused request (' + response.status + ')');
      error.code = data.code;
      if (response.status === 401) {
        csrfProof = null;
        showLocked('Session expired. Reopen VIVIM on this PC to unlock.');
      }
      throw error;
    }
    return data;
  }
  // The fragment never reaches the Host over HTTP, and is erased before exchange.
  async function nativeSession() {
    const fragment = window.location?.hash || '';
    const match = fragment.match(/^#control-session=([a-f0-9]{64})$/);
    if (fragment.startsWith('#control-session=')) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
      if (!match) throw new Error('Invalid desktop launch code');
      const response = await fetch('/api/host/control/ui-exchange', {
        method: 'POST', cache: 'no-store', credentials: 'same-origin',
        headers: { 'content-type': 'application/json', 'x-vivim-control': '1' },
        body: JSON.stringify({ code: match[1] })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !/^[a-f0-9]{64}$/.test(data.csrf || ''))
        throw new Error('Private desktop session could not be opened');
      csrfProof = data.csrf;
      return;
    }
    // Refresh/reopening a WebView can restore its HttpOnly session, not the owner secret.
    const response = await fetch('/api/host/control/ui-state', {
      method: 'GET', cache: 'no-store', credentials: 'same-origin'
    });
    if (!response.ok) return;
    const data = await response.json().catch(() => ({}));
    if (/^[a-f0-9]{64}$/.test(data.csrf || '')) csrfProof = data.csrf;
  }
  function renderRecent(records) {
    recent.replaceChildren();
    const title = element('h3', '', 'Recent control decisions');
    recent.append(title);
    if (!records.length) { recent.append(element('p', 'text-control-note', 'No recorded changes yet.')); return; }
    for (const entry of records.slice(0, 12)) {
      const row = element('div', 'text-control-recent-row');
      row.append(element('span', '', entry.actionId + ' · ' + entry.state));
      row.append(button('View receipt', () => inspect(entry.planId)));
      recent.append(row);
    }
  }
  async function refreshRecent() {
    if (!csrfProof) return;
    try { renderRecent((await api('recent')).items || []); }
    catch (e) { recent.replaceChildren(element('p', 'text-control-note warning', e.message)); }
  }
  async function inspect(planId) {
    if (busy || !csrfProof) return;
    try {
      const record = await api('plans/' + encodeURIComponent(planId));
      pending = null;
      renderStatus(record);
    } catch (e) { say(e.message, 'warning'); }
  }
  function renderStatus(record) {
    const box = element('div', 'text-control-plan');
    box.append(element('strong', '', record.actionId + ' · ' + record.state));
    box.append(element('p', 'text-control-note', 'Plan: ' + record.planId));
    if (record.state === 'uncertain') box.append(element('p', 'text-control-note warning',
      'The effect may have happened. No automatic retry. Inspect the PC before taking another action.'));
    if (record.receipt) appendReceipt(box, record.receipt);
    else box.append(element('p', 'text-control-note', 'No completed receipt exists for this plan.'));
    result.replaceChildren(box);
  }
  function appendReceipt(box, receipt) {
    const label = receipt.status === 'applied' ? 'Applied' : receipt.status === 'failed' ? 'Failed' : 'Outcome uncertain';
    box.append(element('p', 'text-control-note', label + (receipt.replayed ? ' · already recorded' : '') +
      ' · ' + (receipt.at || 'time unknown')));
    if (receipt.error) box.append(element('p', 'text-control-note warning', receipt.error.code + ': ' + receipt.error.message));
    if (receipt.result !== undefined) box.append(element('pre', 'text-control-data', JSON.stringify(receipt.result, null, 2)));
    if (receipt.status === 'applied' && ['wiki.section.edit','wiki.capture.save'].includes(receipt.actionId) &&
        Number.isSafeInteger(receipt.result?.wikiRevision) &&
        typeof receipt.result?.page === 'string' && typeof receipt.result?.section === 'string') {
      const view = element('a', 'text-control-button', 'View updated Wiki');
      view.href = '/wiki';
      view.target = '_blank';
      view.rel = 'noopener';
      box.append(view);
    }
    if (receipt.undo && receipt.status === 'applied') box.append(button('Review undo', () =>
      plan({ actionId: receipt.undo.actionId, args: receipt.undo.args })));
    box.append(element('small', 'text-control-note', 'Receipt: ' + receipt.planId +
      ' · live acceptance: ' + (receipt.liveAcceptance || 'pending')));
  }
  function renderPlan(p) {
    pending = null;
    if (p.outcome === 'done') {
      const wrap = element('div', 'text-control-plan');
      wrap.append(element('strong', '', p.title + ' · read only'));
      wrap.append(element('pre', 'text-control-data', JSON.stringify(p.result, null, 2)));
      result.replaceChildren(wrap);
      return;
    }
    if (p.outcome !== 'approval_required') {
      const message = p.question || (p.outcome === 'unavailable'
        ? p.title + ' unavailable (' + p.readiness + '). ' + (p.precondition || '')
        : p.outcome === 'interpretation_required'
          ? 'Unknown command. No AI candidate or action has been authorized.'
          : 'More information is needed.');
      say(message + ' Nothing changed.', p.outcome === 'unavailable' ? 'warning' : '');
      return;
    }
    pending = { planId: p.planId, planDigest: p.planDigest };
    const box = element('div', 'text-control-plan');
    box.append(element('h3', '', 'Approve exactly this action?'));
    box.append(element('strong', '', p.title + ' · ' + p.risk));
    box.append(element('pre', 'text-control-data', JSON.stringify(p.args, null, 2)));
    if (['wiki.section.edit','wiki.capture.save'].includes(p.actionId) && p.preview) {
      box.append(element('h4', '', 'Wiki section · ' + p.preview.target));
      box.append(element('p', 'text-control-note', 'Edit exact Wiki revision ' + p.preview.expectedRevision));
      box.append(element('strong', '', 'Before'));
      box.append(element('pre', 'text-control-data', p.preview.before));
      box.append(element('strong', '', 'After'));
      box.append(element('pre', 'text-control-data', p.preview.after));
    }
    box.append(element('p', 'text-control-note', 'Plan digest: ' + p.planDigest +
      ' · expires ' + new Date(p.expiresAt).toLocaleString()));
    if (p.liveAcceptance !== 'verified') box.append(element('p', 'text-control-note warning',
      'Host executor is wired, but live acceptance is still pending.'));
    const actions = element('div', 'text-control-actions');
    actions.append(button('Approve & apply on PC', () => apply(pending), 'primary'),
      button('Cancel · make no changes', () => {
        pending = null; say('Cancelled. No action was executed.');
      }));
    box.append(actions);
    result.replaceChildren(box);
  }
  async function plan(body) {
    if (busy || !csrfProof) return;
    setBusy(true);
    pending = null;
    say('Validating the command against your PC catalog…');
    try { renderPlan(await api('plan', body)); }
    catch (e) { say((e.code === 'CONTROL_UNCERTAIN' ? 'Outcome uncertain: ' : '') + e.message, 'warning'); }
    finally { setBusy(false); }
  }
  async function apply(expected) {
    if (busy || !csrfProof || !expected || pending !== expected) return;
    pending = null; // consume the visible approval immediately: double taps cannot resend
    setBusy(true);
    say('Waiting for the Host receipt. If interrupted, inspect recent decisions; do not retry blindly.');
    try {
      const receipt = await api('execute', expected);
      const box = element('div', 'text-control-plan');
      box.append(element('strong', '', receipt.actionId + ' · ' + receipt.status));
      appendReceipt(box, receipt);
      result.replaceChildren(box);
      await refreshRecent();
      await refreshPreferences();
      await refreshWebMemory();
      await refreshDevices();
    } catch (e) {
      const box = element('div', 'text-control-plan');
      box.append(element('p', 'text-control-note warning',
        'No response proving success. Check plan status before any new attempt: ' + e.message));
      box.append(button('Check original plan', () => inspect(expected.planId)));
      result.replaceChildren(box);
    } finally { setBusy(false); }
  }
  function actionEditor(a) {
    const item = element('details', 'text-control-action');
    const summary = element('summary');
    summary.append(element('strong', '', a.title), element('span', '', a.risk + ' · ' +
      (a.executable ? 'Host wired' : 'Unavailable')));
    item.append(summary);
    const detail = element('div', 'text-control-action-body');
    detail.append(element('small', 'text-control-note', a.actionId));
    const inputs = {};
    for (const [key, spec] of Object.entries(a.args || {})) {
      const label = element('label', 'text-control-field');
      label.append(element('span', '', key));
      let input;
      if (spec.type === 'enum') {
        input = element('select');
        for (const val of spec.values) {
          const opt = element('option', '', val);
          opt.value = val;
          input.append(opt);
        }
      } else {
        input = element((a.actionId==='program.validate'&&key==='program')||(a.actionId==='program.read_wiki'&&key==='commands')||(a.actionId==='versions.compare.pinned'&&key==='selection')?'textarea':'input');
        if(a.actionId==='program.validate'&&key==='program'){
          input.rows=8;input.placeholder='JSON program: id, revision, steps (no policy or effect authorizations)';
          detail.append(element('p','text-control-note','Local Rust validation only. Host fixes the policy to R0, no external destinations or effect candidates. Source references must match current committed Wiki evidence, including older sections still current. Validation does not execute the steps.'));
        }else if(a.actionId==='program.read_wiki'&&key==='commands'){
          input.rows=6;input.placeholder='list wiki pages\nread wiki page sprint-notes in section specs';
          detail.append(element('p','text-control-note','Enter 2–8 Wiki read commands, one per line. Native validation precedes a consistent read-only snapshot. No writes, providers or automatic execution of effects.'));
        }else if(a.actionId==='versions.compare.pinned'&&key==='selection'){
          input.rows=8;input.placeholder='JSON selection: schema, sources [{repo, sha}], targetIndex';
          detail.append(element('p','text-control-note','Explicit pinned comparison only. Requires a configured source adapter and active repository grant.'));
        }else input.type = 'text';
        input.minLength = spec.min;
        input.maxLength = spec.max;
        if(a.actionId!=='program.validate'&&a.actionId!=='program.read_wiki'&&a.actionId!=='versions.compare.pinned')input.placeholder = key;
      }
      inputs[key] = input; label.append(input); detail.append(label);
    }
    if (a.examples?.length) detail.append(element('p', 'text-control-note', 'Try: ' + a.examples[0]));
    detail.append(button(a.executable ? 'Review this action' : 'Inspect availability', () =>
      plan({ actionId: a.actionId, args: Object.fromEntries(Object.entries(inputs).map(([k, v]) => [k, ['program.validate','program.read_wiki','versions.compare.pinned'].includes(a.actionId)?v.value.trim():v.value])) })));
    item.append(detail);
    return item;
  }
  function renderCatalog(actions) {
    catalogBox.replaceChildren();
    const dev=element('details','text-control-action');
    dev.append(element('summary','','Development sources and version intelligence'));
    const view=element('div','text-control-action-body');dev.append(view);catalogBox.append(dev);
    async function refreshDevelopment(){
      if(!csrfProof)return;
      view.replaceChildren(element('p','text-control-note','Reading owner-authorized sources…'));
      try{
        const data=await api('development/status');if(!csrfProof||!view.isConnected)return;
        const controls=element('div','text-control-action-body');
        controls.append(element('pre','text-control-data',JSON.stringify({hq:data.hq,hvi:data.hvi},null,2)));
        const name=element('input');name.placeholder='Project name';name.maxLength=128;name.setAttribute('aria-label','Project name');
        const root=element('select');root.setAttribute('aria-label','Approved repository root');
        for(const r of data.approvedRoots??[]){const o=element('option','',r.path);o.value=r.key;root.append(o);}
        const run=async(route,body)=>{if(!csrfProof||busy)return;setBusy(true);try{
          const out=await api('development/'+route,body);say('Development operation result: '+JSON.stringify(out));await refreshDevelopment();
        }catch(e){say(e.message,'warning');}finally{setBusy(false);}};
        if(root.options.length){controls.append(name,root,button('Register selected approved root',()=>run('register',{name:name.value.trim(),rootKey:root.value})),button('Refresh existing HQ index (no Git)',()=>run('index',{})));}
        if(data.hvi?.approvedRepositories?.length){
          const choices=data.hvi.approvedRepositories.map(repo=>{const box=element('input');box.type='checkbox';const label=element('label','text-control-field');label.append(box,element('span','',repo));controls.append(label);return {repo,box};});
          controls.append(button('Grant selected repositories for 1 hour',()=>run('hvi-grant',{repoIdentities:choices.filter(x=>x.box.checked).map(x=>x.repo),expiresInMs:3600000})));
        }
        if(data.hvi?.grant?.granted)controls.append(button('Revoke repository grant',()=>run('hvi-revoke',{})));
        controls.append(button('Refresh source status',()=>void refreshDevelopment()));view.replaceChildren(controls);
      }catch(e){view.replaceChildren(element('p','warning',e.message),button('Retry',()=>void refreshDevelopment()));}
    }
    dev.addEventListener('toggle',()=>{if(dev.open)void refreshDevelopment();});
    const groups = new Map();
    for (const a of actions) {
      const name = a.category || 'other';
      if (!groups.has(name)) groups.set(name, []);
      groups.get(name).push(a);
    }
    for (const [name, entries] of groups) {
      const group = element('section', 'text-control-category');
      group.append(element('h3', '', name));
      for (const a of entries) group.append(actionEditor(a));
      catalogBox.append(group);
    }
    examples.replaceChildren();
    for (const a of actions.filter(a => a.executable).slice(0, 6)) {
      if (!a.examples?.length) continue;
      examples.append(button(a.examples[0], () => {
        text.value = a.examples[0];
        text.focus();
      }, 'example'));
    }
  }
  async function refreshPreferences() {
    if (!csrfProof || !preferenceList) return;
    try {
      const response = await api('plan', {
        actionId: 'personalization.preference.list', args: {}
      });
      preferenceList.replaceChildren();
      if (response.outcome !== 'done' || response.result?.state !== 'source-backed') {
        preferenceList.append(element('p','text-control-note',
          'Saved preferences unavailable. No profile data was inferred.'));
        return;
      }
      const records = response.result.preferences || [];
      if (!records.length) preferenceList.append(element('p','text-control-note',
        'No owner-saved preferences yet.'));
      for (const pref of records) {
        const item = element('div', 'text-control-recent-row');
        item.append(element('span', '', pref.value));
        item.append(button('Review removal', () => plan({
          actionId:'personalization.preference.remove',args:{id:pref.id}
        })));
        preferenceList.append(item);
      }
    } catch (error) {
      preferenceList.replaceChildren(element('p','text-control-note warning',
        'Unable to read saved preferences: '+error.message));
    }
  }
  async function refreshDevices() {
    if (!csrfProof || !deviceList) return;
    try {
      const data = await api('devices');
      deviceList.replaceChildren();
      const grants = data.grants || [];
      deviceStatus.textContent = grants.length ? grants.length + ' device requests · approval is PC-only' : 'No device enrollment requests yet.';
      for (const g of grants) {
        const item = element('section', 'text-control-category');
        const label = element('h3', '', (g.deviceId || 'Unknown device').slice(0, 16) + ' · ' + g.status);
        item.append(label);
        item.append(element('p', 'fineprint', 'Requested: ' + (g.scopes || []).join(', ')));
        if (g.status === 'pending') {
          const selected = new Map();
          for (const scope of g.scopes || []) {
            const line = element('label', 'text-control-field');
            const checkbox = element('input'); checkbox.type = 'checkbox'; checkbox.checked = true;
            selected.set(scope, checkbox);
            line.append(checkbox, element('span', '', scope)); item.append(line);
          }
          item.append(button('Review permissions', () => {
            const approved=[...selected].filter(([,v])=>v.checked).map(([k])=>k);
            if (!approved.length) {
              deviceStatus.textContent='Select at least one requested permission to review.';
              return;
            }
            // Same typed R2 plan and digest-bound owner approval as text input.
            // The GUI must never call the enrollment mutation directly.
            plan({actionId:'devices.approve',args:{
              grant_id:g.grantId,scopes:approved.join(',')
            }});
          }, 'primary'));
        }
        if (g.status === 'active') item.append(button('Review revocation', () => {
          // Revoke is a sensitive R2 operation. Route the GUI through the same
          // digest-bound plan, explicit approval, execution fence and receipt as
          // "revoke phone grant ..." text commands.
          plan({actionId:'devices.revoke',args:{grant_id:g.grantId}});
        }));
        deviceList.append(item);
      }
    } catch (e) { deviceStatus.textContent = 'Unable to read devices: ' + e.message; }
  }
  // Private observed history: same read model as paired Direct phone, no automatic send.
  const memoryItems = $('host-web-memory-items');
  const memoryStatus = $('host-web-memory-status');
  const memorySite = $('host-web-memory-site');
  const memoryMore = $('host-web-memory-more');
  let memoryCursor = null;
  async function refreshWebMemory(append = false) {
    if (!memoryItems || !memoryStatus || !memorySite || !memoryMore) return;
    if (!csrfProof) {
      memoryItems.replaceChildren();
      memoryStatus.textContent = 'Unlock the private Host session to read browser memory.';
      memoryMore.hidden = true; return;
    }
    if (!append) { memoryCursor = null; memoryItems.replaceChildren(); }
    memoryStatus.textContent = 'Checking source-linked visits on this PC…';
    try {
      const params = new URLSearchParams({ limit: '20' });
      if (memorySite.value.trim()) params.set('site', memorySite.value.trim().toLowerCase());
      if (append && memoryCursor) params.set('cursor', memoryCursor);
      const view = await api('web-memory?' + params.toString());
      memoryStatus.textContent = view.state + ' · ' + view.coverage + ' · ' + (view.lastRefreshAt || 'not refreshed') +
        '. ' + view.note;
      for (const visit of view.items || []) {
        const row = element('div', 'text-control-recent-row');
        const link = element('a', '', visit.site + ' · ' + new Date(visit.observedAt).toLocaleString());
        link.href = visit.url; link.target = '_blank'; link.rel = 'noopener noreferrer';
        const origin = element('p', 'fineprint',
          visit.url + ' · ' + visit.sourceOrigin + ' · ' + visit.trust + (visit.reduced ? ' · URL reduced for privacy' : ''));
        row.append(link, origin); memoryItems.append(row);
      }
      if (!append && !(view.items || []).length) memoryItems.append(element('p', 'fineprint', view.note));
      memoryCursor = view.nextCursor || null;
      memoryMore.hidden = !memoryCursor;
    } catch (e) {
      memoryStatus.textContent = 'History unavailable: ' + e.message;
      memoryMore.hidden = true;
    }
  }
  $('host-web-memory-refresh')?.addEventListener('click', () => refreshWebMemory());
  memorySite?.addEventListener('keydown', event => {
    if (event.key === 'Enter') { event.preventDefault(); refreshWebMemory(); }
  });
  memoryMore?.addEventListener('click', () => { if (memoryCursor) refreshWebMemory(true); });

  async function unlockControl() {
    if (busy) return;
    setBusy(true);
    try {
      if (!csrfProof) await nativeSession();
      if (!csrfProof) {
        showLocked('Open the installed VIVIM desktop app to authorize this session.');
        return;
      }
      const discovered = await api('catalog');
      catalog = discovered;
      renderCatalog(discovered.actions || []);
      const covered = discovered.coverage;
      status.textContent = 'Private desktop session · ' + (covered ?
        covered.sourceWired + ' source-wired · ' + covered.verified + ' verified · ' + covered.unavailable + ' unavailable' :
        discovered.actions.length + ' cataloged actions') + ' · catalog only, not all VIVIM features';
      lock.hidden = false;
      say('Describe a change, or inspect an existing action. No change happens without your approval.');
      await refreshRecent();
      await refreshPreferences();
    } catch (e) {
      csrfProof = null;
      showLocked('Desktop authorization unavailable: ' + e.message);
    } finally { setBusy(false); }
  }
  unlock.addEventListener('click', unlockControl);
  lock.addEventListener('click', async () => {
    if (csrfProof) {
      try { await api('ui-logout', {}); } catch { /* local state still locks */ }
    }
    csrfProof = null;
    showLocked('Locked. Your private browser session was revoked.');
  });
  form.addEventListener('submit', e => {
    e.preventDefault();
    const value = text.value.trim();
    if (value && value.length <= 1000) plan({ text: value });
    else say('Enter a command of 1–1000 characters. No action executed.');
  });
  // Visible GUI and natural-language commands share the exact same approval
  // plan. The quick control cannot write straight to the bootstrap ledger.
  quickReview?.addEventListener('click', () => {
    const value = quickPreference?.value?.trim() || '';
    if (value.length < 1 || value.length > 200) {
      say('Enter a preference of 1–200 characters. Nothing was saved.');
      return;
    }
    plan({ actionId: 'personalization.preference.add', args: { value } });
  });
  quickPreference?.addEventListener('keydown', event => {
    if (event.key === 'Enter') {
      event.preventDefault();
      quickReview?.click();
    }
  });
  preferenceRefresh?.addEventListener('click',refreshPreferences);
  $('host-control-refresh').addEventListener('click', refreshRecent);
  $('device-refresh')?.addEventListener('click', refreshDevices);
  window.addEventListener('pagehide', () => { csrfProof = null; pending = null; });
  showLocked();
  unlockControl();
})();
