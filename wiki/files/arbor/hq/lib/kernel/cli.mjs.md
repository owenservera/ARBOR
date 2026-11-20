# File: hq/lib/kernel/cli.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/lib/kernel/cli.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 5341 B |
| Lines | 113 |
| Hash | 9fc7d93aacdc |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| BOOL | const | 13 | no | const BOOL = new Set([&#39;json&#39;, &#39;force&#39;, &#39;yes&#39;, &#39;quiet&#39;]); |
| parse | function | 15 | no | function parse(argv) { |
| positional | const | 16 | no | const positional = []; |
| flags | const | 17 | no | const flags = {}; |
| arg | const | 19 | no | const arg = argv[i]; |
| eq | const | 22 | no | const eq = arg.indexOf(&#39;=&#39;); |
| key | const | 25 | no | const key = arg.slice(2); |
| defaultEmit | function | 35 | no | function defaultEmit(flags, value, text) { |
| out | const | 36 | no | const out = text.endsWith(&#39;\\n&#39;) ? text : text + &#39;\\n&#39;; |
| defaultFail | function | 41 | no | function defaultFail(code, message) { |
| runKernelCli | function | 46 | yes | export async function runKernelCli(argv, ctx = {}) { |
| emit | const | 47 | no | const emit = ctx.emit \|\| defaultEmit; |
| fail | const | 48 | no | const fail = ctx.fail \|\| defaultFail; |
| command | const | 50 | no | const command = positional.shift(); |
| out | const | 55 | no | const out = initKernel({ dbPath: flags[&#39;db-path&#39;] \|\| flags.dbpath }); |
| out | const | 61 | no | const out = kernelVerify({ dbPath: flags[&#39;db-path&#39;] \|\| flags.dbpath }); |
| out | const | 70 | no | const out = kernelRead(domain, targetId, { revision: flags.revision \|\| &#39;current&#39;, dbPath: flags[&#39;db-path&#39;] \|\| flags.dbpath }); |
| out | const | 78 | no | const out = kernelHistory(domain, targetId, { limit: flags.limit ? Number(flags.limit) : 50, dbPath: flags[&#39;db-path&#39;] \|\| flags.dbpath }); |
| out | const | 85 | no | const out = kernelBackup({ dbPath: flags[&#39;db-path&#39;] \|\| flags.dbpath, destPath: flags[&#39;to&#39;] }); |
| out | const | 91 | no | const out = kernelRestore({ srcPath: positional[0], destPath: flags[&#39;to&#39;] \|\| flags.to, expectDigest: flags[&#39;expect-digest&#39;] }); |
| out | const | 96 | no | const out = acquireKernelLock({ dbPath: flags[&#39;db-path&#39;] \|\| flags.dbpath, force: flags.force === true }); |
| out | const | 102 | no | const out = releaseKernelLock({ dbPath: flags[&#39;db-path&#39;] \|\| flags.dbpath }); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./store.mjs | import | 8 | [hq/lib/kernel/store.mjs](./store.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [hq/bin/hq.mjs](../../bin/hq.mjs.md) | ../lib/kernel/cli.mjs |

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 2 | context | — | — | kernel CLI verbs (init, verify, read, history, lock, unlock) for L0 to wire into hq/bin/hq.mjs |
| 3 | owner | hq-agent | — | hq-agent (L1) |
| 4 | task | — | — | L1 |

## Excerpt

```javascript
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
```

_First 80 of 114 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
