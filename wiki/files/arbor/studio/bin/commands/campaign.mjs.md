# File: studio/bin/commands/campaign.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/bin/commands/campaign.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 7747 B |
| Lines | 123 |
| Hash | a7236a924560 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| seconds | function | 8 | no | const seconds = (ms) =&gt; (Number.isFinite(Number(ms)) ? `${(Number(ms) / 1000).toFixed(0)}s` : &#39;-&#39;); |
| prompt | const | 31 | no | const prompt = String(flags.prompt ?? defaultPrompt); |
| limit | const | 34 | no | const limit = flags.limit === undefined ? null : Number(flags.limit); |
| cooldown | const | 37 | no | const cooldown = flags.cooldown === undefined ? undefined : Number(flags.cooldown); |
| timeout | const | 40 | no | const timeout = flags.timeout === undefined ? 120 : Number(flags.timeout); |
| sites | const | 44 | no | const sites = ctx.args.length ? ctx.args : [...siteOrder]; |
| execute | const | 45 | no | const execute = flags.execute === true; |
| result | const | 47 | no | const result = await runCampaign({ sites, prompt, port: ctx.port, dataDir: ctx.paths.root, execute, cooldownMs: cooldown === undefined ? undefined : Math.round(cooldown * 1000), perSiteTimeoutMs: Mat… |
| totals | const | 68 | no | const totals = result.totals; |
| rows | const | 69 | no | const rows = result.sites.map((s) =&gt; ({ id: s.id, status: s.status, session: s.sessionId ?? &#39;-&#39;, family: s.family ?? &#39;-&#39;, |
| missing | const | 98 | no | const missing = result.sites.filter((s) =&gt; s.status === &#39;blocked&#39; &amp;&amp; /no adapter\|unknown site/i.test(String(s.reason))); |
| unverified | const | 111 | no | const unverified = result.sites.filter((s) =&gt; s.status === &#39;unverified&#39;); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ../../src/config.mjs | import | 3 | [studio/src/config.mjs](../../src/config.mjs.md) |
| ../lib/registry.mjs | import | 4 | [studio/bin/lib/registry.mjs](../lib/registry.mjs.md) |
| ../lib/ui.mjs | import | 5 | [studio/bin/lib/ui.mjs](../lib/ui.mjs.md) |
| ../../src/capture/campaign.mjs | import | 6 | [studio/src/capture/campaign.mjs](../../src/capture/campaign.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/bin/studio.mjs](../studio.mjs.md) | ./commands/campaign.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// campaign: walk the known AI chat sites in order — plan-only by default, or capture, derive and
// consolidate the site family with --execute.
import { EXIT } from '../../src/config.mjs';
import { define } from '../lib/registry.mjs';
import { usageError, oneLine, truncate, fmtMs } from '../lib/ui.mjs';
import { runCampaign, siteOrder, defaultPrompt } from '../../src/capture/campaign.mjs';

const seconds = (ms) => (Number.isFinite(Number(ms)) ? `${(Number(ms) / 1000).toFixed(0)}s` : '-');

define({
  name: 'campaign', section: 'Knowledge',
  usage: '[ids...] [--execute] [--prompt TEXT] [--limit N] [--cooldown S] [--timeout S] [--json] [--resume|--no-resume]',
  summary: 'Walk every AI chat site in order and capture, derive and build its family',
  description: 'Sequential, one site at a time, reusing the existing engine: driveSite for the live interaction, derive for the knowledge, src/families/build.mjs for the family. PLAN-ONLY by default (adapters and target URLs are resolved, nothing is opened or sent); pass --execute to interact with the real sites. A blocked site (login wall, missing adapter) is recorded and the campaign continues. Completed sites are remembered in <data-dir>/campaign-state.json and skipped on a re-run unless --no-resume.',
  flags: {
    execute: { type: 'boolean', desc: 'Actually interact with the sites (default: plan only, no interaction)' },
    prompt: { type: 'string', valueName: 'TEXT', desc: 'Prompt to send (default: a fixed 12-word fidelity check)' },
    limit: { type: 'number', valueName: 'N', desc: 'Process at most N sites in this run' },
    cooldown: { type: 'number', valueName: 'SECONDS', desc: 'Pause between two sites (default: 45-90s randomised)' },
    timeout: { type: 'number', valueName: 'SECONDS', default: 120, desc: 'Per-site wait for the reply' },
    resume: { type: 'boolean', desc: 'Skip sites already completed in an earlier run (use --no-resume to redo them)' },
  },
  examples: [
    'studio campaign',
    'studio campaign --limit 2 --json',
    'studio campaign chatgpt claude --execute --timeout 90',
    'studio campaign --execute --no-resume --cooldown 75',
  ],
  async run(ctx) {
    const { out, flags } = ctx;
    const prompt = String(flags.prompt ?? defaultPrompt);
    if (!prompt.trim()) throw usageError('--prompt must not be empty.', 'Omit the flag to use the fixed 12-word check.');

    const limit = flags.limit === undefined ? null : Number(flags.limit);
    if (limit !== null && (!Number.isFinite(limit) || limit < 1)) throw usageError('--limit must be a whole number of sites (1 or more).', 'Example: studio campaign --limit 3');

    const cooldown = flags.cooldown === undefined ? undefined : Number(flags.cooldown);
    if (cooldown !== undefined && (!Number.isFinite(cooldown) || cooldown < 0)) throw usageError('--cooldown must be a number of seconds (0 disables the pause).', 'Example: studio campaign --cooldown 60');

    const timeout = flags.timeout === undefined ? 120 : Number(flags.timeout);
    if (!Number.isFinite(timeout) || timeout < 5) throw usageError('--timeout must be at least 5 seconds.', 'Example: studio campaign --timeout 120');

    // Ids are optional; without any, every known site runs in campaign order.
    const sites = ctx.args.length ? ctx.args : [...siteOrder];
    const execute = flags.execute === true;

    const result = await runCampaign({
      sites, prompt, port: ctx.port, dataDir: ctx.paths.root,
      execute,
      cooldownMs: cooldown === undefined ? undefined : Math.round(cooldown * 1000),
      perSiteTimeoutMs: Math.round(timeout * 1000),
      limit: limit ?? undefined,
      resume: flags.resume !== false,
      onEvent: (ev) => {
        if (ev.type === 'site.plan') out.info(`plan ${ev.site}: ${ev.targetUrl ?? '(no url)'}`);
        else if (ev.type === 'site.start') out.info(`driving ${ev.site}: ${ev.targetUrl ?? ''}`);
        else if (ev.type === 'drive' && ev.event?.type === 'target') out.info(`  ${ev.site}: tab ${String(ev.event.id).slice(0, 8)} (${ev.event.reused ? 'existing' : 'new'})`);
        else if (ev.type === 'drive' && ev.event?.type === 'sent') out.info(`  ${ev.site}: sent via ${ev.event.method}`);
        else if (ev.type === 'drive' && ev.event?.type === 'completion') out.info(`  ${ev.site}: reply ${ev.event.done ? 'settled' : 'timed out'} after ${fmtMs(ev.event.ms)}`);
        else if (ev.type === 'site.blocked') out.info(`${ev.site}: blocked — ${ev.reason ?? ''}`);
        else if (ev.type === 'site.failed') out.info(`${ev.site}: failed — ${ev.reason ?? ''}`);
        else if (ev.type === 'site.unverified') out.info(`${ev.site}: unverified — ${ev.reason ?? ''}`);
        else if (ev.type === 'site.ok') out.info(`${ev.site}: ok, session ${ev.sessionId ?? '(none)'}${ev.family ? `, family ${ev.family}` : ''}`);
        else if (ev.type === 'campaign.cooldown') out.info(`cooling down ${seconds(ev.ms)} before the next site`);
      },
    });

    const totals = result.totals;
    const rows = result.sites.map((s) => ({
      id: s.id,
      status: s.status,
      session: s.sessionId ?? '-',
      family: s.family ?? '-',
      reply: truncate(oneLine(s.reply), 100) || '-',
      elapsed: fmtMs(s.ms),
      reason: truncate(oneLine(s.reason), 90),
    }));

    out.emit(result, (o) => {
      if (!execute) o.result('plan only — no interaction performed (pass --execute to interact)');
```

_First 80 of 124 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
