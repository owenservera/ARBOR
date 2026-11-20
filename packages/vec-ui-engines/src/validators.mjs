import {rustUiValue} from './rust-wasm.mjs';
// Pure typed value validation shared by all VEC UI engines.
// No DOM, CSS eval, network, filesystem, dynamic code, or access to Host grants.
export const VALUE_SCHEMA = 'vivim.ui-engine-value/1';
const TYPE_SET = new Set(['color','color-alpha','gradient','shadow','length','number',
  'integer','duration','vector2','vector3','transform','range','boolean','enum','token','ref','map']);
const ID = /^[a-z][a-z0-9_-]*(?:\.[a-z][a-z0-9_-]*){0,15}$/; // no URI scheme / arbitrary URL
const REF = /^[a-z][a-z0-9_-]*(?:\.[a-z][a-z0-9_-]*){0,15}$/;
const BAD_KEYS=new Set(['__proto__','prototype','constructor']);
export const plain = v => v!==null && typeof v==='object' && !Array.isArray(v) &&
  (Object.getPrototypeOf(v)===Object.prototype || Object.getPrototypeOf(v)===null);
export function fail(code){return {ok:false,code};}
function valueObject(v,keys) {
  if(!plain(v)||Object.keys(v).some(k=>!keys.includes(k)))return false;
  return true;
}
export function inertData(value,maxNodes=512) {
  const seen=new Set();let visited=0;
  function walk(v,depth) {
    if(++visited>maxNodes||depth>12)return false;
    if(v===null||typeof v==='boolean')return true;
    if(typeof v==='string')return v.length<=1024 && !/[\u0000-\u001f\u007f]/.test(v);
    if(typeof v==='number')return Number.isFinite(v);
    if(typeof v!=='object'||seen.has(v)||(!plain(v)&&!Array.isArray(v)))return false;
    seen.add(v);
    const keys=Reflect.ownKeys(v);if(keys.length>256)return false;
    if(Array.isArray(v)){
      if(v.length>128)return false;
      for(let i=0;i<v.length;i++)if(!Object.hasOwn(v,i))return false;
    }
    for(const k of keys){
      if(typeof k!=='string'||BAD_KEYS.has(k))return false;
      const d=Object.getOwnPropertyDescriptor(v,k);
      if(!d||!Object.hasOwn(d,'value')||!walk(d.value,depth+1))return false;
    }
    seen.delete(v);return true;
  }
  return walk(value,0);
}
const bounded=(v,a,b)=>typeof v==='number'&&Number.isFinite(v)&&v>=a&&v<=b;
function normColor(v){
  if(typeof v==='string'&&/^#[0-9a-fA-F]{6}(?:[0-9a-fA-F]{2})?$/.test(v))return v.toLowerCase();
  // Explicit structured color spaces; renderer must separately declare support.
  if(valueObject(v,['colorSpace','components','alpha']) &&
    ['srgb','display-p3','oklch'].includes(v.colorSpace) &&
    Array.isArray(v.components)&&v.components.length===3 &&
    v.components.every((x,i)=>v.colorSpace==='oklch'?
      (i===0?bounded(x,0,1):i===1?bounded(x,0,.4):bounded(x,0,360)):bounded(x,0,1)) &&
    (v.alpha===undefined||bounded(v.alpha,0,1)))
    return {colorSpace:v.colorSpace,components:[...v.components],...(v.alpha===undefined?{}:{alpha:v.alpha})};
  return null;
}
function normLength(v){
  if(!valueObject(v,['value','unit'])||!bounded(v.value,-4096,4096)||
    !['px','rem','em','%','vw','vh'].includes(v.unit))return null;
  return {value:v.value,unit:v.unit};
}
function normVector(v,n) {
  const keys=n===2?['x','y']:['x','y','z'];
  if(!valueObject(v,keys)||keys.some(k=>!bounded(v[k],-1e6,1e6)))return null;
  return Object.fromEntries(keys.map(k=>[k,v[k]]));
}
function validateUiValueJavaScript(type,value,{choices}={}) {
  if(!TYPE_SET.has(type))return fail('UNKNOWN_VALUE_TYPE');
  if(!inertData(value))return fail('NON_INERT_VALUE');
  if(type==='color'){const v=normColor(value);return v===null?fail('INVALID_COLOR'):{ok:true,value:v};}
  if(type==='color-alpha'){
    if(!valueObject(value,['color','alpha'])||!bounded(value.alpha,0,1))return fail('INVALID_COLOR_ALPHA');
    const c=normColor(value.color);return c===null?fail('INVALID_COLOR_ALPHA'):{ok:true,value:{color:c,alpha:value.alpha}};
  }
  if(type==='boolean')return typeof value==='boolean'?{ok:true,value}:fail('INVALID_BOOLEAN');
  if(type==='number'||type==='integer'||type==='duration'){
    const valid=type==='number'?bounded(value,-1e9,1e9):
      type==='integer'?Number.isSafeInteger(value)&&bounded(value,-1e6,1e6):
      Number.isSafeInteger(value)&&bounded(value,0,600000);
    return valid?{ok:true,value}:fail('INVALID_NUMBER');
  }
  if(type==='length'){const v=normLength(value);return v?{ok:true,value:v}:fail('INVALID_LENGTH');}
  if(type==='vector2'||type==='vector3'){const v=normVector(value,type==='vector2'?2:3);return v?{ok:true,value:v}:fail('INVALID_VECTOR');}
  if(type==='range'){
    if(!valueObject(value,['min','max','value','step'])||
      !bounded(value.min,-1e9,1e9)||!bounded(value.max,-1e9,1e9)||
      value.max<=value.min||!bounded(value.value,value.min,value.max)||
      (value.step!==undefined&&!bounded(value.step,Number.EPSILON,value.max-value.min)))return fail('INVALID_RANGE');
    return {ok:true,value:{...value}};
  }
  if(type==='token'||type==='ref'){
    if(typeof value!=='string'||!((type==='token'?REF:ID).test(value)))return fail('INVALID_REFERENCE');
    return {ok:true,value};
  }
  if(type==='enum'){
    // Declared enum values must be closed by a reviewed engine implementation.
    if(!Array.isArray(choices)||choices.length===0||choices.length>64||
      !choices.every(x=>typeof x==='string'&&x.length>0&&x.length<=80)||
      typeof value!=='string'||!choices.includes(value))return fail('ENUM_NOT_CLOSED_OR_VALUE_INVALID');
    return {ok:true,value};
  }
  if(type==='gradient'){
    if(!valueObject(value,['kind','angle','stops'])||!['linear','radial'].includes(value.kind)||
      !Array.isArray(value.stops)||value.stops.length<2||value.stops.length>16||
      (value.angle!==undefined&&!bounded(value.angle,-360,360)))return fail('INVALID_GRADIENT');
    let prev=-1;const stops=[];
    for(const s of value.stops){
      if(!valueObject(s,['at','color'])||!bounded(s.at,0,1)||s.at<prev)return fail('INVALID_GRADIENT');
      const c=normColor(s.color);if(c===null)return fail('INVALID_GRADIENT');
      stops.push({at:s.at,color:c});prev=s.at;
    }
    return {ok:true,value:{kind:value.kind,...(value.angle===undefined?{}:{angle:value.angle}),stops}};
  }
  if(type==='shadow'){
    if(!valueObject(value,['color','offsetX','offsetY','blur','spread','inset'])||
      (value.inset!==undefined&&typeof value.inset!=='boolean'))return fail('INVALID_SHADOW');
    const c=normColor(value.color);const x=normLength(value.offsetX),
      y=normLength(value.offsetY),blur=normLength(value.blur),spread=normLength(value.spread);
    return c===null||!x||!y||!blur||!spread||blur.value<0?
      fail('INVALID_SHADOW'):{ok:true,value:{color:c,offsetX:x,offsetY:y,blur,spread,inset:value.inset===true}};
  }
  if(type==='transform'){
    if(!valueObject(value,['translate','rotate','scale']))return fail('INVALID_TRANSFORM');
    const tr=value.translate===undefined?{x:0,y:0,z:0}:normVector(value.translate,3);
    const rot=value.rotate===undefined?{x:0,y:0,z:0}:normVector(value.rotate,3);
    const sc=value.scale===undefined?{x:1,y:1,z:1}:normVector(value.scale,3);
    if(!tr||!rot||!sc||Object.values(sc).some(x=>x<=0||x>100))return fail('INVALID_TRANSFORM');
    return {ok:true,value:{translate:tr,rotate:rot,scale:sc}};
  }
  if(type==='map'){
    if(!plain(value)||Object.keys(value).length>64)return fail('INVALID_MAP');
    const copy=JSON.stringify(value);
    if(copy.length>8192)return fail('INVALID_MAP');
    return {ok:true,value:JSON.parse(copy)};
  }
  return fail('TYPE_UNSUPPORTED');
}


// Rust owns the native value model. For now reject any browser/native
// disagreement instead of silently adopting a different normalization.
// Unpackaged PWAs retain the incumbent deterministic JS validator.
const stable = v => Array.isArray(v)?v.map(stable):
  v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(
    key=>[key,stable(v[key])])):v;
export function validateUiValue(type,value,{choices}={}){
  const js=validateUiValueJavaScript(type,value,{choices});
  const native=rustUiValue(type,value,choices);
  if(native===null)return js;
  if(native?.ok!==js.ok||
     JSON.stringify(stable(native))!==JSON.stringify(stable(js)))
    return fail('RUST_UI_PARITY_MISMATCH');
  return native;
}
