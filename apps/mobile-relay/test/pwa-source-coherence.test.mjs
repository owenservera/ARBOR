// Lane D: execute the actual PWA readback functions against grant-scoped
// Host responses. No second renderer, fake grant authority or persistent store.
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {sha256Hex} from '../generative-ui/portable-digest.mjs';

const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
function functionSource(name){
  const needle='function '+name+'(',at=app.indexOf(needle);
  assert.notEqual(at,-1,name+' exists in PWA source');
  const start=app.slice(at-6,at)==='async '?at-6:at;
  let depth=0;
  for(let i=app.indexOf('{',at);i<app.length;i++){
    if(app[i]==='{')depth++;
    else if(app[i]==='}'&&--depth===0)return app.slice(start,i+1);
  }
  throw Error('Unbalanced PWA '+name);
}
function install(env, names){
  vm.createContext(env);
  for(const name of names)vm.runInContext(functionSource(name),env);
  return env;
}

test('TierFlow Build shares exact Wiki source admission and rejects same-revision drift',async()=>{
  let grant='grant-a',wiki={revision:4,pages:{Main:{sections:{Info:'Committed A'}}}};
  const painted=[];
  const surface={revision:7,surfaceId:'my-space'};
  const env=install({
    HOST_PREVIEW:false,S:{tab:'build',paired:true,statusObj:{},device:{scopes:['control:read']}},
    buildBindingSequence:0,buildWikiSourceScope:null,buildWikiSourceFence:null,
    transport:{direct:true,deviceHeaders:()=>({
      'x-vivim-device-session':'device-session','x-vivim-grant-id':grant
    })},
    navigator:{onLine:true},hasWorkspaceBinding:()=>true,
    build:{surface:()=>surface,setBindingScope:()=>true,clearBindingScope(){},
      setLiveData(data,revision){painted.push({data,revision});return true}},
    workspaceBindingData:({wiki})=>({wikiRevision:wiki?.revision??null}),
    sha256Hex,rustWikiSourceStamp:null,rustUiEngineStatus:null,rustWikiSourceTransition:null,
    AbortSignal:{timeout:()=>({})},
    fetch:async()=>({ok:true,json:async()=>wiki})
  },['validWikiSourceShape','wikiSourceStampFallback','verifyWikiSourceStamp','refreshBuildBindings']);
  await env.refreshBuildBindings({});
  assert.equal(painted.at(-1).data.wikiRevision,4);
  assert.equal(env.buildWikiSourceFence.stamp.revision,4);
  wiki={revision:4,pages:{Main:{sections:{Info:'Tampered without revision bump'}}}};
  await env.refreshBuildBindings({});
  assert.equal(painted.at(-1).data,null,'same revision with new pages must blank the Build rows');
  assert.equal(env.buildWikiSourceFence.stamp.revision,4,'a refused repaint keeps the high-water mark');
  wiki={revision:5,pages:{Main:{sections:{Info:'Committed next'}}}};
  await env.refreshBuildBindings({});
  assert.equal(painted.at(-1).data.wikiRevision,5);
  grant='grant-b';wiki={revision:1,pages:{Main:{sections:{Info:'Other grant'}}}};
  await env.refreshBuildBindings({});
  assert.equal(painted.at(-1).data.wikiRevision,1,'new authenticated grant has independent source history');
  assert.equal(env.buildWikiSourceFence.stamp.revision,1);
  assert.ok(!JSON.stringify(env.buildWikiSourceFence).includes(grant),
    'source watermark must not retain raw grant credentials');
  wiki={revision:2,pages:{Main:{sections:{Info:{malformed:'not a string'}}}}};
  await env.refreshBuildBindings({});
  assert.equal(painted.at(-1).data,null,'malformed Wiki pages must not mix with valid Studio rows');
  assert.equal(env.buildWikiSourceFence.stamp.revision,1);
  wiki={revision:2,pages:{Main:{sections:{Info:'Valid next revision'}}}};
  await env.refreshBuildBindings({});
  assert.equal(painted.at(-1).data.wikiRevision,2);
});

