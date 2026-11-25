#!/usr/bin/env node
// Node edge only: reuse Host projector and native Rust inbox. No browser access.
import {readFileSync,statSync} from 'node:fs';
import {isAbsolute} from 'node:path';
import {createAbsorptionIntake} from '../../apps/vivim-host/control/absorption-intake.mjs';
const LIMIT=4*1024*1024;
function read(file) {
  if(!isAbsolute(file)||!statSync(file).isFile()||statSync(file).size>LIMIT)throw Error('INVALID_ATLAS_PATH');
  const bytes=readFileSync(file);if(bytes.length>LIMIT)throw Error('ATLAS_TOO_LARGE');
  return JSON.parse(bytes);
}
try {
  const [command,...args]=process.argv.slice(2);
  const inbox=createAbsorptionIntake({binary:process.env.VIVIM_ABSORPTION_EXE,store:process.env.VIVIM_ABSORPTION_STORE});
  let result;
  if(command==='intake'&&(args.length===3||args.length===4)){
    const [siteId,origin,file,recon]=args;
    result=inbox.intake({scope:{siteId,origin},atlas:read(file),reconciliation:recon?read(recon):null});
  }else if(command==='read'&&args.length===1){result=inbox.read(args[0]);}
  else throw Error('USAGE_INTAKE_SITE_ORIGIN_ATLAS_OR_READ_ID');
  console.log(JSON.stringify(result));
}catch(e){console.error(JSON.stringify({status:'rejected',code:/^[A-Z_]{3,100}$/.test(e.code??e.message)?e.code??e.message:'ABSORPTION_FAILED'}));process.exitCode=1;}
