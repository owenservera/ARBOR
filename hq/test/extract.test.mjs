// hq/test/extract.test.mjs — lane A: symbol, import and annotation extraction.
// Inline fixtures only; every assertion uses the public contract shape.

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extractSymbols,
  extractImports,
  extractAnnotations,
} from '../lib/extract.mjs';

const CONTROL_NAMES = new Set([
  'if', 'for', 'while', 'switch', 'catch', 'return', 'function', 'class',
  'const', 'let', 'var', 'import', 'from', 'use',
]);

function names(symbols) {
  return symbols.map((s) => s.name);
}

function assertSymbolShape(symbols, lineCount) {
  for (const s of symbols) {
    assert.equal(typeof s.name, 'string');
    assert.ok(s.name.length > 0);
    assert.equal(typeof s.kind, 'string');
    assert.ok(Number.isInteger(s.line) && s.line >= 1 && s.line <= lineCount, `line out of range: ${s.name}`);
    assert.ok(Number.isInteger(s.end_line) && s.end_line >= s.line, `end_line before line: ${s.name}`);
    assert.ok(s.end_line <= lineCount, `end_line out of range: ${s.name}`);
    assert.equal(typeof s.signature, 'string');
    assert.ok(s.signature.length <= 240, `signature too long: ${s.name}`);
    assert.ok(!s.signature.includes('\n'), `signature not single-line: ${s.name}`);
    assert.equal(typeof s.exported, 'boolean');
    assert.ok(!CONTROL_NAMES.has(s.name), `control keyword emitted: ${s.name}`);
  }
}

const JS_SOURCE = `// function commentedOut() {}
export function greet(name) {
  return 'hi ' + name;
}
async function* stream() { yield 1; }
class User extends Base {
  constructor(id) { this.id = id; }
  async load(id) {
    return fetch(id);
  }
  static create() { return new User(1); }
}
export const add = (a, b) => {
  return a + b;
};
const MAX = 10;
export interface Point { x: number; }
type Id = string | number;
export enum Color { Red, Green }
export { MAX as LIMIT };
module.exports.legacy = function () {};
const router = express.Router();
router.get('/api/users', handler);
app.post('/api/users', handler);
export default function main() {}
`;

const JS_LINE_COUNT = JS_SOURCE.split('\n').length;

test('javascript: functions, class methods, const/arrow, exports and routes', () => {
  const syms = extractSymbols('javascript', JS_SOURCE);
  assertSymbolShape(syms, JS_LINE_COUNT);

  const greet = syms.find((s) => s.name === 'greet');
  assert.ok(greet, 'greet missing');
  assert.equal(greet.kind, 'function');
  assert.equal(greet.exported, true);
  assert.equal(greet.line, 2);

  const stream = syms.find((s) => s.name === 'stream');
  assert.equal(stream?.kind, 'function');

  const user = syms.find((s) => s.name === 'User');
  assert.equal(user?.kind, 'class');
  assert.ok(user.end_line > user.line, 'class end_line should span its body');

  const methods = syms.filter((s) => s.kind === 'method').map((s) => s.name).sort();
  assert.deepEqual(methods, ['constructor', 'create', 'load']);

  const add = syms.find((s) => s.name === 'add');
  assert.equal(add?.kind, 'function');
  assert.equal(add?.exported, true);

  const max = syms.find((s) => s.name === 'MAX');
  assert.equal(max?.kind, 'const');
  assert.equal(max?.exported, false);

  assert.equal(syms.find((s) => s.name === 'LIMIT')?.kind, 'export');
  assert.equal(syms.find((s) => s.name === 'legacy')?.kind, 'export');
  assert.equal(syms.find((s) => s.name === 'commentedOut'), undefined);
});

test('typescript: interface, type alias and enum declarations', () => {
  const syms = extractSymbols('typescript', JS_SOURCE);
  assert.equal(syms.find((s) => s.name === 'Point')?.kind, 'interface');
  assert.equal(syms.find((s) => s.name === 'Point')?.exported, true);
  assert.equal(syms.find((s) => s.name === 'Id')?.kind, 'type');
  assert.equal(syms.find((s) => s.name === 'Color')?.kind, 'enum');
  assert.equal(syms.find((s) => s.name === 'Color')?.exported, true);
});

