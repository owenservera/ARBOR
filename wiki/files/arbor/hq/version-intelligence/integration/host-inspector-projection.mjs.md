# File: hq/version-intelligence/integration/host-inspector-projection.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/version-intelligence/integration/host-inspector-projection.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 7034 B |
| Lines | 127 |
| Hash | 05675bde33b8 |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| HVI_HOST_INSPECTOR_SCHEMA | const | 9 | yes | export const HVI_HOST_INSPECTOR_SCHEMA = &#39;arbor.hvi.adapter.comparison-report/1&#39;; |
| PIN_ID | const | 10 | no | const PIN_ID = /^[a-f0-9]{64}$/; |
| SHA40 | const | 11 | no | const SHA40 = /^[a-f0-9]{40}$/; |
| REPO | const | 12 | no | const REPO = /^[a-z0-9_.-]+\\/[a-z0-9_.-]+$/; |
| SAFE_ID | const | 13 | no | const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,95}$/; |
| STATES | const | 14 | no | const STATES = new Set([&#39;EXACT_BLOB&#39;,&#39;SAME_PATH_CHANGED&#39;,&#39;EXACT_RELOCATION&#39;, &#39;SPLIT_CANDIDATE&#39;,&#39;COMBINE_CANDIDATE&#39;,&#39;SIMILARITY_CANDIDATE&#39;, &#39;MISSING_AT_TARGET&#39;,&#39;NEW_AT_TARGET&#39;,&#39;UNOBSERVABLE&#39;]); |
| SECRET | const | 17 | no | const SECRET = /(?:^\|\\/)(?:\\.git\|\\.ssh\|\\.env[^/]*\|\\.npmrc\|\\.netrc\|secrets?\|credentials?\|tokens?\|private\|personal\|profiles?\|sessions?\|cookies?\|login[ -]?data)(?:\\/\|$)\|\\.(?:pem\|p12\|pfx\|key\|keystore)$\|(… |
| fail | function | 18 | no | function fail(code) { const error = new Error(&#39;HVI_G2_&#39; + code); error.code = code; throw error; } |
| safeText | function | 19 | no | function safeText(input, max=200) { |
| safePath | function | 25 | no | function safePath(input) { |
| assertPin | function | 30 | no | function assertPin(pin) { |
| assertCurrent | function | 35 | no | function assertCurrent(comparison, evidence) { |
| pins | const | 47 | no | const pins=new Set(comparison.sourcePins.map(p=&gt;p.pinId)); |
| projectAuthorizedHviInspector | function | 58 | yes | export async function projectAuthorizedHviInspector(toolResult, { verifyCurrentGrant, signal, maxRows=200, }={}) { |
| original | const | 66 | no | const original=toolResult.comparison; |
| pinned | const | 67 | no | const pinned=assertCurrent(original,toolResult.evidenceReport); |
| grantCheck | const | 69 | no | const grantCheck=async(operation)=&gt;{ |
| decision | const | 72 | no | const decision=await verifyCurrentGrant({operation,scope:&#39;development&#39;, repoIdentity:p.repoIdentity,resolvedCommitSha:p.resolvedCommitSha, pinId:p.pinId,sourceGrantRef:p.sourceGrantRef??null}); |
| incomplete | const | 79 | no | const incomplete=original.limits.truncated===true\|\| |
| pins | const | 82 | no | const pins=original.sourcePins.map(p=&gt;({pinId:p.pinId,repoIdentity:p.repoIdentity, resolvedCommitSha:p.resolvedCommitSha,completeness:p.completeness})); |
| rows | const | 84 | no | const rows=original.sourceDeltas.slice(0,maxRows).map((r,i)=&gt;{ if(!pinned.has(r.originPinId)\|\|!pinned.has(r.targetPinId)\|\| r.targetPinId!==original.targetPinId) fail(&#39;PIN_CONFLICT&#39;); const origin=pin… |
| origin | const | 87 | no | const origin=pins.find(p=&gt;p.pinId===r.originPinId); |
| target | const | 88 | no | const target=pins.find(p=&gt;p.pinId===r.targetPinId); |
| observable | const | 89 | no | const observable=origin.completeness===&#39;complete&#39;&amp;&amp;target.completeness===&#39;complete&#39;; |
| coverage | const | 100 | no | const coverage=original.coverage.map(r=&gt;{ if(!pinned.has(r.sourcePinId)\|\|r.targetPinId!==original.targetPinId) fail(&#39;PIN_CONFLICT&#39;); return {sourcePinId:r.sourcePinId,targetPinId:r.targetPinId, sourc… |
| truncated | const | 108 | no | const truncated=original.limits.truncated===true\|\|original.sourceDeltas.length&gt;maxRows; |
| comparison | const | 109 | no | const comparison={ |
| envelope | const | 116 | no | const envelope={ |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ../sources/common.mjs | import | 7 | [hq/version-intelligence/sources/common.mjs](../sources/common.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [apps/vivim-host/control/hvi-capability.mjs](../../../apps/vivim-host/control/hvi-capability.mjs.md) | ../../../hq/version-intelligence/integration/host-inspector-projection.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
/**
 * G2 Host -> TierFlow metadata bridge.
 * Accepts ONLY an already-authorized G1 tool receipt, then independently
 * rechecks current development-source grants before AND after projection.
 * This is not an executor, network endpoint, grant store, or UI publisher.
 */
import { digest } from '../sources/common.mjs';

export const HVI_HOST_INSPECTOR_SCHEMA = 'arbor.hvi.adapter.comparison-report/1';
const PIN_ID = /^[a-f0-9]{64}$/;
const SHA40 = /^[a-f0-9]{40}$/;
const REPO = /^[a-z0-9_.-]+\/[a-z0-9_.-]+$/;
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,95}$/;
const STATES = new Set(['EXACT_BLOB','SAME_PATH_CHANGED','EXACT_RELOCATION',
  'SPLIT_CANDIDATE','COMBINE_CANDIDATE','SIMILARITY_CANDIDATE',
  'MISSING_AT_TARGET','NEW_AT_TARGET','UNOBSERVABLE']);
const SECRET = /(?:^|\/)(?:\.git|\.ssh|\.env[^/]*|\.npmrc|\.netrc|secrets?|credentials?|tokens?|private|personal|profiles?|sessions?|cookies?|login[ -]?data)(?:\/|$)|\.(?:pem|p12|pfx|key|keystore)$|(?:bearer|password|api[_-]?key|access[_-]?token|refresh[_-]?token)[=:]/i;
function fail(code) { const error = new Error('HVI_G2_' + code); error.code = code; throw error; }
function safeText(input, max=200) {
  if (typeof input!=='string'||input.length<1||input.length>max||SECRET.test(input)||
      /[^\x20-\x7e]/.test(input)||/[<>\x60\[\]{}|*!~$=%?&"']/.test(input)||
      /(?:javascript:|data:|https?:|www[.])/i.test(input)) return '[REDACTED]';
  return input;
}
function safePath(input) {
  if (typeof input!=='string'||input.startsWith('/')||input.includes('\\')||
      input.split('/').some(x=>!x||x==='.'||x==='..')) return '[REDACTED]';
  return safeText(input,512);
}
function assertPin(pin) {
  if (!PIN_ID.test(pin?.pinId)||!SHA40.test(pin?.resolvedCommitSha)||
      !REPO.test(pin?.repoIdentity)||!['complete','partial','blocked','missing'].includes(pin.completeness))
    fail('INVALID_PIN');
}
function assertCurrent(comparison, evidence) {
  if (comparison?.schema!=='arbor.hvi.version-comparison/1'||
      !Array.isArray(comparison.sourcePins)||comparison.sourcePins.length<2||
      comparison.sourcePins.length>16||!Array.isArray(comparison.sourceDeltas)||
      !Array.isArray(comparison.coverage)||!Array.isArray(comparison.errors)||
      !comparison.limits||typeof comparison.limits!=='object'||
      !PIN_ID.test(comparison.reproducibilityDigest)||
      evidence?.sourceComparisonDigest!==comparison.reproducibilityDigest)
    fail('INVALID_REPORT');
  const {reproducibilityDigest,...body}=comparison;
  if(digest(body)!==reproducibilityDigest) fail('DIGEST_CONFLICT');
  comparison.sourcePins.forEach(assertPin);
  const pins=new Set(comparison.sourcePins.map(p=>p.pinId));
  if(pins.size!==comparison.sourcePins.length||!pins.has(comparison.targetPinId)||
      comparison.coverage.length!==pins.size-1) fail('PIN_CONFLICT');
  return pins;
}
/**
 * Returns a sanitized, explicitly DERIVED comparison view, not a raw C envelope.
 * The original source digest is retained separately, and the displayed digest
 * is recomputed from the redacted projection so it cannot attest removed data.
 * Caller must supply a Host-owned LIVE grant verifier, never a model assertion.
 */
export async function projectAuthorizedHviInspector(toolResult, {
  verifyCurrentGrant, signal, maxRows=200,
}={}) {
  if(typeof verifyCurrentGrant!=='function') fail('SOURCE_UNAUTHORIZED');
  if(signal?.aborted) fail('CANCELLED');
  if(toolResult?.schema!=='arbor.hvi.tool-result/1'||
      toolResult.runtimeAccepted!==false||toolResult.hostBound!==false)
    fail('INVALID_REPORT');
  const original=toolResult.comparison;
  const pinned=assertCurrent(original,toolResult.evidenceReport);
  if(!Number.isSafeInteger(maxRows)||maxRows<1||maxRows>200) fail('RESOURCE_LIMIT');
  const grantCheck=async(operation)=>{
    for(const p of original.sourcePins){
      if(signal?.aborted) fail('CANCELLED');
      const decision=await verifyCurrentGrant({operation,scope:'development',
        repoIdentity:p.repoIdentity,resolvedCommitSha:p.resolvedCommitSha,
        pinId:p.pinId,sourceGrantRef:p.sourceGrantRef??null});
      if(decision!==true) fail('SOURCE_UNAUTHORIZED');
    }
  };
  await grantCheck('hvi.inspector.before-project');
  const incomplete=original.limits.truncated===true||
    original.errors.length>0||
```

_First 80 of 128 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
