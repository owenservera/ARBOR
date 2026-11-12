// One-time, owner-authorized local browser sessions for the VIVIM desktop UI.
// The native desktop process (or authenticated local CLI) presents the protected owner
// capability to issue a code. A code is short-lived, single-use and delivered to the
// browser only in a URL fragment. The browser exchanges it for an HttpOnly cookie +
// CSRF proof. The long-lived owner capability never enters HTML, JavaScript or URLs.
import { randomBytes } from 'node:crypto';

export const UI_COOKIE = 'vivim_control_ui';
const random = () => randomBytes(32).toString('hex');
const fail = (code, status = 403) => { throw Object.assign(new Error(code), { code, status }); };
const CODE = /^[a-f0-9]{64}$/;

export function createControlBrowserSessions({
  now = () => Date.now(),
  codeTtlMs = 60_000,
  sessionTtlMs = 15 * 60_000
} = {}) {
  const codes = new Map();
  const sessions = new Map();
  function prune() {
    const time = now();
    for (const [code, expires] of codes) if (time >= expires) codes.delete(code);
    for (const [sid, state] of sessions) if (time >= state.expiresAt) sessions.delete(sid);
  }
  function issue() {
    prune();
    // Protect long-lived installations against unbounded state.
    if (codes.size >= 32) fail('CONTROL_UI_CAPACITY', 429);
    const code = random(), expiresAt = now() + codeTtlMs;
    codes.set(code, expiresAt);
    return { code, expiresAt, ttlMs: codeTtlMs };
  }
  function exchange(code) {
    prune();
    if (typeof code !== 'string' || !CODE.test(code)) fail('CONTROL_UI_CODE_INVALID');
    if (!codes.has(code)) fail('CONTROL_UI_CODE_UNKNOWN');
    codes.delete(code); // consume once, even if session is at capacity
    if (sessions.size >= 32) fail('CONTROL_UI_CAPACITY', 429);
    const sessionId = random(), csrf = random(), expiresAt = now() + sessionTtlMs;
    sessions.set(sessionId, { csrf, expiresAt });
    return { sessionId, csrf, expiresAt, maxAge: Math.floor(sessionTtlMs / 1000) };
  }
  function get(req) {
    prune();
    const cookie = String(req.headers.cookie || '').split(';').map(x => x.trim())
      .find(x => x.startsWith(UI_COOKIE + '='));
    const sid = cookie?.slice(UI_COOKIE.length + 1) ?? '';
    if (!CODE.test(sid)) return null;
    const state = sessions.get(sid);
    return state ? { sessionId: sid, ...state } : null;
  }
  function authorized(req, { mutate = false } = {}) {
    const session = get(req);
    if (!session) return false;
    if (mutate && req.headers['x-vivim-ui-csrf'] !== session.csrf) return false;
    return true;
  }
  function revoke(req) {
    const session = get(req);
    if (session) sessions.delete(session.sessionId);
  }
  return { issue, exchange, authorized, revoke, get };
}
