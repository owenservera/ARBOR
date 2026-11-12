/**
 * @hq:context Central CLI node for the 1000 atomic browser capabilities.
 * @hq:owner atlas
 * @hq:task VC-20
 * @hq:see studio/src/studio/browser-atoms.mjs
 * @hq:invariant list/plan never touch a browser; run refuses anything but a read atom without --execute.
 */
// `studio atoms` is the single entry point to the whole browser surface: what exists, what it would
// do, what authority it needs, and then the run itself. One command surface, 1000 atoms, one owner.

import { define } from '../lib/registry.mjs';
import { usageError } from '../lib/ui.mjs';
import { loadRegistry, filterAtoms, getAtom, planAtom, FAMILIES, TARGET_COUNT, PER_FAMILY, FAMILY_SIZES } from '../../src/studio/browser-atoms.mjs';
import { partitionByRole, validateRoles, roleOf, managerFor, ROLES, ROLE_IDS } from '../../src/studio/atom-roles.mjs';

function emitJson(out, data) {
  return out.emit(data, (o) => o.line(JSON.stringify(data, null, 2)));
}

function parseArgsJson(flags) {
  if (typeof flags.args === 'string' && flags.args.length) {
    try { return JSON.parse(flags.args); }
    catch { throw usageError('--args must be a JSON object, e.g. \'{"selector":"#id"}\''); }
  }
  return {};
}

/** Summary of the node's completeness, used by `atoms status` and by every other subcommand. */
async function registryReport() {
  const reg = await loadRegistry();
  return {
    schema: 'vivim.browser-atoms/1',
    target: TARGET_COUNT,
    perFamily: PER_FAMILY,
    count: reg.count,
    unique: reg.unique,
    complete: reg.complete,
    families: reg.families,
    expectedFamilies: FAMILIES,
    missing: reg.missing,
    problems: reg.problems,
  };
}

