// U04/S09: phone text is an INPUT EVENT to the ONE native GPUI renderer.
// This module creates inert, session/revision-fenced keyboard/IME packets;
// it does not choose a focused control, render a DOM composer, approve a Host
// action, send a provider message, or create a second input interpreter.
const PHASES=new Set(['key-down','key-up','ime-start','ime-update','ime-commit','ime-cancel']);
const validInt=n=>Number.isSafeInteger(n)&&n>=0;
function validFrame(frame){
  return frame && typeof frame.session==='string'&&/^[a-f0-9]{32}$/.test(frame.session)&&
    validInt(frame.revision)&&frame.revision>0&&
    validInt(frame.width)&&frame.width>=240&&frame.width<=4096&&
    validInt(frame.height)&&frame.height>=240&&frame.height<=4096;
}
function wellFormedUnicode(text){
  for(let i=0;i<text.length;i++){
    const n=text.charCodeAt(i);
    if(n>=0xd800&&n<=0xdbff){
      if(i+1>=text.length)return false;
      const next=text.charCodeAt(++i);
      if(next<0xdc00||next>0xdfff)return false;
    }else if(n>=0xdc00&&n<=0xdfff)return false;
  }
  return true;
}
export function nativeTextFromPhone(frame,phase,text,sequence){
  if(!validFrame(frame)||!PHASES.has(phase)||!validInt(sequence)||
     typeof text!=='string'||text.length>1024||!wellFormedUnicode(text)||
     /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(text)||
     text.includes('\r'))throw new Error('INVALID_GPUI_TEXT_INPUT');
  const len=text.length; // Browser UTF-16 units, same as native encode_utf16 count.
  const valid=phase==='ime-start'||phase==='ime-cancel'
    ? len===0
    : phase==='key-down'||phase==='key-up'
      ? len>0&&len<=64&&!text.includes('\n')&&!text.includes('\t')
      : len>0&&len<=1024;
  if(!valid)throw new Error('INVALID_GPUI_TEXT_INPUT');
  return Object.freeze({
    kind:'vivim.gpui.text/1',session:frame.session,revision:frame.revision,
    sequence,phase,text
  });
}
