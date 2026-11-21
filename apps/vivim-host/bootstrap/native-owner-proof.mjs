// Read-only proof that the localhost Host knows the existing owner capability.
// Never returns the token, creates a grant/session, or authorizes an effect.
import { createHmac } from 'node:crypto';
export const NATIVE_OWNER_PROOF_SCHEMA = 'vivim.host-owner-proof/1';
export function nativeOwnerProof(challenge, ownerToken) {
  if (typeof challenge !== 'string' || !/^[0-9a-f]{64}$/.test(challenge) ||
      typeof ownerToken !== 'string' || ownerToken.length < 32) {
    throw new Error('HOST_PROOF_INPUT_INVALID');
  }
  const message = NATIVE_OWNER_PROOF_SCHEMA + '\n' + challenge;
  return {
    schema: NATIVE_OWNER_PROOF_SCHEMA,
    challenge,
    mac: createHmac('sha256', ownerToken).update(message, 'utf8').digest('hex')
  };
}
