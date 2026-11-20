# File: packages/vec-ui-engines/src/tokens.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | packages/vec-ui-engines/src/tokens.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 3775 B |
| Lines | 65 |
| Hash | c511fbbd8085 |
| Test | no |
| Generated | no |
| Component | vec-ui-engines |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| TOKEN_PACKAGE_SCHEMA | const | 5 | yes | export const TOKEN_PACKAGE_SCHEMA=&#39;vivim.ui-token-pack/1&#39;; |
| TOKEN_NAME | const | 6 | no | const TOKEN_NAME=/^[a-z][a-z0-9_-]*$/; |
| ALIAS | const | 7 | no | const ALIAS=/^\\{([a-z][a-z0-9_-]*(?:\\.[a-z][a-z0-9_-]*){0,15})\\}$/; |
| TYPE_MAP | const | 8 | no | const TYPE_MAP=Object.freeze({color:&#39;color&#39;,dimension:&#39;length&#39;,duration:&#39;duration&#39;, number:&#39;number&#39;,fontFamily:&#39;token&#39;,fontWeight:&#39;number&#39;,cubicBezier:&#39;map&#39;, shadow:&#39;shadow&#39;,gradient:&#39;gradient&#39;}); |
| validGroup | function | 11 | no | function validGroup(group){return plain(group)&amp;&amp;Object.keys(group).length&lt;=128;} |
| resolveUiTokenPackage | function | 12 | yes | export function resolveUiTokenPackage(input){ |
| fail | function | 13 | no | const fail=(code,path)=&gt;({schema:TOKEN_PACKAGE_SCHEMA,outcome:&#39;refused&#39;,code, ...(path?{path}:{}),installed:false}); |
| entries | const | 18 | no | const entries=new Map(); |
| collect | function | 19 | no | function collect(obj,prefix=[],depth=0){ |
| path | const | 23 | no | const path=[...prefix,name].join(&#39;.&#39;); |
| error | const | 29 | no | const error=collect(value,[...prefix,name],depth+1);if(error)return error; |
| err | const | 34 | no | const err=collect(input.tokens);if(err)return fail(err); |
| visited | const | 35 | no | const visited=new Set(),resolved=new Map(); |
| resolve | function | 36 | no | function resolve(path,depth=0){ |
| token | const | 40 | no | const token=entries.get(path);if(!token)return {error:&#39;UNKNOWN_TOKEN_REFERENCE&#39;}; |
| raw | variable | 42 | no | let raw=token.value;const alias=typeof raw===&#39;string&#39;?ALIAS.exec(raw):null; |
| target | const | 44 | no | const target=resolve(alias[1],depth+1);if(target.error){visited.delete(path);return target;} |
| kind | const | 48 | no | const kind=TYPE_MAP[token.type];const checked=validateUiValue(kind,raw); |
| value | const | 50 | no | const value=Object.freeze({path,type:token.type,value:checked.value}); |
| resolveUiTokenReference | function | 58 | yes | export function resolveUiTokenReference(tokenPack,path,requiredType){ |
| token | const | 62 | no | const token=tokenPack.tokens[path]; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./validators.mjs | import | 4 | [packages/vec-ui-engines/src/validators.mjs](./validators.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [packages/vec-ui-engines/src/index.mjs](./index.mjs.md) | ./tokens.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
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
export function resolveUiTokenPackage(input){
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
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
