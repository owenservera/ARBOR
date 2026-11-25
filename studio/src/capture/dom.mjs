// L3 rendered-DOM observation + user-action timeline, via an isolated-world page agent.
import { readFileSync } from 'node:fs';
import { randomBytes, createHash } from 'node:crypto';
import { capturePrivacy } from './privacy.mjs';

const AGENT_SRC = readFileSync(new URL('./page-agent.js', import.meta.url), 'utf8').trim().replace(/;\s*$/, '');

export class DomObserver {
  constructor({ append, profile }) {
    this.append = append;
    this.profile = profile;
    this.privacy = capturePrivacy(profile);
    this.worldName = `aion_capture_${randomBytes(4).toString('hex')}`;
    this.binding = `__aionBind_${randomBytes(4).toString('hex')}`;
    this.contexts = new Map(); // frameId -> contextId (our isolated world)
    this.mainFrameId = null;
    this.stats = { batches: 0, mutations: 0, actions: 0, agentStarts: 0 };
  }

  _script() {
    const cfg = { flushMs: this.profile.dom?.flushMs, maxBlockTextBytes: this.profile.dom?.maxBlockTextBytes, ignoreTags: this.profile.dom?.ignoreTags };
    return `${AGENT_SRC}(${JSON.stringify(this.binding)}, ${JSON.stringify(cfg)})`;
  }

  async attach(session) {
    this.session = session;
    session.on('Runtime.executionContextCreated', ({ context }) => {
      if (context.name === this.worldName && context.auxData?.frameId) this.contexts.set(context.auxData.frameId, context.id);
    });
    session.on('Runtime.executionContextsCleared', () => this.contexts.clear());
    // A destroyed context must leave the map: a stale id evaluates into nothing and silently
    // yields undefined (measured on reload with Chrome 143), which reads as "no agent".
    session.on('Runtime.executionContextDestroyed', ({ executionContextId }) => {
      for (const [frameId, ctxId] of this.contexts) if (ctxId === executionContextId) this.contexts.delete(frameId);
    });
    // Re-arm the agent after every main-frame navigation. The new-document script hook
    // (Page.addScriptToEvaluateOnNewDocument) did not re-run the agent in its named world on
    // reload (measured, Chrome 143), so an explicit restart after navigation is the reliable path.
    session.on('Page.frameNavigated', ({ frame }) => {
      if (!frame.parentId && frame.id && !frame.url?.startsWith('about:') && this.session) {
        this.rearmTimer ??= setTimeout(() => {
          this.rearmTimer = null;
          if (this.session && !this.session.detached && this.mainFrameId) {
            this.startInFrame(this.mainFrameId).catch(() => { /* page gone or not ready; _evalInMain retries */ });
          }
        }, 250);
      }
    });
    session.on('Runtime.bindingCalled', (p) => { if (p.name === this.binding) this._onMessage(p.payload); });
    await session.send('Runtime.enable');
    await session.send('Runtime.addBinding', { name: this.binding, executionContextName: this.worldName });
    await session.send('Page.enable'); // frameNavigated drives the post-navigation agent re-arm
    // Future documents: the agent starts in our isolated world on every navigation.
    await session.send('Page.addScriptToEvaluateOnNewDocument', { source: this._script(), worldName: this.worldName, runImmediately: false });
    const { frameTree } = await session.send('Page.getFrameTree');
    this.mainFrameId = frameTree.frame.id;
    await this.startInFrame(this.mainFrameId);
  }

  // Page.createIsolatedWorld makes a NEW world on every call, and the agent's own "already running"
  // guard is per world. So before creating one, reuse the known context when its agent is alive:
  // otherwise a re-arm after navigation (when the new-document script did run) or a retry after a
  // transient CDP error starts a second agent on the same document, and every dom.batch and user
  // action is recorded twice.
  async startInFrame(frameId) {
    const known = this.contexts.get(frameId);
    if (known !== undefined) {
      try {
        const alive = await this.session.send('Runtime.evaluate', { expression: '!!(globalThis.__aionCapture && globalThis.__aionCapture.version)', contextId: known, returnByValue: true });
        if (alive?.result?.value === true) return 'already';
      } catch { /* context gone: create a fresh world below */ }
      if (this.contexts.get(frameId) === known) this.contexts.delete(frameId);
    }
    const { executionContextId } = await this.session.send('Page.createIsolatedWorld', { frameId, worldName: this.worldName, grantUniveralAccess: false });
    this.contexts.set(frameId, executionContextId);
    const r = await this.session.send('Runtime.evaluate', { expression: this._script(), contextId: executionContextId, returnByValue: true });
    return r.result?.value;
  }

