import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { PASS_ORDER } from '../bootstrap/scheduler.mjs';
import { PASS_TITLES, DEEP_DISCOVERY_PASSES, promptForPass, deepDiscoveryPrompt } from '../../mobile-relay/bootstrap-prompts.mjs';
import { parseBootstrapPass, PASS_CONTRACT } from '../../mobile-relay/bootstrap-pass.mjs';

test('Oracle discovery uses all seven existing Host scheduler and validator pass identities', () => {
  assert.deepEqual(PASS_ORDER, ['F02', 'F01', 'D03', 'D04', 'D05', 'D06', 'D07']);
  assert.deepEqual(DEEP_DISCOVERY_PASSES, PASS_ORDER.slice(2));
  const prompts = PASS_ORDER.map(pass => promptForPass(pass, 'onb-test-1'));
  assert.equal(new Set(prompts.map(text => createHash('sha256').update(text).digest('hex'))).size, 7);
  PASS_ORDER.forEach((pass, i) => {
    assert.ok(PASS_TITLES[pass], pass);
    assert.ok(Buffer.byteLength(prompts[i], 'utf8') <= 12000, pass);
    assert.ok(prompts[i].length > 250, pass);
  });
});

test('each deep discovery prompt pins exact Host schema, generation, categories, and privacy rules', () => {
  for (const pass of DEEP_DISCOVERY_PASSES) {
    const prompt = deepDiscoveryPrompt(pass, 'onb-fresh-123');
    assert.ok(prompt.includes('vivim.bootstrap-output/1'), pass);
    assert.ok(prompt.includes('generationId to "onb-fresh-123"'), pass);
    assert.ok(prompt.includes('passId to "' + pass + '"'), pass);
    assert.match(prompt, /do not have automatic access to my full ChatGPT history/i);
    assert.match(prompt, /Never disclose credentials/i);
    for (const section of PASS_CONTRACT[pass].sections) assert.ok(prompt.includes(section), pass + ':' + section);
    for (const category of PASS_CONTRACT[pass].categories) assert.ok(prompt.includes(category), pass + ':' + category);
  }
  assert.throws(() => deepDiscoveryPrompt('D08', 'onb-good'), /Unknown deep discovery/);
  assert.throws(() => deepDiscoveryPrompt('D03', '../bad'), /invalid generation/);
});

test('valid provider deep replies map into the existing typed validator (zero external effects)', () => {
  const pairs = { D03:['interest','interest'], D04:['project','project'], D05:['tool','tool'],
    D06:['value','value'], D07:['gap','coverage'] };
  for (const [pass, [category, section]] of Object.entries(pairs)) {
    const data = {
      schema:'vivim.bootstrap-output/1',generationId:'onb-fresh-123',passId:pass,
      observations:[{category,text:'A remembered, bounded observation',confidence:0.7,sensitive:false}],
      assertions:[{section,label:'Bounded claim',value:'Unverified provider recollection',
        basis:'provider_memory_report',confidence:0.7,scope:'unknown',freshness:'unknown'}],
      unknowns:[],viewProposals:[],schemaProposals:[],
      coverage:{areas:[{name:section,state:'partial'}]}
    };
    const parsed = parseBootstrapPass(data);
    assert.equal(parsed.passId, pass);
    assert.equal(parsed.assertions[0].basis, 'provider_memory_report');
    assert.equal(parsed.observations[0].sensitive, pass === 'D06', pass + ' sensitive boundary');
  }
});

test('malformed, executable or overconfident deep claims fail closed', () => {
  const base = {
    schema:'vivim.bootstrap-output/1',generationId:'onb-fresh-123',passId:'D03',
    observations:[],assertions:[],unknowns:[],viewProposals:[],schemaProposals:[],coverage:{areas:[]}
  };
  assert.throws(() => parseBootstrapPass({...base, assertions:[{
    section:'interest',label:'Claim',value:'https://invalid.example',basis:'explicitly_stated',
    confidence:1,scope:'global',freshness:'current'
  }]}), /links|markup/i);
  assert.throws(() => parseBootstrapPass({...base, assertions:[{
    section:'interest',label:'Claim',value:'Text',basis:'provider_memory_report',
    confidence:2,scope:'global',freshness:'current'
  }]}), /confidence/i);
  assert.throws(() => parseBootstrapPass({...base, unexpectedEffect:true}), /unsupported/i);
});
