# File: apps/mobile-relay/test/visual-theme.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/mobile-relay/test/visual-theme.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 2602 B |
| Lines | 43 |
| Hash | 72d01eb12dc4 |
| Test | yes |
| Generated | no |
| Component | mobile-relay |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| theme | const | 6 | no | const theme=chooseFirstPaintTheme({worldId:&#39;world-new&#39;}); |
| theme | const | 13 | no | const theme={...makeProvisionalTheme(&#39;world-A&#39;,&#39;dusk&#39;),revision:4,status:&#39;active&#39;, |
| theme | const | 20 | no | const theme=makeProvisionalTheme(&#39;world-1&#39;,&#39;ember&#39;); |
| theme | const | 29 | no | const theme=makeProvisionalTheme(&#39;world-1&#39;,name); |
| css | const | 30 | no | const css=compileVisualTheme(theme); |
| theme | const | 38 | no | const theme={...makeProvisionalTheme(&#39;world-x&#39;,&#39;tide&#39;),motion:&#39;slow&#39;}; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| ../visual-theme.mjs | import | 3 | [apps/mobile-relay/visual-theme.mjs](../visual-theme.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
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
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
