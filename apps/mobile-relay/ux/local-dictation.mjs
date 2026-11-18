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
