import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
const manifest=JSON.parse(readFileSync(new URL('../manifest.webmanifest',import.meta.url),'utf8'));
const deploy=JSON.parse(readFileSync(new URL('../vercel.json',import.meta.url),'utf8'));
const sw=readFileSync(new URL('../sw.js',import.meta.url),'utf8');

test('one VIVIM name, one product home, no forced pairing splash',()=>{
  assert.match(html,/<title>VIVIM<\/title>/);
  assert.equal(manifest.name,'VIVIM');
  assert.equal(manifest.short_name,'VIVIM');
  assert.equal(manifest.start_url,'./');
  assert.match(html,/id="v-talk"/);
  assert.match(html,/id="connect-pc"/);
  assert.match(html,/id="pair-close"/);
  assert.match(app,/function showHomeWithoutGrant\(\)/);
  assert.match(app,/\$\('pairbox'\)\.hidden = true; \$\('app'\)\.hidden = false;/);
  assert.match(app,/if \(!paired\) \{ clearPrivatePhoneState\(\); showHomeWithoutGrant\(\); \}/);
  assert.doesNotMatch(app,/\$\('pairbox'\)\.hidden = paired; \$\('app'\)\.hidden = !paired/);
});
test('cloud and Direct use the exact same canonical PWA assets at /mobile',()=>{
  for (const [source,destination] of [
    ['/mobile','/index.html'],
    ['/mobile/','/index.html'],
    ['/mobile/(.*)','/$1'],
  ]) assert.ok(deploy.rewrites.some(x=>x.source===source&&x.destination===destination),
    'missing shared PWA route '+source);
  assert.match(sw,/vivim-relay-shell-v46/);
});
test('home does not bypass existing Host grants or auto-repeat an uncertain send',()=>{
  assert.match(app,/clearPrivatePhoneState\(\); showHomeWithoutGrant\(\)/);
  assert.match(app,/resumeDeviceSession\(transport\)/);
  assert.match(app,/S\.paired = paired/);
  assert.match(app,/if \(!S\.paired && !HOST_PREVIEW && !FIRST_CONTACT\)/);
  const source=app.slice(app.indexOf('function showHomeWithoutGrant()'),
    app.indexOf(" $('connect-pc').addEventListener".trim()));
  assert.ok(source.includes("$('app').hidden = false"));
  assert.doesNotMatch(source,/\bfetch\(|\bapi\(|\bexecute\(|\bsend\(/);
});

test('Cloud and Direct render one graphite First Contact Home, without granting Host authority',()=>{
  assert.match(app,/const FIRST_CONTACT = transport\.direct && !HOST_PREVIEW/);
  assert.match(app,/if \(!HOST_PREVIEW\) document\.body\.classList\.add\('first-contact'\)/);
  assert.match(html,/body\.first-contact:not\(\.first-contact-provider\) #chat-composer > :not\(\.row\):not\(#connect-pc\)/);
  assert.match(app,/if \(!S\.paired && !HOST_PREVIEW && !FIRST_CONTACT\)/);
});
