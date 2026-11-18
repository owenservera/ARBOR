#!/usr/bin/env node
// Output-only CLI: reads bounded, allowlisted, read-only files and prints result.
import { readFileSync, realpathSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compileFeedback, MAX_INPUT_BYTES, summary } from './compiler.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const USAGE = `Usage: node scripts/feedback-loop/compile.mjs --receipt <repo-relative-path> [--receipt <path>] [--journal <path>] --source-sha <40-hex> --current-sha <40-hex> --revision R002 --current-revision R002 [--condition <verifier-check>] [--summary]\n\nDRY-RUN ONLY. The --current-sha pin must be independently supplied by the keeper from the checked-out Git HEAD; this CLI compares claims but does not verify git itself.\nAllowed receipt paths: .coordination/pdr/evidence/*.verify.*.json or scripts/feedback-loop/fixtures/*.json\nAllowed journal paths: demo/host-legacy/journal.jsonl or scripts/feedback-loop/fixtures/*.jsonl\nDefault output is machine-readable JSON. --summary prints plain text instead.\n`;

function fail(msg, code = 2) { process.stderr.write(msg + '\n'); process.exitCode = code; }
function readBounded(rel, kind) {
  if (typeof rel !== 'string' || rel.startsWith('/') || rel.includes('\\') || rel.split('/').some(p => !p || p === '.' || p === '..')) throw new Error('Invalid relative path');
  const valid = kind === 'receipt'
    ? (/^\.coordination\/pdr\/evidence\/[A-Z0-9-]+\.verify\.[a-z0-9-]+\.json$/.test(rel) || /^scripts\/feedback-loop\/fixtures\/[a-z0-9.-]+\.json$/.test(rel))
    : (rel === 'demo/host-legacy/journal.jsonl' || /^scripts\/feedback-loop\/fixtures\/[a-z0-9.-]+\.jsonl$/.test(rel));
  if (!valid) throw new Error('Path outside permitted ' + kind + ' inputs');
  const resolved = realpathSync(path.resolve(ROOT, rel));
  if (!resolved.startsWith(realpathSync(ROOT) + path.sep)) throw new Error('Refusing symlink escape');
  if (statSync(resolved).size > MAX_INPUT_BYTES) throw new Error('Input oversized: ' + rel);
  return readFileSync(resolved, 'utf8');
}
function parseJsonl(text, pathName) {
  const rows = text.split(/\r?\n/).filter(Boolean);
  if (rows.length > 2000 || rows.some(r => Buffer.byteLength(r) > 16 * 1024)) throw new Error('Invalid/oversized journal: ' + pathName);
  return rows.map((r, i) => { try { return JSON.parse(r); } catch { throw new Error('Malformed JSONL at line ' + (i+1)); } });
}
function main(args) {
  if (args.length === 1 && (args[0] === '--help' || args[0] === '-h')) { process.stdout.write(USAGE); return; }
  const values = { receipt: [], journal: [] };
  const opts = new Set(['--receipt','--journal','--source-sha','--current-sha','--revision','--current-revision','--condition','--summary']);
  for (let i = 0; i < args.length; i++) {
    const opt = args[i];
    if (!opts.has(opt)) throw new Error('Unknown option ' + opt);
    if (opt === '--summary') { values.summary = true; continue; }
    const v = args[++i];
    if (!v || v.startsWith('--')) throw new Error('Missing value for ' + opt);
    const k = opt.slice(2).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    if (k === 'receipt' || k === 'journal') values[k].push(v);
    else if (values[k] !== undefined) throw new Error('Repeated option ' + opt);
    else values[k] = v;
  }
  if (!values.receipt.length && !values.journal.length) throw new Error('Provide receipt or journal');
  const roadmap = JSON.parse(readFileSync(path.join(ROOT, 'docs/product/roadmap/roadmap.v1.json'), 'utf8'));
  const receipts = values.receipt.map(p => ({ path: p, data: JSON.parse(readBounded(p, 'receipt')) }));
  const journals = values.journal.map(p => ({ path: p, entries: parseJsonl(readBounded(p, 'journal'), p) }));
  const result = compileFeedback({ roadmap, pins: {
    sourceSha: values.sourceSha, currentSha: values.currentSha,
    revision: values.revision, currentRevision: values.currentRevision
  }, receipts, journals, condition: values.condition || null });
  process.stdout.write(values.summary ? summary(result) : JSON.stringify(result, null, 2) + '\n');
}
try { main(process.argv.slice(2)); }
catch (error) { fail('Feedback compiler refused input [' + (error.code || 'INPUT_ERROR') + ']: ' + error.message); }
