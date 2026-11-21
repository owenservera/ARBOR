/**
 * One owner-capability read of Rust LiveSystemState or its bounded change cursor.
 * Transport and credentials are injected by the existing Host owner client.
 * A gap, epoch reset or refusal can NEVER be treated as a successful delta.
 */
export type ChangeCursor=Readonly<{epoch:string;sequence:number}>;
export type LiveSystemChangeResult=Readonly<{
  schema:'vivim.host-live-system-changes/1';
  state:'snapshot'|'reset'|'gap'|'delta'|'idle';
  cursor:ChangeCursor;
  regions?:ReadonlyArray<unknown>;
  events?:ReadonlyArray<unknown>;
  needsReconciliation:boolean;
}>;
export type AuthorizedHostFetch=(path:string,init:RequestInit)=>Promise<Response>;
const id=(v:unknown):v is string=>
  typeof v==='string'&&/^[a-zA-Z0-9._:-]{1,128}$/.test(v);
const integer=(v:unknown):v is number=>Number.isSafeInteger(v)&&Number(v)>=0;
export async function readOwnerLiveSystemChanges(
  ownerFetch:AuthorizedHostFetch,cursor:ChangeCursor|null=null,waitMs=15000
):Promise<LiveSystemChangeResult>{
  if(typeof ownerFetch!=='function'||!Number.isSafeInteger(waitMs)||
     waitMs<0||waitMs>15000||
     (cursor!==null&&(!id(cursor.epoch)||!integer(cursor.sequence))))
    throw Error('LIVE_CHANGES_BAD_CURSOR');
  const params=new URLSearchParams();
  if(cursor){params.set('epoch',cursor.epoch);params.set('after',String(cursor.sequence));}
  params.set('wait',String(cursor?waitMs:0));
  const response=await ownerFetch('/api/host/live-system/changes?'+params.toString(),{
    method:'GET',cache:'no-store',credentials:'same-origin'
  });
  if(!response.ok)throw Error('LIVE_CHANGES_HOST_UNAVAILABLE');
  const payload=await response.json();
  if(payload?.schema!=='vivim.host-live-system-changes/1'||
     !['snapshot','reset','gap','delta','idle'].includes(payload.state)||
     !id(payload.epoch)||!integer(payload.sequence)||
     (['snapshot','reset','gap'].includes(payload.state)&&!Array.isArray(payload.regions))||
     (['delta','idle'].includes(payload.state)&&!Array.isArray(payload.events)))
    throw Error('LIVE_CHANGES_HOST_INVALID');
  if(cursor&&payload.epoch===cursor.epoch&&
     payload.sequence<cursor.sequence)throw Error('LIVE_CHANGES_REVISION_REGRESSION');
  if(cursor&&payload.state==='delta'&&
     (payload.sequence<=cursor.sequence||
      payload.events.some((e:any)=>!integer(e?.sequence)||
        e.sequence<=cursor.sequence||e.sequence>payload.sequence)))
    throw Error('LIVE_CHANGES_DELTA_INVALID');
  if(cursor&&payload.state==='idle'&&
     (payload.epoch!==cursor.epoch||payload.sequence!==cursor.sequence||
      payload.events.length!==0))throw Error('LIVE_CHANGES_IDLE_INVALID');
  return {
    schema:'vivim.host-live-system-changes/1',state:payload.state,
    cursor:{epoch:payload.epoch,sequence:payload.sequence},
    ...(Array.isArray(payload.regions)?{regions:payload.regions}:{}),
    ...(Array.isArray(payload.events)?{events:payload.events}:{}),
    needsReconciliation:['snapshot','reset','gap'].includes(payload.state)
  };
}
