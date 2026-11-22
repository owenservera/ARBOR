export const CHAT_PROVIDER_SCHEMA='vivim.chat-provider-projection/1';
const PROVIDER_ID=/^[a-z][a-z0-9_-]{1,31}$/;
export function projectChatProviders(records,now=Date.now(),worker=null){
  const rows=Array.isArray(records)?records:[];
  const seen=new Set(),providers=[];
  for(const value of rows.slice(0,24)){
    if(!value||typeof value.id!=='string'||!PROVIDER_ID.test(value.id)||
       seen.has(value.id))continue;
    seen.add(value.id);
    const check=value.check;
    const observed=Date.parse(check?.observedAt??'');
    const verified=check?.state==='ready'&&check?.verified===true&&
      Number.isFinite(observed)&&observed<=now&&now-observed<=45000;
    providers.push({id:value.id,
      label:typeof value.label==='string'?value.label.slice(0,64):value.id,
      signedIn:verified,
      // Account readiness is not a live receiver. Never infer worker existence.
      queueConsumerReady:verified&&worker?.state==='online'&&
        Array.isArray(worker.supportedProviders)&&worker.supportedProviders.includes(value.id),
      models:[],thinkingLevels:[],newChat:true,attachments:false});
  }
  return {schema:CHAT_PROVIDER_SCHEMA,updatedAt:new Date(now).toISOString(),
    verification:'explicit-Studio-owner-check',providers};
}
