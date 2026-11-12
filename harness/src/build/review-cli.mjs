// `wh review <pr>`: a second model (different provider from the author) reviews the PR diff through the
// harness (approved, send-once). Verdict is posted as a PR comment; with --merge the PR is merged ONLY if
// gate() says so (tests green on the PR head AND verdict APPROVE). Uncertain/incomplete reply -> UNKNOWN,
// never resent, never merged.
import { execFileSync, spawnSync } from 'node:child_process';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { reviewPrompt, parseVerdict, reviewComment, truncateDiff, classifyFindings, severityGate, MAX_ROUNDS } from './review.mjs';
import { readdir } from 'node:fs/promises';
import { readThreadReply } from './cli.mjs';

const harness = fileURLToPath(new URL('../../', import.meta.url));
const run = (cmd, a) => execFileSync(cmd, a, { cwd: harness, encoding: 'utf8' }).trim();
export const authorFromBody = body => body?.match(/Provider\/model: `([^`]+)`/)?.[1] ?? null;

export async function reviewCommand({ router, approvals, pr, reviewer = 'chatgpt:gpt-6', ownerApproved = false, merge = false, resumeThread = null, resumeRequest = null, authorOverride = null, log = console.log }) {
  if (run('git', ['status', '--porcelain'])) throw new Error('Working tree not clean');
  const info = JSON.parse(run('gh', ['pr', 'view', String(pr), '--json', 'body,headRefName,headRefOid,baseRefName,baseRefOid,title,state']));
  if (info.state !== 'OPEN') throw new Error(`PR ${pr} is ${info.state}`);
  // Reviewer independence needs a known author: wh build PR bodies carry it; otherwise --author is required.
  const bodyAuthor = authorFromBody(info.body);
  if (bodyAuthor && authorOverride && authorOverride !== bodyAuthor) throw new Error(`--author ${authorOverride} contradicts PR body author ${bodyAuthor}`);
  const author = bodyAuthor ?? authorOverride;
  if (!author) throw new Error('Unknown PR author: pass --author <provider:model|agent>');
  if (author.split(':')[0] === reviewer.split(':')[0]) throw new Error(`Reviewer ${reviewer} must be a different provider from author ${author}`);
  // Pin review and tests to one immutable commit: the PR's head SHA (works for fork PRs via refs/pull/N/head).
  const sha = info.headRefOid;
  run('git', ['fetch', '-q', 'origin', `refs/pull/${pr}/head`]);
  if (run('git', ['rev-parse', 'FETCH_HEAD']) !== sha) throw new Error('PR head moved while reviewing; rerun');
  run('git', ['fetch', '-q', 'origin', info.baseRefOid]);
  const diff = run('git', ['diff', `${info.baseRefOid}...${sha}`]);
  // Round cap: after MAX_ROUNDS completed severity-gated reviews of this PR, report NEEDS_OWNER; send nothing.
  const round = (await priorRounds(pr)) + 1;
  if (!resumeThread && round > MAX_ROUNDS) return { pr, gate: { merge: false, reason: 'NEEDS_OWNER' }, merged: false, round, sha };
  const start = run('git', ['rev-parse', '--abbrev-ref', 'HEAD']);
  run('git', ['checkout', '-q', sha]);
  let testsOk;
  // PR test code is untrusted: run it with no network except a private loopback (user+net namespace) and a minimal environment.
  // Machine-checked result: exit status 0 and the TAP summary "# fail 0".
  try { const r = spawnSync('unshare', ['-rn', 'sh', '-c', 'ip link set lo up && exec node --test --test-reporter=tap "test/**/*.test.mjs"'], { cwd: harness, encoding: 'utf8', timeout: 300000, env: { PATH: process.env.PATH, HOME: '/nonexistent', LANG: 'C.UTF-8' } }); testsOk = r.status === 0 && /^# fail 0$/m.test(r.stdout); }
  finally { run('git', ['checkout', '-q', start]); }
  log(`tests on PR head: ${testsOk ? 'green' : 'RED'}`);
  let r, rec, req;
  if (resumeThread) {
    // A review send that landed but was journaled uncertain: read its reply; nothing is sent.
    log(`resume: reading reply in ${resumeThread} (request ${resumeRequest}); nothing is sent`);
    // Provenance: the resumed request must be this reviewer's own journaled review send, in this thread if known.
    const j = JSON.parse(await readFile(resolve(harness, '../runtime/journal', `${resumeRequest}.json`), 'utf8').catch(() => 'null'));
    const bind = JSON.parse(await readFile(resolve(harness, '../runtime/reviews', `${resumeRequest}.json`), 'utf8').catch(() => 'null'));
    if (!bind || String(bind.pr) !== String(pr) || bind.sha !== sha || (bind.reviewer && bind.reviewer !== reviewer)) throw new Error('RESUME_PROVENANCE: request was not a review of this PR at this head SHA');
    if (!j || j.provider !== reviewer.split(':')[0] || !['uncertain', 'observed'].includes(j.state) || (j.threadUrl && j.threadUrl !== resumeThread)) throw new Error('RESUME_PROVENANCE: request is not a landed review send by this reviewer in this thread');
    const rr = await readThreadReply({ providerId: reviewer.split(':')[0], threadUrl: resumeThread });
    r = { status: rr.complete ? 'complete' : 'incomplete', reply: rr.text }; rec = { threadUrl: resumeThread }; req = { requestId: resumeRequest };
  } else {
    req = await router.ask({ provider: reviewer, prompt: reviewPrompt({ task: info.title, diff, author }), threadUrl: 'new', replyTimeoutMs: 300000 });
    log(`review request ${req.requestId}${ownerApproved ? '' : ` — approve with: wh approve ${req.requestId}`}`);
    // Bind the review request to this PR + head SHA so a later --resume-thread can prove what it reviewed.
    await mkdir(resolve(harness, '../runtime/reviews'), { recursive: true }); await writeFile(resolve(harness, '../runtime/reviews', `${req.requestId}.json`), JSON.stringify({ pr: String(pr), sha, reviewer }));
    if (ownerApproved) await approvals.approve(req.requestId);
    r = await router.wait(req.requestId, 900000);
    rec = JSON.parse(await readFile(resolve(harness, '../runtime/journal', `${req.requestId}.json`), 'utf8').catch(() => '{}'));
  }
  const parsed = r.status === 'complete' ? parseVerdict(r.reply) : { verdict: 'unknown', findings: [`reply status ${r.status}; not resent`] };
  // Severity gating: only [BLOCKER] file:line findings whose cited line exists at the PR head are candidates;
  // the rest are advisory. Candidates must then be verified (or dismissed with a reason) via `wh review-decide`.
  const { blockers, advisory } = classifyFindings(parsed.findings);
  const candidates = []; for (const b of blockers) { if (lineExists(sha, b.path, b.line)) candidates.push(b); else advisory.push(`${b.text} (cited line not found at ${sha.slice(0, 7)}; advisory)`); }
  let g = severityGate({ testsOk, verdict: parsed.verdict, verified: candidates, round });
  // Fail closed in code: a truncated diff or a resumed (not freshly observed) review never auto-merges.
  if (g.merge && truncateDiff(diff).omitted) g = { merge: false, reason: 'DIFF_TRUNCATED' };
  if (g.merge && resumeThread) g = { merge: false, reason: 'RESUMED_REVIEW_NO_AUTOMERGE' };
  if (candidates.length && g.reason === 'REVIEW_BLOCK') g = { merge: false, reason: 'BLOCKERS_NEED_VERIFICATION' };
  const m = r.model ?? rec.model; const reviewerId = `${reviewer.split(':')[0]}:${m?.id ?? m ?? reviewer.split(':')[1] ?? '?'}`;
  await saveRecord(req.requestId, { v: 2, pr: String(pr), sha, reviewer: reviewerId, status: r.status, verdict: parsed.verdict, testsOk, round, candidates, advisory, truncated: Boolean(truncateDiff(diff).omitted), resumed: Boolean(resumeThread), threadUrl: rec.threadUrl ?? null });
  run('gh', ['pr', 'comment', String(pr), '--body', `${reviewComment({ reviewer: reviewerId, verdict: parsed.verdict, findings: parsed.findings, threadUrl: rec.threadUrl, requestId: req.requestId })}\n\n${severityBody({ candidates, advisory, round })}\n\nGate: ${g.reason} (tests ${testsOk ? 'green' : 'red'})\n<!-- wh-review v2 -->`]);
  if (merge && g.merge) run('gh', ['pr', 'merge', String(pr), '--merge', '--match-head-commit', sha]);
  return { pr, author, reviewer: reviewerId, verdict: parsed.verdict, candidates, advisory, round, gate: g, merged: Boolean(merge && g.merge), requestId: req.requestId, threadUrl: rec.threadUrl ?? null, sha };
}

const reviewsDir = () => resolve(harness, '../runtime/reviews');
async function saveRecord(id, data) { await mkdir(reviewsDir(), { recursive: true }); const prev = JSON.parse(await readFile(resolve(reviewsDir(), `${id}.json`), 'utf8').catch(() => '{}')); await writeFile(resolve(reviewsDir(), `${id}.json`), JSON.stringify({ ...prev, ...data }, null, 2)); }
async function priorRounds(pr) { let n = 0; for (const f of await readdir(reviewsDir()).catch(() => [])) { const x = JSON.parse(await readFile(resolve(reviewsDir(), f), 'utf8').catch(() => '{}')); if (x.v === 2 && String(x.pr) === String(pr) && x.status === 'complete' && !x.resumed) n++; } return n; }
function lineExists(sha, path, line) { try { return line >= 1 && run('git', ['show', `${sha}:harness/${path}`]).split('\n').length >= line; } catch { return false; } }
export function severityBody({ candidates, advisory, round, dismissed = [] }) {
  return [`**Severity gate** (round ${round}/${MAX_ROUNDS})`, '', '**Cited BLOCKER candidates**', ...(candidates.length ? candidates.map(b => `- #${b.id} \`${b.path}:${b.line}\` — ${b.text}`) : ['_none_']), ...(dismissed.length ? ['', '**Dismissed after verification**', ...dismissed.map(d => `- #${d.id}: ${d.reason}`)] : []), '', '**Advisory (non-blocking)**', ...(advisory.length ? advisory.map(a => `- ${a}`) : ['_none_'])].join('\n');
}

