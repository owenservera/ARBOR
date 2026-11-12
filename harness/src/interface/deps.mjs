// All cross-lane dependencies enter through this injectable adapter.
import { resolveTarget } from './target.mjs';
import { connectPinchtab, verifyAttachedInstance } from '../core/pinchtab.mjs';

// PinchTab driver: the harness's only CDP endpoint is 127.0.0.1:9333 (never 9222, never non-loopback).
// Env is read at call time; values are never logged.
async function pinchtabConnect({ host, port } = {}) {
  const target = resolveTarget();
  if (host !== '127.0.0.1' || Number(port) !== target.port) throw Object.assign(new Error('CDP endpoint refused'), { code: 'CDP_PORT_REFUSED' });
  const baseUrl = process.env.PINCHTAB_BASE_URL || 'http://127.0.0.1:9867';
  const instanceId = process.env.PINCHTAB_INSTANCE_ID;
  const token = process.env.PINCHTAB_TOKEN;
  await verifyAttachedInstance({ baseUrl, instanceId, token, expectPort: target.port });
  return connectPinchtab({ baseUrl, instanceId, token });
}

export async function dependencies(overrides = {}) {
  const modules = {
    connect: ['../core/cdp.mjs', 'connect'], createJournal: ['../core/journal.mjs', 'createJournal'],
    digestPayload: ['../core/journal.mjs', 'digestPayload'], threadKeyFor: ['../core/journal.mjs', 'threadKeyFor'],
    sendOnce: ['../core/send.mjs', 'sendOnce'], readReply: ['../core/reply.mjs', 'readReply'],
    listProviders: ['../providers/index.mjs', 'listProviders'], getProvider: ['../providers/index.mjs', 'getProvider'],
    providerForUrl: ['../providers/index.mjs', 'providerForUrl']
  };
  const result = { ...overrides };
  for (const [name, [path, key]] of Object.entries(modules)) {
    if (!(name in result)) result[name] = (...args) => import(path).then(m => m[key](...args));
  }
  if (process.env.WH_DRIVER === 'pinchtab' && !('connect' in overrides)) result.connect = pinchtabConnect;
  return result;
}
