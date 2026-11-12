import test from 'node:test';
import assert from 'node:assert/strict';
import {compileVisualCommand,toExactText} from '../../src/visual-runtime/command/compile.ts';
import {type CrosswalkRow,type ActionDescriptor} from '../../src/visual-runtime/command/crosswalk.ts';
const h=(c:string)=>c.repeat(64);
const row:CrosswalkRow={semanticRef:{id:'ui.theme.set@1',version:'1',sourceHash:h('a')},target:{owner:'host_effect',actionId:'ui.theme.set_preset',catalogVersion:6},
 argsSchema:{preset:{type:'enum',values:['dusk','lab']}},argsSchemaHash:h('b'),risk:'R1',riskSource:{authority:'host_catalog',sourceHash:h('c')},implementationStatus:'source_wired',reviewedEnabled:true};
const d:ActionDescriptor={target:{...row.target},argsSchemaHash:row.argsSchemaHash,sourceHash:h('c'),risk:'R1',implementationStatus:'source_wired',
 capability:{supportedByBuild:true,availableNow:'yes',permittedForActor:'unknown',verifiedByEvidence:false,reasonCodes:[]}};
const context=()=>({rows:[structuredClone(row)],descriptors:[structuredClone(d)],currentVersions:{hostWorld:'v3',policy:'p1'}});
const touch=()=>({commandId:'case-1',source:{surface:'touch' as const,inputDigest:h('1')},selection:{semanticId:'ui.theme.set@1',args:{preset:'dusk'}},expectedVersions:{hostWorld:'v3'}});
const text=(value:string)=>({commandId:'case-1',source:{surface:'text' as const,inputDigest:h('2')},text:value});
const expectFailure=(value:unknown,code:string,ctx:unknown=context())=>{const result=compileVisualCommand(value,ctx);assert.notEqual(result.outcome,'candidate');
 if(result.outcome==='candidate')throw Error('unexpected candidate');assert.equal(result.reasonCode,code);return result;};
