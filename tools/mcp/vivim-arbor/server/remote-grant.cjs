'use strict';
// OAuth resource-server boundary for the future HTTP MCP profile. Not a token issuer.
// The operator configures a trusted issuer/key; no key, issuer or scope comes from tool args.
// This is only remote admission; ARBOR Host still owns every effect and source grant.
const {createPublicKey,verify}=require('node:crypto');
const SCOPE='vivim:host:read';
const deny=()=>{throw new Error('Remote authorization denied');};
const own=(o,k)=>Object.hasOwn(o,k);
function decode(part){
  if(!/^[A-Za-z0-9_-]+$/.test(part))deny();
  const bytes=Buffer.from(part,'base64url');
  if(bytes.toString('base64url')!==part)deny();
  const value=JSON.parse(bytes.toString('utf8'));
  if(!value||typeof value!=='object'||Array.isArray(value))deny();
  return value;
}
function httpsIdentity(value){
  const u=new URL(value);
  return u.protocol==='https:'&&!u.username&&!u.password&&!u.hash&&!u.search;
}
function authorizeHostDiscovery(header,policy,now=Math.floor(Date.now()/1000)){
  try{
    if(policy?.enabled!==true||!Number.isSafeInteger(now)||now<0)deny();
    for(const k of ['issuer','audience','subject','keyId','publicKeyPem'])if(typeof policy[k]!=='string'||!policy[k].length)deny();
    if(!httpsIdentity(policy.issuer)||!httpsIdentity(policy.audience))deny();
    if(typeof header!=='string'||header.length>16384||!/^Bearer [A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/i.test(header))deny();
    const [a,b,c]=header.slice(7).split('.');
    const h=decode(a),claims=decode(b);
    if(h.alg!=='RS256'||h.kid!==policy.keyId||h.typ!=='at+jwt'||['crit','jku','jwk','x5u','x5c'].some(k=>own(h,k)))deny();
    const key=createPublicKey(policy.publicKeyPem);
    if(key.asymmetricKeyType!=='rsa'||key.asymmetricKeyDetails.modulusLength<2048)deny();
    const signature=Buffer.from(c,'base64url');
    if(signature.toString('base64url')!==c||!verify('RSA-SHA256',Buffer.from(a+'.'+b),key,signature))deny();
    const aud=claims.aud;
    if(claims.iss!==policy.issuer||claims.sub!==policy.subject||!(aud===policy.audience||(Array.isArray(aud)&&aud.length===1&&aud[0]===policy.audience)))deny();
    if(!Number.isSafeInteger(claims.iat)||!Number.isSafeInteger(claims.exp)||claims.iat>now||claims.exp<=now||claims.exp<=claims.iat||claims.exp-claims.iat>900)deny();
    if(own(claims,'nbf')&&(!Number.isSafeInteger(claims.nbf)||claims.nbf>now||claims.nbf>=claims.exp))deny();
    if(typeof claims.scope!=='string'||!claims.scope.split(' ').includes(SCOPE))deny();
    return Object.freeze({scope:SCOPE});
  }catch{deny();}
}
module.exports={authorizeHostDiscovery};
