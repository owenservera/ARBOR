// Development-mode send consent (owner decision, 2026-10-30): VIVIM_DEV_AUTO_APPROVE=1 stands in for the
// second-consent flags (--accept-sends, --authorize-send). Off by default; exactly "1" turns it on.
// Mirrors harness/src/interface/dev-auto-approve.mjs (studio does not import across the harness boundary).
// Only the consent flag is replaced: --execute is still required for any live action, and the
// no-resend and exact-target rules are unchanged.
export const DEV_AUTO_APPROVE_ENV = 'VIVIM_DEV_AUTO_APPROVE';
export const devAutoApprove = (env = process.env) => env?.[DEV_AUTO_APPROVE_ENV] === '1';
