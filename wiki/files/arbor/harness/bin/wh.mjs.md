# File: harness/bin/wh.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | harness/bin/wh.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 23884 B |
| Lines | 308 |
| Hash | 7c9d32cbce44 |
| Test | no |
| Generated | no |
| Component | harness |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| args | const | 15 | no | const args = process.argv.slice(2); const command = args.shift(); |
| runtime | const | 16 | no | const runtime = fileURLToPath(new URL(&#39;../../runtime/&#39;, import.meta.url)); |
| flag | function | 17 | no | const flag = name =&gt; { const i = args.indexOf(name); return i &lt; 0 ? undefined : args[i + 1]; }; |
| userDataDir | const | 21 | no | const userDataDir = flag(&#39;--profile&#39;) === &#39;lab&#39; ? LAB_PROFILE : OWNER_PROFILE; |
| launch | const | 22 | no | const launch = buildLaunchCommand({ userDataDir }); console.log([launch.command, ...launch.args].map(x =&gt; JSON.stringify(x)).join(&#39; &#39;)); |
| busy | const | 24 | no | const busy = profileBusyReasons({ userDataDir }); |
| router | const | 40 | no | const router = await createRouter(); |
| out | const | 43 | no | const out = await devCommand(args, { router, approvals: createApprovals({ dir: resolve(runtime, &#39;approvals&#39;), print: () =&gt; {} }) }); |
| list | const | 47 | no | const list = await router.models({ provider: args[0] &amp;&amp; !args[0].startsWith(&#39;--&#39;) ? args[0] : null, refresh: args.includes(&#39;--refresh&#39;) }); |
| byModel | const | 56 | no | const byModel = Object.fromEntries(models.map(m =&gt; [m.provider, m])); |
| rows | const | 57 | no | const rows = providers.map(p =&gt; { const m = byModel[p.id] \|\| {}; const modes = []; if (Array.isArray(m.efforts)) modes.push(...m.efforts.map(e =&gt; ({ kind: &#39;effort&#39;, label: e.label, current: !!e.curre… |
| m | const | 58 | no | const m = byModel[p.id] \|\| {}; |
| modes | const | 59 | no | const modes = []; |
| pad | function | 75 | no | const pad = (s, w) =&gt; String(s == null ? &#39;&#39; : s).slice(0, w).padEnd(w); |
| dir | const | 87 | no | const dir = resolve(runtime, &#39;journal&#39;); const urls = new Set(); |
| tg | const | 89 | no | const tg = resolveTarget(); const live = await (await connect({ host: tg.host, port: tg.port })).targets(); const reg = createTabRegistry({ file: resolve(runtime, &#39;tabs.json&#39;) }); |
| n | variable | 90 | no | let n = 0; for (const t of live) if (t.type === &#39;page&#39; &amp;&amp; urls.has(t.url) &amp;&amp; !(await reg.isOwned(t.id))) { await reg.record({ id: t.id, provider: null, url: t.url }); n++; } |
| t | const | 93 | no | const t = await router.tabs(); console.log(JSON.stringify({ owned: t.owned.map(x =&gt; ({ id: x.id, provider: x.provider, openedAt: x.openedAt })), prunedClosed: t.stale.length }, null, 2)); |
| out | const | 98 | no | const out = await reviewCommand({ router, approvals: createApprovals({ dir: resolve(runtime, &#39;approvals&#39;), print: () =&gt; {} }), pr: args[0], reviewer: flag(&#39;--reviewer&#39;) \|\| &#39;chatgpt:gpt-6&#39;, ownerAppro… |
| approvals | const | 102 | no | const approvals = createApprovals({ dir: resolve(runtime, &#39;approvals&#39;), print: () =&gt; {} }); |
| owner | const | 103 | no | const owner = args.includes(&#39;--owner-approved&#39;) &amp;&amp; !devAutoApprove(); // dev flag: the router already approved the request |
| r | const | 105 | no | const r = { ...router, ask: async (o) =&gt; { const q = await router.ask(o); console.error(`request ${q.requestId} ${o.provider}`); if (owner) await approvals.approve(q.requestId); return q; } }; |
| rest | const | 106 | no | const rest = args.filter(a =&gt; a !== &#39;--owner-approved&#39;); |
| journal | const | 113 | no | const journal = createJournalReader({ dir: resolve(runtime, &#39;journal&#39;) }); |
| readBack | function | 114 | no | const readBack = ({ provider, threadUrl }) =&gt; readThreadReply({ providerId: provider, threadUrl }); |
| result | const | 115 | no | const result = await roundrobinCommand(rest, { router: r, journal, readBack }); |
| fdir | const | 119 | no | const fdir = resolve(runtime, &#39;fleets&#39;); await mkdir(fdir, { recursive: true }); |
| append | function | 121 | no | const append = async (e) =&gt; appendFile(resolve(fdir, &#39;sends.jsonl&#39;), JSON.stringify(e) + &#39;\\n&#39;); |
| out | const | 126 | no | const out = await decideCommand({ pr: args[0], requestId: flag(&#39;--request&#39;), dismiss: flag(&#39;--dismiss&#39;) \|\| &#39;&#39;, merge: args.includes(&#39;--merge&#39;) }); |
| task | const | 130 | no | const task = args.filter((a, i) =&gt; !a.startsWith(&#39;--&#39;) &amp;&amp; !args[i - 1]?.match(/^--(provider\|context\|resume-thread\|resume-request)$/)).join(&#39; &#39;); |
| out | const | 131 | no | const out = await buildCommand({ router, approvals: createApprovals({ dir: resolve(runtime, &#39;approvals&#39;), print: () =&gt; {} }), task, provider: flag(&#39;--provider&#39;) \|\| &#39;chatgpt:gpt-6&#39;, context: (flag(&#39;--… |
| file | const | 135 | no | const file = flag(&#39;--prompt-file&#39;); if (!file) throw new Error(&#39;--prompt-file required&#39;); |
| request | const | 136 | no | const request = await router.ask({ provider: args[0], model: flag(&#39;--model&#39;) \|\| null, prompt: await readFile(file, &#39;utf8&#39;), threadUrl: flag(&#39;--thread&#39;) \|\| &#39;new&#39;, requestId: flag(&#39;--id&#39;) }); |
| server | const | 141 | no | const server = createServer({ router }); |
| port | const | 142 | no | const port = Number(flag(&#39;--port&#39;) \|\| 9334); |
| http | const | 145 | no | const http = await import(&#39;node:http&#39;); |
| fs | const | 146 | no | const fs = await import(&#39;node:fs/promises&#39;); |
| path | const | 147 | no | const path = await import(&#39;node:path&#39;); |
| mobileRoot | const | 148 | no | const mobileRoot = resolve(fileURLToPath(import.meta.url), &#39;../../../apps/mobile-relay&#39;); |
| mobileServer | const | 149 | no | const mobileServer = http.createServer(async (req, res) =&gt; { const url = new URL(req.url, &#39;http://127.0.0.1&#39;); const pathname = url.pathname === &#39;/&#39; ? &#39;/index.html&#39; : url.pathname; const filePath = p… |
| url | const | 150 | no | const url = new URL(req.url, &#39;http://127.0.0.1&#39;); |
| pathname | const | 151 | no | const pathname = url.pathname === &#39;/&#39; ? &#39;/index.html&#39; : url.pathname; |
| filePath | const | 152 | no | const filePath = path.resolve(mobileRoot, pathname.slice(1)); |
| body | const | 154 | no | const body = await fs.readFile(filePath); |
| ext | const | 155 | no | const ext = pathname.split(&#39;.&#39;).pop(); |
| ct | const | 156 | no | const ct = { js: &#39;application/javascript&#39;, html: &#39;text/html; charset=utf-8&#39;, css: &#39;text/css; charset=utf-8&#39;, json: &#39;application/json&#39;, png: &#39;image/png&#39;, svg: &#39;image/svg+xml&#39;, ico: &#39;image/x-icon&#39;, wof… |
| mport | const | 162 | no | const mport = Number(flag(&#39;--mobile-port&#39;) \|\| 9335); |
| repoRoot | const | 167 | no | const repoRoot = resolve(fileURLToPath(import.meta.url), &#39;../../..&#39;); |
| roadmapPath | const | 168 | no | const roadmapPath = resolve(repoRoot, &#39;docs/roadmap.json&#39;); |
| set | const | 169 | no | const set = flag(&#39;--set&#39;); |
| roadmap | const | 170 | no | const roadmap = JSON.parse(await readFile(roadmapPath, &#39;utf8&#39;)); |
| item | const | 174 | no | const item = roadmap.items.find(x =&gt; x.id === id); |
| taskRef | const | 190 | no | const taskRef = flag(&#39;--task-ref&#39;); |
| parseJson | function | 192 | no | const parseJson = (name) =&gt; { const v = flag(name); if (!v) return undefined; try { return JSON.parse(v); } catch { throw Object.assign(new Error(`Invalid JSON for ${name}`), { code: &#39;USAGE&#39; }); } }; |
| dataRoot | const | 193 | no | const dataRoot = defaultDataDir(); |
| agent | const | 194 | no | const agent = createPersonalAgentService({ paths: { root: dataRoot }, getTools: () =&gt; [] }); |
| bundle | const | 198 | no | const bundle = await agent.contextBundle({ taskRef, taskText: flag(&#39;--task-text&#39;) \|\| &#39;&#39;, purpose: flag(&#39;--purpose&#39;) \|\| &#39;personal_continuum&#39;, profile: flag(&#39;--profile&#39;) \|\| &#39;continuum&#39;, |
| router | const | 219 | no | const router = await createRouter(); |
| deps | const | 221 | no | const deps = await dependencies(); |
| journal | const | 222 | no | const journal = await deps.createJournal({ dir: resolve(runtime, &#39;journal&#39;) }); |
| records | const | 223 | no | const records = await journal.list(); |
| openStates | const | 224 | no | const openStates = new Set([&#39;accepted&#39;,&#39;sent&#39;,&#39;streaming&#39;,&#39;dispatching&#39;,&#39;reserved&#39;,&#39;ready&#39;]); |
| open | const | 225 | no | const open = records.filter(r =&gt; openStates.has(r.state)); |
| resolveId | const | 236 | no | const resolveId = flag(&#39;--resolve&#39;); |
| rec | const | 238 | no | const rec = await journal.read(resolveId); |
| url | const | 248 | no | const url = flag(&#39;--url&#39;); |
| out | const | 249 | no | const out = flag(&#39;--out&#39;); |
| expectSha | const | 250 | no | const expectSha = flag(&#39;--sha256&#39;); |
| deps | const | 254 | no | const deps = await dependencies(); |
| journal | const | 255 | no | const journal = await deps.createJournal({ dir: resolve(runtime, &#39;journal&#39;) }); |
| requestId | const | 256 | no | const requestId = &#39;dl-&#39; + createHash(&#39;sha256&#39;).update(url + Date.now()).digest(&#39;hex&#39;).slice(0, 16); |
| body | variable | 257 | no | let body; |
| actualSha | const | 260 | no | const actualSha = createHash(&#39;sha256&#39;).update(body).digest(&#39;hex&#39;); |
| outPath | const | 264 | no | const outPath = resolve(out); |
| standingCommand | function | 279 | no | async function standingCommand(args) { |
| standing | const | 280 | no | const standing = createStanding({ dir: resolve(runtime, &#39;approvals&#39;) }); const sub = args[0]; |
| opt | function | 281 | no | const opt = name =&gt; { const i = args.indexOf(name); return i &lt; 0 ? undefined : args[i + 1]; }; |
| provider | const | 284 | no | const provider = opt(&#39;--provider&#39;) === &#39;all&#39; ? &#39;*&#39; : opt(&#39;--provider&#39;); |
| hoursArg | const | 285 | no | const hoursArg = opt(&#39;--hours&#39;); const maxArg = opt(&#39;--max-sends&#39;); |
| hours | const | 286 | no | const hours = hoursArg === &#39;unlimited&#39; ? null : Number(hoursArg); |
| maxSends | const | 287 | no | const maxSends = maxArg === &#39;unlimited&#39; ? null : Number(maxArg); |
| threads | const | 288 | no | const threads = args.flatMap((a, i) =&gt; a === &#39;--thread&#39; &amp;&amp; args[i + 1] ? [args[i + 1]] : []); |
| devAuto | const | 290 | no | const devAuto = devAutoApprove(); |
| answer | variable | 300 | no | let answer; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs/promises | import | 2 | external |
| node:path | import | 3 | external |
| node:url | import | 4 | external |
| node:readline/promises | import | 5 | external |
| node:child_process | import | 6 | external |
| node:crypto | import | 7 | external |
| ../src/interface/router.mjs | import | 8 | [harness/src/interface/router.mjs](../src/interface/router.mjs.md) |
| ../src/interface/approval.mjs | import | 9 | [harness/src/interface/approval.mjs](../src/interface/approval.mjs.md) |
| ../src/interface/launch.mjs | import | 10 | [harness/src/interface/launch.mjs](../src/interface/launch.mjs.md) |
| ../src/interface/server.mjs | import | 11 | [harness/src/interface/server.mjs](../src/interface/server.mjs.md) |
| ../src/interface/standing.mjs | import | 12 | [harness/src/interface/standing.mjs](../src/interface/standing.mjs.md) |
| ../src/interface/dev-auto-approve.mjs | import | 13 | [harness/src/interface/dev-auto-approve.mjs](../src/interface/dev-auto-approve.mjs.md) |
| ../src/dev/cli.mjs | dynamic | 31 | [harness/src/dev/cli.mjs](../src/dev/cli.mjs.md) |
| ../src/dev/cli.mjs | dynamic | 34 | [harness/src/dev/cli.mjs](../src/dev/cli.mjs.md) |
| ../src/dev/cli.mjs | dynamic | 42 | [harness/src/dev/cli.mjs](../src/dev/cli.mjs.md) |
| ../src/core/cdp.mjs | dynamic | 86 | [harness/src/core/cdp.mjs](../src/core/cdp.mjs.md) |
| ../src/core/tabs.mjs | dynamic | 86 | [harness/src/core/tabs.mjs](../src/core/tabs.mjs.md) |
| ../src/interface/target.mjs | dynamic | 86 | [harness/src/interface/target.mjs](../src/interface/target.mjs.md) |
| node:fs/promises | dynamic | 86 | external |
| ../src/build/review-cli.mjs | dynamic | 97 | external |
| ../src/agents/cli.mjs | dynamic | 101 | [harness/src/agents/cli.mjs](../src/agents/cli.mjs.md) |
| ../src/agents/roundrobin.mjs | dynamic | 111 | [harness/src/agents/roundrobin.mjs](../src/agents/roundrobin.mjs.md) |
| ../src/build/cli.mjs | dynamic | 112 | external |
| node:fs/promises | dynamic | 118 | external |
| ../src/build/review-cli.mjs | dynamic | 125 | external |
| ../src/build/cli.mjs | dynamic | 129 | external |
| node:http | dynamic | 145 | external |
| node:fs/promises | dynamic | 146 | external |
| node:path | dynamic | 147 | external |
| ../../studio/src/config.mjs | dynamic | 188 | [studio/src/config.mjs](../../studio/src/config.mjs.md) |
| ../../studio/src/agents/personal-agent-service.mjs | dynamic | 189 | [studio/src/agents/personal-agent-service.mjs](../../studio/src/agents/personal-agent-service.mjs.md) |
| ../src/interface/deps.mjs | dynamic | 220 | [harness/src/interface/deps.mjs](../src/interface/deps.mjs.md) |
| ../src/interface/deps.mjs | dynamic | 253 | [harness/src/interface/deps.mjs](../src/interface/deps.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline/promises';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createRouter } from '../src/interface/router.mjs';
import { createApprovals } from '../src/interface/approval.mjs';
import { buildLaunchCommand, OWNER_PROFILE, LAB_PROFILE, profileBusyReasons } from '../src/interface/launch.mjs';
import { createServer } from '../src/interface/server.mjs';
import { createStanding } from '../src/interface/standing.mjs';
import { devAutoApprove, confirmAndApprove } from '../src/interface/dev-auto-approve.mjs';

const args = process.argv.slice(2); const command = args.shift();
const runtime = fileURLToPath(new URL('../../runtime/', import.meta.url));
const flag = name => { const i = args.indexOf(name); return i < 0 ? undefined : args[i + 1]; };
try {
  if (command === 'launch') {
    // Default = VIVIM's signed-in profile (<data dir>\chrome-profile); `--profile lab` uses runtime/chrome-profile.
    const userDataDir = flag('--profile') === 'lab' ? LAB_PROFILE : OWNER_PROFILE;
    const launch = buildLaunchCommand({ userDataDir }); console.log([launch.command, ...launch.args].map(x => JSON.stringify(x)).join(' '));
    if (args.includes('--run')) {
      const busy = profileBusyReasons({ userDataDir });
      if (busy.length) throw new Error(`Refusing to launch: ${busy.join('; ')}`);
      spawn(launch.command, launch.args, { detached: true, stdio: 'ignore' }).unref(); console.log('launched');
    }
  } else if (command === 'standing') {
    await standingCommand(args);
  } else if (command === 'workspace') {
    const { workspaceCommand } = await import('../src/dev/cli.mjs');
    await workspaceCommand(args);
  } else if (command === 'dev' && args.includes('--status')) {
    const { devCommand } = await import('../src/dev/cli.mjs');
    await devCommand(args);
  } else if (command === 'approve') {
    // Interactive terminal + typed requestId, unless VIVIM_DEV_AUTO_APPROVE=1 (development): then no prompt.
    await confirmAndApprove({ approvals: createApprovals({ dir: resolve(runtime, 'approvals') }), requestId: args[0], prompt: async q => { const rl = createInterface({ input: process.stdin, output: process.stdout }); try { return await rl.question(q); } finally { rl.close(); } } });
  } else {
    const router = await createRouter();
    if (command === 'dev') {
      const { devCommand } = await import('../src/dev/cli.mjs');
      const out = await devCommand(args, { router, approvals: createApprovals({ dir: resolve(runtime, 'approvals'), print: () => {} }) });
      process.exitCode = out.status === 'complete' ? 0 : 1;
    } else if (command === 'providers') console.log(JSON.stringify(await router.providers(), null, 2));
    else if (command === 'models') {
      const list = await router.models({ provider: args[0] && !args[0].startsWith('--') ? args[0] : null, refresh: args.includes('--refresh') });
      if (args.includes('--json')) console.log(JSON.stringify(list, null, 2));
      else for (const p of list) console.log(`${p.provider}: ${p.models.length ? p.models.map(m => (m.current ? '*' : '') + `${p.provider}:${m.id}`).join('  ') : '(not discovered' + (p.supportsSelection ? '; run wh models --refresh)' : '; no picker config)')}`);
      if (args.includes('--refresh')) process.exit(process.exitCode ?? 0);
    } else if (command === 'caps') {
      // Q09: per-web-app capability matrix. Reads provider profiles and the
      // discovered-model registry only; no browser is opened and no provider
      // is contacted unless --refresh is passed (which still only reads pickers).
      const [providers, models] = await Promise.all([router.providers(), router.models()]);
      const byModel = Object.fromEntries(models.map(m => [m.provider, m]));
      const rows = providers.map(p => {
        const m = byModel[p.id] || {};
        const modes = [];
        if (Array.isArray(m.efforts)) modes.push(...m.efforts.map(e => ({ kind: 'effort', label: e.label, current: !!e.current })));
        if (m.slider) modes.push({ kind: 'slider', label: m.slider.label, current: m.slider.index, count: m.slider.count, locked: !!m.slider.locked });
        return {
          provider: p.id, label: p.label, status: p.status, url: p.url,
          strengths: Array.isArray(p.strengths) ? p.strengths : [],
          modes,
          sendStrategy: p.send?.strategy, supportsSelection: !!p.models,
          triggerSelector: p.models?.triggerSelector ?? null,
          currentModel: m.current ?? null, currentLabel: m.currentLabel ?? null,
          discoveredModels: Array.isArray(m.models) ? m.models.length : 0,
          discoveredAt: m.discoveredAt ?? null, hosts: p.hosts.join(','),
        };
      });
      if (args.includes('--json')) console.log(JSON.stringify({ providers: rows }, null, 2));
      else {
        const pad = (s, w) => String(s == null ? '' : s).slice(0, w).padEnd(w);
        console.log(pad('PROVIDER', 14) + pad('LABEL', 16) + pad('STATUS', 14) + pad('SEND', 9) + pad('MODELS', 8) + 'HOSTS');
        for (const r of rows) console.log(pad(r.provider, 14) + pad(r.label, 16) + pad(r.status, 14) + pad(r.sendStrategy, 9) + pad(r.discoveredModels, 8) + r.hosts);
      }
      process.exitCode = 0;
    } else if (command === 'route') console.log(JSON.stringify(await router.decide({ task: args.filter(a => !a.startsWith('--')).join(' ') }), null, 2));
```

_First 80 of 309 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
