# File: apps/mobile-relay/ux/launcher.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/mobile-relay/ux/launcher.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 4193 B |
| Lines | 61 |
| Hash | 806f6b13d2a8 |
| Test | no |
| Generated | no |
| Component | mobile-relay |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| LAUNCHER_SCHEMA | const | 3 | yes | export const LAUNCHER_SCHEMA = &#39;vivim.pwa-capability-catalog/1&#39;; |
| CATALOG | const | 4 | no | const CATALOG = Object.freeze([ [&#39;today&#39;,&#39;Today&#39;,&#39;Connection, next action and what needs you&#39;,&#39;today&#39;,&#39;any&#39;], [&#39;talk&#39;,&#39;Ask VIVIM&#39;,&#39;Describe a supported Host request and review its plan&#39;,&#39;talk&#39;,&#39;direc… |
| capabilityCatalog | function | 21 | yes | export function capabilityCatalog(context={}) { |
| mode | const | 22 | no | const mode = context.mode===&#39;direct&#39;?&#39;direct&#39;:context.mode===&#39;desktop-preview&#39;?&#39;desktop-preview&#39;:&#39;cloud&#39;; |
| paired | const | 23 | no | const paired = context.paired===true &amp;&amp; mode!==&#39;desktop-preview&#39;; |
| offline | const | 24 | no | const offline = context.online===false; |
| preview | const | 25 | no | const preview = mode===&#39;desktop-preview&#39;; |
| rows | const | 26 | no | const rows = CATALOG.map(([id,title,detail,tab,requires])=&gt;{ let available = requires===&#39;any&#39; \|\| requires===&#39;phone&#39; &amp;&amp; !preview \|\| requires===&#39;paired&#39; &amp;&amp; paired \|\| requires===&#39;direct&#39; &amp;&amp; paired &amp;&amp; mo… |
| available | variable | 27 | no | let available = requires===&#39;any&#39; \|\| requires===&#39;phone&#39; &amp;&amp; !preview |
| reason | const | 40 | no | const reason=available?&#39;Available&#39;:preview?&#39;Phone-only action unavailable in read-only Host preview&#39; |
| searchCapabilities | function | 53 | yes | export function searchCapabilities(query=&#39;&#39;,context={}){ |
| input | const | 54 | no | const input=typeof query===&#39;string&#39;?query.slice(0,100).toLocaleLowerCase(&#39;en&#39;).trim():&#39;&#39;; |
| terms | const | 55 | no | const terms=input.split(/\\s+/).filter(Boolean).slice(0,6); |
| rows | const | 56 | no | const rows=capabilityCatalog(context).rows; |
| hits | const | 57 | no | const hits=terms.length?rows.filter(c=&gt;terms.every(t=&gt; (c.title+&#39; &#39;+c.detail+&#39; &#39;+c.tab).toLocaleLowerCase(&#39;en&#39;).includes(t))):rows; |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [apps/mobile-relay/test/pwa-activation-readiness.test.mjs](../test/pwa-activation-readiness.test.mjs.md) | ../ux/launcher.mjs |
| [apps/mobile-relay/ux/launcher-ui.mjs](./launcher-ui.mjs.md) | ./launcher.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// One local capability finder over *existing* surfaces. None of these actions
// sends a message, executes a Host plan, installs software or authorizes a grant.
export const LAUNCHER_SCHEMA = 'vivim.pwa-capability-catalog/1';
const CATALOG = Object.freeze([
  ['today','Today','Connection, next action and what needs you','today','any'],
  ['talk','Ask VIVIM','Describe a supported Host request and review its plan','talk','direct'],
  ['ai','My AIs','Use signed-in AI conversations via the existing signed-in browser harness','talk','paired'],
  ['sessions','PC sessions','Read existing sessions on your Host','talk','direct'],
  ['build','Build','Propose a deterministic UI edit or preview a design','build','paired'],
  ['world','World','See your committed UI and what is running','world','any'],
  ['media','Movies and shows','Browse your HQ library and mapped streams','world','direct'],
  ['me','Me','Device, permissions, AI providers and recent receipts','me','any'],
  ['readiness','Connection check','Read a device-safe setup and recovery checklist','me','any'],
  ['install','Install PWA','Install from your browser when it offers the option','me','any'],
  ['control','Control','Inspect Host plans, approve with a current grant','control','direct'],
  ['memory','Web memory','Review privacy-filtered PC browsing evidence','control','direct'],
  ['theme','Appearance','Preview the existing VIVIM visual themes','me','paired'],
  ['tour','Introduction','Replay the existing VIVIM welcome tour','today','paired'],
  ['notes','Quick capture','Keep a note locally on this browser, including offline','today','phone']
]);
export function capabilityCatalog(context={}) {
  const mode = context.mode==='direct'?'direct':context.mode==='desktop-preview'?'desktop-preview':'cloud';
  const paired = context.paired===true && mode!=='desktop-preview';
  const offline = context.online===false;
  const preview = mode==='desktop-preview';
  const rows = CATALOG.map(([id,title,detail,tab,requires])=>{
    let available = requires==='any' || requires==='phone' && !preview
      || requires==='paired' && paired || requires==='direct' && paired && mode==='direct';
    // Host preview is inspection-only. Appearance changes remain in Host's owner tools.
    if(id==='install') available=!preview && context.installOffered===true &&
      context.installed!==true;
    if(['talk','control','media','memory'].includes(id) && context.controlRead!==true)
      available=false;
    if(id==='media' && !context.mediaVisible) available=false;
    if(id==='control' && preview) available=false;
    if(id==='sessions' && preview) available=false;
    if(id==='memory' && preview) available=false;
    if(id==='notes' && preview) available=false;
    if(offline && !['today','world','me','readiness','notes','install'].includes(id)) available=false;
    const reason=available?'Available':preview?'Phone-only action unavailable in read-only Host preview'
      :id==='install' && context.installed===true?'Already running as an installed PWA'
      :id==='install'?'Browser has not offered installation'
      :['talk','control','media','memory'].includes(id) && !context.controlRead
        ? 'Requires approved control:read permission'
      :offline?'Connect to your PC first'
      :requires==='direct'?'Requires approved Direct phone connection'
      :requires==='paired'?'Requires an approved phone session'
      :'Not available on this connection';
    return Object.freeze({id,title,detail,tab,available,reason});
  });
  return Object.freeze({schema:LAUNCHER_SCHEMA,rows});
}
export function searchCapabilities(query='',context={}){
  const input=typeof query==='string'?query.slice(0,100).toLocaleLowerCase('en').trim():'';
  const terms=input.split(/\s+/).filter(Boolean).slice(0,6);
  const rows=capabilityCatalog(context).rows;
  const hits=terms.length?rows.filter(c=>terms.every(t=>
    (c.title+' '+c.detail+' '+c.tab).toLocaleLowerCase('en').includes(t))):rows;
  // Available results first, but retain unavailable rows to explain limitations.
  return hits.slice().sort((a,b)=>Number(b.available)-Number(a.available));
}
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
