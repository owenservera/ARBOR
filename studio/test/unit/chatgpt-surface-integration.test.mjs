import test from 'node:test';
import assert from 'node:assert/strict';
import { projectChatGPTSurface, CHATGPT_SURFACE_GROUPS } from '../../src/studio/chatgpt-surface.mjs';
import { normalizeChatIndex, filterVisibleChatIndex } from '../../src/capture/chatgpt-chat-index.mjs';
import { CONVERSATION_TOOLS, executeConversationTool, validateConversationTool, registerConversationTools } from '../../src/studio/conversation-tools.mjs';
import { recipeDefinition } from '../../src/recipes/catalog.mjs';
import { planRecipe } from '../../src/recipes/plan.mjs';
import { chooseRecipe } from '../../src/recipes/choose.mjs';
const node=(role,name,properties=[],ignored=false)=>({ignored,role:{value:role},name:{value:name},properties});
test('all 20 groups are represented without inventing observations or effects',()=>{
 const r=projectChatGPTSurface([
  node('button','Ajustes',[{name:'expanded',value:{value:true}},{name:'value',value:{value:'private-credential-value'}}]),
  node('tab','Complementos'),node('button','Actualizar herramientas'),node('button','vivim_terminal_start'),
  node('link','Work'),node('button','Private conversation title'),node('StaticText','Private message'),
  node('button','Settings',[],true),node('link','Send'),node('button','unrecognized secret')]);
 assert.equal(CHATGPT_SURFACE_GROUPS.length,20);
 assert.equal(r.groups.length,20);assert.equal(r.complete,false);assert.equal(r.candidatesOnly,true);
 assert.equal(r.executionAuthorized,false);assert.equal(r.activationPermitted,false);assert.equal(r.sendPermission,false);
 assert.equal(r.groups.find(x=>x.id==='CG08').candidates.length,1);
 assert.deepEqual(r.groups.find(x=>x.id==='CG08').candidates[0].state,{expanded:true});
 assert.equal(r.groups.find(x=>x.id==='CG10').candidates.length,3);
 assert.deepEqual(r.toolIdCandidates,['vivim_terminal_start']);
 assert.equal(r.groups.find(x=>x.id==='CG12').candidates[0].control,'work');
 assert.equal(r.groups.find(x=>x.id==='CG19').observation,'not-observed-in-this-view');
 const encoded=JSON.stringify(r);for(const value of ['private-credential-value','Private conversation title','Private message','unrecognized secret'])assert.ok(!encoded.includes(value));
});
test('bounded observation reports omitted controls and cannot promote unobserved groups',()=>{
 const r=projectChatGPTSurface(Array.from({length:5003},()=>node('button','Settings')));
 assert.equal(r.coverage.scannedControls,5000);assert.equal(r.coverage.omittedControls,3);
 assert.equal(r.coverage.groupsWithCandidates,1);assert.equal(r.complete,false);
 assert.throws(()=>projectChatGPTSurface(null),/SURFACE_AX_INVALID/);
});
const thread='6b07acb1-e608-83eb-9863-a58e13c93843';
function observation(){return {targetId:'exact-target',origin:'https://chatgpt.com',index:normalizeChatIndex({origin:'https://chatgpt.com',links:[
 {href:'/c/'+thread,text:'Prueba de conexión',visible:true},{href:'/c/11111111-1111-1111-1111-111111111111',text:'Another title',visible:true},
 {href:'https://example.com/c/'+thread,text:'Foreign',visible:true}
]})};}
test('visible search filters the native bounded candidates without echoing query or upgrading identity',()=>{
 const r=filterVisibleChatIndex(observation(),'CONEXION');
 assert.equal(r.entries.length,1);assert.equal(r.entries[0].id,thread);
 assert.equal(r.entries[0].liveBinding.state,'not-established');assert.equal(r.complete,false);
 assert.equal(r.coverage.searchedEntries,2);assert.equal(r.coverage.matchedEntries,1);
 assert.ok(!JSON.stringify(r).includes('CONEXION'));
 assert.equal(filterVisibleChatIndex(observation(),thread).entries.length,1);
 assert.equal(filterVisibleChatIndex(observation(),'missing').entries.length,0);
 for(const q of ['','   ','\u0301','\x00','x'.repeat(301)])assert.throws(()=>filterVisibleChatIndex(observation(),q),/INVALID_CHAT_INDEX_QUERY/);
 assert.throws(()=>filterVisibleChatIndex({index:{entries:[]}},'a'),/CHAT_INDEX_OBSERVATION_UNAVAILABLE/);
});
test('both native operations are read-only, strictly scoped and use the incumbent dispatcher',async()=>{
 const calls=[],runtime={chatgptSurface:async args=>{calls.push(['surface',args]);return {ok:true}},searchVisibleChatGPT:async args=>{calls.push(['search',args]);return {ok:true}}};
 for(const [tool,recipe,args] of [
  ['chatgpt_surface','provider.chatgpt-surface',{targetId:'exact-target'}],
  ['search_chatgpt_visible','provider.chatgpt-search-visible',{targetId:'exact-target',query:'test'}]]){
  const d=CONVERSATION_TOOLS.find(x=>x.name===tool);assert.ok(d);assert.equal(d.annotations.readOnlyHint,true);
  assert.equal(recipeDefinition(recipe).tool,tool);assert.equal(planRecipe(recipe,args).ready,true);
  assert.deepEqual(await executeConversationTool(runtime,tool,args),{ok:true});
  for(const extra of [{origin:'https://evil.example'},{selector:'body'},{port:9222},{execute:true},{site:'claude'}])
   assert.throws(()=>validateConversationTool(tool,{...args,...extra}));
 }
 assert.equal(calls.length,2);
 assert.throws(()=>validateConversationTool('search_chatgpt_visible',{targetId:'exact-target',query:'   '}));
 assert.throws(()=>validateConversationTool('search_chatgpt_visible',{targetId:'exact-target',query:'x',maxEntries:9999}));
 const routes=[];registerConversationTools({add:(method,path,description,handler,options)=>routes.push({method,path,handler,options}),conversationRuntime:runtime});
 const surface=routes.find(x=>x.options.tool==='chatgpt_surface');
 assert.equal(surface.method,'POST');assert.equal(surface.path,'/chatgpt-surface');
 await surface.handler({body:{targetId:'exact-target'}});assert.equal(calls.length,3);
 assert.equal(chooseRecipe('inspect chatgpt surface').selection,'provider.chatgpt-surface');
});
