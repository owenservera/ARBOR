// Single-use Direct device enrollment. Explicitly separate it from legacy relay-secret pairing.
export function parsePairFragment(fragment) {
  const raw = String(fragment || '').replace(/^#/, '');
  if (!raw || raw.startsWith('ask=') || /^share-token=[a-f0-9]{64}$/.test(raw)) return {type:'none'};
  let value;
  try { value = decodeURIComponent(raw); } catch { return {type:'invalid'}; }
  if (/^[a-f0-9]{64}$/.test(value)) return {type:'device',token:value};
  if (/^[A-Za-z0-9._~-]{8,256}$/.test(value)) return {type:'legacy',value};
  return {type:'invalid'};
}
export async function redeemDevicePairToken(token, {direct,fetchImpl}) {
  if (!direct) throw new Error('Open this link through your private VIVIM connection.');
  if (!/^[a-f0-9]{64}$/.test(String(token || ''))) throw new Error('Invalid pairing code.');
  const response = await fetchImpl('/mobile/api/pair', {
    method:'POST',credentials:'same-origin',cache:'no-store',
    headers:{'content-type':'application/json'},body:JSON.stringify({token})
  });
  const body = await response.json().catch(() => null);
  if (!response.ok || !body?.enrollmentRequired || typeof body.challengeId !== 'string') {
    const reason = body?.error || 'Pairing was not confirmed';
    throw new Error(response.status === 410 ? 'This code expired. Create a new code on the PC.' :
      response.status === 409 ? 'This device is already paired or this code was used.' : reason);
  }
  return { ...body, paired: false, status: 'enrollment_required' };
}
