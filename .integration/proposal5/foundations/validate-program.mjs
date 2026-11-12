/**
 * ARBOR Proposal 5 foundation program verifier.
 * Pure/side-effect free. This validates the DOCUMENT PROGRAM'S structure,
 * NOT runtime functionality, Git source authenticity or any Host grant.
 */
export const FOUNDATION_CHECK_SCHEMA='arbor.proposal5.foundations.validation/1';
const HEX40=/^[a-f0-9]{40}$/i;
const OWN=/^(?:A|B|C|D|E|F|G)(?:\+(?:A|B|C|D|E|F|G))*$/;
const PRIORITIES=new Set(['P0','P1','P2']);
const stages=new Set(['PRE_G','G_OWNER_ONLY','POST_G','AFTER_BETA']);
const nonEmpty=x=>typeof x==='string'&&x.trim().length>0;
const unique=a=>new Set(a).size===a.length;
const fail=(errors,code,detail)=>errors.push({code,detail});
export function validateFoundationProgram({atlas,gaps,waves}={}) {
  const errors=[],warnings=[];
  if(!atlas||!gaps||!waves||!Array.isArray(atlas.sourceEntries)||
     !Array.isArray(gaps.gaps)||!Array.isArray(waves.waves)) {
    return {schema:FOUNDATION_CHECK_SCHEMA,status:'INVALID',errors:[{code:'BAD_PROGRAM_INPUT',detail:'Expected three versioned data manifests'}],warnings:[],counts:null,effectPerformed:false};
  }
  if(atlas.schema!=='arbor.proposal5.foundations.source-atlas/1')fail(errors,'ATLAS_SCHEMA','wrong atlas schema');
  if(gaps.schema!=='arbor.proposal5.foundations.gaps/1')fail(errors,'GAP_SCHEMA','wrong gap schema');
  if(waves.schema!=='arbor.proposal5.foundations.waves/1')fail(errors,'WAVE_SCHEMA','wrong wave schema');
  if(waves.mobilePolicy!=='PWA_FIRST_APK_DEFERRED')fail(errors,'MOBILE_SCOPE','PWA-first policy not set');
  if(waves.disposition!=='SOURCE_GROUNDED_PROPOSED_NOT_EXECUTED')fail(errors,'UNSAFE_PROMOTION','manifest falsely claims executed or promoted');
  if(atlas.status!=='SELECTIVE_ACTUAL_CODE_AND_RESEARCH_AUDIT_NOT_WHOLE_REPO_RUNTIME_CERTIFICATION')
    fail(errors,'ATLAS_TRUTH','atlas overclaims coverage');
  const srcIds=atlas.sourceEntries.map(x=>x.id);
  if(!unique(srcIds))fail(errors,'DUPLICATE_SOURCE_ID','source IDs not unique');
  const sources=new Set(srcIds);
  for(const s of atlas.sourceEntries){
    if(!nonEmpty(s.id)||!nonEmpty(s.path)||!nonEmpty(s.repository)||!HEX40.test(s.commit)||!HEX40.test(s.blobSha))
      fail(errors,'INVALID_SOURCE_PIN',String(s.id));
    if(s.runtimeAccepted!==false)fail(errors,'SOURCE_RUNTIME_OVERCLAIM',String(s.id));
    if(!nonEmpty(s.observed)||!nonEmpty(s.unverified)||!nonEmpty(s.status))
      fail(errors,'MISSING_SOURCE_STATUS',String(s.id));
  }
  const gapIds=gaps.gaps.map(x=>x.id);
  if(!unique(gapIds))fail(errors,'DUPLICATE_GAP_ID','duplicate gap IDs');
  if(gaps.count!==gaps.gaps.length)fail(errors,'GAP_COUNT','declared gap total differs from records');
  for(const g of gaps.gaps){
    if(!PRIORITIES.has(g.priority)||!nonEmpty(g.owner)||!nonEmpty(g.phase)||
       !nonEmpty(g.gap)||!nonEmpty(g.closure)||!nonEmpty(g.negative))
      fail(errors,'INVALID_GAP',String(g.id));
    if(g.disposition!=='OPEN_SOURCE_AUDITED_NOT_IMPLEMENTED')
      fail(errors,'GAP_STATUS_OVERCLAIM',String(g.id));
    if(!Array.isArray(g.sourceIds)||g.sourceIds.some(id=>!sources.has(id)))
      fail(errors,'GAP_SOURCE_REF',String(g.id));
    if(g.sourceIds.length===0)warnings.push({code:'GAP_MISSING_EXACT_SOURCE',detail:g.id});
  }
  const waveIds=waves.waves.map(w=>w.id),waveSet=new Set(waveIds);
  if(!unique(waveIds))fail(errors,'DUPLICATE_WAVE_ID','duplicate wave ID');
  const taskIds=[],perPhase={};
  for(const w of waves.waves){
    if(!stages.has(w.stage)||!nonEmpty(w.promotion)||!Array.isArray(w.dependency)||
       !Array.isArray(w.tasks)||w.tasks.length!==w.taskCount)
      fail(errors,'BAD_WAVE',String(w.id));
    perPhase[w.stage]=(perPhase[w.stage]??0)+1;
    if(w.stage==='PRE_G'&&w.promotion!=='NOT_ALLOWED')fail(errors,'PRE_G_PROMOTION',w.id);
    if(w.stage==='G_OWNER_ONLY'&&w.id!=='G-01')fail(errors,'G_OWNER_CONFLICT',w.id);
    if(w.stage==='POST_G'&&!w.dependency.some(d=>waveSet.has(d)))
      fail(errors,'POST_G_MISSING_WAVE_DEP',w.id);
    if(w.dependency.some(d=>d===w.id))fail(errors,'SELF_DEPENDENCY',w.id);
    for(const t of w.tasks){
      taskIds.push(t.id);
      if(!t.id.startsWith('FA-')||!OWN.test(t.owner)||!PRIORITIES.has(t.priority)||
         !nonEmpty(t.work)||!nonEmpty(t.proof)||t.status!=='NOT_STARTED')
        fail(errors,'INVALID_TASK',String(t.id));
    }
  }
  if(!unique(taskIds))fail(errors,'DUPLICATE_TASK_ID','duplicate task ID');
  if(taskIds.length!==waves.totalTasks)fail(errors,'TASK_COUNT','declared tasks differ from actual');
  if(!waveSet.has('G-01')||!waveSet.has('W2-F0')||!waveSet.has('FB-01'))
    fail(errors,'MISSING_CRITICAL_WAVE','Missing original G, secure W2 or post-beta handoff');
  return {
    schema:FOUNDATION_CHECK_SCHEMA,
    status:errors.length?'INVALID':'STRUCTURALLY_VALID_SOURCE_PROGRAM_ONLY',
    counts:{sources:atlas.sourceEntries.length,gaps:gaps.gaps.length,waves:waves.waves.length,tasks:taskIds.length,perPhase},
    errors,warnings,effectPerformed:false
  };
}
