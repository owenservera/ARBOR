# ChatGPT architecture-question queue (oracle-owned; entry-point protocol)

Lanes: drop questions here, one block each. Do NOT contact ChatGPT directly.
Oracle batches + forwards via manager → chatgpt-keeper → `bun harness/bin/wh.mjs ask chatgpt` (PROVEN 2026-11-14 bfe2b9; studio broken, do not use). Read-only; owner-gated writes; no asks while owner sleeps — batching stands for wake-time.

Format per block:
- from: <lane>
- question: <one paragraph>
- why-strategic: <one line>
- status: queued | forwarded | answered (answer below the block)

---
