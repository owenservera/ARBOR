#!/usr/bin/env node
// Local ARBOR diagnostic only. This is NOT a donor HQ subprocess/bridge.
import { createDevIntelligence } from '../lib/arbor-service.mjs';

function parse(argv) {
  const [command = 'help', ...args] = argv;
  const flags = { allow: [], semantic: [] };
  for (let i = 0; i < args.length; i++) {
    const token = args[i];
    if (token === '--allow' && args[i + 1]) flags.allow.push(args[++i]);
    else if (token === '--semantic') {
      if (!args[i + 1] || args[i + 1].startsWith('--')) throw new Error('HQ_INVALID_SOURCE_SEMANTIC_IDS');
      flags.semantic.push(args[++i]);
    }
    else if (token.startsWith('--') && args[i + 1] && !args[i + 1].startsWith('--')) flags[token.slice(2)] = args[++i];
    else if (token.startsWith('--')) flags[token.slice(2)] = true;
    else (flags.words ||= []).push(token);
  }
  return { command, flags };
}
function main() {
  const { command, flags } = parse(process.argv.slice(2));
  if (command === 'help') {
    process.stdout.write('ARBOR development intelligence (local-only)\n'
      + '  register --name NAME --source ABS_PATH --allow ABS_PATH\n'
      + '  index --allow ABS_PATH [--allow OTHER_PATH]\n'
      + '  search WORDS --allow ABS_PATH [--project NAME]\n'
      + '  context WORDS --allow ABS_PATH [--project NAME] [--semantic ID@VERSION]\n'
      + '  wiki --allow ABS_PATH\n'
      + '  status --allow ABS_PATH\n'
      + '  revoke --name NAME --allow ABS_PATH\n'
      + '  --data ABS_PATH overrides per-user data dir\n'
      + 'Registered source paths are NOT grants: pass --allow each time.\n');
    return;
  }
  const intelligence = createDevIntelligence({ dataDir: flags.data, approvedRoots: flags.allow, mode: 'diagnostic' });
  const task = (flags.words || []).join(' ');
  let result;
  if (command === 'register') result = intelligence.registerSource({ name: flags.name, path: flags.source });
  else if (command === 'revoke') result = intelligence.removeSource(flags.name);
  else if (command === 'index') result = intelligence.index({ force: Boolean(flags.force), useGit: !flags['no-git'] });
  else if (command === 'search') result = intelligence.search({ query: task, project: flags.project });
  else if (command === 'context') result = intelligence.context({ task, project: flags.project, sourceSemanticIds: flags.semantic });
  else if (command === 'wiki') result = intelligence.wiki({ force: Boolean(flags.force) });
  else if (command === 'status') result = intelligence.status();
  else throw new Error('HQ_UNKNOWN_COMMAND: ' + command);
  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
}
try { main(); } catch (error) { process.stderr.write(String(error.message || error) + '\n'); process.exitCode = 1; }
