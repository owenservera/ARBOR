// Phone-side Build surface: renders the Host-committed vivim.ui-revision/1 surface
// and turns component taps into semantic intents that the Host commits as a new
// revision through the guarded bootstrap command channel. Browser-only; no Node imports.
// A tap never sends a provider prompt and is never automatically resent while uncertain.
import { renderSurface } from './renderer.mjs';
import { compileUiProposal } from './compiler.mjs';
import { PROPOSAL_SCHEMA } from './catalog.mjs';
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

// A component tap is a semantic action on a stable component ID. It becomes one
// replace-props operation against the revision the phone last rendered.
function intentToOp(intent, current) {
  const comp = locate(current.tree, intent.targetId);
  if (!comp) return null;
  const props = { ...comp.props };
  if (intent.style === 'compact' || intent.style === 'comfortable' || intent.style === 'spacious') props.density = intent.style;
  return { opId: 'tap.' + intent.targetId + '.' + Date.now(), type: 'replace-props', componentId: intent.targetId, props };
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

export function mountBuildSurface(mount, { onCommit = () => {}, semantic = null } = {}) {
  if (mounted) throw new Error('Build surface already mounted');
  mounted = true;
  const revisionGuard = createHostRevisionGuard();

  function clear() {
    revisionGuard.disconnect();
    surface = null;
    if (mount?.replaceChildren) mount.replaceChildren();
  }
  clearBuildSurface = clear;

  function render(s) {
    if (!mount || !mount.replaceChildren || !mount.ownerDocument) return;
    renderSurface(mount, s, {
      audience: 'phone',
      approvedRefs: [],
      onIntent: async (intent) => {
        if (pending || !surface || intent.revision !== surface.revision || intent.surfaceId !== surface.surfaceId) return;
        const op = intentToOp(intent, surface);
        if (!op) return;
        const meaning = meaningOf(intent, semantic);
        const proposal = {
          schema: PROPOSAL_SCHEMA,
          surfaceId: surface.surfaceId,
          baseRevision: surface.revision,
          operations: [op],
          explanation: 'User ' + intent.intent + ' on ' + intent.targetId + (meaning ? ' · meaning ' + meaning.meaningDigest : ''),
          assumptions: [], unknowns: []
        };
        pending = true;
        try {
          await sendProposal(proposal, surface);
          await repaint();
          onCommit();
        } finally {
          pending = false;
        }
      }
    });
    surface = s; // only a successfully validated and painted Host snapshot is actionable
  }

  // Read-only Host snapshot gate. A revision envelope is not a renderable document.
  function setSurface(record) {
    const next = revisionGuard.observe(record);
    if (next.state !== 'ready') { clear(); return next; }
    if (next.changed) {
      try { render(next.surface); }
      catch { clear(); return { state: 'blocked', reason: 'RENDER_REFUSED', surface: null }; }
    }
    return next;
  }
  handleStatus = status => setSurface(status?.snapshot?.bootstrap?.uiRevision ?? null);

  window.addEventListener('vivim:bootstrap-status', (e) => handleStatus(e.detail));
  window.addEventListener('vivim:bootstrap-refresh', repaint);

  return { render, setSurface, clear, surface: () => surface, pending: () => pending,
    revisionState: () => revisionGuard.status() };
}
