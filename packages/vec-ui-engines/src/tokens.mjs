import {rustTokenPackage} from './rust-wasm.mjs';
// Subset of Design Tokens Community Group 2025.10: explicit typed tokens,
// nested groups and full-value {alias.path}. No claim of complete spec compliance.
// Node/phone safe, no filesystem/network/CSS evaluation or side effects.
import {plain,inertData,validateUiValue} from './validators.mjs';
export const TOKEN_PACKAGE_SCHEMA='vivim.ui-token-pack/1';
const TOKEN_NAME=/^[a-z][a-z0-9_-]*$/;
const ALIAS=/^\{([a-z][a-z0-9_-]*(?:\.[a-z][a-z0-9_-]*){0,15})\}$/;
const TYPE_MAP=Object.freeze({color:'color',dimension:'length',duration:'duration',
  number:'number',fontFamily:'token',fontWeight:'number',cubicBezier:'map',
  shadow:'shadow',gradient:'gradient'});
function validGroup(group){return plain(group)&&Object.keys(group).length<=128;}
function resolveUiTokenPackageJavaScript(input){
  const fail=(code,path)=>({schema:TOKEN_PACKAGE_SCHEMA,outcome:'refused',code,
    ...(path?{path}:{}),installed:false});
  if(!plain(input)||Object.keys(input).some(k=>!['schema','tokens','mode'].includes(k))||
    input.schema!==TOKEN_PACKAGE_SCHEMA||!validGroup(input.tokens)||!inertData(input.tokens,2048))
    return fail('INVALID_TOKEN_PACKAGE');
  const entries=new Map();
  function collect(obj,prefix=[],depth=0){
    if(depth>9)return 'DEPTH_LIMIT';
    for(const [name,value] of Object.entries(obj)){
      if(!TOKEN_NAME.test(name))return 'INVALID_TOKEN_NAME';
      const path=[...prefix,name].join('.');
      if(plain(value)&&Object.hasOwn(value,'$value')){
        if(Object.keys(value).some(k=>!['$type','$value','$description'].includes(k))||
          typeof value.$type!=='string'||!TYPE_MAP[value.$type])return 'UNKNOWN_TOKEN_TYPE';
        entries.set(path,{type:value.$type,value:value.$value});if(entries.size>512)return 'TOO_MANY_TOKENS';
      }else if(validGroup(value)){
        const error=collect(value,[...prefix,name],depth+1);if(error)return error;
      }else{return 'INVALID_GROUP';}
    }
    return null;
  }
  const err=collect(input.tokens);if(err)return fail(err);
  const visited=new Set(),resolved=new Map();
  function resolve(path,depth=0){
    if(depth>32)return {error:'ALIAS_DEPTH'};
    if(resolved.has(path))return {ok:resolved.get(path)};
    if(visited.has(path))return {error:'ALIAS_CYCLE'};
    const token=entries.get(path);if(!token)return {error:'UNKNOWN_TOKEN_REFERENCE'};
    visited.add(path);
    let raw=token.value;const alias=typeof raw==='string'?ALIAS.exec(raw):null;
    if(alias){
      const target=resolve(alias[1],depth+1);if(target.error){visited.delete(path);return target;}
      if(target.ok.type!==token.type){visited.delete(path);return {error:'ALIAS_TYPE_MISMATCH'};}
      raw=target.ok.value;
    }
    const kind=TYPE_MAP[token.type];const checked=validateUiValue(kind,raw);
    if(!checked.ok){visited.delete(path);return {error:'INVALID_TOKEN_VALUE'};}
    const value=Object.freeze({path,type:token.type,value:checked.value});
    resolved.set(path,value);visited.delete(path);
    return {ok:value};
  }
  for(const key of entries.keys()){const x=resolve(key);if(x.error)return fail(x.error,key);}
  return {schema:TOKEN_PACKAGE_SCHEMA,outcome:'resolved',installed:false,
    tokens:Object.fromEntries([...resolved.entries()].sort(([a],[b])=>a.localeCompare(b)))};
}
export function resolveUiTokenReference(tokenPack,path,requiredType){
  if(!plain(tokenPack)||tokenPack.schema!==TOKEN_PACKAGE_SCHEMA||
    tokenPack.outcome!=='resolved'||typeof path!=='string'||!Object.hasOwn(tokenPack.tokens,path))
    return {outcome:'refused',code:'TOKEN_UNKNOWN'};
  const token=tokenPack.tokens[path];
  if(requiredType&&token.type!==requiredType)return {outcome:'refused',code:'TOKEN_TYPE_MISMATCH'};
  return {outcome:'resolved',token};
}


// A package compiled by browser Rust must match the existing normalized token
// graph until migration parity has been established on real deployed inputs.
const stableToken=v=>Array.isArray(v)?v.map(stableToken):
  v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(
    key=>[key,stableToken(v[key])])):v;
export function resolveUiTokenPackage(input){
  const js=resolveUiTokenPackageJavaScript(input);
  const native=rustTokenPackage(input);
  if(native===null)return js;
  if(JSON.stringify(stableToken(native))!==JSON.stringify(stableToken(js)))
    return {schema:TOKEN_PACKAGE_SCHEMA,outcome:'refused',
      code:'RUST_TOKEN_PARITY_MISMATCH',installed:false};
  return native;
}
