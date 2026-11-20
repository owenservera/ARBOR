# File: tests/privacy/w01-f-source-lint.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | tests/privacy/w01-f-source-lint.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 913 B |
| Lines | 15 |
| Hash | 5e05d9eb0a5a |
| Test | yes |
| Generated | no |
| Component | tests |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| lintSelectedTree | function | 4 | yes | export function lintSelectedTree(root){ |
| findings | const | 5 | no | const findings=[];const walk=dir=&gt;{ |
| s | const | 10 | no | const s=readFileSync(full,&#39;utf8&#39;); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 2 | external |
| node:path | import | 3 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [tests/privacy/w01-f-source-lint.test.mjs](./w01-f-source-lint.test.mjs.md) | ./w01-f-source-lint.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Run with: node --test tests/privacy/w01-f-source-lint.test.mjs
import {readFileSync,readdirSync,statSync} from 'node:fs';
import {join,relative} from 'node:path';
export function lintSelectedTree(root){
 const findings=[];const walk=dir=>{
  for(const name of readdirSync(dir)){const full=join(dir,name),rel=relative(root,full).replaceAll('\\','/');
   if(/^(?:\.env(?:\..*)?|cookies|login data|session\.json|storage-state\.json)$/i.test(name)||/\.(?:pem|p12|keystore)$/i.test(name))findings.push({path:rel,reason:'sensitive filename'});
   if(statSync(full).isDirectory())walk(full);
   else if(/\.(?:mjs|ts|rs)$/.test(name)){
    const s=readFileSync(full,'utf8');
    if(/(?:from\s*['"]|require\(['"]|import\(['"])(?:\.{1,2}\/)+(?:repos-hq|tierflow|vivim-web-harness|vivim-labs)\//.test(s))findings.push({path:rel,reason:'donor repository import'});
   }
  }
 };walk(root);return findings;
}
```

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
