# File: studio/bin/commands/atoms.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/bin/commands/atoms.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 9019 B |
| Lines | 190 |
| Hash | 01fea1cac1af |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| emitJson | function | 16 | no | function emitJson(out, data) { |
| parseArgsJson | function | 20 | no | function parseArgsJson(flags) { |
| registryReport | function | 29 | no | async function registryReport() { |
| reg | const | 30 | no | const reg = await loadRegistry(); |
| runAtoms | function | 45 | no | async function runAtoms(ctx, sub, flags) { |
| report | const | 49 | no | const report = await registryReport(); |
| n | const | 53 | no | const n = report.families[f]; |
| reg | const | 62 | no | const reg = await loadRegistry(); |
| byRole | const | 63 | no | const byRole = partitionByRole(reg.atoms); |
| check | const | 64 | no | const check = validateRoles(reg.atoms); |
| reg | const | 86 | no | const reg = await loadRegistry(); |
| atoms | const | 87 | no | const atoms = filterAtoms(reg.atoms, { family: flags.family, effect: flags.effect, primitive: flags.primitive, text: flags.text }); |
| id | const | 96 | no | const id = flags.id ?? ctx.args[1]; |
| atom | const | 98 | no | const atom = await getAtom(id); |
| id | const | 111 | no | const id = flags.id ?? ctx.args[1]; |
| atom | const | 113 | no | const atom = await getAtom(id); |
| plan | const | 114 | no | const plan = planAtom(atom, parseArgsJson(flags)); |
| manager | const | 115 | no | const manager = managerFor(atom); |
| id | const | 127 | no | const id = flags.id ?? ctx.args[1]; |
| atom | const | 129 | no | const atom = await getAtom(id); |
| plan | const | 130 | no | const plan = planAtom(atom, parseArgsJson(flags)); |
| owner | const | 134 | no | const owner = managerFor(atom); |
| dispatch | variable | 142 | no | let dispatch; |
| result | const | 145 | no | const result = await dispatch.runAtom(atom, parseArgsJson(flags), { execute: Boolean(flags.execute) }); |
| envError | function | 157 | no | function envError(message, hint) { |
| error | const | 158 | no | const error = new Error(message); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ../lib/registry.mjs | import | 11 | [studio/bin/lib/registry.mjs](../lib/registry.mjs.md) |
| ../lib/ui.mjs | import | 12 | [studio/bin/lib/ui.mjs](../lib/ui.mjs.md) |
| ../../src/studio/browser-atoms.mjs | import | 13 | [studio/src/studio/browser-atoms.mjs](../../src/studio/browser-atoms.mjs.md) |
| ../../src/studio/atom-roles.mjs | import | 14 | [studio/src/studio/atom-roles.mjs](../../src/studio/atom-roles.mjs.md) |
| ../../src/studio/atom-dispatch.mjs | dynamic | 143 | [studio/src/studio/atom-dispatch.mjs](../../src/studio/atom-dispatch.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/bin/studio.mjs](../studio.mjs.md) | ./commands/atoms.mjs |

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 2 | context | — | — | Central CLI node for the 1000 atomic browser capabilities. |
| 3 | owner | atlas | — | atlas |
| 4 | task | — | — | VC-20 |
| 5 | see | — | studio/src/studio/browser-atoms.mjs | studio/src/studio/browser-atoms.mjs |
| 6 | invariant | — | — | list/plan never touch a browser; run refuses anything but a read atom without --execute. |

## Excerpt

```javascript
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
```

_First 80 of 191 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
