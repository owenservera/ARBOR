// What this PC offers VIVIM: platform, a usable Chromium browser and sensible defaults.
// Pure given its inputs so it can be tested for every platform from any machine.
import os from 'node:os';
import path from 'node:path';
import { existsSync } from 'node:fs';

function browserCandidates(platform, env, home) {
  if (platform === 'win32') {
    const pf = env.ProgramFiles || 'C:\\Program Files', pf86 = env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';
    const local = env.LOCALAPPDATA || path.win32.join(home, 'AppData', 'Local');
    const w = path.win32.join;
    return [
      ['Google Chrome', w(pf, 'Google', 'Chrome', 'Application', 'chrome.exe')],
      ['Google Chrome', w(pf86, 'Google', 'Chrome', 'Application', 'chrome.exe')],
      ['Google Chrome', w(local, 'Google', 'Chrome', 'Application', 'chrome.exe')],
      ['Microsoft Edge', w(pf86, 'Microsoft', 'Edge', 'Application', 'msedge.exe')],
      ['Microsoft Edge', w(pf, 'Microsoft', 'Edge', 'Application', 'msedge.exe')]
    ];
  }
  if (platform === 'darwin') return [
    ['Google Chrome', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'],
    ['Microsoft Edge', '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge']
  ];
  return ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser', 'microsoft-edge']
    .flatMap(name => ['/usr/bin/', '/usr/local/bin/', '/snap/bin/'].map(dir => [name.includes('edge') ? 'Microsoft Edge' : name.includes('chromium') ? 'Chromium' : 'Google Chrome', dir + name]));
}

export function detectEnvironment({ platform = process.platform, env = process.env, home = os.homedir(), exists = existsSync, nodeVersion = process.versions.node } = {}) {
  const found = browserCandidates(platform, env, home).find(([, file]) => exists(file));
  const join = platform === 'win32' ? path.win32.join : path.posix.join;
  const workspaceRoot = platform === 'win32' ? 'C:\\VIVIM' : join(home, 'VIVIM');
  return {
    platform,
    node: { ok: Number(nodeVersion.split('.')[0]) >= 22, version: nodeVersion },
    browser: found ? { found: true, name: found[0], path: found[1] } : { found: false, name: null, path: null },
    defaults: {
      workspaceRoot,
      chromeExe: found ? found[1] : '',
      chromeProfile: join(workspaceRoot, 'chrome-profile'),
      cdpPort: 38702
    },
    canLaunchFromHere: platform === 'win32'
  };
}
