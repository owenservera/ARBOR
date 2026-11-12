import test from 'node:test';
import assert from 'node:assert/strict';
import { F02_SCHEMA, F02_FONT_STACKS, parseF02Response, compileF02RenderPlan } from '../bootstrap-f02.mjs';

const example=()=>({schema:F02_SCHEMA,pass:'F02',provisional:false,
 visual:{background:'#10191c',secondary:'#183b3c',accent:'#7fc6bc',
 appearance:'dark',texture:'aurora',mood:'focused',fontFamily:'humanist',
 fontSizePx:15,headingSizePx:28,radiusPx:14,spacingScale:1.05,
 density:'comfortable',motion:'still'},
 preferences:[{trait:'Dark technical interfaces',basis:'explicit',confidence:.9,scope:'work'}],
 dislikes:[],unknowns:['Favorite typeface']});

test('F02 compiles specific colors, font, size and geometry',()=>{
 const out=compileF02RenderPlan(JSON.stringify(example()),{worldId:'world-example',requestId:'request-1',revision:1});
 assert.equal(out.cssVariables['--bg'],'#10191c');
 assert.equal(out.cssVariables['--ac'],'#7fc6bc');
 assert.equal(out.cssVariables['--vivim-font-family'],F02_FONT_STACKS.humanist);
 assert.equal(out.cssVariables['--vivim-base-font-size'],'15px');
 assert.equal(out.cssVariables['--vivim-heading-font-size'],'28px');
 assert.equal(out.cssVariables['--vivim-corner-radius'],'14px');
 assert.equal(out.theme.source.ref,'request-1');
 assert.equal(out.status,'suggested');
});
test('F02 rejects invalid fields and unbounded values',()=>{
 for(const change of [{fontFamily:'not-a-font'},{fontSizePx:60},{radiusPx:40},
   {spacingScale:3},{background:'red'},{texture:'unsupported'}]){
  const value=example();value.visual={...value.visual,...change};
  assert.throws(()=>parseF02Response(value),TypeError);
 }
 assert.throws(()=>parseF02Response({...example(),unexpected:true}));
});
test('model cannot grant itself approval or forge world scope',()=>{
 assert.throws(()=>parseF02Response({...example(),approval:'yes'}));
 assert.throws(()=>compileF02RenderPlan(example(),{worldId:'../other',requestId:'request-1'}));
 assert.throws(()=>compileF02RenderPlan(example(),{worldId:'world-ok',requestId:'bad request'}));
});
test('preference qualification and motion preferences are bounded',()=>{
 const data=example();data.preferences[0].confidence=2;
 assert.throws(()=>parseF02Response(data));
 const good=example();good.visual.motion='slow';
 const compiled=compileF02RenderPlan(good,{worldId:'world-1',requestId:'req-1',reducedMotion:true});
 assert.equal(compiled.motion,'still');
});
