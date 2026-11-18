import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const chatSource = readFileSync(new URL('./control-chat.mjs', import.meta.url), 'utf8');
const appSource = readFileSync(new URL('./app.js', import.meta.url), 'utf8');

function functionSource(source, name) {
  const start = source.indexOf('function ' + name + '(');
  assert.notEqual(start, -1, name + ' source missing');
  const body = source.indexOf('{', start);
  let depth = 0;
  for (let i = body; i < source.length; i++) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}' && --depth === 0) return source.slice(start, i + 1);
  }
  throw new Error('Unclosed ' + name);
}

test('only an applied Wiki receipt with Host revision notifies live Wiki', () => {
  const events = [];
  class TestEvent {
    constructor(type, options) {
      this.type = type;
      this.detail = options.detail;
      this.bubbles = options.bubbles;
    }
  }
  const notifier = new Function('host', 'CustomEvent',
    functionSource(chatSource, 'notifyWikiCommitted') + '\nreturn notifyWikiCommitted;')(
      { dispatchEvent: event => events.push(event) }, TestEvent);
  notifier({ status: 'uncertain', actionId: 'wiki.section.edit', result: { wikiRevision: 4 } });
  notifier({ status: 'failed', actionId: 'wiki.section.edit', result: { wikiRevision: 4 } });
  notifier({ status: 'applied', actionId: 'ui.theme.set_preset', result: { wikiRevision: 4 } });
  notifier({ status: 'applied', actionId: 'wiki.section.edit', result: {} });
  assert.equal(events.length, 0, 'no notification for unproven Wiki changes');
  notifier({ status: 'applied', actionId: 'wiki.section.edit', result: { wikiRevision: 5 } });
  assert.equal(events.length, 1);
  assert.equal(events[0].type, 'vivim:wiki-committed');
  assert.equal(events[0].detail.revision, 5);
  assert.equal(events[0].bubbles, true);
});

test('existing PWA Wiki tab re-reads only while visible', () => {
  const match = appSource.match(/document\.addEventListener\('vivim:wiki-committed', \(\) => \{[\s\S]*?\n\}\);/);
  assert.ok(match, 'Wiki readback listener missing from real PWA');
  const listeners = {};
  const S = { tab: 'talk' };
  let reads = 0;
  new Function('document', 'S', 'refreshWiki', match[0])(
    { addEventListener: (name, fn) => { listeners[name] = fn; } },
    S, () => { reads++; });
  const listener = listeners['vivim:wiki-committed'];
  assert.equal(typeof listener, 'function');
  listener();
  assert.equal(reads, 0, 'do not read Wiki on unrelated tab');
  S.tab = 'wiki';
  listener();
  assert.equal(reads, 1, 'live Wiki tab refreshes after committed Host change');
});
