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
