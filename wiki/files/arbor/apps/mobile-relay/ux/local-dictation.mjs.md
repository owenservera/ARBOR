# File: apps/mobile-relay/ux/local-dictation.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/mobile-relay/ux/local-dictation.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 4101 B |
| Lines | 53 |
| Hash | f061b1246510 |
| Test | no |
| Generated | no |
| Component | mobile-relay |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| DICTATION_LIMIT | const | 3 | yes | export const DICTATION_LIMIT=1200; |
| createLocalDictation | function | 4 | yes | export function createLocalDictation({Recognition=globalThis.SpeechRecognition??globalThis.webkitSpeechRecognition, onState=()=&gt;{},onText=()=&gt;{},canListen=()=&gt;true,timeoutMs=30000}={}){ |
| generation | variable | 6 | no | let generation=0,recognizer=null,timer=null,readyLang=null,phase=&#39;idle&#39;; |
| supported | const | 7 | no | const supported=typeof Recognition===&#39;function&#39;&amp;&amp;typeof Recognition.available===&#39;function&#39;&amp;&amp; |
| report | function | 9 | no | function report(state,detail=&#39;&#39;){phase=state;onState({state,detail});return state;} |
| clearTimer | function | 10 | no | function clearTimer(){if(timer!==null)clearTimeout(timer);timer=null;} |
| cancel | function | 11 | no | function cancel(){generation++;clearTimer();const old=recognizer;recognizer=null;readyLang=null; |
| check | function | 13 | no | async function check(lang){ |
| available | variable | 16 | no | let available;try{available=await Recognition.available({langs:[lang],processLocally:true});}catch{available=&#39;unavailable&#39;;} |
| start | function | 21 | no | function start(){ |
| r | variable | 23 | no | let r;const token=++generation; |
| finish | function | 28 | no | function finish(state,detail=&#39;&#39;){if(token!==generation\|\|recognizer!==r)return;clearTimer();recognizer=null;readyLang=null;report(state,detail);} |
| row | const | 33 | no | const row=e.results[i],txt=row?.[0]?.transcript; |
| joined | const | 39 | no | const joined=[...fragments.entries()].sort((a,b)=&gt;a[0]-b[0]).map(x=&gt;x[1]).join(&#39; &#39;).trim(); |
| stop | function | 49 | no | function stop(){if(!recognizer\|\|phase!==&#39;listening&#39;)return false;const r=recognizer;clearTimer();report(&#39;stopping&#39;); |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [apps/mobile-relay/test/local-dictation.test.mjs](../test/local-dictation.test.mjs.md) | ../ux/local-dictation.mjs |
| [apps/mobile-relay/ux/voice-capture.mjs](./voice-capture.mjs.md) | ./local-dictation.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Optional browser-provided on-device speech recognition. No remote fallback,
// model download, auto-save, Host upload or provider invocation.
export const DICTATION_LIMIT=1200;
export function createLocalDictation({Recognition=globalThis.SpeechRecognition??globalThis.webkitSpeechRecognition,
  onState=()=>{},onText=()=>{},canListen=()=>true,timeoutMs=30000}={}){
  let generation=0,recognizer=null,timer=null,readyLang=null,phase='idle';
  const supported=typeof Recognition==='function'&&typeof Recognition.available==='function'&&
    'processLocally' in (Recognition.prototype??{});
  function report(state,detail=''){phase=state;onState({state,detail});return state;}
  function clearTimer(){if(timer!==null)clearTimeout(timer);timer=null;}
  function cancel(){generation++;clearTimer();const old=recognizer;recognizer=null;readyLang=null;
    if(old)try{old.abort();}catch{}report('idle');}
  async function check(lang){
    if(!supported||typeof lang!=='string'||!(/^[a-z]{2,3}(?:-[A-Z]{2})?$/).test(lang)){report('unavailable');return false;}
    cancel();const token=generation;report('checking');
    let available;try{available=await Recognition.available({langs:[lang],processLocally:true});}catch{available='unavailable';}
    if(token!==generation)return false;
    if(available!=='available'){report('unavailable',available==='downloadable'||available==='downloading'?'Local language pack not installed.':'Local speech recognition unavailable.');return false;}
    readyLang=lang;report('ready');return true;
  }
  function start(){
    if(!supported||phase!=='ready'||!readyLang||!canListen())return false;
    let r;const token=++generation;
    try{r=new Recognition();r.processLocally=true;if(r.processLocally!==true)throw Error('LOCAL_ONLY_UNAVAILABLE');
      r.lang=readyLang;r.continuous=true;r.interimResults=false;r.maxAlternatives=1;
    }catch{report('unavailable');return false;}
    recognizer=r;const fragments=new Map();let error=false;
    function finish(state,detail=''){if(token!==generation||recognizer!==r)return;clearTimer();recognizer=null;readyLang=null;report(state,detail);}
    r.onresult=e=>{
      if(token!==generation||recognizer!==r||error||!canListen())return;
      for(let i=e.resultIndex??0;i<(e.results?.length??0);i++){
        if(i>=128){error=true;cancel();report('error','Too many recognition fragments; no partial transcript transferred.');return;}
        const row=e.results[i],txt=row?.[0]?.transcript;
        if(row?.isFinal&&typeof txt==='string'){
          if(txt.length>DICTATION_LIMIT){error=true;cancel();report('error','Transcript exceeds local limit; no partial transcript transferred.');return;}
          fragments.set(i,txt.trim());
        }
      }
      const joined=[...fragments.entries()].sort((a,b)=>a[0]-b[0]).map(x=>x[1]).join(' ').trim();
      if(joined.length>DICTATION_LIMIT){error=true;cancel();report('error','Transcript exceeds local limit; no partial transcript transferred.');}
    };
    r.onerror=()=>{if(token!==generation||recognizer!==r)return;error=true;finish('error','Local recognition failed; remote recognition was not attempted.');try{r.abort();}catch{}};
    r.onend=()=>{if(token!==generation||recognizer!==r)return;const text=[...fragments.entries()].sort((a,b)=>a[0]-b[0]).map(x=>x[1]).join(' ').trim();
      if(error||!canListen()||!text){finish('idle');return;}finish('review');onText(text);};
    report('listening');
    try{r.start();if(recognizer===r)timer=setTimeout(()=>stop(),timeoutMs);return true;}
    catch{finish('error','Local recognition could not start.');return false;}
  }
  function stop(){if(!recognizer||phase!=='listening')return false;const r=recognizer;clearTimer();report('stopping');
    try{r.stop();if(recognizer===r)timer=setTimeout(()=>{if(recognizer===r){cancel();report('error','Local recognizer did not finish.');}},3000);return true;}
    catch{cancel();report('error','Local recognition could not stop.');return false;}}
  return Object.freeze({supported,check,start,stop,cancel,state:()=>phase});
}
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