test('javascript: route declarations carry method and path', () => {
  const routes = extractSymbols('javascript', JS_SOURCE).filter((s) => s.kind === 'route');
  assert.equal(routes.length, 2);
  assert.deepEqual(routes.map((r) => r.name), ['/api/users', '/api/users']);
  assert.deepEqual(routes.map((r) => r.signature), ['GET /api/users', 'POST /api/users']);
});

test('javascript: comments and strings never produce symbols', () => {
  const src = [
    '// function fake() {}',
    '/* class AlsoFake {} */',
    "const quoted = 'function stringy() {}';",
    'function real() {}',
  ].join('\n');
  const syms = extractSymbols('javascript', src);
  assert.deepEqual(names(syms), ['quoted', 'real']);
  assert.equal(syms.find((s) => s.name === 'real')?.kind, 'function');
});

test('control keywords are rejected in every language', () => {
  const js = [
    'if (a) { b(); }',
    'for (let i = 0; i < 2; i++) { c(); }',
    'while (x) { y(); }',
    'switch (z) { case 1: break; }',
    'try { f(); } catch (e) { g(); }',
    'return 1;',
    'function real() {}',
  ].join('\n');
  const syms = extractSymbols('javascript', js);
  for (const s of syms) assert.ok(!CONTROL_NAMES.has(s.name));
  assert.deepEqual(names(syms), ['real']);
});

const PY_SOURCE = `# def commented_out(): pass
import os
from pathlib import Path
from .local import helper

@decorator
def top(x):
    return x

async def fetch(url):
    return url

class Service:
    def run(self):
        return 1

    async def stop(self):
        pass

MAX = 10
`;

test('python: def, async def, class, methods and module-level assignment', () => {
  const syms = extractSymbols('python', PY_SOURCE);
  assertSymbolShape(syms, PY_SOURCE.split('\n').length);

  const top = syms.find((s) => s.name === 'top');
  assert.equal(top?.kind, 'function');
  assert.equal(top?.exported, true);
  assert.match(top.signature, /@decorator/);

  assert.equal(syms.find((s) => s.name === 'fetch')?.kind, 'function');
  assert.equal(syms.find((s) => s.name === 'Service')?.kind, 'class');
  assert.equal(syms.find((s) => s.name === 'run')?.kind, 'method');
  assert.equal(syms.find((s) => s.name === 'stop')?.kind, 'method');
  assert.equal(syms.find((s) => s.name === 'MAX')?.kind, 'variable');
  assert.equal(syms.find((s) => s.name === 'commented_out'), undefined);
});

test('python imports: plain, from and relative', () => {
  const imports = extractImports('python', PY_SOURCE);
  assert.deepEqual(imports.map((i) => i.specifier), ['os', 'pathlib', '.local']);
  assert.ok(imports.every((i) => i.kind === 'import'));
  assert.deepEqual(imports.map((i) => i.line), [2, 3, 4]);
});

const GO_SOURCE = `package main

import (
  "fmt"
  "os"
)

import "strings"

func Add(a int, b int) int {
  return a + b
}

func (r *Repo) Get(id string) error {
  return nil
}

type Repo struct {
  name string
}

type Reader interface {
  Read() error
}

const MaxSize = 10
var counter int
`;

test('go: func, method, struct, interface, const and var', () => {
  const syms = extractSymbols('go', GO_SOURCE);
  assertSymbolShape(syms, GO_SOURCE.split('\n').length);

  assert.equal(syms.find((s) => s.name === 'Add')?.kind, 'function');
  assert.equal(syms.find((s) => s.name === 'Add')?.exported, true);
  assert.equal(syms.find((s) => s.name === 'Get')?.kind, 'method');
  assert.equal(syms.find((s) => s.name === 'Repo')?.kind, 'struct');
  assert.equal(syms.find((s) => s.name === 'Reader')?.kind, 'interface');
  assert.equal(syms.find((s) => s.name === 'MaxSize')?.kind, 'const');
  assert.equal(syms.find((s) => s.name === 'counter')?.kind, 'variable');
  assert.equal(syms.find((s) => s.name === 'counter')?.exported, false);
});

test('go imports: single and parenthesized block', () => {
  const imports = extractImports('go', GO_SOURCE);
  assert.deepEqual(imports.map((i) => i.specifier), ['fmt', 'os', 'strings']);
  assert.ok(imports.every((i) => i.kind === 'import'));
});

const RUST_SOURCE = `use std::collections::HashMap;
pub fn run() {}
struct Config { name: String }
enum Mode { Fast, Slow }
impl Config {
  pub fn load(&self) -> Mode { Mode::Fast }
}
pub trait Readable {}
mod util;
`;

