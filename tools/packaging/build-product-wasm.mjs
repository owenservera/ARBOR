#!/usr/bin/env node
// Build the *same* Rust product kernel for the PWA. It is copied into the
// existing fixed mobile asset tree, not loaded from a provider/CDN.
// Requires a local Rust toolchain with wasm32-unknown-unknown installed.
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {mkdirSync,readFileSync,writeFileSync,renameSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const target=process.env.CARGO_TARGET_DIR?
  path.resolve(root,process.env.CARGO_TARGET_DIR):path.join(root,'target');
const src=path.join(target,'wasm32-unknown-unknown','release','vivim_programmability_core.wasm');
const dest=path.join(root,'apps','mobile-relay','wasm','vivim_programmability_core.wasm');
const args=['build','--release','--target','wasm32-unknown-unknown',
  '-p','vivim-programmability-core','--lib'];
const status=spawnSync('cargo',args,{cwd:root,stdio:'inherit',shell:false,
  timeout:600000,windowsHide:true});
if(status.error||status.status!==0){
  console.error('Rust PWA core build failed. Install target with: rustup target add wasm32-unknown-unknown');
  process.exit(1);
}
let bytes;try{bytes=readFileSync(src);}catch{console.error('Missing Rust wasm32 artifact');process.exit(1);}
if(bytes.length<8||bytes.length>12*1024*1024||
  bytes.subarray(0,4).compare(Buffer.from([0,97,115,109]))!==0){
  console.error('Invalid or oversized wasm32 product core');process.exit(1);
}
mkdirSync(path.dirname(dest),{recursive:true});
const temp=dest+'.'+process.pid+'.tmp';
writeFileSync(temp,bytes);
if(existsSync(dest)){
  // Windows rename-to-existing may fail. Preserve old artifact on failed build;
  // this branch runs only after successful native output admission.
  const {rmSync}=await import('node:fs');
  rmSync(dest);
}
renameSync(temp,dest);
console.log('Rust PWA core staged: '+dest);
console.log('SHA256: '+createHash('sha256').update(bytes).digest('hex'));
