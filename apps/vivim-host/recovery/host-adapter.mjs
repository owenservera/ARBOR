/**
 * VIVIM Lane D R0 Host adapter. Converts bounded existing Host diagnostics to
 * evidence-linked suggestions. Pure, owner-local, no plan or effect authority.
 * In particular, this module cannot infer successful phone delivery or retry a send.
 */
import { diagnoseRecovery, FAILURE_SIGNATURES, RECOVERY_ACTIONS } from './intelligence.mjs';
import {runNativeProductPure} from '../control/native-product-pure.mjs';

export const HOST_RECOVERY_VIEW_SCHEMA = 'vivim.host-recovery-read-model/1';
const WORKERS = Object.freeze(['relay', 'chatWorker']);
const WORKER_CODES = new Set(['NO_HEARTBEAT', 'HEARTBEAT_STALE', 'WORKER_CYCLE_FAILED']);
const ISO = x => {
  const n = typeof x === 'string' ? Date.parse(x) : NaN;
  return Number.isFinite(n) ? new Date(n).toISOString() : null;
};
const plain = x => x !== null && typeof x === 'object' && !Array.isArray(x);
const CMD = /^cmd-[a-f0-9]{16}$/;

function project(f, d = diagnoseRecovery(f)) {
  const known = FAILURE_SIGNATURES.entries[f.code];
  const actionId = known?.first || null;
  const action = actionId ? RECOVERY_ACTIONS[actionId] : null;
  // An R0 read is a recommendation, not a command or permission.
  return {
    findingId: f.id, code: f.code, target: f.target, severity: f.severity,
    classification: d.classification, confidence: d.hypotheses[0]?.confidence ?? 0,
    evidenceRefs: d.evidenceRefs,
    recommendedRead: action?.level === 'R0' && action.admission === 'existing_read_only'
      ? { actionId, owner: action.owner, effect: 'read', existingExecutor: action.existing }
      : null,
    autoExecute: false, mustVerifyIndependently: true,
  };
}

/** Accept only the existing Host snapshot's bounded metadata; never raw messages. */
export function projectHostRecovery(snapshot, { maxFindings = 12, collected = null } = {}) {
  if (!plain(snapshot) || snapshot.schema !== 'vivim.host-status/1' ||
      !plain(snapshot.services) || !plain(snapshot.journey) ||
      !Number.isInteger(maxFindings) || maxFindings < 1 || maxFindings > 25 ||
      !ISO(snapshot.observedAt)) throw new TypeError('RECOVERY_HOST_SNAPSHOT_INVALID');
  const now = ISO(snapshot.observedAt);
  const evidenceAt = value => {
    const timestamp = ISO(value);
    return timestamp && Date.parse(timestamp) <= Date.parse(now) + 2000 ? timestamp : null;
  };
  const findings = [];
  const add = finding => { if(Array.isArray(collected))collected.push(finding);findings.push(project(finding)); };
  for (const name of WORKERS) {
    if (findings.length >= maxFindings) break;
    const worker = snapshot.services[name];
    const code = worker?.diagnosticCode;
    if (!WORKER_CODES.has(code)) continue;
    // A missing heartbeat is missing observability, NOT evidence of process death.
    const evidenceKind = FAILURE_SIGNATURES.entries[code].evidence;
    const stamp = evidenceAt(worker?.lastHeartbeatAt);
    const evidence = stamp && code !== 'NO_HEARTBEAT'
      ? [{ ref:`host.worker.${name}.${Date.parse(stamp)}`,kind:evidenceKind,at:stamp }] : [];
    add({ schema:'vivim.diagnostic-finding/1', id:`host.${name}.${code}`,
      code, severity:code === 'WORKER_CYCLE_FAILED' ? 'high' : 'medium',
      confidence:code === 'WORKER_CYCLE_FAILED' ? 0.95 : 0.65,
      target:{kind:'worker',id:name},observedAt:now,evidence });
  }
  if (Array.isArray(snapshot.journey.recent)) {
    for (const item of snapshot.journey.recent.slice(0, 25)) {
      if (findings.length >= maxFindings) break;
      if (item?.currentStage !== 'send_outcome_uncertain' || !CMD.test(item?.id ?? '')) continue;
      const stamp=evidenceAt(item.updatedAt);
      add({ schema:'vivim.diagnostic-finding/1', id:`host.${item.id}.uncertain`,
        code:'SEND_OUTCOME_UNCERTAIN', severity:'high',confidence:0.95,
        target:{kind:'control',id:item.id},observedAt:now,
        evidence:stamp ? [{ref:item.id,kind:'send_outcome_uncertain',at:stamp}] : [] });
    }
  }
  return { schema:HOST_RECOVERY_VIEW_SCHEMA,observedAt:now,findings,
    automaticMutations:0,automaticProviderResends:0,
    note:'Diagnostic read-model only. A repair requires a separate, current Host-authorized plan and independently verified outcome.' };
}


/// @hq:consumes vivim.rust-recovery-diagnosis@1
// The ordinary status read uses native Rust classifications when packaged.
// The legacy read model remains an explicitly reported fallback on unavailable
// local development builds, never evidence that a recovery occurred.
export async function projectHostRecoveryNative(snapshot,{maxFindings=12}={}){
  const collected=[];
  const baseline=projectHostRecovery(snapshot,{maxFindings,collected});
  if(!collected.length)return {...baseline,native:{state:'no-findings',engine:'not-invoked',diagnosed:0}};
  const native=await runNativeProductPure('recovery-diagnosis-batch',{findings:collected});
  const rows=native?.result?.results;
  const closed=new Set(['unknown','already_recovered','missing_observability',
    'confirmed_state_not_effect_outcome','confirmed_failure_signal','suspected']);
  if(native?.state!=='computed'||native.result?.schema!=='vivim.native-recovery-batch/1'||
    native.result.authority!=='none'||native.result.executionAuthorized!==false||
    native.result.effectPerformed!==false||!Array.isArray(rows)||rows.length!==collected.length||
    rows.some((d,i)=>!closed.has(d?.classification)||!Array.isArray(d.evidenceRefs)||
      JSON.stringify(d.evidenceRefs)!==JSON.stringify(collected[i].evidence.map(e=>e.ref))||
      !Array.isArray(d.hypotheses)||d.hypotheses.length>1||
      (d.hypotheses[0]&&(!Number.isFinite(d.hypotheses[0].confidence)||
        d.hypotheses[0].confidence<0||d.hypotheses[0].confidence>1)))){
    return {...baseline,native:{state:'unavailable',engine:'rust',code:native?.code??'RUST_RECOVERY_UNAVAILABLE'}};
  }
  const findings=baseline.findings.map((view,i)=>({
    ...view,classification:rows[i].classification,
    confidence:rows[i].hypotheses[0]?.confidence??0,
    evidenceRefs:rows[i].evidenceRefs
  }));
  return {...baseline,findings,native:{state:'source-backed',engine:'rust',diagnosed:rows.length}};
}
