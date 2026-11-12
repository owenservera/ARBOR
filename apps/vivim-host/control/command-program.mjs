// Lane B declarative multi-command compiler. NOT an orchestrator or executor.
// Its product is an inert DAG of existing Host action IDs, with no approval token.
// Mission Intelligence may consume this only through the canonical Host dispatcher.
export const COMMAND_PROGRAM_SCHEMA='vivim.command-program/1';
const own = v => v !== null && typeof v==='object' && !Array.isArray(v) &&
  (Object.getPrototypeOf(v)===Object.prototype || Object.getPrototypeOf(v)===null) &&
  Object.values(Object.getOwnPropertyDescriptors(v)).every(d=>'value' in d);
const only = (v,allowed)=>own(v)&&Object.keys(v).every(k=>allowed.includes(k));
const ID=/^[a-z][a-z0-9._:-]{0,79}$/;
const risks=['R0','R1','R2','R3'];
const fail=(reason,stepId=null)=>({schema:COMMAND_PROGRAM_SCHEMA,outcome:'refused',
  reason,stepId,executionAuthorized:false,executionPerformed:false});
function validArgs(expected,actual) {
  if(!own(expected)||!own(actual)||
    Object.keys(expected).length!==Object.keys(actual).length||
    Object.keys(actual).some(k=>!Object.hasOwn(expected,k)))return false;
  return Object.entries(expected).every(([key,spec])=>{
    const value=actual[key];
    return typeof value==='string' && value.length>0 && value===value.trim() &&
      (spec.type==='enum'?Array.isArray(spec.values)&&spec.values.includes(value):
        spec.type==='string'&&Number.isSafeInteger(spec.min)&&Number.isSafeInteger(spec.max)&&
        value.length>=spec.min&&value.length<=spec.max);
  });
}
export function compileCommandProgram({steps,catalog,programId='command-program',expectedCatalogVersion}={}) {
  if(!Array.isArray(steps)||steps.length<1||steps.length>32||
    !only(catalog,['schema','version','asOf','policy','actions','languageGroups'])||
    catalog.schema!=='vivim.control-action-catalog/1'||
    !Number.isSafeInteger(catalog.version)||!Array.isArray(catalog.actions)||
    !ID.test(programId))return fail('INVALID_PROGRAM');
  if(expectedCatalogVersion!==undefined && expectedCatalogVersion!==catalog.version)
    return fail('STALE_CATALOG');
  const indexed=new Map();
  for(const step of steps){
    if(!only(step,['id','actionId','args','dependsOn','onFailure'])||
      !ID.test(step.id)||typeof step.actionId!=='string'||!own(step.args)||
      !Array.isArray(step.dependsOn)||step.dependsOn.length>32||
      !['stop',undefined].includes(step.onFailure)||
      step.dependsOn.some(v=>typeof v!=='string'||!ID.test(v))||
      new Set(step.dependsOn).size!==step.dependsOn.length||
      indexed.has(step.id))return fail('INVALID_STEP',step?.id??null);
    indexed.set(step.id,step);
  }
  const seen=new Set(),active=new Set(),ordered=[];
  function visit(id){
    if(active.has(id))return false;
    if(seen.has(id))return true;
    const step=indexed.get(id);
    if(!step)return false;
    active.add(id);
    for(const dep of step.dependsOn) if(!visit(dep))return false;
    active.delete(id);seen.add(id);ordered.push(step);return true;
  }
  // Stable IR even when independent authoring steps arrive in a different order.
  for(const step of [...steps].sort((a,b)=>a.id.localeCompare(b.id)))
    if(!visit(step.id))return fail('CYCLIC_OR_UNKNOWN_DEPENDENCY',step.id);
  const compiled=[];
  for(const step of ordered){
    const matches=catalog.actions.filter(a=>a.id===step.actionId);
    if(matches.length!==1)return fail('UNKNOWN_OR_DUPLICATE_ACTION',step.id);
    const action=matches[0];
    if(!risks.includes(action.risk)||!validArgs(action.args,step.args))
      return fail('INVALID_ACTION_ARGUMENTS',step.id);
    if(!['source_wired','verified'].includes(action.readiness) ||
      action.risk==='R3') return fail('UNAVAILABLE_ACTION',step.id);
    compiled.push({id:step.id,actionId:action.id,args:{...step.args},
      dependsOn:[...step.dependsOn],onFailure:'stop',
      risk:action.risk,needsApproval:action.risk!=='R0',readiness:action.readiness,
      executionAuthorized:false,executionPerformed:false});
  }
  return {schema:COMMAND_PROGRAM_SCHEMA,outcome:'compiled',
    program:{id:programId,catalogVersion:catalog.version,
      steps:compiled,requiredApprovalSteps:compiled.filter(s=>s.needsApproval).map(s=>s.id),
      ordering:'topological',retryPolicy:'no-implicit-retry'},
    executionAuthorized:false,executionPerformed:false};
}
