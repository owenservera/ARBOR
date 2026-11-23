// One explicit, draft-only handoff from the unified VIVIM composer to the
// EXISTING Studio-backed provider composer. This module has no network/effects.
const ALIASES = Object.freeze({
  chatgpt: 'chatgpt', gpt: 'chatgpt',
  claude: 'claude', gemini: 'gemini', qwen: 'qwen',
  deepseek: 'deepseek', zai: 'zai', 'z.ai': 'zai',
  kimi: 'kimi', minimax: 'minimax', grok: 'grok',
  lmarena: 'lmarena', 'duck-ai': 'duck-ai'
});
const LABELS = Object.freeze({
  chatgpt: 'ChatGPT', claude: 'Claude', gemini: 'Gemini', qwen: 'Qwen',
  deepseek: 'DeepSeek', zai: 'Z.ai', kimi: 'Kimi', minimax: 'MiniMax',
  grok: 'Grok', lmarena: 'LM Arena', 'duck-ai': 'Duck.ai'
});

// Deliberately only explicit commands, not ordinary questions mentioning an AI.
// The result can select a verified provider and stage text; it NEVER sends.
export function resolveProviderHandoff(input, projection) {
  if (typeof input !== 'string') return null;
  const text = input.trim();
  if (!text || text.length > 1000) return null;
  const match =
    /^(?:\/ai\s+|@)([a-z][a-z0-9._-]{1,30})(?:(?::\s*|\s+)([\s\S]*))?$/i.exec(text) ||
    /^(?:chat\s+with|talk\s+to|ask)\s+([a-z][a-z0-9._-]{1,30})(?::\s*([\s\S]*))?$/i.exec(text);
  if (!match) return null;
  const id = ALIASES[match[1].toLowerCase()];
  if (!id) return null;
  const record = Array.isArray(projection) ? projection.find(p => p?.id === id) : null;
  const signedIn = record?.signedIn === true;
  // A browser login alone is not a usable relay. Match the existing Send
  // admission rule and preserve the draft when the Host worker is offline.
  const queueConsumerReady = signedIn && record?.queueConsumerReady === true;
  return Object.freeze({
    id, label: LABELS[id],
    status: queueConsumerReady ? 'ready' : signedIn ? 'relay-offline' : 'unverified',
    draft: (match[2] || '').trim(), sendsAutomatically: false
  });
}

// This gate is pure and has no effect authority. It is checked both when
// painting Send and immediately before the existing relay-chat queue call.
export function canSendVerifiedProvider({paired,direct,sessionApproved,target,providerId,projection,text,sending}) {
  return paired === true && direct === true && sessionApproved === true &&
    target === 'harness' && sending !== true &&
    typeof providerId === 'string' && typeof text === 'string' && !!text.trim() &&
    Array.isArray(projection) &&
    projection.some(p => p?.id === providerId && p?.signedIn === true &&
      p?.queueConsumerReady === true);
}

const PRIMARY_CONNECTIONS=Object.freeze(['chatgpt','claude','gemini','qwen','zai','deepseek']);
// A known account may be selected for a LOCAL DRAFT before login. This is never a send.
export function listProviderConnections(projection) {
  const records=Array.isArray(projection)?projection:[];
  return PRIMARY_CONNECTIONS.map(id=>{
    const source=records.find(p=>p?.id===id) ?? null;
    const signedIn=source?.signedIn===true;
    const queueConsumerReady=signedIn&&source?.queueConsumerReady===true;
    return Object.freeze({...source,id,label:LABELS[id],signedIn,queueConsumerReady,
      connectionState:queueConsumerReady?'ready':signedIn?'relay-offline':'unverified'});
  });
}
export function canRetargetProviderDraft(conversation,hasHistory=false) {
  return !!conversation && conversation.sent!==true && hasHistory!==true;
}

