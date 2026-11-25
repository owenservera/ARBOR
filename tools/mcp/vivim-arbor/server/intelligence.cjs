'use strict';
// Thin local MCP adapter over authoritative project files and the existing Rust observer.
const fs=require('node:fs'), path=require('node:path'), {execFileSync}=require('node:child_process');
const schema=(properties={},required=[])=>({type:'object',properties,required,additionalProperties:false});
module.exports=function(root){
 const arbor=path.join(root,'ARBOR'), ops=path.join(root,'vivim-labs','ZCODE-DESKTOP-COMMANDER-OPERATIONS');
 const laneBase=path.join(ops,'FIVE-LANE-OPERATIONS-R001');
 const stamp=()=>new Date().toISOString();
 function scoped(base,relative){const scope=fs.realpathSync(root), b=fs.realpathSync(base), target=fs.realpathSync(path.join(b,relative)); for(const [parent,child] of [[scope,b],[b,target]]){const r=path.relative(parent,child);if(r==='..'||r.startsWith('..'+path.sep)||path.isAbsolute(r))throw Error('Path outside approved project scope')}return target;}
 function read(base,relative){const f=scoped(base,relative), st=fs.statSync(f);if(!st.isFile())throw Error('Not a regular file');const limit=64*1024;const fd=fs.openSync(f,'r');try{const b=Buffer.alloc(Math.min(limit,st.size));const n=fs.readSync(fd,b,0,b.length,0);return {path:relative,modified:st.mtime.toISOString(),truncated:st.size>n,content:b.subarray(0,n).toString('utf8')}}finally{fs.closeSync(fd)}}
 const allowed=(value,values)=>{if(!values.includes(value))throw Error('Unsupported selection');return value};
 const wiki=['index.md','capabilities.md','changes.md','docs.md','glossary.md','graph.md','protocol.md','semantics.md','symbols.md'];
 const plans=['LANE-BOARD.md','ORCHESTRATOR-NEXT-ACTIONS-R005.md','LONG-RUN-EXECUTION-R006.md','STRATEGIC-EXECUTION-SEQUENCE-R004.md','manifest.json'];
 const native=['gpui-desktop','host-supervisor','hqkg','graph-kernel-integration','extensions','private-shares'];
 const metadata=(base,name)=>{try{const st=fs.statSync(scoped(base,name));return {name,present:true,kind:st.isDirectory()?'directory':'file',modified:st.mtime.toISOString()}}catch{return {name,present:false}}};
 return [
 ['vivim_lane_plan','Read canonical cross-lane planning evidence; does not claim or mutate tasks.',schema({document:{type:'string',enum:plans}},['document']),a=>read(laneBase,allowed(a.document,plans))],
 ['vivim_task_claims','Read current task-claims ledger. Do not infer stale claims are released.',schema(),()=>read(ops,'TASK-CLAIMS.md')],
 ['vivim_wiki_source','Read allowlisted ARBOR project Wiki files, excluding session and personal corpus. This is source evidence, not live AutoWiki state.',schema({document:{type:'string',enum:wiki}},['document']),a=>read(path.join(arbor,'wiki'),allowed(a.document,wiki))],
 ['vivim_native_inventory','Inspect known native ARBOR subsystem directories; presence is not runtime acceptance.',schema(),()=>({observedAt:stamp(),components:native.map(n=>metadata(path.join(arbor,'native'),n)),wiki:wiki.map(n=>metadata(path.join(arbor,'wiki'),n)),authority:'ARBOR Host'})],
 ['vivim_zcode_observe','Run existing local Rust ZCode observer: read-only native sessions, plugins, workflows and V4 snapshot counts. Starts its own child; does not send prompts or change models.',schema(),()=>{const crate=path.join(ops,'native','zcode-observer');const exe=scoped(crate,path.join('target','debug',process.platform==='win32'?'zcode-native-observer.exe':'zcode-native-observer'));const st=fs.statSync(exe);if(!st.isFile())throw Error('Observer binary unavailable');let out='',exitCode=0;try{out=execFileSync(exe,[],{cwd:crate,encoding:'utf8',timeout:90000,maxBuffer:128*1024,windowsHide:true,stdio:['ignore','pipe','pipe']})}catch(e){exitCode=typeof e.status==='number'?e.status:null;out=String(e.stdout||'');}const evidence=out.split(/\r?\n/).filter(l=>/^RUST_(SESSIONS|PLUGINS|WORKFLOWS|PARENT_PROJECTION|COMMAND_QUERY|V4_SUBSCRIBE|V4_FRAME|OBSERVER_FINAL)=[A-Za-z0-9_ =-]+$/.test(l));return {observedAt:stamp(),binaryModified:st.mtime.toISOString(),exitCode,passed:exitCode===0&&evidence.some(l=>/^RUST_OBSERVER_FINAL=PASS\b/.test(l)),evidence,limitation:'Installed binary, not source-pinned rebuild; no raw session content or provider credentials.'};}]
 ];
};
