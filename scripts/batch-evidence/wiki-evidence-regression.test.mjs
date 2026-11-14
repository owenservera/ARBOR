import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { runWikiEvidence, parseJournalResponse, parseRawJournal,
  rendererSourceContract, assertIsolatedLive } from './WIKI-BASELINE.mjs';

const baseUrl = 'http://127.0.0.1:43187';
const ids = ['wiki.page.create','wiki.section.edit','wiki.page.move','wiki.pages.link',
  'wiki.section.read','wiki.pages.list','wiki.page.delete','send-message','read-state',
  'execute-intent','read-journal','get-capabilities'];
const response = (body, status=200, type='application/json') =>
  ({status,type,body: typeof body === 'string' ? body : JSON.stringify(body)});
function fixture(t, flags={}) {
  const root = mkdtempSync(path.join(os.tmpdir(), 'arbor-a00-'));
  t.after(() => rmSync(root, {recursive:true,force:true}));
  const write = (p, value) => {
    const filename=path.join(root,p);
    mkdirSync(path.dirname(filename),{recursive:true});
    writeFileSync(filename, typeof value === 'string' ? value : JSON.stringify(value));
  };
  write('apps/vivim-host/control/action-catalog.v1.json',{actions:ids.map(id=>({id}))});
  write('apps/vivim-host/data/demo-baseline/file-surface.v1.json',{records:[]});
  const seed='apps/vivim-host/data/demo-baseline/wiki.json';
  const wiki={revision:1,pages:{Main:{sections:{HowTo:'Original'}}}};
  write(seed,wiki);
  const journal=[];
  let writes=0;
  const get=async route=>{
    if(flags.failRoute===route) return response({error:'unavailable'},503);
    if(route==='/api/roadmap') return response({buildQueue:[{itemId:'A00'}]});
    if(route==='/api/wiki') return response(wiki);
    if(route==='/api/state') return response({wikiRevision:wiki.revision});
    if(route==='/api/journal') return response(flags.badArray ? {not:'an array'} : journal);
    if(route==='/demo/journal.jsonl') return response(flags.corruptRaw ? '{corrupt}\n' :
      journal.map(JSON.stringify).join('\n')+(journal.length?'\n':''),200,'application/jsonl');
    if(route==='/wiki') return response('<link href="/wiki.css"><script src="/wiki.js"></script>',200,'text/html');
    if(route==='/wiki.js') return response('function renderRoadmap() {} function renderFileSurface() {} /api/roadmap /api/wiki /api/journal',200,'text/javascript');
    if(route==='/wiki.css') return response('.wiki { display:block }',200,'text/css');
    return response({error:'not found'},404);
  };
  const post=async (route,payload,headers)=>{
    if(route!=='/api/mutate') return response({},404);
    if(!flags.ignoreOrigin && headers.origin!==baseUrl) return response({},403);
    if(headers['x-vivim-control']!=='1') return response({},403);
    if(!['owner-browser','human','ai','loop-agent'].includes(payload.actor)) return response({},400);
    if(!Number.isSafeInteger(payload.expectedRevision)) return response({},428);
    if(!flags.ignoreStale && payload.expectedRevision!==wiki.revision) return response({},409);
    writes++;
    const entry={...payload,receivedAt:'2026-11-14T12:00:00Z'};
    journal.push(entry);
    wiki.revision++; wiki.pages.Main.sections.HowTo=payload.edit.content;
    if(flags.mutateSeed) write(seed,wiki);
    return response({...entry,revision:writes,wikiRevision:wiki.revision});
  };
  return {root,seed,transport:{get,post},get writes(){return writes;}};
}
async function run(t,flags={}) {
  const host=fixture(t,flags);
  const result=await runWikiEvidence({root:host.root,live:true,isolated:true,baseUrl,transport:host.transport});
  return {host,result};
}
test('JSON array API rejects JSONL and non-arrays, but empty is valid',()=>{
  assert.deepEqual(parseJournalResponse('[]'),[]);
  assert.deepEqual(parseJournalResponse('[{}]'),[{}]);
  assert.throws(()=>parseJournalResponse('{"x":1}'),/array/);
  assert.throws(()=>parseJournalResponse('{}\n{}'),SyntaxError);
});
test('raw JSONL detects corruption rather than dropping evidence',()=>{
  assert.deepEqual(parseRawJournal(''),[]);
  assert.deepEqual(parseRawJournal('{}\n'),[{}]);
  assert.throws(()=>parseRawJournal('{}\n{broken}\n'),/Corrupt journal line 2/);
  assert.throws(()=>parseRawJournal('{}\n\n'),/Empty or torn/);
  assert.throws(()=>parseRawJournal('null\n'),/Invalid journal entry/);
});
test('source checks are not DOM checks; must have both external assets',()=>{
  const html='<link href="/wiki.css"><script src="/wiki.js"></script>';
  const js='function renderRoadmap() {} function renderFileSurface() {} /api/roadmap /api/wiki /api/journal';
  assert.equal(rendererSourceContract(html,js,'.wiki{}'),true);
  assert.equal(rendererSourceContract(html,'','.wiki{}'),false);
  assert.equal(rendererSourceContract(html,js,''),false);
});
test('live requires an explicitly isolated loopback Host',()=>{
  assert.doesNotThrow(()=>assertIsolatedLive(baseUrl,true));
  for(const url of ['https://127.0.0.1:43187','http://192.168.1.9:43187',
    'http://127.0.0.1:43187/foo']) assert.throws(()=>assertIsolatedLive(url,true),/isolated/);
  assert.throws(()=>assertIsolatedLive(baseUrl,false),/isolated/);
});
test('static path is SOURCE_ONLY with no browser or keeper acceptance',async t=>{
  const host=fixture(t);
  const result=await runWikiEvidence({root:host.root});
  assert.equal(result.ok,true);
  assert.equal(result.scope,'SOURCE_ONLY');
  assert.equal(result.browserDom,'UNRUN');
  assert.equal(host.writes,0);
});
test('empty journal, refusals, one authorized append and projection have bounded scope',async t=>{
  const {host,result}=await run(t);
  assert.equal(result.ok,true,JSON.stringify(result.checks.filter(c=>!c.pass)));
  assert.equal(host.writes,1);
  assert.equal(result.browserDom,'UNRUN');
  assert.equal(result.sessionBoundAuthorization,'UNVERIFIED');
  assert.match(result.durableWikiProjection,/RESTART_UNRUN/);
  for(const name of ['forged-origin-refused','missing-explicit-control-refused',
    'forged-actor-refused','missing-revision-refused','stale-revision-refused',
    'refusals-are-nonmutating','one-authorized-journal-append',
    'wiki-and-state-revision-projection','committed-seed-unchanged'])
    assert.equal(result.checks.find(c=>c.name===name)?.pass,true,name);
});
for(const route of ['/wiki.js','/wiki.css','/api/wiki','/api/roadmap','/api/journal']){
  test('unavailable route '+route+' fails without a mutation',async t=>{
    const {host,result}=await run(t,{failRoute:route});
    assert.equal(result.ok,false);
    assert.equal(host.writes,0);
  });
}
for(const flags of [{badArray:true},{corruptRaw:true}]){
  test('malformed journal evidence fails closed: '+JSON.stringify(flags),async t=>{
    const {host,result}=await run(t,flags);
    assert.equal(result.ok,false);
    assert.equal(host.writes,0);
  });
}
test('broken origin guard cannot produce false green',async t=>{
  const {result}=await run(t,{ignoreOrigin:true});
  assert.equal(result.ok,false);
  assert.equal(result.checks.find(c=>c.name==='forged-origin-refused').pass,false);
});
test('broken revision guard cannot produce false green',async t=>{
  const {result}=await run(t,{ignoreStale:true});
  assert.equal(result.ok,false);
  assert.equal(result.checks.find(c=>c.name==='stale-revision-refused').pass,false);
});
test('mutating the committed source seed is detected',async t=>{
  const {host,result}=await run(t,{mutateSeed:true});
  assert.equal(result.ok,false);
  assert.equal(result.checks.find(c=>c.name==='committed-seed-unchanged').pass,false);
  assert.notEqual(JSON.parse(readFileSync(path.join(host.root,host.seed),'utf8')).revision,1);
});