test('Build source admission does not advance when TierFlow refuses to repaint',async()=>{
  let wiki={revision:9,pages:{Main:{sections:{Info:'Verified'}}}},allowPaint=false;
  const env=install({
    HOST_PREVIEW:false,S:{tab:'build',paired:true,statusObj:{},device:{scopes:['control:read']}},
    buildBindingSequence:0,buildWikiSourceScope:null,buildWikiSourceFence:null,
    transport:{direct:true,deviceHeaders:()=>({'x-vivim-device-session':'s','x-vivim-grant-id':'g'})},
    navigator:{onLine:true},hasWorkspaceBinding:()=>true,
    build:{surface:()=>({revision:3,surfaceId:'my-space'}),setBindingScope:()=>true,
      setLiveData:()=>allowPaint,clearBindingScope(){}},
    workspaceBindingData:({wiki})=>({revision:wiki?.revision}),
    sha256Hex,rustWikiSourceStamp:null,rustUiEngineStatus:null,rustWikiSourceTransition:null,
    AbortSignal:{timeout:()=>({})},
    fetch:async()=>({ok:true,json:async()=>wiki})
  },['validWikiSourceShape','wikiSourceStampFallback','verifyWikiSourceStamp','refreshBuildBindings']);
  await env.refreshBuildBindings({});
  assert.equal(env.buildWikiSourceFence,null,'failed paint must not advance source watermark');
  allowPaint=true;await env.refreshBuildBindings({});
  assert.equal(env.buildWikiSourceFence.stamp.revision,9);
});

test('stale Build status cannot repaint a new grant or clear its newer surface',async()=>{
  let grant='grant-a';const pending=[],painted=[],cleared=[];
  const env=install({
    buildTimer:0,buildPollSequence:0,buildKey:'',
    HOST_PREVIEW:false,
    S:{tab:'build',paired:true,statusObj:null,statusAt:0},
    transport:{direct:true,deviceHeaders:()=>({
      'x-vivim-device-session':'session-1','x-vivim-grant-id':grant
    })},
    api:()=>new Promise(resolve=>pending.push(resolve)),
    build:{setSurface:(revision)=>{painted.push(revision.revision);return {state:'ready'};},
      setVisualSourceScope:()=>true,
      clear(){cleared.push('surface')},clearVisualSourceScope(){cleared.push('bindings','surface')}},
    shellPresentation:{observe(){},clear(){cleared.push('shell')}},
    refreshBuildBindings(){},scheduleBuild(){}
  },['pollBuild']);
  const first=env.pollBuild();
  grant='grant-b';
  const second=env.pollBuild();
  pending[1]({snapshot:{bootstrap:{uiRevision:{revision:9,surfaceId:'my-space'}}}});
  await second;
  assert.deepEqual(painted,[9]);
  pending[0]({snapshot:{bootstrap:{uiRevision:{revision:1,surfaceId:'other'}}}});
  await first;
  assert.deepEqual(painted,[9],'old grant cannot repaint current Build revision');
  assert.deepEqual(cleared,[],'old generation cannot erase the new grant surface');
  const third=env.pollBuild();
  grant='grant-c';
  pending[2]({snapshot:{bootstrap:{uiRevision:{revision:2,surfaceId:'older'}}}});
  await third;
  assert.deepEqual(painted,[9]);
  assert.deepEqual(cleared,['bindings','surface','shell'],
    'uncontested stale read must redact source instead of repainting');
});