  _onMessage(payload) {
    let msg;
    try { msg = JSON.parse(payload); } catch { return; }
    if (msg.type === 'dom.batch') {
      this.stats.batches++; this.stats.mutations += msg.items.length;
      for (const it of msg.items) if (it.text) { const s = this.privacy.text(it.text); it.text = s.text; if (s.redactions.length) it.redactions = s.redactions.length; }
      this.append({ k: 'dom.batch', url: this.privacy.url(msg.url), items: msg.items });
    } else if (msg.type === 'action') {
      this.stats.actions++;
      this.append({ k: 'action', kind: msg.kind, url: this.privacy.url(msg.url), target: msg.target, length: msg.length, top: msg.top, height: msg.height, open: msg.open, state: msg.state, shift: msg.shift });
    } else if (msg.type === 'agent.ready') {
      this.stats.agentStarts++;
      this.append({ k: 'lifecycle', event: 'dom_agent_ready', url: this.privacy.url(msg.url) });
    }
  }

  async _evalInMain(expression, returnByValue = true) {
    let ctx = this.contexts.get(this.mainFrameId);
    if (!ctx) { await this.startInFrame(this.mainFrameId); ctx = this.contexts.get(this.mainFrameId); }
    let r;
    try {
      r = await this.session.send('Runtime.evaluate', { expression, contextId: ctx, returnByValue, awaitPromise: true });
    } catch (e) {
      // The cached context can die under us (navigation). Recreate the world once and retry.
      if (this.contexts.get(this.mainFrameId) === ctx) this.contexts.delete(this.mainFrameId);
      await this.startInFrame(this.mainFrameId);
      ctx = this.contexts.get(this.mainFrameId);
      r = await this.session.send('Runtime.evaluate', { expression, contextId: ctx, returnByValue, awaitPromise: true });
    }
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text);
    return r.result;
  }

  async inspect() {
    const r = (await this._evalInMain('globalThis.__aionCapture && globalThis.__aionCapture.inspect()')).value;
    if (r) r.a11y = await this.accessibility().catch((e) => ({ error: String(e.message ?? e) }));
    return r;
  }

  async turns() {
    const t = (await this._evalInMain('globalThis.__aionCapture && globalThis.__aionCapture.turns()')).value ?? [];
    for (const x of t) { const s = this.privacy.text(x.text ?? ''); x.text = s.text; if (s.redactions.length) x.redactions = s.redactions.length; scrubBlocks(x.blocks, this.privacy); }
    return t;
  }

  async blocksOf(nodeId) { const b = (await this._evalInMain(`globalThis.__aionCapture && globalThis.__aionCapture.blocks(${Number(nodeId)})`)).value ?? []; scrubBlocks(b, this.privacy); return b; }

  // Read-only summary of the browser's accessibility tree: semantics independent of markup.
  async accessibility() {
    const before = await currentAxDocument(this.session);
    const { nodes } = await this.session.send('Accessibility.getFullAXTree', {
      depth: 60, ...(before ? { frameId: before.id } : {}) });
    const after = await currentAxDocument(this.session);
    const documentStable = !!before && !!after && before.id === after.id && before.loaderId === after.loaderId
      && before.id === this.mainFrameId;
    if (before && after && !documentStable) return { nodes:0, roles:{}, landmarks:[], liveRegions:[],
      semantics:axUnknown('DOCUMENT_CHANGED') };
    if (!Array.isArray(nodes)) return { nodes:0, roles:{}, landmarks:[], liveRegions:[],
      semantics:axUnknown('AX_TREE_UNAVAILABLE') };
    const roles = Object.create(null); const landmarks = []; const live = [];
    for (const n of nodes.slice(0, AX_MAX_NODES)) {
      if (!n || n.ignored) continue;
      const role = n.role?.value; if (!role) continue;
      roles[role] = (roles[role] ?? 0) + 1;
      if (['main', 'navigation', 'banner', 'contentinfo', 'complementary', 'search', 'form', 'region'].includes(role)) landmarks.push({ role, name: typeof n.name?.value === 'string' ? this.privacy.text(n.name.value.slice(0, 60)).text : undefined });
      const lv = n.properties?.find((p) => p.name === 'live'); if (lv && lv.value?.value !== 'off') live.push({ role, name: typeof n.name?.value === 'string' ? this.privacy.text(n.name.value.slice(0, 60)).text : undefined, live: lv.value?.value });
    }
    return { nodes: nodes.length, roles, landmarks: landmarks.slice(0, 30), liveRegions: live.slice(0, 20),
      semantics:projectAccessibilitySemantics(nodes, { documentStable, frameId:before?.id }) };
  }

  async snapshot() {
    const v = (await this._evalInMain('globalThis.__aionCapture && globalThis.__aionCapture.snapshot()')).value;
    if (v?.html) { const s = this.privacy.text(v.html); v.html = s.text; v.redactions = s.redactions.length; }
    return v;
  }

  // Visual highlight via the DevTools overlay (draws above the page; does not modify its DOM).
  async highlight(nodeId) {
    const r = await this._evalInMain(`globalThis.__aionCapture && globalThis.__aionCapture.node(${Number(nodeId)})`, false);
    if (!r.objectId) return false;
    try { await this.session.send('DOM.enable'); await this.session.send('Overlay.enable'); } catch { /* already */ }
    await this.session.send('Overlay.highlightNode', { objectId: r.objectId, highlightConfig: { showInfo: true, contentColor: { r: 64, g: 140, b: 255, a: 0.25 }, borderColor: { r: 64, g: 140, b: 255, a: 0.9 } } });
    await this.session.send('Runtime.releaseObject', { objectId: r.objectId }).catch(() => {});
    return true;
  }

  async clearHighlight() { try { await this.session.send('Overlay.hideHighlight'); } catch { /* ignore */ } }
}

