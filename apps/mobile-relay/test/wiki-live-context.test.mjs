import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import {sha256Hex} from '../generative-ui/portable-digest.mjs';

// Execute the actual PWA functions, not a second Wiki implementation.
const app = readFileSync(new URL('../app.js', import.meta.url), 'utf8');

function functionSource(source, name) {
  let start = source.indexOf('function ' + name + '(');
  assert.notEqual(start, -1, name + ' must exist in the real PWA');
  if (source.slice(start - 6, start) === 'async ') start -= 6;
  const from = source.indexOf('{', start);
  let depth = 0;
  for (let i = from; i < source.length; i++) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}' && --depth === 0) return source.slice(start, i + 1);
  }
  throw new Error('Unbalanced ' + name);
}

test('Oracle owner-preview reads the already authorized Wiki context without granting Direct phone access', () => {
  assert.match(functionSource(app,'renderWikiContext'), /renderOracleInExistingWiki\(card,context\.oracleCorpus\)/);
  const refresh=functionSource(app,'refreshWiki');
  assert.match(refresh,/if \(HOST_PREVIEW\) \{[\s\S]*?fetch\('\/api\/host\/control\/wiki-context'/);
  assert.match(refresh,/if\s*\(HOST_PREVIEW\)ingestWikiSources\(sourceSurface\)/);
  assert.doesNotMatch(functionSource(app,'renderOracleInExistingWiki'), /fetch\(|localStorage|sessionStorage|innerHTML|\.submit\(/);
});

test('Oracle preview view rejects sensitive pass and malformed provenance before rendering', () => {
  const nodes=[];
  const env={el:(tag,cls,text)=>({tag,cls,textContent:text??'',children:[],append(...children){this.children.push(...children);}})};
  vm.createContext(env);
  vm.runInContext(functionSource(app,'validOracleCorpusView'),env);
  vm.runInContext(functionSource(app,'renderOracleInExistingWiki'),env);
  const source={provenanceId:'prv-d03-a',generationId:'gen-a'};
  const claim={id:'clm-a',pass:'D03',statement:'Enjoys geometry',status:'provider-reported',
    section:'interest',basis:'provider_memory_report',source};
  const corpus={schema:'vivim.oracle-corpus-view/1',state:'ready',sensitiveExcluded:true,count:1,items:[claim]};
  assert.equal(env.validOracleCorpusView(corpus),true);
  const card=env.el('section','');
  env.renderOracleInExistingWiki(card,corpus);
  const text=JSON.stringify(card);
  assert.match(text,/Enjoys geometry/);
  assert.match(text,/provider-reported, not independently verified/);
  assert.equal(env.validOracleCorpusView({...corpus,items:[{...claim,pass:'D06'}]}),false);
  assert.equal(env.validOracleCorpusView({...corpus,items:[{...claim,source:{}}]}),false);
  assert.equal(env.validOracleCorpusView({...corpus,count:2}),false);
  assert.equal(env.validOracleCorpusView({...corpus,sensitiveExcluded:false}),false);
  assert.equal(env.validOracleCorpusView(undefined),true,'backward-compatible with older Host snapshots');
  assert.equal(env.validOracleCorpusView({schema:'vivim.oracle-corpus-view/1',state:'unavailable',
    sensitiveExcluded:true,items:[]}),true);
  assert.equal(env.validOracleCorpusView({schema:'vivim.oracle-corpus-view/1',state:'unavailable',
    sensitiveExcluded:true,items:[claim]}),false);
});

test('mounted Wiki reuses existing PWA timer and stops when hidden or leaving tab', () => {
  let readCount = 0;
  let armed = null;
  let armedCount = 0;
  const env = {
    S: { tab: 'wiki', paired: true, timer: 0 },
    N: { target: 'phone' },
    HOST_PREVIEW: false,
    document: { hidden: false },
    clearTimeout() {},
    setTimeout(fn, delay) { armedCount++; armed = { fn, delay }; return armedCount; },
    refreshWiki() { readCount++; },
    refresh() {}, pending() { return false }
  };
  vm.createContext(env);
  vm.runInContext(functionSource(app, 'schedule'), env);
  env.schedule();
  assert.equal(armed.delay, 8000);
  armed.fn();
  assert.equal(readCount, 1, 'live Host read on a mounted Wiki');
  assert.equal(armedCount, 2, 'timer re-armed through existing scheduling path');
  env.document.hidden = true;
  env.schedule();
  assert.equal(armedCount, 2, 'hidden Wiki starts no new polling');
  env.document.hidden = false;
  env.S.tab = 'talk';
  env.schedule();
  assert.equal(armedCount, 2, 'leaving Wiki stops native-phone Wiki polling');
});

test('real PWA Wiki HTTP projection rejects rollback and revocation, without storing a copy', async () => {
  let response = { ok: true, json: async () => ({
    revision: 3, pages: { Main: { sections: { About: '<b>literal user content</b>' } } }
  }) };
  const calls = [];
  const env = {
    HOST_PREVIEW: false,
    wikiReadSequence: 0, wikiReadScope:null, wikiSourceFence:null,
    rustUiEngineStatus:null,rustWikiSourceStamp:null,rustWikiSourceTransition:null,rustWikiSourceDelta:null,
    sha256Hex, clearWikiSources() {},
    S: { tab: 'wiki', paired: true, wiki: null, wikiError: '',
      device: { scopes: ['control:read'] } },
    transport: { direct: true, deviceHeaders: () => ({
      'x-vivim-device-session': 'session-1', 'x-vivim-grant-id': 'grant-1'
    }) },
    renderWiki() { calls.push('render'); },
    clearWiki(reason) { env.wikiReadSequence++; env.S.wiki = null;
      env.S.wikiError = reason; calls.push('clear'); },
    clearPrivatePhoneState() { env.S.wiki = null; env.S.paired = false; calls.push('revoke'); },
    isInvalidDeviceSession(code) { return code === 'GRANT_REVOKED'; },
    fetch: async (url, opts) => {
      assert.equal(url, '/mobile/api/wiki');
      assert.equal(opts.headers['x-vivim-device-session'], 'session-1');
      return response;
    }
  };
  vm.createContext(env);
  vm.runInContext(functionSource(app, 'wikiSourceStampFallback'), env);
  vm.runInContext(functionSource(app, 'validWikiSourceShape'), env);
  vm.runInContext(functionSource(app, 'verifyWikiSourceStamp'), env);
  vm.runInContext(functionSource(app, 'refreshWiki'), env);
  await env.refreshWiki();
  assert.equal(env.S.wiki.revision, 3);
  assert.equal(env.S.wiki.pages.Main.sections.About, '<b>literal user content</b>');
  response = { ok: true, json: async () => ({
    revision: 2, pages: { Main: { sections: { About: 'older content' } } }
  }) };
  await env.refreshWiki();
  assert.equal(env.S.wiki.revision, 3, 'a stale response cannot roll back the view');
  response = { ok: false, status: 403, json: async () => ({ code: 'GRANT_REVOKED' }) };
  await env.refreshWiki();
  assert.equal(env.S.wiki, null, 'revocation clears private Wiki text');
  assert.ok(calls.includes('revoke'));
});

test('Wiki can request existing optional native context, without a separate core or store', () => {
  assert.match(app, /CHAT_FOCUS[^\n]*'wiki'/);
  assert.match(functionSource(app, 'renderWiki'), /Source context/);
  assert.match(functionSource(app, 'renderWiki'), /readGraphContext/);
  assert.doesNotMatch(functionSource(app, 'renderWiki'), /innerHTML|localStorage|sessionStorage|window\.open/);
});


test('same Wiki revision with changed source bytes is refused without optional WASM', async()=>{
  let body={revision:4,pages:{Main:{sections:{About:'Original source'}}}};
  let grant='grant-a',secondReply;
  const env={
    HOST_PREVIEW:false, wikiReadSequence:0, wikiReadScope:null,wikiSourceFence:null,
    rustUiEngineStatus:null,rustWikiSourceStamp:null,rustWikiSourceTransition:null,rustWikiSourceDelta:null,
    sha256Hex, clearWikiSources(){},
    S:{tab:'wiki',paired:true,wiki:null,wikiError:'',device:{scopes:['control:read']}},
    transport:{direct:true,deviceHeaders:()=>({
      'x-vivim-device-session':'session-a','x-vivim-grant-id':grant
    })},
    clearWiki(reason){env.wikiReadSequence++;env.S.wiki=null;env.S.wikiError=reason;},
    renderWiki(){},isInvalidDeviceSession:()=>false,
    fetch:async()=>secondReply??{ok:true,json:async()=>body}
  };
  vm.createContext(env);
  vm.runInContext(functionSource(app,'wikiSourceStampFallback'),env);
  vm.runInContext(functionSource(app,'validWikiSourceShape'),env);
  vm.runInContext(functionSource(app,'verifyWikiSourceStamp'),env);
  vm.runInContext(functionSource(app,'refreshWiki'),env);
  await env.refreshWiki();
  assert.equal(env.S.wiki.revision,4);
  body={revision:4,pages:{Main:{sections:{About:'Changed behind same revision'}}}};
  await env.refreshWiki();
  assert.equal(env.S.wiki,null,'same-revision conflict must not keep stale text displayed');
  assert.match(env.S.wikiError,/source identity/i);
  // A new authenticated session/grant is a distinct scope, not a rollback.
  grant='grant-b';
  body={revision:1,pages:{Main:{sections:{About:'New grant source'}}}};
  await env.refreshWiki();
  assert.equal(env.S.wiki.revision,1);
  // Another swap must redact the old scope before the request resolves.
  grant='grant-c';
  let resolveRead;
  secondReply=new Promise(resolve=>{resolveRead=resolve});
  const pending=env.refreshWiki();
  assert.equal(env.S.wiki,null);
  resolveRead({ok:true,json:async()=>({revision:2,pages:{Main:{sections:{About:'Grant c'}}}})});
  await pending;
  assert.equal(env.S.wiki.pages.Main.sections.About,'Grant c');
});


test('Build Wiki read revocation clears private PWA state; scoped 403 only blanks bindings',()=>{
  const source=functionSource(app,'refreshBuildBindings');
  assert.match(source,/isInvalidDeviceSession\(denied\.code\|\|denied\.reason\|\|denied\.error\)/);
  assert.match(source,/transport\.setDeviceSession\(null\);\s*clearPrivatePhoneState\(\);/);
  assert.match(source,/build\.setLiveData\(null,revision\); \/\/ a scoped denial/);
});


test('ready native Wiki verifier may not silently downgrade to JS-only identity',async()=>{
  const wiki={revision:4,pages:{Main:{sections:{Info:'Host source'}}}};
  const env={
    HOST_PREVIEW:false,wikiReadSequence:0,wikiReadScope:null,wikiSourceFence:null,
    rustUiEngineStatus:()=>({fallback:'none'}),rustWikiSourceStamp:()=>undefined,
    rustWikiSourceTransition:null,rustWikiSourceDelta:null,sha256Hex,
    clearWikiSources(){},renderWiki(){},
    S:{tab:'wiki',paired:true,wiki:null,wikiError:'',device:{scopes:['control:read']}},
    transport:{direct:true,deviceHeaders:()=>({
      'x-vivim-device-session':'session','x-vivim-grant-id':'grant'
    })},
    clearWiki(reason){env.wikiReadSequence++;env.S.wiki=null;env.S.wikiError=reason;},
    isInvalidDeviceSession:()=>false,fetch:async()=>({ok:true,json:async()=>wiki})
  };
  vm.createContext(env);
  vm.runInContext(functionSource(app,'wikiSourceStampFallback'),env);
  vm.runInContext(functionSource(app,'validWikiSourceShape'),env);
  vm.runInContext(functionSource(app,'verifyWikiSourceStamp'),env);
  vm.runInContext(functionSource(app,'refreshWiki'),env);
  await env.refreshWiki();
  assert.equal(env.S.wiki,null);
  assert.match(env.S.wikiError,/Native Wiki source verification unavailable/);
});


test('portable Wiki source digest preserves Rust map order for numeric and Unicode page keys',()=>{
  const env={sha256Hex};
  vm.createContext(env);
  vm.runInContext(functionSource(app,'wikiSourceStampFallback'),env);
  const numeric=JSON.parse('{"2":{"sections":{"S":"two"}},"10":{"sections":{"S":"ten"}}}');
  const mark=env.wikiSourceStampFallback({revision:9,pages:numeric});
  assert.equal(mark.digest,sha256Hex('{"10":{"sections":{"S":"ten"}},"2":{"sections":{"S":"two"}}}'));
  const unicode={'\uE000':{sections:{S:'private'}},'\u{10000}':{sections:{S:'supplementary'}}};
  const pages={'\uE000':unicode['\uE000'],'\u{10000}':unicode['\u{10000}']};
  const expected='{"\uE000":{"sections":{"S":"private"}},"\u{10000}":{"sections":{"S":"supplementary"}}}';
  assert.equal(env.wikiSourceStampFallback({revision:9,pages}).digest,sha256Hex(expected));
});

test('stale revoked-grant 403 cannot clear newly paired Wiki or revoke its session',async()=>{
  let grant='old',resolveOld;const revoked=[];
  const env={
    HOST_PREVIEW:false,wikiReadSequence:0,wikiReadScope:null,wikiSourceFence:null,
    rustUiEngineStatus:null,rustWikiSourceStamp:null,rustWikiSourceTransition:null,rustWikiSourceDelta:null,
    sha256Hex,clearWikiSources(){},renderWiki(){},
    S:{tab:'wiki',paired:true,wiki:null,wikiError:'',device:{scopes:['control:read']}},
    transport:{direct:true,deviceHeaders:()=>({
      'x-vivim-device-session':'session','x-vivim-grant-id':grant
    }),setDeviceSession:()=>revoked.push('session-cleared')},
    clearPrivatePhoneState:()=>revoked.push('private-cleared'),
    isInvalidDeviceSession:code=>code==='GRANT_REVOKED',
    clearWiki(reason){env.wikiReadSequence++;env.S.wiki=null;env.S.wikiError=reason;},
    fetch:async(_url,options)=> options.headers['x-vivim-grant-id']==='old'
      ?new Promise(resolve=>{resolveOld=resolve})
      :{ok:true,json:async()=>({revision:1,pages:{Main:{sections:{Info:'new grant'}}}})}
  };
  vm.createContext(env);
  vm.runInContext(functionSource(app,'wikiSourceStampFallback'),env);
  vm.runInContext(functionSource(app,'validWikiSourceShape'),env);
  vm.runInContext(functionSource(app,'verifyWikiSourceStamp'),env);
  vm.runInContext(functionSource(app,'refreshWiki'),env);
  const stale=env.refreshWiki();
  grant='new';
  await env.refreshWiki();
  assert.equal(env.S.wiki.pages.Main.sections.Info,'new grant');
  resolveOld({ok:false,status:403,json:async()=>({code:'GRANT_REVOKED'})});
  await stale;
  assert.deepEqual(revoked,[]);
  assert.equal(env.S.wiki.pages.Main.sections.Info,'new grant');
});
