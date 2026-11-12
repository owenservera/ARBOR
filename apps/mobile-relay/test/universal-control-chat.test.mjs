import test from 'node:test';
import assert from 'node:assert/strict';
import { createControlChat, resolveLocalDestination } from '../control-chat.mjs';
import { createControlClient } from '../control-client.mjs';
import { readFileSync } from 'node:fs';

class Node {
  constructor(tag, doc) {
    this.tag = tag; this.ownerDocument = doc;
    this.children = []; this.textContent = ''; this.className = '';
    this.events = {}; this.style = {}; this.scrollTop = 0; this.scrollHeight = 0;
    this.classList = { add: name => { this.className += ' ' + name; } };
  }
  append(...children) { this.children.push(...children); }
  replaceChildren(...children) { this.children = children; }
  addEventListener(name, fn) { this.events[name] = fn; }
}
const fixture = () => {
  const document = {
    createElement: tag => new Node(tag, document),
    createDocumentFragment: () => new Node('#fragment', document)
  };
  const host = new Node('div', document);
  return { host };
};
function all(node) { return [node, ...node.children.flatMap(all)]; }
const buttons = host => all(host).filter(x => x.tag === 'button');
const displayed = host => all(host).map(x => x.textContent).join(' ');
const grant = {
  direct:true,
  deviceHeaders:()=>({'x-vivim-grant-id':'a'.repeat(32),'x-vivim-device-session':'b'.repeat(32)})
};
const plan = {
  outcome:'approval_required', planId:'ctl-'+'1'.repeat(16), planDigest:'2'.repeat(64),
  expiresAt:'2099-01-01T00:00:00.000Z', title:'Set theme', actionId:'ui.theme.set_preset',
  risk:'R1', args:{preset:'dusk'}, liveAcceptance:'verified'
};
const response = (data,status=200)=>({ok:status>=200&&status<300,status,
  json:async()=>data});

test('Talk plans a command through existing Host control; approval is the only execution gate',async()=>{
  const {host}=fixture();
  const paths=[];
  const fetchImpl = async (path,options)=>{
    paths.push([path,options]);
    if(path==='/mobile/connection.json') return response({direct:true,directOnly:true,cloudEnabled:false});
    if(path==='/mobile/api/control/plan') return response(plan);
    if(path==='/mobile/api/control/execute') return response({
      schema:'vivim.control-receipt/1',planId:plan.planId,planDigest:plan.planDigest,actionId:plan.actionId,status:'applied'
    });
    throw Error('Unexpected: '+path);
  };
  const chat=createControlChat({host,transport:grant,fetchImpl});
  assert.equal(await chat.send('set my theme to dusk'),true);
  assert.match(displayed(host),/Set theme/);
  assert.equal(paths.filter(x=>x[0].endsWith('/execute')).length,0);
  const approve=buttons(host).find(x=>x.textContent==='Approve & apply');
  assert.ok(approve);
  approve.events.click();
  approve.events.click();
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(paths.filter(x=>x[0].endsWith('/execute')).length,1);
  const sent=paths.find(x=>x[0].endsWith('/execute'))[1];
  assert.deepEqual(JSON.parse(sent.body),{planId:plan.planId,planDigest:plan.planDigest});
  assert.match(displayed(host),/Host receipt/);
  assert.equal(buttons(host).some(x=>x.textContent==='Approve & apply'),false);
});

test('Cloud cannot activate control, even with owner text in Talk',async()=>{
  let calls=0;
  const {host}=fixture();
  const chat=createControlChat({host,transport:{direct:false,deviceHeaders:()=>null},
    fetchImpl:async()=>{calls++;throw Error('Cloud must not be called');}});
  await chat.send('show status');
  assert.equal(calls,0);
  assert.match(displayed(host),/Direct connection/);
  assert.equal(buttons(host).some(x=>x.textContent==='Approve & apply'),false);
});

test('Invalid plan is refused before presenting an approval button',async()=>{
  let executes=0;const {host}=fixture();
  const chat=createControlChat({host,transport:grant,fetchImpl:async path=>{
    if(path==='/mobile/connection.json')return response({direct:true,directOnly:true,cloudEnabled:false});
    if(path.endsWith('/plan'))return response({...plan,planDigest:'not-a-real-digest'});
    executes++;return response({});
  }});
  await chat.send('set my theme to dusk');
  assert.equal(executes,0);
  assert.match(displayed(host),/invalid approval plan/);
  assert.equal(buttons(host).some(x=>x.textContent==='Approve & apply'),false);
});

