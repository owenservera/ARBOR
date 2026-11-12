/**
 * @hq:context kernel CLI verbs (init, verify, read, history, lock, unlock) for L0 to wire into hq/bin/hq.mjs
 * @hq:owner hq-agent (L1)
 * @hq:task L1
 * L0 owns hq/bin/hq.mjs (shared-serial). This module is imported by L0's delta; it does not edit it.
 */

import {
  acquireKernelLock, initKernel, kernelRead, kernelHistory, kernelVerify,
  kernelBackup, kernelRestore, releaseKernelLock, REFUSAL,
} from './store.mjs';

const BOOL = new Set(['json', 'force', 'yes', 'quiet']);

function parse(argv) {
  const positional = [];
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--') { positional.push(...argv.slice(i + 1)); break; }
    if (arg.startsWith('--')) {
      const eq = arg.indexOf('=');
      if (eq !== -1) { flags[arg.slice(2, eq)] = arg.slice(eq + 1); }
      else {
        const key = arg.slice(2);
        if (BOOL.has(key)) flags[key] = true;
        else if (i + 1 < argv.length && !argv[i + 1].startsWith('--')) flags[key] = argv[++i];
        else flags[key] = true;
      }
    } else positional.push(arg);
  }
  return { positional, flags };
}

function defaultEmit(flags, value, text) {
  const out = text.endsWith('\n') ? text : text + '\n';
  if (flags.json) process.stdout.write(JSON.stringify(value) + '\n');
  else process.stdout.write(out);
}

function defaultFail(code, message) {
  process.stderr.write(`hq kernel: ${message}\n`);
  return code;
}

export async function runKernelCli(argv, ctx = {}) {
  const emit = ctx.emit || defaultEmit;
  const fail = ctx.fail || defaultFail;
  const { positional, flags } = parse(argv);
  const command = positional.shift();

  try {
    switch (command) {
      case 'init': {
        const out = initKernel({ dbPath: flags['db-path'] || flags.dbpath });
        emit(flags, { schema: 'hq.kernel.init/1', ...out },
          `Kernel store initialised: ${out.dbPath} (user_version ${out.userVersion})`);
        return 0;
      }
      case 'verify': {
        const out = kernelVerify({ dbPath: flags['db-path'] || flags.dbpath });
        emit(flags, { schema: 'hq.kernel.verify/1', ...out },
          out.ok ? `kernel verify ok: ${out.chain.length} revisions, 0 broken`
            : `kernel verify BROKEN: ${out.broken.length} problem(s) in the revision chain`);
        return out.ok ? 0 : 1;
      }
      case 'read': {
        const [domain, targetId] = positional;
        if (!domain || !targetId) return fail(2, 'usage: hq kernel read <domain> <target-id> [--revision current] [--db-path PATH]');
        const out = kernelRead(domain, targetId, { revision: flags.revision || 'current', dbPath: flags['db-path'] || flags.dbpath });
        if (!out) { emit(flags, null, `no entry for ${domain}/${targetId}`); return 0; }
        emit(flags, out, JSON.stringify(out, null, 2));
        return 0;
      }
      case 'history': {
        const [domain, targetId] = positional;
        if (!domain || !targetId) return fail(2, 'usage: hq kernel history <domain> <target-id> [--limit N] [--db-path PATH]');
        const out = kernelHistory(domain, targetId, { limit: flags.limit ? Number(flags.limit) : 50, dbPath: flags['db-path'] || flags.dbpath });
        emit(flags, { schema: 'hq.kernel.history/1', domain, target_id: targetId, count: out.length, entries: out },
          out.length ? out.map((e) => `${e.seq}\t${e.revision}\t${e.created_at}\t${e.content_hash.slice(0, 12)}\t${e.parent_revision ?? '-'}`).join('\n') : '(no revisions)');
        return 0;
      }
      case 'backup': {
        if (!flags['to']) return fail(2, 'usage: hq kernel backup --to <path> [--db-path PATH]');
        const out = kernelBackup({ dbPath: flags['db-path'] || flags.dbpath, destPath: flags['to'] });
        emit(flags, { schema: 'hq.kernel.backup/1', ...out }, `kernel backup written: ${out.destPath} (digest ${out.digest})`);
        return 0;
      }
      case 'restore': {
        if (!positional[0]) return fail(2, 'usage: hq kernel restore <src-path> [--to <path>] [--expect-digest <hex>] [--db-path PATH]');
        const out = kernelRestore({ srcPath: positional[0], destPath: flags['to'] || flags.to, expectDigest: flags['expect-digest'] });
        emit(flags, { schema: 'hq.kernel.restore/1', ...out }, `kernel restore ok: ${out.chain_length} revisions, digest ${out.digest}`);
        return 0;
      }
      case 'lock': {
        const out = acquireKernelLock({ dbPath: flags['db-path'] || flags.dbpath, force: flags.force === true });
        emit(flags, { schema: 'hq.kernel.lock/1', ...out },
          out.stale ? `kernel lock reclaimed from stale pid; owner pid=${out.ownerPid}` : `kernel lock held by pid=${out.ownerPid}`);
        return 0;
      }
      case 'unlock': {
        const out = releaseKernelLock({ dbPath: flags['db-path'] || flags.dbpath });
        emit(flags, { schema: 'hq.kernel.unlock/1', ...out }, 'kernel lock released');
        return 0;
      }
      default:
        return fail(2, `unknown kernel command "${command}". usage: hq kernel init|verify|read|history|backup|restore|lock|unlock [--db-path PATH]`);
    }
  } catch (err) {
    if (err && err.code) return fail(1, `${err.code}: ${err.message}`);
    return fail(1, err.message);
  }
}
