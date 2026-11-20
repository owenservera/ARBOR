# File: studio/src/capture/dom.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/capture/dom.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 10346 B |
| Lines | 176 |
| Hash | 50afb43313ff |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| AGENT_SRC | const | 6 | no | const AGENT_SRC = readFileSync(new URL(&#39;./page-agent.js&#39;, import.meta.url), &#39;utf8&#39;).trim().replace(/;\\s*$/, &#39;&#39;); |
| DomObserver | class | 8 | yes | export class DomObserver { |
| constructor | method | 9 | yes | constructor({ append, profile }) { |
| _script | method | 20 | yes | _script() { |
| cfg | const | 21 | no | const cfg = { flushMs: this.profile.dom?.flushMs, maxBlockTextBytes: this.profile.dom?.maxBlockTextBytes, ignoreTags: this.profile.dom?.ignoreTags }; |
| attach | method | 25 | yes | async attach(session) { |
| startInFrame | method | 65 | yes | async startInFrame(frameId) { |
| known | const | 66 | no | const known = this.contexts.get(frameId); |
| alive | const | 69 | no | const alive = await this.session.send(&#39;Runtime.evaluate&#39;, { expression: &#39;!!(globalThis.__aionCapture &amp;&amp; globalThis.__aionCapture.version)&#39;, contextId: known, returnByValue: true }); |
| r | const | 76 | no | const r = await this.session.send(&#39;Runtime.evaluate&#39;, { expression: this._script(), contextId: executionContextId, returnByValue: true }); |
| _onMessage | method | 80 | yes | _onMessage(payload) { |
| msg | variable | 81 | no | let msg; |
| _evalInMain | method | 96 | yes | async _evalInMain(expression, returnByValue = true) { |
| ctx | variable | 97 | no | let ctx = this.contexts.get(this.mainFrameId); |
| r | variable | 99 | no | let r; |
| inspect | method | 113 | yes | async inspect() { |
| r | const | 114 | no | const r = (await this._evalInMain(&#39;globalThis.__aionCapture &amp;&amp; globalThis.__aionCapture.inspect()&#39;)).value; |
| turns | method | 119 | yes | async turns() { |
| t | const | 120 | no | const t = (await this._evalInMain(&#39;globalThis.__aionCapture &amp;&amp; globalThis.__aionCapture.turns()&#39;)).value ?? []; |
| blocksOf | method | 125 | yes | async blocksOf(nodeId) { const b = (await this._evalInMain(`globalThis.__aionCapture &amp;&amp; globalThis.__aionCapture.blocks(${Number(nodeId)})`)).value ?? []; scrubBlocks(b, this.privacy); return b; } |
| accessibility | method | 128 | yes | async accessibility() { |
| roles | const | 130 | no | const roles = {}; const landmarks = []; const live = []; |
| role | const | 133 | no | const role = n.role?.value; if (!role) continue; |
| lv | const | 136 | no | const lv = n.properties?.find((p) =&gt; p.name === &#39;live&#39;); if (lv &amp;&amp; lv.value?.value !== &#39;off&#39;) live.push({ role, name: n.name?.value?.slice(0, 60), live: lv.value?.value }); |
| snapshot | method | 141 | yes | async snapshot() { |
| v | const | 142 | no | const v = (await this._evalInMain(&#39;globalThis.__aionCapture &amp;&amp; globalThis.__aionCapture.snapshot()&#39;)).value; |
| highlight | method | 148 | yes | async highlight(nodeId) { |
| r | const | 149 | no | const r = await this._evalInMain(`globalThis.__aionCapture &amp;&amp; globalThis.__aionCapture.node(${Number(nodeId)})`, false); |
| clearHighlight | method | 157 | yes | async clearHighlight() { try { await this.session.send(&#39;Overlay.hideHighlight&#39;); } catch { /* ignore */ } } |
| scrubBlocks | function | 163 | yes | export function scrubBlocks(blocks, privacy) { |
| scrub | function | 164 | no | const scrub = (obj) =&gt; { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 2 | external |
| node:crypto | import | 3 | external |
| ./privacy.mjs | import | 4 | [studio/src/capture/privacy.mjs](./privacy.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/scripts/loadlab.mjs](../../scripts/loadlab.mjs.md) | ../src/capture/dom.mjs |
| [studio/scripts/loadlab.mjs](../../scripts/loadlab.mjs.md) | ../src/capture/dom.mjs |
| [studio/src/capture/recorder.mjs](./recorder.mjs.md) | ./dom.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// L3 rendered-DOM observation + user-action timeline, via an isolated-world page agent.
import { readFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
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
```

_First 80 of 177 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
