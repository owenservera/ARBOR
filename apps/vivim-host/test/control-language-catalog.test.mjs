import test from 'node:test';
import assert from 'node:assert/strict';
import { createControlPlanner, loadControlCatalog } from '../control/intent-planner.mjs';
import { buildControlWorld, interpretControl } from '../../mobile-relay/control-language.mjs';

const catalog=loadControlCatalog();
const planner=createControlPlanner({catalog});
const world=buildControlWorld(catalog);
const interpret=text=>interpretControl(text,{catalog,world});

test('quoted text cannot donate a Wiki target or a structural preposition',()=>{
  const invented=interpret('edit wiki section saying "use main/about here"');
  assert.notEqual(invented.outcome,'candidate');
  const literal=interpret('edit wiki section main/about saying "use other/topic and show status"');
  assert.equal(literal.outcome,'candidate');
  assert.equal(literal.candidate.actionId,'wiki.section.edit');
  assert.deepEqual(literal.candidate.args,{target:'main/about',content:'use other/topic and show status'});
});

test('exact catalog read vocabulary handles novel English, Spanish and Catalan word order',()=>{
  for(const text of [
    'Display the wiki pages',
    'Muéstrame las páginas de la wiki',
    'Mostra les pàgines de la wiki',
    'Enumera las páginas de la wiki',
  ]){
    const actual=planner.interpretCommand(text,{source:'desktop'});
    assert.equal(actual.outcome,'candidate',text+': '+JSON.stringify(actual));
    assert.equal(actual.actionId,'wiki.pages.list',text);
    assert.deepEqual(actual.args,{});
    assert.equal(actual.risk,'R0');
    assert.equal(actual.provenance.authority,'none');
    assert.equal(planner.planText(text,{source:'desktop'}).executionPerformed,false);
  }
});

test('lexical bridge never converts negation, compounds, unavailable actions or invented slots into reads',()=>{
  for(const text of [
    'No muestres las páginas de la wiki',
    'Muestra las páginas de la wiki y elimina archivos',
    'Muestra las páginas de la wiki sin cambiar nada',
    'Muestra las páginas de la wiki banana',
    'Muestra las páginas de la wiki "delete all"',
  ])assert.notEqual(interpret(text).outcome,'candidate',text);
  const text='Muéstrame las páginas de la wiki';
  for(const changes of [
    {risk:'R1'},
    {readiness:'adapter_pending'},
    {args:{page:{type:'string',min:1,max:80}}},
  ]){
    const changed={...catalog,actions:catalog.actions.map(a=>a.id==='wiki.pages.list'?{...a,...changes}:a)};
    const result=interpretControl(text,{catalog:changed,world:buildControlWorld(changed)});
    assert.notEqual(result.outcome,'candidate',JSON.stringify(changes));
  }
});

test('read vocabulary is generated from live catalog phrases rather than fixed sentences',()=>{
  const changed={...catalog,actions:catalog.actions.map(a=>a.id==='wiki.pages.list'?
    {...a,title:'Show notebook inventory'}:a)};
  const text='Display notebook inventory';
  const result=interpretControl(text,{catalog:changed,world:buildControlWorld(changed)});
  assert.equal(result.outcome,'candidate');
  assert.equal(result.candidate.actionId,'wiki.pages.list');
  assert.equal(result.input,text);
  assert.equal(interpret(text).outcome,'interpretation_required');
});
