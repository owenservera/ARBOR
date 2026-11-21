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

/** Register only trusted first-party adapters; wiki and command keep their incumbent
 * owners until source parity is independently established. No fallback silently runs. */
// Rust admission is authoritative when available. A comparison with the
// incumbent pure fallback is retained until real deployed input parity closes.
function admitOrFallback(input,legacy){
  const wasReady=rustStatus?.()?.state==='ready';
  const native=rustAdmission?.(input);
  // Native runtime failed mid-admission: refuse rather than silently reroute.
  if(native===undefined)return wasReady
    ?fail(VEC_DOMAINS.includes(input.domain)?input.domain:null,'refused','RUST_VEC_UNAVAILABLE')
    :legacy;
  if(JSON.stringify(canonical(native))!==JSON.stringify(canonical(legacy)))
    return fail(VEC_DOMAINS.includes(input.domain)?input.domain:null,'refused','RUST_VEC_ADMISSION_MISMATCH');
  return native;
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
