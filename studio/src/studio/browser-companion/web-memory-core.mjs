// Studio -> Rust HQKG data-only bridge. No browser control, model access or execution grants.
import { spawn } from 'node:child_process';
import path from 'node:path';

export function createWebMemoryCoreIngestor({root, binary=process.env.VIVIM_WEB_MEMORY_BIN,
  journal=process.env.VIVIM_WEB_MEMORY_JOURNAL || path.join(root,'browser-companion','web-memory.hqj'),
  spawnImpl=spawn, timeoutMs=12000}={}){
  if (!root) throw new Error('web memory root required');
  let queue=Promise.resolve();
  // A timed-out child may have persisted before it stopped. Refuse overlapping writes
  // until Studio is restarted and Rust can reconcile the original event IDs.
  let uncertain=false;
  const once=async(payload)=>{
    if (uncertain) throw new Error('WEB_MEMORY_CORE_UNCERTAIN_RESTART_REQUIRED');
    if (!binary || !path.isAbsolute(binary)) throw new Error('WEB_MEMORY_CORE_NOT_CONFIGURED');
    if (!path.isAbsolute(journal)) throw new Error('WEB_MEMORY_JOURNAL_NOT_ABSOLUTE');
    const data=JSON.stringify(payload);
    if(Buffer.byteLength(data)>64*1024)throw new Error('WEB_MEMORY_BATCH_TOO_LARGE');
    return await new Promise((resolve,reject)=>{
      const child=spawnImpl(binary,[journal],{shell:false,windowsHide:true,stdio:['pipe','pipe','pipe']});
      let stdout='',stderr='',finished=false;
      const finish=(err,result)=>{if(finished)return;finished=true;clearTimeout(timer);err?reject(err):resolve(result);};
      const timer=setTimeout(()=>{uncertain=true;try{child.kill();}catch{}finish(new Error('WEB_MEMORY_CORE_TIMEOUT'));},timeoutMs);
      child.on('error',err=>finish(err));
      child.stdout?.on('data',d=>{stdout=(stdout+d.toString()).slice(0,4096);});
      child.stderr?.on('data',d=>{stderr=(stderr+d.toString()).slice(0,4096);});
      child.on('close',code=>{
        if(code!==0)return finish(new Error('WEB_MEMORY_CORE_REJECTED: '+stderr.slice(0,240)));
        const counts=stdout.match(/(?:^|\s)accepted=(\d+) inserted=(\d+)(?:\s|$)/);
        const accepted=counts?Number(counts[1]):NaN,inserted=counts?Number(counts[2]):NaN;
        if(accepted!==payload.events.length||!Number.isSafeInteger(inserted)||inserted<0||inserted>accepted)
          return finish(new Error('WEB_MEMORY_CORE_ACK_MISMATCH'));
        finish(null,{accepted,inserted});
      });
      child.stdin?.on('error',err=>finish(err));
      child.stdin?.end(data);
    });
  };
  return payload=>{
    const run=queue.then(()=>once(payload));
    queue=run.catch(()=>{});
    return run;
  };
}
