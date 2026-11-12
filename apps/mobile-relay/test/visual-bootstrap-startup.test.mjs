import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

test('visual bootstrap initializes its relay client before restoring the paired phone session', async () => {
  const source = readFileSync(new URL('../visual-bootstrap.mjs', import.meta.url), 'utf8')
    .replace(/^import .*;\r?\n/gm, '');
  const element = () => ({ hidden: true, disabled: true, dataset: {}, style: { setProperty() {} },
    setAttribute() {}, addEventListener() {}, querySelectorAll: () => [], append() {} });
  const elements = new Map();
  let requests = 0;
  const context = vm.createContext({
    document: { documentElement: element(), addEventListener() {},
      getElementById(id) { if (!elements.has(id)) elements.set(id, element()); return elements.get(id); } },
    window: { addEventListener() {} },
    THEME_PRESETS: {},
    transport: { request: async () => { requests++; return { paired: false }; } },
  });
  assert.doesNotThrow(() => new vm.Script(source).runInContext(context));
  await Promise.resolve();
  assert.equal(requests, 1, 'restore the existing pairing without requesting a new QR code');
});
