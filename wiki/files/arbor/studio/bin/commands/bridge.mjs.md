# File: studio/bin/commands/bridge.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/bin/commands/bridge.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 2472 B |
| Lines | 37 |
| Hash | b64a8bc8c577 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| emit | function | 7 | no | const emit = (ctx, data) =&gt; ctx.out.emit(data, out =&gt; out.line(JSON.stringify(data, null, 2))); |
| store | function | 8 | no | const store = ctx =&gt; createBridgeStore({ root: ctx.paths.root }); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ../lib/registry.mjs | import | 3 | [studio/bin/lib/registry.mjs](../lib/registry.mjs.md) |
| ../lib/ui.mjs | import | 4 | [studio/bin/lib/ui.mjs](../lib/ui.mjs.md) |
| ../../src/studio/bridge-commands.mjs | import | 5 | [studio/src/studio/bridge-commands.mjs](../../src/studio/bridge-commands.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/bin/studio.mjs](../studio.mjs.md) | ./commands/bridge.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Bootstrap bridge consumer commands: read and answer phone-queued commands directly from the
// Studio data folder (no running Studio needed). Used by Grok Bot today; the harness later.
import { define, defineGroup } from '../lib/registry.mjs';
import { usageError } from '../lib/ui.mjs';
import { createBridgeStore } from '../../src/studio/bridge-commands.mjs';

const emit = (ctx, data) => ctx.out.emit(data, out => out.line(JSON.stringify(data, null, 2)));
const store = ctx => createBridgeStore({ root: ctx.paths.root });

defineGroup('bridge', { section: 'System', default: 'list',
  summary: 'Bootstrap bridge: phone-queued commands for Grok Bot / harness',
  description: 'Commands typed in /mobile Bootstrap are stored under <data>/bridge. A consumer lists, claims and replies; nothing is executed here.' });
define({ name: 'bridge list', section: 'System', usage: '[queued|claimed|done|failed]',
  summary: 'List bridge commands (newest first), optionally by status',
  flags: { consumer: { type: 'string', choices: ['grokbot', 'harness', 'bootstrap'], valueName: 'WHO', desc: 'Filter by consumer' } },
  examples: ['studio bridge list queued --json'],
  run(ctx) {
    if (ctx.args.length > 1) throw usageError('Usage: studio bridge list [status]');
    emit(ctx, store(ctx).list({ status: ctx.args[0], consumer: ctx.flags.consumer }));
  } });
define({ name: 'bridge claim', section: 'System', usage: '[id]',
  summary: 'Claim one queued command (oldest when no id)',
  flags: { by: { type: 'string', choices: ['grokbot', 'harness', 'bootstrap'], valueName: 'WHO', desc: 'Consumer name (default grokbot)' } },
  examples: ['studio bridge claim --json'],
  run(ctx) {
    if (ctx.args.length > 1) throw usageError('Usage: studio bridge claim [id]');
    emit(ctx, store(ctx).claim(ctx.args[0], { by: ctx.flags.by ?? 'grokbot' }) ?? { claimed: null });
  } });
define({ name: 'bridge reply', section: 'System', usage: '<id> <text...>',
  summary: 'Post the result for a command and mark it done (or --failed)',
  flags: { failed: { type: 'boolean', desc: 'Mark failed instead of done' } },
  examples: ['studio bridge reply cmd-0123456789abcdef "Stage identity completed"'],
  run(ctx) {
    const [id, ...rest] = ctx.args;
    if (!id || !rest.length) throw usageError('Usage: studio bridge reply <id> <text>');
    emit(ctx, store(ctx).reply(id, rest.join(' '), { status: ctx.flags.failed ? 'failed' : 'done' }));
  } });
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
