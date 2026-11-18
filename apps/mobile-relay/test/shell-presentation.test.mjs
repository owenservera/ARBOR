import test from 'node:test';
import assert from 'node:assert/strict';
import {createSurface,validateTheme} from '../generative-ui/catalog.mjs';
import {shellCss,createShellPresentation} from '../ux/shell-presentation.mjs';
const body=()=>{const vars=new Map(),attrs=new Map();return {vars,attrs,style:{setProperty:(k,v)=>vars.set(k,v),removeProperty:k=>vars.delete(k)},setAttribute:(k,v)=>attrs.set(k,v),removeAttribute:k=>attrs.delete(k)};};
const head=(revision,shell,status='applied')=>{const s=createSurface();if(shell)s.theme.shell=shell;s.revision=revision;return {status,surfaceId:s.surfaceId,revision,surface:s};};
test('shell styles are allowlisted and independently validated',()=>{
  const css=shellCss({radiusPx:20,fontSizePx:17,accent:'#123456'});
  assert.equal(css['--r-lg'],'20px');assert.equal(css['--vivim-base-font-size'],'17px');assert.equal(css['--ac'],'#123456');
  assert.equal(css['--bg'],undefined);
  assert.throws(()=>shellCss({arbitraryCss:'display:none'}),/unexpected/);
  assert.throws(()=>shellCss({background:'url(fake)'}),/color/);
  assert.equal(validateTheme(createSurface().theme).shell,undefined);
});
test('only applied Host revisions paint shell overrides; stale or disconnected clears them',()=>{
  const b=body(),mount=createShellPresentation(b);
  assert.equal(mount.observe(head(1,{background:'#123456'},'previewed')).state,'blocked');assert.equal(b.vars.size,0);
  assert.equal(mount.observe(head(2,{background:'#123456'})).state,'ready');assert.equal(b.vars.get('--bg'),'#123456');
  assert.equal(mount.observe(head(1,{background:'#654321'})).state,'blocked');assert.equal(b.vars.size,0);
  mount.observe(head(3,{radiusPx:22}));assert.equal(b.vars.get('--r-lg'),'22px');mount.clear();assert.equal(b.vars.size,0);
  mount.observe(head(4,{fontSizePx:19}));mount.observe(head(5));assert.equal(b.vars.size,0);
});
