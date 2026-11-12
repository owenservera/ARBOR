// Development-mode send approval (owner decision, 2026-10-30): when VIVIM_DEV_AUTO_APPROVE=1 the human
// approval step is skipped so agents can send. Off by default, and exactly "1" turns it on (not "true", not "0").
// This only replaces WHO approves. Every send check (draft-present block, exact thread binding, attribution,
// no-resend after uncertainty) still runs in sendOnce.
export const DEV_AUTO_APPROVE_ENV = 'VIVIM_DEV_AUTO_APPROVE';

export const devAutoApprove = (env = process.env) => env?.[DEV_AUTO_APPROVE_ENV] === '1';

// Backs `wh approve <id>`: interactive terminal + typed requestId normally; no prompt when the dev flag is on.
export async function confirmAndApprove({ approvals, requestId, env = process.env, isTTY = !!(process.stdin.isTTY && process.stdout.isTTY), prompt, log = console.log }) {
  const record = await approvals.pending(requestId);
  if (!record) throw new Error('Pending request not found');
  log(`Provider: ${record.provider}\nThread: ${record.threadUrl}\nPreview: ${record.preview}\nCharacters: ${record.charCount}`);
  if (!devAutoApprove(env)) {
    if (!isTTY) throw new Error('Interactive terminal required');
    const answer = await prompt('Type the requestId to confirm: ');
    if (answer !== record.requestId) throw new Error('Confirmation did not match');
  }
  await approvals.approve(record.requestId);
  log('Approval recorded');
  return record;
}
