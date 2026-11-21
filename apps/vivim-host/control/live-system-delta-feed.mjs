// Bounded, in-memory cursor transport for the existing Rust live-system projection.
// Not a second canonical state, grant engine, journal or retained private archive.
// Only routes guarded by the Host's EXISTING desktop owner capability may read it.
const SOURCE_SCHEMA='vivim.host-live-system/1';
const FEED_SCHEMA='vivim.host-live-system-changes/1';
const ALLOWED=new Set(['host.health','wiki.summary','pwa.input','pwa.view','phone.composer']);
const err=(code,status=409)=>Object.assign(Error(code),{code,status});
const bounded=n=>Number.isSafeInteger(n)&&n>=0;
const id=s=>typeof s==='string'&&/^[a-zA-Z0-9._:-]{1,128}$/.test(s);
const maxEvents=128;
export function createLiveSystemDeltaFeed({maxWaiters=16}={}){
  if(!Number.isSafeInteger(maxWaiters)||maxWaiters<1||maxWaiters>128)
    throw err('LIVE_FEED_DEPENDENCY',400);
  let latest=null, events=[], droppedUntil=0;
  const waiters=new Set();
  const check=s=>{
    if(s?.schema!==SOURCE_SCHEMA||s?.state!=='source-backed'||
       s.authority!=='read-only-projection'||s.executionAuthorized!==false||
       s.effectPerformed!==false||!id(s.epoch)||!bounded(s.revision)||
       !Array.isArray(s.regions)||s.regions.length>ALLOWED.size||
       s.regions.some(r=>!ALLOWED.has(r?.id)||r.exposure!=='owner'||
         !bounded(r.viewRevision)||!bounded(r.sourceRevision)||
         typeof r.digest!=='string'||!/^[a-f0-9]{64}$/.test(r.digest)))
      throw err('LIVE_FEED_UNTRUSTED_PROJECTION',503);
  };
  function publish(snapshot){
    check(snapshot);
    if(latest&&snapshot.epoch!==latest.epoch){
      // Restart/epoch transition: a pending cursor is invalid, not resumable.
      events=[];droppedUntil=0;
    }else if(latest&&snapshot.revision<latest.revision){
      throw err('LIVE_FEED_STALE_SOURCE');
    }else if(latest&&snapshot.revision===latest.revision){
      const prior=JSON.stringify(latest.regions);
      if(JSON.stringify(snapshot.regions)!==prior)
        throw err('LIVE_FEED_SAME_REVISION_CONFLICT');
      return false;
    }
    const prior=latest?.epoch===snapshot.epoch
      ? new Map(latest.regions.map(r=>[r.id,r])):new Map();
    const next=[];
    for(const region of snapshot.regions){
      const older=prior.get(region.id);
      if(!older||older.digest!==region.digest||
         older.viewRevision!==region.viewRevision||
         older.sourceRevision!==region.sourceRevision||
         older.freshness!==region.freshness){
        next.push({sequence:snapshot.revision,regionId:region.id,
          viewRevision:region.viewRevision,sourceRevision:region.sourceRevision,
          region});
      }
    }
    // Missing event coverage cannot silently present a complete delta.
    if(latest&&latest.epoch===snapshot.epoch&&next.length===0)
      throw err('LIVE_FEED_REVISION_WITHOUT_REGION');
    latest=snapshot;
    events.push(...next);
    while(events.length>maxEvents){
      const old=events.shift();
      droppedUntil=Math.max(droppedUntil,old.sequence);
    }
    for(const finish of [...waiters])finish();
    return true;
  }
  function result({epoch=null,after=null}={}){
    if(!latest)throw err('LIVE_FEED_NOT_READY',503);
    const common={schema:FEED_SCHEMA,epoch:latest.epoch,sequence:latest.revision};
    if(epoch===null||after===null)return {...common,state:'snapshot',regions:latest.regions,
      coverage:latest.coverage,authority:'read-only-projection'};
    if(!id(epoch)||!bounded(after))throw err('LIVE_FEED_CURSOR_INVALID',400);
    if(epoch!==latest.epoch||after>latest.revision)return {...common,state:'reset',
      regions:latest.regions,coverage:latest.coverage};
    if(after<droppedUntil)return {...common,state:'gap',regions:latest.regions,
      coverage:latest.coverage};
    const changes=events.filter(e=>e.sequence>after);
    if(changes.length)return {...common,state:'delta',events:changes};
    if(after!==latest.revision)return {...common,state:'reset',regions:latest.regions,
      coverage:latest.coverage};
    return {...common,state:'idle',events:[]};
  }
  async function changes({epoch=null,after=null,waitMs=0}={}){
    if(!Number.isSafeInteger(waitMs)||waitMs<0||waitMs>15000)
      throw err('LIVE_FEED_WAIT_INVALID',400);
    const first=result({epoch,after});
    if(first.state!=='idle'||waitMs===0)return first;
    if(waiters.size>=maxWaiters)throw err('LIVE_FEED_BUSY',429);
    return new Promise(resolve=>{
      const finish=()=>{
        if(!waiters.has(finish))return;
        clearTimeout(timer);waiters.delete(finish);
        resolve(result({epoch,after}));
      };
      const timer=setTimeout(finish,waitMs);
      timer.unref?.();
      waiters.add(finish);
    });
  }
  function dispose(){
    for(const finish of [...waiters])finish();
    waiters.clear();
  }
  return Object.freeze({publish,changes,dispose});
}
