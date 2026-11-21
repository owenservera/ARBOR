#!/usr/bin/env node
// GPUI portable distribution from a VERIFIED frozen Host runtime.
// Deliberately no Tauri build/CLI, no APK, no installer-signing claim.
import { cpSync, copyFileSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { verifyStagedRuntime, RUNTIME_MANIFEST_NAME } from './prepare-host-runtime.mjs';

const sha256 = file => createHash('sha256').update(readFileSync(file)).digest('hex');
const refuse = text => { throw new Error('GPUI_BUNDLE_REFUSED: ' + text); };
export function parseArgs(args) {
  const mode = args[0];
  if (!['--bundle', '--verify'].includes(mode)) refuse('Expected --bundle or --verify');
  const values = new Map();
  for (let i = 1; i < args.length; i += 2) {
    const option = args[i], value = args[i + 1];
    if (!['--runtime', '--binary', '--out'].includes(option) || !value || value.startsWith('--') || values.has(option))
      refuse('Expected unique --runtime, --binary, --out arguments');
    values.set(option, value);
  }
  if (!values.has('--out') || (mode === '--bundle' && (!values.has('--runtime') || !values.has('--binary'))))
    refuse('Missing --out, --runtime or --binary');
  return { mode, output: path.resolve(values.get('--out')),
    runtime: values.has('--runtime') ? path.resolve(values.get('--runtime')) : null,
    binary: values.has('--binary') ? path.resolve(values.get('--binary')) : null };
}
function verifiedRuntime(root) {
  const manifestPath = path.join(root, RUNTIME_MANIFEST_NAME);
  if (!existsSync(manifestPath)) refuse('Frozen runtime manifest absent: ' + root);
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const result = verifyStagedRuntime(root, {manifest,requireManifest:true});
  if (!result.ok) refuse('Frozen runtime invalid: ' + result.problems.join('; '));
  return result.checks;
}
function executable(pathname) {
  if (!existsSync(pathname) || lstatSync(pathname).isSymbolicLink() || !lstatSync(pathname).isFile() ||
      !/\.exe$/i.test(pathname) || /(?:^|[\\/])debug(?:[\\/])/i.test(pathname)) refuse('Release GPUI .exe required');
  // A nonempty source file renamed .exe is never an acceptable bundle input.
  const bytes = readFileSync(pathname);
  if (bytes.length < 64 || bytes[0] !== 0x4d || bytes[1] !== 0x5a) refuse('Input is not a Windows PE executable');
  return {sha256: sha256(pathname), bytes: bytes.length};
}
function noOverwrite(output, runtime, binary) {
  if (existsSync(output)) refuse('Output exists; no overwrite permitted: ' + output);
  if (runtime && (output === runtime || output.startsWith(runtime + path.sep)))
    refuse('Output must not be inside frozen runtime');
  if (binary && output === binary) refuse('Output must not replace the executable');
}
export function verifyBundle(output) {
  const binary = path.join(output, 'vivim-gpui-desktop.exe');
  const exe = executable(binary);
  const checks = verifiedRuntime(path.join(output, 'runtime'));
  return {status:'PORTABLE_GPUI_VERIFIED_NOT_SIGNED', output, executableSha256:exe.sha256, checks};
}
export function bundle({output,runtime,binary}) {
  if (process.platform !== 'win32') refuse('Native Windows build environment required');
  if (!runtime || !binary) refuse('Both runtime and binary must be explicit');
  noOverwrite(output,runtime,binary);
  verifiedRuntime(runtime);
  executable(binary);
  const parent = path.dirname(output),stage = path.join(parent,'.gpui-stage-'+process.pid);
  if (existsSync(stage)) refuse('Previous staging directory must be inspected: ' + stage);
  mkdirSync(parent,{recursive:true});
  mkdirSync(stage);
  try {
    copyFileSync(binary,path.join(stage,'vivim-gpui-desktop.exe'));
    cpSync(runtime,path.join(stage,'runtime'),{recursive:true,dereference:false});
    const proof=verifyBundle(stage);
    // Rename only after every staged byte and native executable was checked.
    if (existsSync(output)) refuse('Output appeared during bundling; no overwrite');
    renameSync(stage,output);
    return {...proof,output,status:'PORTABLE_GPUI_STAGED_NOT_INSTALLER_ACCEPTED'};
  } catch (error) {
    if (existsSync(stage)) rmSync(stage,{recursive:true,force:true});
    throw error;
  }
}
export function main(args) {
  const p=parseArgs(args);
  if (p.mode==='--verify') return verifyBundle(p.output);
  return bundle(p);
}
if (process.argv[1] && fileURLToPath(import.meta.url)===path.resolve(process.argv[1])) {
  try { console.log(JSON.stringify(main(process.argv.slice(2)))); }
  catch(e) { console.error(e.message); process.exitCode=1; }
}
