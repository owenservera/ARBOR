#!/usr/bin/env node
// Publish sanitized *future* journal status transitions, never prompts or replies.
// No browser access; no modifications to harness journal or approvals.
import { readFile, readdir, mkdir, writeFile, rename } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { publishFeedEvent } from '../src/share/feed-publisher.mjs';
const root=fileURLToPath(new URL('../../runtime/', import.meta.url));
const dir=join(root,'journal');
const stateFile=join(root,'shares','feed-cursor.json');
const statuses=new Map([['accepted','request.created'],['approved','request.approved'],['complete','request.completed'],['blocked','request.blocked']]);
const safe=/^[a-z0-9_-]{1,32}$/;
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const flags=new Set(process.argv.slice(2));
if(flags.has('--help')){console.log('Usage: node harness/bin/share-feed.mjs --watch | --once  (requires VIVIM_SHARE_FEED_URL and VIVIM_FEED_PUBLISH_TOKEN; initial run baselines without publishing historic data)');process.exit(0)}
if(!flags.has('--once')&&!flags.has('--watch')) throw Error('Use --once or --watch');
if(!process.env.VIVIM_SHARE_FEED_URL||!process.env.VIVIM_FEED_PUBLISH_TOKEN) throw Error('Feed URL and publish token required');
let known={};
try{known=JSON.parse(await readFile(stateFile,'utf8'));}catch(e){if(e.code!=='ENOENT')throw e}
async function scan(){
  const files=await readdir(dir).catch(e=>e.code==='ENOENT'?[]:Promise.reject(e));
  const current={};
  for(const file of files){
    if(!/^[A-Za-z0-9_-]{1,128}\.json$/.test(file)) continue;
    try {
      const rec=JSON.parse(await readFile(join(dir,file),'utf8'));
      const status=String(rec.state??'').toLowerCase();
      const type=statuses.get(status);
      if(!type)continue;
      const marker=[status,String(rec.updatedAt??'')].join(':');
      current[file]=marker;
      if(Object.hasOwn(known,file) && known[file]!==marker){
        const event={type,at:new Date().toISOString()};
        if(typeof rec.provider==='string'&&safe.test(rec.provider))event.provider=rec.provider;
        event.status=status;
        await publishFeedEvent(event);
        console.log('published',type,event.provider??'');
      }
    }catch(e){console.error('Skipped record',file,e.message)}
  }
  await mkdir(resolve(root,'shares'),{recursive:true});
  const tmp=stateFile+'.tmp';
  await writeFile(tmp,JSON.stringify(current,null,2),{mode:0o600});
  await rename(tmp,stateFile);
  known=current;
}
await scan();
if(flags.has('--watch')) for(;;){await pause(15000);await scan()}
