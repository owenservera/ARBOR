import test from 'node:test';
import assert from 'node:assert/strict';
import {stagingPaths} from '../prepare-host-runtime.mjs';
test('GPUI Host runtime stages outside Tauri without changing original location',()=>{
 const gpui=stagingPaths('--stage-gpui');
 const tauri=stagingPaths('--stage');
 assert.match(gpui.runtime,/native[\\/]gpui-desktop[\\/]resources[\\/]runtime$/);
 assert.match(tauri.runtime,/src-tauri[\\/]resources[\\/]runtime$/);
 assert.notEqual(gpui.stage,tauri.stage);
 assert.notEqual(gpui.previous,tauri.previous);
});