// `wh review-decide <pr> --request <id> [--dismiss "1:reason;2:reason"] [--merge]`: the reviewing agent records
// which cited BLOCKERs it verified as real. Dismissals need a reason and are posted; merge only if none remain.
export async function decideCommand({ pr, requestId, dismiss = '', merge = false }) {
  const rec = JSON.parse(await readFile(resolve(reviewsDir(), `${requestId}.json`), 'utf8').catch(() => 'null'));
  if (!rec || rec.v !== 2 || String(rec.pr) !== String(pr)) throw new Error('No severity-gated review record for this PR/request');
  const info = JSON.parse(run('gh', ['pr', 'view', String(pr), '--json', 'headRefOid,state']));
  if (info.state !== 'OPEN' || info.headRefOid !== rec.sha) throw new Error('PR head changed since the review; run a fresh review');
  const dismissed = dismiss.split(';').map(x => x.trim()).filter(Boolean).map(x => { const [id, ...r] = x.split(':'); const reason = r.join(':').trim(); if (!reason) throw new Error(`Dismissal of #${id} needs a reason`); return { id: Number(id), reason }; });
  for (const d of dismissed) if (!rec.candidates.some(b => b.id === d.id)) throw new Error(`No candidate #${d.id}`);
  const verified = rec.candidates.filter(b => !dismissed.some(d => d.id === b.id));
  let g = severityGate({ testsOk: rec.testsOk, verdict: rec.verdict, verified, round: rec.round });
  if (g.merge && rec.truncated) g = { merge: false, reason: 'DIFF_TRUNCATED' };
  if (g.merge && rec.resumed) g = { merge: false, reason: 'RESUMED_REVIEW_NO_AUTOMERGE' };
  run('gh', ['pr', 'comment', String(pr), '--body', `### Review decision (request ${requestId})\n\n${severityBody({ candidates: verified, advisory: rec.advisory, round: rec.round, dismissed })}\n\nGate: ${g.reason}\n<!-- wh-review-decision -->`]);
  if (merge && g.merge) run('gh', ['pr', 'merge', String(pr), '--merge', '--match-head-commit', rec.sha]);
  await saveRecord(requestId, { dismissed, decision: g.reason });
  return { pr, requestId, verified: verified.map(b => b.id), dismissed, gate: g, merged: Boolean(merge && g.merge) };
}
