// Loopback HTTP port to the Studio conversation API. Studio stays the only browser owner and
// send-once journal; this file only speaks its documented routes and never touches CDP or Chrome.
// Match existing Windows VIVIM.ps1 launcher (38730) and Studio relay default (38787).
// Explicit VIVIM_STUDIO_URL remains authoritative for custom launcher ports.
export function defaultStudioOrigin(platform = process.platform) {
  return platform === 'win32' ? 'http://127.0.0.1:38730' : 'http://127.0.0.1:38787';
}
const CODE = /^[A-Z][A-Z0-9_]{0,79}$/;
const enc = encodeURIComponent;

const CAPTURE_STATES = new Set(['idle','recording','stopping','paused','disconnected','error']);
const BROWSER_STATES = new Set(['available','not-running','profile-unverified']);
const DRIVE_STATES = new Set(['queued','running','done','failed','cancelled']);
const DRIVE_MODES = new Set(['drive','campaign']);
const UUID = /^[a-f0-9-]{36}$/i;

// Immutable, bounded and read-only compatibility projection. Never propagate
// Studio's source URLs, session details, prompts, raw replies, owner credentials
// or driver errors through the general Host/PWA summary.
export function projectStudioOperations(status, drive) {
  const capture = { state:'unavailable', recorderState:null, browserState:null, browserVerified:false };
  if (status && CAPTURE_STATES.has(status.recorder?.state) &&
      BROWSER_STATES.has(status.browserConnection?.state) &&
      typeof status.browserConnection?.verified === 'boolean') {
    capture.state='source-backed';
    capture.recorderState=status.recorder.state;
    capture.browserState=status.browserConnection.state;
    capture.browserVerified=status.browserConnection.verified === true &&
      capture.browserState === 'available';
  }
  const jobs = drive?.jobs;
  const safe = Array.isArray(jobs) && jobs.length <= 20 &&
    jobs.every(j=>j && UUID.test(j.id) && DRIVE_STATES.has(j.state) &&
      DRIVE_MODES.has(j.mode) && typeof j.dryRun === 'boolean');
  const archive = safe ? {
    state:'source-backed', shown:jobs.length,
    active:jobs.filter(j=>j.state==='running'||j.state==='queued').length,
    jobs:jobs.slice(0,8).map(j=>({
      id:j.id, state:j.state, mode:j.mode, dryRun:j.dryRun
    }))
  } : {state:'unavailable',shown:0,active:0,jobs:[]};
  return {schema:'vivim.studio-operations/1',
    state:capture.state==='source-backed'||archive.state==='source-backed'
      ? 'source-backed':'unavailable',
    authority:'read-only',
    capture, drive:archive
  };
}

export function createStudioPort({ url, token = null, fetchImpl = fetch, timeoutMs = 30000 } = {}) {
  let base;
  try { base = new URL(url); } catch { throw new TypeError('Studio URL must be a loopback HTTP origin'); }
  if (base.protocol !== 'http:' || !['127.0.0.1', 'localhost', '[::1]'].includes(base.hostname) || base.origin !== url || base.username || base.password)
    throw new TypeError('Studio URL must be a loopback HTTP origin');

  async function request(route, body, requestTimeoutMs = timeoutMs) {
    const headers = { ...(body === undefined ? {} : { 'content-type': 'application/json' }), ...(token ? { 'x-studio-token': token } : {}) };
    const response = await fetchImpl(base.origin + '/api/v1' + route, {
      method: body === undefined ? 'GET' : 'POST', redirect: 'error', signal: AbortSignal.timeout(requestTimeoutMs), headers,
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
    // Two bounded Studio-owner GETs, never a browser action, provider send or
    // Drive job command. Unavailable sources are not silently treated as idle.
    operations: async () => {
      const [capture,drive]=await Promise.allSettled([
        request('/status',undefined,1200),request('/drive/jobs',undefined,1200)
      ]);
      return projectStudioOperations(capture.status==='fulfilled'?capture.value:null,
        drive.status==='fulfilled'?drive.value:null);
    },
    reachable: async () => { try { await request('/conversations'); return true; } catch { return false; } },
    sites: async () => (await request('/conversation-targets')).sites ?? [],
    create: async ({ site = 'chatgpt' } = {}) => (await request('/conversations/create', { site })).conversation,
    submit: async (id, body) => request(`/conversations/${enc(id)}/turns`, body),
    get: async id => (await request(`/conversations/${enc(id)}`)).conversation,
    finish: async (id, { closeTab = false } = {}) => request(`/conversations/${enc(id)}/finish`, { closeTab })
  };
}
