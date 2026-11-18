import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectShell,selectShell} from '../ux/shell-inspection.mjs';
function mounted(hidden=false){
  return {isConnected:true,hidden,attrs:new Map(),value:'private',textContent:'private',
    closest(){return this.hidden?this:null},getClientRects(){return this.hidden?[]:[{}]},
    setAttribute(k,v){this.attrs.set(k,v)},removeAttribute(k){this.attrs.delete(k)}};
}
test('inspection enumerates only real visible known shell mounts without content',()=>{
  const nodes={top:mounted(),text:mounted(),send:mounted(true),other:mounted()};
  const doc={getElementById:id=>nodes[id],querySelectorAll:()=>Object.values(nodes)};
  const rows=inspectShell(doc,'talk');
  assert.deepEqual(rows.map(r=>r.instanceId),['shell:top','shell:text']);
  assert.equal(JSON.stringify(rows).includes('private'),false);
  assert.equal(selectShell(doc,'talk',rows[1]),true);
  assert.equal(nodes.text.attrs.get('data-vivim-shell-inspected'),'true');
  assert.equal(selectShell(doc,'wiki',rows[1]),false);
  nodes.text.hidden=true;
  assert.equal(selectShell(doc,'talk',rows[1]),false);
});

test('native shell reports canonical identities without granting mutation authority',()=>{
  const doc={getElementById:id=>id==='text'?mounted():null};
  const [row]=inspectShell(doc,'talk');
  assert.equal(row.componentId,'vivim.ui.input.text-entry.textarea@1');
  assert.equal(row.settings.authority,'protected inspection only');
});
