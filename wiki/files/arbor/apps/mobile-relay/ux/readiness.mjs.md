# File: apps/mobile-relay/ux/readiness.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/mobile-relay/ux/readiness.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 5724 B |
| Lines | 84 |
| Hash | 41a7e1fc38ea |
| Test | no |
| Generated | no |
| Component | mobile-relay |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| READINESS_SCHEMA | const | 3 | yes | export const READINESS_SCHEMA = &#39;vivim.pwa-readiness/1&#39;; |
| check | function | 4 | no | const check = (id, label, state, detail, destination) =&gt; |
| yes | function | 6 | no | const yes = state =&gt; state === true; |
| deriveReadiness | function | 7 | yes | export function deriveReadiness(input = {}) { |
| mode | const | 8 | no | const mode = [&#39;direct&#39;, &#39;cloud&#39;, &#39;desktop-preview&#39;].includes(input.mode) ? input.mode : &#39;unknown&#39;; |
| preview | const | 9 | no | const preview = mode === &#39;desktop-preview&#39;; |
| online | const | 10 | no | const online = yes(input.online); |
| paired | const | 11 | no | const paired = yes(input.paired) &amp;&amp; !preview; |
| secure | const | 12 | no | const secure = yes(input.secureContext); |
| ownerData | const | 13 | no | const ownerData = yes(input.hostReported); |
| grants | const | 14 | no | const grants = Array.isArray(input.scopes) ? input.scopes.filter(x =&gt; typeof x === &#39;string&#39;) : []; |
| read | const | 15 | no | const read = grants.includes(&#39;control:read&#39;); |
| providerCount | const | 16 | no | const providerCount = Number.isSafeInteger(input.providersSignedIn) &amp;&amp; input.providersSignedIn &gt;= 0 |
| swSupported | const | 18 | no | const swSupported = yes(input.serviceWorkerSupported); |
| swControlled | const | 19 | no | const swControlled = yes(input.serviceWorkerControlled); |
| media | const | 20 | no | const media = input.mediaState === &#39;ready&#39; ? &#39;ready&#39; : |
| checks | const | 22 | no | const checks = [ |
| actionable | const | 64 | no | const actionable = checks.filter(c =&gt; c.state===&#39;attention&#39;\|\|c.state===&#39;blocked&#39;); |
| summary | const | 65 | no | const summary = !online?&#39;offline&#39;:preview?&#39;owner-preview&#39;:paired?&#39;paired-phone&#39;:&#39;not-paired&#39;; |
| safeReadinessReport | function | 73 | yes | export function safeReadinessReport(view) { |
| allowed | const | 77 | no | const allowed = new Set([&#39;ready&#39;,&#39;limited&#39;,&#39;attention&#39;,&#39;blocked&#39;,&#39;unknown&#39;]); |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [apps/mobile-relay/app.js](../app.js.md) | ./ux/readiness.mjs |
| [apps/mobile-relay/test/pwa-activation-readiness.test.mjs](../test/pwa-activation-readiness.test.mjs.md) | ../ux/readiness.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Pure, private-by-construction phone readiness projection.
// No tokens, origin/hostname, browsing history, agent text or Host write capability.
export const READINESS_SCHEMA = 'vivim.pwa-readiness/1';
const check = (id, label, state, detail, destination) =>
  Object.freeze({ id, label, state, detail, ...(destination ? { destination } : {}) });
const yes = state => state === true;
export function deriveReadiness(input = {}) {
  const mode = ['direct', 'cloud', 'desktop-preview'].includes(input.mode) ? input.mode : 'unknown';
  const preview = mode === 'desktop-preview';
  const online = yes(input.online);
  const paired = yes(input.paired) && !preview;
  const secure = yes(input.secureContext);
  const ownerData = yes(input.hostReported);
  const grants = Array.isArray(input.scopes) ? input.scopes.filter(x => typeof x === 'string') : [];
  const read = grants.includes('control:read');
  const providerCount = Number.isSafeInteger(input.providersSignedIn) && input.providersSignedIn >= 0
    ? Math.min(input.providersSignedIn, 100) : null;
  const swSupported = yes(input.serviceWorkerSupported);
  const swControlled = yes(input.serviceWorkerControlled);
  const media = input.mediaState === 'ready' ? 'ready' :
    input.mediaState === 'unavailable' ? 'unavailable' : 'unknown';
  const checks = [
    check('network','Connection', online ? 'ready' : 'blocked',
      online ? 'Browser reports a network connection.' : 'Offline. No Host actions can be sent.','today'),
    check('security','Secure browser',secure?'ready':'blocked',
      secure?'Secure browser context available.':'HTTPS or a local trusted context is required for device pairing.','me'),
    check('authority','Host authority',
      preview ? ownerData ? 'ready' : 'attention' : !paired ? 'attention' : 'ready',
      preview ? ownerData ? 'Owner read-only Host projection loaded.' : 'Owner session required for live Host data.'
        : paired ? 'Phone session is paired; every effect still needs Host authorization.'
        : 'Pair or reconnect the phone to the Host.','me'),
    check('direct','PC connection', mode==='direct' ? 'ready' :
      preview ? 'ready' : 'limited',
      mode==='direct' ? 'Direct Host connection.':preview?'Local Host owner view, not a phone session.'
        :'Cloud relay; Direct-only PC controls and media are unavailable.','me'),
    check('permission','PC controls',preview?'limited':read?'ready':'attention',
      preview?'Use the separately authorized Host Control interface.'
        :read?'Approved control:read scope is present. Approvals remain Host-owned.'
        :'No approved control:read scope is reported.','control'),
    check('providers','Signed-in AI',providerCount===null?'unknown':providerCount?'ready':'attention',
      providerCount===null?'Host provider manifest not received.'
        :providerCount?'Host reports '+providerCount+' signed-in provider'+(providerCount===1?'':'s')+'.'
        :'Host reports no signed-in AI providers.','talk'),
    check('media','Your media',mode!=='direct'?'limited':
      media==='ready'?'ready':media==='unavailable'?'attention':'unknown',
      mode!=='direct'?'Playback requires a paired Direct phone connection.'
        :media==='ready'?'HQ library metadata received; individual files still require explicit mapping.'
        :media==='unavailable'?'Host media library could not be read.':'Media library not loaded yet.','world'),
    check('offline','Offline app shell',preview?'limited':swControlled?'ready':swSupported?'attention':'limited',
      preview?'Desktop Host preview does not install a phone service worker.'
        :swControlled?'This page is controlled by the local PWA shell.'
        :swSupported?'Service worker not controlling this page yet. Reload after first install.'
        :'This browser does not expose service workers.','me'),
    check('install','App installation',preview?'limited':yes(input.installed)?'ready':
      yes(input.installOffered)?'ready':'unknown',
      preview?'Install the PWA on your phone, not from Host preview.'
        :yes(input.installed)?'Standalone app mode detected.'
        :yes(input.installOffered)?'Browser installation is offered in Me.'
        :'Install availability depends on your browser.','me'),
    check('pending','Uncertain sends',yes(input.pendingSend)?'attention':'ready',
      yes(input.pendingSend)?'A send may have been issued. Check its receipt before trying again.'
        :'No unresolved transport send is flagged in this browser.','talk')
  ];
  const actionable = checks.filter(c => c.state==='attention'||c.state==='blocked');
  const summary = !online?'offline':preview?'owner-preview':paired?'paired-phone':'not-paired';
  return Object.freeze({
    schema: READINESS_SCHEMA, summary, mode, checks,
    ready:checks.filter(c=>c.state==='ready').length,
    actionable:actionable.length, pending:yes(input.pendingSend),
    suggested:actionable.slice(0,4).map(c=>({id:c.id,label:c.label,destination:c.destination}))
  });
}
export function safeReadinessReport(view) {
  if (!view || view.schema !== READINESS_SCHEMA || !Array.isArray(view.checks)) return '';
  // Allowlist *only* fixed static labels/states/details derived above. Never copy
  // addresses, bearer sessions, ID strings, raw snapshots, browsing or transcripts.
  const allowed = new Set(['ready','limited','attention','blocked','unknown']);
  return [
    'VIVIM PWA readiness (no credentials or Host content)',
    'Mode: '+view.mode+' · State: '+view.summary,
```

_First 80 of 85 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
