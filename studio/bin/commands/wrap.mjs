/**
 * @hq:context `studio system` — the wrapper command: manifest, substrates, verification.
 * @hq:owner atlas
 * @hq:task VC-30
 * @hq:see studio/src/studio/system-wrap.mjs
 * @hq:invariant verify exits non-zero when a check fails, so it can gate.
 */
// One command surface for the whole node. `bin/commands/system.mjs` already owns help/version/
// doctor/config, so the wrapper lives here under the command name `system`.

import { define } from '../lib/registry.mjs';
import { usageError } from '../lib/ui.mjs';
import { manifestSummary, verifySystem, SUBSTRATES, CHECKS } from '../../src/studio/system-wrap.mjs';

function emitJson(out, data) {
  return out.emit(data, (o) => o.line(JSON.stringify(data, null, 2)));
}

async function runSystem(ctx, sub, flags) {
  const { out } = ctx;

  if (sub === 'manifest') {
    const m = manifestSummary();
    if (flags.json) return emitJson(out, m);
    return out.emit(m, (o) => {
      o.result(`manifest v${m.version}  ${m.substrates.length} substrate(s)  ${m.invariantCount} invariant(s)`);
      for (const s of m.substrates) o.line(`  ${s.id.padEnd(13)} ${s.owner.padEnd(16)} ${s.entry}`);
    });
  }

  if (sub === 'substrates') {
    if (flags.json) return emitJson(out, { schema: 'vivim.system-substrates/1', substrates: SUBSTRATES });
    return out.emit(SUBSTRATES, (o) => {
      o.result(`${SUBSTRATES.length} substrate(s)`);
      for (const s of SUBSTRATES) {
        o.line(`  ${s.id.padEnd(13)} ${s.label}`);
        o.line(`  ${' '.repeat(13)} owner=${s.owner}  entry=${s.entry}`);
        o.line(`  ${' '.repeat(13)} provides: ${s.provides}`);
        if (s.cli.length) o.line(`  ${' '.repeat(13)} cli: ${s.cli.join(' · ')}`);
      }
    });
  }

  if (sub === 'verify') {
    const only = typeof flags.only === 'string' && flags.only.length ? flags.only.split(',').map((s) => s.trim()).filter(Boolean) : null;
    const result = await verifySystem({ only });
    if (flags.json) {
      emitJson(out, result);
    } else {
      out.emit(result, (o) => {
        o.result(`verify  ${result.passed}/${result.total} passed  ${result.ok ? 'OK' : 'FAILED'}`);
        for (const c of result.checks) {
          o.line(`  ${c.ok ? 'pass' : 'FAIL'}  ${c.id.padEnd(26)} ${c.detail}`);
        }
      });
    }
    if (!result.ok) process.exitCode = 1;
    return undefined;
  }

  if (sub === 'surfaces') {
    const { listSurfaces, summariseSurface } = await import('../../src/studio/system-surfaces.mjs');
    const surface = await listSurfaces();
    if (typeof flags.out === 'string' && flags.out.length) {
      const { writeFileSync } = await import('node:fs');
      writeFileSync(flags.out, JSON.stringify(surface, null, 2) + '\n');
      if (!flags.json) out.info(`wrote ${flags.out}`);
    }
    if (flags.json) return emitJson(out, surface);
    return out.emit(surface, (o) => {
      for (const line of summariseSurface(surface)) o.result(line);
      for (const c of surface.commands) o.line(`  ${c.name.padEnd(28)} ${(c.gated ? "gated" : c.mutating ? "mutating" : "read").padEnd(9)} ${c.section}`);
    });
  }

  if (sub === 'status') {
    const m = manifestSummary();
    const result = await verifySystem();
    const data = { schema: 'vivim.system-status/1', manifest: m, verify: result };
    if (flags.json) {
      emitJson(out, data);
    } else {
      out.emit(data, (o) => {
        o.result(`system  ${m.substrates.length} substrate(s)  ${m.invariantCount} invariant(s)  verify ${result.passed}/${result.total}`);
        for (const s of m.substrates) o.line(`  ${s.id.padEnd(13)} ${s.owner.padEnd(16)} ${s.cli.length} cli verb(s)`);
        for (const c of result.checks) {
          if (!c.ok) o.line(`  FAIL  ${c.id.padEnd(26)} ${c.detail}`);
        }
        o.line(result.ok ? '  all invariants hold' : `  ${result.failed.length} invariant(s) failed`);
      });
    }
    if (!result.ok) process.exitCode = 1;
    return undefined;
  }

  throw usageError('Usage: studio system <status|manifest|verify|substrates> [--only ID,ID] [--json]',
    `Subcommands: status, manifest, verify [--only ${Object.keys(CHECKS).slice(0, 3).join(',')}...], substrates.`);
}

define({
  name: 'system',
  section: 'System',
  usage: '<status|manifest|verify|substrates|surfaces> [--only ID,ID] [--out PATH] [--json]',
  summary: 'The wrapper: every substrate, every invariant, and the verification gate',
  description: 'One surface for the whole node. status and verify run all invariant checks across atoms, roles, state, channel, encoding, capability list and transport. Exits non-zero when verification fails, so CI can gate on it.',
  flags: {
    only: { type: 'string', valueName: 'IDS', desc: 'verify: comma-separated check ids to run' },
    out: { type: 'string', valueName: 'PATH', desc: 'surfaces: also write the machine-readable surface to this file' },
    json: { type: 'boolean', desc: 'Machine-readable output' },
  },
  examples: [
    'studio system status',
    'studio system verify',
    'studio system verify --only ATOM_COUNT,ROLE_EXCLUSIVE',
    'studio system manifest --json',
    'studio system surfaces --out docs/system/cli-surface.json',
  ],
  run: async (ctx) => {
    const [sub] = ctx.args;
    return runSystem(ctx, sub, ctx.flags);
  },
});
