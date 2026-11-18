// Browser-local microphone capture. No speech recognition service, provider API,
// background recording, automatic transcript/task creation or upload to Host.
export const VOICE_CAPTURE_SCHEMA='vivim.local-voice/1';
export const MAX_VOICE_MS=30_000;
export const MAX_VOICE_BYTES=6*1024*1024;
export function mountVoiceCapture({
  host,devices=globalThis.navigator?.mediaDevices,
  Recorder=globalThis.MediaRecorder,BlobCtor=globalThis.Blob,
  urlApi=globalThis.URL,downloadFile,onReviewedText=null
}={}){
  if(!host?.ownerDocument)throw new TypeError('VOICE_CAPTURE_HOST_REQUIRED');
  const doc=host.ownerDocument;
  const available=!!devices?.getUserMedia&&typeof Recorder==='function'&&typeof BlobCtor==='function';
  const make=(tag,cls,label)=>{const n=doc.createElement(tag);
    if(cls)n.className=cls;if(label!==undefined)n.textContent=label;return n};
  const dialog=make('dialog','voice-note-sheet');dialog.id='voice-capture-sheet';
  dialog.setAttribute('aria-label','Local voice note');
  const title=make('h2','','Record a local voice note');
  const description=make('p','muted',
    'Audio stays in this browser until you download or discard it. No speech recognition is installed; you may type reviewed text and save it as a separate local note.');
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
  if(typeof onReviewedText==='function'){dialog.append(transcript,review);review.addEventListener('click',()=>{
    if(!clip||!transcript.value.trim()||transcript.value.length>1200)return;
    if(!downloaded){status.textContent='Download the audio first, or copy your text before discarding. Audio will not be uploaded.';return;}
    const text=transcript.value.trim();closeDialog();onReviewedText(text);
  });}
  host.append(dialog);
  let stream=null,recorder=null,chunks=[],size=0,clip=null,clipUrl=null,downloaded=false,timer=null;
  let previous=null,epoch=0;
  const stopTracks=()=>{for(const t of stream?.getTracks?.()||[])t.stop();stream=null};
  const clearTimer=()=>{if(timer!==null)clearTimeout(timer);timer=null};
  function clearClip(){
    if(clipUrl){urlApi.revokeObjectURL?.(clipUrl);clipUrl=null}
    clip=null;preview.removeAttribute('src');preview.hidden=true;
    save.hidden=true;discard.hidden=true;downloaded=false;transcript.hidden=true;transcript.value='';review.hidden=true;
  }
  function controlsForRecording(active){
    start.hidden=active;stop.hidden=!active;
  }
  function stopRecording(){
    clearTimer();
    if(recorder?.state==='recording')recorder.stop();
    else stopTracks();
  }
  async function startRecording(){
    if(!available||recorder?.state==='recording')return;
    const token=++epoch;
    clearClip();status.textContent='Requesting browser microphone permission…';
    let opened;
    try{opened=await devices.getUserMedia({audio:true})}
    catch{if(token===epoch)status.textContent='Microphone unavailable or permission denied. Nothing was recorded.';return}
    if(token!==epoch || !dialog.open){
      for(const t of opened.getTracks?.()||[])t.stop();return;
    }
    stream=opened;chunks=[];size=0;downloaded=false;
    try{
      const preferred=typeof Recorder.isTypeSupported==='function'&&
        Recorder.isTypeSupported('audio/webm;codecs=opus') ? {mimeType:'audio/webm;codecs=opus'}:undefined;
      recorder=new Recorder(stream,preferred);
      const current=recorder;
      current.ondataavailable=event=>{
        if(current!==recorder)return;
        const part=event?.data;
        if(!part||typeof part.size!=='number'||part.size<=0)return;
        size+=part.size;
        if(size>MAX_VOICE_BYTES){
          chunks=[];status.textContent='Recording exceeded the 6 MB limit; audio discarded.';
          stopRecording();return;
        }
        chunks.push(part);
      };
      current.onerror=()=>{
        if(current!==recorder)return;
        chunks=[];status.textContent='Recording failed. No audio was saved.';
        stopRecording();
      };
      current.onstop=()=>{
        if(current!==recorder)return;
        clearTimer();stopTracks();controlsForRecording(false);
        recorder=null;
        if(!chunks.length||size>MAX_VOICE_BYTES){chunks=[];return}
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
    start.focus();return true;
  }
  function closeDialog(){
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
    if(recorder?.state==='recording'||(clip&&!downloaded)){
      event.preventDefault();closeDialog();
    }
  });
  doc.addEventListener?.('visibilitychange',()=>{
    if(doc.hidden&&recorder?.state==='recording')stopRecording();
  });
  return Object.freeze({available,open,stop:stopRecording,close:closeDialog,isRecording:()=>recorder?.state==='recording'});
}
