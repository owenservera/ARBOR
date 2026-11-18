// Chat-first VIVIM control on the existing phone Talk surface.
// Every request is planned by the same Host control dispatcher used by Control.
// Nothing is applied from a typed message; approval is a separate deliberate tap.
// Transcript is in-memory only: private control text is never duplicated in storage.
import { createControlClient } from './control-client.mjs';
import { resolveLocalDestination, resolveProductRoute } from './control-language.mjs';

const MAX_TEXT = 1000;
const MAX_TURNS = 30;
const KNOWN_OUTCOMES = new Set([
  'done', 'approval_required', 'clarification_required', 'incomplete',
  'interpretation_required', 'unavailable', 'refused'
]);
export const CONTROL_CHAT_EXAMPLES = Object.freeze([
  'show status', 'open World', 'what can I say?'
]);
export { resolveLocalDestination } from './control-language.mjs';
// Each mounted screen must be able to state what can be asked from it.
// These prompts only fill the shared composer; none of them sends or executes.
const SURFACE_EXAMPLES = Object.freeze({
  today: ['show status', 'open World', 'what can I say?'],
  talk: ['show status', 'open Build', 'what can I say?'],
  build: ['show status', 'open World', 'what can I say?'],
  world: ['open media library', 'show status', 'what can I say?'],
  wiki: ['open Wiki', 'show status', 'what can I say?'],
  me: ['show status', 'open Control', 'what can I say?'],
  control: ['show status', 'open Today', 'what can I say?']
});
export function examplesForSurface(surface) {
  return SURFACE_EXAMPLES[surface] || CONTROL_CHAT_EXAMPLES;
}