// Structural AX semantics are observation-local, not durable IDs or effect bindings.
// Do not expand the saved inspection with arbitrary accessible names, text values,
// backend node handles or user-authored labels. Only fixed UI vocabulary is emitted.
const AX_CONTROL_ROLES = new Set(['button','togglebutton','link','textbox','searchbox','combobox',
  'checkbox','radio','switch','menuitem','menuitemcheckbox','menuitemradio','tab','option',
  'slider','spinbutton','scrollbar','treeitem','gridcell','columnheader','rowheader','listbox']);
const AX_CONTEXT_ROLES = new Set(['main','navigation','banner','contentinfo','complementary',
  'search','form','region','dialog','alertdialog','status','alert','menu','menubar','tablist','tree','grid']);
const AX_PUBLIC_NAMES = new Set(['search','close','cancel','back','next','previous','open','save',
  'submit','send','stop','retry','refresh','new chat','settings','menu','help','continue',
  'sign in','sign out','log in','log out','apply','clear','edit','delete','add','remove','filter','sort']);
const AX_STATES = new Set(['disabled','expanded','pressed','checked','selected','required',
  'readonly','multiselectable','busy','invalid','focusable']);
const AX_MAX_NODES = 10000, AX_MAX_CONTROLS = 256;
const axRole = n => typeof n?.role?.value === 'string' ? n.role.value.toLowerCase() : null;
const axRef = value => typeof value === 'string' && value.length > 0 && value.length <= 128;
const axUnknown = reason => ({ schema:'aion.ax-semantics/1', coverage:'unknown',
  documentStable:false, reason, controls:[], fingerprint:null, identity:'unverified',
  accountBinding:'unverified', effectAuthority:false });
function axState(n) {
  const state = {};
  for (const p of Array.isArray(n.properties) ? n.properties.slice(0, 64) : []) {
    if (!AX_STATES.has(p?.name)) continue;
    const v = p.value?.value;
    if (typeof v === 'boolean' || (p.name === 'checked' || p.name === 'pressed') && ['mixed','true','false'].includes(v)
        || p.name === 'invalid' && ['true','false','grammar','spelling'].includes(v)) {
      if (Object.hasOwn(state, p.name) && state[p.name] !== v) state[p.name] = 'unknown';
      else state[p.name] = v;
    }
  }
  return Object.fromEntries(Object.entries(state).sort(([a],[b]) => a < b ? -1 : a > b ? 1 : 0));
}
function axName(n) {
  const value = n.name?.value;
  if (typeof value !== 'string' || !value.trim()) return { name:null, nameStatus:'unavailable' };
  const normalized = value.length <= 80 ? value.trim().toLowerCase().replace(/\s+/g,' ') : '';
  return AX_PUBLIC_NAMES.has(normalized) ? { name:normalized, nameStatus:'fixed-ui-vocabulary' }
    : { name:null, nameStatus:'present-omitted' };
}
/** A bounded, lossy structural observation. Fingerprints compare known structure only;
 * equality is not entity identity, account identity, absence proof or current authority. */
