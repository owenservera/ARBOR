# File: hq/version-intelligence/identity/index.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/version-intelligence/identity/index.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 14177 B |
| Lines | 229 |
| Hash | e1e84070ddaf |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| HVI_IDENTITY_SCHEMA | const | 8 | yes | export const HVI_IDENTITY_SCHEMA = &#39;arbor.hvi.identity/1&#39;; |
| HVI_IDENTITY_INPUT_SCHEMA | const | 9 | yes | export const HVI_IDENTITY_INPUT_SCHEMA = &#39;arbor.hvi.identity-input/1&#39;; |
| DECISION_STATES | const | 10 | yes | export const DECISION_STATES = Object.freeze([&#39;keep_separate&#39;,&#39;reject_candidate&#39;,&#39;confirm_equivalence&#39;]); |
| SHA40 | const | 11 | no | const SHA40=/^[0-9a-f]{40}$/; |
| HEX64 | const | 12 | no | const HEX64=/^[0-9a-f]{64}$/; |
| REPO | const | 13 | no | const REPO=/^[A-Za-z0-9_.-]+\\/[A-Za-z0-9_.-]+$/; |
| SAFE_ID | const | 14 | no | const SAFE_ID=/^[A-Za-z0-9][A-Za-z0-9:._@/+#-]{0,239}$/; |
| CANON | const | 15 | no | const CANON=/^(?:cap:[a-z0-9][a-z0-9.-]*\|[a-z0-9][a-z0-9._-]*@\\d+(?:\\.\\d+)*)$/; |
| UNSAFE | const | 16 | no | const UNSAFE=/(?:^\|[\\/\\\\])(?:\\.env[^\\/\\\\]*\|[^\\/\\\\]+\\.env\|[^\\/\\\\]+\\.(?:pem\|p12\|keystore)\|cookies\|login data\|storage-state\\.json\|session\\.json\|release-profile\\.json)(?:[\\/\\\\]\|$)\|(?:^\|[?&amp;])(?:token\|pass… |
| SOURCE_STATES | const | 17 | no | const SOURCE_STATES=new Set([&#39;complete&#39;,&#39;partial&#39;,&#39;blocked&#39;,&#39;missing&#39;]); |
| TYPES | const | 18 | no | const TYPES=new Set([&#39;capability&#39;,&#39;tracker&#39;,&#39;implementation&#39;,&#39;file&#39;,&#39;consumer&#39;,&#39;algorithm&#39;,&#39;test&#39;,&#39;research&#39;,&#39;release&#39;,&#39;deployment&#39;,&#39;schema&#39;,&#39;catalogue&#39;]); |
| RELATIONS | const | 19 | no | const RELATIONS=new Set([&#39;implements&#39;,&#39;tracks&#39;,&#39;consumes&#39;,&#39;tests&#39;,&#39;researches&#39;,&#39;releases&#39;,&#39;deploys&#39;,&#39;depends_on&#39;,&#39;documents&#39;,&#39;references&#39;,&#39;equivalent_candidate&#39;]); |
| cmp | function | 20 | no | const cmp=(a,b)=&gt;a&lt;b?-1:a&gt;b?1:0; |
| stable | function | 21 | no | function stable(value) { |
| sha | function | 26 | no | const sha=(s)=&gt;createHash(&#39;sha256&#39;).update(s).digest(&#39;hex&#39;); |
| digest | function | 27 | no | const digest=(x)=&gt;sha(JSON.stringify(stable(x))); |
| HviIdentityError | class | 28 | yes | export class HviIdentityError extends Error { |
| constructor | method | 29 | yes | constructor(code) {super(code);this.name=&#39;HviIdentityError&#39;;this.code=code;} |
| fail | function | 31 | no | function fail(code){throw new HviIdentityError(code);} |
| field | function | 32 | no | function field(v,max=240) { |
| id | function | 36 | no | function id(v){const s=field(v);if(!SAFE_ID.test(s))fail(&#39;ID_CONFLICT&#39;);return s;} |
| safePath | function | 37 | no | function safePath(v){ |
| s | const | 38 | no | const s=field(v,1024); |
| pinDigest | function | 42 | no | function pinDigest(v){if(typeof v!==&#39;string&#39;\|\|!HEX64.test(v))fail(&#39;DIGEST_CONFLICT&#39;);return v;} |
| makeIdentity | function | 43 | no | const makeIdentity=(repo,revision,sourceScopedRecordId)=&gt;&#39;hvi-row:&#39;+sha(repo+&#39;\\0&#39;+revision+&#39;\\0&#39;+sourceScopedRecordId).slice(0,40); |
| makeLineage | function | 44 | no | const makeLineage=(repo,sourceScopedRecordId)=&gt;&#39;hvi-lineage:&#39;+sha(repo+&#39;\\0&#39;+sourceScopedRecordId).slice(0,40); |
| makePair | function | 45 | no | const makePair=(a,b)=&gt;&#39;hvi-pair:&#39;+sha([a,b].sort(cmp).join(&#39;\\0&#39;)).slice(0,40); |
| sourceScopedRevisionId | const | 46 | yes | export const sourceScopedRevisionId=makeIdentity; |
| stableLineageId | const | 47 | yes | export const stableLineageId=makeLineage; |
| validatePins | function | 48 | no | function validatePins(input){ |
| pins | const | 50 | no | const pins=[],byId=new Map(),byRevision=new Map(); |
| pinId | const | 53 | no | const pinId=id(p.pinId),repoIdentity=field(p.repoIdentity,180); |
| manifestDigest | const | 57 | no | const manifestDigest=pinDigest(p.manifestDigest); |
| entry | const | 58 | no | const entry={pinId,repoIdentity,resolvedCommitSha:p.resolvedCommitSha,manifestDigest,completeness:p.completeness}; |
| revKey | const | 60 | no | const revKey=repoIdentity+&#39;\\0&#39;+p.resolvedCommitSha; |
| sourceRecord | function | 66 | no | function sourceRecord(raw,pin){ |
| sourceScopedRecordId | const | 67 | no | const sourceScopedRecordId=id(raw.sourceScopedRecordId); |
| identityId | const | 68 | no | const identityId=makeIdentity(pin.repoIdentity,pin.resolvedCommitSha,sourceScopedRecordId); |
| lineageId | const | 69 | no | const lineageId=makeLineage(pin.repoIdentity,sourceScopedRecordId); |
| name | const | 72 | no | const name=field(raw.name,400); |
| canonicalId | const | 73 | no | const canonicalId=raw.canonicalId==null?null:field(raw.canonicalId); |
| owner | const | 75 | no | const owner=field(raw.owner??&#39;source_unverified&#39;,150); |
| implementationDigest | const | 76 | no | const implementationDigest=raw.implementationDigest??null; |
| sourcePath | const | 78 | no | const sourcePath=raw.sourcePath==null?null:safePath(raw.sourcePath); |
| sourceBlobSha | const | 79 | no | const sourceBlobSha=raw.sourceBlobSha??null; |
| evidenceRefs | const | 81 | no | const evidenceRefs=raw.evidenceRefs??[]; |
| evidence | const | 83 | no | const evidence=[...new Set(evidenceRefs.map(e=&gt;field(e,1024)))].sort(cmp); |
| validPrevious | function | 93 | no | function validPrevious(previous){ |
| sanitizeDecision | function | 100 | no | function sanitizeDecision(raw,known){ |
| a | const | 102 | no | const a=id(raw.left),b=id(raw.right); |
| reviewer | const | 104 | no | const reviewer=field(raw.reviewer,180), evidenceRef=field(raw.evidenceRef,1024); |
| overlaps | function | 110 | no | function overlaps(records,decisions,maxPairs){ |
| candidates | const | 111 | no | const candidates=new Map(),conflicts=new Map(),groups=new Map(); |
| hitLimit | variable | 112 | no | let hitLimit=false; |
| byId | const | 113 | no | const byId=new Map(records.map(r=&gt;[r.id,r])); |
| add | function | 114 | no | const add=(a,b,basis)=&gt;{ |
| k | const | 116 | no | const k=makePair(a.id,b.id); |
| differentImplementation | const | 124 | no | const differentImplementation=a.implementationDigest&amp;&amp;b.implementationDigest&amp;&amp;a.implementationDigest!==b.implementationDigest; |
| differentOwner | const | 125 | no | const differentOwner=a.owner!==b.owner; |
| differentType | const | 126 | no | const differentType=a.type!==b.type; |
| result | const | 147 | no | const result=[...candidates.values()].sort((a,b)=&gt;cmp(a.id,b.id)).map(c=&gt;{ const decision=decisions.find(d=&gt;d.id===c.id)??null; return {...c,basis:[...c.basis].sort(cmp),decision, disposition:decisio… |
| decision | const | 148 | no | const decision=decisions.find(d=&gt;d.id===c.id)??null; |
| orphanDecisions | const | 152 | no | const orphanDecisions=decisions.filter(d=&gt;!candidates.has(d.id)); |
| buildPinnedIdentityCrosswalk | function | 158 | yes | export function buildPinnedIdentityCrosswalk({pins:rawPins,records:rawRecords=[],links:rawLinks=[],decisions:rawDecisions=[],previous=null,maxRecords=100000,maxCandidatePairs=10000}={}){ |
| prior | const | 159 | no | const prior=validPrevious(previous); |
| bound | const | 161 | no | const bound=Math.min(100000,Math.max(1,Number.isInteger(maxRecords)?maxRecords:100000)); |
| pairBound | const | 162 | no | const pairBound=Math.min(10000,Math.max(1,Number.isInteger(maxCandidatePairs)?maxCandidatePairs:10000)); |
| prevPins | const | 164 | no | const prevPins=new Map((prior?.pins??[]).map(p=&gt;[p.pinId,p])); |
| revs | const | 165 | no | const revs=new Map((prior?.pins??[]).map(p=&gt;[p.repoIdentity+&#39;\\0&#39;+p.resolvedCommitSha,p.manifestDigest])); |
| old | const | 167 | no | const old=prevPins.get(p.pinId); |
| digestOld | const | 169 | no | const digestOld=revs.get(p.repoIdentity+&#39;\\0&#39;+p.resolvedCommitSha); |
| records | const | 172 | no | const records=[],mapped=new Map(),priorMap=new Map((prior?.records??[]).map(r=&gt;[r.id,r])); |
| pin | const | 174 | no | const pin=byId.get(raw.pinId); |
| row | const | 177 | no | const row=sourceRecord(raw,pin),old=mapped.get(row.id); |
| fromPrevious | const | 179 | no | const fromPrevious=priorMap.get(row.id); |
| check | const | 181 | no | const check=Object.fromEntries(Object.entries(fromPrevious).filter(([k])=&gt;k!==&#39;visibility&#39;)); |
| next | const | 182 | no | const next=Object.fromEntries(Object.entries(row).filter(([k])=&gt;k!==&#39;visibility&#39;)); |
| retained | const | 187 | no | const retained=[]; |
| pin | const | 190 | no | const pin=byId.get(old.pinId); |
| visibility | const | 191 | no | const visibility=pin&amp;&amp;pin.completeness===&#39;missing&#39;?&#39;source_unavailable&#39;:&#39;unobserved&#39;; |
| known | const | 196 | no | const known=new Set(records.map(r=&gt;r.id)),edges=[]; |
| pin | const | 198 | no | const pin=byId.get(raw.pinId),target=byId.get(raw.targetPinId); |
| relation | const | 200 | no | const relation=field(raw.relation,60);if(!RELATIONS.has(relation))fail(&#39;ID_CONFLICT&#39;); |
| to | const | 202 | no | const to=makeIdentity(target.repoIdentity,target.resolvedCommitSha,id(raw.targetSourceScopedRecordId)); |
| uniqueEdges | const | 208 | no | const uniqueEdges=new Map(); |
| seen | const | 210 | no | const seen=new Map(),decisions=[]; |
| d | const | 212 | no | const d=sanitizeDecision(r,known),old=seen.get(d.id); |
| sourceUnobserved | const | 218 | no | const sourceUnobserved=pins.filter(p=&gt;p.completeness!==&#39;complete&#39;).map(p=&gt;({pinId:p.pinId, status:p.completeness,meaning:&#39;UNKNOWN_NOT_MISSING&#39;})); |
| body | const | 220 | no | const body={schema:HVI_IDENTITY_SCHEMA,pins,records,edges:[...uniqueEdges.values()].sort((a,b)=&gt;cmp(a.id,b.id)), |
| projectPinnedIdentities | const | 229 | yes | export const projectPinnedIdentities=buildPinnedIdentityCrosswalk; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 6 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [hq/version-intelligence/identity/legacy-adapters.mjs](./legacy-adapters.mjs.md) | ./index.mjs |
| [hq/version-intelligence/identity/test/identity.test.mjs](./test/identity.test.mjs.md) | ../index.mjs |
| [hq/version-intelligence/integration/index.mjs](../integration/index.mjs.md) | ../identity/index.mjs |
| [tests/hq-version-intelligence/integrated-nway.test.mjs](../../../tests/hq-version-intelligence/integrated-nway.test.mjs.md) | ../../hq/version-intelligence/identity/index.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
/**
 * ARBOR HVI B — read-only, source-scoped identity projection.
 * This is an adapter to the original hq.catalogue-crosswalk/1, not a registry.
 * No files, network, DB, Host effects, personal data, or discovery of HEAD.
 */
import { createHash } from 'node:crypto';

export const HVI_IDENTITY_SCHEMA = 'arbor.hvi.identity/1';
export const HVI_IDENTITY_INPUT_SCHEMA = 'arbor.hvi.identity-input/1';
export const DECISION_STATES = Object.freeze(['keep_separate','reject_candidate','confirm_equivalence']);
const SHA40=/^[0-9a-f]{40}$/;
const HEX64=/^[0-9a-f]{64}$/;
const REPO=/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
const SAFE_ID=/^[A-Za-z0-9][A-Za-z0-9:._@/+#-]{0,239}$/;
const CANON=/^(?:cap:[a-z0-9][a-z0-9.-]*|[a-z0-9][a-z0-9._-]*@\d+(?:\.\d+)*)$/;
const UNSAFE=/(?:^|[\/\\])(?:\.env[^\/\\]*|[^\/\\]+\.env|[^\/\\]+\.(?:pem|p12|keystore)|cookies|login data|storage-state\.json|session\.json|release-profile\.json)(?:[\/\\]|$)|(?:^|[?&])(?:token|password|secret|api[_-]?key)=|(?:^|[\/\\])\.\.(?:[\/\\]|$)/i;
const SOURCE_STATES=new Set(['complete','partial','blocked','missing']);
const TYPES=new Set(['capability','tracker','implementation','file','consumer','algorithm','test','research','release','deployment','schema','catalogue']);
const RELATIONS=new Set(['implements','tracks','consumes','tests','researches','releases','deploys','depends_on','documents','references','equivalent_candidate']);
const cmp=(a,b)=>a<b?-1:a>b?1:0;
function stable(value) {
  if(Array.isArray(value)) return value.map(stable);
  if(value && typeof value==='object') return Object.fromEntries(Object.keys(value).sort(cmp).map(k=>[k,stable(value[k])]));
  return value;
}
const sha=(s)=>createHash('sha256').update(s).digest('hex');
const digest=(x)=>sha(JSON.stringify(stable(x)));
export class HviIdentityError extends Error {
  constructor(code) {super(code);this.name='HviIdentityError';this.code=code;}
}
function fail(code){throw new HviIdentityError(code);}
function field(v,max=240) {
  if(typeof v!=='string'||!v.trim()||v.length>max||/[\x00-\x1f]/.test(v)||UNSAFE.test(v))fail('SOURCE_UNAUTHORIZED');
  return v.trim();
}
function id(v){const s=field(v);if(!SAFE_ID.test(s))fail('ID_CONFLICT');return s;}
function safePath(v){
  const s=field(v,1024);
  if(s.startsWith('/')||s.includes('\\')||s.split('/').some(p=>!p||p==='.'||p==='..'))fail('SCOPE_ESCAPE');
  return s;
}
function pinDigest(v){if(typeof v!=='string'||!HEX64.test(v))fail('DIGEST_CONFLICT');return v;}
const makeIdentity=(repo,revision,sourceScopedRecordId)=>'hvi-row:'+sha(repo+'\0'+revision+'\0'+sourceScopedRecordId).slice(0,40);
const makeLineage=(repo,sourceScopedRecordId)=>'hvi-lineage:'+sha(repo+'\0'+sourceScopedRecordId).slice(0,40);
const makePair=(a,b)=>'hvi-pair:'+sha([a,b].sort(cmp).join('\0')).slice(0,40);
export const sourceScopedRevisionId=makeIdentity;
export const stableLineageId=makeLineage;
function validatePins(input){
  if(!Array.isArray(input)||input.length<1||input.length>32)fail('RESOURCE_LIMIT');
  const pins=[],byId=new Map(),byRevision=new Map();
  for(const p of input){
    if(!p||typeof p!=='object')fail('PIN_NOT_FOUND');
    const pinId=id(p.pinId),repoIdentity=field(p.repoIdentity,180);
    if(!REPO.test(repoIdentity)||!SHA40.test(p.resolvedCommitSha))fail('PIN_NOT_FOUND');
    if(!SOURCE_STATES.has(p.completeness))fail('INCOMPLETE_SCAN');
    if(p.scope!==undefined && p.scope!=='development')fail('SOURCE_UNAUTHORIZED');
    const manifestDigest=pinDigest(p.manifestDigest);
    const entry={pinId,repoIdentity,resolvedCommitSha:p.resolvedCommitSha,manifestDigest,completeness:p.completeness};
    if(byId.has(pinId))fail('ID_CONFLICT');
    const revKey=repoIdentity+'\0'+p.resolvedCommitSha;
    if(byRevision.has(revKey)&&byRevision.get(revKey)!==manifestDigest)fail('DIGEST_CONFLICT');
    byId.set(pinId,entry);byRevision.set(revKey,manifestDigest);pins.push(entry);
  }
  return {pins:pins.sort((a,b)=>cmp(a.pinId,b.pinId)),byId};
}
function sourceRecord(raw,pin){
  const sourceScopedRecordId=id(raw.sourceScopedRecordId);
  const identityId=makeIdentity(pin.repoIdentity,pin.resolvedCommitSha,sourceScopedRecordId);
  const lineageId=makeLineage(pin.repoIdentity,sourceScopedRecordId);
  const type=field(raw.type,60);
  if(!TYPES.has(type))fail('ID_CONFLICT');
  const name=field(raw.name,400);
  const canonicalId=raw.canonicalId==null?null:field(raw.canonicalId);
  if(canonicalId&&!CANON.test(canonicalId))fail('ID_CONFLICT');
  const owner=field(raw.owner??'source_unverified',150);
  const implementationDigest=raw.implementationDigest??null;
  if(implementationDigest!=null&&!SHA40.test(implementationDigest)&&!HEX64.test(implementationDigest))fail('DIGEST_CONFLICT');
  const sourcePath=raw.sourcePath==null?null:safePath(raw.sourcePath);
  const sourceBlobSha=raw.sourceBlobSha??null;
  if(sourceBlobSha!=null&&!SHA40.test(sourceBlobSha))fail('DIGEST_CONFLICT');
```

_First 80 of 230 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
