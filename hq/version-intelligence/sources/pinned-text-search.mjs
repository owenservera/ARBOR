// Bounded, deterministic literal search of an already-authorized committed-file batch.
// This is not a filesystem reader, command executor or authority.
import { TextDecoder } from 'node:util';
import { checkCancel, fail } from './common.mjs';

export function validatePinnedTextQuery(query) {
  if (!query || Object.getPrototypeOf(query)!==Object.prototype ||
      Object.keys(query).some(k=>!['literal','limit'].includes(k)) ||
      typeof query.literal!=='string' || query.literal.length<1 || query.literal.length>160 ||
      /[\x00-\x1f\x7f]/.test(query.literal) ||
      (query.limit!==undefined&&(!Number.isSafeInteger(query.limit)||query.limit<1||query.limit>100)))
    fail('RESOURCE_LIMIT','invalid_literal_search');
  return {literal:query.literal,limit:query.limit??50};
}

export function searchPinnedText(batch, query, {signal}={}) {
  const {literal,limit}=validatePinnedTextQuery(query);
  checkCancel(signal);
  if (batch?.schema!=='arbor.hvi.pinned-blob-batch/1'||!Array.isArray(batch.files)||
      batch.files.length<1||batch.files.length>16||
      batch.files.some(f=>!Buffer.isBuffer(f.bytes)||f.bytes.length>65536)||
      batch.files.reduce((n,f)=>n+f.bytes.length,0)>262144)
    fail('RESOURCE_LIMIT','invalid_search_batch');
  const decoder=new TextDecoder('utf-8',{fatal:true});
  const matches=[],skipped=[];
  let truncated=false;
  for(const file of batch.files) {
    checkCancel(signal);
    let text;
    try {text=decoder.decode(file.bytes);}catch{skipped.push({path:file.path,reason:'not-utf8'});continue;}
    if(text.includes('\0')){skipped.push({path:file.path,reason:'binary'});continue;}
    const lines=text.split(/\r\n|\n|\r/);
    for(let i=0;i<lines.length;i++){
      checkCancel(signal);
      const column=lines[i].indexOf(literal);
      if(column<0)continue;
      if(matches.length===limit){truncated=true;break;}
      matches.push({path:file.path,blobSha:file.blobSha,line:i+1,columnUtf16:column+1});
    }
    if(truncated)break;
  }
  checkCancel(signal);
  return {schema:'arbor.hvi.pinned-text-search/1',pinId:batch.pinId,
    repoIdentity:batch.repoIdentity,resolvedCommitSha:batch.resolvedCommitSha,
    manifestDigest:batch.manifestDigest,matchMode:'case-sensitive-literal-first-per-line',
    matches,skipped,truncated};
}
