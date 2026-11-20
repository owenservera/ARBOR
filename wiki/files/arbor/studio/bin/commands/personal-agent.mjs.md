# File: studio/bin/commands/personal-agent.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/bin/commands/personal-agent.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 8558 B |
| Lines | 149 |
| Hash | 01b5dcc1009c |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| emit | function | 10 | no | const emit = (ctx, data) =&gt; ctx.out.emit(data, out =&gt; out.line(JSON.stringify(data, null, 2))); |
| service | function | 11 | no | const service = ctx =&gt; createPersonalAgentService({ paths: ctx.paths }); |
| noArgs | function | 12 | no | const noArgs = ctx =&gt; { if (ctx.args.length) throw usageError(&#39;Unexpected positional argument&#39;); }; |
| runPersonalAgentStatus | function | 14 | yes | export async function runPersonalAgentStatus(ctx) { |
| runPersonalAgentBootstrap | function | 18 | yes | export async function runPersonalAgentBootstrap(ctx) { |
| agent | const | 20 | no | const agent = service(ctx); |
| current | const | 21 | no | const current = agent.status(); |
| runPersonalAgentCapabilities | function | 26 | yes | export async function runPersonalAgentCapabilities(ctx) { |
| agent | const | 67 | no | const agent = service(ctx), current = agent.status(); |
| agent | const | 83 | no | const agent = service(ctx), current = agent.status(); |
| agent | const | 102 | no | const agent = service(ctx), current = agent.status(); |
| file | const | 121 | no | const file = path.resolve(ctx.args[0]); |
| meta | variable | 122 | no | let meta; |
| bundle | variable | 128 | no | let bundle; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ../lib/registry.mjs | import | 2 | [studio/bin/lib/registry.mjs](../lib/registry.mjs.md) |
| ../../src/agents/personal-agent-service.mjs | import | 3 | [studio/src/agents/personal-agent-service.mjs](../../src/agents/personal-agent-service.mjs.md) |
| ../lib/ui.mjs | import | 4 | [studio/bin/lib/ui.mjs](../lib/ui.mjs.md) |
| node:crypto | import | 5 | external |
| node:fs | import | 6 | external |
| node:path | import | 7 | external |
| ../../src/agents/personal-agent-continuity.mjs | import | 8 | [studio/src/agents/personal-agent-continuity.mjs](../../src/agents/personal-agent-continuity.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/bin/studio.mjs](../studio.mjs.md) | ./commands/personal-agent.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Personal Agent local bootstrap commands: no running Studio or browser required.
import { define, defineGroup } from '../lib/registry.mjs';
import { createPersonalAgentService } from '../../src/agents/personal-agent-service.mjs';
import { usageError } from '../lib/ui.mjs';
import { randomUUID } from 'node:crypto';
import { lstatSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { inspectPortableSnapshot, MAX_AGENT_EXPORT_DOCUMENT_BYTES } from '../../src/agents/personal-agent-continuity.mjs';

const emit = (ctx, data) => ctx.out.emit(data, out => out.line(JSON.stringify(data, null, 2)));
const service = ctx => createPersonalAgentService({ paths: ctx.paths });
const noArgs = ctx => { if (ctx.args.length) throw usageError('Unexpected positional argument'); };

export async function runPersonalAgentStatus(ctx) {
  noArgs(ctx);
  emit(ctx, service(ctx).status());
}
export async function runPersonalAgentBootstrap(ctx) {
  noArgs(ctx);
  const agent = service(ctx);
  const current = agent.status();
  // Optimistic CAS precondition captured immediately before bootstrapping. It must not
  // silently merge a concurrent change: VersionedStore rejects stale revisions.
  emit(ctx, agent.bootstrap({ expectedVersion: current.initialized ? current.version : null }));
}
export async function runPersonalAgentCapabilities(ctx) {
  noArgs(ctx);
  emit(ctx, service(ctx).capabilities());
}
defineGroup('personal-agent', { section: 'System', default: 'status',
  summary: 'Local Personal Agent lifecycle, bootstrap and capability discovery',
  description: 'One local, resumable four-stage scaffold. No new daemon, provider send or browser session. Data stays in the configured Studio directory.' });
define({ name: 'personal-agent status', section: 'System',
  summary: 'Read bootstrap progress, memory counts and next stage (no initialization)',
  examples: ['studio personal-agent status --json'], run: runPersonalAgentStatus });
define({ name: 'personal-agent bootstrap', section: 'System',
  summary: 'Initialize/resume four evidence-backed local bootstrap stages (no provider effects)',
  examples: ['studio personal-agent bootstrap --json'], run: runPersonalAgentBootstrap });
define({ name: 'personal-agent capabilities', section: 'System',
  summary: 'Inspect discovered local skills, not installed or live-tested tools',
  examples: ['studio personal-agent capabilities --json'], run: runPersonalAgentCapabilities });

define({ name: 'personal-agent self', section: 'System', usage: '[identity|bootstrap|memory|work|world|capabilities|privacy|all]',
  summary: 'Read source-qualified local self-knowledge with freshness and provenance',
  examples: ['studio personal-agent self all --json', 'studio personal-agent self capabilities --json'],
  run(ctx) {
    if (ctx.args.length > 1) throw usageError('Usage: studio personal-agent self [topic]');
    emit(ctx, service(ctx).selfKnowledge(ctx.args[0] ?? 'all'));
  },
});
define({ name: 'personal-agent work', section: 'System',
  summary: 'List private user-directed local Work, with no tool/provider dispatch',
  examples: ['studio personal-agent work --json'],
  run(ctx) { noArgs(ctx); emit(ctx, service(ctx).workList()); },
});
define({ name: 'personal-agent queue', section: 'System',
  summary: 'Create a local Work item with a stable idempotency key; does not execute it',
  flags: {
    title: { type: 'string', valueName: 'TEXT', desc: 'Work title' },
    objective: { type: 'string', valueName: 'TEXT', desc: 'Work objective' },
    key: { type: 'string', valueName: 'KEY', desc: 'Optional stable idempotency key for safe retries' },
  },
  examples: ['studio personal-agent queue --title "Review sources" --objective "Inventory sources only" --json'],
  run(ctx) {
    noArgs(ctx);
    if (!ctx.flags.title || !ctx.flags.objective) throw usageError('Both --title and --objective are required');
    const agent = service(ctx), current = agent.status();
    if (!current.initialized) throw usageError('Bootstrap the Personal Agent first');
    emit(ctx, agent.createWorkItem({ expectedVersion: current.version,
      title: ctx.flags.title, objective: ctx.flags.objective, idempotencyKey: ctx.flags.key ?? randomUUID() }));
  },
});
define({ name: 'personal-agent advance', section: 'System', usage: '<work-id>',
  summary: 'Explicitly transition a local Work item; does not send to a provider',
  flags: {
    to: { type: 'string', choices: ['active', 'blocked', 'completed', 'cancelled'], valueName: 'STATE', desc: 'New state' },
    note: { type: 'string', valueName: 'TEXT', desc: 'Reason (required for blocked)' },
    evidence: { type: 'list', valueName: 'REF,...', desc: 'User-attested evidence references (required for completed)' },
  },
  examples: ['studio personal-agent advance work-0123456789abcdef0123456789abcdef --to blocked --note "Need owner identity" --json'],
```

_First 80 of 150 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
