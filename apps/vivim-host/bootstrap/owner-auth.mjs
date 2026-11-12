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
  mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });
  try { writeFileSync(file, token + '\n', { mode: 0o600, flag: 'wx' }); }
  catch (error) {
    if (error.code === 'EEXIST') return loadOwnerToken({ dataRoot, env, create: false, platform, run });
    throw error;
  }
  try {
    if (platform === 'win32') {
      runWindowsAcl(file, WINDOWS_ACL_SECURE, run, env);
      requirePrivateFile(file, { platform, run, env });
    } else {
      chmodSync(file, 0o600);
      requirePrivateFile(file, { platform, run, env });
    }
  } catch (error) {
    try { unlinkSync(file); } catch {}
    throw error;
  }
  return { token, source: 'created', path: file };
}

export function verifyOwnerToken(header, expected) {
  if (typeof header !== 'string' || !header.toLowerCase().startsWith('bearer ')) return false;
  if (typeof expected !== 'string' || expected.length < MIN_TOKEN_LENGTH) return false;
  const presented = header.slice(7).trim();
  const a = createHash('sha256').update(presented).digest();
  const b = createHash('sha256').update(expected).digest();
  return timingSafeEqual(a, b);
}
