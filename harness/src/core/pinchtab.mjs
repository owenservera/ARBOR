// PinchTab adapter: same Browser/Page shape as src/core/cdp.mjs, but drives Chrome
// through a locally running PinchTab HTTP server instead of raw CDP.
//
// Routes used (all documented in sources/pinchtab/docs/reference):
//   GET  /instances/{id}/tabs            tab list for one instance (bare array)
//   POST /instances/{id}/tabs/open       body {url}; answers {tabId,url,title}
//   POST /tabs/{tabId}/evaluate          body {expression, awaitPromise}; answers {result}
//   POST /tabs/{tabId}/action            kinds: keyboard-inserttext, press, click
//
// Binding: every tab id reaches this adapter only through the instance-scoped list
// or open route, and attach() accepts only an exact id from that list. Per-tab
// routes are addressed as /tabs/{id}/... as documented.
//
// Safety: exactly one HTTP attempt per request (no retries). No approval logic here;
// callers (router/send) decide when a method runs.

const DENIED_PORT = 9222;
const REQUIRED_HOST = '127.0.0.1';

function coded(code, message) {
  return Object.assign(new Error(message), { code });
}

// Accepts only http://127.0.0.1:<port> with port != 9222. Returns the origin.
function validateBaseUrl(baseUrl) {
  let u;
  try { u = new URL(baseUrl); } catch { throw coded('PINCHTAB_HOST_REFUSED', 'PinchTab baseUrl refused'); }
  const port = Number(u.port || 80);
  if (u.protocol !== 'http:' || u.hostname !== REQUIRED_HOST || port === DENIED_PORT) {
    throw coded('PINCHTAB_HOST_REFUSED', 'PinchTab baseUrl refused');
  }
  return u.origin;
}

function requireString(value, code, message) {
  if (typeof value !== 'string' || value.trim() === '') throw coded(code, message);
  return value;
}

const enc = value => encodeURIComponent(String(value));

// Opens a PinchTab-backed Browser. Performs no network I/O until a method is called.
export async function connectPinchtab({ baseUrl, instanceId, token, fetchImpl = fetch } = {}) {
  const origin = validateBaseUrl(baseUrl);
  requireString(token, 'PINCHTAB_TOKEN_REQUIRED', 'PinchTab token is required');
  requireString(instanceId, 'PINCHTAB_INSTANCE_REQUIRED', 'PinchTab instanceId is required');

  // Exactly one attempt. Errors never carry the body, the token, or the underlying message.
  async function request(method, path, body) {
    const headers = { Authorization: `Bearer ${token}`, Accept: 'application/json' };
    const init = { method, headers };
    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
      init.body = JSON.stringify(body);
    }
    let res;
    try {
      res = await fetchImpl(origin + path, init);
    } catch {
      throw coded('PINCHTAB_REQUEST_FAILED', 'PinchTab request failed (no response)');
    }
    if (res.status >= 400) throw coded('PINCHTAB_REQUEST_FAILED', `PinchTab request failed (HTTP ${res.status})`);
    return res;
  }

  const tabsPath = `/instances/${enc(instanceId)}/tabs`;
  const openPath = `/instances/${enc(instanceId)}/tabs/open`;

  async function listTabs() {
    const list = await (await request('GET', tabsPath)).json();
    return (Array.isArray(list) ? list : [])
      .filter(t => t && (t.instanceId === undefined || t.instanceId === instanceId))
      .map(({ id, url, title }) => ({ id, url, title, type: 'page' }));
  }

  function pageFor(tabId) {
    const tabPath = `/tabs/${enc(tabId)}`;
    const action = body => request('POST', `${tabPath}/action`, body).then(() => undefined);
    async function evaluate(expression) {
      requireString(expression, 'PINCHTAB_BAD_ARGUMENT', 'expression must be a non-empty string');
      const body = await (await request('POST', `${tabPath}/evaluate`, { expression, awaitPromise: true })).json();
      if (typeof body?.hint === 'string' && body.hint.includes('Promise')) {
        throw coded('PINCHTAB_UNRESOLVED_PROMISE', 'PinchTab left a Promise unresolved');
      }
      return body?.result;
    }
    return {
      url: () => evaluate('location.href'),
      evaluate,
      insertText: text => {
        if (typeof text !== 'string') throw coded('PINCHTAB_BAD_ARGUMENT', 'text must be a string');
        return action({ kind: 'keyboard-inserttext', text });
      },
      pressEnter: () => action({ kind: 'press', key: 'Enter' }),
      // submit:true = one DOM click, no server-side retry (a retried click could submit twice).
      click: selector => {
        requireString(selector, 'PINCHTAB_BAD_ARGUMENT', 'selector must be a non-empty string');
        return action({ kind: 'click', selector, submit: true });
      },
      // UNVERIFIED: docs show `pinchtab tab close <id>` (CLI) but no documented HTTP close
      // route. Do not guess a route; refuse until the route is confirmed in the docs.
      close: async () => {
        throw coded('PINCHTAB_CLOSE_UNSUPPORTED', 'PinchTab tab close has no verified route');
      },
    };
  }

  return {
    targets: listTabs,
    async attach(tabId) {
      if (typeof tabId !== 'string' || !(await listTabs()).some(t => t.id === tabId)) {
        throw coded('PINCHTAB_TAB_NOT_FOUND', 'PinchTab tab not found in instance');
      }
      return pageFor(tabId);
    },
    async openPage(url) {
      requireString(url, 'PINCHTAB_BAD_ARGUMENT', 'url must be a non-empty string');
      const body = await (await request('POST', openPath, { url })).json();
      if (typeof body?.tabId !== 'string' || body.tabId === '') {
        throw coded('PINCHTAB_REQUEST_FAILED', 'PinchTab open response had no tabId');
      }
      return pageFor(body.tabId);
    },
  };
}

