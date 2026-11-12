import test from 'node:test';
import assert from 'node:assert/strict';
import {THEME_PRESETS, VISUAL_THEME_SCHEMA, makeProvisionalTheme, chooseFirstPaintTheme,
  compileVisualTheme, validateVisualTheme, readableForeground} from '../visual-theme.mjs';
test('first paint always has a truthful provisional theme for new World',()=>{
 const theme=chooseFirstPaintTheme({worldId:'world-new'});
 assert.equal(theme.schema,VISUAL_THEME_SCHEMA);
 assert.equal(theme.status,'provisional');
 assert.equal(theme.source.kind,'provisional');
 assert.equal(compileVisualTheme(theme).status,'provisional');
});
test('active cached theme is usable only for matching World',()=>{
 const theme={...makeProvisionalTheme('world-A','dusk'),revision:4,status:'active',
   source:{kind:'owner-choice',ref:'choice.123'}};
 assert.equal(chooseFirstPaintTheme({worldId:'world-A',cache:theme}).revision,4);
 assert.equal(chooseFirstPaintTheme({worldId:'world-B',cache:theme}).revision,0);
 assert.equal(chooseFirstPaintTheme({worldId:'world-A',cache:{...theme,status:'suggested'}}).revision,0);
});
test('model cannot inject CSS/HTML, unsupported colors or unknown fields',()=>{
 const theme=makeProvisionalTheme('world-1','ember');
 assert.throws(()=>validateVisualTheme({...theme,palette:{...theme.palette,accent:'red);url(https://evil.com)'}}));
 assert.throws(()=>validateVisualTheme({...theme,script:'alert(1)'}));
 assert.throws(()=>validateVisualTheme({...theme,texture:'url(https://evil.com)'}));
 assert.throws(()=>validateVisualTheme({...theme,worldId:'../../another'}));
 assert.throws(()=>validateVisualTheme({...theme,status:'active',source:{kind:'provider-inference',ref:'request.1'}}));
});
test('all curated presets compile to bounded CSS gradients, without external assets',()=>{
 for(const name of Object.keys(THEME_PRESETS)){
  const theme=makeProvisionalTheme('world-1',name);
  const css=compileVisualTheme(theme);
  assert.match(css.backgroundImage,/gradient\(/);
  assert.doesNotMatch(css.backgroundImage,/url\(|javascript|<script/i);
  assert.match(css.textColor,/^#[0-9a-f]{6}$/);
  assert.equal(css.motion,'still');
 }
});
test('reduced motion wins over theme suggestion and color foreground is deterministic',()=>{
 const theme={...makeProvisionalTheme('world-x','tide'),motion:'slow'};
 assert.equal(compileVisualTheme(theme,{reducedMotion:true}).motion,'still');
 assert.equal(compileVisualTheme(theme,{reducedMotion:false}).motion,'slow');
 assert.equal(readableForeground('#000000'),'#ffffff');
 assert.equal(readableForeground('#ffffff'),'#000000');
});