test('general PWA status/command refresh cannot promote an old grant response',async()=>{
  let grant='grant-a';const pending={},actions=[];
  const env=install({
    HOST_PREVIEW:false,phoneRefreshEpoch:0,S:{paired:true,busy:false,statusAt:0,
      statusObj:null,cmds:[],tab:'today',timer:0},N:{target:'vivim'},
    transport:{direct:true,deviceHeaders:()=>({
      'x-vivim-device-session':'session','x-vivim-grant-id':grant
    })},
    api:op=>new Promise(resolve=>{pending[op]=resolve}),
    clearTimeout(){},shellPresentation:{clear:()=>actions.push('shell-cleared')},
    clearPrivatePhoneState(){env.phoneRefreshEpoch++;env.S.paired=false;
      env.S.busy=false;env.S.statusObj=null;actions.push('old-source-redacted')},
    build:{setVisualSourceScope:()=>true,clearBindingScope(){},clear(){}},
    window:{dispatchEvent:()=>actions.push('bootstrap')},
    mergeServerConvs(){actions.push('merged')},ensureActive(){},setConn(){},
    renderAll(){actions.push('render')},refreshWiki(){},schedule(){actions.push('scheduled')}
  },['refresh']);
  const old=env.refresh();
  grant='grant-b';
  pending.commands({commands:[{id:'old-private-command'}]});
  pending.status({snapshot:{manifest:{source:'grant-a'}}});
  await old;
  assert.equal(env.S.statusObj,null,'old status must not overwrite a new device scope');
  assert.deepEqual(env.S.cmds,[],'old commands must not be shown');
  assert.deepEqual(actions,['old-source-redacted']);
  assert.equal(env.S.busy,false);
});

test('active device-grant switch on startup redacts previous phone projections before session render',async()=>{
  let grant='grant-b';const calls=[];
  const oldScope=sha256Hex(JSON.stringify(['phone-source','session','grant-a']));
  const slots=new Map();
  const dom=id=>{if(!slots.has(id))slots.set(id,{hidden:false});return slots.get(id)};
  const env=install({
    HOST_PREVIEW:false,activePhoneSourceScope:oldScope,phoneRefreshEpoch:0,
    S:{paired:true,device:{},statusObj:{private:'old'},busy:false,timer:0},
    transport:{direct:true,deviceHeaders:()=>({
      'x-vivim-device-session':'session','x-vivim-grant-id':grant
    })},
    navigator:{onLine:true},location:{hash:''},parsePairFragment:()=>({type:'none'}),
    $:dom,resumeDeviceSession:async()=>({status:'active',scopes:['control:read']}),
    clearPrivatePhoneState(){calls.push('redact');env.S.statusObj=null;env.S.paired=false;
      env.phoneRefreshEpoch++},
    api:async()=>({paired:true}),document:{body:{classList:{toggle(){},remove(){}}}},
    sha256Hex,approvalPoll:null,clearTimeout(){},setConn(){},
    renderAll(){calls.push('render')},refresh(){calls.push('read-new')},
    window:{dispatchEvent(){calls.push('paired-event')}},
    CustomEvent:class {constructor(type,options){this.type=type;this.detail=options.detail}}
  },['runStart']);
  await env.runStart();
  assert.deepEqual(calls,['redact','paired-event','render','read-new']);
  assert.equal(env.S.statusObj,null,'old owner snapshot was removed before the new read');
  assert.equal(env.S.paired,true);
  assert.equal(env.activePhoneSourceScope,
    sha256Hex(JSON.stringify(['phone-source','session',grant])));
});


test('old-grant graph context 403 cannot revoke new context or new session',async()=>{
  let grant='grant-a',resolveOld;const revoked=[];
  const env=install({
    HOST_PREVIEW:false,chatContextEpoch:0,chatContext:null,
    S:{tab:'wiki',paired:true},transport:{direct:true,deviceHeaders:()=>({
      'x-vivim-device-session':'session','x-vivim-grant-id':grant
    }),setDeviceSession:()=>revoked.push('session-cleared')},
    toast(){},renderFocusPanel(){},clearPrivatePhoneState:()=>revoked.push('private-cleared'),
    showPairingState(){},setConn(){},isInvalidDeviceSession:code=>code==='GRANT_REVOKED',
    fetch:async(_url,options)=>options.headers['x-vivim-grant-id']==='grant-a'
      ?new Promise(resolve=>{resolveOld=resolve})
      :{ok:true,json:async()=>({schema:'vivim.hqkg-chat-context/1',
         state:'source-backed',authority:'read-only',focus:'wiki',
         items:[{title:'B source'}],epoch:2})}
  },['readGraphContext']);
  const stale=env.readGraphContext();
  grant='grant-b';
  await env.readGraphContext();
  assert.equal(env.chatContext.items[0].title,'B source');
  resolveOld({ok:false,status:403,json:async()=>({code:'GRANT_REVOKED'})});
  await stale;
  assert.equal(env.chatContext.items[0].title,'B source');
  assert.deepEqual(revoked,[]);
});

