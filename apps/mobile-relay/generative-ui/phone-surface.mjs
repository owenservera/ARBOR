// Phone-side Build surface: renders the Host-committed vivim.ui-revision/1 surface
// and exposes component taps as inert semantic inspection. Explicit Build activation
// uses the existing bootstrap command channel. Browser-only; no Node imports.
// A tap never sends a provider prompt and is never automatically resent while uncertain.
import { renderSurface } from './renderer.mjs';
import { compileUiProposal } from './compiler.mjs';
import { createSurface } from './catalog.mjs';
import { projectVisualIntent } from './semantic-projection.mjs';
import { transport } from '../transport.mjs';
import { createHostRevisionGuard } from './host-revision-guard.mjs';

const PAUSE = ms => new Promise(resolve => setTimeout(resolve, ms));
let mounted = false;
let surface = null;
let pending = false;
let handleStatus = () => {};
let clearBuildSurface = () => {};

function locate(node, id) {
  if (node.id === id) return node;
  for (const c of node.children ?? []) {
    const found = locate(c, id);
    if (found) return found;
  }
  return null;
}

// Component intents are UI-local; the semantic projection names the same tap with a
// visual intent. A projection that does not describe this component leaves the tap
// name-only, so rendering and previewing never depend on the projection.
const MEANING_INTENT = Object.freeze({
  'select-component': 'select',
  'preview-only': 'select',
  'inspect-meaning': 'inspect-meaning',
  'preview-layout': 'preview-layout',
  'preview-style': 'preview-style'
});

function meaningOf(intent, semantic) {
  if (!semantic) return null;
  const visual = MEANING_INTENT[intent.intent];
  if (!visual) return null;
  try {
    return projectVisualIntent({ source: 'tap', targetId: intent.targetId, intent: visual, layout: null, style: null, semantic });
  } catch { return null; }
}

export async function sendProposal(proposal, current) {
  // Pre-validate locally so an invalid proposal is never queued as uncertain.
  compileUiProposal({ proposal, surface: current, approvedRefs: [] });
  const created = await transport.request('commands', {
    method: 'POST',
    body: JSON.stringify({ text: 'apply-proposal', kind: 'command', consumer: 'bootstrap', mode: 'bootstrap', action: 'apply-proposal', proposal })
  });
  if (!created?.id) throw new Error('Relay did not acknowledge command');
  for (let i = 0; i < 25; i++) {
    await PAUSE(1200);
    const state = await transport.request('commands/' + created.id);
    if (state?.status === 'done') return state;
    if (state?.status === 'failed') throw new Error(String(state.result || 'Command failed').slice(0, 160));
  }
  throw new Error('Command pending or uncertain; not resent');
}

async function repaint() {
  try {
    const status = await transport.request('status');
    handleStatus(status);
  } catch { clearBuildSurface(); /* offline or unauthorized projections must not remain actionable */ }
}

export function mountBuildSurface(mount, { onCommit = () => {}, semantic = null, readOnly = false } = {}) {
  if (mounted) throw new Error('Build surface already mounted');
  mounted = true;
  const revisionGuard = createHostRevisionGuard();
  let initialDraft = null;

  function clear() {
    revisionGuard.disconnect();
    surface = null;
    initialDraft = null;
    if (mount?.replaceChildren) mount.replaceChildren();
  }
  clearBuildSurface = clear;

  function render(s) {
    if (!mount || !mount.replaceChildren || !mount.ownerDocument) return;
    renderSurface(mount, s, {
      audience: 'phone',
      tierflow: true,
      approvedRefs: [],
      onIntent: (intent) => {
        if (readOnly || pending || !surface || intent.revision !== surface.revision || intent.surfaceId !== surface.surfaceId) return;
        const component=locate(surface.tree,intent.targetId);
        if(!component)return;
        const meaning=meaningOf(intent,semantic);
        let selected=mount.querySelector?.('[data-build-selection]');
        if(!selected){
          selected=mount.ownerDocument.createElement('p');
          selected.setAttribute('data-build-selection','');
          selected.setAttribute('role','status');
          mount.appendChild(selected);
        }
        selected.textContent='Selected '+component.id+' · '+component.type+
          (meaning?' · '+meaning.intent:'')+' · use Build to preview a change. Nothing changed.';
      }
    });
    surface = s; // only a successfully validated and painted Host snapshot is actionable
  }

  // Read-only Host snapshot gate. A revision envelope is not a renderable document.
  function setSurface(record, bootstrap = null) {
    initialDraft = null;
    const next = revisionGuard.observe(record);
    if (next.state !== 'ready') {
      clear();
      // A fresh, authenticated, explicitly empty Host projection is the only
      // source for revision-zero design. Never paint it as a committed surface
      // or treat an unavailable/reverted head as a new empty document.
      if (!readOnly && record === null && bootstrap?.state === 'ready' &&
          bootstrap.schema === 'vivim.bootstrap-phone/1' &&
          Object.hasOwn(bootstrap, 'uiRevision') && bootstrap.uiRevision === null &&
          revisionGuard.status().highRevision === null) {
        initialDraft = createSurface({ surfaceId: 'my-space' });
      }
      return next;
    }
    if (next.changed) {
      try { render(next.surface); }
      catch {
        clear();
        if (mount?.ownerDocument && mount.replaceChildren) {
          const notice = mount.ownerDocument.createElement('p');
          notice.setAttribute('role','alert');
          notice.textContent = 'Committed UI cannot be safely displayed by TierFlow. Nothing was changed.';
          mount.replaceChildren(notice);
        }
        return { state: 'blocked', reason: 'RENDER_REFUSED', surface: null };
      }
    }
    return next;
  }
  handleStatus = status => setSurface(status?.snapshot?.bootstrap?.uiRevision ?? null, status?.snapshot?.bootstrap);

  window.addEventListener('vivim:bootstrap-status', (e) => handleStatus(e.detail));
  window.addEventListener('vivim:bootstrap-refresh', repaint);
  window.addEventListener('resize', () => {
    if (!surface) return;
    try { render(surface); }
    catch { clear(); }
  });

  return { render, setSurface, clear, surface: () => surface,
    draftSurface: () => initialDraft, pending: () => pending,
    revisionState: () => revisionGuard.status() };
}
