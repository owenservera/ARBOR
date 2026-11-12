// Host M1C: conservative, read-only explanation of the latest locally observed command.
// Never infer provider delivery, live Chrome state, or phone display from queue status.
const make = (severity, code, title, detail, nextAction, commandId = null) =>
  ({ severity, code, title, detail, nextAction, commandId });

export function diagnoseHost({ journey, services, bridge } = {}) {
  if (journey?.state === 'unavailable' || bridge?.state === 'unavailable') {
    return make('warning', 'LOCAL_EVIDENCE_UNAVAILABLE', 'Local activity needs attention',
      'The Host cannot read all local bridge evidence. No conclusion about the last AI send is possible.',
      'Check the private Studio data folder and its read permissions. Do not resend to test the connection.');
  }
  const latest = journey?.recent?.[0];
  const relay = services?.relay?.state ?? 'unknown';
  const chat = services?.chatWorker?.state ?? 'unknown';
  if (!latest) {
    if (relay === 'online' && chat === 'online')
      return make('neutral', 'NO_LOCAL_ACTIVITY', 'Workers reporting, no messages observed',
        'Both workers have fresh local heartbeats, but this data folder contains no bridge commands.',
        'Check whether the phone used this Host and whether the cloud queue accepted the message.');
    return make('unknown', 'NO_LOCAL_ACTIVITY', 'Waiting for connection evidence',
      'No bridge commands are visible in this data folder. This does not prove that the PC or Vercel relay is offline.',
      'Confirm the Host uses the same Studio data folder as the running relay and chat worker.');
  }
  const id = latest.id;
  if (latest.currentStage === 'send_outcome_uncertain')
    return make('warning', 'UNCERTAIN_SEND', 'AI send outcome is uncertain',
      'The harness journal indicates an uncertain send. It may have reached the provider.',
      'Inspect the original request and exact browser thread. Never automatically resend it.', id);
  if (latest.status === 'failed')
    return make('warning', 'LOCAL_COMMAND_FAILED', 'The latest command failed',
      latest.evidence?.cloudUpdateAccepted ? 'The cloud relay accepted the failure status; the phone may not have displayed it.' : 'The failure is recorded locally; cloud acknowledgement is not confirmed.',
      'Inspect the original request before choosing any new action; do not automatically retry.', id);
  if (latest.status === 'done' && latest.evidence?.cloudUpdateAccepted)
    return make('info', 'CLOUD_UPDATE_ACCEPTED', 'Reply update accepted by cloud',
      'The local reply reached the relay endpoint. Whether the phone displayed it is not verified.',
      'If the phone is still blank, check its polling, pairing session and conversation selection.', id);
  if (latest.status === 'done')
    return make('warning', 'CLOUD_UPDATE_PENDING', 'Reply is ready, awaiting relay acknowledgement',
      'The local command completed, but the cloud relay has not acknowledged this revision.',
      'Check the relay worker heartbeat and its last sync error; do not send the prompt again.', id);
  if (latest.status === 'queued') {
    if (latest.consumer === 'harness' && (chat === 'stale' || chat === 'blocked'))
      return make('warning', 'CHAT_WORKER_NOT_HEALTHY', 'Message waiting for the chat worker',
        'The command reached the local queue, but the chat worker is not reporting healthy cycles.',
        'Inspect the chat worker process. Do not start a competing worker or resend the queued message.', id);
    if (latest.consumer === 'harness' && chat === 'unknown')
      return make('unknown', 'CHAT_WORKER_NOT_VERIFIED', 'Message queued; chat worker not verified',
        'The command reached the PC. No fresh heartbeat proves that the chat consumer is processing the queue.',
        'Confirm the existing chat worker is running and uses this same Studio data folder.', id);
    return make('neutral', 'LOCAL_QUEUE_WAITING', 'Message queued on this PC',
      'The command is in the local bridge queue and has not been claimed.',
      'Watch the worker heartbeat and queue progress. Do not duplicate the message.', id);
  }
  if (latest.status === 'claimed') {
    if (latest.evidence?.journalState === 'uncertain')
      return make('warning', 'UNCERTAIN_SEND', 'AI send outcome is uncertain',
        'This claimed command has a linked uncertain journal receipt.',
        'Inspect the exact request and original browser thread; never auto-resend.', id);
    if (latest.consumer === 'harness' && chat !== 'online')
      return make('warning', 'CLAIMED_WORKER_NOT_VERIFIED', 'Command claimed; worker needs checking',
        'The command was claimed, but the chat worker does not have a fresh successful heartbeat. This is not proof the send failed.',
        'Investigate the original claimed command and process before restarting anything.', id);
    return make('neutral', 'LOCAL_COMMAND_PROCESSING', 'Command is being processed locally',
      'The command is claimed. The Host cannot yet confirm which browser stage it has reached.',
      'Watch for a journaled result; do not resend while it is claimed.', id);
  }
  return make('unknown', 'NO_CONCLUSION', 'Not enough evidence yet',
    'The latest locally observed command has no confirmed next stage.',
    'Check the relay and chat worker health signals.', id);
}
