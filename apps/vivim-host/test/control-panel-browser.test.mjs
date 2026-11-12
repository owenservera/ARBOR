import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const js = readFileSync(fileURLToPath(new URL('../public/control-panel.js', import.meta.url)), 'utf8');
class FakeNode {
  constructor(tag = 'div') {
    this.tagName = tag; this.children = []; this.listeners = new Map(); this.value = '';
    this.disabled = false; this.hidden = false; this.textContent = ''; this.type = '';
  }
  append(...nodes) { this.children.push(...nodes); }
  replaceChildren(...nodes) { this.children = [...nodes]; }
  addEventListener(name, cb) { this.listeners.set(name, cb); }
  async trigger(name, event = {}) { return this.listeners.get(name)?.(event); }
  focus() {}
}
const content = node => [node.textContent, ...node.children.map(x =>
  x instanceof FakeNode ? content(x) : String(x))].join(' ');
const find = (node, needle) => {
  if (node.tagName === 'button' && node.textContent.includes(needle)) return node;
  for (const child of node.children) if (child instanceof FakeNode) {
    const hit = find(child, needle); if (hit) return hit;
  }
  return null;
};
const tick = () => new Promise(resolve => setImmediate(resolve));

test('native session → exact text plan → explicit approval → receipt and lock', async () => {
  const ids = ['host-command-form','host-control-unlock','host-control-lock',
    'host-command-text','host-command-submit','host-control-examples','host-control-catalog',
    'host-control-result','host-control-recent','host-control-auth-status','host-control-refresh',
    'host-remember-preference','host-remember-review','host-preferences-list','host-preferences-refresh'];
  const nodes = new Map(ids.map(id => [id, new FakeNode(id)]));
  const calls = [];
  const code = 'a'.repeat(64), csrf = 'b'.repeat(64);
  const plan = { outcome:'approval_required',title:'Choose visual theme',actionId:'ui.theme.set_preset',
    risk:'R1',args:{preset:'dusk'},planId:'ctl-1234567890abcdef',
    planDigest:'c'.repeat(64),expiresAt:new Date(Date.now() + 300000).toISOString(),
    liveAcceptance:'pending' };
  const receipt = { schema:'vivim.control-receipt/1',planId:plan.planId,planDigest:plan.planDigest,
    actionId:plan.actionId,status:'applied',at:new Date().toISOString(),result:{preset:'dusk'},
    undo:{actionId:'ui.theme.undo',args:{}},liveAcceptance:'pending' };
  let cookie = false;
  const fakeFetch = async (url, opts = {}) => {
    calls.push({url,opts});
    const route = url.split('/control/')[1];
    if (route === 'ui-exchange') {
      assert.deepEqual(JSON.parse(opts.body),{code});
      cookie = true;
      return {ok:true,status:200,json:async () => ({csrf,expiresAt:Date.now()+900000})};
    }
    if (!cookie || (opts.method === 'POST' && opts.headers?.['x-vivim-ui-csrf'] !== csrf))
      return {ok:false,status:401,json:async () => ({code:'OWNER_AUTH'})};
    const data = route === 'catalog' ? {actions:[{actionId:plan.actionId,title:plan.title,
      risk:'R1',category:'appearance',executable:true,args:{preset:{type:'enum',values:['dusk','ink']}},
      examples:['set my theme to dusk']}]} :
      route === 'recent' ? {items:[{planId:plan.planId,actionId:plan.actionId,state:'applied',createdAt:receipt.at}]} :
      route === 'plan' && JSON.parse(opts.body).actionId === 'personalization.preference.list'
        ? {outcome:'done',result:{state:'source-backed',preferences:[{
          id:'prf-owner-pref-'+'a'.repeat(24),value:'Compact layouts',source:'owner'
        }]}} :
      route === 'plan' ? plan :
      route === 'execute' ? receipt :
      route === 'ui-logout' ? {revoked:true} :
      route === 'plans/' + plan.planId ? {planId:plan.planId,state:'applied',actionId:plan.actionId,receipt} : {};
    if (route === 'ui-logout') cookie = false;
    return {ok:true,status:200,json:async () => data};
  };
  const location = {hash:'#control-session='+code,pathname:'/',search:''};
  const history = {replaceState(_state,_title,url) { assert.equal(url,'/'); location.hash=''; }};
  const context = { document:{
      getElementById:id => nodes.get(id),
      createElement:tag => new FakeNode(tag),
      createTextNode:value => String(value)
    },window:{addEventListener(){},location,history},
    fetch:fakeFetch,console,Date,JSON,Map,Object,String,encodeURIComponent };
  vm.runInNewContext(js, context, {filename:'control-panel.js'});
  await tick(); await tick();
  assert.equal(location.hash,'','one-time launch code removed from visible URL');
  assert.equal(nodes.get('host-command-text').disabled,false);
  assert.match(nodes.get('host-control-auth-status').textContent,/Private desktop session/);
  assert.ok(calls.some(x => x.url.endsWith('/ui-exchange')));
  assert.ok(calls.some(x => x.url.endsWith('/catalog')));
  assert.doesNotMatch(js,/Bearer|localStorage|sessionStorage|document\.cookie/);
  const text = nodes.get('host-command-text'), form = nodes.get('host-command-form');
  text.value = 'set my theme to dusk';
  await form.trigger('submit', {preventDefault(){}});
  await tick();
  assert.equal(calls.filter(x => x.url.endsWith('/execute')).length,0);
  const approval = find(nodes.get('host-control-result'),'Approve & apply on PC');
  assert.ok(approval,'exact plan must be rendered for explicit confirmation');
  const planned = calls.find(x=>x.url.endsWith('/plan') && JSON.parse(x.opts.body).text);
  assert.deepEqual(JSON.parse(planned.opts.body),{text:'set my theme to dusk'});
  assert.equal(planned.opts.headers['x-vivim-ui-csrf'],csrf);
  await approval.trigger('click'); await tick();
  const executions = calls.filter(x=>x.url.endsWith('/execute'));
  assert.equal(executions.length,1);
  assert.deepEqual(JSON.parse(executions[0].opts.body),{planId:plan.planId,planDigest:plan.planDigest});
  assert.match(content(nodes.get('host-control-result')),/applied/i);
  assert.ok(find(nodes.get('host-control-result'),'Review undo'));
  const historic = find(nodes.get('host-control-recent'),'View receipt');
  assert.ok(historic);
  await historic.trigger('click');
  assert.ok(calls.some(x=>x.url.endsWith('/plans/' + plan.planId)));
  const quick=nodes.get('host-remember-preference');
  const review=nodes.get('host-remember-review');
  assert.equal(quick.disabled,false,'owner preference GUI unlocks with Host session');
  quick.value='Compact layouts with fewer animations';
  const beforeQuick=calls.filter(x=>x.url.endsWith('/execute')).length;
  await review.trigger('click');await tick();
  const lastPlan=calls.filter(x=>x.url.endsWith('/plan')).at(-1);
  assert.deepEqual(JSON.parse(lastPlan.opts.body),{
    actionId:'personalization.preference.add',
    args:{value:'Compact layouts with fewer animations'}
  });
  assert.equal(calls.filter(x=>x.url.endsWith('/execute')).length,beforeQuick,
    'quick preference still requires explicit review/approval');
  const remove=find(nodes.get('host-preferences-list'),'Review removal');
  assert.ok(remove,'saved owner preference is visible after authenticated read');
  await remove.trigger('click');await tick();
  const lastRemoval=calls.filter(x=>x.url.endsWith('/plan')).at(-1);
  assert.deepEqual(JSON.parse(lastRemoval.opts.body),{
    actionId:'personalization.preference.remove',
    args:{id:'prf-owner-pref-'+'a'.repeat(24)}
  });
  assert.equal(calls.filter(x=>x.url.endsWith('/execute')).length,beforeQuick,
    'reviewing removal cannot mutate before a separate approval');
  await nodes.get('host-control-lock').trigger('click');
  assert.equal(text.disabled,true);
  assert.equal(quick.disabled,true);
  assert.equal(review.disabled,true);
  assert.equal(cookie,false);
  assert.match(nodes.get('host-control-auth-status').textContent,/Locked/);
});
