import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolveProviderHandoff } from '../provider-handoff.mjs';

const checked = ['chatgpt','claude','gemini','qwen','deepseek','zai']
  .map(id => ({id,signedIn:true}));

test('explicit natural-language provider handoff selects only verified Studio providers', () => {
  for (const [text,id,draft] of [
    ['Ask Claude: Explain this code', 'claude', 'Explain this code'],
    ['@chatgpt compare designs', 'chatgpt', 'compare designs'],
    ['/ai Gemini: summarize', 'gemini', 'summarize'],
    ['Chat with Qwen', 'qwen', ''],
    ['@z.ai check', 'zai', 'check'],
    ['@deepseek: benchmark', 'deepseek', 'benchmark']
  ]) {
    const result = resolveProviderHandoff(text,checked);
    assert.equal(result.id,id);
    assert.equal(result.draft,draft);
    assert.equal(result.status,'ready');
    assert.equal(result.sendsAutomatically,false);
  }
});
test('unknown, unverified and ordinary Wiki questions never become AI sends', () => {
  assert.equal(resolveProviderHandoff('Compare Claude and ChatGPT',checked),null);
  assert.equal(resolveProviderHandoff('Ask about Claude: what is it?',checked),null);
  assert.equal(resolveProviderHandoff('@unknown test',checked),null);
  assert.equal(resolveProviderHandoff('hello',checked),null);
  assert.equal(resolveProviderHandoff('@claude hello',[]).status,'unverified');
  assert.equal(resolveProviderHandoff('@claude hello',[{id:'claude',signedIn:false}]).status,'unverified');
  assert.equal(resolveProviderHandoff('@qwen hello',[{id:'qwen',signedIn:true}]).status,'ready');
  assert.equal(resolveProviderHandoff('@claude hello',[{id:'claude',signedIn:'true'}]).status,'unverified');
  assert.equal(resolveProviderHandoff('@claude ' + 'x'.repeat(1001),checked),null);
});
test('same real mobile composer is reused; no new provider network or effect writer', () => {
  const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
  const host=readFileSync(new URL('../../vivim-host/direct-phone.mjs',import.meta.url),'utf8');
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  const module=readFileSync(new URL('../provider-handoff.mjs',import.meta.url),'utf8');
  assert.match(app,/resolveProviderHandoff\(body,S\.manifest\?\.providers\)/);
  assert.match(app,/switchChatTarget\('harness'\)/);
  assert.match(app,/first-contact-provider/);
  assert.match(host,/'provider-handoff\.mjs': \['provider-handoff\.mjs'/);
  assert.match(html,/body\.first-contact:not\(\.first-contact-provider\) #send/);
  assert.equal((html.match(/id="chat-composer"/g)||[]).length,1);
  assert.doesNotMatch(module,/\bfetch\s*\(|\bWebSocket\s*\(|\bXMLHttpRequest\b|\.request\s*\(/);
});
