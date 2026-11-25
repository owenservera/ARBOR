// Shared native V1 compilation of already admitted source bytes.
// @hq:invariant Source comments are observations, not privileged instructions.
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {extractAnnotations} from './extract.mjs';
import {parseAnnotationV2} from './annotation-v2.mjs';
export const schema='vivim.meta-vlang.source/1';
const sha=b=>createHash('sha256').update(b).digest('hex');
const field=(v,n)=>typeof v==='string'&&v.trim().length>0&&v.length<=n&&!/[\u0000-\u001f\u007f]/u.test(v);
export function compileV1Read({sourceId,path,text,digest,binary,registry=null,run=spawnSync}){
 if(!field(sourceId,512)||typeof text!=='string'||Buffer.byteLength(text)>256*1024||sha(text)!==digest)throw Error('V1_SOURCE_BYTES_INVALID');
 const lines=text.split(/\r?\n/u).length;
 const legacy=extractAnnotations('rust',text).map(a=>({line:a.line,tag:a.kind,value:a.text}));
 const typed=parseAnnotationV2(text,{path,contentHash:digest,projectId:sourceId,registry});
 const rows=[...new Map([...legacy,...typed.records.map(a=>({line:a.line,tag:a.kind,value:a.value}))].map(a=>[JSON.stringify([a.line,a.tag,a.value]),a])).values()];
 if(rows.length>256||!rows.every(a=>Number.isSafeInteger(a.line)&&a.line>=1&&a.line<=lines&&field(a.tag,64)&&field(a.value,4096)))throw Error('V1_OBSERVATION_INVALID');
 // Definition descriptions are from the same native runtime as the source bindings.
 // The basic orientation tags are useful even when a source has not been annotated.
 const requested=[...new Set(['context','why','invariant',...rows.map(a=>a.tag)])].sort();
 const input=['definitions',...requested.map(tag=>'describe annotation.'+tag),
  ...rows.map(a=>['bind',1,sourceId,digest,a.line,a.tag,a.value].join('\t')),'quit'].join('\n')+'\n';
 const r=run(binary,['serve-v1'],{input,encoding:'utf8',shell:false,windowsHide:true,timeout:10000,maxBuffer:512*1024,env:process.platform==='win32'&&process.env.SystemRoot?{SystemRoot:process.env.SystemRoot}:{}});
 if(r.error||r.status!==0||typeof r.stdout!=='string')throw Error('V1_NATIVE_COMPILE_FAILED');
 const [ready,inventory,...output]=r.stdout.trimEnd().split(/\r?\n/u);
 const count=/^READY generation=1 definitions=(\d+)$/.exec(ready);
 const inv=inventory?.startsWith('OK ')?inventory.slice(3).split('\t'):[];
 const id=/^[a-z][a-z0-9._-]{0,127}$/;
 const ids=inv[2]?.split(',')??[];
 if(!count||inv.length!==3||inv[0]!=='vivim.protocol.definitions/1'||inv[1]!=='1'||ids.length!==Number(count[1])||ids.length>4096||new Set(ids).size!==ids.length||!ids.every(x=>id.test(x))||output.length!==rows.length+requested.length)throw Error('V1_WIRE_INVALID');
 const descriptions=output.splice(0,requested.length).map((s,i)=>{
  const a=s.startsWith('OK ')?s.slice(3).split('\t'):[];
  const definitionId='annotation.'+requested[i],revision=Number(a[3]);
  const deps=a[4]?a[4].split(','):[];
  if(a.length!==6||a[0]!=='vivim.protocol.definition/1'||a[1]!=='1'||a[2]!==definitionId||!ids.includes(definitionId)||!Number.isSafeInteger(revision)||revision<1||!deps.every(d=>ids.includes(d))||!field(a[5],4096))throw Error('V1_WIRE_INVALID');
  return {id:definitionId,revision,dependencies:deps,meaning:a[5]};
 });
 const byTag=new Map(descriptions.map(d=>[d.id.slice('annotation.'.length),d]));
 const language={schema:'vivim.protocol.guidance/1',generation:1,availableTags:ids.filter(x=>x.startsWith('annotation.')).map(x=>x.slice('annotation.'.length)),definitions:descriptions};
 const declarations=output.map((s,i)=>{
  const a=rows[i],f=s.startsWith('OK ')?s.slice(3).split('\t'):[];
  if(f.length!==10||f[0]!==schema||f[1]!=='1'||Number(f[2])!==byTag.get(a.tag)?.revision||f[3]!==sourceId||f[4]!==digest||Number(f[5])!==a.line||f[6]!==a.tag||f[7]!=='unbound'||f[8]!=='source-assertion'||f[9]!==a.value)throw Error('V1_WIRE_INVALID');
  return {definitionRevision:Number(f[2]),line:a.line,tag:a.tag,value:a.value,scope:f[7],assurance:f[8]};
 });
 return {schema,protocolGeneration:1,sourceId,sourceDigest:digest,declarations,language,
  diagnostics:typed.diagnostics.map(d=>({line:d.line,code:d.code,severity:d.severity})),scopeCoverage:'unbound',authority:'read_only_projection'};
}
