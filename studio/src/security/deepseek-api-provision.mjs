// Windows-only local provider enrollment. Studio owns the browser; the OS owns secrets.
// No remote credential input, credential output, browser capture, or password-manager inspection.
// The provisioning page is intentionally a user-operated sensitive surface until a private
// capture-exclusion contract and its live selectors are verified.
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve, join, sep } from 'node:path';
import { existsSync, realpathSync } from 'node:fs';
import { dataPaths } from '../config.mjs';

export const PLATFORM = 'https://platform.deepseek.com/api_keys';
export const API = 'https://api.deepseek.com';
export const MODELS = Object.freeze(['deepseek-flash','deepseek-v4-pro']);
const STATES = new Set(['verified','cancelled','not_configured','already_configured','authentication_failed','probe_failed','local_error']);
const fail = code => Object.assign(new Error(code), { code });
export function projectReceipt(value) {
  if (!value || !STATES.has(value.state)) throw fail('PROVISION_RECEIPT_INVALID');
  const models = value.state === 'verified' && Array.isArray(value.models)
    ? MODELS.filter(id => value.models.includes(id)) : [];
  if (value.state === 'verified' && !models.length) throw fail('PROVISION_MODELS_UNVERIFIED');
  return {schema:'vivim.provider-credential-receipt/1',provider:'deepseek',state:value.state,
    ...(models.length ? {credentialRef:'local:deepseek:dpapi-current-user',models,baseUrl:API} : {})};
}

// Studio currently defaults to local-raw capture. Never open the enrollment surface
// in its capture profile or attach CDP to the credential page. Use the ordinary
// Chrome profile only, with a native local user completing any authentication.
export async function openEnrollmentPage() {
  if (process.platform !== 'win32' || !process.env.LOCALAPPDATA) throw fail('WINDOWS_OWNER_SESSION_REQUIRED');
  const paths = dataPaths();
  const normal = join(process.env.LOCALAPPDATA,'Google','Chrome','User Data');
  const canon = p => (existsSync(p) ? realpathSync(p) : resolve(p)).toLowerCase();
  const capture = canon(paths.chromeProfile), ordinary = canon(normal);
  if (capture === ordinary || ordinary.startsWith(capture + sep) || capture.startsWith(ordinary + sep))
    throw fail('PROVISION_CAPTURE_PROFILE_CONFLICT');
  const candidates = [
    paths.chromeExecutable,
    ...[process.env.ProgramFiles,process.env['ProgramFiles(x86)'],process.env.LOCALAPPDATA]
      .filter(Boolean).map(p=>join(p,'Google','Chrome','Application','chrome.exe'))
  ].filter(Boolean);
  const chrome = candidates.find(p=>existsSync(p) && p.toLowerCase().endsWith('chrome.exe'));
  if (!chrome) throw fail('PROVISION_CHROME_UNAVAILABLE');
  await new Promise((resolve,reject)=>{
    const child=spawn(chrome,['--user-data-dir='+normal,'--new-window',PLATFORM],
      {detached:true,stdio:'ignore'});
    child.once('error',()=>reject(fail('PROVISION_CHROME_LAUNCH_FAILED')));
    child.once('spawn',()=>{child.unref();resolve();});
  });
}

// The helper executes in the interactive owner's Windows session. Its stdout is a
// bounded receipt channel, never a credential channel. The secret stays within DPAPI
// and the helper's HTTPS request; it is not a CLI argument, environment variable,
// generic MCP result, or configuration-file value.
const helper = fileURLToPath(new URL('./deepseek-api-vault.ps1', import.meta.url));
export async function vaultOperation(mode) {
  if (process.platform !== 'win32') throw fail('WINDOWS_OWNER_SESSION_REQUIRED');
  if (!['import','verify'].includes(mode)) throw fail('PROVISION_MODE_INVALID');
  return new Promise((resolve,reject) => {
    const child = spawn('pwsh',['-NoLogo','-NoProfile','-STA','-File',helper,'-Mode',mode],
      {windowsHide:true,stdio:['ignore','pipe','ignore']});
    let output = '', tooLarge = false;
    child.stdout.setEncoding('utf8');
    child.stdout.on('data', chunk => {
      if (output.length + chunk.length > 8192) { tooLarge = true; child.kill(); }
      else if (!tooLarge) output += chunk;
    });
    const timeout = setTimeout(() => { child.kill(); reject(fail('PROVISION_TIMEOUT')); }, 300000);
    child.on('error', () => { clearTimeout(timeout); reject(fail('PROVISION_HELPER_UNAVAILABLE')); });
    child.on('close', code => {
      clearTimeout(timeout);
      if (tooLarge || code !== 0) return reject(fail('PROVISION_HELPER_FAILED'));
      try { resolve(projectReceipt(JSON.parse(output.trim()))); }
      catch { reject(fail('PROVISION_RECEIPT_INVALID')); }
    });
  });
}

export async function provisionDeepSeek() {
  if (process.platform !== 'win32') throw fail('WINDOWS_OWNER_SESSION_REQUIRED');
  const existing = await vaultOperation('verify');
  if (existing.state !== 'not_configured') return existing;
  await openEnrollmentPage();
  return vaultOperation('import');
}
export const verifyDeepSeek = () => vaultOperation('verify');

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const mode = process.argv[2];
    if (process.argv.length !== 3 || !['provision','verify'].includes(mode))
      throw fail('USAGE_PROVISION_OR_VERIFY');
    const result = await (mode === 'provision' ? provisionDeepSeek() : verifyDeepSeek());
    console.log(JSON.stringify(result));
    if (result.state !== 'verified') process.exitCode = 1;
  } catch (error) {
    // Only locally defined codes. Never print CDP errors, raw responses or exception text.
    console.log(JSON.stringify({schema:'vivim.provider-credential-receipt/1',provider:'deepseek',
      state:'local_error',code:/^[A-Z_]{3,80}$/.test(error?.code || '') ? error.code : 'PROVISION_FAILED'}));
    process.exitCode = 1;
  }
}
