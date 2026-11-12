import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { findChrome, parsePsOutput, buildLaunchCommand, LAB_PROFILE } from '../../src/interface/launch.mjs';
import { parseSsListenerPid, linuxListenerCommandLine, isLabCommandLine } from '../../src/interface/standing.mjs';

test('findChrome on linux prefers CHROME_PATH then standard paths', () => {
  assert.equal(findChrome({ CHROME_PATH: '/x/chrome' }, 'linux', p => p === '/x/chrome'), '/x/chrome');
  assert.equal(findChrome({}, 'linux', p => p === '/opt/google/chrome/chrome'), '/opt/google/chrome/chrome');
  assert.equal(findChrome({}, 'linux', () => false), '/usr/bin/google-chrome');
});
test('parsePsOutput keeps chrome lines only', () => {
  assert.deepEqual(parsePsOutput('bash\n/opt/google/chrome/chrome --user-data-dir=/a\n'), ['/opt/google/chrome/chrome --user-data-dir=/a']);
});
test('lab launch command stays loopback 9333', () => {
  const c = buildLaunchCommand({ chrome: '/usr/bin/google-chrome', userDataDir: LAB_PROFILE });
  assert.ok(c.args.includes('--remote-debugging-port=9333'));
  assert.throws(() => buildLaunchCommand({ userDataDir: '/home/box/chrome-profile/Fork-12' }));
});
const SS = 'LISTEN 0 10 127.0.0.1:9234 0.0.0.0:* users:(("chrome",pid=11,fd=1))\nLISTEN 0 10 127.0.0.1:9333 0.0.0.0:* users:(("chrome",pid=42,fd=1))\n';
test('parseSsListenerPid finds exact loopback 9333 listener', () => {
  assert.equal(parseSsListenerPid(SS), 42);
  assert.equal(parseSsListenerPid('LISTEN 0 10 0.0.0.0:9333 0.0.0.0:* users:(("x",pid=7,fd=1))'), null);
  assert.equal(parseSsListenerPid(''), null);
});
test('linuxListenerCommandLine + isLabCommandLine verify the lab profile', async () => {
  const lab = resolve('/tmp/lab/chrome-profile');
  const line = await linuxListenerCommandLine({ run: () => SS, readCmdline: pid => pid === 42 ? `/usr/bin/google-chrome\0--user-data-dir=${lab}\0--remote-debugging-port=9333\0` : '' });
  assert.equal(isLabCommandLine(line, lab), true);
  const other = await linuxListenerCommandLine({ run: () => SS, readCmdline: () => '/c\0--user-data-dir=/home/box/chrome-profile/Fork-12\0' });
  assert.equal(isLabCommandLine(other, lab), false);
});
