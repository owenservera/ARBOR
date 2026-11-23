// Read-only owner admission check for the EXISTING Studio-backed relay worker.
// A heartbeat must not claim that a browser send path is live merely because
// the bridge polling loop is still running. Never touches tabs, logs prompts,
// launches Studio, repairs sessions or retries a turn.
const allowedSites = new Set(['chatgpt']);
// Historical unreconciled turns are retained and their original command IDs
// remain fenced by the relay ledger. They must not deadlock a *new* independent
// conversation when Studio confirms no active writer. Never admit unknown or
// active states, and never turn an uncertain previous turn into a resend.
const passiveStates = new Set(['ready','closed','blocked','needs-reconciliation']);
const validLoopback = value => {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' &&
      ['127.0.0.1','localhost','[::1]'].includes(url.hostname) &&
      !url.username && !url.password && url.origin === value;
  } catch { return false; }
};
export async function probeStudioRelayReadiness({ url, fetchImpl = fetch, timeoutMs = 2500 } = {}) {
  if (!validLoopback(url) || typeof fetchImpl !== 'function')
    return { ready:false, reason:'STUDIO_ENDPOINT_INVALID' };
  const timeout = Number.isSafeInteger(timeoutMs) && timeoutMs >= 100 && timeoutMs <= 10000 ? timeoutMs : 2500;
  async function read(route, prefix = '/api/v1') {
    const response = await fetchImpl(url + prefix + route, {
      method:'GET', redirect:'error', cache:'no-store', signal:AbortSignal.timeout(timeout)
    });
    if (!response.ok) throw new Error('STUDIO_HTTP_UNAVAILABLE');
    return response.json();
  }
  try {
    // Site metadata and historical sessions do not prove an active signed-in
    // browser. Studio is the single owner: require its live read-only status.
    const status = await read('/status', '/api');
    if (status?.recorder?.state !== 'idle' ||
        status?.browserConnection?.state !== 'available' ||
        status?.browserConnection?.verified !== true)
      return { ready:false, reason:'STUDIO_BROWSER_UNVERIFIED' };
    const targets = await read('/conversation-targets');
    if (!Array.isArray(targets?.sites) ||
        !targets.sites.some(site => (typeof site === 'string' ? site : site?.id) === 'chatgpt'))
      return { ready:false, reason:'STUDIO_CHATGPT_UNAVAILABLE' };
    const conversations = await read('/conversations');
    if (!Array.isArray(conversations?.conversations))
      return { ready:false, reason:'STUDIO_OWNER_STATE_UNAVAILABLE' };
    // Studio owns the browser and exposes authoritative per-conversation
    // writer.active. A historical unresolved session with no writer is safe
    // to leave quarantined while creating a fresh unrelated thread; a missing
    // writer field, busy/attaching state, or unknown state is NOT safe.
    if (conversations.conversations.some(row =>
      !row || typeof row !== 'object' || !passiveStates.has(row.state) ||
      row.writer?.active !== false))
      return { ready:false, reason:'STUDIO_WRITER_BUSY_OR_UNKNOWN' };
    return { ready:true, reason:'STUDIO_OWNER_IDLE', supportedProviders:[...allowedSites] };
  } catch {
    return { ready:false, reason:'STUDIO_OWNER_UNREACHABLE' };
  }
}
