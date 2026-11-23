import test from 'node:test';
import assert from 'node:assert/strict';
import {nativeTextFromPhone} from '../gpui-text-input-contract.mjs';
const frame=()=>({session:'a'.repeat(32),revision:7,width:360,height:800});
const make=(phase,text,sequence=1)=>nativeTextFromPhone(frame(),phase,text,sequence);

test('key press returns a typed GPUI input packet with no Host effect authority',()=>{
  const event=make('key-down','Enter');
  assert.deepEqual(event,{kind:'vivim.gpui.text/1',session:'a'.repeat(32),revision:7,
    sequence:1,phase:'key-down',text:'Enter'});
  assert.equal(Object.isFrozen(event),true);
  assert.equal(Object.hasOwn(event,'controlId'),false);
  assert.equal(Object.hasOwn(event,'approved'),false);
  assert.equal(Object.hasOwn(event,'execute'),false);
});
test('Unicode IME payload is preserved exactly and uses UTF-16 length',()=>{
  const value='é日本語🔹';
  assert.equal(make('ime-update',value).text,value);
  assert.equal(make('ime-commit',value).text,value);
  assert.equal(make('key-up','a').phase,'key-up');
});
test('empty IME start/cancel are inert, empty update or commit are refused',()=>{
  assert.equal(make('ime-start','').text,'');
  assert.equal(make('ime-cancel','').text,'');
  for(const phase of ['ime-update','ime-commit','key-down','key-up'])
    assert.throws(()=>make(phase,''),/INVALID_GPUI_TEXT_INPUT/);
  assert.throws(()=>make('ime-start','a'),/INVALID_GPUI_TEXT_INPUT/);
});
test('bounded UTF-16 length agrees with native Rust even for emoji',()=>{
  assert.equal(make('ime-commit','🔹'.repeat(512)).text.length,1024);
  assert.throws(()=>make('ime-commit','🔹'.repeat(513)),/INVALID_GPUI_TEXT_INPUT/);
  assert.throws(()=>make('key-down','A'.repeat(65)),/INVALID_GPUI_TEXT_INPUT/);
  assert.equal(make('key-down','A'.repeat(64)).text.length,64);
});
test('lone UTF-16 surrogates and control bytes fail closed',()=>{
  for(const bad of ['\ud800','\udc00','A\ud800B','\u0000','\r','\u001b'])
    assert.throws(()=>make('ime-commit',bad),/INVALID_GPUI_TEXT_INPUT/);
  assert.equal(make('ime-commit','one\ntwo').text,'one\ntwo');
  assert.equal(make('ime-commit','one\ttwo').text,'one\ttwo');
});
test('key events cannot silently inject multiline or tab composition',()=>{
  for(const text of ['Line\n2','A\tB'])
    assert.throws(()=>make('key-down',text),/INVALID_GPUI_TEXT_INPUT/);
});
test('unknown phase or unusable text is refused',()=>{
  assert.throws(()=>make('host-execute','a'),/INVALID_GPUI_TEXT_INPUT/);
  assert.throws(()=>nativeTextFromPhone(frame(),'key-down',null,1),/INVALID_GPUI_TEXT_INPUT/);
  assert.throws(()=>make('ime-start',null),/INVALID_GPUI_TEXT_INPUT/);
});
test('session, revision and dimensions are required for every keyboard event',()=>{
  const f=frame();
  for(const invalid of [{...f,session:'z'.repeat(32)},{...f,revision:0},
    {...f,width:0},{...f,height:4097},{}])
    assert.throws(()=>nativeTextFromPhone(invalid,'key-down','a',1),/INVALID_GPUI_TEXT_INPUT/);
});
test('sequence must be a nonnegative exact integer, with no locally invented focus identity',()=>{
  assert.equal(make('key-down','a',0).sequence,0);
  for(const seq of [-1,1.5,Number.MAX_SAFE_INTEGER+1,NaN])
    assert.throws(()=>make('key-down','a',seq),/INVALID_GPUI_TEXT_INPUT/);
  assert.equal(Object.keys(make('ime-commit','a')).sort().join(','),
    'kind,phase,revision,sequence,session,text');
});