export function projectAccessibilitySemantics(nodes, { documentStable = false, frameId = null } = {}) {
  if (!documentStable || !axRef(frameId)) return axUnknown('DOCUMENT_NOT_VERIFIED');
  if (!Array.isArray(nodes) || !nodes.length) return axUnknown('AX_TREE_UNAVAILABLE');
  const sample = nodes.slice(0, AX_MAX_NODES);
  const byId = new Map(), duplicates = new Set();
  for (const n of sample) {
    if (!axRef(n?.nodeId)) continue;
    if (byId.has(n.nodeId)) duplicates.add(n.nodeId);
    else byId.set(n.nodeId, n);
  }
  if (duplicates.size) return axUnknown('AX_NODE_ID_AMBIGUOUS');
  const controls = [], eligible = [];
  for (const n of sample) {
    if (!n || n.ignored !== false || !axRef(n.nodeId) || (n.frameId && n.frameId !== frameId)) continue;
    const role = axRole(n);
    if (AX_CONTROL_ROLES.has(role)) eligible.push(n);
  }
  const selected = eligible.slice(0, AX_MAX_CONTROLS);
  const ordinal = new Map(selected.map((n,i) => [n.nodeId,i]));
  for (const n of selected) {
    let parent = n.parentId, context = null, parentControl = null;
    const seen = new Set([n.nodeId]);
    for (let depth=0; axRef(parent) && depth<60 && !seen.has(parent); depth++) {
      seen.add(parent);
      const a = byId.get(parent);
      if (!a || (a.frameId && a.frameId !== frameId)) break;
      const role = axRole(a);
      if (a.ignored === false && AX_CONTEXT_ROLES.has(role) && context === null) context = role;
      if (parentControl === null && ordinal.has(parent)) parentControl = ordinal.get(parent);
      if (context !== null && parentControl !== null) break;
      parent = a.parentId;
    }
    controls.push({ ordinal:ordinal.get(n.nodeId), role:axRole(n), ...axName(n),
      state:axState(n), contextRole:context, parentControl,
      domLinkObserved:Number.isSafeInteger(n.backendDOMNodeId) && n.backendDOMNodeId>0,
      identity:'observation-local-unverified' });
  }
  // Multiset semantics deliberately ignore document-local IDs, ordering, focus and wrappers.
  const signatures = controls.map(c => JSON.stringify([c.role,c.name,c.nameStatus,c.state,c.contextRole,
    c.parentControl === null ? null : controls[c.parentControl]?.role ?? null])).sort();
  const frequencies = new Map();
  for (const s of signatures) frequencies.set(s,(frequencies.get(s)??0)+1);
  const identityAmbiguity = [...frequencies.values()].filter(n=>n>1).reduce((a,b)=>a+b,0);
  const truncated = nodes.length > AX_MAX_NODES || eligible.length > AX_MAX_CONTROLS;
  // A truncated sample is order dependent; do not publish a comparable fingerprint.
  const fingerprint = truncated ? null : createHash('sha256').update(JSON.stringify(signatures)).digest('hex');
  return { schema:'aion.ax-semantics/1', coverage:'partial', documentStable:true, frameScope:'main-frame',
    reason:truncated?'BOUNDED_SAMPLE_TRUNCATED':'DEPTH_LIMITED_LOSSY_AX_OBSERVATION',
    nodesScanned:sample.length, controlsObserved:eligible.length, truncated, controls, fingerprint,
    fingerprintKind:'structural-multiset-not-identity', identityAmbiguity,
    identity:'unverified', accountBinding:'unverified', effectAuthority:false };
}
async function currentAxDocument(session) {
  try {
    const { frameTree } = await session.send('Page.getFrameTree');
    const frame = frameTree?.frame;
    if (axRef(frame?.id) && axRef(frame?.loaderId)) return { id:frame.id, loaderId:frame.loaderId };
  } catch { /* unsupported or detached: no document-bound semantics */ }
  return null;
}

// Preserve typed answer blocks with the SAME local privacy setting as turn text.
// Filtered captures must sanitize link/citation/media URLs at every nesting level.
// @serves 048
export function scrubBlocks(blocks, privacy) {
  const scrub = (obj) => {
    for (const key of ['text', 'alt', 'label', 'tex']) if (typeof obj[key] === 'string') obj[key] = privacy.text(obj[key]).text;
    for (const key of ['href', 'src']) if (typeof obj[key] === 'string') obj[key] = privacy.url(obj[key]);
  };
  for (const b of blocks ?? []) {
    scrub(b);
    for (const inline of b.inline ?? []) scrub(inline);
    if (b.headers) b.headers = b.headers.map((header) => privacy.text(header).text);
    if (b.rows) b.rows = b.rows.map((r) => r.map((c) => privacy.text(c).text));
    scrubBlocks(b.blocks, privacy);
    for (const it of b.items ?? []) scrubBlocks(it.blocks, privacy);
  }
}
