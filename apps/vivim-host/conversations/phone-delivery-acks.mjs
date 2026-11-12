// Host-owned, metadata-only evidence for a paired phone actually rendering a
// verified reply. The device's authenticated request is the source observation;
// this file is its durable receipt. NOT proof a human read the reply.
// A reply fetch or completed bridge command NEVER creates this receipt.
import fs from 'node:fs';
import path from 'node:path';
import {createHash,randomBytes} from 'node:crypto';

const CMD=/^cmd-[a-f0-9]{16}$/;
const MSG=/^msg-[a-f0-9]{16}$/;
const CONV=/^c-[a-f0-9]{16}$/;
const DEVICE=/^[a-f0-9]{32}$/;
const error=code=>Object.assign(new Error(code),{code});
const digest=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
export function createPhoneDeliveryAcks({dataRoot}={}) {
  if(!path.isAbsolute(dataRoot??''))throw error('PHONE_ACK_ROOT_INVALID');
  const dir=path.join(dataRoot,'phone-render-acks');
  const fileFor=commandId=>{
    if(!CMD.test(commandId??''))throw error('PHONE_ACK_ID_INVALID');
    return path.join(dir,commandId+'.json');
  };
  const shape=r=>r&&r.schema==='vivim.phone-render-ack/1'&&CMD.test(r.commandId)&&
    MSG.test(r.messageId)&&CONV.test(r.conversationId)&&DEVICE.test(r.deviceId)&&
    Number.isSafeInteger(r.replyRevision)&&r.replyRevision>0&&
    typeof r.observedAt==='string'&&Number.isFinite(Date.parse(r.observedAt));
  const load=commandId=>{
    const file=fileFor(commandId);
    let raw;
    try{
      const stat=fs.lstatSync(file);
      if(!stat.isFile()||stat.isSymbolicLink()||stat.size>4096)
        throw error('PHONE_ACK_SOURCE_INVALID');
      raw=fs.readFileSync(file,'utf8');
    }catch(e){if(e.code==='ENOENT')return null;throw error('PHONE_ACK_SOURCE_INVALID');}
    let saved;
    try{saved=JSON.parse(raw);}catch{throw error('PHONE_ACK_SOURCE_INVALID');}
    const {integrity,...data}=saved??{};
    if(!shape(data)||data.commandId!==commandId||integrity!==digest(data))
      throw error('PHONE_ACK_SOURCE_INVALID');
    return data;
  };
  const proof=record=>({
    source:'phone',sourceRef:'phone-ack-'+record.commandId,
    sourceRevision:record.replyRevision,evidenceDigest:digest(record)
  });
  function put({commandId,messageId,conversationId,deviceId,replyRevision}={}) {
    const body={schema:'vivim.phone-render-ack/1',commandId,messageId,
      conversationId,deviceId,replyRevision,observedAt:new Date().toISOString()};
    if(!shape(body))throw error('PHONE_ACK_FIELDS_INVALID');
    const existing=load(commandId);
    if(existing){
      if(existing.messageId!==messageId||existing.conversationId!==conversationId||
          existing.deviceId!==deviceId||existing.replyRevision!==replyRevision)
        throw error('PHONE_ACK_CONFLICT');
      return {record:existing,replayed:true,proof:proof(existing)};
    }
    fs.mkdirSync(dir,{recursive:true,mode:0o700});
    const dest=fileFor(commandId),temp=dest+'.'+randomBytes(8).toString('hex')+'.tmp';
    try{
      fs.writeFileSync(temp,JSON.stringify({...body,integrity:digest(body)}),{flag:'wx',mode:0o600});
      try{fs.linkSync(temp,dest);}
      catch(e) {
        if(e.code==='EEXIST') {
          const concurrent=load(commandId);
          if(concurrent?.deviceId===deviceId&&
             concurrent.messageId===messageId&&concurrent.conversationId===conversationId&&
             concurrent.replyRevision===replyRevision)
            return {record:concurrent,replayed:true,proof:proof(concurrent)};
          throw error('PHONE_ACK_CONFLICT');
        }
        // No unsafe non-atomic fallback if hardlinks are unavailable.
        throw error('PHONE_ACK_PERSISTENCE_UNAVAILABLE');
      }
    }finally{try{fs.unlinkSync(temp);}catch(e){if(e.code!=='ENOENT')throw e;}}
    return {record:body,replayed:false,proof:proof(body)};
  }
  async function verify(observation){
    if(observation?.source!=='phone'||!CMD.test(observation.commandId??''))
      return {verified:false};
    let record;
    try{record=load(observation.commandId);}catch{return {verified:false};}
    if(!record||observation.kind!=='delivery.acked'||
       record.messageId!==observation.messageId||
       record.conversationId!==observation.conversationId)return {verified:false};
    const evidence=proof(record);
    if(evidence.sourceRef!==observation.sourceRef||
       evidence.sourceRevision!==observation.sourceRevision||
       evidence.evidenceDigest!==observation.evidenceDigest)return {verified:false};
    return {verified:true,...evidence};
  }
  return {put,load,proof,verify};
}