test('rust: fn, struct, enum, trait, impl method and mod', () => {
  const syms = extractSymbols('rust', RUST_SOURCE);
  assertSymbolShape(syms, RUST_SOURCE.split('\n').length);

  assert.equal(syms.find((s) => s.name === 'run')?.kind, 'function');
  assert.equal(syms.find((s) => s.name === 'run')?.exported, true);
  assert.equal(syms.find((s) => s.name === 'Config')?.kind, 'struct');
  assert.equal(syms.find((s) => s.name === 'Mode')?.kind, 'enum');
  assert.equal(syms.find((s) => s.name === 'load')?.kind, 'method');
  assert.equal(syms.find((s) => s.name === 'Readable')?.kind, 'trait');
  assert.equal(syms.find((s) => s.name === 'util')?.kind, 'module');
});

test('rust imports: use and mod', () => {
  const imports = extractImports('rust', RUST_SOURCE);
  assert.deepEqual(imports.map((i) => i.specifier), ['std::collections::HashMap', 'util']);
  assert.ok(imports.every((i) => i.kind === 'use'));
});

const CS_SOURCE = `using System;
using System.Linq;

namespace Demo {
  public class Service {
    private int count;
    public Service(int count) { this.count = count; }
    public int Add(int a, int b) {
      return a + b;
    }
    private void Reset() {}
  }
  public interface IThing { }
}
`;

test('csharp: class, constructor, methods, interface and using imports', () => {
  const syms = extractSymbols('csharp', CS_SOURCE);
  assertSymbolShape(syms, CS_SOURCE.split('\n').length);

  const service = syms.find((s) => s.name === 'Service' && s.kind === 'class');
  assert.ok(service, 'Service class missing');
  assert.equal(service.exported, true);
  assert.ok(service.end_line >= 12);

  assert.equal(syms.find((s) => s.name === 'Add')?.kind, 'method');
  assert.equal(syms.find((s) => s.name === 'Add')?.exported, true);
  assert.equal(syms.find((s) => s.name === 'Reset')?.kind, 'method');
  assert.equal(syms.find((s) => s.name === 'Reset')?.exported, false);
  assert.equal(syms.find((s) => s.name === 'IThing')?.kind, 'interface');

  const imports = extractImports('csharp', CS_SOURCE);
  assert.deepEqual(imports.map((i) => i.specifier), ['System', 'System.Linq']);
  assert.ok(imports.every((i) => i.kind === 'use'));
});

const ANN_SOURCE = `// @hq:context payment flow
// @hq:why idempotency matters
// @hq:invariant amount > 0
// @hq:see src/pay.ts:42
// @hq:todo(amir): wire retries
// @hq:owner(amir)
// @hq:task T-17
// @hq:risk double charge
// @hq:deprecated use v2
// TODO fix this later
/* @hq:why block reason
 * more detail */
const quoted = '@hq:why not a comment';
`;

test('annotations: all nine kinds from comments only', () => {
  const anns = extractAnnotations('javascript', ANN_SOURCE);
  const kinds = [...new Set(anns.map((a) => a.kind))].sort();
  assert.deepEqual(kinds, [
    'context', 'deprecated', 'invariant', 'owner', 'risk', 'see', 'task', 'todo', 'why',
  ]);
  assert.equal(anns.filter((a) => a.kind === 'context').length, 1);
  assert.equal(anns.find((a) => a.kind === 'why')?.text, 'idempotency matters');
  assert.equal(anns.find((a) => a.kind === 'invariant')?.text, 'amount > 0');
});

test('annotations: owner and ref capture', () => {
  const anns = extractAnnotations('javascript', ANN_SOURCE);
  const todo = anns.find((a) => a.kind === 'todo');
  assert.equal(todo?.owner, 'amir');
  assert.equal(todo?.text, 'wire retries');

  const owner = anns.find((a) => a.kind === 'owner');
  assert.equal(owner?.owner, 'amir');
  assert.equal(owner?.text, 'amir');

  const see = anns.find((a) => a.kind === 'see');
  assert.equal(see?.ref, 'src/pay.ts:42');
  assert.equal(see?.text, 'src/pay.ts:42');

  assert.equal(anns.find((a) => a.kind === 'deprecated')?.text, 'use v2');
});

