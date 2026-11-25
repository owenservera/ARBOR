// Native syntax extraction is opt-in and uses the existing trusted binary directory.
// Source projects never select an executable. HQ retains annotation grammar authority.
import { spawnSync } from 'node:child_process';
import { statSync } from 'node:fs';
import { isAbsolute, join } from 'node:path';
import { parseAnnotationV2, isVersionedId } from './annotation-v2.mjs';
const digest=v=>typeof v==='string'&&/^[a-f0-9]{64}$/.test(v);
const name=(v,max)=>typeof v==='string'&&v.length>0&&v.length<=max&&!/[\u0000-\u001f\u007f]/.test(v);
const kinds=new Set(['function','struct','enum','union','type','constant','static','module','trait','trait-method','method']);
export function configuredRustSyntax(env=process.env){
  if(env.VIVIM_HQKG_RUST_SYNTAX!=='1')return null;
  if(!env.VIVIM_HQKG_BIN_DIR||!isAbsolute(env.VIVIM_HQKG_BIN_DIR))throw Error('rust_syntax_absolute_bin_dir_required');
  const binary=join(env.VIVIM_HQKG_BIN_DIR,process.platform==='win32'?'hqkg-rust-syntax.exe':'hqkg-rust-syntax');
  if(!statSync(binary,{throwIfNoEntry:false})?.isFile())throw Error('rust_syntax_binary_unavailable');
  return binary;
}
export function extractRustSyntax(binary,text,context){
  const run=spawnSync(binary,[],{input:text,encoding:'utf8',shell:false,windowsHide:true,timeout:15000,maxBuffer:16*1024*1024});
  if(run.error||run.status!==0)throw Error('rust_syntax_extraction_failed: '+String(run.stderr??run.error??'').trim().slice(0,400));
  const raw=JSON.parse(run.stdout);
  if(raw.schema!=='hqkg.rust-syntax/1'||raw.assurance!=='syntax-only'||raw.sourceDigest!==context.contentHash
    ||!Array.isArray(raw.items)||raw.items.length>8192)throw Error('rust_syntax_source_binding_invalid');
  const lines=text.split(/\r?\n/), symbols=[],annotations=[];
  for(const item of raw.items){
    if(!name(item.name,180)||!name(item.qualifiedName,512)||!kinds.has(item.kind)
      ||!(item.qualifiedName===item.name||item.qualifiedName.endsWith('::'+item.name))
      ||!Number.isSafeInteger(item.line)||!Number.isSafeInteger(item.endLine)
      ||item.line<1||item.endLine<item.line||item.endLine>lines.length||typeof item.exported!=='boolean'
      ||!digest(item.syntaxDigest)||!digest(item.signatureDigest)||!Array.isArray(item.docs))
      throw Error('rust_syntax_invalid_item');
    symbols.push({name:item.name,kind:item.kind,line:item.line,end_line:item.endLine,exported:item.exported,
      qualifiedName:item.qualifiedName,syntaxDigest:item.syntaxDigest,signatureDigest:item.signatureDigest});
    const seen=new Set();
    for(const doc of item.docs){
      if(!Number.isSafeInteger(doc.line)||doc.line<1||doc.line>item.line||seen.has(doc.line)
        ||typeof doc.comment!=='string'||lines[doc.line-1]?.trimStart()!=='///'+doc.comment
        ||doc.comment.startsWith('/'))throw Error('rust_syntax_doc_binding_invalid');
      seen.add(doc.line);
      for(const record of parseAnnotationV2('//'+doc.comment,context).records){
        annotations.push({line:doc.line,kind:'v2:'+record.kind,text:record.value,
          ref:isVersionedId(record.value)?record.value:null,
          symbolQualifiedName:item.qualifiedName,symbolKind:item.kind});
      }
    }
  }
  return {symbols,annotations};
}