// Exactly one GET /instances/{id}: confirms the instance is attached and running and that its
// CDP endpoint is loopback 127.0.0.1 on expectPort. No retries. Never echoes cdpUrl or token.
export async function verifyAttachedInstance({ baseUrl, instanceId, token, expectPort = 9333, fetchImpl = fetch } = {}) {
  const origin = validateBaseUrl(baseUrl);
  requireString(token, 'PINCHTAB_TOKEN_REQUIRED', 'PinchTab token is required');
  requireString(instanceId, 'PINCHTAB_INSTANCE_REQUIRED', 'PinchTab instanceId is required');

  let res;
  try {
    res = await fetchImpl(`${origin}/instances/${enc(instanceId)}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    });
  } catch {
    throw coded('PINCHTAB_REQUEST_FAILED', 'PinchTab request failed (no response)');
  }
  if (res.status >= 400) throw coded('PINCHTAB_REQUEST_FAILED', `PinchTab request failed (HTTP ${res.status})`);

  let body;
  try { body = await res.json(); } catch { body = undefined; }
  const refused = () => coded('PINCHTAB_INSTANCE_NOT_ON_EXPECTED_CDP', 'PinchTab instance is not attached and running on the expected CDP endpoint');

  if (!body || typeof body !== 'object' || body.attached !== true || body.status !== 'running') throw refused();
  if (!cdpOnExpectedEndpoint(body.cdpUrl, expectPort)) throw refused();
  return { id: body.id, status: body.status };
}

// True only for ws/wss/http/https URLs whose hostname is exactly 127.0.0.1 and whose port is expectPort.
function cdpOnExpectedEndpoint(cdpUrl, expectPort) {
  if (typeof cdpUrl !== 'string') return false;
  let u;
  try { u = new URL(cdpUrl); } catch { return false; }
  return ['ws:', 'wss:', 'http:', 'https:'].includes(u.protocol)
    && u.hostname === REQUIRED_HOST
    && Number(u.port) === Number(expectPort);
}