test('annotations: plain TODO and string literals are not annotations', () => {
  const anns = extractAnnotations('javascript', ANN_SOURCE);
  assert.ok(!anns.some((a) => a.text.includes('TODO')));
  assert.ok(!anns.some((a) => a.text.includes('not a comment')));
  const block = anns.find((a) => a.kind === 'why' && a.text === 'block reason');
  assert.ok(block, 'block comment annotation missing');
  assert.equal(block.line, 11);
});

test('annotations: python and sql comment styles', () => {
  const py = extractAnnotations('python', '# @hq:why python reason\nx = 1\n# TODO plain\n');
  assert.equal(py.length, 1);
  assert.equal(py[0].kind, 'why');
  assert.equal(py[0].text, 'python reason');

  const sql = extractAnnotations('sql', '-- @hq:risk drop table\nSELECT 1;\n');
  assert.equal(sql.length, 1);
  assert.equal(sql[0].kind, 'risk');
});

test('imports: javascript static, dynamic, require and export-from', () => {
  const src = [
    "import React, { useState } from 'react';",
    "import './styles.css';",
    "export { x } from './x.js';",
    "const lazy = import('./lazy.js');",
    "const fs = require('fs');",
    "// import fake from './fake';",
  ].join('\n');
  const imports = extractImports('javascript', src);
  assert.deepEqual(imports.map((i) => `${i.kind}:${i.specifier}`), [
    'import:react',
    'import:./styles.css',
    'export_from:./x.js',
    'dynamic:./lazy.js',
    'require:fs',
  ]);
});

test('imports: c include directives', () => {
  const imports = extractImports('c', '#include <stdio.h>\n#include "local.h"\n');
  assert.deepEqual(imports.map((i) => i.specifier), ['stdio.h', 'local.h']);
  assert.ok(imports.every((i) => i.kind === 'include'));
});

test('determinism: identical input yields identical ordered output', () => {
  const first = extractSymbols('javascript', JS_SOURCE);
  const second = extractSymbols('javascript', JS_SOURCE);
  assert.deepEqual(first, second);
  assert.deepEqual(extractImports('javascript', JS_SOURCE), extractImports('javascript', JS_SOURCE));
  assert.deepEqual(extractAnnotations('javascript', ANN_SOURCE), extractAnnotations('javascript', ANN_SOURCE));

  const lines = first.map((s) => s.line);
  const sorted = [...lines].sort((a, b) => a - b);
  assert.deepEqual(lines, sorted, 'symbols are not sorted by line');
});

test('end_line stays inside the file for every language fixture', () => {
  const fixtures = [
    ['javascript', JS_SOURCE],
    ['python', PY_SOURCE],
    ['go', GO_SOURCE],
    ['rust', RUST_SOURCE],
    ['csharp', CS_SOURCE],
  ];
  for (const [lang, src] of fixtures) {
    const count = src.split('\n').length;
    const syms = extractSymbols(lang, src);
    assert.ok(syms.length > 0, `${lang}: no symbols`);
    for (const s of syms) {
      assert.ok(s.end_line >= s.line, `${lang}:${s.name} end_line < line`);
      assert.ok(s.end_line <= count, `${lang}:${s.name} end_line > file`);
    }
  }
});

test('vue: template expressions are not symbols; scripts are', () => {
  const src = `<template>
  <div @click="app.get('/nope')">{{ msg }}</div>
</template>
<script setup lang="ts">
import { ref } from 'vue'
export const count = ref(0)
function bump() { count.value++ }
</script>
`;
  const syms = extractSymbols('vue', src);
  assert.deepEqual(names(syms).sort(), ['bump', 'count']);
  assert.equal(syms.find((s) => s.name === 'count')?.kind, 'const');
  assert.equal(syms.find((s) => s.name === 'count')?.exported, true);
  assert.ok(!syms.some((s) => s.kind === 'route'));
  assert.deepEqual(extractImports('vue', src).map((i) => i.specifier), ['vue']);
});

test('edge cases: empty input, unknown language, comment-only file', () => {
  assert.deepEqual(extractSymbols('javascript', ''), []);
  assert.deepEqual(extractImports('javascript', ''), []);
  assert.deepEqual(extractAnnotations('javascript', ''), []);
  assert.deepEqual(extractSymbols('brainfuck', '+++'), []);
  assert.deepEqual(extractImports('shell', 'echo hi'), []);
  assert.deepEqual(extractAnnotations('javascript', '// TODO nothing here\n'), []);
});
