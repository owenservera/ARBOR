# File: studio/bin/commands/companion.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/bin/commands/companion.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 1407 B |
| Lines | 19 |
| Hash | c1e1b753849f |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| result | const | 10 | no | const result=pairCompanion(ctx.paths.root,id); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ../lib/registry.mjs | import | 2 | [studio/bin/lib/registry.mjs](../lib/registry.mjs.md) |
| ../lib/ui.mjs | import | 3 | [studio/bin/lib/ui.mjs](../lib/ui.mjs.md) |
| ../../src/studio/browser-companion/ingress.mjs | import | 4 | [studio/src/studio/browser-companion/ingress.mjs](../../src/studio/browser-companion/ingress.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/bin/studio.mjs](../studio.mjs.md) | ./commands/companion.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Local-only companion pairing. Credential is observation-scoped and never shared with the phone.
import { define } from '../lib/registry.mjs';
import { usageError } from '../lib/ui.mjs';
import { pairCompanion, revokeCompanion, companionState } from '../../src/studio/browser-companion/ingress.mjs';
define({name:'companion',section:'System',usage:'pair <extension-id> | status | revoke',summary:'Manage passive Browser Companion pairing',
  flags:{},async run(ctx){
    const [action,id]=ctx.args;
    if(action==='pair'){
      if(!id||ctx.args.length!==2)throw usageError('Usage: studio companion pair <32-character Chrome extension ID>');
      const result=pairCompanion(ctx.paths.root,id);
      ctx.out.emit({extensionId:result.extensionId,token:result.token,notice:'Copy once into the extension options. Never share this credential.'},
        out=>out.line(JSON.stringify(result)));
      return;
    }
    if(action==='status'&&ctx.args.length===1){ctx.out.emit(companionState(ctx.paths.root),out=>out.line(JSON.stringify(companionState(ctx.paths.root),null,2)));return;}
    if(action==='revoke'&&ctx.args.length===1){const revoked=revokeCompanion(ctx.paths.root);ctx.out.emit({revoked},out=>out.line(revoked?'Companion pairing revoked':'No companion pairing configured'));return;}
    throw usageError('Usage: studio companion pair <extension-id> | status | revoke');
  }
});
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
