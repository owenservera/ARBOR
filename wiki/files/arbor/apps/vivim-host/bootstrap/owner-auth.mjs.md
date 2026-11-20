# File: apps/vivim-host/bootstrap/owner-auth.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/bootstrap/owner-auth.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 5505 B |
| Lines | 109 |
| Hash | fd5ee6a02d7c |
| Test | no |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| OWNER_TOKEN_FILE | const | 12 | yes | export const OWNER_TOKEN_FILE = &#39;owner-token&#39;; |
| MIN_TOKEN_LENGTH | const | 13 | no | const MIN_TOKEN_LENGTH = 32; |
| WINDOWS_ACL_CHECK | const | 14 | no | const WINDOWS_ACL_CHECK = ` |
| WINDOWS_ACL_SECURE | const | 28 | no | const WINDOWS_ACL_SECURE = ` |
| runWindowsAcl | function | 39 | no | function runWindowsAcl(file, script, run = execFileSync, env = process.env) { |
| windows | const | 40 | no | const windows = env.SystemRoot \|\| env.WINDIR \|\| &#39;C:\\\\Windows&#39;; |
| requirePrivateFile | function | 51 | no | function requirePrivateFile(file, { platform = process.platform, run = execFileSync, env = process.env } = {}) { |
| st | const | 52 | no | const st=lstatSync(file); |
| ownerTokenPath | function | 59 | yes | export function ownerTokenPath(dataRoot) { |
| loadOwnerToken | function | 65 | yes | export function loadOwnerToken({ dataRoot, env = process.env, create = true, platform = process.platform, run = execFileSync } = {}) { |
| file | const | 70 | no | const file = ownerTokenPath(dataRoot); |
| token | variable | 73 | no | let token; |
| token | const | 80 | no | const token = randomBytes(32).toString(&#39;base64url&#39;); |
| verifyOwnerToken | function | 102 | yes | export function verifyOwnerToken(header, expected) { |
| presented | const | 105 | no | const presented = header.slice(7).trim(); |
| a | const | 106 | no | const a = createHash(&#39;sha256&#39;).update(presented).digest(); |
| b | const | 107 | no | const b = createHash(&#39;sha256&#39;).update(expected).digest(); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 7 | external |
| node:fs | import | 8 | external |
| node:child_process | import | 9 | external |
| node:path | import | 10 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [apps/vivim-host/control/cli.mjs](../control/cli.mjs.md) | ../bootstrap/owner-auth.mjs |
| [apps/vivim-host/control/hvi-capability.mjs](../control/hvi-capability.mjs.md) | ../bootstrap/owner-auth.mjs |
| [apps/vivim-host/server.mjs](../server.mjs.md) | ./bootstrap/owner-auth.mjs |
| [apps/vivim-host/test/owner-auth.test.mjs](../test/owner-auth.test.mjs.md) | ../bootstrap/owner-auth.mjs |
| [harness/src/dev/bootstrap.mjs](../../../harness/src/dev/bootstrap.mjs.md) | ../../../apps/vivim-host/bootstrap/owner-auth.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Owner capability for every Host bootstrap mutation.
// Loopback binding, an Origin check and a custom header stop a web page from driving the
// Host. They do not stop another local process, so each mutation also presents a private
// owner token that only the owner's machine can read. The token is a capability, not a
// password: it is generated once, stored 0600 beside the ledger, never served over HTTP,
// never logged and never placed in the UI.
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync, lstatSync, statSync, unlinkSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

export const OWNER_TOKEN_FILE = 'owner-token';
const MIN_TOKEN_LENGTH = 32;
const WINDOWS_ACL_CHECK = `
$ErrorActionPreference = 'Stop'
$acl = Get-Acl -LiteralPath $env:VIVIM_OWNER_TOKEN_PATH
$me = [System.Security.Principal.WindowsIdentity]::GetCurrent().User.Value
$allowed = @($me, 'S-1-5-18', 'S-1-5-32-544')
if (-not $acl.AreAccessRulesProtected) { throw 'Inherited ACLs are forbidden' }
$owner = $acl.GetOwner([System.Security.Principal.SecurityIdentifier]).Value
if ($owner -notin $allowed) { throw 'Untrusted owner' }
foreach ($rule in $acl.GetAccessRules($true, $true, [System.Security.Principal.SecurityIdentifier])) {
  if ($rule.AccessControlType -eq 'Allow' -and $rule.IdentityReference.Value -notin $allowed) {
    throw 'Untrusted ACL grant'
  }
}
`;
const WINDOWS_ACL_SECURE = `
$ErrorActionPreference = 'Stop'
$path = $env:VIVIM_OWNER_TOKEN_PATH
$acl = Get-Acl -LiteralPath $path
$me = [System.Security.Principal.WindowsIdentity]::GetCurrent().User
$acl.SetAccessRuleProtection($true, $false)
foreach ($rule in @($acl.Access)) { [void]$acl.RemoveAccessRuleSpecific($rule) }
$grant = [System.Security.AccessControl.FileSystemAccessRule]::new($me, [System.Security.AccessControl.FileSystemRights]::FullControl, [System.Security.AccessControl.AccessControlType]::Allow)
$acl.AddAccessRule($grant)
Set-Acl -LiteralPath $path -AclObject $acl
`;
function runWindowsAcl(file, script, run = execFileSync, env = process.env) {
  const windows = env.SystemRoot || env.WINDIR || 'C:\\Windows';
  try {
    run('powershell.exe', ['-NoLogo','-NoProfile','-NonInteractive','-Command',script], {
      env:{...env,VIVIM_OWNER_TOKEN_PATH:path.resolve(file),
        PSModulePath:path.join(windows,'System32','WindowsPowerShell','v1.0','Modules')},
      windowsHide:true,timeout:10000,stdio:'pipe'
    });
  } catch {
    throw new Error('Bootstrap owner capability requires protected Windows ACL');
  }
}
function requirePrivateFile(file, { platform = process.platform, run = execFileSync, env = process.env } = {}) {
  const st=lstatSync(file);
  if(!st.isFile() || st.isSymbolicLink())throw new Error('Bootstrap owner credential must be a regular private file');
  if(platform==='win32')runWindowsAcl(file,WINDOWS_ACL_CHECK,run,env);
  else if(statSync(file).mode & 0o077)throw new Error('Bootstrap owner credential must be mode 0600');
}


export function ownerTokenPath(dataRoot) {
  return path.join(dataRoot, 'bootstrap', OWNER_TOKEN_FILE);
}

// Precedence: an explicit environment token (tests, headless runs) then the stored file,
// then a fresh token. `create: false` never writes: reads report the missing state.
export function loadOwnerToken({ dataRoot, env = process.env, create = true,
  platform = process.platform, run = execFileSync } = {}) {
  if (typeof env.VIVIM_BOOTSTRAP_TOKEN === 'string' && env.VIVIM_BOOTSTRAP_TOKEN.length >= MIN_TOKEN_LENGTH) {
    return { token: env.VIVIM_BOOTSTRAP_TOKEN, source: 'env', path: null };
  }
  const file = ownerTokenPath(dataRoot);
  if (existsSync(file)) {
    requirePrivateFile(file, { platform, run, env });
    let token;
    try { token = readFileSync(file, 'utf8').trim(); }
    catch { throw new Error('Existing bootstrap owner capability cannot be read safely'); }
    if (token.length < MIN_TOKEN_LENGTH) throw new Error('Existing bootstrap owner capability is invalid; explicit repair required');
    return { token, source: 'file', path: file };
  }
  if (!create) return { token: null, source: 'missing', path: file };
  const token = randomBytes(32).toString('base64url');
```

_First 80 of 110 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
