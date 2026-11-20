# File: harness/src/interface/dev-auto-approve.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | harness/src/interface/dev-auto-approve.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 1431 B |
| Lines | 22 |
| Hash | 1afd853ef377 |
| Test | no |
| Generated | no |
| Component | harness |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| DEV_AUTO_APPROVE_ENV | const | 5 | yes | export const DEV_AUTO_APPROVE_ENV = &#39;VIVIM_DEV_AUTO_APPROVE&#39;; |
| devAutoApprove | function | 7 | yes | export const devAutoApprove = (env = process.env) =&gt; env?.[DEV_AUTO_APPROVE_ENV] === &#39;1&#39;; |
| confirmAndApprove | function | 10 | yes | export async function confirmAndApprove({ approvals, requestId, env = process.env, isTTY = !!(process.stdin.isTTY &amp;&amp; process.stdout.isTTY), prompt, log = console.log }) { |
| answer | const | 16 | no | const answer = await prompt(&#39;Type the requestId to confirm: &#39;); |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [harness/bin/wh.mjs](../../bin/wh.mjs.md) | ../src/interface/dev-auto-approve.mjs |
| [harness/src/interface/router.mjs](./router.mjs.md) | ./dev-auto-approve.mjs |
| [harness/src/interface/standing.mjs](./standing.mjs.md) | ./dev-auto-approve.mjs |
| [harness/test/interface/dev-auto-approve.test.mjs](../../test/interface/dev-auto-approve.test.mjs.md) | ../../src/interface/dev-auto-approve.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
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
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
