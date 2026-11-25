// @hq:context Compile coding guidance as part of the existing authorized file read.
// @hq:invariant Never interpret an arbitrary source comment as a trusted instruction.
import {readFileSync,realpathSync,lstatSync} from 'node:fs';
import {isAbsolute,resolve,relative,sep,basename} from 'node:path';
import {createHash} from 'node:crypto';
import {compileV1Read} from '../../../hq/lib/meta-vlang-v1.mjs';
const hash=b=>createHash('sha256').update(b).digest('hex');
const sha=s=>typeof s==='string'&&/^[a-f0-9]{64}$/.test(s);
const schema='vivim.coding-context/1';
const inside=(root,file)=>{const r=relative(root,file);return r!==''&&r!=='..'&&!r.startsWith('..'+sep)&&!isAbsolute(r);};
function pinned(file,digest,max){
 if(typeof file!=='string'||!isAbsolute(file)||!sha(digest))throw Error('BINDING_INVALID');
 const canonical=realpathSync(file),stat=lstatSync(canonical);
 if(!stat.isFile()||stat.size<1||stat.size>max||hash(readFileSync(canonical))!==digest)throw Error('BINDING_INVALID');
 return canonical;
}
// Configuration is local, exact-hash admitted, and independent of the file being read.
// This phase adds no effect permission or new source authority.
export function createCodingContext({env=process.env,compile=compileV1Read}={}){
 return (root,path,result)=>{
  if(!env.VIVIM_META_VLANG_CONFIG)return null;
  if(typeof path!=='string'||!path.toLowerCase().endsWith('.rs'))return null;
  try{
   const binding=pinned(env.VIVIM_META_VLANG_CONFIG,env.VIVIM_META_VLANG_CONFIG_SHA256,32768);
   const config=JSON.parse(readFileSync(binding,'utf8'));
   if(config.schema!=='vivim.coding-context-binding/1'||!Array.isArray(config.projects)||config.projects.length<1||config.projects.length>4||!sha(config.sdkSha256)||!/^([a-f0-9]{40})$/.test(config.sdkSource))throw Error();
   const file=realpathSync(resolve(root,path));
   const eligible=config.projects.filter(p=>typeof p.root==='string'&&isAbsolute(p.root)&&inside(realpathSync(p.root),file));
   if(eligible.length!==1)return null;
   const project=eligible[0],projectRoot=realpathSync(project.root);
   if(!/^[a-z][a-z0-9-]{0,63}$/.test(project.id)||!Array.isArray(project.instructions)||project.instructions.length<1||project.instructions.length>12||project.instructions.some(x=>typeof x!=='string'||!x.trim()||x.length>350||/[\u0000-\u001f\u007f]/u.test(x)))throw Error();
   const sourcePath=relative(projectRoot,file).split(sep).join('/');
   if(!sha(result.digest)||typeof result.text!=='string'||hash(result.text)!==result.digest)throw Error();
   const binary=pinned(config.sdkPath,config.sdkSha256,64*1024*1024);
   if(!/^vivim-protocol(?:\.exe)?$/i.test(basename(binary)))throw Error();
   const rules={authority:'locally-pinned-project-policy',revision:hash(JSON.stringify({id:project.id,instructions:project.instructions})),instructions:project.instructions};
   const base={schema,sourcePath,sourceDigest:result.digest,project:project.id,policy:rules,sdkSource:config.sdkSource,sdkDigest:config.sdkSha256};
   try{
    const semantic=compile({sourceId:project.id+':'+sourcePath,path:sourcePath,text:result.text,digest:result.digest,binary});
    // Preserve the native file-read size bound: larger context is explicitly unavailable.
    if(Buffer.byteLength(JSON.stringify(semantic))>8192)return {...base,status:'semantic_over_budget',semantic:null};
    return {...base,status:'compiled',semantic};
   }catch{return {...base,status:'semantic_unavailable',semantic:null};}
  }catch{return {schema,status:'binding_unavailable',sourceDigest:result.digest};}
 };
}
