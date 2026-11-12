import test from 'node:test';
import assert from 'node:assert/strict';
import {readProjection,cacheProjection,readCachedProjection,cssEntries,undoCommand,
  PROJECTION_SCHEMA, PROJECTION_CACHE_KEY} from '../bootstrap-phone.mjs';

const projection=(worldId='world-a')=>({
  schema:PROJECTION_SCHEMA,worldId,observedAt:new Date().toISOString(),
  phase:'shaping',themeStatus:'active',revision:0,source:'owner-choice',
  cssVariables:{'--bg':'#10191c','--ac':'#7fc6bc',
    '--vivim-background-image':'linear-gradient(145deg, #10191c, #183b3c)',
    '--unexpected-token':'x', '--tx':'red;position:absolute',
    '--s1':'url(https://unsafe.invalid/a)'},
  undo:{available:true},progress:{passes:[]}
});
const storage=()=>{
  const map=new Map();
  return {getItem:key=>map.get(key)??null,setItem:(key,val)=>map.set(key,val),
    removeItem:key=>map.delete(key)};
};

test('status reads only the expected Host bootstrap projection',()=>{
  const p=projection();
  assert.equal(readProjection({snapshot:{bootstrap:p}}).worldId,'world-a');
  assert.equal(readProjection({snapshot:{personalAgent:{bootstrap:p}}}).schema,PROJECTION_SCHEMA);
  assert.equal(readProjection({snapshot:{bootstrap:{...p,schema:'unknown'}}}),null);
  assert.equal(readProjection(null),null);
});
test('World-scoped cache stays bounded and supports explicit reset on re-pair',()=>{
  const st=storage();
  assert.equal(cacheProjection(st,projection()),true);
  assert.equal(readCachedProjection(st).worldId,'world-a');
  assert.ok(st.getItem(PROJECTION_CACHE_KEY));
  st.removeItem(PROJECTION_CACHE_KEY);
  assert.equal(readCachedProjection(st),null);
});
test('only explicitly supported safe CSS variables survive projection',()=>{
  const entries=Object.fromEntries(cssEntries(projection()));
  assert.equal(entries['--bg'],'#10191c');
  assert.equal(entries['--ac'],'#7fc6bc');
  assert.equal(entries['--unexpected-token'],undefined);
  assert.equal(entries['--s1'],undefined);
  assert.equal(entries['--tx'],undefined);
});
test('Undo uses separate bootstrap consumer and exact action token',()=>{
  assert.deepEqual(undoCommand(),{
    text:'undo-theme',kind:'command',consumer:'bootstrap',mode:'bootstrap',action:'undo-theme'
  });
});

test('phone projection cache rejects older revisions and same-revision rollback',()=>{
  const st=storage(), first=projection();
  first.revision=3;first.observedAt=new Date(Date.now()-10000).toISOString();
  assert.equal(cacheProjection(st,first),true);
  assert.equal(cacheProjection(st,{...first,revision:2,observedAt:new Date().toISOString()}),false);
  assert.equal(cacheProjection(st,{...first,observedAt:new Date(Date.now()-20000).toISOString()}),false);
  assert.equal(cacheProjection(st,{...first,observedAt:new Date(Date.now()+300000).toISOString()}),false);
  assert.equal(readCachedProjection(st).revision,3);
});
