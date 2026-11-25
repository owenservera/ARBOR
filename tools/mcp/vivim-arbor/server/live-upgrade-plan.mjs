// Pure local release classification. Inputs must come from independently verified immutable release evidence. This module does not grant authority, start/stop a process or promote a release.
export function planLiveUpgrade(input) {
 const deny=code=>{throw Error(code)};
 const sha=(s,n)=>typeof s==='string'&&s.length===n&&/^[0-9a-f]+$/.test(s);
 const record=x=>x&&typeof x==='object'&&!Array.isArray(x);
 const validPath=p=>typeof p==='string'&&p.length>0&&p.length<=4096&&!/[\\:\x00-\x1f]/.test(p)&&p.split('/').every(x=>x&&x!=='.'&&x!=='..');
 function index(entries){
  if(!Array.isArray(entries)||entries.length>100000)deny('INVALID_INVENTORY');
  const map=new Map(),fold=new Set();
  for(const e of entries){
   if(!record(e)||!validPath(e.path)||!['file','directory'].includes(e.kind)||fold.has(e.path.toLowerCase()))deny('INVALID_INVENTORY');
   if(e.kind==='file'&&(!sha(e.sha256,64)||!Number.isSafeInteger(e.bytes)||e.bytes<0))deny('INVALID_INVENTORY');
   fold.add(e.path.toLowerCase());map.set(e.path,e);
  }
  return map;
 }
 if(!record(input)||!record(input.active)||!record(input.candidate))deny('INVALID_RELEASE');
 const a=input.active,b=input.candidate;
 for(const r of [a,b]){
  if(!sha(r.sourceSha,40)||!sha(r.treeSha256,64)||!sha(r.grantSha256,64)||
     !sha(r.recipeConfigSha,64)||!sha(r.rootConfigSha,64)||
     !sha(r.toolContractSha256,64)||r.verified!==true)deny('INVALID_RELEASE_EVIDENCE');
 }
 const before=index(a.entries),after=index(b.entries);
 const changed=[];
 for(const p of [...new Set([...before.keys(),...after.keys()])].sort()){
  const x=before.get(p),y=after.get(p);
  if(x?.kind===y?.kind&&(x?.kind==='directory'||x?.sha256===y?.sha256&&x?.bytes===y?.bytes))continue;
  changed.push(p);
 }
 // The entire candidate tree is sealed before this pure planner is invoked.
 // Metadata alone is not an authority signal. Any unknown file conservatively
 // requires Host handover. Existing runtime scripts may read workspace files.
 const doc=p=>/^runtime\/tools\/mcp\/vivim-arbor\/(?:PLAN|HANDOFF|NATIVE-WORKSTATION-PARITY)\.md$/.test(p);
 const adapter=p=>/^(?:profile\/server|runtime\/tools\/mcp\/vivim-arbor\/server)(?:\/[^/]+\.cjs)?$/.test(p);
 const grantChanged=a.grantSha256!==b.grantSha256||a.recipeConfigSha!==b.recipeConfigSha||a.rootConfigSha!==b.rootConfigSha;
 const contractChanged=a.toolContractSha256!==b.toolContractSha256;
 // Metadata files may differ only if their separately bound authority fields
 // remain identical. Host/runtime files are not ignored on that basis.
 const relevant=changed.filter(p=>p!=='manifest.json'&&!doc(p));
 let mode='no-runtime-restart';
 if(grantChanged||relevant.some(p=>!adapter(p)))mode='host-handover';
 else if(relevant.length||contractChanged)mode='mcp-child-reload';
 return {schema:'vivim.workstation-live-upgrade-plan/1',activeSource:a.sourceSha,candidateSource:b.sourceSha,
  activeTree:a.treeSha256,candidateTree:b.treeSha256,mode,changedCount:changed.length,
  changedPaths:changed.slice(0,200),changesTruncated:changed.length>200,
  ownerApprovalRequired:mode!=='no-runtime-restart',grantActivationRequired:grantChanged,
  clientMetadataRefreshRequired:contractChanged,drainInFlightCalls:mode!=='no-runtime-restart',
  drainNativeJobs:mode==='host-handover',preserveTunnelSupervisor:true,
  preserveOldRelease:true,automaticEffectReplay:false,promotionPerformed:false};
}
