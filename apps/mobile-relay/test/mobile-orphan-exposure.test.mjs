import test from 'node:test';
import assert from 'node:assert/strict';
import { todayModel, meModel, worldModel } from '../ux/model.mjs';
import { renderToday, renderWorld, renderMe } from '../ux/render.mjs';

class FakeNode {
  constructor(tag, doc) {
    this.tag = tag; this.ownerDocument = doc; this.children = [];
    this.className = ''; this.textContent = ''; this.events = {}; this.type = '';
  }
  append(...children) { this.children.push(...children); }
  replaceChildren(...children) { this.children = children; }
  addEventListener(name, callback) { this.events[name] = callback; }
}
function fakeHost() {
  const doc = { createElement(tag) { return new FakeNode(tag, doc); } };
  return new FakeNode('section', doc);
}
function nodes(node, found = []) {
  found.push(node);
  for (const child of node.children || []) nodes(child, found);
  return found;
}
const shown = node => nodes(node).map(item => item.textContent).join(' ');
const button = (host, title) => nodes(host).find(n => n.tag === 'button' && n.textContent === title);

test('Today exposes the existing signed native Pocket only when the APK reported it', () => {
  const host = fakeHost();
  const yes = todayModel(null, [], { nativePocket: true });
  let calls = 0;
  renderToday(host, yes, { onNavigate: () => {}, onOpenPocket: () => { calls++; } });
  assert.match(shown(host), /Capture offline/);
  button(host, 'Open Pocket').events.click();
  assert.equal(calls, 1);
  renderToday(host, todayModel(null, [], { nativePocket: false }), { onOpenPocket: () => { calls++; } });
  assert.equal(button(host, 'Open Pocket'), undefined);
  assert.equal(calls, 1);
});

test('Today attention becomes navigable but does not send or approve an effect', () => {
  const host = fakeHost();
  const snapshot = { snapshot: {
    live: { conversations: [{id:'c1', provider:'chatgpt',
      messages:[{id:'m1',state:'uncertain',requiresReview:true}]}] }
  } };
  const model = todayModel(snapshot, [], {});
  const visited = [];
  renderToday(host, model, { onNavigate: tab => visited.push(tab) });
  assert.match(shown(host), /A send is uncertain/);
  button(host, 'Open Talk').events.click();
  assert.deepEqual(visited, ['talk']);
});

test('World renders only bounded Host-returned media titles as plain text and never claims playback', () => {
  const host = fakeHost();
  const media = { state: 'ready', total: 2, shown: 2, hasMore: false, favorites: 1,
    items: [{title:'A Film',kind:'movie',state:'complete',favorite:true},
      {title:'B Show',kind:'show',state:'seeded',favorite:false}] };
  let refreshed = 0;
  renderWorld(host, worldModel(null, [], {media}), { onRefreshMedia: () => { refreshed++; } });
  assert.match(shown(host), /My Media Library/);
  assert.match(shown(host), /A Film/);
  assert.match(shown(host), /B Show/);
  assert.match(shown(host), /not verified playable media/);
  button(host, 'Refresh library').events.click();
  assert.equal(refreshed, 1);
  renderWorld(host, worldModel(null, [], {media:{state:'direct-only'}}), {});
  assert.match(shown(host), /Connect directly/);
  assert.doesNotMatch(shown(host), /A Film/);
});

test('Me uses the already implemented Control memory view rather than inventing a second reader', () => {
  const host = fakeHost();
  const nav = [];
  renderMe(host, meModel(null, [], {mode:'direct'}), { onNavigate: tab => nav.push(tab) });
  assert.match(shown(host), /Observed web memory/);
  button(host, 'Open web memory').events.click();
  assert.deepEqual(nav, ['control']);
  renderMe(host, meModel(null, [], {mode:'cloud'}), { onNavigate: tab => nav.push(tab) });
  assert.equal(button(host, 'Open web memory'), undefined);
});
