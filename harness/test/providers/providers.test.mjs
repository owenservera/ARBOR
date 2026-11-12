import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { listProviders, getProvider, providerForUrl, validateProfile } from '../../src/providers/index.mjs';
import { normalizeModels, pickModelForTask, slug } from '../../src/core/models.mjs';

const providersDir = fileURLToPath(new URL('../../src/providers/', import.meta.url));

test('all profiles validate and have nonempty selectors', () => {
  assert.equal(listProviders().length, 8);
  for (const p of listProviders()) {
    assert.equal(validateProfile(p), p);
    assert.equal(getProvider(p.id), p);
    for (const arr of [p.composer.selectors, p.send.buttonSelectors, p.assistant.containerSelectors, p.assistant.streamingSelectors, p.preflight.authWallSelectors]) assert.ok(arr.length && arr.every(s => typeof s === 'string' && s.trim()));
  }
});
test('every provider profile module is registered, so no imported profile is unreachable', async () => {
  // The registry array in src/providers/index.mjs is the ONLY list of reachable providers.
  // A profile that is imported but left out of that array still validates and still exports,
  // yet getProvider()/providerForUrl() never see it — a silently dead provider. Scanning the
  // profile directory (instead of a hardcoded roster) means a newly added profile module
  // cannot be forgotten here: the test fails until it is registered.
  const files = readdirSync(providersDir).filter(f => f.endsWith('.mjs') && f !== 'index.mjs');
  assert.ok(files.length > 0, 'provider profile directory must not be empty');
  const registered = listProviders();
  const ids = new Set();
  for (const file of files) {
    const mod = await import(pathToFileURL(join(providersDir, file)).href);
    const profile = mod.default;
    assert.ok(profile && typeof profile === 'object' && typeof profile.id === 'string' && Array.isArray(profile.hosts), `${file} must default-export a provider profile`);
    assert.ok(registered.includes(profile), `${file} (${profile.id}) is imported but NOT registered — it would be unreachable`);
    assert.equal(getProvider(profile.id), profile, `${file} (${profile.id}) must be resolvable by id`);
    assert.ok(!ids.has(profile.id), `duplicate provider id: ${profile.id}`);
    ids.add(profile.id);
  }
  // No phantom entries either: the registry holds exactly the profile modules on disk.
  assert.equal(registered.length, files.length, 'registered providers must match the number of profile modules');
  assert.deepEqual(registered.map(p => p.id).sort(), [...ids].sort());
});
test('grok is registered, validates, and maps its hosts exactly', () => {
  const p = getProvider('grok');
  assert.ok(p, 'grok must be registered');
  assert.ok(listProviders().includes(p));
  assert.equal(validateProfile(p), p);
  assert.equal(p.id, 'grok');
  assert.equal(p.label, 'Grok');
  assert.equal(p.url, 'https://grok.com/');
  assert.ok(p.hosts.includes('grok.com'));
  for (const host of p.hosts) {
    assert.equal(providerForUrl(`https://${host}/`), p);
    assert.equal(providerForUrl(`https://${host}.evil.test/`), null);
    assert.equal(providerForUrl(`http://${host}/`), null);
  }
  assert.equal(providerForUrl('https://grok.com@evil.test/'), null);
  assert.equal(providerForUrl('https://grok.com.evil.test/'), null);
});
test('grok model tiers resolve a grok model and never a look-alike', () => {
  // grok's picker labels are NOT measured live (grok.mjs is a seeded profile): the labels below are
  // representative spellings of a grok model name, not a measured inventory of models. This pins
  // PATTERN behaviour, not a model list: a versioned grok label resolves, a foreign label never
  // does, and no effort/ignore pattern may shadow a tier pattern.
  const grok = getProvider('grok');
  const TIER_CLASS = { strong: 'review', fast: 'quick' };
  const pick = (labels, taskClass = 'review') => {
    const entry = normalizeModels(grok, { current: labels[0] ?? '', items: labels.map(label => ({ label })) });
    const { model, tier } = pickModelForTask(grok, entry, taskClass);
    return { model, tier, models: entry.models.map(m => m.label) };
  };
  const GROK_LABELS = ['Grok 4', 'grok-4', 'Grok4', 'grok 4.1', 'Grok-4', 'grok-4-fast', 'Grok 3 Mini', 'grok-mini'];

  // 1. A versioned grok label survives normalizeModels as a MODEL. models.efforts used to claim
  //    ^groks?[0-9]*$, which swallowed every versioned grok label before a tier could match it.
  for (const label of GROK_LABELS) {
    const r = pick([label]);
    assert.ok(r.models.includes(label), `${label} must survive normalization as a model, got ${JSON.stringify(r.models)}`);
  }

  // 2. A tier pick resolves a model (not null) and resolves a GROK model.
  const strong = pick(['Grok 4', 'Grok 3', 'Grok 3 Mini']);
  assert.equal(strong.tier, 'strong');
  assert.ok(strong.model, 'a tier pick on grok must resolve a model');
  assert.equal(strong.model.label, 'Grok 4');
  const fast = pick(['Grok 4', 'Grok 3 Mini'], 'quick');
  assert.equal(fast.tier, 'fast');
  assert.ok(fast.model, 'the fast tier on grok must resolve a model');
  assert.equal(fast.model.label, 'Grok 3 Mini');

  // 3. Every plausible spelling of a versioned grok model resolves through the strong tier.
  for (const label of ['Grok 4', 'grok-4', 'Grok4', 'grok 4.1', 'Grok-4']) {
    const r = pick([label]);
    assert.ok(r.model, `the strong tier must resolve ${label}`);
    assert.equal(r.model.label, label);
    assert.equal(r.model.id, slug(label));
  }

  // 4. Look-alike rejection: a tier pick NEVER resolves a model that is not a grok model.
  const foreign = ['Claude 5.5', 'Opus 5.5', 'Haiku 5.5', 'GPT-6', 'GLM-5.3', 'GLM-5.3-Flash', 'Llama 4 70B', 'Mistral Large', 'DeepSeek V3', 'Qwen3 Max'];
  assert.equal(pick(foreign).model, null, 'a grok tier pick must not resolve a foreign model');
  const mixed = pick([...foreign, 'Grok 4']);
  assert.ok(mixed.model, 'in a mixed picker the grok tier must still resolve a model');
  assert.equal(mixed.model.label, 'Grok 4', 'in a mixed picker the grok tier must pick the grok model');
  // a grok-prefixed row that carries no version is not a model the tier may pick
  assert.equal(pick(['Grokipedia']).model, null);
  assert.equal(pick(['Grok']).model, null);

  // 5. Structural invariant: a tier pattern may never be shadowed by models.efforts/models.ignore,
  //    and no effort/ignore pattern may claim a versioned grok label.
  for (const tier of ['strong', 'fast']) {
    for (const src of grok.models.tiers[tier]) {
      const rx = new RegExp(src, 'i');
      for (const label of GROK_LABELS) {
        if (!rx.test(label)) continue;
        const r = pick([label], TIER_CLASS[tier]);
        assert.ok(r.model, `tier pattern ${src} is shadowed for ${label}: ${JSON.stringify(r.models)}`);
      }
    }
  }
  for (const src of [...(grok.models.efforts || []), ...(grok.models.ignore || [])]) {
    const rx = new RegExp(src, 'i');
    for (const label of GROK_LABELS) assert.ok(!rx.test(label), `models.efforts/ignore pattern ${src} shadows the grok model ${label}`);
  }
});
test('exact hosts match, lookalikes and unsafe URLs do not', () => {
  for (const p of listProviders()) for (const host of p.hosts) {
    assert.equal(providerForUrl(`https://${host}/`), p);
    assert.equal(providerForUrl(`https://${host}.evil.test/`), null);
  }
  assert.equal(providerForUrl('https://chatgpt.com@evil.test/'), null);
  assert.equal(providerForUrl('http://chatgpt.com/'), null);
});
test('invalid strategy and selectors throw coded errors', () => {
  const p = getProvider('chatgpt');
  assert.throws(() => validateProfile({ ...p, send: { ...p.send, strategy: 'click' } }), { code: 'INVALID_SEND_STRATEGY' });
  assert.throws(() => validateProfile({ ...p, composer: { selectors: [' '] } }), { code: 'INVALID_SELECTORS' });
});
test('a provider without strengths is tolerated and defaulted instead of killing the registry', () => {
  // every registered profile exposes an array-valued strengths, even when it omits the field
  for (const p of listProviders()) assert.ok(Array.isArray(p.strengths), `${p.id} must expose a strengths array`);
  // kimi ships no strengths: the registry must survive it and default the field
  const kimi = getProvider('kimi');
  assert.deepEqual(kimi.strengths, []);
  assert.equal(validateProfile(kimi), kimi);
  // an explicitly supplied but invalid value is still rejected
  const base = getProvider('chatgpt');
  assert.throws(() => validateProfile({ ...base, strengths: 'coding' }), { code: 'INVALID_STRENGTHS' });
  assert.throws(() => validateProfile({ ...base, strengths: [' '] }), { code: 'INVALID_STRENGTHS' });
  assert.throws(() => validateProfile({ ...base, strengths: null }), { code: 'INVALID_STRENGTHS' });
});
test('native routes are anchored and expose named id', () => {
  const uuid = '12345678-1234-1234-1234-123456789abc';
  for (const [id, route] of [['chatgpt', 'c'], ['claude', 'chat'], ['zai', 'c'], ['qwen', 'c']]) {
    const pattern = getProvider(id).threadPattern;
    assert.equal(pattern.exec(`/${route}/${uuid}`).groups.id, uuid);
    assert.equal(pattern.test(`/${route}/${uuid}/extra`), false);
  }
  assert.equal(getProvider('deepseek').threadPattern, null);
  const g = getProvider('gemini').threadPattern; assert.equal(g.exec('/app/a84af037ea706cdd').groups.id, 'a84af037ea706cdd'); assert.equal(g.test('/app'), false); assert.equal(g.test('/app/a84af037ea706cdd/x'), false);
  // grok binds /chat/<id>: the id is anchored, and a trailing segment is not a thread.
  const gr = getProvider('grok').threadPattern;
  assert.equal(gr.exec('/chat/abc-123_XYZ').groups.id, 'abc-123_XYZ');
  assert.equal(gr.test('/chat/'), false);
  assert.equal(gr.test('/chat/abc/extra'), false);
  // the pattern is applied to the pathname, so a query string cannot smuggle a different id
  assert.equal(gr.exec(new URL('https://grok.com/chat/abc-123?x=1').pathname).groups.id, 'abc-123');
});
test('kimi profile is listed, validates, and is not marked measured', () => {
  const p = getProvider('kimi');
  assert.ok(p, 'kimi must be registered');
  assert.ok(listProviders().includes(p));
  assert.equal(validateProfile(p), p);
  assert.equal(p.id, 'kimi');
  assert.notEqual(p.status, 'measured');
  assert.equal(p.status, 'seeded-unverified');
  assert.equal(p.threadPattern, null);
  assert.equal(p.models, undefined);
});
test('grok profile is listed, validates, and is not marked measured (WO-043)', () => {
  // The grok header itself says the selectors are seeded and the model labels are
  // namespaces, not measurements — no measured-evidence lane has ever read grok.com's
  // real picker labels. A 'measured' status would claim evidence nobody collected.
  const p = getProvider('grok');
  assert.ok(p, 'grok must be registered');
  assert.ok(listProviders().includes(p));
  assert.equal(validateProfile(p), p);
  assert.equal(p.id, 'grok');
  assert.notEqual(p.status, 'measured');
  assert.equal(p.status, 'seeded-unverified');
});
test('kimi host maps exactly and rejects look-alikes', () => {
  const p = getProvider('kimi');
  for (const host of p.hosts) {
    assert.equal(providerForUrl(`https://${host}/`), p);
    assert.equal(providerForUrl(`https://${host}.evil.test/`), null);
    assert.equal(providerForUrl(`https://evil-${host}/`), null);
    assert.equal(providerForUrl(`https://x${host}/`), null);
    assert.equal(providerForUrl(`https://${host}@evil.test/`), null);
    assert.equal(providerForUrl(`http://${host}/`), null);
    assert.equal(providerForUrl(`https://${host}:8443/`), null);
  }
  assert.equal(providerForUrl('https://kimi.com.evil.test/'), null);
  assert.equal(providerForUrl('https://moonshot.evil.test/'), null);
});
test('discover refuses port 9222 and non-loopback host before connecting', () => {
  const script = fileURLToPath(new URL('../../scripts/discover.mjs', import.meta.url));
  for (const args of [['--port', '9222'], ['--host', 'example.com']]) {
    const result = spawnSync(process.execPath, [script, ...args, '--target', 'fake'], { encoding: 'utf8' });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /CDP_PORT_REFUSED/);
  }
});
