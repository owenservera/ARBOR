# File: apps/mobile-relay/ux/voice-capture.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/mobile-relay/ux/voice-capture.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 13129 B |
| Lines | 196 |
| Hash | 2b5dbaed7fcc |
| Test | no |
| Generated | no |
| Component | mobile-relay |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| VOICE_CAPTURE_SCHEMA | const | 4 | yes | export const VOICE_CAPTURE_SCHEMA=&#39;vivim.local-voice/1&#39;; |
| MAX_VOICE_MS | const | 5 | yes | export const MAX_VOICE_MS=30_000; |
| MAX_VOICE_BYTES | const | 6 | yes | export const MAX_VOICE_BYTES=6*1024*1024; |
| mountVoiceCapture | function | 7 | yes | export function mountVoiceCapture({ host,devices=globalThis.navigator?.mediaDevices, Recorder=globalThis.MediaRecorder,BlobCtor=globalThis.Blob, urlApi=globalThis.URL,downloadFile,onReviewedText=null… |
| doc | const | 13 | no | const doc=host.ownerDocument; |
| recordingAvailable | const | 14 | no | const recordingAvailable=!!devices?.getUserMedia&amp;&amp;typeof Recorder===&#39;function&#39;&amp;&amp;typeof BlobCtor===&#39;function&#39;; |
| make | function | 15 | no | const make=(tag,cls,label)=&gt;{const n=doc.createElement(tag); |
| dialog | const | 17 | no | const dialog=make(&#39;dialog&#39;,&#39;voice-note-sheet&#39;);dialog.id=&#39;voice-capture-sheet&#39;; |
| title | const | 19 | no | const title=make(&#39;h2&#39;,&#39;&#39;,&#39;Record a local voice note&#39;); |
| description | const | 20 | no | const description=make(&#39;p&#39;,&#39;muted&#39;, &#39;Record audio locally or use supported on-device dictation. Dictation does not save a recording. Review the text before sending it to Quick capture; nothing is syn… |
| status | const | 22 | no | const status=make(&#39;p&#39;,&#39;muted&#39;,&#39;Ready to record. Maximum 30 seconds.&#39;);status.setAttribute(&#39;role&#39;,&#39;status&#39;); |
| preview | const | 23 | no | const preview=make(&#39;audio&#39;,&#39;voice-preview&#39;);preview.controls=true;preview.hidden=true; |
| start | const | 24 | no | const start=make(&#39;button&#39;,&#39;btn pri&#39;,&#39;Start recording&#39;);start.type=&#39;button&#39;; |
| stop | const | 25 | no | const stop=make(&#39;button&#39;,&#39;btn&#39;,&#39;Stop recording&#39;);stop.type=&#39;button&#39;;stop.hidden=true; |
| save | const | 26 | no | const save=make(&#39;button&#39;,&#39;btn&#39;,&#39;Download audio&#39;);save.type=&#39;button&#39;;save.hidden=true; |
| discard | const | 27 | no | const discard=make(&#39;button&#39;,&#39;btn&#39;,&#39;Discard audio&#39;);discard.type=&#39;button&#39;;discard.hidden=true; |
| close | const | 28 | no | const close=make(&#39;button&#39;,&#39;btn sm&#39;,&#39;Close&#39;);close.type=&#39;button&#39;; |
| controls | const | 29 | no | const controls=make(&#39;div&#39;,&#39;voice-note-actions&#39;); |
| transcript | const | 32 | no | const transcript=make(&#39;textarea&#39;,&#39;notes-input&#39;);transcript.maxLength=1200;transcript.rows=3;transcript.hidden=true;transcript.setAttribute(&#39;aria-label&#39;,&#39;Manually reviewed voice note text&#39;);transcript… |
| review | const | 33 | no | const review=make(&#39;button&#39;,&#39;btn sm&#39;,&#39;Open reviewed text in Quick capture&#39;);review.type=&#39;button&#39;;review.hidden=true; |
| dictated | variable | 34 | no | let dictated=false; |
| dictationControls | const | 35 | no | const dictationControls=make(&#39;div&#39;,&#39;voice-note-actions&#39;); |
| language | const | 36 | no | const language=make(&#39;select&#39;,&#39;notes-input&#39;);language.setAttribute(&#39;aria-label&#39;,&#39;Local dictation language&#39;); |
| checkSpeech | const | 39 | no | const checkSpeech=make(&#39;button&#39;,&#39;btn sm&#39;,&#39;Check local dictation&#39;);checkSpeech.type=&#39;button&#39;; |
| speak | const | 40 | no | const speak=make(&#39;button&#39;,&#39;btn pri&#39;,&#39;Start local dictation&#39;);speak.type=&#39;button&#39;;speak.hidden=true; |
| stopSpeech | const | 41 | no | const stopSpeech=make(&#39;button&#39;,&#39;btn&#39;,&#39;Stop dictation&#39;);stopSpeech.type=&#39;button&#39;;stopSpeech.hidden=true; |
| discardSpeech | const | 42 | no | const discardSpeech=make(&#39;button&#39;,&#39;btn sm&#39;,&#39;Discard dictated text&#39;);discardSpeech.type=&#39;button&#39;;discardSpeech.hidden=true; |
| dictation | const | 43 | no | const dictation=createLocalDictation({Recognition,canListen:()=&gt;dialog.open&amp;&amp;!doc.hidden&amp;&amp;!recorder&amp;&amp;!requesting&amp;&amp;!stopping, onState:({state,detail})=&gt;{const active=[&#39;checking&#39;,&#39;listening&#39;,&#39;stopping&#39;… |
| available | const | 48 | no | const available=recordingAvailable\|\|(dictation.supported&amp;&amp;typeof onReviewedText===&#39;function&#39;); |
| text | const | 61 | no | const text=transcript.value.trim(); |
| stream | variable | 67 | no | let stream=null,recorder=null,chunks=[],size=0,clip=null,clipUrl=null,downloaded=false,timer=null; |
| previous | variable | 68 | no | let previous=null,epoch=0,requesting=false,stopping=false,failed=false; |
| stopTracks | function | 69 | no | const stopTracks=()=&gt;{for(const t of stream?.getTracks?.()\|\|[])t.stop();stream=null}; |
| clearTimer | function | 70 | no | const clearTimer=()=&gt;{if(timer!==null)clearTimeout(timer);timer=null}; |
| clearClip | function | 71 | no | function clearClip(){ |
| controlsForRecording | function | 76 | no | function controlsForRecording(active){ |
| stopRecording | function | 80 | no | function stopRecording(){ |
| startRecording | function | 86 | no | async function startRecording(){ |
| token | const | 89 | no | const token=++epoch;requesting=true;start.disabled=true; |
| opened | variable | 91 | no | let opened; |
| preferred | const | 100 | no | const preferred=typeof Recorder.isTypeSupported===&#39;function&#39;&amp;&amp; |
| current | const | 103 | no | const current=recorder; |
| part | const | 106 | no | const part=event?.data; |
| download | const | 140 | no | const download=downloadFile??((filename,blob)=&gt;{ const url=urlApi.createObjectURL(blob); const link=doc.createElement(&#39;a&#39;);link.href=url;link.download=filename; host.append(link);link.click();link.re… |
| url | const | 141 | no | const url=urlApi.createObjectURL(blob); |
| link | const | 142 | no | const link=doc.createElement(&#39;a&#39;);link.href=url;link.download=filename; |
| saveClip | function | 146 | no | function saveClip(){ |
| ext | const | 149 | no | const ext=type.includes(&#39;mp4&#39;)?&#39;m4a&#39;:type.includes(&#39;ogg&#39;)?&#39;ogg&#39;:&#39;webm&#39;; |
| discardClip | function | 156 | no | function discardClip(){ |
| open | function | 160 | no | function open(){ |
| closeDialog | function | 167 | no | function closeDialog(){ |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./local-dictation.mjs | import | 3 | [apps/mobile-relay/ux/local-dictation.mjs](./local-dictation.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [apps/mobile-relay/app.js](../app.js.md) | ./ux/voice-capture.mjs |
| [apps/mobile-relay/test/pwa-voice-capture.test.mjs](../test/pwa-voice-capture.test.mjs.md) | ../ux/voice-capture.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
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
```

_First 80 of 197 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
