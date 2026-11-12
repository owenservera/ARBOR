// G1 self-build loop: ask a web model for code, apply it on a branch, test, keep only if green.
// Pure parts (prompt, parse, path policy) are exported for tests; side effects are injected.
import { createHash } from 'node:crypto';

export const MAX_SENDS = 3; // first send + at most 2 retries with test output fed back
export const FILE_OPEN = /^\s*=== FILE: (.+?) ===\s*$/;
export const FILE_CLOSE = /^\s*=== END FILE ===\s*$/;

// Paths a web model may write. Safety gates (approval, send, standing, attach target, journal) are
// deliberately excluded: weakening them must never come from a model reply.
export const ALLOWED_PREFIXES = ['src/', 'test/', 'docs/', 'scripts/'];
export const PROTECTED = new Set(['src/interface/approval.mjs', 'src/interface/standing.mjs', 'src/interface/target.mjs', 'src/core/send.mjs', 'src/core/journal.mjs', 'src/build/build.mjs', 'src/provenance/ledger.mjs']);

export function checkPath(path) {
  const p = String(path).trim().replace(/^\.\//, '').replace(/^harness\//, '');
  if (!p || p.startsWith('/') || p.includes('\\') || p.split('/').some(seg => seg === '..' || seg === '' || seg.startsWith('.'))) return { ok: false, path: p, reason: 'PATH_UNSAFE' };
  if (!ALLOWED_PREFIXES.some(x => p.startsWith(x))) return { ok: false, path: p, reason: 'PATH_NOT_ALLOWED' };
  if (PROTECTED.has(p)) return { ok: false, path: p, reason: 'PATH_PROTECTED' };
  if (!/\.(mjs|js|json|md)$/.test(p)) return { ok: false, path: p, reason: 'PATH_TYPE' };
  return { ok: true, path: p };
}

// Rendered chat UIs drop ``` fences from innerText, so the protocol uses plain marker lines that
// survive rendering. A leading code-fence language label line ("javascript") is stripped.
export function parseFiles(text) {
  const lines = String(text).replace(/\r/g, '').split('\n'); const files = []; let cur = null;
  for (const line of lines) {
    const open = line.match(FILE_OPEN);
    if (open && !cur) { cur = { path: open[1], body: [] }; continue; }
    if (cur && FILE_CLOSE.test(line)) { files.push(cur); cur = null; continue; }
    if (cur) cur.body.push(line);
  }
  if (cur) return { files: [], error: 'UNTERMINATED_FILE' };
  const out = [];
  for (const f of files) {
    let body = f.body;
    while (body.length && /^\s*(```.*|javascript|js|json|markdown|Copy( code)?)\s*$/i.test(body[0])) body = body.slice(1);
    while (body.length && /^\s*(```)?\s*$/.test(body.at(-1))) body = body.slice(0, -1);
    const c = checkPath(f.path); if (!c.ok) return { files: [], error: `${c.reason}: ${c.path}` };
    out.push({ path: c.path, content: body.join('\n') + '\n' });
  }
  if (!out.length) return { files: [], error: 'NO_FILES' };
  if (new Set(out.map(f => f.path)).size !== out.length) return { files: [], error: 'DUPLICATE_FILE' };
  return { files: out, error: null };
}

export function buildPrompt({ task, context = [] }) {
  return [
    'You are writing code for a Node.js (>=22, ESM .mjs, no dependencies) project called web-harness. Tests use node:test and node:assert/strict and run with `node --test "test/**/*.test.mjs"`.',
    `TASK: ${task}`,
    'Return COMPLETE file contents (not diffs) for every file you create or change. Put EACH file in its own fenced code block (triple backticks), and inside that code block the first line must be the marker line and the last line the end marker, like this:',
    '```\n=== FILE: src/path/name.mjs ===\n<entire file content>\n=== END FILE ===\n```',
    'The markers MUST be inside the code block (chat rendering mangles quotes and indentation outside code blocks).',
    'Paths are relative to the harness/ directory and must start with src/, test/, docs/ or scripts/. Include at least one new test file under test/. Do not modify src/core/send.mjs, src/core/journal.mjs, src/interface/approval.mjs, src/interface/standing.mjs, src/interface/target.mjs. Keep it small. No prose outside the file blocks except one short summary line at the top.',
    ...context.map(f => `--- existing file ${f.path} ---\n${f.content}\n--- end ${f.path} ---`),
  ].join('\n\n');
}

// Only the failing tests matter to the model: keep "not ok"/✖ blocks and error lines, not the passing list.
export function failureSummary(output, limit = 3500) {
  const lines = String(output).split('\n'); const keep = [];
  lines.forEach((l, i) => { if (/^\s*(not ok|✖)|Error|ERR_|expected|actual|SyntaxError|at .*\.test\.mjs/.test(l)) keep.push(...lines.slice(i, i + (/^\s*(not ok|✖)/.test(l) ? 6 : 1))); });
  const text = [...new Set(keep)].join('\n') || String(output).slice(-limit);
  return text.slice(0, limit);
}

export function retryPrompt({ error, testOutput }) {
  return [`Your previous answer did not pass: ${error}.`, testOutput ? `Failing test output:\n${failureSummary(testOutput)}` : '', 'Reply again with the COMPLETE corrected files, each in its own fenced code block with the === FILE: path === and === END FILE === markers as the first and last lines inside the block.'].filter(Boolean).join('\n\n');
}

const sha = s => createHash('sha256').update(s).digest('hex').slice(0, 12);

// deps: ask({prompt, threadUrl, first}) -> {requestId,status,reply,threadUrl,provider,model}; writeFiles(files); restore();
//       runTests() -> {ok, output}; commit({message, files}); openPr({title, body}) -> url
export async function runBuild({ task, context = [], deps, maxSends = MAX_SENDS, log = () => {} }) {
  const sends = []; let threadUrl = 'new'; let prompt = buildPrompt({ task, context });
  for (let i = 0; i < maxSends; i++) {
    const r = await deps.ask({ prompt, threadUrl, first: i === 0 });
    sends.push({ requestId: r.requestId, provider: r.provider, model: r.model, status: r.status, threadUrl: r.threadUrl ?? threadUrl });
    log(`send ${i + 1}: ${r.provider}:${r.model?.id ?? r.model ?? '?'} ${r.status} ${r.threadUrl ?? ''}`);
    if (r.status !== 'complete') return { ok: false, reason: `SEND_${String(r.status).toUpperCase()}`, sends }; // never resend
    if (!r.threadUrl) return { ok: false, reason: 'THREAD_URL_UNKNOWN', sends };
    threadUrl = r.threadUrl;
    const parsed = parseFiles(r.reply);
    if (parsed.error) { log(`parse: ${parsed.error}`); prompt = retryPrompt({ error: parsed.error }); continue; }
    await deps.restore(); await deps.writeFiles(parsed.files);
    const t = await deps.runTests();
    if (!t.ok) { log('tests failed'); await deps.restore(); prompt = retryPrompt({ error: 'tests failed', testOutput: t.output }); continue; }
    const last = sends.at(-1);
    const provenance = { task, provider: last.provider, model: last.model?.id ?? last.model ?? null, threadUrl, sends: sends.map(s => s.requestId), files: parsed.files.map(f => ({ path: f.path, sha256: sha(f.content), lines: f.content.split('\n').length - 1 })), tests: t.summary ?? null };
    await deps.commit({ message: `build: ${task.slice(0, 60)}\n\nWritten by ${provenance.provider}:${provenance.model} (${threadUrl})\nRequests: ${provenance.sends.join(', ')}`, files: parsed.files });
    const prUrl = await deps.openPr({ title: `build: ${task.slice(0, 60)}`, body: prBody(provenance) });
    return { ok: true, sends, provenance, prUrl };
  }
  await deps.restore();
  return { ok: false, reason: 'RETRIES_EXHAUSTED', sends };
}

export function prBody(p) {
  return [`Built by \`wh build\` from a web-app model reply. **Review the diff before merging**; nothing here is merged automatically.`, '', `- Task: ${p.task}`, `- Provider/model: \`${p.provider}:${p.model}\``, `- Thread: ${p.threadUrl}`, `- Harness requests: ${p.sends.join(', ')}`, `- Tests: ${p.tests ?? 'green'}`, '', '| File | sha256 | lines |', '|---|---|---|', ...p.files.map(f => `| \`${f.path}\` | ${f.sha256} | ${f.lines} |`)].join('\n');
}