test('late media read from previous grant cannot leave private metadata displayed',async()=>{
  let grant='grant-a',resolveOld;
  const env=install({
    HOST_PREVIEW:false,mediaGeneration:0,
    S:{tab:'world',paired:true,mediaLoading:false,mediaAt:0,mediaOffset:0,media:null},
    transport:{direct:true,deviceHeaders:()=>({
      'x-vivim-device-session':'session','x-vivim-grant-id':grant
    })},
    renderSurfaces(){},isInvalidDeviceSession:()=>false,fetch:async()=>
      new Promise(resolve=>{resolveOld=resolve})
  },['refreshMedia']);
  const stale=env.refreshMedia(true,0);
  grant='grant-b';
  resolveOld({ok:true,json:async()=>({
    schema:'vivim.media-library-summary/1',offset:0,items:[{name:'Grant A private media'}]
  })});
  await stale;
  assert.deepEqual(JSON.parse(JSON.stringify(env.S.media)),{state:'not-authorized'});
  assert.equal(env.S.mediaLoading,false);
  assert.equal(env.S.mediaAt,0);
});

test('stale media ticket revocation cannot revoke a replacement grant',async()=>{
  let grant='grant-a',resolveOld;const revoked=[];
  const env=install({
    HOST_PREVIEW:false,playerActive:false,playerEpoch:0,playerOpen:null,
    S:{tab:'world',paired:true},location:{origin:'https://host.test'},
    transport:{direct:true,deviceHeaders:()=>({
      'x-vivim-device-session':'session','x-vivim-grant-id':grant
    }),setDeviceSession:()=>revoked.push('session-cleared')},
    AbortController,clearPrivatePhoneState:()=>revoked.push('private-cleared'),
    showPairingState(){},setConn(){},isInvalidDeviceSession:code=>code==='GRANT_REVOKED',
    fetch:async()=>new Promise(resolve=>{resolveOld=resolve})
  },['openMediaPlayer']);
  const pending=env.openMediaPlayer('a'.repeat(32),'Private');
  grant='grant-b';
  resolveOld({ok:false,status:403,json:async()=>({code:'GRANT_REVOKED'})});
  await pending;
  assert.deepEqual(revoked,[]);
  assert.equal(env.playerActive,false);
});


test('rejected Build visual rollback does not overwrite newer app-wide Host status',async()=>{
  const oldStatus={snapshot:{bootstrap:{uiRevision:{revision:8,surfaceId:'my-space'}}}};
  let scheduleCount=0,cleared=0,bindings=0;
  const env=install({
    buildTimer:0,buildPollSequence:0,buildKey:'current',
    HOST_PREVIEW:false,
    S:{tab:'build',paired:true,statusObj:oldStatus,statusAt:10},
    transport:{direct:true,deviceHeaders:()=>({
      'x-vivim-device-session':'session','x-vivim-grant-id':'grant'
    })},
    api:async()=>({snapshot:{bootstrap:{uiRevision:{revision:7,surfaceId:'my-space'}}}}),
    build:{setVisualSourceScope:()=>true,
      setSurface:()=>({state:'blocked',reason:'ROLLBACK_PROOF_REQUIRED'}),
      clear(){},clearVisualSourceScope(){}},
    shellPresentation:{observe(){throw Error('stale status must not be presented')},
      clear(){cleared++}},
    refreshBuildBindings(){bindings++},scheduleBuild(){scheduleCount++}
  },['pollBuild']);
  await env.pollBuild();
  assert.equal(env.S.statusObj,oldStatus,'newer Host status cannot be replaced by a stale visual revision');
  assert.equal(cleared,1,'refused visual head removes any optimistic shell paint');
  assert.equal(bindings,0,'no stale Wiki/Studio binding fetch');
  assert.equal(scheduleCount,1,'polling continues to look for the newer admitted Host head');
});
