// Loopback HTTP port to the Studio conversation API. Studio stays the only browser owner and
// send-once journal; this file only speaks its documented routes and never touches CDP or Chrome.
// Shared with Studio CLI relay default; no second browser owner or embedded provider token.
export const DEFAULT_STUDIO_ORIGIN = 'http://127.0.0.1:38787';
const CODE = /^[A-Z][A-Z0-9_]{0,79}$/;
const enc = encodeURIComponent;

export function createStudioPort({ url, token = null, fetchImpl = fetch, timeoutMs = 30000 } = {}) {
  let base;
  try { base = new URL(url); } catch { throw new TypeError('Studio URL must be a loopback HTTP origin'); }
  if (base.protocol !== 'http:' || !['127.0.0.1', 'localhost', '[::1]'].includes(base.hostname) || base.origin !== url || base.username || base.password)
    throw new TypeError('Studio URL must be a loopback HTTP origin');

  async function request(route, body) {
    const headers = { ...(body === undefined ? {} : { 'content-type': 'application/json' }), ...(token ? { 'x-studio-token': token } : {}) };
    const response = await fetchImpl(base.origin + '/api/v1' + route, {
      method: body === undefined ? 'GET' : 'POST', redirect: 'error', signal: AbortSignal.timeout(timeoutMs), headers,
      ...(body === undefined ? {} : { body: JSON.stringify(body) })
    });
    let result;
    try { result = await response.json(); } catch { throw Object.assign(new Error('STUDIO_INVALID_RESPONSE'), { code: 'STUDIO_INVALID_RESPONSE' }); }
    if (!response.ok) {
      const code = typeof result?.code === 'string' && CODE.test(result.code) ? result.code : 'STUDIO_HTTP_ERROR';
      throw Object.assign(new Error(code), { code, status: response.status });
    }
    return result;
  }

  return {
    origin: base.origin,
    // A listing succeeds only when the Studio owner process is up and answering.
    reachable: async () => { try { await request('/conversations'); return true; } catch { return false; } },
    sites: async () => (await request('/conversation-targets')).sites ?? [],
    create: async ({ site = 'chatgpt' } = {}) => (await request('/conversations/create', { site })).conversation,
    submit: async (id, body) => request(`/conversations/${enc(id)}/turns`, body),
    get: async id => (await request(`/conversations/${enc(id)}`)).conversation,
    finish: async (id, { closeTab = false } = {}) => request(`/conversations/${enc(id)}/finish`, { closeTab })
  };
}
