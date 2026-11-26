// Host-owned worker transport. No public listener, no shell, no caller-chosen path.
import { spawn } from 'node:child_process';
import { isAbsolute, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
const schema='vivim.download-worker/1';
const fail=code=>Object.assign(new Error(code),{code});
const hashRe=/^[a-fA-F0-9]{40}$/;
export const DOWNLOAD_ACTIONS=new Set(['download.torrent.list','download.torrent.add','download.torrent.pause','download.torrent.resume','download.torrent.remove','download.torrent.start']);
export function createDownloadPort({dataRoot,binary=process.env.VIVIM_DOWNLOAD_WORKER}={}){
  let child=null,pending=null,buffer='';
  function reject(code){if(pending){const p=pending;pending=null;clearTimeout(p.timer);p.reject(fail(code));}}
  function launch(){
    if(child)return;
    if(!binary||!isAbsolute(binary)||!dataRoot)throw fail('DOWNLOAD_UNAVAILABLE');
    const proc=spawn(binary,[resolve(dataRoot,'downloads')],{stdio:['pipe','pipe','ignore'],windowsHide:true,shell:false});
    child=proc;buffer='';
    proc.on('error',()=>{if(child===proc){child=null;reject('DOWNLOAD_UNCERTAIN');}});
    proc.on('exit',()=>{if(child===proc){child=null;reject('DOWNLOAD_UNCERTAIN');}});
    proc.stdin.on('error',()=>{if(child===proc){reject('DOWNLOAD_UNCERTAIN');proc.kill();}});
    proc.stdout.setEncoding('utf8');
    proc.stdout.on('data',chunk=>{
      if(child!==proc)return;
      buffer+=chunk;
      if(buffer.length>1024*1024){reject('DOWNLOAD_UNCERTAIN');proc.kill();return;}
      let at;
      while((at=buffer.indexOf('\n'))>=0){
        const line=buffer.slice(0,at);buffer=buffer.slice(at+1);
        let r;try{r=JSON.parse(line);}catch{reject('DOWNLOAD_UNCERTAIN');proc.kill();return;}
        if(!pending||r.schema!==schema||r.id!==pending.id||typeof r.ok!=='boolean'){reject('DOWNLOAD_UNCERTAIN');proc.kill();return;}
        const p=pending;pending=null;clearTimeout(p.timer);
        if(r.ok&&r.result&&typeof r.result==='object')p.resolve(r.result);else p.reject(fail('DOWNLOAD_OPERATION_FAILED'));
      }
    });
  }
  function send(command,{start=false}={}){
    if(pending)return Promise.reject(fail('DOWNLOAD_BUSY'));
    if(!child&&!start)return Promise.reject(fail('DOWNLOAD_UNAVAILABLE'));
    if(start)launch();
    const proc=child;
    return new Promise((resolve,rejectPromise)=>{
      const id=randomUUID();
      const timer=setTimeout(()=>{reject('DOWNLOAD_UNCERTAIN');proc.kill();},120000);
      pending={id,resolve,reject:rejectPromise,timer};
      proc.stdin.write(JSON.stringify({id,command})+'\n');
    });
  }
  async function invoke(action,args={}){
    if(action==='download.torrent.list')return send({op:'list'});
    if(action==='download.torrent.start')return send({op:'list'},{start:true});
    if(action==='download.torrent.add'){
      if(typeof args.magnet!=='string'||args.magnet.length>8192||!args.magnet.startsWith('magnet:?')||/[\u0000-\u001f\u007f]/.test(args.magnet))throw fail('DOWNLOAD_INPUT_INVALID');
      return send({op:'add_magnet',magnet:args.magnet},{start:true});
    }
    const op={'download.torrent.pause':'pause','download.torrent.resume':'resume','download.torrent.remove':'remove'}[action];
    if(!op||typeof args.hash!=='string'||!hashRe.test(args.hash))throw fail('DOWNLOAD_INPUT_INVALID');
    return send({op,hash:args.hash.toLowerCase()});
  }
  function close(){if(child)child.stdin.end();}
  return {invoke,close};
}
