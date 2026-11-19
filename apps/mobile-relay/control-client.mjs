// One client for both the Control tab and Talk's VIVIM mode.
// The Host's existing dispatcher remains the only action planner and effect writer.
// No cloud fallback, no inferred grant, no implicit approval or retry after uncertainty.
export function createControlClient({ transport, fetchImpl = (...args) => fetch(...args) } = {}) {
  if (!transport || typeof transport.deviceHeaders !== 'function')
    throw new TypeError('A Direct-capable VIVIM transport is required');

  async function directReady(signal) {
    if (transport.direct !== true) return false;
    try {
      const response = await fetchImpl('/mobile/connection.json', {
        method: 'GET', credentials: 'same-origin', cache: 'no-store', ...(signal?{signal}:{})
      });
      if (!response.ok) return false;
      const data = await response.json();
      return data?.direct === true && data?.directOnly === true && data?.cloudEnabled === false;
    } catch {
      return false;
    }
  }

  async function call(path, body) {
    const signal=path==='interpret'&&body?.composer===true?AbortSignal.timeout(5000):undefined;
    if (!await directReady(signal)) throw Object.assign(
      new Error('Direct connection to your paired PC is required. Nothing was sent.'),
      { code: 'DIRECT_REQUIRED' });
    const device = transport.deviceHeaders();
    if (!device) throw Object.assign(
      new Error('Approve this phone on the PC before using private control.'),
      { code: 'DEVICE_GRANT_REQUIRED' });
    const writing = body !== undefined;
    if (!['catalog', 'language', 'world', 'lexicon', 'recent', 'programs', 'interpret', 'plan', 'execute'].includes(path) &&
        !/^plans\/ctl-[a-f0-9]{16}$/.test(path))
      throw new TypeError('Unknown control operation');
    if (writing && !['interpret', 'plan', 'execute'].includes(path)) throw new TypeError('Invalid control method');
    if (!writing && ['interpret', 'plan', 'execute'].includes(path)) throw new TypeError('Control body required');

    // For a mutating operation a lost response is UNCERTAIN, never safe to re-issue.
    let response;
    try {
      response = await fetchImpl('/mobile/api/control/' + path, {
        method: writing ? 'POST' : 'GET', credentials: 'same-origin', cache: 'no-store',
        headers: { ...device, ...(writing ? {
          'content-type': 'application/json', 'x-vivim-control': '1'
        } : {}) },
        ...(writing ? { body: JSON.stringify(body) } : {}),
        ...(signal?{signal}:{})
      });
    } catch {
      throw Object.assign(new Error(path === 'execute'
        ? 'Outcome uncertain. Check the PC receipt; VIVIM will not retry automatically.'
        : 'The PC could not be reached. No control action was executed.'), {
          code: path === 'execute' ? 'CONTROL_UNCERTAIN' : 'CONTROL_CONNECTION_UNAVAILABLE'
        });
    }
    let data;
    try { data = await response.json(); }
    catch {
      throw Object.assign(new Error(path === 'execute'
        ? 'Execution response was unreadable. Check the PC before another action.'
        : 'The PC returned an unreadable response.'), {
          code: path === 'execute' ? 'CONTROL_UNCERTAIN' : 'CONTROL_RESPONSE_INVALID'
        });
    }
    if (path === 'execute' && response.status >= 500) {
      throw Object.assign(new Error('Outcome uncertain. Check the PC receipt; nothing is automatically repeated.'), {
        code: 'CONTROL_UNCERTAIN'
      });
    }
    if (!response.ok) throw Object.assign(
      new Error(String(data?.error || data?.code || 'PC refused the control request').slice(0, 160)),
      { code: data?.code || 'CONTROL_REFUSED', status: response.status });
    return data;
  }

  function validatePlan(plan) {
    if (!plan || plan.outcome !== 'approval_required' ||
        typeof plan.planId !== 'string' || !/^ctl-[a-f0-9]{16}$/.test(plan.planId) ||
        typeof plan.planDigest !== 'string' || !/^[a-f0-9]{64}$/.test(plan.planDigest) ||
        typeof plan.expiresAt !== 'string' || !Number.isFinite(Date.parse(plan.expiresAt)))
      throw Object.assign(new Error('Host returned an invalid approval plan; nothing changed.'), { code:'CONTROL_PLAN_INVALID' });
    if (Date.parse(plan.expiresAt) <= Date.now())
      throw Object.assign(new Error('This plan expired. Preview it again; nothing changed.'), { code:'CONTROL_PLAN_EXPIRED' });
    return { planId: plan.planId, planDigest: plan.planDigest };
  }

  return Object.freeze({
    directReady,
    call,
    interpret: text => call('interpret', { text }),
    assist: text => call('interpret', { text, composer:true }),
    preview: text => call('plan', { text }),
    async execute(plan) {
      const target = validatePlan(plan);
      const receipt = await call('execute', target);
      // An accepted HTTP response without a matching durable receipt does not
      // establish what happened. Never offer automatic execution retry.
      if (!receipt || receipt.schema !== 'vivim.control-receipt/1' ||
          receipt.planId !== target.planId || receipt.planDigest !== target.planDigest ||
          !['applied', 'failed', 'uncertain'].includes(receipt.status) ||
          (['ui.visual.apply','wiki.capture.save','program.write_wiki'].includes(plan.actionId)&&(receipt.actionId!==plan.actionId||
           !plan.approvalMeaning?.semanticDigest||receipt.semanticDigest!==plan.approvalMeaning.semanticDigest))) {
        throw Object.assign(new Error('Host receipt could not be verified. Check the PC before another action.'), {
          code: 'CONTROL_UNCERTAIN'
        });
      }
      return receipt;
    },
    validatePlan,
    status: planId => {
      if (typeof planId !== 'string' || !/^ctl-[a-f0-9]{16}$/.test(planId))
        throw new TypeError('Invalid control plan ID');
      return call('plans/' + planId);
    }
  });
}
