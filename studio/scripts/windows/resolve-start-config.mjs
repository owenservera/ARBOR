// Read-only bridge between the Windows adapter and the workspace manifest resolver.
import path from 'node:path';
import { realpathSync, statSync } from 'node:fs';
import { MANIFEST_FILE, readManifest, resolveStartConfig } from '../../src/workspace-manifest.mjs';

const fail = (code, message) => { throw Object.assign(new Error(message), { code }); };
// Match the listener verifier: no UNC, device, root-relative or drive-relative paths.
const canonical = value => {
  if (typeof value !== 'string' || !/^[a-zA-Z]:\\/.test(value))
    fail('PATH_UNSUPPORTED', 'Only drive-qualified Windows paths are supported.');
  let resolved;
  try { resolved = realpathSync.native(value); }
  catch { fail('SETUP_INCOMPLETE', 'A configured path is missing or inaccessible.'); }
  if (typeof resolved !== 'string' || !/^[a-zA-Z]:\\/.test(resolved))
    fail('PATH_UNSUPPORTED', 'The canonical path is not drive-qualified.');
  return path.win32.normalize(resolved);
};

// An override that cannot be resolved (for example, a missing file) is not the installed location: mismatch.
const sameLocation = (value, expected) => {
  try { return canonical(value) === expected; } catch { return false; }
};

try {
  const root = process.argv[2];
  if (!root) fail('WORKSPACE_NOT_CONFIGURED', 'Installation workspace must be an absolute path.');
  const canonicalRoot = canonical(root);
  const file = path.join(root, MANIFEST_FILE);
  if (process.env.VIVIM_WORKSPACE_MANIFEST && !sameLocation(process.env.VIVIM_WORKSPACE_MANIFEST, path.join(canonicalRoot, MANIFEST_FILE)))
    fail('WORKSPACE_MISMATCH', 'Manifest override conflicts with the installed workspace.');
  if (process.env.CAPTURE_STUDIO_HOME && !sameLocation(process.env.CAPTURE_STUDIO_HOME, canonicalRoot))
    fail('WORKSPACE_MISMATCH', 'Data directory override conflicts with the installed workspace.');
  const { manifest } = readManifest(file);
  const selected = resolveStartConfig(manifest);
  if (canonical(selected.workspaceRoot) !== canonicalRoot) fail('WORKSPACE_MISMATCH', 'Manifest workspace differs from the installed workspace.');
  const executable = canonical(selected.chrome.executable);
  canonical(selected.chrome.profileDir);
  if (process.env.CHROME_PATH && !sameLocation(process.env.CHROME_PATH, executable))
    fail('EXECUTABLE_MISMATCH', 'Chrome executable override conflicts with the manifest.');
  if (process.env.CAPTURE_STUDIO_CDP_PORT && process.env.CAPTURE_STUDIO_CDP_PORT !== String(selected.chrome.port))
    fail('PORT_MISMATCH', 'CDP port override conflicts with the manifest.');
  try {
    if (!statSync(selected.workspaceRoot).isDirectory() || !statSync(selected.chrome.profileDir).isDirectory()
      || !statSync(selected.chrome.executable).isFile()) throw new Error();
  } catch { fail('SETUP_INCOMPLETE', 'Workspace, profile or executable is unavailable or has the wrong type.'); }
  console.log(JSON.stringify({ workspaceRoot: selected.workspaceRoot, chrome: selected.chrome }));
} catch (error) {
  // Do not serialize the manifest, its relay fields or raw parser exceptions.
  console.log(JSON.stringify({ error: error.code ?? 'MANIFEST_INVALID', message: 'Workspace configuration cannot be used. Run vivim doctor.' }));
  process.exitCode = 1;
}
