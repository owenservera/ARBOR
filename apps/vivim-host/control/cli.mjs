#!/usr/bin/env node
// Desktop text control (UTC04): `npm run control -- "set my theme to dusk"` (from apps/vivim-host).
// Talks to the running local Host over loopback with the private owner capability. The token is
// read from disk here and never printed. Non-read actions show the exact plan and require "y".
//   --yes        approve without prompting (still bound to the printed plan digest)
//   --dry-run    plan only
//   --json       machine-readable output
import { createInterface } from 'node:readline/promises';
import { loadOwnerToken } from '../bootstrap/owner-auth.mjs';
import { studioDataDir } from '../server.mjs';

const argv = process.argv.slice(2);
const flags = new Set(argv.filter(a => a.startsWith('--')));
const text = argv.filter(a => !a.startsWith('--')).join(' ').trim();
const port = Number(process.env.VIVIM_HOST_PORT || 43187);
if (!text && !flags.has('--ui')) { console.error('usage: control.mjs [--yes|--dry-run|--json] "<what you want>" | --ui'); process.exit(2); }

const base = `http://127.0.0.1:${port}`;
const { token } = loadOwnerToken({ dataRoot: studioDataDir(), create: false });
if (!token) { console.error('Owner capability not found. Start the Host once on this PC first.'); process.exit(1); }
async function call(path, body) {
  const r = await fetch(base + '/api/host/control/' + path, {
    method: 'POST', headers: { authorization: 'Bearer ' + token, origin: `http://127.0.0.1:${port}`,
      'x-vivim-control': '1', 'content-type': 'application/json' }, body: JSON.stringify(body) });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(data.error || data.code || String(r.status)), { code: data.code });
  return data;
}
const out = v => flags.has('--json') ? console.log(JSON.stringify(v, null, 2)) : null;
try {
  if (flags.has('--ui')) {
    if (text) throw new Error('Use --ui alone to open a private browser session.');
    const code = await call('ui-session', {});
    if (!/^[a-f0-9]{64}$/.test(code.code || '')) throw new Error('Host refused secure UI session.');
    // Deliberately no persistent owner secret or query parameter. The code is single-use
    // and expires after 60 seconds; paste this fragment URL into your local browser.
    console.log(base + '/#control-session=' + code.code);
    process.exit(0);
  }
  const plan = await call('plan', { text });
  if (flags.has('--json') && (flags.has('--dry-run') || plan.outcome !== 'approval_required')) { out(plan); process.exit(0); }
  if (plan.language?.feedback?.canonical) console.log('reads as  ' + plan.language.feedback.canonical);
  if (plan.language?.ignoredModifiers) console.log('note      "!" does not skip approval');
  switch (plan.outcome) {
    case 'done': console.log(plan.title + '\n' + JSON.stringify(plan.result, null, 2)); process.exit(0);
    case 'clarification_required': console.log(plan.question + '\n' + plan.choices.map(c => '  - ' + c).join('\n')); process.exit(3);
    case 'incomplete': console.log(plan.question); process.exit(3);
    case 'interpretation_required': console.log('Not a known command. Nothing changed.'); process.exit(3);
    case 'unavailable': console.log(`${plan.title}: unavailable (${plan.readiness})${plan.precondition ? '\nneeds: ' + plan.precondition : ''}`); process.exit(4);
  }
  console.log(`action    ${plan.title} [${plan.actionId}] risk ${plan.risk}\nargs      ${JSON.stringify(plan.args)}\nplan      ${plan.planDigest.slice(0, 16)} expires ${plan.expiresAt}`);
  if (plan.liveAcceptance !== 'verified') console.log('status    executor wired; live acceptance pending');
  if (flags.has('--dry-run')) process.exit(0);
  let ok = flags.has('--yes');
  if (!ok) {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    ok = /^y(es)?$/i.test((await rl.question('apply? [y/N] ')).trim()); rl.close();
  }
  if (!ok) { console.log('Cancelled. Nothing changed.'); process.exit(0); }
  const receipt = await call('execute', { planId: plan.planId, planDigest: plan.planDigest });
  if (flags.has('--json')) { out(receipt); process.exit(receipt.status === 'applied' ? 0 : 1); }
  console.log(`${receipt.status}  ${receipt.actionId}  receipt ${receipt.planId}`);
  if (receipt.result) console.log(JSON.stringify(receipt.result, null, 2));
  if (receipt.error) console.log(receipt.error.code + ': ' + receipt.error.message);
  if (receipt.undo) console.log(`undo with: ${receipt.undo.actionId} ${JSON.stringify(receipt.undo.args)}`);
  process.exit(receipt.status === 'applied' ? 0 : 1);
} catch (e) {
  console.error((e.code === 'CONTROL_UNCERTAIN' ? 'Outcome uncertain; it will not be retried. ' : '') + String(e.message ?? e));
  process.exit(1);
}