export function createControlChat({
  host, transport, fetchImpl, onChange = () => {},
  onNavigate = null, onOpenPocket = null, getSurface = null,
  classifyBuild = null, onBuildDraft = null
} = {}) {
  if (!host || typeof host.replaceChildren !== 'function')
    throw new TypeError('Chat transcript root required');
  const client = createControlClient({ transport, fetchImpl });
  const doc = host.ownerDocument;
  let messages = [];
  let busy = false;
  let suggestions = [];
  let loadingSuggestions = false;
  let suggestionEpoch = 0;

  const elem = (tag, className, content) => {
    const node = doc.createElement(tag);
    if (className) node.className = className;
    if (content != null) node.textContent = String(content);
    return node;
  };
  const redraw = () => { render(); onChange(); };
  const note = (text, status = 'info', plan = null, receipt = null) => {
    const msg = { role: 'vivim', text: String(text).slice(0, 1500), status, plan, receipt };
    messages.push(msg);
    if (messages.length > MAX_TURNS) messages = messages.slice(-MAX_TURNS);
    return msg;
  };
  const describe = value => {
    if (value === undefined || value === null) return '';
    if (typeof value === 'string') return value.slice(0, 500);
    try { return JSON.stringify(value).slice(0, 600); } catch { return 'Host returned details unavailable for display'; }
  };
  const planText = plan => {
    switch (plan.outcome) {
      case 'done': {
        const result = plan.result;
        if (plan.actionId === 'wiki.section.read' && typeof result?.content === 'string')
          return result.page + '/' + result.section + ' · Wiki revision ' + result.wikiRevision +
            '\n' + (result.content || '(Empty section)') + (result.relatedPages?.length ? '\nRelated Wiki pages: '+result.relatedPages.join(', ') : '');
        if (plan.actionId === 'wiki.pages.list' && Array.isArray(result?.pages))
          return 'Wiki · revision ' + result.wikiRevision + '\n' +
            (result.pages.map(p => p.page + ': ' + (p.sections.join(', ') || '(no sections)') +
              (p.omittedSections ? ' (+' + p.omittedSections + ' more)' : '') +
              (p.relatedPages?.length ? ' · related: '+p.relatedPages.join(', ') : '')).join('\n') || '(No pages)') +
            (result.omitted ? '\n' + result.omitted + ' more pages not shown.' : '');
        return (plan.title || 'Done') + (result === undefined ? '' : '\n' + describe(result));
      }
      case 'approval_required':
        return (plan.title || 'Proposed change') + '\nReview the exact plan below. Nothing has changed yet.';
      case 'clarification_required':
      case 'incomplete':
        return (plan.question || 'Please give more detail.') + '\nNothing changed.';
      case 'interpretation_required':
        return 'VIVIM does not recognize that command yet. Try an available command; nothing was executed.';
      case 'refused':
        return (plan.refusal?.message || 'Your PC refused this action.') + '\nNothing changed.';
      case 'unavailable':
        return (plan.title || 'That action') + ' is not available (' + (plan.readiness || 'not ready') + '). Nothing changed.';
      default:
        return 'The Host returned an unsupported plan state. Nothing changed.';
    }
  };

  // A refused or expired Host answer is its own outcome, not a generic error.
  function fail(reply, error) {
    const code = error?.code;
    reply.status = code === 'CONTROL_PLAN_EXPIRED' ? 'expired'
      : code === 'CONTROL_REFUSED' ? 'denied' : 'error';
    reply.text = (code === 'CONTROL_PLAN_EXPIRED'
      ? 'This plan expired before approval. Nothing was applied. Ask again for a fresh preview.'
      : code === 'CONTROL_REFUSED'
        ? 'Your PC refused this action. Nothing changed.'
        : String(error?.message || 'The PC could not preview this command. No action was approved.')
    ).slice(0, 500);
  }

  async function settle(reply, plan, requestText = null) {
    if (!plan || !KNOWN_OUTCOMES.has(plan.outcome)) {
      reply.text = 'The PC returned an unrecognized control response. Nothing changed.';
      reply.status = 'error';
      return;
    }
    // This device receives only the phone-safe Wiki scope. Keep context in the
    // existing transient transcript; never persist or forward it to a provider.
    reply.requestContext=plan.requestContext?.schema==='vivim.request-context/1'&&
      plan.requestContext.authority==='read-only'?plan.requestContext.wiki:null;
    if (plan.outcome === 'approval_required') {
      // Throws on a malformed or expired plan; the caller renders the refusal.
      client.validatePlan(plan);
      reply.text = planText(plan);
      reply.status = 'approval';
      reply.plan = plan;
      return;
    }
    reply.text = planText(plan);
    reply.meaning = plan.language?.vec?.proposal ?? null;
    reply.status = plan.outcome === 'refused' ? 'denied' : plan.outcome === 'done' ? 'done'
      : plan.outcome === 'interpretation_required' ? 'unrecognized'
        : plan.outcome === 'clarification_required' || plan.outcome === 'incomplete' ? 'clarify'
          : 'info';
    if (reply.status === 'unrecognized') {
      reply.requestText = requestText;
      let reading=null;
      if(requestText&&typeof onBuildDraft==='function'&&typeof classifyBuild==='function'){
        try{reading=await classifyBuild(requestText);}
        catch{reply.status='denied';reply.text='Host UI revision unavailable. Nothing changed.';return;}
      }
      const route=resolveProductRoute(requestText,{hostMeaning:plan,
        compileUi:reading?()=>reading:null});
      if(route.kind==='ui'){
        reply.status='build';
        reply.text=route.reading.outcome==='candidate'
          ? 'VEC recognized a visual change. Open Build to review it; nothing was applied.'
          : 'VEC needs more detail about the visual target. Continue in Build; nothing was applied.';
      }else if(route.kind==='refused'||route.kind==='unavailable'){
        reply.status='denied';
        reply.text='That request cannot be safely previewed. Nothing changed.';
      }
    }
    reply.choices = Array.isArray(plan.choiceDetails)
      ? plan.choiceDetails.filter(choice => choice && typeof choice.actionId === 'string' &&
        choice.actionId && (choice.readiness === undefined ||
          ['source_wired', 'verified'].includes(choice.readiness))).slice(0, 6)
      : [];
    if (!reply.choices.length) reply.choices = null;
    if (reply.status === 'clarify' && requestText) reply.requestText = requestText;
  }

  // A Host-supplied follow-up (clarification choice or receipt undo) becomes a
  // fresh preview. It never executes: the new plan still needs its own approval.
  async function requestAction(source, action, label, once) {
    if (busy || !action || typeof action.actionId !== 'string' || !action.actionId) return;
    const args = action.args && typeof action.args === 'object' && !Array.isArray(action.args)
      ? action.args : {};
    if (once) source[once] = true;
    busy = true;
    const reply = note(label, 'waiting');
    redraw();
    try {
      await settle(reply, await client.call('plan', { actionId: action.actionId, args }), source.requestText || null);
    } catch (error) {
      fail(reply, error);
    } finally {
      busy = false;
      redraw();
    }
  }

  async function send(raw) {
    const text = String(raw || '').trim();
    if (busy || !text || text.length > MAX_TEXT) return false;
    // A newer prompt supersedes only unapproved drafts, never a claimed effect.
    for (const msg of messages) {
      if (msg.status === 'approval') { msg.status = 'cancelled'; msg.plan = null; msg.text += '\nSuperseded by a new request.'; }
    }
    messages.push({ role: 'owner', text, status: 'sent' });
    const destination = resolveLocalDestination(text);
    if (destination) {
      const available = destination === 'pocket'
        ? typeof onOpenPocket === 'function'
        : typeof onNavigate === 'function';
      note(available ? 'Opening ' + (destination === 'pocket' ? 'offline Pocket' : destination) +
        '… No command or AI message was sent.' :
        'This screen is not available on the current device. Nothing changed.', available ? 'done' : 'info');
      redraw();
      if (available) {
        if (destination === 'pocket') onOpenPocket();
        else onNavigate(destination);
      }
      return true;
    }
    const reply = note('Asking your PC to preview the command…', 'waiting');
    busy = true;
    redraw();
    try {
      await settle(reply, await client.preview(text), text);
    } catch (error) {
      fail(reply, error);
    } finally {
      busy = false;
      redraw();
    }
    return true;
  }

  // Tell the existing PWA Wiki tab to re-read Host state only after a
  // verified applied Wiki receipt. This event carries no mutation authority.
  function notifyWikiCommitted(receipt) {
    if (receipt?.status === 'applied' && ['wiki.section.edit','wiki.page.create','wiki.page.move','wiki.pages.link'].includes(receipt.actionId) &&
        Number.isSafeInteger(receipt.result?.wikiRevision)) {
      host.dispatchEvent(new CustomEvent('vivim:wiki-committed', {
        bubbles: true, detail: { revision: receipt.result.wikiRevision }
      }));
    }
  }

  async function approve(reply) {
    if (busy || reply.status !== 'approval' || !reply.plan) return;
    const plan = reply.plan;
    reply.planId = plan.planId;
    reply.planDigest = plan.planDigest;
    // Synchronous lock blocks double taps. No fallback and no retries.
    reply.status = 'applying';
    busy = true;
    redraw();
    try {
      const receipt = await client.execute(plan);
      reply.receipt = receipt;
      notifyWikiCommitted(receipt);
      reply.status = receipt?.status === 'applied' ? 'done' :
        receipt?.status === 'uncertain' ? 'uncertain' : 'error';
      reply.text = 'Host receipt: ' + describe({
        action: receipt?.actionId ?? plan.actionId ?? plan.title,
        status: receipt?.status ?? 'unknown',
        receipt: receipt?.planId ?? null,
        error: receipt?.error?.code ?? null
      }) + '\nNo automatic retry was performed.';
    } catch (error) {
      reply.status = error?.code === 'CONTROL_UNCERTAIN' ? 'uncertain'
        : error?.code === 'CONTROL_PLAN_EXPIRED' ? 'expired'
          : error?.code === 'CONTROL_REFUSED' ? 'denied' : 'error';
      reply.text = (reply.status === 'uncertain'
        ? 'Outcome uncertain. Check the Host receipt before issuing another action. VIVIM has not retried.'
        : reply.status === 'expired'
          ? 'This plan expired before it was applied. Nothing changed. Ask again for a fresh preview.'
          : reply.status === 'denied'
            ? 'Your PC refused this action. Nothing changed.'
            : String(error?.message || 'The PC refused this action.')) + '\nNo automatic retry was performed.';
    } finally {
      reply.plan = null;
      busy = false;
      redraw();
    }
  }

  async function reconcile(reply) {
    if (busy || reply.status !== 'uncertain' || !reply.planId || !reply.planDigest) return;
    busy = true;
    reply.status = 'reviewing';
    redraw();
    try {
      // Existing read-only status route: never invokes the plan or executor again.
      const status = await client.status(reply.planId);
      const receipt = status?.receipt;
      if (status?.planId === reply.planId &&
          receipt?.schema === 'vivim.control-receipt/1' &&
          receipt?.planId === reply.planId &&
          receipt?.planDigest === reply.planDigest &&
          ['applied', 'failed', 'uncertain'].includes(receipt.status)) {
        reply.receipt = receipt;
        notifyWikiCommitted(receipt);
        reply.status = receipt.status === 'applied' ? 'done'
          : receipt.status === 'failed' ? 'error' : 'uncertain';
        reply.text = 'Reconciled Host receipt: ' + describe({
          action: receipt.actionId, status: receipt.status, receipt: receipt.planId
        }) + '\nNo command was sent again.';
      } else {
        reply.status = 'uncertain';
        reply.text = 'The Host has not returned a matching settled receipt. Review this action on your PC. No retry occurred.';
      }
    } catch {
      reply.status = 'uncertain';
      reply.text = 'Unable to read the Host receipt. Reconnect and check again; no action was repeated.';
    } finally {
      busy = false;
      redraw();
    }
  }

  function cancel(reply) {
    if (busy || reply.status !== 'approval') return;
    reply.plan = null;
    reply.status = 'cancelled';
    reply.text = 'Cancelled. No change was applied.';
    redraw();
  }

  function exampleChip(text) {
    const button = elem('button', 'chip', text);
    button.type = 'button';
    button.addEventListener('click', () => {
      // Examples fill the shared composer: never auto-send a command.
      host.dispatchEvent(new CustomEvent('vivim:control-example', { bubbles: true, detail: { text } }));
    });
    return button;
  }

  function receiptCard(msg) {
    const receipt = msg.receipt;
    const card = elem('div', 'vivim-receipt');
    if (receipt.replayed) card.append(elem('p', 'ux-meta', 'This receipt was already applied; nothing ran twice.'));
    if (receipt.result !== undefined) card.append(elem('pre', 'ux-note', describe(receipt.result)));
    if (receipt.status === 'applied' && ['wiki.section.edit','wiki.page.create','wiki.page.move','wiki.pages.link'].includes(receipt.actionId) &&
        typeof onNavigate === 'function') {
      const open = elem('button', 'btn sm ux-secondary', 'View updated Wiki');
      open.type = 'button';
      open.addEventListener('click', () => onNavigate('wiki'));
      card.append(open);
    }
    const undo = receipt.undo;
    if (!msg.undoRequested && undo && typeof undo.actionId === 'string' && undo.actionId) {
      const button = elem('button', 'btn sm ux-secondary', 'Undo this change');
      button.type = 'button';
      button.addEventListener('click', () => {
        void requestAction(msg, undo, 'Preparing the undo plan…', 'undoRequested');
      });
      card.append(button);
    }
    return card.children.length ? card : null;
  }

  function render() {
    const fragment = doc.createDocumentFragment();
    // The mounted screen names what can be asked from here; prompts only fill
    // the shared composer and never send, approve or execute.
    const surface = typeof getSurface === 'function' ? getSurface() : null;
    const prompts = suggestions.length ? suggestions : examplesForSurface(surface);
    if (!messages.length) {
      const empty = elem('div', 'vivim-intro');
      empty.append(elem('span', 'tour-eyebrow', 'YOUR MACHINE · YOUR AI'),
        elem('h3', '', 'Ask VIVIM'),
        elem('p', 'muted', 'Ask what is happening on your PC or describe a change. VIVIM previews an available action and asks you to approve before applying it.'),
        elem('p', 'ux-meta', transport.direct ? 'Direct Host · owner-controlled actions' : 'Connect to your PC directly to use controls'),
        elem('p', 'ux-meta', 'What can I ask here'));
      const examples = elem('div', 'vivim-examples');
      for (const text of prompts) examples.append(exampleChip(text));
      empty.append(examples);
      fragment.append(empty);
    }
    for (const msg of messages) {
      const row = elem('div', 'm ' + (msg.role === 'owner' ? 'u' : 'a'));
      if (msg.role !== 'owner') row.append(elem('div', 'badge', 'VIVIM · HOST'));
      const bubble = elem('div', 'bub', msg.text);
      bubble.style.whiteSpace = 'pre-wrap';
      if (['error', 'uncertain', 'denied', 'expired'].includes(msg.status)) row.classList.add('err');
      row.append(bubble);
      if (msg.status === 'waiting' || msg.status === 'applying' || msg.status === 'reviewing')
        row.append(elem('div', 'ux-meta', msg.status === 'applying' ? 'Applying once · waiting for receipt…' :
          msg.status === 'reviewing' ? 'Reading the Host receipt · no second execution' : 'Previewing · no action executed'));
      if (msg.receipt) {
        const card = receiptCard(msg);
        if (card) row.append(card);
      }
      if (msg.status === 'denied' || msg.status === 'expired')
        row.append(elem('div', 'ux-meta', 'No effect was applied. Nothing was retried.'));
      if (msg.status === 'uncertain' && msg.planId) {
        const check = elem('button', 'btn sm ux-secondary', 'Check PC receipt');
        check.type = 'button';
        check.addEventListener('click', () => { void reconcile(msg); });
        row.append(check);
      }
      const meaning = msg.plan?.language?.vec?.proposal ?? msg.meaning;
      if (meaning?.schema === 'vivim.command-intent/0.1' && meaning.canonical)
        row.append(elem('pre', 'ux-note', meaning.canonical));
      const context=msg.requestContext;
      if(context?.status==='source-backed' && Array.isArray(context.pages)){
        const details=elem('details','vivim-plan');
        details.append(elem('summary','','Wiki context · revision '+context.wikiRevision+' (at planning time)'));
        for(const p of context.pages.slice(0,6)){
          if(!Array.isArray(p.sections))continue;
          details.append(elem('p','ux-note',p.page+' · '+p.relation+' · '+p.sections.join(', ')));
          if(p.relationshipSource)details.append(elem('p','ux-note','Committed link · Wiki rev '+p.relationshipSource.wikiRevision+' · '+p.relationshipSource.ref));
          if(['done','clarify'].includes(msg.status))
            for(const section of p.sections.slice(0,3)){
              const read=elem('button','chip','Read '+p.page+'/'+section);
              read.type='button';
              read.disabled=busy||messages.some(m=>['approval','uncertain','applying','reviewing'].includes(m.status));
              read.addEventListener('click',()=>{
                if(messages.some(m=>['approval','uncertain','applying','reviewing'].includes(m.status)))return;
                void requestAction(msg,{actionId:'wiki.section.read',args:{page:p.page,section}},'Reading selected Wiki section from Host…');
              });
              details.append(read);
            }
        }
        row.append(details);
      }
      if (msg.status === 'build' && msg.requestText) {
        const open = elem('button', 'btn sm ux-secondary', 'Review in Build');
        open.type = 'button';
        open.addEventListener('click', () => { onBuildDraft(msg.requestText); });
        row.append(open);
      }
      if (msg.status === 'unrecognized' && msg.requestText) {
        const redirect = elem('button', 'btn sm ux-secondary', 'Ask my AI instead');
        redirect.type = 'button';
        redirect.addEventListener('click', () => {
          // Explicit mode switch with draft only; never sends to a provider.
          host.dispatchEvent(new CustomEvent('vivim:ask-ai-draft', {
            bubbles: true, detail: { text: msg.requestText }
          }));
        });
        row.append(redirect);
      }
      if (msg.status === 'clarify' && msg.requestText) {
        const revise = elem('button', 'btn sm ux-secondary', 'Edit original request');
        revise.type = 'button';
        revise.addEventListener('click', () => host.dispatchEvent(new CustomEvent('vivim:control-example', {
          bubbles: true, detail: { text: msg.requestText }
        })));
        row.append(revise);
      }
      if (msg.status === 'clarify' && Array.isArray(msg.choices) && !msg.choiceUsed) {
        const choices = elem('div', 'vivim-choices');
        for (const choice of msg.choices) {
          const button = elem('button', 'chip', (choice.title || choice.actionId) +
            (choice.requiredArgs?.length ? ' · needs ' + choice.requiredArgs.join(', ') : ''));
          button.type = 'button';
          button.addEventListener('click', () => {
            // A choice names an action, not its missing arguments. Never fabricate them.
            if (choice.requiredArgs?.length) {
              if (msg.requestText) host.dispatchEvent(new CustomEvent('vivim:control-example', {
                bubbles: true, detail: { text: msg.requestText }
              }));
              return;
            }
            void requestAction(msg, { actionId: choice.actionId, args: {} },
              'Checking that choice with your PC…', 'choiceUsed');
          });
          choices.append(button);
        }
        row.append(choices);
      }
      if (msg.status === 'approval' && msg.plan) {
        const plan = msg.plan;
        const card = elem('div', 'vivim-plan');
        card.append(elem('p', 'ux-meta',
          'Risk ' + String(plan.risk || 'unknown') + ' · Expires ' + new Date(plan.expiresAt).toLocaleTimeString() +
          (plan.liveAcceptance !== 'verified' ? ' · Not live-verified' : '') +
          (typeof plan.planDigest === 'string' ? ' · Plan ' + plan.planDigest.slice(0, 12) : '')));
        const args = plan.args && typeof plan.args === 'object' ? Object.entries(plan.args).slice(0, 12) : [];
        if (args.length) card.append(elem('pre', 'ux-note', JSON.stringify(plan.args, null, 2)));
        if (['wiki.section.edit','wiki.page.create','wiki.page.move','wiki.pages.link'].includes(plan.actionId) && plan.preview) {
          // Host-resolved target and bound revision, not caller-supplied display data.
          card.append(elem('strong', '', 'Wiki · ' + plan.preview.target),
            elem('p', 'ux-meta', 'Revision ' + plan.preview.expectedRevision + ' · Exact change'));
          card.append(elem('strong', '', 'Before'),
            elem('pre', 'ux-note', plan.preview.before));
          card.append(elem('strong', '', 'After'),
            elem('pre', 'ux-note', plan.preview.after));
        }
        const actions = elem('div', 'vivim-plan-actions');
        const yes = elem('button', 'btn pri', 'Approve & apply');
        yes.type = 'button'; yes.addEventListener('click', () => { void approve(msg); });
        const no = elem('button', 'btn', 'Cancel');
        no.type = 'button'; no.addEventListener('click', () => cancel(msg));
        actions.append(yes, no); card.append(actions); row.append(card);
      }
      fragment.append(row);
    }
    // After a settled turn the command box still states what it accepts.
    // Hidden while a plan is armed or an outcome is unresolved.
    const settled = messages.length && !busy &&
      !messages.some(msg => ['approval', 'uncertain', 'applying', 'reviewing'].includes(msg.status));
    if (settled) {
      const next = elem('div', 'vivim-examples');
      next.append(elem('span', 'ux-meta', 'What can I ask here'));
      for (const text of prompts) next.append(exampleChip(text));
      fragment.append(next);
    }
    host.replaceChildren(fragment);
    host.scrollTop = host.scrollHeight;
  }

  async function loadSuggestions() {
    if (loadingSuggestions || suggestions.length || !transport.direct) return;
    const epoch = suggestionEpoch;
    loadingSuggestions = true;
    try {
      const catalog = await client.call('catalog');
      if (epoch !== suggestionEpoch) return;
      const actions = Array.isArray(catalog?.actions) ? catalog.actions : [];
      const verified = actions.filter(a => ['source_wired', 'verified'].includes(a.readiness) &&
        a.risk === 'R0' && Array.isArray(a.examples));
      suggestions = verified.flatMap(a => a.examples.slice(0, 1))
        .filter(s => typeof s === 'string' && s.length <= MAX_TEXT).slice(0, 3);
    } catch { /* keep conservative, local examples; no Host authority claim */ }
    finally {
      loadingSuggestions = false;
      if (epoch === suggestionEpoch && !messages.length) redraw();
    }
  }

  // Session-loss redaction never cancels an already claimed Host effect or
  // retries an uncertain action. It only drops private local presentation.
  function redact() {
    suggestionEpoch++;
    messages = [];
    suggestions = [];
    redraw();
  }

  function clear() {
    if (busy || messages.some(msg => msg.status === 'uncertain')) return false;
    messages = [];
    redraw();
    return true;
  }
  return Object.freeze({
    send, render, clear, redact, loadSuggestions, interpret: text => client.interpret(text), assist: text => client.assist(text), busy: () => busy,
    hasPendingApproval: () => messages.some(msg => msg.status === 'approval')
  });
}
