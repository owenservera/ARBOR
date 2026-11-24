import test from 'node:test';
import assert from 'node:assert/strict';
import {mountGpuiPhonePage} from '../gpui-phone-mount.mjs';

class Element {
  constructor(tag){this.tag=tag;this.hidden=false;this.inert=false;this.style={};
    this.children=[];this.listeners=new Map();this.attrs={};this.value='';this.focused=false;
    this.textContent='';this.parent=null;}
  appendChild(el){this.children.push(el);el.parent=this;return el;}
  setAttribute(name,value){this.attrs[name]=value;}
  addEventListener(name,fn){this.listeners.set(name,fn);}
  removeEventListener(name,fn){if(this.listeners.get(name)===fn)this.listeners.delete(name);}
  emit(name,event={}){this.listeners.get(name)?.(event);}
  remove(){if(this.parent)this.parent.children.splice(this.parent.children.indexOf(this),1);}
  focus(){this.focused=true;}blur(){this.focused=false;}
}
function setup({direct=true,paired=true,legacyInert=false}={}){
  const body=new Element('body'),oldApp=new Element('app'),oldTop=new Element('top');
  oldApp.inert=legacyInert;oldTop.inert=legacyInert;
  const doc={body,createElement:name=>new Element(name),
    getElementById:id=>id==='app'?oldApp:id==='top'?oldTop:null};
  const win={innerWidth:360,innerHeight:800,listeners:new Map(),
    addEventListener(name,fn){this.listeners.set(name,fn);},
    removeEventListener(name){this.listeners.delete(name);},
    emit(name){this.listeners.get(name)?.();}};
  const transport={direct,deviceHeaders:()=>paired?{
    'x-vivim-grant-id':'a'.repeat(32),
    'x-vivim-device-session':'b'.repeat(32)}:null};
  let now=100000,callback,disposed=0,channelClosed=0,created=0,closeCallback;
  let frame=null,active=true;
  const fakeChannel=()=>{
    created++;
    return {status:()=>({active}),
      close(){channelClosed++;active=false;}};
  };
  const fakeViewport=({onStatus})=>{
    callback=onStatus;
    return {getFrame:()=>frame,
      isConnected:()=>paired&&Boolean(frame),
      dispose(){disposed++;frame=null;onStatus('disconnected');}};
  };
  const tasks=new Map();let intervalId=0;
  const page=mountGpuiPhonePage({transport,doc,win,makeChannel:fakeChannel,
    mountViewport:fakeViewport,every:(fn,delay)=>{tasks.set(++intervalId,{fn,delay});return intervalId;},
    stopEvery:id=>tasks.delete(id),now:()=>now});
  const stage=()=>body.children[0];
  const canvas=()=>stage().children[0];
  const textarea=()=>stage().children[1];
  const toolbar=()=>stage().children[2];
  return {page,doc,win,body,oldApp,oldTop,stage,canvas,textarea,toolbar,transport,
    paint:(next={session:'c'.repeat(32),revision:1,width:360,height:800})=>{
      frame=next;callback?.('painted');},
    nativeStatus:s=>callback?.(s),
    revoke:()=>{paired=false;},
    grant:()=>{paired=true;},
    rotateSession:()=>{transport.deviceHeaders=()=>({'x-vivim-grant-id':'f'.repeat(32),
      'x-vivim-device-session':'e'.repeat(32)});},
    tick:ms=>{now+=ms;for(const {fn} of tasks.values())fn();},
    get count(){return created;},
    get disposals(){return disposed;},
    get closedChannels(){return channelClosed;},
    get intervals(){return tasks.size;}};
}

test('Cloud or non-Direct phone retains legacy PWA with no duplicate renderer',()=>{
  const f=setup({direct:false});
  assert.equal(f.page.state().mode,'legacy');
  assert.equal(f.body.children.length,0);
  assert.equal(f.oldApp.inert,false);
  f.page.close();
});
test('unpaired Direct phone stays on existing safe shell, then starts channel after enrollment',()=>{
  const f=setup({paired:false});
  assert.equal(f.stage().hidden,true);
  assert.equal(f.count,0);
  f.grant();f.tick(3000);
  assert.equal(f.count,1);
  assert.equal(f.page.state().mode,'legacy');
  assert.equal(f.oldApp.inert,false);
  f.page.close();
});
test('actual native frame receipt covers old DOM and disables duplicate a11y product interactions',()=>{
  const f=setup();
  assert.equal(f.count,1);
  f.paint();
  assert.equal(f.stage().hidden,false);
  assert.equal(f.page.state().mode,'native-gpui');
  assert.equal(f.oldApp.inert,true);
  assert.equal(f.oldTop.inert,true);
  assert.equal(f.canvas().style.width,'360px');
  assert.equal(f.canvas().style.height,'800px');
  f.page.close();
  assert.equal(f.oldApp.inert,false);
  assert.equal(f.oldTop.inert,false);
});
test('native output is letterboxed preserving renderer aspect ratio, not stretched',()=>{
  const f=setup();
  f.paint({session:'c'.repeat(32),revision:1,width:960,height:720});
  assert.equal(f.canvas().style.width,'360px');
  assert.equal(f.canvas().style.height,'270px');
  f.win.innerWidth=400;
  f.win.emit('resize');
  assert.equal(f.canvas().style.width,'400px');
  assert.equal(f.canvas().style.height,'300px');
  f.page.close();
});
test('loss of native frame restores legacy shell and clears keyboard without effects',()=>{
  const f=setup();
  f.paint();f.textarea().value='sensitive phone text';
  f.nativeStatus('disconnected');
  assert.equal(f.stage().hidden,true);
  assert.equal(f.oldApp.inert,false);
  assert.equal(f.page.state().mode,'legacy');
  assert.equal(f.textarea().value,'');
  f.page.close();
});
test('phone keyboard affordance focuses only an existing hidden browser text input',()=>{
  const f=setup();
  f.paint();
  const tools=f.toolbar();
  assert.equal(tools.children[1].attrs['aria-label'],'Show phone keyboard for native GPUI');
  tools.children[1].emit('click');
  assert.equal(f.textarea().focused,true);
  assert.equal(f.body.children.length,1);
  f.page.close();
});
test('physical device grant loss releases native view and leaves no private overlay visible',()=>{
  const f=setup();
  f.paint();f.revoke();f.tick(3000);
  assert.equal(f.stage().hidden,true);
  assert.equal(f.page.state().mode,'legacy');
  assert.equal(f.page.state().grantPresent,false);
  assert.equal(f.disposals,1);
  assert.equal(f.closedChannels,1);
  f.page.close();
});
test('consented old PWA inert state is restored exactly when GPUI disconnects',()=>{
  const f=setup({legacyInert:true});
  f.paint();f.nativeStatus('disconnected');
  assert.equal(f.oldApp.inert,true);
  assert.equal(f.oldTop.inert,true);
  f.page.close();
});
test('unmount is idempotent and cancels interval/resize and keyboard listeners',()=>{
  const f=setup();
  f.paint();f.page.close();f.page.close();
  assert.equal(f.body.children.length,0);
  assert.equal(f.intervals,0);
  assert.equal(f.win.listeners.size,0);
  assert.equal(f.oldApp.inert,false);
  assert.equal(f.disposals,1);
  assert.equal(f.closedChannels,1);
});