test('Execute network ambiguity is shown as uncertain and never automatically retried',async()=>{
  let executes=0;const {host}=fixture();
  const chat=createControlChat({host,transport:grant,fetchImpl:async path=>{
    if(path==='/mobile/connection.json')return response({direct:true,directOnly:true,cloudEnabled:false});
    if(path.endsWith('/plan'))return response(plan);
    if(path.endsWith('/execute')){executes++;throw Error('Network interruption');}
    throw Error('Unknown route');
  }});
  await chat.send('set my theme to dusk');
  buttons(host).find(x=>x.textContent==='Approve & apply').events.click();
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(executes,1);
  assert.match(displayed(host),/Outcome uncertain/);
  assert.equal(chat.clear(),false);
  assert.equal(buttons(host).some(x=>x.textContent==='Approve & apply'),false);
});

test('Talk reconciles uncertain execution by reading one exact Host receipt, never re-executing',async()=>{
  const {host}=fixture();
  let executed=0, statusReads=0;
  const receipt={schema:'vivim.control-receipt/1',planId:plan.planId,
    planDigest:plan.planDigest,actionId:plan.actionId,status:'applied'};
  const chat=createControlChat({host,transport:grant,fetchImpl:async path=>{
    if(path==='/mobile/connection.json')return response({direct:true,directOnly:true,cloudEnabled:false});
    if(path.endsWith('/plan'))return response(plan);
    if(path.endsWith('/execute')){executed++;throw Error('Execution response lost');}
    if(path.endsWith('/plans/'+plan.planId)){statusReads++;return response({planId:plan.planId,receipt});}
    throw Error('Unexpected route');
  }});
  await chat.send('set my theme to dusk');
  buttons(host).find(x=>x.textContent==='Approve & apply').events.click();
  await new Promise(resolve=>setImmediate(resolve));
  assert.match(displayed(host),/Outcome uncertain/);
  const review=buttons(host).find(x=>x.textContent==='Check PC receipt');
  assert.ok(review);
  review.events.click();
  review.events.click();
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(executed,1);
  assert.equal(statusReads,1);
  assert.match(displayed(host),/Reconciled Host receipt/);
  assert.equal(chat.clear(),true);
});

test('Current phone shell keeps provider Talk path separate and mobile navigation thumb-reachable',()=>{
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  const js=readFileSync(new URL('../app.js',import.meta.url),'utf8');
  assert.match(html,/<option value="vivim">VIVIM/);
  assert.match(html,/@media\(max-width:640px\)/);
  assert.match(html,/#tabs\{position:fixed/);
  assert.match(js,/if \(N\.target === 'vivim'\)/);
  assert.match(js,/void vivimChat\.send\(body\)/);
  assert.match(js,/if \(N\.target === 'phone'\) return nativeSend\(\)/);
  assert.match(js,/consumer: 'harness', mode: 'relay-chat'/);
});

test('Unrecognized commands offer explicit, never-auto-sent AI draft handoff',async()=>{
  const {host}=fixture();
  host.dispatchEvent = event => { host.lastEvent = event; return true; };
  let plans=0, executed=0;
  const chat=createControlChat({host,transport:grant,fetchImpl:async path=>{
    if(path==='/mobile/connection.json') return response({direct:true,directOnly:true,cloudEnabled:false});
    if(path.endsWith('/plan')) { plans++;return response({outcome:'interpretation_required'}); }
    executed++;throw Error('Unexpected effect');
  }});
  await chat.send('help me write a letter');
  assert.equal(plans,1); assert.equal(executed,0);
  const move=buttons(host).find(x=>x.textContent==='Ask my AI instead');
  assert.ok(move);
  move.events.click();
  assert.equal(host.lastEvent.type,'vivim:ask-ai-draft');
  assert.equal(host.lastEvent.detail.text,'help me write a letter');
  assert.equal(executed,0);
});

test('Natural language navigates only the fixed existing UI and never performs a Host effect',async()=>{
  assert.equal(resolveLocalDestination('  Open   World  '),'world');
  assert.equal(resolveLocalDestination('open media library'),'world');
  assert.equal(resolveLocalDestination('open build'),'build');
  assert.equal(resolveLocalDestination('capture a note'),'pocket');
  assert.equal(resolveLocalDestination('approve my phone grant'),null);
  assert.equal(resolveLocalDestination('open world and delete'),null);
  const {host}=fixture();
  let calls=0, pocket=0;
  const tabs=[];
  const chat=createControlChat({
    host,transport:{direct:false,deviceHeaders:()=>null},
    onNavigate:tab=>tabs.push(tab),onOpenPocket:()=>pocket++,
    fetchImpl:async()=>{calls++;throw Error('Navigation must not reach the network');}
  });
  await chat.send('open media library');
  await chat.send('open pocket');
  assert.deepEqual(tabs,['world']);
  assert.equal(pocket,1);
  assert.equal(calls,0);
});

test('Shared control transport refuses ungranted operations even on Direct',async()=>{
  const client=createControlClient({transport:{direct:true,deviceHeaders:()=>null},fetchImpl:
    async()=>response({direct:true,directOnly:true,cloudEnabled:false})});
  await assert.rejects(client.preview('show status'),{code:'DEVICE_GRANT_REQUIRED'});
});
