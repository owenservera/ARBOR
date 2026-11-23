import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolveProviderHandoff, canSendVerifiedProvider, resolveReadOnlyChatTool, projectReadOnlyChatTool } from '../provider-handoff.mjs';

const checked = ['chatgpt','claude','gemini','qwen','deepseek','zai']
  .map(id => ({id,signedIn:true,queueConsumerReady:true}));

test('explicit natural-language provider handoff selects only verified Studio providers', () => {
  for (const [text,id,draft] of [
    ['Ask Claude: Explain this code', 'claude', 'Explain this code'],
    ['@chatgpt compare designs', 'chatgpt', 'compare designs'],
    ['/ai Gemini: summarize', 'gemini', 'summarize'],
    ['Chat with Qwen', 'qwen', ''],
    ['@z.ai check', 'zai', 'check'],
    ['@deepseek: benchmark', 'deepseek', 'benchmark']
  ]) {
    const result = resolveProviderHandoff(text,checked);
    assert.equal(result.id,id);
    assert.equal(result.draft,draft);
    assert.equal(result.status,'ready');
    assert.equal(result.sendsAutomatically,false);
  }
});
test('unknown, unverified and ordinary Wiki questions never become AI sends', () => {
  assert.equal(resolveProviderHandoff('Compare Claude and ChatGPT',checked),null);
  assert.equal(resolveProviderHandoff('Ask about Claude: what is it?',checked),null);
  assert.equal(resolveProviderHandoff('@unknown test',checked),null);
  assert.equal(resolveProviderHandoff('hello',checked),null);
  assert.equal(resolveProviderHandoff('@claude hello',[]).status,'unverified');
  assert.equal(resolveProviderHandoff('@claude hello',[{id:'claude',signedIn:false}]).status,'unverified');
  assert.equal(resolveProviderHandoff('@qwen hello',[{id:'qwen',signedIn:true}]).status,'relay-offline');
  assert.equal(resolveProviderHandoff('@qwen hello',[{id:'qwen',signedIn:true,queueConsumerReady:false}]).status,'relay-offline');
  assert.equal(resolveProviderHandoff('@qwen hello',[{id:'qwen',signedIn:true,queueConsumerReady:true}]).status,'ready');
  assert.equal(resolveProviderHandoff('@qwen hello',[{id:'qwen',signedIn:false,queueConsumerReady:true}]).status,'unverified');
  assert.equal(resolveProviderHandoff('@claude hello',[{id:'claude',signedIn:'true'}]).status,'unverified');
  assert.equal(resolveProviderHandoff('@claude ' + 'x'.repeat(1001),checked),null);
});
test('same real mobile composer is reused; no new provider network or effect writer', () => {
  const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
  const host=readFileSync(new URL('../../vivim-host/direct-phone.mjs',import.meta.url),'utf8');
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  const module=readFileSync(new URL('../provider-handoff.mjs',import.meta.url),'utf8');
  assert.match(app,/resolveProviderHandoff\(body,S\.manifest\?\.providers\)/);
  assert.match(app,/switchChatTarget\('harness'\)/);
  assert.match(app,/first-contact-provider/);
  assert.match(host,/'provider-handoff\.mjs': \['provider-handoff\.mjs'/);
  assert.match(html,/body\.first-contact:not\(\.first-contact-provider\):not\(\.first-contact-handoff\):not\(\.first-contact-tools\) #send/);
  assert.match(app,/document\.body\.classList\.toggle\('first-contact-handoff'/);
  assert.match(app,/if \(transport\.direct && !canSendVerifiedProvider\(/);
  // Every Direct-phone provider send now uses the same stricter gate,
  // not only the first-contact mode.
  assert.equal((html.match(/id="chat-composer"/g)||[]).length,1);
  assert.doesNotMatch(module,/\bfetch\s*\(|\bWebSocket\s*\(|\bXMLHttpRequest\b|\.request\s*\(/);
});

// The first tap only selects the AI; later Send requires an actual device
// session and exact verified provider. Local Wiki text never passes this gate.
test('first-contact provider Send cannot bypass pairing or provider verification', () => {
  const base={
    paired:true,direct:true,sessionApproved:true,target:'harness',
    providerId:'claude',projection:checked,text:'Explain this',sending:false
  };
  assert.equal(canSendVerifiedProvider(base),true);
  for(const override of [
    {paired:false},{direct:false},{sessionApproved:false},
    {target:'vivim'},{target:'phone'},{providerId:'unknown'},
    {text:'  '},{sending:true},
    {projection:[{id:'claude',signedIn:false,queueConsumerReady:true}]},
    {projection:[{id:'claude',signedIn:true,queueConsumerReady:false}]},
    {projection:[{id:'claude',signedIn:true}]},
    {projection:[{id:'claude',signedIn:'true'}]},
    {projection:null}
  ])assert.equal(canSendVerifiedProvider({...base,...override}),false,JSON.stringify(override));
});

// A suspended sign-in or draft cannot authorize a send or silently reroute it.
test('provider handoff preserves a selected draft and never silently retargets an existing conversation',()=>{
  const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
  const normalization=app.slice(app.indexOf('function normalizeConv()'),app.indexOf('function newConv()'));
  assert.match(normalization,/if \(!p\) return;/);
  assert.doesNotMatch(normalization,/c\.provider\s*=/);
  assert.doesNotMatch(app,/field\.value = ''; autogrow\(\);\s*switchChatTarget\('harness'\)/);
  assert.match(app,/handoff\.status === 'ready'/);
  assert.match(app,/Selected AI not verified on your PC\. Draft preserved; nothing was sent/);
  assert.match(app,/AI signed in; PC relay unavailable\. Draft preserved/);
  assert.match(app,/Selected AI and PC relay ready\. Review your draft/);
  assert.match(app,/selected \? '\?provider='\+encodeURIComponent\(selected\)/);
});

test('a signed-in provider with no live consumer cannot send to a dead phone queue',()=>{
  const base={paired:true,direct:true,sessionApproved:true,target:'harness',
    providerId:'chatgpt',projection:[{id:'chatgpt',signedIn:true}],text:'Hi',sending:false};
  assert.equal(canSendVerifiedProvider(base),false);
  assert.equal(canSendVerifiedProvider({...base,projection:[{id:'chatgpt',signedIn:true,queueConsumerReady:true}]}),true);
  assert.match(readFileSync(new URL('../app.js',import.meta.url),'utf8'),/Worker offline: draft not sent/);
});

test('signed-in but worker-offline handoff keeps the draft without advertising send readiness',()=>{
  const projected=[{id:'chatgpt',signedIn:true,queueConsumerReady:false}];
  const handoff=resolveProviderHandoff('Ask ChatGPT: Is this live?',projected);
  assert.equal(handoff.status,'relay-offline');
  assert.equal(handoff.draft,'Is this live?');
  assert.equal(handoff.sendsAutomatically,false);
  assert.equal(canSendVerifiedProvider({paired:true,direct:true,sessionApproved:true,target:'harness',
    providerId:'chatgpt',projection:projected,text:handoff.draft,sending:false}),false);
});

test('Chrome Commander slash commands are read-only and cannot be confused with provider sends',()=>{
  for(const [input,expected] of [
    ['/tools','connections'],['/AI STATUS','connections'],['/chrome','chrome'],
    ['/browser status','chrome'],['/corpus','corpus'],['/memory status','corpus'],
    ['/feedback','delivery'],['/delivery status','delivery'],['/settings','settings']
  ])assert.equal(resolveReadOnlyChatTool(input),expected);
  for(const input of ['/chrome start','/chrome capture','/chrome stop',
    '/corpus ingest','/ai ChatGPT: message','/tools;send',
    'Ask ChatGPT: hello','/browser https://example.com','/delete','/chrome\nrun']){
    assert.equal(resolveReadOnlyChatTool(input),null,input);
  }
  const module=readFileSync(new URL('../provider-handoff.mjs',import.meta.url),'utf8');
  assert.doesNotMatch(module,/\bfetch\s*\(|\bWebSocket\s*\(|\bXMLHttpRequest\b|\.request\s*\(/);
});
test('read-only live connection, Chrome and corpus feedback is source-backed and strips private bytes',()=>{
  const secret='SECRET_UNTRUSTED_PROVIDER_BODY';
  const providers=[{id:'chatgpt',signedIn:true,queueConsumerReady:false,prompt:secret},
    {id:'claude',signedIn:true,queueConsumerReady:true}];
  const studio={schema:'vivim.studio-operations/1',authority:'read-only',
    capture:{state:'source-backed',recorderState:'idle',browserState:'available',browserVerified:true,url:secret},
    drive:{state:'source-backed',active:0,shown:4,jobs:[{title:secret}]}};
  const personalization={phase:'running',corpus:{claims:2,observations:3,contradictions:1},
    passes:[{pass:'F02',status:'running',prompt:secret}]};
  const commands=[{mode:'relay-chat',delivery:{state:'uncertain'},text:secret}];
  const options={providers,studio,personalization,commands,details:true};
  const ai=projectReadOnlyChatTool('connections',options);
  assert.equal(ai.rows.find(r=>r.label==='ChatGPT').value,'Signed in · relay unavailable');
  assert.equal(ai.rows.find(r=>r.label==='Claude').value,'Signed in · relay ready');
  assert.equal(projectReadOnlyChatTool('chrome',options).rows[0].value,'Verified owner connection');
  assert.equal(projectReadOnlyChatTool('corpus',options).rows.find(r=>r.label==='Claims').value,'2');
  assert.match(projectReadOnlyChatTool('delivery',options).rows[0].value,/Uncertain/);
  assert.equal(projectReadOnlyChatTool('settings',options).readOnly,true);
  for(const tool of ['connections','chrome','corpus','delivery','settings']){
    assert.doesNotMatch(JSON.stringify(projectReadOnlyChatTool(tool,options)),/SECRET_UNTRUSTED_PROVIDER_BODY/);
  }
  assert.equal(projectReadOnlyChatTool('chrome',{studio:{...studio,authority:'effect-owner'}}).rows[0].value,'Source unavailable');
  assert.equal(projectReadOnlyChatTool('corpus',{personalization:{phase:'done',corpus:{claims:-1}}}).rows[1].value,'Not reported');
  assert.equal(projectReadOnlyChatTool('not-a-tool',options),null);
});
test('chat tools use the existing composer and redact projections on revoked grants',()=>{
  const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  assert.equal((html.match(/id="chat-composer"/g)||[]).length,1);
  assert.equal((html.match(/id="chat-tools-button"/g)||[]).length,1);
  assert.match(app,/resolveReadOnlyChatTool\(body\)/);
  assert.match(app,/if\(tool\)\{renderChatToolPanel\(tool\);field\.value='';autogrow\(\);updateSend\(\);return;\}/);
  assert.match(app,/chatToolsPanel\.replaceChildren\(\);chatToolsPanel\.hidden=true/);
  assert.match(app,/projectReadOnlyChatTool\(tool/);
  assert.match(html,/first-contact-tools/);
});
