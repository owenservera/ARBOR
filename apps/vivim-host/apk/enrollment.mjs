// APK07 per-device enrollment scaffolding.
// Challenges are single-use, short-lived, and bound to a Host instance. The phone
// generates its own device key (Android Keystore on device; here we accept the
// public key + signature proof) and the Host commits a scoped, revocable grant only
// after explicit owner approval (PC-only approve/revoke routes live on the Host).
import { createHash, randomBytes, createPublicKey, verify, timingSafeEqual } from 'node:crypto';
import { existsSync, mkdirSync, writeFileSync, readFileSync, unlinkSync, renameSync, openSync, closeSync } from 'node:fs';
import path from 'node:path';

const CHALLENGE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const GRANT_DIR_NAME = 'device-grants';
const fail = (code, status = 403) => { throw Object.assign(new Error(code), { status, code }); };
const same = (a, b) => {
  const x = Buffer.from(String(a ?? '')); const y = Buffer.from(String(b ?? ''));
  return x.length === y.length && timingSafeEqual(x, y);
};
const requireDeviceSignature = (pem, message, signature) => {
  if (typeof message !== 'string' || typeof signature !== 'string' ||
      !/^[A-Za-z0-9+/]+={0,2}$/.test(signature)) fail('INVALID_DEVICE_SIGNATURE', 403);
  let key;
  try {
    key = createPublicKey(pem);
    if (key.asymmetricKeyType !== 'ec' || key.asymmetricKeyDetails?.namedCurve !== 'prime256v1') fail('UNSUPPORTED_DEVICE_KEY', 400);
    if (!verify('sha256', Buffer.from(message, 'utf8'), key, Buffer.from(signature, 'base64'))) fail('INVALID_DEVICE_SIGNATURE', 403);
  } catch (error) {
    if (error.status) throw error;
    fail('INVALID_DEVICE_SIGNATURE', 403);
  }
};