// Chat-box Chrome Commander: a deterministic READ-ONLY routing vocabulary.
// These commands never authorize recording, account access, browser mutation,
// provider send, or corpus ingestion. They only display Host-backed state.
const TOOL_COMMANDS=Object.freeze({
  tools:'connections',connections:'connections',ai:'connections',
  chrome:'chrome',browser:'chrome',corpus:'corpus',memory:'corpus',
  delivery:'delivery',feedback:'delivery',settings:'settings'
});
export function resolveReadOnlyChatTool(input) {
  if(typeof input!=='string'||input.length>72)return null;
  const match=/^\/([a-z]+)(?:\s+status)?$/i.exec(input.trim());
  return match ? TOOL_COMMANDS[match[1].toLowerCase()]??null : null;
}
const TOOL_PHASES=new Set(['idle','review','ready','running','attention','uncertain','done','unsupported']);
const DELIVERY_PHASES=Object.freeze({
  created:'Intent recorded',remote_queued:'Queued on PC',
  claimed:'Claimed by worker; not sent',
  send_authorized:'Authorized; send not observed',
  waiting_reply:'Sent; waiting for reply',
  reply_observed:'Reply observed; phone delivery unconfirmed',
  delivered:'Delivery acknowledged',
  uncertain:'Uncertain send; inspect original receipt',
  failed_before_send:'Failed before send',
  failed_after_send:'Possible send; review required'
});
const safeCount=x=>Number.isSafeInteger(x)&&x>=0&&x<=100000?x:null;
export function projectReadOnlyChatTool(tool,{providers,studio,personalization,commands,details=false}={}) {
  if(!Object.values(TOOL_COMMANDS).includes(tool))return null;
  const rows=[];let title='',note='';
  if(tool==='connections'){
    title='My AI connections';
    for(const provider of listProviderConnections(providers)){
      rows.push({label:provider.label,value:provider.queueConsumerReady?'Signed in · relay ready':
        provider.signedIn?'Signed in · relay unavailable':'Sign-in not verified'});
    }
    note='A login alone is not delivery proof. Use the existing provider check; Send always requires a verified PC worker.';
  }else if(tool==='chrome'){
    title='Chrome Commander · Studio ownership';
    const capture=studio?.schema==='vivim.studio-operations/1'&&studio.authority==='read-only'?studio.capture:null;
    const drive=studio?.schema==='vivim.studio-operations/1'&&studio.authority==='read-only'?studio.drive:null;
    const recorder=['idle','recording','stopping','paused','disconnected','error'].includes(capture?.recorderState)
      ? capture.recorderState : 'unknown';
    const browser=['available','not-running','profile-unverified'].includes(capture?.browserState)
      ? capture.browserState : 'unknown';
    rows.push({label:'Browser',value:browser==='available'&&capture?.browserVerified===true?'Verified owner connection':
      browser==='unknown'?'Source unavailable':'Not verified · '+browser});
    rows.push({label:'Capture',value:recorder==='unknown'?'Source unavailable':recorder});
    rows.push({label:'Drive jobs',value:drive?.state==='source-backed'&&safeCount(drive.active)!==null
      ? drive.active+' active':'Source unavailable'});
    note='Chrome actions use the existing GPUI Host Control approval and Studio owner. This panel does not start tabs, capture, or Drive jobs.';
  }else if(tool==='corpus'){
    title='Oracle · local personal corpus';
    const phase=TOOL_PHASES.has(personalization?.phase)?personalization.phase:'unknown';
    rows.push({label:'Onboarding',value:phase});
    for(const [key,label] of [['claims','Claims'],['observations','Observations'],['contradictions','Contradictions']]){
      const count=safeCount(personalization?.corpus?.[key]);
      rows.push({label,value:count===null?'Not reported':String(count)});
    }
    if(details && Array.isArray(personalization?.passes)){
      const allowed=new Set(['F02','F01','D03','D04','D05','D06','D07']);
      for(const pass of personalization.passes.slice(0,7))if(allowed.has(pass?.pass))
        rows.push({label:pass.pass,value:TOOL_PHASES.has(pass?.status)?pass.status:'unverified'});
    }
    note='Only reviewed, source-bound provider replies enter the private Host corpus. No whole-account-history claim or automatic extraction.';
  }else if(tool==='delivery'){
    title='Conversation delivery · visual receipts';
    const filtered=Array.isArray(commands)?commands.filter(c=>c&&typeof c==='object'&&
      (c.mode==='relay-chat'||c.consumer==='harness')).slice(-5):[];
    if(!filtered.length)rows.push({label:'Transport',value:'No verified recent command status'});
    for(const c of filtered){
      const phase=typeof c.deliveryState==='string'?c.deliveryState:
        typeof c.delivery?.state==='string'?c.delivery.state:'';
      // Generic command status is not proof of provider/phone delivery.
      rows.push({label:'Recent turn',value:Object.hasOwn(DELIVERY_PHASES,phase)
        ? DELIVERY_PHASES[phase] : 'Status unverified; do not assume delivery'});
    }
    note='Stages reflect existing Host receipts only. Uncertain or unacknowledged turns are never automatically retried.';
  }else{
    title='Chat connections · options';
    rows.push({label:'Provider sends',value:'Explicit Send only'});
    rows.push({label:'Chrome actions',value:'Exact Host plan and approval'});
    rows.push({label:'Personal corpus',value:'Private, source-backed, reviewed'});
    rows.push({label:'Feedback detail',value:details?'Expanded':'Summary'});
    note='These are presentation options, not background permissions. Changing detail never grants a browser or corpus effect.';
  }
  return Object.freeze({tool,title,rows:rows.slice(0,20).map(row=>Object.freeze(row)),note,readOnly:true});
}
