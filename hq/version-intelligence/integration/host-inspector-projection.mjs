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
    original.sourcePins.some(p=>p.completeness!=='complete');
  const pins=original.sourcePins.map(p=>({pinId:p.pinId,repoIdentity:p.repoIdentity,
    resolvedCommitSha:p.resolvedCommitSha,completeness:p.completeness}));
  const rows=original.sourceDeltas.slice(0,maxRows).map((r,i)=>{
    if(!pinned.has(r.originPinId)||!pinned.has(r.targetPinId)||
        r.targetPinId!==original.targetPinId) fail('PIN_CONFLICT');
    const origin=pins.find(p=>p.pinId===r.originPinId);
    const target=pins.find(p=>p.pinId===r.targetPinId);
    const observable=origin.completeness==='complete'&&target.completeness==='complete';
    return {id:SAFE_ID.test(r.id)?r.id:'redacted_'+i,
      originPinId:r.originPinId,targetPinId:r.targetPinId,
      originPath:safePath(r.originPath??'[unprovided]'),
      targetPaths:(Array.isArray(r.targetPaths)?r.targetPaths:[]).slice(0,16).map(safePath),
      state:observable&&STATES.has(r.state)?r.state:'UNOBSERVABLE',
      certainty:observable?safeText(r.certainty,40):'unknown',
      evidenceRefs:(Array.isArray(r.evidenceRefs)?r.evidenceRefs:[]).slice(0,8)
        .map(x=>safeText(x,96)),
    };
  });
  const coverage=original.coverage.map(r=>{
    if(!pinned.has(r.sourcePinId)||r.targetPinId!==original.targetPinId)
      fail('PIN_CONFLICT');
    return {sourcePinId:r.sourcePinId,targetPinId:r.targetPinId,
      sourceCompleteness:r.sourceCompleteness??'partial',
      targetCompleteness:r.targetCompleteness??'partial',
      totalCompared:Number.isSafeInteger(r.totalCompared)?r.totalCompared:0};
  });
  const truncated=original.limits.truncated===true||original.sourceDeltas.length>maxRows;
  const comparison={
    schema:'arbor.hvi.version-comparison/1',targetPinId:original.targetPinId,
    sourcePins:pins,sourceDeltas:rows,coverage,
    limits:{truncated,sourceFindingCount:original.sourceDeltas.length,
      projectedFindingCount:rows.length},errors:original.errors.length?['REDACTED_ERROR_METADATA']:[],
  };
  comparison.reproducibilityDigest=digest(comparison);
  const envelope={
    schema:HVI_HOST_INSPECTOR_SCHEMA,sourceComparisonDigest:comparison.reproducibilityDigest,
    originalEvidenceDigest:original.reproducibilityDigest,
    status:incomplete||truncated?'INCOMPLETE_SOURCE_EVIDENCE':'SOURCE_ONLY_UNVERIFIED',
    originalComparison:comparison,report:{schema:'arbor.hvi.report/1',
      targetPinId:original.targetPinId},runtimeAccepted:false,
    sourceOnly:true,privacy:'METADATA_ONLY_REDACTED',
    syntheticPreviewAllowed:false,remoteAccepted:false,
  };
  await grantCheck('hvi.inspector.before-return');
  return Object.freeze(envelope);
}
