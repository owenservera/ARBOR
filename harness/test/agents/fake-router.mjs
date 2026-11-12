// Test double for src/interface/router.mjs: ask() returns { requestId }, wait() returns { status, reply }.
// replyFor(call) customises the reply; statusFor(call) customises the status; hold=true makes wait() block
// until release(requestId) is called (used to test one-in-flight-per-agent).
export function fakeRouter({ replyFor = (c) => `reply ${c.n} from ${c.provider}`, statusFor = () => 'complete', threadFor = null, hold = false } = {}) {
  const calls = [], waits = [], held = new Map();
  let n = 0;
  return {
    calls, waits,
    async ask(req) {
      const call = { ...req, n: ++n, requestId: 'r' + n };
      calls.push(call);
      return { requestId: call.requestId, status: 'pending_approval', provider: String(req.provider).split(':')[0] };
    },
    async wait(id) {
      waits.push(id);
      const call = calls.find((c) => c.requestId === id);
      if (hold) await new Promise((resolve) => held.set(id, resolve));
      const status = statusFor(call);
      return { requestId: id, status, ...(status === 'complete' ? { reply: replyFor(call) } : {}), ...(threadFor ? { threadUrl: threadFor(call) } : {}) };
    },
    async result(id) { return { requestId: id, status: held.has(id) ? 'complete' : 'pending_approval' }; },
    release(id) { held.get(id)?.(); },
  };
}
