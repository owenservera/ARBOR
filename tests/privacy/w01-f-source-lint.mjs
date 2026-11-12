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
