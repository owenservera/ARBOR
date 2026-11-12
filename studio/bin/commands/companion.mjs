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