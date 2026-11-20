// Unit gate for NEXT:D06-B-ALTERNATE-SEND-AUTHORITY.
//
// Covers studio/src/studio/atom-dispatch.mjs :: runAtom / createDispatcher.
//
// These are pure, side-effect-free functions: no browser, no Host effect construction, no
// persistence. They prove the authority seam:
//   - a non-read atom requires execute:true; the dispatcher never infers authority
//   - a non-read atom without an attached page refuses instead of pretending (page custody stays
//     with the Host; the CLI never constructs a page)
//   - an unknown primitive is refused; no synthetic effect path is fabricated
import test from 'node:test';
import assert from 'node:assert/strict';
import { runAtom, createDispatcher, PRIMITIVE_HANDLERS } from '../../src/studio/atom-dispatch.mjs';

const readAtom = { id: 'read.digest.body', primitive: 'digest', effect: 'read',
  args: [{ name: 'selector', type: 'string', required: true }] };
const writeAtom = { id: 'page.click.submit', primitive: 'click', effect: 'page-write',
  args: [{ name: 'selector', type: 'string', required: true }] };

function fakePage(value) {
  const calls = [];
  return { send: async (...args) => { calls.push(args); return { result: { value } }; }, calls };
}

test('runAtom refuses a non-read atom without execute: the dispatcher never infers authority', async () => {
  const result = await runAtom(writeAtom, { selector: '#x' }, { page: fakePage('ok'), execute: false });
  assert.equal(result.ok, false);
  assert.equal(result.error, 'ATOM_EXECUTE_REQUIRED');
  assert.equal(result.id, writeAtom.id);
  assert.equal(result.primitive, undefined);
});

test('runAtom refuses a non-read atom with execute but no attached page: page custody stays with the Host', async () => {
  const result = await runAtom(writeAtom, { selector: '#x' }, { page: null, execute: true });
  assert.equal(result.ok, false);
  assert.equal(result.error, 'ATOM_PAGE_REQUIRED');
  assert.equal(result.id, writeAtom.id);
});

test('runAtom runs a non-read atom through the Host-owned page when execute and page are both present', async () => {
  const page = fakePage('clicked');
  const result = await runAtom(writeAtom, { selector: '#x' }, { page, execute: true });
  assert.equal(result.ok, true);
  assert.equal(result.effect, 'page-write');
  assert.equal(result.result, 'clicked');
  assert.equal(page.calls.length, 1);
});

test('runAtom runs a read atom without a page and without execute: reads need no Host authority', async () => {
  const page = fakePage({ value: 'hello' });
  const result = await runAtom(readAtom, { selector: 'body' }, { page, execute: false });
  assert.equal(result.ok, true);
  assert.equal(result.effect, 'read');
});

test('runAtom refuses an unknown primitive: no synthetic effect path is fabricated', async () => {
  const result = await runAtom({ id: 'weird.thing', primitive: 'noSuchPrimitive', effect: 'read' },
    {}, { page: null, execute: false });
  assert.equal(result.ok, false);
  assert.equal(result.error, 'ATOM_NO_HANDLER: noSuchPrimitive');
});

test('createDispatcher returns a bound function that delegates to runAtom with the Host page', async () => {
  const page = fakePage('bound');
  const dispatch = createDispatcher(page);
  const result = await dispatch(writeAtom, { selector: '#x' }, { execute: true });
  assert.equal(result.ok, true);
  assert.equal(result.result, 'bound');
});

test('runAtom surfaces handler failures as an envelope rather than throwing', async () => {
  const boom = { send: async () => { throw new Error('PAGE_DIED'); } };
  const result = await runAtom(writeAtom, { selector: '#x' }, { page: boom, execute: true });
  assert.equal(result.ok, false);
  assert.equal(result.error, 'PAGE_DIED');
  assert.equal(result.id, writeAtom.id);
});
