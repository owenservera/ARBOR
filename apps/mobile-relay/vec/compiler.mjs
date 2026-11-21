// VEC core/0.1: one pure compilation boundary, three owner-preserving adapters.
// Source text is NOT an execution or grant token. Only a trusted caller supplies the domain
// and adapters; no input may install a compiler, authorize an action or select a publisher.
// @hq:type vivim.vec-compile@0.1
export const VEC_COMPILE_SCHEMA = 'vivim.vec-compile/0.1';
export const VEC_DOMAINS = Object.freeze(['wiki', 'command', 'ui']);
export const VEC_PRODUCTS = Object.freeze({
  wiki: 'wiki-projection',
  command: 'command-plan',
  ui: 'ui-revision-proposal'
});
// Canonical proposal schemas, not new runtime types. They also anchor the existing
// HQ source-comment index. A source identity is never an execution credential.
const PRODUCT_SCHEMAS = Object.freeze({
  wiki: 'hq.wiki-program/1', command: 'vivim.command-intent/0.1', ui: 'vivim.ui-proposal/1'
});
// Rust/WASM admits the exact same inert VEC envelope when installed.
let rustAdmission=null, rustStatus=null;
export function vecAdmissionRuntimeStatus(){
  return rustStatus?.() ?? {state:'unavailable',code:typeof window==='undefined'?'NON_BROWSER_RUNTIME':'WASM_NOT_INITIALIZED',fallback:'trusted-js'};
}

if(typeof window!=='undefined'){
  void import('/mobile/vec-engines/rust-wasm.mjs')
    .then(module=>{
      rustAdmission=module.rustVecAdmission;
      rustStatus=module.rustUiEngineStatus;
      return module.initializeRustUiEngine();
    }).catch(()=>{});
}
const canonical=v=>Array.isArray(v)?v.map(canonical):
  v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(
    key=>[key,canonical(v[key])])):v;
