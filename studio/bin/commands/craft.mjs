// Studio command surface for the existing native Craft runtime.
import path from 'node:path';
import {define} from '../lib/registry.mjs';
import {usageError} from '../lib/ui.mjs';
import {craftCatalog,craftScreenshot} from '../../src/studio/craft-runtime.mjs';
define({
 name:'craft',section:'Capture',usage:'<catalog|screenshot> --craft-exe PATH',
 summary:'Use the native Craft Anything runtime from Studio',
 flags:{
   'craft-exe':{type:'string',valueName:'PATH',desc:'Absolute installed Craft CLI executable'},
   target:{type:'string',desc:'Explicit Studio browser target ID or selector'},
   origin:{type:'string',desc:'Expected HTTPS origin'},
 },
 async run(ctx){
   const sub=ctx.args[0],executable=ctx.flags['craft-exe']??process.env.VIVIM_CRAFT_EXE;
   if(!executable)throw usageError('Supply --craft-exe or VIVIM_CRAFT_EXE');
   if(sub==='catalog'){
     const r=await craftCatalog(executable);
     return ctx.out.emit(r,o=>{o.result('Craft registered commands: '+r.count);for(const c of r.commands)o.line(c.toolset+'  '+c.command);});
   }
   if(sub==='screenshot'){
     const r=await craftScreenshot({executable,profileDir:ctx.paths.chromeProfile,port:ctx.port,target:ctx.flags.target,origin:ctx.flags.origin,evidenceRoot:path.join(ctx.paths.root,'craft-runtime-evidence')});
     return ctx.out.emit(r,o=>o.result('Craft verified screenshot: '+r.sha256+' ('+r.bytes+' bytes)'));
   }
   throw usageError('Usage: studio craft <catalog|screenshot> --craft-exe PATH');
 }
});
