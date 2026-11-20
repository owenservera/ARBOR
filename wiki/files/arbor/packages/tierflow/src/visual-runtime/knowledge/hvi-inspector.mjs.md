# File: packages/tierflow/src/visual-runtime/knowledge/hvi-inspector.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../../projects/arbor.md) |
| Path | packages/tierflow/src/visual-runtime/knowledge/hvi-inspector.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 5250 B |
| Lines | 85 |
| Hash | 4e75eff20e9f |
| Test | no |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| HVI_INSPECTOR_SCHEMA | const | 5 | yes | export const HVI_INSPECTOR_SCHEMA = &#39;tierflow.hvi.inspector/1&#39;; |
| REPORT_SCHEMA | const | 6 | no | const REPORT_SCHEMA = &#39;arbor.hvi.adapter.comparison-report/1&#39;; |
| SHA40 | const | 7 | no | const SHA40 = /^[a-f0-9]{40}$/, SHA64 = /^[a-f0-9]{64}$/; |
| fail | function | 8 | no | const fail = code =&gt; { const e = new Error(&#39;HVI_INSPECTOR_&#39; + code); e.code = code; throw e; }; |
| SECRET_SEGMENT | const | 10 | no | const SECRET_SEGMENT = /^(?:[.]env.*\|[.]git\|[.]ssh\|cookies?\|secrets?\|credentials?\|tokens?\|profiles?\|private\|personal\|sessions?\|login.data)$/i; |
| SECRET_FILE | const | 11 | no | const SECRET_FILE = /[.](?:pem\|p12\|pfx\|key)$/i; |
| SECRET_CLAIM | const | 12 | no | const SECRET_CLAIM = /(?:bearer\|password\|api[_-]?key\|access[_-]?token\|refresh[_-]?token)[=:]/i; |
| safeHviText | function | 13 | yes | export function safeHviText(value, max=240) { |
| normalized | const | 15 | no | const normalized=value.replaceAll(String.fromCharCode(92),&#39;/&#39;); |
| safe | const | 22 | no | const safe = safeHviText; |
| blank | const | 23 | no | const blank = { schema:HVI_INSPECTOR_SCHEMA, mode:&#39;empty&#39;, caption:&#39;No versions compared&#39;, |
| projectHviInspector | function | 26 | yes | export function projectHviInspector({ envelope=null, selectedPins=null, targetPinId=null, offset=0, limit=50, synthetic=false, permission=&#39;not_requested&#39; } = {}) { |
| c | const | 31 | no | const c = envelope?.originalComparison, view=envelope?.report; |
| pins | const | 41 | no | const pins=c.sourcePins.map(p =&gt; { if (!SHA64.test(p.pinId)\|\|!SHA40.test(p.resolvedCommitSha)) fail(&#39;PIN_INVALID&#39;); return {pinId:p.pinId,repo:safe(p.repoIdentity),sha:p.resolvedCommitSha, completene… |
| choices | const | 46 | no | const choices=selectedPins??pins.map(p=&gt;p.pinId); |
| target | const | 50 | no | const target=targetPinId??c.targetPinId; |
| findings | const | 55 | no | const findings=c.sourceDeltas.filter(r=&gt;choices.includes(r.originPinId) &amp;&amp; r.targetPinId===target); |
| rows | const | 57 | no | const rows=findings.slice(offset,offset+limit).map(r=&gt;({ id:safe(r.id),sourcePinId:r.originPinId,targetPinId:r.targetPinId, originPath:r.originPath?safe(r.originPath):null, targetPaths:Array.isArray(… |
| coverage | const | 65 | no | const coverage=c.coverage.filter(r=&gt;choices.includes(r.sourcePinId) &amp;&amp; r.targetPinId===target).map(r=&gt;({ sourcePinId:r.sourcePinId,targetPinId:r.targetPinId, sourceCompleteness:r.sourceCompleteness,t… |
| partial | const | 71 | no | const partial=envelope.status===&#39;INCOMPLETE_SOURCE_EVIDENCE&#39;\|\| |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [packages/tierflow/src/visual-runtime/render/hvi-inspector.mjs](../render/hvi-inspector.mjs.md) | ../knowledge/hvi-inspector.mjs |
| [packages/tierflow/tests/hvi-inspector.test.mjs](../../../tests/hvi-inspector.test.mjs.md) | ../src/visual-runtime/knowledge/hvi-inspector.mjs |
| [tests/hq-version-intelligence/g2-host-ui.test.mjs](../../../../../tests/hq-version-intelligence/g2-host-ui.test.mjs.md) | ../../packages/tierflow/src/visual-runtime/knowledge/hvi-inspector.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
/**
 * W2 U inert source-only HVI projection for existing TierFlow publisher.
 * No renderer, UiStore, Git reads, Host effects or source scanning.
 */
export const HVI_INSPECTOR_SCHEMA = 'tierflow.hvi.inspector/1';
const REPORT_SCHEMA = 'arbor.hvi.adapter.comparison-report/1';
const SHA40 = /^[a-f0-9]{40}$/, SHA64 = /^[a-f0-9]{64}$/;
const fail = code => { const e = new Error('HVI_INSPECTOR_' + code); e.code = code; throw e; };
// Strict metadata-only redaction shared with the canonical view adapter.
const SECRET_SEGMENT = /^(?:[.]env.*|[.]git|[.]ssh|cookies?|secrets?|credentials?|tokens?|profiles?|private|personal|sessions?|login.data)$/i;
const SECRET_FILE = /[.](?:pem|p12|pfx|key)$/i;
const SECRET_CLAIM = /(?:bearer|password|api[_-]?key|access[_-]?token|refresh[_-]?token)[=:]/i;
export function safeHviText(value, max=240) {
  if(typeof value!=='string'||!value.length||value.length>max) return '[REDACTED]';
  const normalized=value.replaceAll(String.fromCharCode(92),'/');
  if(normalized.split('/').some(s=>SECRET_SEGMENT.test(s)||SECRET_FILE.test(s)) ||
    SECRET_CLAIM.test(value) ||
    [...value].some(c=>c.charCodeAt(0)<32||c.charCodeAt(0)===127||c==='<'||c==='>') ||
    /(?:javascript:|data:|https?:|www[.]|=>|document[.]|window[.])/i.test(value)) return '[REDACTED]';
  return value;
}
const safe = safeHviText;
const blank = { schema:HVI_INSPECTOR_SCHEMA, mode:'empty', caption:'No versions compared',
  pins:[], rows:[], coverage:[], targetPinId:null, actions:[],
  sourceOnly:true, runtimeVerified:false, featureEnabled:false, synthetic:false };
export function projectHviInspector({ envelope=null, selectedPins=null, targetPinId=null,
  offset=0, limit=50, synthetic=false, permission='not_requested' } = {}) {
  if (permission === 'denied' || permission === 'revoked') return {
    ...blank, mode:'denied', caption:'Source access denied or revoked' };
  if (envelope == null) return { ...blank };
  const c = envelope?.originalComparison, view=envelope?.report;
  if (envelope.schema!==REPORT_SCHEMA || envelope.runtimeAccepted!==false ||
    !c || !view || !Array.isArray(c.sourcePins) ||
    c.sourcePins.length<2 || c.sourcePins.length>16 ||
    !Array.isArray(c.sourceDeltas) || !Array.isArray(c.coverage) ||
    !SHA64.test(c.reproducibilityDigest) ||
    envelope.sourceComparisonDigest!==c.reproducibilityDigest ||
    c.targetPinId!==view.targetPinId) fail('UNTRUSTED_REPORT');
  if (!Number.isSafeInteger(offset)||offset<0 ||
    !Number.isSafeInteger(limit)||limit<1||limit>200) fail('RESOURCE_LIMIT');
  const pins=c.sourcePins.map(p => {
    if (!SHA64.test(p.pinId)||!SHA40.test(p.resolvedCommitSha)) fail('PIN_INVALID');
    return {pinId:p.pinId,repo:safe(p.repoIdentity),sha:p.resolvedCommitSha,
      completeness:p.completeness,runtime:'UNRUN'};
  });
  const choices=selectedPins??pins.map(p=>p.pinId);
  if (!Array.isArray(choices)||choices.length<2||
    new Set(choices).size!==choices.length ||
    choices.some(x=>!pins.some(p=>p.pinId===x))) fail('INVALID_SELECTION');
  const target=targetPinId??c.targetPinId;
  if (!choices.includes(target)) fail('INVALID_SELECTION');
  // This envelope is target-relative. A new target needs a fresh Host-approved comparison.
  if (target!==c.targetPinId) return { ...blank, mode:'request-access',
    caption:'Changing the target requires a new authorized pinned comparison' };
  const findings=c.sourceDeltas.filter(r=>choices.includes(r.originPinId) &&
    r.targetPinId===target);
  const rows=findings.slice(offset,offset+limit).map(r=>({
    id:safe(r.id),sourcePinId:r.originPinId,targetPinId:r.targetPinId,
    originPath:r.originPath?safe(r.originPath):null,
    targetPaths:Array.isArray(r.targetPaths)?r.targetPaths.map(safe):[],
    sourceState:safe(r.state),certainty:safe(r.certainty),
    evidenceRefs:Array.isArray(r.evidenceRefs)?r.evidenceRefs.map(safe):[],
    capabilityState:'UNKNOWN',runtimeState:'UNRUN',action:'REVIEW_ONLY',
  }));
  const coverage=c.coverage.filter(r=>choices.includes(r.sourcePinId) &&
    r.targetPinId===target).map(r=>({
    sourcePinId:r.sourcePinId,targetPinId:r.targetPinId,
    sourceCompleteness:r.sourceCompleteness,targetCompleteness:r.targetCompleteness,
    observedFiles:r.totalCompared,sourceOnly:true,
  }));
  const partial=envelope.status==='INCOMPLETE_SOURCE_EVIDENCE'||
    pins.some(p=>p.completeness!=='complete')||
    c.limits?.truncated===true||c.errors?.length>0||
    findings.some(r=>r.state==='UNOBSERVABLE');
  return {schema:HVI_INSPECTOR_SCHEMA,mode:partial?'partial':'source-report',
    caption:partial?'Incomplete source evidence':'Source-only, runtime unverified',
    pins:pins.filter(p=>choices.includes(p.pinId)),targetPinId:target,
    rows,coverage,findings:findings.length,
    page:{offset,limit,hasMore:offset+rows.length<findings.length},
    incomplete:partial,sourceOnly:true,runtimeVerified:false,
```

_First 80 of 86 lines._

---

[HQ wiki](../../../../../../../index.md) · [Symbols](../../../../../../../symbols.md) · [Dependency graph](../../../../../../../graph.md) · [Documentation](../../../../../../../docs.md) · [Changes](../../../../../../../changes.md) · [Open tasks](../../../../../../../todos.md) · [Deprecated](../../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../../protocol.md) · [Glossary](../../../../../../../glossary.md) · [Using HQ](../../../../../../../context.md) · [Capabilities](../../../../../../../capabilities.md) · [Search index](../../../../../../../search.json) · [Browser view](../../../../../../../index.html)
