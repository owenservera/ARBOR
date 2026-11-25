'use strict';
// Local operator policy only; never derive a filename from a remote request.
const fs=require('node:fs');
const path=require('node:path');
const MAX=65536;
const fields=['enabled','issuer','audience','subject','keyId','publicKeyPem'];
function createPolicyReader(file){
 if(typeof file!=='string'||!path.isAbsolute(file))throw Error('Absolute local policy path required');
 return function getPolicy(){
  let fd;
  try{
   if(!fs.lstatSync(file).isFile())return null;
   fd=fs.openSync(file,fs.constants.O_RDONLY|(fs.constants.O_NOFOLLOW||0)|(fs.constants.O_NONBLOCK||0));
   const stat=fs.fstatSync(fd);
   if(!stat.isFile()||stat.size>MAX)return null;
   const data=Buffer.alloc(MAX+1);let used=0;
   while(used<data.length){const n=fs.readSync(fd,data,used,data.length-used,null);if(!n)break;used+=n;}
   if(used>MAX)return null;
   const policy=JSON.parse(data.subarray(0,used).toString('utf8'));
   if(!policy||typeof policy!=='object'||Array.isArray(policy)||policy.enabled!==true||Object.keys(policy).length!==fields.length||fields.some(k=>!Object.hasOwn(policy,k)))return null;
   if(fields.slice(1).some(k=>typeof policy[k]!=='string'||!policy[k].length))return null;
   return Object.freeze(policy);
  }catch{return null;}finally{if(fd!==undefined)try{fs.closeSync(fd);}catch{}}
 };
}
function createConfiguredRemoteHttp({env=process.env}={}){
 const getPolicy=createPolicyReader(env.VIVIM_MCP_HTTP_POLICY_FILE);
 return require('./remote-http.cjs').createRemoteHttp({getPolicy,env});
}
module.exports={createPolicyReader,createConfiguredRemoteHttp};
