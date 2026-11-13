#!/usr/bin/env node
/**
 * G1 operator-only synthetic-data CLI. Never reads Git credentials or HEAD.
 * Usage: node hq/version-intelligence/integration/cli.mjs --synthetic-stdin
 */
import { runHviTool, HVI_TOOL_REQUEST_SCHEMA } from './index.mjs';
const MAX_STDIN = 4000000;
async function main() {
  if (process.argv.length !== 3 || process.argv[2] !== '--synthetic-stdin') {
    process.stderr.write('HVI_TOOL_SOURCE_UNAUTHORIZED: only --synthetic-stdin is enabled before Host H integration\n');
    process.exitCode = 2; return;
  }
  let length = 0, bytes = '';
  for await (const chunk of process.stdin) {
    length += chunk.length;
    if (length > MAX_STDIN) throw Object.assign(new Error('HVI_TOOL_RESOURCE_LIMIT'), { code: 'RESOURCE_LIMIT' });
    bytes += chunk.toString('utf8');
  }
  const input = JSON.parse(bytes);
  if (input.schema !== HVI_TOOL_REQUEST_SCHEMA ||
      !input.sourceManifests?.every(m => m.pin?.repoIdentity?.startsWith('synthetic/'))) {
    throw Object.assign(new Error('HVI_TOOL_SOURCE_UNAUTHORIZED'), { code: 'SOURCE_UNAUTHORIZED' });
  }
  const result = await runHviTool(input, { authorize: async () => true });
  process.stdout.write(JSON.stringify({ ...result, provenance: 'SYNTHETIC_ONLY' }) + '\n');
}
main().catch(e => {
  process.stderr.write('HVI_TOOL_' + String(e.code || 'INVALID_INPUT') + '\n');
  process.exitCode = 1;
});