async function runAtoms(ctx, sub, flags) {
  const { out } = ctx;

  if (sub === 'status') {
    const report = await registryReport();
    return out.emit(report, (o) => {
      o.result(`atoms  ${report.count}/${report.target}  ${report.complete ? 'COMPLETE' : 'INCOMPLETE'}`);
      for (const f of report.expectedFamilies) {
        const n = report.families[f];
        o.line(`  ${f.padEnd(8)} ${n === undefined ? 'missing' : n + '/' + (FAMILY_SIZES[f] ?? report.perFamily)}`);
      }
      for (const m of report.missing) o.line(`  ! ${m.family}: ${m.reason}`);
      for (const p of report.problems) o.line(`  ! ${p}`);
    });
  }

  if (sub === 'roles') {
    const reg = await loadRegistry();
    const byRole = partitionByRole(reg.atoms);
    const check = validateRoles(reg.atoms);
    if (flags.json) {
      return emitJson(out, {
        schema: 'vivim.browser-atoms.roles/1',
        ok: check.ok,
        total: check.total,
        counts: check.counts,
        problems: check.problems,
        roles: ROLE_IDS.map((id) => ({ ...ROLES[id], atoms: byRole[id].length })),
      });
    }
    return out.emit(check, (o) => {
      o.result(`roles  ${check.total} atom(s) across ${ROLE_IDS.length} manager(s)  ${check.ok ? 'OK' : 'PROBLEMS'}`);
      for (const id of ROLE_IDS) {
        o.line(`  ${id.padEnd(9)} ${String(byRole[id].length).padStart(4)} atoms  seat=${ROLES[id].seat}`);
        o.line(`            may: ${ROLES[id].may.join(', ')}${ROLES[id].mayNot.length ? `  · may not: ${ROLES[id].mayNot.join(', ')}` : ''}`);
      }
      for (const p of check.problems) o.line(`  ! ${p}`);
    });
  }

  if (sub === 'list') {
    const reg = await loadRegistry();
    const atoms = filterAtoms(reg.atoms, { family: flags.family, effect: flags.effect, primitive: flags.primitive, text: flags.text });
    if (flags.json) return emitJson(out, { schema: 'vivim.browser-atoms.list/1', count: atoms.length, atoms });
    return out.emit(atoms, (o) => {
      o.result(`${atoms.length} atom(s)`);
      for (const a of atoms) o.line(`${a.id.padEnd(34)} ${a.effect.padEnd(20)} ${a.summary}`);
    });
  }

  if (sub === 'show') {
    const id = flags.id ?? ctx.args[1];
    if (!id) throw usageError('Usage: studio atoms show <atom-id>');
    const atom = await getAtom(id);
    if (flags.json) return emitJson(out, { schema: 'vivim.browser-atoms.atom/1', atom });
    return out.emit(atom, (o) => {
      o.result(atom.id);
      o.line(`  family    ${atom.family}`);
      o.line(`  effect    ${atom.effect}`);
      o.line(`  primitive ${atom.primitive}`);
      o.line(`  summary   ${atom.summary}`);
      o.line(`  arguments ${atom.args.map((a) => `${a.name}:${a.type}${a.required ? '' : '?'}`).join(', ') || '(none)'}`);
    });
  }

  if (sub === 'plan') {
    const id = flags.id ?? ctx.args[1];
    if (!id) throw usageError('Usage: studio atoms plan <atom-id> [--args <json>]');
    const atom = await getAtom(id);
    const plan = planAtom(atom, parseArgsJson(flags));
    const manager = managerFor(atom);
    if (flags.json) return emitJson(out, { schema: 'vivim.browser-atoms.plan/1', ...plan, manager });
    return out.emit(plan, (o) => {
      o.result(`${plan.id}  ${plan.ready ? 'ready' : 'needs input'}  effect=${plan.effect}  owner=${manager.role}`);
      o.line(`  manager   ${manager.seat}`);
      if (plan.missingArgs.length) o.line(`  missing   ${plan.missingArgs.join(', ')}`);
      if (plan.unknownArgs.length) o.line(`  unknown   ${plan.unknownArgs.join(', ')}`);
      if (plan.needsExecute) o.line('  authority requires --execute to run (this atom changes something)');
    });
  }

  if (sub === 'run') {
    const id = flags.id ?? ctx.args[1];
    if (!id) throw usageError('Usage: studio atoms run <atom-id> --args <json> [--execute]');
    const atom = await getAtom(id);
    const plan = planAtom(atom, parseArgsJson(flags));
    if (!plan.ready) {
      throw usageError(`atom ${id} is not ready: missing ${plan.missingArgs.join(', ') || 'nothing'}, unknown ${plan.unknownArgs.join(', ') || 'none'}`);
    }
    const owner = managerFor(atom);
    if (owner.role === 'account' && atom.args.some((a) => /^(password|token|secret|credential)$/i.test(a.name))) {
      throw usageError(`atom ${id} asks for a credential; the account manager never reads one back`);
    }
    if (plan.needsExecute && !flags.execute) {
      throw usageError(`atom ${id} has effect "${atom.effect}"; add --execute to run it`);
    }
    // Execution is owned by the dispatcher, which is the only component allowed to touch a page.
    let dispatch;
    try { dispatch = await import('../../src/studio/atom-dispatch.mjs'); }
    catch { throw envError('The atom dispatcher is not installed', 'Build studio/src/studio/atom-dispatch.mjs, then run this again.'); }
    const result = await dispatch.runAtom(atom, parseArgsJson(flags), { execute: Boolean(flags.execute) });
    if (flags.json) return emitJson(out, { schema: 'vivim.browser-atoms.run/1', ...result });
    return out.emit(result, (o) => {
      o.result(`${atom.id}  ${result.ok ? 'ok' : 'failed'}  effect=${atom.effect}  ${result.ms}ms`);
      if (result.error) o.line(`  error     ${result.error}`);
      if (result.result !== undefined) o.line(`  result    ${typeof result.result === 'string' ? result.result.slice(0, 200) : JSON.stringify(result.result).slice(0, 200)}`);
    });
  }

  throw usageError('Usage: studio atoms <status|list|show|plan|run> …');
}

function envError(message, hint) {
  const error = new Error(message);
  error.hint = hint;
  return error;
}

define({
  name: 'atoms',
  section: 'Get started',
  usage: '<status|list|show|plan|run> [atom-id] [--family F] [--effect E] [--text T] [--args JSON] [--execute]',
  summary: 'The 1000 atomic browser capabilities: status, list, show, plan, run',
  description: 'One entry point to every atomic browser capability in the harness. list/show/plan never open Chrome; run requires --execute for anything that changes the page.',
  flags: {
    family: { type: 'string', valueName: 'F', desc: 'Filter by family: nav dom act type read net state wait screen safe' },
    effect: { type: 'string', valueName: 'E', desc: 'Filter by effect: read, local-write, page-write, browser-navigation, provider-send' },
    primitive: { type: 'string', valueName: 'P', desc: 'Filter by underlying primitive' },
    text: { type: 'string', valueName: 'T', desc: 'Free-text match on id and summary' },
    id: { type: 'string', valueName: 'ATOM_ID', desc: 'Atom id for show/plan/run' },
    args: { type: 'string', valueName: 'JSON', desc: 'JSON object of atom arguments' },
    execute: { type: 'boolean', desc: 'Authorize a non-read atom to run' },
    json: { type: 'boolean', desc: 'Machine-readable output' },
  },
  examples: [
    'studio atoms status',
    'studio atoms list --family nav --json',
    'studio atoms show nav.goto.url',
    'studio atoms plan dom.exists.selector --args "{\\"selector\\":\\"#main\\"}"',
    'studio atoms run read.extract.text --args "{\\"selector\\":\\"body\\"}" --json',
  ],
  run: async (ctx) => {
    const [sub] = ctx.args;
    return runAtoms(ctx, sub, ctx.flags);
  },
});
