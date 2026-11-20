# File: apps/vivim-host/grokbot/linux-preflight.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/grokbot/linux-preflight.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 1692 B |
| Lines | 24 |
| Hash | 2a1570b31f76 |
| Test | no |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| probe | function | 7 | no | const probe = (cmd,args) =&gt; { |
| root | const | 12 | no | const root=process.env.VIVIM_HOST_DATA_DIR \|\| path.join(process.env.XDG_DATA_HOME \|\| path.join(os.homedir(),&#39;.local/share&#39;),&#39;vivim&#39;); |
| writable | variable | 13 | no | let writable=false,exists=false; |
| report | const | 15 | no | const report={schema:&#39;vivim.linux-grokbot-preflight/1&#39;,observedAt:new Date().toISOString(), |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:os | import | 3 | external |
| node:child_process | import | 4 | external |
| node:fs | import | 5 | external |
| node:path | import | 6 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
#!/usr/bin/env node
// Read-only Linux eligibility probe. No agent starts, Tailscale mutations or browser effects.
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { accessSync, constants, statSync } from 'node:fs';
import path from 'node:path';
const probe = (cmd,args) => {
  try {const r=spawnSync(cmd,args,{encoding:'utf8',timeout:5000,maxBuffer:65536,shell:false});
    return {available:!r.error && r.status===0,exitCode:r.status,detail:r.error?.code || null};
  }catch(e){return {available:false,detail:e.code||e.name};}
};
const root=process.env.VIVIM_HOST_DATA_DIR || path.join(process.env.XDG_DATA_HOME || path.join(os.homedir(),'.local/share'),'vivim');
let writable=false,exists=false;
try{const s=statSync(root);exists=s.isDirectory();accessSync(root,constants.W_OK);writable=exists;}catch{}
const report={schema:'vivim.linux-grokbot-preflight/1',observedAt:new Date().toISOString(),
  platform:process.platform,arch:process.arch,node:process.version,hostData:{configured:!!process.env.VIVIM_HOST_DATA_DIR,exists,writable},
  tailscale:probe('tailscale',['status','--json']),tailscaleServe:probe('tailscale',['serve','status','--json']),
  grokbotNative:{available:false,reason:'No verified native Grokbot CLI/IPC contract has been discovered. Telemetry daemon is not a task dispatcher.'},
  ready:false,blockers:[]};
if(process.platform!=='linux')report.blockers.push('NOT_LINUX');
if(!writable)report.blockers.push('DATA_ROOT_NOT_WRITABLE');
if(!report.tailscale.available)report.blockers.push('TAILSCALE_NOT_READY');
report.blockers.push('GROKBOT_NATIVE_ADAPTER_UNVERIFIED');
console.log(JSON.stringify(report,null,2));
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
