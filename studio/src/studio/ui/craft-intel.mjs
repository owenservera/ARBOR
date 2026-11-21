// A read-only projection of inert evidence. Never interpret untrusted data as HTML.
const $=id=>document.getElementById(id);
const put=(id,value)=>{$(id).textContent=String(value??'');};
function table(id,rows,fields){
  const root=$(id);root.replaceChildren();
  for(const row of rows){
    const tr=document.createElement('tr');
    for(const key of fields){const td=document.createElement('td');td.textContent=String(row[key]??'');tr.append(td);}
    root.append(tr);
  }
}
function clear(){
  for(const name of ['roles','operations','kinds','confidence','features','evidence','deltaRoles'])$(name).replaceChildren();
  $('metrics').replaceChildren();$('deltaMetrics').replaceChildren();$('deltaData').hidden=true;
  for(const id of ['source','target','origin','recon','deltaStatus'])put(id,'');
}
async function get(path){
  const response=await fetch(path,{credentials:'same-origin',cache:'no-store'});
  const data=await response.json();
  if(!response.ok)throw new Error(data.message||data.error||data.code||'Evidence unavailable');
  return data;
}
function metric(root,label,value){
  const box=document.createElement('div');box.className='metric';
  const n=document.createElement('b');n.textContent=String(value);
  const caption=document.createElement('span');caption.textContent=label;
  box.append(n,caption);root.append(box);
}
async function refresh(){
  clear();put('notice','Reading configured evidence…');
  try{
    const registry=await get('/api/v1/dev/craft-intelligence/targets');
    if(registry.schema!=='vivim.craft-intelligence-sources/1')throw new Error('Unexpected target registry schema');
    const targets=registry.targets??[];
    const select=$('targetSelect');const prior=select.value;select.replaceChildren();
    for(const entry of targets){const opt=document.createElement('option');opt.value=entry.siteId;opt.textContent=entry.siteId;select.append(opt);}
    if(!targets.length){
      const opt=document.createElement('option');opt.value='';opt.textContent='Not configured';select.append(opt);
      put('notice','No application evidence configured');
      put('source','Configure VIVIM_CRAFT_INDEX_FILE or VIVIM_CRAFT_ATLAS_FILE locally.');return;
    }
    select.value=targets.some(x=>x.siteId===prior)?prior:targets[0].siteId;
    const selected=targets.find(x=>x.siteId===select.value);
    const data=await get('/api/v1/dev/craft-intelligence/targets/'+encodeURIComponent(selected.siteId));
    if(data.schema!=='vivim.studio-craft-intelligence/1')throw new Error('Unexpected Craft projection schema');
    if(data.authority?.executionAuthorized!==false||data.authority?.sendPermission!==false)throw new Error('Source is not read-only');
    put('notice','External research evidence — not an executable adapter');
    put('target','Target: '+data.target.siteId);put('origin','Origin: '+data.target.origin);
    put('source','Native verification reported by Labs: '+(data.source.nativeVerified?'claimed':'unverified')+
      ' · Studio attestation: none · Bundle: '+(data.source.bundleDigest||'unspecified'));
    for(const [k,v] of Object.entries(data.counts))metric($('metrics'),k,v);
    table('roles',data.roles,['role','count']);
    table('operations',data.operations,['operation','count']);
    table('kinds',data.observationKinds??[],['kind','count']);
    table('confidence',data.confidence??[],['confidence','count']);
    const r=data.reconciliation;
    put('recon',r.status+' · '+r.sourceDivergences+' source divergences · '+r.unmappedCount+' unmapped controls · no runtime effects verified');
    table('features',r.features,['owner','featureId','observationStatus','evidenceCount']);
    table('evidence',data.evidence??[],['evidenceId','operation','confidence','coverage','limitations']);
    if(selected.deltaConfigured){
      const delta=await get('/api/v1/dev/craft-intelligence/targets/'+encodeURIComponent(selected.siteId)+'/delta');
      if(delta.schema!=='vivim.studio-craft-observation-delta/1')throw new Error('Unexpected delta schema');
      put('deltaStatus','Observation differences only — no feature removals inferred');
      $('deltaData').hidden=false;
      metric($('deltaMetrics'),'evidence added',delta.observedEvidence.added);
      metric($('deltaMetrics'),'not present in later capture',delta.observedEvidence.notPresentInAfter);
      metric($('deltaMetrics'),'before states',delta.states.before);
      metric($('deltaMetrics'),'after states',delta.states.after);
      table('deltaRoles',delta.roleCounts,['role','before','after','delta']);
    }else put('deltaStatus','No previous atlas configured for this target.');
  }catch(e){clear();put('notice','Evidence unavailable: '+e.message);}
}
$('reload').addEventListener('click',refresh);
$('targetSelect').addEventListener('change',refresh);
refresh();
