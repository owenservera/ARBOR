import test from 'node:test';
import assert from 'node:assert/strict';
import {createLocalDictation} from '../ux/local-dictation.mjs';
class Recognition{
 static async available(opts){assert.equal(opts.processLocally,true);return 'available';}
 get processLocally(){return this.local??false}set processLocally(v){this.local=v;}
 start(){assert.equal(this.processLocally,true);Recognition.last=this;}
 stop(){this.onend?.()}abort(){this.aborted=true;}
}
test('on-device only recognition hands final text to review, never automatically saves',async()=>{
 const texts=[],states=[],d=createLocalDictation({Recognition,onText:x=>texts.push(x),onState:s=>states.push(s.state)});
 assert.equal(await d.check('es-ES'),true);assert.equal(d.start(),true);const r=Recognition.last;
 r.onresult({resultIndex:0,results:[Object.assign([{transcript:'Buy milk'}],{isFinal:true})]});assert.deepEqual(texts,[]);
 d.stop();assert.deepEqual(texts,['Buy milk']);assert.equal(d.state(),'review');assert.equal(r.lang,'es-ES');
});
test('no cloud fallback or pack installation; cancel invalidates late events',async()=>{
 class Unavailable extends Recognition{static async available(){return 'downloadable'}}
 const no=createLocalDictation({Recognition:Unavailable});assert.equal(await no.check('en-US'),false);assert.equal(no.start(),false);
 const texts=[],d=createLocalDictation({Recognition,onText:x=>texts.push(x)});await d.check('en-US');d.start();const r=Recognition.last;d.cancel();
 r.onresult({results:[Object.assign([{transcript:'late'}],{isFinal:true})]});r.onend();assert.deepEqual(texts,[]);assert.equal(r.aborted,true);
});
test('unavailable API and permission race fail closed',async()=>{
 const d=createLocalDictation({Recognition:class Legacy{}});assert.equal(d.supported,false);assert.equal(await d.check('en-US'),false);
 let resolve;class Pending extends Recognition{static available(){return new Promise(r=>resolve=r)}}
 const pending=createLocalDictation({Recognition:Pending});const p=pending.check('en-US');pending.cancel();resolve('available');assert.equal(await p,false);assert.equal(pending.start(),false);
});

test('overlong recognition is refused instead of silently truncating the reviewed note',async()=>{
 const texts=[],d=createLocalDictation({Recognition,onText:x=>texts.push(x)});await d.check('en-US');d.start();const r=Recognition.last;
 r.onresult({results:[Object.assign([{transcript:'x'.repeat(1201)}],{isFinal:true})]});r.onend();assert.equal(d.state(),'error');assert.deepEqual(texts,[]);
});
