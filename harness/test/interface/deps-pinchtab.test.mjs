import test from 'node:test';
import assert from 'node:assert/strict';
import { dependencies } from '../../src/interface/deps.mjs';

const KEYS = ['WH_DRIVER', 'PINCHTAB_BASE_URL', 'PINCHTAB_INSTANCE_ID', 'PINCHTAB_TOKEN'];

// Sets the given env vars (others unset), runs fn, then restores the originals.
async function withEnv(env, fn) {
  const saved = Object.fromEntries(KEYS.map(k => [k, process.env[k]]));
  try {
    for (const k of KEYS) delete process.env[k];
    for (const [k, v] of Object.entries(env)) process.env[k] = v;
    return await fn();
  } finally {
    for (const k of KEYS) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
  }
}

// Counts every global fetch call made while fn runs. Restores global fetch afterwards.
async function countGlobalFetch(fn) {
  const original = globalThis.fetch;
  let count = 0;
  globalThis.fetch = async () => { count += 1; throw new Error('network must not be used in this test'); };
  try {
    await fn();
  } finally {
    globalThis.fetch = original;
  }
  return count;
}

test('default driver (WH_DRIVER unset): connect refuses port 9222 with CDP_PORT_REFUSED', async () => {
  await withEnv({}, async () => {
    const deps = await dependencies();
    await assert.rejects(deps.connect({ host: '127.0.0.1', port: 9222 }), { code: 'CDP_PORT_REFUSED' });
  });
});

test('WH_DRIVER=other keeps raw CDP default: connect refuses port 9222 with CDP_PORT_REFUSED', async () => {
  await withEnv({ WH_DRIVER: 'cdp' }, async () => {
    const deps = await dependencies();
    await assert.rejects(deps.connect({ host: '127.0.0.1', port: 9222 }), { code: 'CDP_PORT_REFUSED' });
  });
});

test('WH_DRIVER=pinchtab: connect refuses port 9222 with CDP_PORT_REFUSED and makes no fetch', async () => {
  await withEnv({ WH_DRIVER: 'pinchtab', PINCHTAB_INSTANCE_ID: 'inst_1', PINCHTAB_TOKEN: 'tok-SECRET-123' }, async () => {
    const deps = await dependencies();
    const fetches = await countGlobalFetch(async () => {
      await assert.rejects(deps.connect({ host: '127.0.0.1', port: 9222 }), { code: 'CDP_PORT_REFUSED' });
    });
    assert.equal(fetches, 0);
  });
});

test('WH_DRIVER=pinchtab: connect refuses non-loopback host with CDP_PORT_REFUSED and makes no fetch', async () => {
  await withEnv({ WH_DRIVER: 'pinchtab', PINCHTAB_INSTANCE_ID: 'inst_1', PINCHTAB_TOKEN: 'tok-SECRET-123' }, async () => {
    const deps = await dependencies();
    const fetches = await countGlobalFetch(async () => {
      await assert.rejects(deps.connect({ host: '192.168.1.5', port: 9333 }), { code: 'CDP_PORT_REFUSED' });
    });
    assert.equal(fetches, 0);
  });
});

test('WH_DRIVER=pinchtab with PINCHTAB_INSTANCE_ID / PINCHTAB_TOKEN unset: connect(9333) rejects with a coded error and makes no network call', async () => {
  await withEnv({ WH_DRIVER: 'pinchtab' }, async () => {
    const deps = await dependencies();
    const fetches = await countGlobalFetch(async () => {
      const err = await deps.connect({ host: '127.0.0.1', port: 9333 }).then(() => null, e => e);
      assert.ok(err, 'must reject');
      assert.equal(typeof err.code, 'string');
      assert.ok(err.code.startsWith('PINCHTAB_'), `unexpected code ${err.code}`);
    });
    assert.equal(fetches, 0);
  });
});

test('WH_DRIVER=pinchtab: an explicit connect override is kept and not replaced', async () => {
  await withEnv({ WH_DRIVER: 'pinchtab' }, async () => {
    const fake = async () => 'fake-browser';
    const deps = await dependencies({ connect: fake });
    assert.equal(deps.connect, fake);
  });
});
