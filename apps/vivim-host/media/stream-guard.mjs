// Active media reads remain bound to Host-owned device authority, not just
// the grant snapshot observed when the HTTP request began.
// No token persistence, file scanning or alternative approval path.
import { Transform } from 'node:stream';

const MAX_UNVERIFIED_BYTES = 256 * 1024;
const MAX_UNVERIFIED_MS = 200;

export function createMediaStreamGrantGuard({
  validateGrant, grantId, sessionId, now = Date.now
} = {}) {
  if (typeof validateGrant !== 'function' || typeof grantId !== 'string' ||
      typeof sessionId !== 'string') throw new TypeError('MEDIA_GRANT_GUARD_INVALID');
  let checkedAt = null;
  let bytesSinceCheck = 0;
  function validate() {
    const grant = validateGrant({grantId,sessionId});
    if (!Array.isArray(grant?.scopes) || !grant.scopes.includes('control:read'))
      throw Object.assign(new Error('MEDIA_STREAM_SCOPE_DENIED'),{status:403});
    checkedAt = now();
    bytesSinceCheck = 0;
  }
  return new Transform({
    transform(chunk, encoding, callback) {
      try {
        const current = now();
        if (checkedAt === null || current - checkedAt >= MAX_UNVERIFIED_MS ||
            bytesSinceCheck >= MAX_UNVERIFIED_BYTES) validate();
        bytesSinceCheck += chunk.length;
        callback(null,chunk);
      } catch(error) { callback(error); }
    },
    flush(callback) {
      try { validate(); callback(); }
      catch(error) { callback(error); }
    }
  });
}