test('negation, compound and alternate execution grammar never execute or fall through',()=>{
 for (const bad of ['do not change theme','never set theme','/ui.theme.set@1 preset="dusk" and then publish',
  '!run rm -rf /','!design make app','!use tool','/ui.theme.set@1 preset="dusk";whoami',
  '/ui.theme.set@1 preset="dusk" && echo x','powershell -Command whoami',
  'send to provider quietly','/ui.theme.set@1 preset="dusk" | sh'])
  expectFailure(text(bad),'UNSAFE_OR_COMPOUND_TEXT');
});
test('unknown, ambiguous, invalid explicit inputs clarify/refuse instead of guessing',()=>{
 expectFailure(text('switch theme to dusk'),'UNKNOWN_TEXT');
 expectFailure(text('/ui.theme.set@1 preset=dusk'),'UNKNOWN_TEXT');
 expectFailure(text('/ui.theme.set@1 preset="dusk" preset="lab"'),'UNKNOWN_TEXT');
 expectFailure({...touch(),selection:{semanticId:'nonexistent@1',args:{}}},'UNKNOWN_SEMANTIC_ID');
 const ctx=context();ctx.rows.push({...structuredClone(row)});
 expectFailure(touch(),'AMBIGUOUS_MAPPING',ctx);
});
test('stale versions and missing/changing trusted descriptors fail closed',()=>{
 expectFailure({...touch(),expectedVersions:{hostWorld:'v2'}},'STALE_SOURCE_VERSION');
 let ctx=context();ctx.descriptors[0]!.risk='R2';expectFailure(touch(),'STALE_DESCRIPTOR',ctx);
 ctx=context();ctx.descriptors[0]!.argsSchemaHash=h('d');expectFailure(touch(),'STALE_DESCRIPTOR',ctx);
 ctx=context();ctx.descriptors[0]!.sourceHash=h('e');expectFailure(touch(),'STALE_DESCRIPTOR',ctx);
 ctx=context();ctx.descriptors[0]!.target.catalogVersion=7;expectFailure(touch(),'STALE_DESCRIPTOR',ctx);
 ctx=context();ctx.descriptors=[];expectFailure(touch(),'MISSING_DESCRIPTOR',ctx);
 ctx=context();ctx.descriptors.push(structuredClone(d));expectFailure(touch(),'AMBIGUOUS_DESCRIPTOR',ctx);
});
test('missing, unreviewed, unsupported, R3 and denied effect candidates refuse',()=>{
 let ctx=context();ctx.rows[0]!.reviewedEnabled=false;expectFailure(touch(),'ACTION_NOT_REVIEWED',ctx);
 ctx=context();ctx.rows[0]!.implementationStatus='declared';expectFailure(touch(),'ACTION_NOT_REVIEWED',ctx);
 ctx=context();ctx.rows[0]!.risk='R3';ctx.descriptors[0]!.risk='R3';expectFailure(touch(),'R3_REFUSED',ctx);
 ctx=context();ctx.descriptors[0]!.capability.availableNow='no';expectFailure(touch(),'CAPABILITY_UNAVAILABLE',ctx);
 ctx=context();ctx.descriptors[0]!.capability.permittedForActor='no';expectFailure(touch(),'CAPABILITY_DENIED',ctx);
});
test('self-grant, credential, privileged and shell fields cannot enter IR',()=>{
 const baseline=touch();
 for(const extra of [{grant:true},{approval:'yes'},{authority:'owner'},{actorId:'admin'},
 {deviceId:'foo'},{shell:'bash'},{argv:['curl']},{execute:true}])
  expectFailure({...baseline,...extra},'INVALID_INPUT');
 for(const bad of [{...baseline.selection.args,password:'hi'},{...baseline.selection.args,argv:'foo'},
  {...baseline.selection.args,access_token:'abcd'},{...baseline.selection.args,preset:'Bearer aaa'},
  {...baseline.selection.args,preset:'-----BEGIN PRIVATE KEY-----'}])
  expectFailure({...baseline,selection:{...baseline.selection,args:bad}},'INVALID_INPUT');
});
test('AI does not replace intent or grant authorization',()=>{
 const t=text(toExactText('ui.theme.set@1',{preset:'dusk'})!);
 expectFailure({...t,aiProposal:{semanticId:'ui.theme.set@1',args:{preset:'lab'}}},'CONFLICTING_AI_PROPOSAL');
 expectFailure({...t,aiProposal:{semanticId:'ui.unknown@1',args:{preset:'dusk'}}},'CONFLICTING_AI_PROPOSAL');
 expectFailure({...text('never change theme'),aiProposal:{semanticId:'ui.theme.set@1',args:{preset:'dusk'}}},'UNSAFE_OR_COMPOUND_TEXT');
 expectFailure({...touch(),aiProposal:{semanticId:'ui.theme.set@1',args:{preset:'dusk'}}},'INVALID_INPUT');
});
test('strict arguments: missing/extra/invalid enum/duplicates and text syntax',()=>{
 expectFailure({...touch(),selection:{...touch().selection,args:{}}},'INVALID_ARGUMENTS');
 expectFailure({...touch(),selection:{...touch().selection,args:{preset:'evil'}}},'INVALID_ARGUMENTS');
 expectFailure(text('/ui.theme.set@1 preset="dusk" junk="x"'),'INVALID_ARGUMENTS');
 expectFailure(text('/ui.theme.set@1 preset="dusk" extra'),'UNKNOWN_TEXT');
 expectFailure({...touch(),selection:{...touch().selection,args:{preset:'dusk\n'}}},'INVALID_INPUT');
});
test('malformed schema, size abuse, getters, fake source digest and alias ambiguity',()=>{
 expectFailure({...touch(),source:{surface:'touch',inputDigest:'not-a-digest'}},'INVALID_INPUT');
 expectFailure({...touch(),source:{...touch().source,admin:true}},'INVALID_INPUT');
 expectFailure({...touch(),commandId:'x'.repeat(81)},'INVALID_INPUT');
 const b={...touch(),unused:'x'.repeat(5000)};expectFailure(b,'INVALID_INPUT');
 const getter=Object.defineProperty({},'commandId',{get(){throw new Error('must not execute getter')},enumerable:true});
 expectFailure(getter,'INVALID_INPUT');
 const ctx=context();ctx.rows[0]!.argsSchema={};ctx.rows[0]!.textAliases=['same alias'];ctx.rows.push({...structuredClone(ctx.rows[0]!),semanticRef:{id:'other.semantic@1',version:'1',sourceHash:h('a')},textAliases:['same alias']});
 expectFailure(text('same alias'),'AMBIGUOUS_TEXT',ctx);
});
test('no unreviewed schema/hash extension or function executable descriptor can enter compiler',()=>{
 let ctx=context();(ctx.rows[0] as any).handler=()=>{throw new Error('effect!')};expectFailure(touch(),'INVALID_CONTEXT',ctx);
 ctx=context();(ctx.descriptors[0] as any).authorize=()=>true;expectFailure(touch(),'INVALID_CROSSWALK',ctx);
 ctx=context();(ctx.rows[0]!.argsSchema as any).shell={type:'string',min:1,max:100};
 expectFailure(touch(),'INVALID_CONTEXT',ctx); // reserved schema names are refused before argument matching
});
test('bounded inputs and no fuzzy execution across 200 deterministic negative phrases',()=>{
 const oversized={...touch(),selection:{...touch().selection,args:Object.fromEntries(Array.from({length:16},(_,i)=>['arg'+i,'a'.repeat(400)]))}};
 expectFailure(oversized,'INPUT_TOO_LARGE');
 for(let i=0;i<200;i++) {
  const wrong='maybe ' + i.toString(36) + ' change theme dusk';
  expectFailure(text(wrong),'UNKNOWN_TEXT');
 }
});