function semanticId(schema) {
  const at = schema.lastIndexOf('/');
  return schema.slice(0, at) + '@' + schema.slice(at + 1);
}
const STATES = new Set(['candidate', 'clarification_required', 'unsupported', 'refused']);
const plain = value => value !== null && typeof value === 'object' && !Array.isArray(value) &&
  (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
const fail = (domain, outcome, code) => ({
  schema: VEC_COMPILE_SCHEMA, domain, product: VEC_PRODUCTS[domain] ?? null,
  outcome, code, authorization: 'none', executed: false, persisted: false
});

// Count UTF-8 code bytes without depending on runtime-specific encoders.
// A lone surrogate cannot be sent as a canonical Rust UTF-8 string.
function codeBytes(value){
  let bytes=0;
  for(const ch of value){
    const point=ch.codePointAt(0);
    if(point>=0xd800&&point<=0xdfff)return Infinity;
    bytes+=point<0x80?1:point<0x800?2:point<0x10000?3:4;
  }
  return bytes;
}

/** Register only trusted first-party adapters; wiki and command keep their incumbent
 * owners until source parity is independently established. No fallback silently runs. */
// Rust admission is authoritative when available. A comparison with the
// incumbent pure fallback is retained until real deployed input parity closes.
function admitOrFallback(input,legacy){
  const wasReady=rustStatus?.()?.fallback==='none';
  const native=rustAdmission?.(input);
  // Native runtime failed mid-admission: refuse rather than silently reroute.
  if(native===undefined)return wasReady
    ?fail(VEC_DOMAINS.includes(input.domain)?input.domain:null,'refused','RUST_VEC_UNAVAILABLE')
    :legacy;
  if(JSON.stringify(canonical(native))!==JSON.stringify(canonical(legacy)))
    return fail(VEC_DOMAINS.includes(input.domain)?input.domain:null,'refused','RUST_VEC_ADMISSION_MISMATCH');
  return native;
}

// Source metadata is admitted from existing Host readback; no rendering, effects
// or native-IR authenticity is claimed by this purely local revision fence.
export function createVecBindingFence(ids=[]){
  if(!Array.isArray(ids)||ids.length>32||new Set(ids).size!==ids.length||
      ids.some(id=>typeof id!=='string'||!id||id.length>80))
    throw new TypeError('INVALID_VEC_BINDING_SET');
  const allowed=new Set(ids),high=new Map();
  const blocked=code=>({state:'blocked',code,revisions:[]});
  const revision=n=>Number.isSafeInteger(n)&&n>=0&&n<=1_000_000_000;
  function fingerprint(value){
    const seen=new Set();let count=0;
    function ordered(v,depth){
      if(++count>1024||depth>12)throw Error('BOUND');
      if(v===null||typeof v==='boolean'||typeof v==='number'&&Number.isFinite(v))return v;
      if(typeof v==='string'&&v.length<=1024&&!/[\u0000-\u001f\u007f]/.test(v))return v;
      if(!v||typeof v!=='object'||seen.has(v))throw Error('INVALID');
      if(Array.isArray(v)){
        if(v.length>32)throw Error('BOUND');
        seen.add(v);const out=[];
        for(let i=0;i<v.length;i++){if(!Object.hasOwn(v,i))throw Error('HOLE');out.push(ordered(v[i],depth+1));}
        seen.delete(v);return out;
      }
      if(!plain(v))throw Error('INVALID');
      const keys=Reflect.ownKeys(v);
      if(keys.length>128||keys.some(k=>typeof k!=='string'||['__proto__','constructor','prototype'].includes(k)))
        throw Error('INVALID_KEY');
      seen.add(v);const out=Object.create(null);
      for(const key of keys.sort()){
        const desc=Object.getOwnPropertyDescriptor(v,key);
        if(!desc||!Object.hasOwn(desc,'value'))throw Error('ACCESSOR');
        out[key]=ordered(desc.value,depth+1);
      }
      seen.delete(v);return out;
    }
    try{
      const text=JSON.stringify(ordered(value,0));
      return text&&text.length<=65536?text:null;
    }catch{return null;}
  }
  return Object.freeze({
    prepare(data){
      if(data===null)return {state:'unavailable',code:'SOURCE_UNAVAILABLE',revisions:[]};
      if(!plain(data)||Object.keys(data).some(key=>!allowed.has(key)))
        return blocked('INVALID_LIVE_BINDINGS');
      const incoming=new Map(),personal=new Set();
      for(const [id,row] of Object.entries(data)){
        if(!plain(row))return blocked('INVALID_LIVE_BINDING');
        if(row.state==='unavailable')continue;
        if(row.state!=='source-backed'||!revision(row.revision)||!revision(row.total)||
           !Array.isArray(row.items)||row.items.length>16||row.items.length>row.total||
           row.items.some(item=>!plain(item)||typeof item.label!=='string'||!item.label||
              item.label.length>100||typeof item.detail!=='string'||!item.detail||item.detail.length>512))
          return blocked('INVALID_LIVE_BINDING');
        const signature=fingerprint(row);
        if(!signature)return blocked('INVALID_LIVE_BINDING');
        const prior=high.get(id);
        if(prior&&(row.revision<prior.revision||
            row.revision===prior.revision&&prior.signature!==signature))
          return blocked('LIVE_BINDING_REVISION_CONFLICT');
        if(id.startsWith('personal.'))personal.add(row.revision);
        incoming.set(id,{revision:row.revision,signature});
      }
      if(personal.size>1)return blocked('WIKI_BINDING_REVISION_CONFLICT');
      const revisions=Object.freeze([...incoming].sort(([a],[b])=>a.localeCompare(b))
        .map(([id,mark])=>Object.freeze({id,revision:mark.revision})));
      return {state:'ready',code:'NONE',revisions,
        commit(){
          for(const [id,mark] of incoming){
            const prior=high.get(id);
            if(prior&&(mark.revision<prior.revision||
               mark.revision===prior.revision&&prior.signature!==mark.signature))return false;
          }
          for(const [id,mark] of incoming)high.set(id,mark);
          return true;
        }};
    },
    status(){return Object.freeze([...high].sort(([a],[b])=>a.localeCompare(b))
      .map(([id,mark])=>Object.freeze({id,revision:mark.revision})))}
  });
}

/** Trusted adapters remain the only grammar owners; no Host write or grant. */
export function createVecCompiler({adapters={}}={}){
  if(!plain(adapters)||Object.keys(adapters).some(k=>!VEC_DOMAINS.includes(k)||typeof adapters[k]!=='function'))
    throw new TypeError('VEC_INVALID_ADAPTERS');
  const installed=Object.freeze({...adapters});
  return Object.freeze({
    compile({domain,text,context={}}={}){
      const input={domain,text,contextValid:plain(context),
        adapterInstalled:Object.hasOwn(installed,domain)};
      if(!VEC_DOMAINS.includes(domain))
        return admitOrFallback(input,fail(null,'refused','UNKNOWN_DOMAIN'));
      if(typeof text!=='string'||!text.trim()||text.length>4096||
          /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(text))
        return admitOrFallback(input,fail(domain,'refused','INVALID_INPUT'));
      if(!plain(context))
        return admitOrFallback(input,fail(domain,'refused','INVALID_CONTEXT'));
      if(!input.adapterInstalled)
        return admitOrFallback(input,{...fail(domain,'unsupported','LEGACY_OWNER_NOT_MIGRATED'),
          legacyOwner:PRODUCT_SCHEMAS[domain]});
      let result;
      try{result=installed[domain]({...context,text});}
      catch{return admitOrFallback({...input,adapterFailed:true},fail(domain,'refused','ADAPTER_FAILURE'));}
      if(!plain(result)||!STATES.has(result.outcome))
        return admitOrFallback({...input,adapterResult:result},fail(domain,'refused','ADAPTER_INVALID_RESULT'));
      const {outcome,code,proposal,preview,summary,detail}=result;
      // Match Rust admission even when browser WASM is missing. Only bounded,
      // control-free machine codes may leave the trusted adapter boundary.
      if(code!==undefined&&code!==null&&
        (typeof code!=='string'||code.length===0||codeBytes(code)>128||
         /\p{Cc}/u.test(code)))
        return admitOrFallback({...input,adapterResult:result},
          fail(domain,'refused','ADAPTER_INVALID_RESULT'));
      const sourceSemanticIds=outcome==='candidate'&&plain(proposal)&&
        proposal.schema===PRODUCT_SCHEMAS[domain]
        ?[semanticId(VEC_COMPILE_SCHEMA),semanticId(PRODUCT_SCHEMAS[domain])]:null;
      const legacy={...fail(domain,outcome,code??'NONE'),
        ...(sourceSemanticIds?{sourceSemanticIds}:{}),
        ...(proposal===undefined?{}:{proposal}),
        ...(preview===undefined?{}:{preview}),
        ...(summary===undefined?{}:{summary}),
        ...(detail===undefined?{}:{detail})};
      return admitOrFallback({...input,adapterResult:result},legacy);
    }
  });
}
