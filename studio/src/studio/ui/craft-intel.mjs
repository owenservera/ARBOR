// Read-only DOM projection. All untrusted strings are inserted as textContent, never HTML.
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
async function refresh(){
  put('notice','Reading local evidence…');
  try{
    const response=await fetch('/api/v1/dev/craft-intelligence',{credentials:'same-origin',cache:'no-store'});
    const data=await response.json();
    if(!response.ok)throw new Error(data.message||data.error||data.code||'Source not available');
    if(data.status==='not-configured'){
      put('notice','Not configured');put('source',data.nextStep);put('target','');put('origin','');put('recon','');
      for(const id of ['metrics','roles','operations','features'])$(id).replaceChildren();
      return;
    }
    if(data.schema!=='vivim.studio-craft-intelligence/1')throw new Error('Unrecognized source schema');
    put('notice','External evidence only — no effect authority');
    put('target','Target: '+data.target.siteId);
    put('origin','Origin: '+data.target.origin);
    put('source','Native evidence check: '+(data.source.nativeVerified?'verified':'UNVERIFIED')+
      ' · Scope: '+data.source.coverage+' · Bundle: '+(data.source.bundleDigest||'unspecified'));
    const metrics=$('metrics');metrics.replaceChildren();
    for(const [key,count] of Object.entries(data.counts)){
      const box=document.createElement('div');box.className='metric';
      const number=document.createElement('b');number.textContent=String(count);
      const label=document.createElement('span');label.textContent=key;
      box.append(number,label);metrics.append(box);
    }
    table('roles',data.roles,['role','count']);
    table('operations',data.operations,['operation','count']);
    const r=data.reconciliation;
    put('recon',r.status+' · '+r.sourceDivergences+' source divergences · no runtime capability proven');
    table('features',r.features,['owner','featureId','observationStatus']);
  }catch(e){put('notice','Evidence unavailable: '+e.message);}
}
$('reload').addEventListener('click',refresh);
refresh();
