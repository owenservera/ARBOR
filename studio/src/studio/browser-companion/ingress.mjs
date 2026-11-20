// Observation-only Browser Companion credential and bounded ingress. No CDP, no browser actions.
import { randomBytes, timingSafeEqual, createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync, renameSync, existsSync } from 'node:fs';
import path from 'node:path';
const EXT = /^[a-p]{32}$/;

// Exact extension sanitizer, inlined so ingress does not depend on the retired
// apps/browser-companion/protocol.mjs. Returns {site,url} for a Host-authorized page,
// or null when the URL must be rejected: encoded/secret path, port, query string,
// fragment, credentials, local IP, private route, or site/URL mismatch.
function pageFor(url, browserTabId) {
  if (typeof url !== 'string' || url.length === 0 || url.length > 1024) return null;
  if (/%/.test(url)) return null; // reject encoded paths/credentials/secrets
  let parsed;
  try { parsed = new URL(url); } catch { return null; }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null;
  if (parsed.username !== '' || parsed.password !== '') return null; // reject credentials
  if (parsed.port !== '') return null; // reject explicit ports
  if (parsed.search !== '') return null; // reject query strings
  if (parsed.hash !== '') return null; // reject fragments
  if (parsed.pathname !== '/' && parsed.pathname !== '') return null; // reject any path
  const rawHost = parsed.hostname; // WHATWG brackets IPv6: [::1], [::ffff:7f00:1]
  const host = rawHost.startsWith('[') && rawHost.endsWith(']') ? rawHost.slice(1, -1) : rawHost;
  // reject local IPs and private routes
  const isLocal = host === '127.0.0.1' || host === '::1' || host === '0.0.0.0' || host === '::';
  const isLocalName = host === 'localhost';
  if (isLocal || isLocalName) return null;
  const parts = host.split('.').filter(Boolean).map(Number);
  if (parts.length === 4 && parts.every(n => Number.isFinite(n))) {
    const [a, b, c, d] = parts;
    if (a === 10) return null;
    if (a === 172 && b >= 16 && b <= 31) return null;
    if (a === 192 && b === 168) return null;
    if (a === 0) return null;
    if (a === 100 && b >= 64 && b <= 127) return null; // carrier-grade NAT
  }
  const site = host.toLowerCase();
  if (site.length === 0 || site.length > 253) return null;
  if (!/^[a-z0-9-]+(?:\.[a-z0-9-]+)+$/.test(site)) return null;
  return { site, url: parsed.href };
}
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PROVIDERS = new Set(['chatgpt','claude','gemini','qwen','zai','deepseek','grok','kimi']);
const TYPES = new Set(['tab.created','tab.updated','tab.removed','tab.activated','tab.replaced','snapshot','visit.observed']);
const credFile = root => path.join(root,'browser-companion','credential.json');
const stateFile = root => path.join(root,'browser-companion','state.json');
function atomic(file,value){mkdirSync(path.dirname(file),{recursive:true,mode:0o700});const temp=file+'.'+process.pid+'.'+randomBytes(4).toString('hex')+'.tmp';writeFileSync(temp,JSON.stringify(value),{mode:0o600});renameSync(temp,file);}
function read(file){try{return JSON.parse(readFileSync(file,'utf8'))}catch{return null}}
export function pairCompanion(root,extensionId){if(!EXT.test(extensionId))throw Error('Extension ID must be 32 lowercase a-p characters');const token=randomBytes(32).toString('hex');atomic(credFile(root),{extensionId,token});return {extensionId,token};}
export function revokeCompanion(root){const c=read(credFile(root));if(c)atomic(credFile(root),{extensionId:c.extensionId,token:randomBytes(32).toString('hex')});return !!c;}
export function companionState(root){const s=read(stateFile(root));return s?{...s,connected:Date.now()-Date.parse(s.lastSeen)<150000,verified:false,source:'extension_observation'}:{connected:false,verified:false,source:'extension_observation',providers:[],lastSeen:null};}
function fail(code){return{status:code,body:{error:code===401?'unauthorized':code===503?'web_memory_core_unavailable':'invalid companion observation'}}}
function only(o,keys){return o&&typeof o==='object'&&!Array.isArray(o)&&Object.keys(o).every(k=>keys.includes(k))}
function canonical(value){return Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(k=>[k,canonical(value[k])])):value}
function digest(value){return createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex')}
export function companionIngress({root,publish=()=>{},ingestVisits=async()=>{throw Error('WEB_MEMORY_CORE_NOT_CONFIGURED')},now=()=>Date.now()}){
 return async(req,{port,body})=>{
 const c=read(credFile(root));const host=req.headers.host;
 const ip=req.socket?.remoteAddress;
 if(!c||!EXT.test(c.extensionId)||!['127.0.0.1','::1','::ffff:127.0.0.1'].includes(ip)|| ![`127.0.0.1:${port}`,`localhost:${port}`].includes(host))return fail(403);
 const origin='chrome-extension://'+c.extensionId;
 if(req.headers.origin!==origin)return fail(403);
 const headers={'access-control-allow-origin':origin,'vary':'Origin','cache-control':'no-store','x-content-type-options':'nosniff'};
 if(req.method==='OPTIONS'){
  if(req.headers['access-control-request-method']!=='POST'||!String(req.headers['access-control-request-headers']||'').toLowerCase().split(',').map(x=>x.trim()).every(x=>['authorization','content-type'].includes(x)))return fail(403);
  return{status:204,headers:{...headers,'access-control-allow-methods':'POST','access-control-allow-headers':'authorization, content-type'},body:null};
 }
 if(req.method!=='POST')return fail(405);
 const given=String(req.headers.authorization||'').replace(/^Bearer /,'');
 const actual=Buffer.from(given),expected=Buffer.from(c.token);
 if(actual.length!==expected.length||!timingSafeEqual(actual,expected))return fail(401);
 if(!String(req.headers['content-type']||'').startsWith('application/json')||!body||Buffer.byteLength(JSON.stringify(body))>65536)return fail(400);
 if(!only(body,['schema','installationId','sessionId','events'])||body.schema!=='vivim.browser-companion/1'||!UUID.test(body.installationId)||!UUID.test(body.sessionId)||!Array.isArray(body.events)||body.events.length<1||body.events.length>32)return fail(400);
 const clean=[];
 for(const e of body.events){
  if(!only(e,['id','type','at','tab','tabs','page'])||!UUID.test(e.id)||!TYPES.has(e.type)||typeof e.at!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(e.at)||!Number.isFinite(Date.parse(e.at))||Math.abs(now()-Date.parse(e.at))>86400000)return fail(400);
		  if(e.type==='visit.observed'){
			const p=e.page;
			if(!only(p,['browserTabId','site','url'])||!Number.isSafeInteger(p?.browserTabId)||p.browserTabId<0 ||
			   typeof p?.site!=='string'||!(/^[a-z0-9-]+(?:\.[a-z0-9-]+)+$/.test(p.site))||p.site.length>253||
			   typeof p?.url!=='string'||p.url.length>1024 || e.tab!==undefined || e.tabs!==undefined)return fail(400);
			// Validate with the exact extension sanitizer: no encoded/secret path, port, query,
			// fragment, credentials, local IP, private route or site/URL mismatch.
			const normalized=pageFor(p.url,p.browserTabId);
			if(!normalized||normalized.site!==p.site||normalized.url!==p.url)return fail(400);
			clean.push(e);continue;
		  }
  if(e.page!==undefined)return fail(400);
  const tabs=e.type==='snapshot'?e.tabs:[e.tab];
  if(!Array.isArray(tabs)||tabs.length>(e.type==='snapshot'?100:1)|| (e.type==='snapshot'&&e.tab!==undefined)||(e.type!=='snapshot'&&e.tabs!==undefined))return fail(400);
  for(const t of tabs)if(!only(t,['browserTabId','windowId','provider','active','loading'])||!Number.isInteger(t.browserTabId)||t.browserTabId<0||!Number.isInteger(t.windowId)||!PROVIDERS.has(t.provider)||typeof t.active!=='boolean'||typeof t.loading!=='boolean')return fail(400);
  clean.push(e);
 }
 // Reject intra-batch duplicate IDs even if the client supplied identical payloads.
 if(new Set(clean.map(e=>e.id)).size!==clean.length)return fail(400);
 const previous=read(stateFile(root));
 const same=previous?.installationId===body.installationId&&previous?.sessionId===body.sessionId;
 const ids=same?(previous.ids||[]):[];
 const priorDigests=same?(previous.digests||{}):{};
 const known=new Set(ids),digests={...priorDigests},accepted=[];
 for(const e of clean){
   const hash=digest(e);
   if(digests[e.id]&&digests[e.id]!==hash)return fail(409);
   digests[e.id]=hash;
 }
 // Always send visit replays through Rust, even if Studio has seen the ID before.
 // Only Rust's durable node can authenticate a same-ID visit or reject a conflict.
 const visits=clean.filter(e=>e.type==='visit.observed');
 let result;
 if(visits.length){
   try{result=await ingestVisits({schema:'vivim.browser-companion/1',
     installationId:body.installationId,sessionId:body.sessionId,events:visits});}
   catch{return fail(503);}
 }
 // The production bridge returns exact Rust accepted/inserted counts.
 // A partial or malformed receipt cannot authorize a transport ACK.
 if(visits.length&&result!==undefined&&
    (!Number.isSafeInteger(result?.accepted)||result.accepted!==visits.length||
     !Number.isSafeInteger(result?.inserted)||result.inserted<0||
     result.inserted>result.accepted))return fail(503);
 const freshVisits=visits.filter(e=>!known.has(e.id));
 // Rust reports inserted=0 for a replay even after Studio lost its local state.
 const inserted=Number.isSafeInteger(result?.inserted)&&result.inserted>=0
   ?result.inserted:freshVisits.length;
 let providers=same?(previous.providers||[]):[];
 const notifications=[];
 for(const e of clean){
   accepted.push(e.id);
   if(known.has(e.id))continue;
   known.add(e.id);
   if(e.type==='snapshot'){
     const counts={};for(const t of e.tabs)counts[t.provider]=(counts[t.provider]||0)+1;
     providers=Object.entries(counts).map(([id,tabCount])=>({id,tabCount}));
   }
   if(e.type!=='visit.observed')notifications.push({kind:'browser-companion.changed',
     eventType:e.type,provider:e.tab?.provider||null,observedAt:e.at,verified:false});
 }
 // UI notifications are not evidence. Core inserted count governs the visit projection
 // and may be zero if a previously persisted event is replayed after an interrupted ACK.
 if(inserted===freshVisits.length&&inserted>0) for(const e of freshVisits)notifications.push({
   kind:'web-memory.observed',site:e.page.site,observedAt:e.at,
   verified:true,source:'rust-journal'});
 const recent=[...known].slice(-512),recentSet=new Set(recent);
 const recentDigests=Object.fromEntries(Object.entries(digests).filter(([id])=>recentSet.has(id)));
 const lastSeen=new Date(now()).toISOString();
 atomic(stateFile(root),{installationId:body.installationId,sessionId:body.sessionId,
   lastSeen,latestSnapshotAt:clean.filter(e=>e.type==='snapshot').at(-1)?.at||
      previous?.latestSnapshotAt||null,providers,
   visits:(previous?.installationId===body.installationId?previous.visits||0:0)+inserted,ids:recent,digests:recentDigests});
 for(const note of notifications)try{publish('event',note,null);}catch{/* local UI is not durable evidence */}

 return{status:200,headers,body:{schema:'vivim.browser-companion-ack/1',acceptedIds:accepted}};
 };
}
