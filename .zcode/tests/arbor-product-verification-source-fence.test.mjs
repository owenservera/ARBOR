// R06: execute the actual existing ZCode DWF body with a no-effect world mock.
// This test never launches ZCode, shells, providers, Host, or device operations.
// Run with Node 24+: node --test .zcode/tests/arbor-product-verification-source-fence.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';

const SHA = 'a'.repeat(40);
const workflow = readFileSync(
  new URL('../workflows/arbor-product-verification-parallel.dwf.ts', import.meta.url),
  'utf8'
);

// The DWF uses an intentional top-level return. Wrap it inside an async
// function before stripping TypeScript types; all world effects are mocked.
function compileWorkflow() {
  const wrapped = 'async function runDwf(args,world,phase,report){\n' + workflow + '\n}';
  const stripped = stripTypeScriptTypes(wrapped);
  return new Function('"use strict";\n' + stripped + '\nreturn runDwf;')();
}

function fixture(options = {}) {
  const calls = [];
  let headReads = 0;
  let statusReads = 0;
  const world = {
    async run(executable, argv) {
      calls.push({ executable, argv: [...argv] });
      if (executable === 'git' && argv[0] === 'rev-parse') {
        assert.deepEqual(argv, ['rev-parse', 'HEAD']);
        const isAfter = headReads++ > 0;
        return {
          exitCode: isAfter && options.postHeadError ? 1 : 0,
          stdout: isAfter ? (options.postHead ?? SHA) : (options.initialHead ?? SHA)
        };
      }
      if (executable === 'git' && argv[0] === 'status') {
        assert.deepEqual(argv, ['status', '--porcelain', '--untracked-files=all'],
          'untracked files must be included at both source fences');
        const isAfter = statusReads++ > 0;
        return {
          exitCode: isAfter && options.postStatusError ? 1 : 0,
          stdout: isAfter ? (options.postStatus ?? '') : (options.initialStatus ?? '')
        };
      }
      if (executable === 'node') {
        const failed = options.failLane && (
          argv.includes('integration/scripts/pwa-run-now.mjs') ===
          (options.failLane === 'pwa')
        );
        return {
          exitCode: failed ? 1 : 0,
          stdout: failed ? 'source test failed' : 'source tests passed',
          stderr: ''
        };
      }
      throw new Error('unexpected verifier command: ' + executable + ' ' + argv.join(' '));
    }
  };
  return {
    calls,
    execute: (sha = SHA) => compileWorkflow()({ sha }, world, () => {}, () => {})
  };
}

test('invalid source SHA stops before any command', async () => {
  const f = fixture();
  const result = await f.execute('main');
  assert.match(result.conclusion, /^BLOCKED:/);
  assert.deepEqual(f.calls, []);
});

test('wrong preflight HEAD stops before any Node test', async () => {
  const f = fixture({ initialHead: 'b'.repeat(40) });
  const result = await f.execute();
  assert.match(result.conclusion, /^BLOCKED:/);
  assert.equal(f.calls.some(x => x.executable === 'node'), false);
});

test('untracked source blocks verification before running tests', async () => {
  const f = fixture({ initialStatus: '?? apps/mobile-relay/extra.mjs\n' });
  const result = await f.execute();
  assert.match(result.conclusion, /^BLOCKED:/);
  assert.equal(f.calls.some(x => x.executable === 'node'), false);
});

test('changing HEAD during all-green suites invalidates source-attested PASS', async () => {
  const f = fixture({ postHead: 'b'.repeat(40) });
  const result = await f.execute();
  assert.match(result.conclusion, /^BLOCKED:/);
  assert.equal(result.observedPostSha, 'b'.repeat(40));
  assert.equal(result.results.length, 3);
  assert.deepEqual(result.verified, []);
});

test('new untracked file during testing invalidates PASS', async () => {
  const f = fixture({ postStatus: '?? apps/mobile-relay/late-shadow.mjs\n' });
  const result = await f.execute();
  assert.match(result.conclusion, /^BLOCKED:/);
  assert.equal(result.postflightClean, false);
  assert.deepEqual(result.verified, []);
});

test('postflight git failure cannot be misreported as PASS', async () => {
  const f = fixture({ postStatusError: true });
  const result = await f.execute();
  assert.match(result.conclusion, /^BLOCKED:/);
  assert.equal(result.postflightClean, false);
});

test('immutable clean source admits all three deterministic suites', async () => {
  const f = fixture();
  const result = await f.execute();
  assert.match(result.conclusion, /^ZCode parallel product verification PASS/);
  assert.equal(result.sourceSha, SHA);
  assert.equal(result.launchedLanes, 3);
  assert.equal(result.verified.length, 3);
  assert.equal(f.calls.filter(x => x.executable === 'node').length, 3);
  assert.equal(f.calls.filter(x => x.executable === 'git').length, 4);
});

test('real suite failure stays FAIL when source remains unchanged', async () => {
  const f = fixture({ failLane: 'pwa' });
  const result = await f.execute();
  assert.match(result.conclusion, /FAILED/);
  assert.equal(result.results.filter(x => x.result === 'FAIL').length, 1);
  assert.equal(result.verified.length, 2);
});
