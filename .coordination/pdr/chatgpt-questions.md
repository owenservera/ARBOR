# ChatGPT architecture-question queue (oracle-owned; entry point protocol)

Lanes: drop questions here, one block each. Do NOT contact ChatGPT directly. Oracle batches + forwards via manager → chatgpt-keeper once the ARBOR transport proves (real reply receipt). Answers land back in this file + bus pointer.

Format per block:
- from: <lane>
- question: <one paragraph>
- why-strategic: <one line>
- status: queued | forwarded | answered (answer below the block)

---
