// Browser-local microphone capture and optional local-only dictation. No provider API,
// background recording, automatic transcript/task creation or upload to Host.
import {createLocalDictation} from './local-dictation.mjs';
export const VOICE_CAPTURE_SCHEMA='vivim.local-voice/1';
export const MAX_VOICE_MS=30_000;
export const MAX_VOICE_BYTES=6*1024*1024;
export function mountVoiceCapture({
  host,devices=globalThis.navigator?.mediaDevices,
  Recorder=globalThis.MediaRecorder,BlobCtor=globalThis.Blob,
  urlApi=globalThis.URL,downloadFile,onReviewedText=null,Recognition=globalThis.SpeechRecognition??globalThis.webkitSpeechRecognition
}={}){
  if(!host?.ownerDocument)throw new TypeError('VOICE_CAPTURE_HOST_REQUIRED');
  const doc=host.ownerDocument;
  const recordingAvailable=!!devices?.getUserMedia&&typeof Recorder==='function'&&typeof BlobCtor==='function';
  const make=(tag,cls,label)=>{const n=doc.createElement(tag);
    if(cls)n.className=cls;if(label!==undefined)n.textContent=label;return n};
  const dialog=make('dialog','voice-note-sheet');dialog.id='voice-capture-sheet';
  dialog.setAttribute('aria-label','Local voice note');
  const title=make('h2','','Record a local voice note');
  const description=make('p','muted',
    'Record audio locally or use supported on-device dictation. Dictation does not save a recording. Review the text before sending it to Quick capture; nothing is synced automatically.');
  const status=make('p','muted','Ready to record. Maximum 30 seconds.');status.setAttribute('role','status');
  const preview=make('audio','voice-preview');preview.controls=true;preview.hidden=true;
  const start=make('button','btn pri','Start recording');start.type='button';
  const stop=make('button','btn','Stop recording');stop.type='button';stop.hidden=true;
  const save=make('button','btn','Download audio');save.type='button';save.hidden=true;
  const discard=make('button','btn','Discard audio');discard.type='button';discard.hidden=true;
  const close=make('button','btn sm','Close');close.type='button';
  const controls=make('div','voice-note-actions');
  controls.append(start,stop,save,discard,close);
  dialog.append(title,description,status,preview,controls);
  const transcript=make('textarea','notes-input');transcript.maxLength=1200;transcript.rows=3;transcript.hidden=true;transcript.setAttribute('aria-label','Manually reviewed voice note text');transcript.placeholder='Type your own reviewed summary or transcript';
  const review=make('button','btn sm','Open reviewed text in Quick capture');review.type='button';review.hidden=true;
  let dictated=false;
  const dictationControls=make('div','voice-note-actions');
  const language=make('select','notes-input');language.setAttribute('aria-label','Local dictation language');
  for(const [code,label] of [['en-US','English'],['es-ES','Español'],['ca-ES','Català']]){const option=make('option','',label);option.value=code;language.append(option);}
  language.value='en-US';
  const checkSpeech=make('button','btn sm','Check local dictation');checkSpeech.type='button';
  const speak=make('button','btn pri','Start local dictation');speak.type='button';speak.hidden=true;
  const stopSpeech=make('button','btn','Stop dictation');stopSpeech.type='button';stopSpeech.hidden=true;
  const discardSpeech=make('button','btn sm','Discard dictated text');discardSpeech.type='button';discardSpeech.hidden=true;
  const dictation=createLocalDictation({Recognition,canListen:()=>dialog.open&&!doc.hidden&&!recorder&&!requesting&&!stopping,
    onState:({state,detail})=>{const active=['checking','listening','stopping'].includes(state);checkSpeech.disabled=active;language.disabled=active;speak.hidden=state!=='ready';stopSpeech.hidden=state!=='listening';
      start.disabled=active;close.disabled=state==='stopping';
      if(state!=='idle')status.textContent=detail||({checking:'Checking installed local speech pack…',ready:'Local speech is available. Tap Start to dictate.',listening:'Listening locally (30 seconds maximum).',stopping:'Finishing local dictation…',review:'Review your dictated text. Nothing was sent.',unavailable:'On-device speech unavailable; no remote fallback.',error:'Local dictation failed.'})[state]||state;},
    onText:text=>{dictated=true;transcript.value=text;transcript.hidden=false;review.hidden=false;discardSpeech.hidden=false;start.disabled=true;checkSpeech.disabled=true;language.disabled=true;}});
  const available=recordingAvailable||(dictation.supported&&typeof onReviewedText==='function');
  if(!recordingAvailable)start.hidden=true;
  if(dictation.supported&&typeof onReviewedText==='function'){
    dictationControls.append(language,checkSpeech,speak,stopSpeech,discardSpeech);dialog.append(dictationControls);
    checkSpeech.addEventListener('click',()=>{if(!clip&&!dictated&&!recorder&&!requesting&&!stopping)void dictation.check(language.value);});
    language.addEventListener('change',()=>dictation.cancel());
    speak.addEventListener('click',()=>{if(!clip&&!dictated&&!recorder&&!requesting&&!stopping)dictation.start();});
    stopSpeech.addEventListener('click',()=>dictation.stop());
    discardSpeech.addEventListener('click',()=>{dictation.cancel();dictated=false;transcript.value='';transcript.hidden=true;review.hidden=true;discardSpeech.hidden=true;status.textContent='Dictated text discarded.';});
  }
  if(typeof onReviewedText==='function'){dialog.append(transcript,review);review.addEventListener('click',()=>{
    if((!clip&&!dictated)||!transcript.value.trim()||transcript.value.length>1200)return;
    if(!dictated&&!downloaded){status.textContent='Download the audio first, or copy your text before discarding. Audio will not be uploaded.';return;}
    const text=transcript.value.trim();
    // Keep the reviewed text if the local notebook cannot accept the handoff.
    if(onReviewedText(text)===false){status.textContent='Quick capture unavailable; keep or copy this text.';return;}
    dictated=false;discardSpeech.hidden=true;closeDialog();
  });}
  host.append(dialog);
  let stream=null,recorder=null,chunks=[],size=0,clip=null,clipUrl=null,downloaded=false,timer=null;
  let previous=null,epoch=0,requesting=false,stopping=false,failed=false;
  const stopTracks=()=>{for(const t of stream?.getTracks?.()||[])t.stop();stream=null};
  const clearTimer=()=>{if(timer!==null)clearTimeout(timer);timer=null};
  function clearClip(){
    if(clipUrl){urlApi.revokeObjectURL?.(clipUrl);clipUrl=null}
    clip=null;preview.removeAttribute('src');preview.hidden=true;
    save.hidden=true;discard.hidden=true;downloaded=false;transcript.hidden=true;transcript.value='';review.hidden=true;
  }
  function controlsForRecording(active){
    start.hidden=active||!recordingAvailable;stop.hidden=!active;
    checkSpeech.disabled=active;language.disabled=active;
  }
  function stopRecording(){
    clearTimer();
    if(requesting){epoch++;requesting=false;start.disabled=false;}
    if(recorder?.state==='recording'){stopping=true;recorder.stop();}
    else if(!stopping)stopTracks();
  }
  async function startRecording(){
    if(!recordingAvailable||!dialog.open||doc.hidden||requesting||stopping||dictated||clip&&!downloaded||['checking','listening','stopping'].includes(dictation.state())||recorder?.state==='recording')return;
    dictation.cancel();checkSpeech.disabled=true;language.disabled=true;
    const token=++epoch;requesting=true;start.disabled=true;
    clearClip();status.textContent='Requesting browser microphone permission…';
    let opened;
    try{opened=await devices.getUserMedia({audio:true})}
    catch{if(token===epoch){requesting=false;start.disabled=false;checkSpeech.disabled=false;language.disabled=false;status.textContent='Microphone unavailable or permission denied. Nothing was recorded.';}return}
    if(token!==epoch || !dialog.open || doc.hidden){
      if(token===epoch){requesting=false;start.disabled=false;}
      for(const t of opened.getTracks?.()||[])t.stop();return;
    }
    requesting=false;start.disabled=false;failed=false;stream=opened;chunks=[];size=0;downloaded=false;
    try{
      const preferred=typeof Recorder.isTypeSupported==='function'&&
        Recorder.isTypeSupported('audio/webm;codecs=opus') ? {mimeType:'audio/webm;codecs=opus'}:undefined;
      recorder=new Recorder(stream,preferred);
      const current=recorder;
      current.ondataavailable=event=>{
        if(current!==recorder||failed)return;
        const part=event?.data;
        if(!part||typeof part.size!=='number'||part.size<=0)return;
        size+=part.size;
        if(size>MAX_VOICE_BYTES){
          failed=true;chunks=[];status.textContent='Recording exceeded the 6 MB limit; audio discarded.';
          stopRecording();return;
        }
        chunks.push(part);
      };
      current.onerror=()=>{
        if(current!==recorder)return;
        failed=true;chunks=[];status.textContent='Recording failed. No audio was saved.';
        stopRecording();
      };
      current.onstop=()=>{
        if(current!==recorder)return;
        clearTimer();stopTracks();controlsForRecording(false);
        recorder=null;stopping=false;
        if(failed||!chunks.length||size>MAX_VOICE_BYTES){chunks=[];return}
        const type=current.mimeType||'audio/webm';
        clip=new BlobCtor(chunks,{type});chunks=[];
        if(clip.size>MAX_VOICE_BYTES){clearClip();status.textContent='Audio exceeded limit.';return}
        clipUrl=urlApi.createObjectURL(clip);
        preview.src=clipUrl;preview.hidden=false;
        save.hidden=false;discard.hidden=false;
        if(typeof onReviewedText==='function'){transcript.hidden=false;review.hidden=false;}
        status.textContent='Preview, download or discard. No Host or AI received this audio.';
      };
      current.start(250);
      controlsForRecording(true);
      status.textContent='Recording on this device · tap Stop or wait up to 30 seconds.';
      timer=setTimeout(stopRecording,MAX_VOICE_MS);
    }catch{stopTracks();recorder=null;status.textContent='This browser could not start recording.'}
  }
  const download=downloadFile??((filename,blob)=>{
    const url=urlApi.createObjectURL(blob);
    const link=doc.createElement('a');link.href=url;link.download=filename;
    host.append(link);link.click();link.remove();
    setTimeout(()=>urlApi.revokeObjectURL(url),30000);
  });
  function saveClip(){
    if(!clip)return;
    const type=clip.type||'audio/webm';
    const ext=type.includes('mp4')?'m4a':type.includes('ogg')?'ogg':'webm';
    try{
      download('vivim-voice-note.'+ext,clip);
      downloaded=true;
      status.textContent='Download requested. Confirm it was saved on this device.';
    }catch{status.textContent='Download unavailable. Audio remains here until you discard it.'}
  }
  function discardClip(){
    if(recorder?.state==='recording'){stopRecording();return}
    clearClip();status.textContent='Local recording discarded. Nothing was sent.';
  }
  function open(){
    if(!available)return false;
    if(dialog.open)return true;
    previous=doc.activeElement;status.textContent='Ready to record. Maximum 30 seconds.';
    if(typeof dialog.showModal==='function')dialog.showModal();else dialog.setAttribute('open','');
    (recordingAvailable?start:checkSpeech).focus();return true;
  }
  function closeDialog(){
    if(dictated){status.textContent='Open the reviewed text in Quick capture or explicitly discard it before closing.';return;}
    dictation.cancel();
    if(stopping){status.textContent='Finishing recording. Review it before closing.';return;}
    if(recorder?.state==='recording'){
      stopRecording();status.textContent='Recording stopped. Review and download or discard before closing.';return;
    }
    if(clip&&!downloaded){
      status.textContent='Download or explicitly discard the recording before closing.';return;
    }
    epoch++;stopRecording();clearClip();
    if(dialog.open&&typeof dialog.close==='function')dialog.close();else dialog.removeAttribute('open');
    if(previous?.isConnected&&typeof previous.focus==='function')previous.focus();
    previous=null;
  }
  start.addEventListener('click',()=>void startRecording());
  stop.addEventListener('click',stopRecording);
  save.addEventListener('click',saveClip);
  discard.addEventListener('click',discardClip);
  close.addEventListener('click',closeDialog);
  dialog.addEventListener('cancel',event=>{
    if(dictated||dictation.state()!=='idle'||requesting||stopping||recorder?.state==='recording'||(clip&&!downloaded)){
      event.preventDefault();closeDialog();
    }
  });
  doc.addEventListener?.('visibilitychange',()=>{
    if(doc.hidden){if(requesting||recorder?.state==='recording')stopRecording();if(['checking','ready','listening','stopping'].includes(dictation.state()))dictation.cancel();}
  });
  // A live permission request, dictation, review or not-yet-discarded clip is
  // purely local. Never reload the shell while that work could be lost.
  return Object.freeze({available,open,stop:stopRecording,close:closeDialog,
    isRecording:()=>recorder?.state==='recording',
    hasPendingLocalWork:()=>dialog.open||requesting||stopping||!!clip||dictated||
      !!transcript.value?.trim()||recorder?.state==='recording'});
}
