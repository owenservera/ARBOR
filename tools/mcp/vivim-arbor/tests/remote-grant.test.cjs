'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {generateKeyPairSync,sign}=require('node:crypto');
const {authorizeHostDiscovery}=require('../server/remote-grant.cjs');
const keys=generateKeyPairSync('rsa',{modulusLength:2048});
const other=generateKeyPairSync('rsa',{modulusLength:2048});
const now=1800000000;
const policy={enabled:true,issuer:'https://auth.fixture.invalid/',audience:'https://mcp.fixture.invalid/mcp',subject:'owner-fixture',keyId:'fixture-key',publicKeyPem:keys.publicKey.export({type:'spki',format:'pem'})};
const encode=x=>Buffer.from(JSON.stringify(x)).toString('base64url');
function token(claims={},header={},key=keys.privateKey){
  const a=encode({alg:'RS256',kid:policy.keyId,typ:'at+jwt',...header});
  const b=encode({iss:policy.issuer,aud:policy.audience,sub:policy.subject,iat:now-1,exp:now+60,scope:'vivim:host:read',...claims});
  return 'Bearer '+a+'.'+b+'.'+sign('RSA-SHA256',Buffer.from(a+'.'+b),key).toString('base64url');
}
const denied=(value,p=policy)=>assert.throws(()=>authorizeHostDiscovery(value,p,now),/^Error: Remote authorization denied$/);
test('valid owner access token admits only fixed read scope',()=>{
  assert.deepEqual(authorizeHostDiscovery(token(),policy,now),{scope:'vivim:host:read'});
  assert.deepEqual(authorizeHostDiscovery(token({aud:[policy.audience],scope:'vivim:host:read vivim:host:write'}),policy,now),{scope:'vivim:host:read'});
});
test('disabled or missing local policy revokes existing grant',()=>{
  const t=token();denied(t,{...policy,enabled:false});denied(t,{});denied(t,{...policy,subject:'new-owner'});
});
test('reject invalid signature, algorithm and key metadata',()=>{
  denied(token({}, {},other.privateKey));denied(token({}, {alg:'none'}));denied(token({}, {kid:'other'}));denied(token({}, {typ:'JWT'}));denied(token({}, {jku:'https://evil.invalid'}));denied(token({}, {crit:[]}));
});
test('reject issuer, audience, owner or scope mismatch',()=>{
  for(const c of [{iss:'https://other.invalid/'},{aud:'https://other.invalid/mcp'},{aud:[policy.audience,'other']},{sub:'other-user'},{scope:'vivim:host:write'},{scope:'vivim:host:read-more'}])denied(token(c));
});
test('reject expired, premature and excessive lifetime access tokens',()=>{
  for(const c of [{exp:now},{iat:now+1},{exp:now+901},{nbf:now+1},{nbf:now+60},{iat:'1'},{exp:null}])denied(token(c));
});
test('reject malformed or absent credentials with generic denial',()=>{
  for(const t of [null,'','Bearer abc','Basic abc','Bearer '+ 'x'.repeat(17000),token()+'='])denied(t);
});
