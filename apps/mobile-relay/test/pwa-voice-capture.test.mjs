import test from 'node:test';
import assert from 'node:assert/strict';
import {mountVoiceCapture,MAX_VOICE_MS,MAX_VOICE_BYTES} from '../ux/voice-capture.mjs';

class Node {
  constructor(tag,doc){this.tagName=tag.toUpperCase();this.ownerDocument=doc;
    this.children=[];this.listeners={};this.attrs={};this.style={};this.textContent='';
    this.hidden=false;this.open=false;this.isConnected=true;}
  append(...xs){this.children.push(...xs)}
  setAttribute(k,v){this.attrs[k]=String(v);if(k==='open')this.open=true}
  removeAttribute(k){delete this.attrs[k];if(k==='open')this.open=false}
  addEventListener(k,cb){this.listeners[k]=cb}
  showModal(){this.open=true}
  close(){this.open=false}
  focus(){this.ownerDocument.activeElement=this}
  find(text){if(this.textContent===text)return this;
    for(const child of this.children){const found=child.find?.(text);if(found)return found}return null}
}
function fixture(){
  const doc={createElement(tag){return new Node(tag,doc)},addEventListener(k,cb){this[k]=cb}};
  doc.body=doc.createElement('body');doc.activeElement=doc.body;
  return doc;
}
class Recorder {
  static isTypeSupported(){return true}
  constructor(stream){this.stream=stream;this.state='inactive';this.mimeType='audio/webm'}
  start(){this.state='recording'}
  stop(){
    if(this.state!=='recording')return;
    this.state='inactive';
    this.ondataavailable?.({data:new Blob(['voice bytes'],{type:'audio/webm'})});
    this.onstop?.();
  }
}
test('recording starts only after explicit click, stays local and downloads only by owner action',async()=>{
 const doc=fixture(),files=[],stopped=[],urls=[];
 const capture=mountVoiceCapture({
   host:doc.body,Recorder,BlobCtor:Blob,
   devices:{async getUserMedia(args){assert.deepEqual(args,{audio:true});return {
     getTracks:()=>[{stop:()=>stopped.push('microphone stopped')}]
   }}},
   urlApi:{createObjectURL:()=>{const id='blob:test'+urls.length;urls.push(id);return id},
     revokeObjectURL:()=>{}},
   downloadFile:(name,blob)=>files.push({name,blob})
 });
 assert.equal(capture.available,true);
 assert.equal(MAX_VOICE_MS,30000);assert.equal(MAX_VOICE_BYTES,6*1024*1024);
 const dialog=doc.body.children[0];
 assert.equal(dialog.open,false);
 assert.equal(files.length,0);
 capture.open();assert.equal(dialog.open,true);
 dialog.find('Start recording').listeners.click();
 for(let i=0;i<4;i++)await Promise.resolve();
 assert.equal(capture.isRecording(),true);
 assert.equal(files.length,0);
 dialog.find('Stop recording').listeners.click();
 assert.equal(capture.isRecording(),false);
 assert.ok(stopped.length>0);
 assert.equal(files.length,0);
 assert.ok(dialog.find('Download audio').hidden===false);
 capture.close();
 assert.equal(dialog.open,true,'unsaved clip cannot be closed or silently discarded');
 dialog.find('Download audio').listeners.click();
 assert.equal(files.length,1);
 assert.equal(files[0].name,'vivim-voice-note.webm');
 capture.close();assert.equal(dialog.open,false);
});
test('unsupported microphone cannot start or request access',()=>{
 const doc=fixture(),capture=mountVoiceCapture({host:doc.body,devices:null,Recorder:null});
 assert.equal(capture.available,false);
 assert.equal(capture.open(),false);
});

test('pending microphone permission cannot start recording after close, cancel or hidden page',async()=>{
 for(const mode of ['close','cancel','hidden']){
  const doc=fixture();let finish,requests=0,stops=0;
  const capture=mountVoiceCapture({host:doc.body,Recorder,BlobCtor:Blob,devices:{getUserMedia(){requests++;return new Promise(r=>finish=r);}},urlApi:{createObjectURL:()=> 'blob:test',revokeObjectURL(){}}});
  capture.open();const dialog=doc.body.children[0],click=dialog.find('Start recording').listeners.click;
  click();click();assert.equal(requests,1,'one pending permission request');
  if(mode==='close')capture.close();else if(mode==='cancel')dialog.listeners.cancel({preventDefault(){}});else{doc.hidden=true;doc.visibilitychange();}
  finish({getTracks:()=>[{stop(){stops++;}}]});await Promise.resolve();await Promise.resolve();
  assert.equal(stops,1,mode);assert.equal(capture.isRecording(),false,mode);
 }
});
test('recorder error followed by final data never produces a downloadable clip',async()=>{
 const doc=fixture();let active;class BrokenRecorder extends Recorder{constructor(stream){super(stream);active=this;}}
 const capture=mountVoiceCapture({host:doc.body,Recorder:BrokenRecorder,BlobCtor:Blob,devices:{async getUserMedia(){return {getTracks:()=>[{stop(){}}]};}},urlApi:{createObjectURL:()=> 'blob:test',revokeObjectURL(){}}});
 capture.open();const dialog=doc.body.children[0];dialog.find('Start recording').listeners.click();await Promise.resolve();await Promise.resolve();
 active.onerror();assert.equal(capture.isRecording(),false);assert.equal(dialog.find('Download audio').hidden,true);
});
