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
const TARGET_ID = /^[a-zA-Z0-9_-]{16,64}$/;
const SITE_ID = /^[a-z][a-z0-9_-]{1,63}$/;
const localPreflight = code => Object.assign(new Error(code),{code});


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

  // Explicit owner actions pass through the existing Host Control plan, approval,
  // single-claim journal and effect receipt. They are NOT called by PWA reads,
  // timers, boot, status, AI candidates or application rendering.
  async function captureStart(target) {
    if(typeof target!=='string'||!TARGET_ID.test(target))
      throw localPreflight('STUDIO_CAPTURE_TARGET_INVALID');
    const status=await request('/status',undefined,1500);
    if(status.recorder?.state!=='idle' ||
       status.browserConnection?.state!=='available' ||
       status.browserConnection.verified!==true)
      throw localPreflight('STUDIO_CAPTURE_PREFLIGHT');
    const targets=await request('/targets',undefined,1500);
    if(!Array.isArray(targets)||targets.length>32 ||
       !targets.some(t=>t?.id===target&&t?.type==='page'))
      throw localPreflight('STUDIO_CAPTURE_TARGET_STALE');
    // A response lost after this POST is UNCERTAIN in the Host journal.
    const started=await request('/record/start',{target},30000);
    if(typeof started.id!=='string'||started.id.length>160)
      throw localPreflight('STUDIO_CAPTURE_POST_UNCERTAIN');
    return {state:'start_requested',sessionId:started.id,
      note:'Recording is owned by Studio; verify its live status before proceeding.'};
  }
  async function captureStop() {
    const status=await request('/status',undefined,1500);
    if(status.recorder?.state!=='recording' ||
       typeof status.recorder.id!=='string'||!status.recorder.id)
      throw localPreflight('STUDIO_CAPTURE_NOT_RECORDING');
    const id=status.recorder.id;
    const ended=await request('/record/stop',{},30000);
    if(ended.id!==id)throw localPreflight('STUDIO_CAPTURE_POST_UNCERTAIN');
    return {state:'stop_requested',sessionId:id,
      note:'Studio finalized the source session; inspect its saved record.'};
  }
  async function driveDryRun(site) {
    if(typeof site!=='string'||!SITE_ID.test(site))
      throw localPreflight('STUDIO_DRIVE_SITE_INVALID');
    const available=await request('/drive/sites',undefined,1500);
    if(!Array.isArray(available.sites)||available.sites.length>32 ||
       !available.sites.some(row=>row?.id===site))
      throw localPreflight('STUDIO_DRIVE_SITE_STALE');
    // Fixed dryRun=true: an owner cannot upgrade this action into a provider
    // send by altering args or by executing a replayed approved plan.
    const accepted=await request('/drive/jobs',{
      mode:'drive',sites:[site],dryRun:true,confirm:false
    },30000);
    const job=accepted?.job;
    if(!UUID.test(job?.id)||job.mode!=='drive'||job.dryRun!==true)
      throw localPreflight('STUDIO_DRIVE_POST_UNCERTAIN');
    return {jobId:job.id,mode:'drive',dryRun:true,state:job.state,
      note:'Plan only; no browser was opened or provider message sent by this action.'};
  }
  async function driveCancel(jobId) {
    if(typeof jobId!=='string'||!UUID.test(jobId))
      throw localPreflight('STUDIO_DRIVE_JOB_INVALID');
    const existing=await request('/drive/jobs/'+enc(jobId),undefined,1500);
    if(existing?.job?.id!==jobId ||
       !['running','queued'].includes(existing.job.state))
      throw localPreflight('STUDIO_DRIVE_JOB_NOT_ACTIVE');
    const response=await request('/drive/jobs/'+enc(jobId)+'/cancel',{},30000);
    if(response?.job?.id!==jobId)throw localPreflight('STUDIO_DRIVE_POST_UNCERTAIN');
    return {jobId,cancellationRequested:true,
      state:response.job.state,
      note:'Cancellation is after the current site; this does not cancel a provider reply already sent.'};
  }
  return {
    origin: base.origin,
    captureStart, captureStop, driveDryRun, driveCancel,
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
