# File: tests/hq-version-intelligence/schema-validator.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | tests/hq-version-intelligence/schema-validator.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 2405 B |
| Lines | 38 |
| Hash | 05d5c12eb86f |
| Test | yes |
| Generated | no |
| Component | tests |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| validate | function | 6 | yes | export function validate(schema,value,path=&#39;$&#39;){ |
| errors | const | 7 | no | const errors=[]; |
| types | const | 8 | no | const types=Array.isArray(schema.type)?schema.type:[schema.type].filter(Boolean); |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [tests/hq-version-intelligence/hvi-contract-qa.test.mjs](./hvi-contract-qa.test.mjs.md) | ./schema-validator.mjs |
| [tests/hq-version-intelligence/schema-negative-gates.test.mjs](./schema-negative-gates.test.mjs.md) | ./schema-validator.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
/**
 * Dependency-free JSON Schema 2020-12 SUBSET validation used by fixture tests:
 * supports the keywords actually present in Lane F's v1 schemas.
 * Integration owner should also run standards-compliant schema validator.
 */
export function validate(schema,value,path='$'){
 const errors=[];
 const types=Array.isArray(schema.type)?schema.type:[schema.type].filter(Boolean);
 if(types.length&&!types.some(t=>
  t==='null'?value===null:t==='array'?Array.isArray(value):t==='integer'?Number.isInteger(value):
  t==='object'?value!==null&&typeof value==='object'&&!Array.isArray(value):typeof value===t))
  return [path+':type'];
 if('const' in schema&&value!==schema.const)errors.push(path+':const');
 if(schema.enum&&!schema.enum.includes(value))errors.push(path+':enum');
 if(typeof value==='string'){
  if(schema.minLength!=null&&value.length<schema.minLength)errors.push(path+':minLength');
  if(schema.maxLength!=null&&value.length>schema.maxLength)errors.push(path+':maxLength');
  if(schema.pattern&&!new RegExp(schema.pattern).test(value))errors.push(path+':pattern');
  if(schema.format==='date-time'&&Number.isNaN(Date.parse(value)))errors.push(path+':format');
 }
 if(typeof value==='number'&&schema.minimum!=null&&value<schema.minimum)errors.push(path+':minimum');
 if(Array.isArray(value)){
  if(schema.minItems!=null&&value.length<schema.minItems)errors.push(path+':minItems');
  if(schema.maxItems!=null&&value.length>schema.maxItems)errors.push(path+':maxItems');
  if(schema.uniqueItems&&new Set(value.map(x=>JSON.stringify(x))).size!==value.length)errors.push(path+':uniqueItems');
  if(schema.items)value.forEach((v,i)=>errors.push(...validate(schema.items,v,path+'['+i+']')));
 }
 if(value!==null&&typeof value==='object'&&!Array.isArray(value)){
  for(const key of schema.required||[])if(!(key in value))errors.push(path+'.'+key+':required');
  for(const [key,v] of Object.entries(value)){
   if(schema.additionalProperties===false&&!(key in (schema.properties||{})))errors.push(path+'.'+key+':additional');
   if(schema.properties?.[key])errors.push(...validate(schema.properties[key],v,path+'.'+key));
  }
 }
 if(schema.allOf)for(const branch of schema.allOf)errors.push(...validate(branch,value,path));
 if(schema.if&&schema.then&&validate(schema.if,value,path).length===0)errors.push(...validate(schema.then,value,path));
 return errors;
}
```

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
