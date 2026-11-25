# VIVIM MCP — bounded session listening (R001)

## Implemented
- `vivim_session_wait` accepts an owned session ID, stdout/stderr byte cursors and a wait budget of 250–20000 milliseconds.
- Returns immediately on new bytes, cursor gaps, read failure or process termination; otherwise returns a timeout snapshot. Continue from each channel's `next` cursor. Preserve the gap and read-failure flags; never treat missing bytes as delivered.
- Uses existing authenticated Host session-output reads, rechecks the local grant, limits simultaneous waits to four, and never starts, cancels or replays an effect.
- Private stdio transport permits bounded read-only waits alongside serialized normal tools. Existing maintenance admission and session ownership remain authoritative.
- Implementation is in the incumbent Node MCP transport, not a new execution engine. Native Rust Host event delivery is the next architectural evolution.

## Five-minute listener contract
A client sets one monotonic deadline, repeatedly calls session_wait using min(20000, remaining milliseconds), advances both cursors, and stops on terminal state or deadline. A final short remainder below 250 ms can use a normal output read or terminate. The listener deadline is independent of the underlying job deadline. Never cancel the job merely because a listener expires unless the user explicitly requested it.

## Acceptance boundaries
Unit/transport regression and local Host output readback do not prove unsolicited event delivery to ChatGPT. The currently exposed MCP catalog must be refreshed and live call behavior verified. MCP tool responses can be consumed only while the client is actively invoking tools; a Host event cannot independently wake an ended ChatGPT turn. True wake/resume needs an explicitly supported client event/agent integration; do not simulate that claim by leaving a local process running. No credentials, public listener or new execution authority are introduced.

## Verification
Run the MCP test files with node --test, including workstation-tunnel.test.cjs and tunnel-readonly.test.cjs. Test output, quiet timeout, terminal state, foreign session rejection, grant revocation, and nonblocking ping while a wait is outstanding. A real five-minute heartbeat job is a separate live acceptance check.
