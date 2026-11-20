// Request-scoped desktop owner boundary over the existing HQ and HVI engines.
// No Git executable, network client, implicit source grant or additional project registry.
import {createHash} from 'node:crypto';
import {isAbsolute} from 'node:path';
import {createLiveSourceSurface} from './live-source-surface.mjs';
import {createHviHostReadPort} from './hvi-capability.mjs';
import {createHviSourceGrantStore} from './hvi-source-grant.mjs';
import {canonicalRepo} from '../../../hq/version-intelligence/sources/common.mjs';
const fail=(code,status=400)=>{throw Object.assign(Error(code),{code,status})};
const plain=v=>v&&typeof v==='object'&&!Array.isArray(v)&&Object.getPrototypeOf(v)===Object.prototype;
const keys=(v,allowed)=>plain(v)&&Object.keys(v).every(k=>allowed.includes(k));
const hash=s=>createHash('sha256').update(s,'utf8').digest('hex');
const unavailable=code=>({state:'unavailable',code});
export function createDevelopmentReadPort({config={},runtime,actorId='desktop-owner',sessionId,stillOwner,
  createSurface=createLiveSourceSurface,createGrantStore=createHviSourceGrantStore,createHviPort=createHviHostReadPort}={}){
  if(typeof stillOwner!=='function'||typeof sessionId!=='string'||!sessionId||actorId!=='desktop-owner')fail('OWNER_AUTH',401);
  const authorize=()=>{if(stillOwner()!==true)fail('OWNER_AUTH',401);};
  const roots=Array.isArray(config.approvedRoots)?config.approvedRoots.filter(r=>typeof r==='string'&&isAbsolute(r)):[];
  const rootChoices=[...new Set(roots)].map(path=>({key:hash(path),path}));
  const repos=[...new Set((Array.isArray(config.hviRepositories)?config.hviRepositories:[]).map(r=>canonicalRepo(r)))];
  const adapter=config.hviAdapter;
  const hviReady=adapter?.authorizedDevelopmentSource===true&&['resolveRef','readCommit','listTree','readBlob'].every(k=>typeof adapter[k]==='function')&&repos.length>0;
  const grants=()=>runtime?.ledger?createGrantStore({ledger:runtime.ledger}):null;
  async function surface(operation){
    authorize();if(!roots.length)fail('HQ_SOURCE_ROOTS_NOT_CONFIGURED',503);
    const port=await createSurface({approvedRoots:roots,dataDir:config.dataDir,actorId,sessionId,
      authorize:q=>q.actorId===actorId&&q.sessionId===sessionId&&q.domain==='development'&&
        ['source.read','source.status',...(operation==='register'?['source.register']:operation==='index'?['source.index']:[])].includes(q.operation)&&stillOwner()===true});
    authorize();return port;
  }
  async function status(){
    authorize();let hq=unavailable('HQ_SOURCE_ROOTS_NOT_CONFIGURED');
    if(roots.length){try{hq={state:'source-backed',...await (await surface('status')).status()};}catch(e){if(e?.code==='OWNER_AUTH')throw e;hq=unavailable('HQ_STATUS_UNAVAILABLE');}}
    const grant=grants()?.status()??unavailable('HVI_LEDGER_UNAVAILABLE');authorize();
    return {schema:'vivim.development-read-port/1',hq,approvedRoots:rootChoices,
      hvi:{adapterReady:hviReady,approvedRepositories:repos,grant,executionPerformed:false}};
  }
  async function register(input){
    authorize();if(!keys(input,['name','rootKey'])||typeof input.name!=='string'||!/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(input.name)||typeof input.rootKey!=='string')fail('HQ_REGISTER_INVALID');
    const root=rootChoices.find(r=>r.key===input.rootKey);if(!root)fail('HQ_SOURCE_NOT_APPROVED',403);
    const p=await surface('register');authorize();const record=await p.register({name:input.name,path:root.path});authorize();
    return {schema:'vivim.development-registration/1',state:'registered',name:record.name,sourceId:record.sourceId,indexed:false};
  }
  async function refresh(input){
    if(!keys(input,[]))fail('HQ_INDEX_INVALID');const p=await surface('index');authorize();const out=await p.refresh();authorize();return out;
  }
  async function graph(input){
    authorize();
    if(!keys(input,['operation','key','depth'])||!['sources','symbols','impact','compute'].includes(input.operation)
       ||typeof input.key!=='string'||input.key.length<1||input.key.length>180
       ||/[\\u0000-\\u001f\\u007f]/.test(input.key)
       ||(input.depth!==undefined&&(!Number.isSafeInteger(input.depth)||input.depth<0||input.depth>8)))
      fail('HQ_GRAPH_QUERY_INVALID');
    const p=await surface('status');authorize();
    const value=await p.graph(input);
    authorize();return value;
  }
  function issueGrant(input){
    authorize();if(!keys(input,['repoIdentities','expiresInMs'])||!Array.isArray(input.repoIdentities)||!input.repoIdentities.length||input.repoIdentities.length>16)fail('HVI_GRANT_INVALID');
    const requested=input.repoIdentities.map(r=>canonicalRepo(r));
    if(requested.some(r=>!repos.includes(r)))fail('HVI_SOURCE_NOT_CONFIGURED',403);
    const store=grants();if(!store)fail('HVI_LEDGER_UNAVAILABLE',503);
    return store.issue({actorId,repoIdentities:requested,expiresInMs:input.expiresInMs});
  }
  function revokeGrant(input){
    authorize();if(!keys(input,[]))fail('HVI_GRANT_INVALID');const store=grants();if(!store)fail('HVI_LEDGER_UNAVAILABLE',503);return store.revoke({actorId});
  }
  async function compare(selection){
    authorize();
    if(!hviReady)fail('HVI_SOURCE_ADAPTER_UNAVAILABLE',503);
    if(typeof selection!=='string'||Buffer.byteLength(selection,'utf8')>8000)fail('HVI_SELECTION_INVALID');
    let input;try{input=JSON.parse(selection)}catch{fail('HVI_SELECTION_INVALID')}
    if(!keys(input,['schema','sources','targetIndex','scope','budgets','pairwise','includeParity','reportOptions'])||
      input.schema!=='vivim.host.hvi-source-request/1'||!Array.isArray(input.sources)||input.sources.length<2||input.sources.length>16)fail('HVI_SELECTION_INVALID');
    const store=grants();const grant=store?.status();
    if(!grant?.granted||grant.expired||grant.revoked||!grant.id)fail('HVI_SOURCE_GRANT_REQUIRED',403);
    // Never accept a caller-selected grant. Every read is pinned to the exact live grant
    // identified at admission, including final projection and owner session rechecks.
    const sources=input.sources.map(s=>{
      if(!keys(s,['repo','ref','sha','subPath'])||typeof s.repo!=='string')fail('HVI_SELECTION_INVALID');
      const repo=canonicalRepo(s.repo);if(!repos.includes(repo)||!grant.repoIdentities.includes(repo))fail('HVI_SOURCE_NOT_GRANTED',403);
      return {...s,repo,sourceGrantRef:grant.id};
    });
    const verifyGrant=ctx=>{if(stillOwner()!==true||ctx.sourceGrantRef!==grant.id)return false;
      const v=store.verify({repoIdentity:ctx.repoIdentity});return v.ok===true&&v.grant.id===grant.id;};
    const port=createHviPort({actorId,sessionId,verifySession:()=>stillOwner()===true,verifyGrant,
      approvedRepositories:repos,enabled:true});
    const result=await port.invoke({...input,sources},{adapter});
    authorize();
    if(sources.some(s=>!verifyGrant({sourceGrantRef:grant.id,repoIdentity:s.repo})))fail('HVI_SOURCE_GRANT_STALE',403);
    return result;
  }
  return Object.freeze({status,graph,register,refresh,issueGrant,revokeGrant,compare});
}
