// Real catalog and committed NLCL corpus only; no parallel parser or synthetic fixtures.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildControlWorld, interpretControl } from '../../mobile-relay/control-language.mjs';
import { toCommandIntent } from '../control/command-intent.mjs';
import { runNativeProductPureSync } from '../control/native-product-pure-sync.mjs';

const catalog = JSON.parse(readFileSync(new URL('../control/action-catalog.v1.json', import.meta.url), 'utf8'));
const corpus = JSON.parse(readFileSync(new URL('../control/corpus.v1.json', import.meta.url), 'utf8'));

test('trusted NLCL corpus projects the same inert command intents with or without Rust', t => {
  const world = buildControlWorld(catalog);
  let compared = 0;
  for (const entry of corpus.cases) {
    if (typeof entry.text !== 'string' || !entry.text.trim() || entry.text.length > 1000) continue;
    const input = { text: entry.text, scope: 'text' };
    const reading = interpretControl(entry.text, { catalog, world });
    const intent = toCommandIntent(input, { catalog, world });
    assert.equal(intent.schema, 'vivim.command-intent/0.1', entry.text);
    assert.equal(intent.provenance.authority, 'none', entry.text);
    const native = runNativeProductPureSync('command-intent-projection', {
      schema: 'vivim.command-intent-projection-input/1',
      input: { text: entry.text, scope: 'text', audience: 'owner' },
      catalogVersion: catalog.version, worldRevision: world.v,
      catalogActions: catalog.actions, reading, baselineOutcome: reading.outcome,
      personalProvenance: null
    });
    if (native) {
      assert.equal(native.authority, 'none', entry.text);
      assert.equal(native.executionAuthorized, false, entry.text);
      assert.equal(native.effectPerformed, false, entry.text);
      assert.deepEqual(native.intent, intent, 'native parity: ' + entry.text);
      compared++;
    }
  }
  if (!compared) t.diagnostic('Native binary unavailable; JS compatibility verified; Rust parity unrun.');
  else t.diagnostic('Native parity verified against ' + compared + ' real corpus entries.');
});