export function createEnrollment({ dataRoot, origin, user }) {
  const dir = path.join(dataRoot, GRANT_DIR_NAME);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true, mode: 0o700 });
  const grantsPath = path.join(dir, 'grants.json');
  // challenges: challengeId -> { challenge, nonce, expiresAt, origin, user, deviceHint }
  const challenges = new Map();

  // The same Host and Tailscale subprocesses may open independent grant-store
  // instances. CAS + exclusive lock prevents a stale writer from overwriting a
  // new approval, revoke or session. Crash-left locks deliberately fail closed.
  const BASELINE=Symbol('device-grants-baseline');
  const lockPath=path.join(dir,'grants.writer.lock');
  const digestRaw=raw=>raw===null?null:createHash('sha256').update(raw).digest('hex');
  const stamp=(grants,raw)=>Object.defineProperty(grants,BASELINE,{
    value:digestRaw(raw),enumerable:false,configurable:false
  });
  const readRaw=()=>{
    try{return readFileSync(grantsPath,'utf8');}
    catch(error) {
      if(error.code==='ENOENT')return null;
      fail('GRANT_STORE_UNREADABLE',503);
    }
  };
  const loadGrants=()=>{
    const raw=readRaw();
    if(raw===null)return stamp([],null);
    let parsed;
    try{parsed=JSON.parse(raw);}catch{fail('GRANT_STORE_CORRUPT',503);}
    if(!Array.isArray(parsed)||parsed.some(g=>!g||typeof g!=='object'||
      typeof g.grantId!=='string'||typeof g.status!=='string'||
      !Array.isArray(g.scopes)))fail('GRANT_STORE_CORRUPT',503);
    return stamp(parsed,raw);
  };
  const saveGrants=(grants)=>{
    if(!Array.isArray(grants)||!Object.hasOwn(grants,BASELINE))
      fail('GRANT_UNVERSIONED_UPDATE',409);
    let lock;
    try{lock=openSync(lockPath,'wx',0o600);}
    catch(error) {
      if(error.code==='EEXIST')fail('GRANT_WRITER_BUSY',409);
      fail('GRANT_STORE_UNREADABLE',503);
    }
    try{
      if(digestRaw(readRaw())!==grants[BASELINE])fail('GRANT_STORE_CHANGED',409);
      const tmp=grantsPath+'.'+randomBytes(8).toString('hex')+'.tmp';
      try{
        writeFileSync(tmp,JSON.stringify(grants,null,2),{mode:0o600});
        renameSync(tmp,grantsPath);
      } finally {
        try{unlinkSync(tmp);}catch(error){if(error.code!=='ENOENT')throw error;}
      }
    }finally{
      try{closeSync(lock);}finally{unlinkSync(lockPath);}
    }
  };
  const now = () => Date.now();

  // Issue a one-time enrollment challenge. Rate-limited by caller elsewhere.
  const startChallenge = ({ deviceHint } = {}) => {
    const challengeId = randomBytes(16).toString('hex');
    const nonce = randomBytes(32).toString('hex');
    const challenge = randomBytes(32).toString('hex');
    const expiresAt = now() + CHALLENGE_TTL_MS;
    challenges.set(challengeId, { challenge, nonce, expiresAt, origin, user, deviceHint, proved: false });
    return { challengeId, challenge, nonce, origin, user, expiresAt, ttlMs: CHALLENGE_TTL_MS };
  };

  // Verify proof-of-possession: client signs transcript with its device key.
  // Returns a pending grant (not active until owner approves).
  const prove = ({ challengeId, publicKeyPem, signature, requestedScopes = [], signedTranscript }) => {
    const entry = challenges.get(challengeId);
    if (!entry) throw Object.assign(new Error('CHALLENGE_UNKNOWN'), { status: 404 });
    if (now() > entry.expiresAt) { challenges.delete(challengeId); throw Object.assign(new Error('CHALLENGE_EXPIRED'), { status: 410 }); }
    if (entry.proved) throw Object.assign(new Error('CHALLENGE_ALREADY_PROVED'), { status: 409 });
    // A signature MUST bind to the Host-issued challenge and this exact origin/user.
    // No caller-provided transcript can redefine what was signed.
    const canonical = ['vivim-enrollment-v1', entry.challengeId || challengeId,
      entry.challenge, entry.nonce, entry.origin, entry.user].join('\\n');
    if (!same(signedTranscript, canonical)) fail('TRANSCRIPT_MISMATCH', 403);
    requireDeviceSignature(publicKeyPem, canonical, signature);
    if (!Array.isArray(requestedScopes) || requestedScopes.length > 32 ||
        requestedScopes.some(s => typeof s !== 'string' || !/^[a-z][a-z0-9:.-]{0,63}$/.test(s))) fail('INVALID_SCOPES', 400);
    // Successful proof alone does not consume the one-shot challenge if the
    // Host cannot persist the pending grant (for example a competing writer).
    const deviceFingerprint = createHash('sha256').update(publicKeyPem).digest('hex');
    const deviceId = deviceFingerprint.slice(0, 32);
    const grantId = randomBytes(16).toString('hex');
    const grant = {
      grantId, deviceId, publicKeyPem, deviceKeyFingerprint: deviceFingerprint,
      status: 'pending', scopes: requestedScopes, createdAt: new Date().toISOString(),
      expiresAt: null, revokedAt: null, challengeId, origin, user,
    };
    const grants = loadGrants();
    grants.push(grant);
    saveGrants(grants);
    entry.proved = true;
    challenges.delete(challengeId);
    return { grantId, deviceId, status: 'pending', scopes: requestedScopes, note: 'awaiting owner approval on PC' };
  };

  const status = ({ challengeId }) => {
    const entry = challenges.get(challengeId);
    if (!entry) throw Object.assign(new Error('CHALLENGE_UNKNOWN'), { status: 404 });
    return {
      challengeId, proved: entry.proved, expiresAt: entry.expiresAt,
      ttlRemainingMs: Math.max(0, entry.expiresAt - now()),
    };
  };

  // Device session: short-lived, bound to an active grant. Returns session proof.
  const createSession = ({ grantId, deviceKeyProof, nonce, timestamp }) => {
    const grants = loadGrants();
    const grant = grants.find((g) => g.grantId === grantId);
    if (!grant) throw Object.assign(new Error('GRANT_UNKNOWN'), { status: 404 });
    if (grant.status !== 'active') throw Object.assign(new Error('GRANT_NOT_ACTIVE'), { status: 403 });
    if (grant.revokedAt) throw Object.assign(new Error('GRANT_REVOKED'), { status: 403 });
    // A nonce is one-shot, and the signature is bound to a short timestamp window.
    // The signed message cannot be reused to mint multiple sessions.
    if (typeof nonce !== 'string' || !/^[a-f0-9]{32,64}$/.test(nonce) ||
        !Number.isSafeInteger(timestamp) || Math.abs(now() - timestamp) > 120000) fail('SESSION_PROOF_STALE', 403);
    if ((grant.usedSessionNonces || []).some(x => x.value === nonce) || grant.lastSessionNonce === nonce) fail('SESSION_PROOF_REPLAY', 409);
    requireDeviceSignature(grant.publicKeyPem,
      ['vivim-session-v1', grantId, nonce, String(timestamp), origin, user].join('\\n'), deviceKeyProof);
    const sessionId = randomBytes(16).toString('hex');
    grant.lastSessionNonce = nonce;
    // Keep every nonce within the accepted 2-minute proof window across restarts.
    // Timestamps are bounded at session creation; the list cannot grow indefinitely.
    grant.usedSessionNonces = [...(grant.usedSessionNonces || []).filter(x => x && now() - x.at < 240000), { value: nonce, at: now() }];
    const expiresAt = now() + 4 * 60 * 60 * 1000; // 4 hours
    grant.sessionId = sessionId;
    grant.sessionExpiresAt = expiresAt;
    grant.lastSeen = new Date().toISOString();
    saveGrants(grants);
    return { sessionId, grantId, deviceId: grant.deviceId, scopes: grant.scopes, expiresAt };
  };

  return {
    startChallenge, prove, status, createSession,
    grantStatus: ({ grantId }) => {
      const grant = loadGrants().find(g => g.grantId === grantId);
      if (!grant) fail('GRANT_UNKNOWN', 404);
      return { grantId, status: grant.status };
    },
    listGrants: () => loadGrants().map(({ publicKeyPem, deviceKeyFingerprint, lastSessionNonce, usedSessionNonces, sessionId, sessionExpiresAt, ...g }) => g), // never return raw key material
    // PC-only: owner approves a pending grant with explicit scopes.
    approveGrant: ({ grantId, approvedScopes, approvedBy }) => {
      const grants = loadGrants();
      const grant = grants.find((g) => g.grantId === grantId);
      if (!grant) throw Object.assign(new Error('GRANT_UNKNOWN'), { status: 404 });
      if (grant.status !== 'pending') throw Object.assign(new Error('GRANT_NOT_PENDING'), { status: 409 });
      if (!Array.isArray(approvedScopes) || approvedScopes.some(s => !grant.scopes.includes(s)) || new Set(approvedScopes).size !== approvedScopes.length) fail('INVALID_APPROVED_SCOPES', 400);
      grant.status = 'active';
      grant.scopes = approvedScopes;
      grant.approvedBy = approvedBy;
      grant.approvedAt = new Date().toISOString();
      saveGrants(grants);
      return { grantId, status: 'active', scopes: grant.scopes };
    },
    // PC-only: revoke a grant.
    revokeGrant: ({ grantId, revokedBy }) => {
      const grants = loadGrants();
      const grant = grants.find((g) => g.grantId === grantId);
      if (!grant) throw Object.assign(new Error('GRANT_UNKNOWN'), { status: 404 });
      grant.status = 'revoked';
      grant.revokedAt = new Date().toISOString();
      grant.revokedBy = revokedBy;
      saveGrants(grants);
      return { grantId, status: 'revoked' };
    },
    // Validate an active grant + session for a mutating request.
    validateGrant: ({ grantId, sessionId }) => {
      const grants = loadGrants();
      const grant = grants.find((g) => g.grantId === grantId);
      if (!grant) throw Object.assign(new Error('GRANT_UNKNOWN'), { status: 404 });
      if (grant.status !== 'active') throw Object.assign(new Error('GRANT_NOT_ACTIVE'), { status: 403 });
      if (grant.revokedAt) throw Object.assign(new Error('GRANT_REVOKED'), { status: 403 });
      if (now() > (grant.sessionExpiresAt || 0)) throw Object.assign(new Error('SESSION_EXPIRED'), { status: 403 });
      if (grant.sessionId !== sessionId) throw Object.assign(new Error('SESSION_MISMATCH'), { status: 403 });
      return grant;
    },
  };
}
