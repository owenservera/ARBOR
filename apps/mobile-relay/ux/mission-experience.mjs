// Lane M — projection-only Outcome Experience Intelligence.
// Consumes existing Host/Studio facts. Never plans, approves, sends, retries, or persists missions.
// Usable unchanged by Node (Studio routes) and the existing Android phone's ESM UI.
export const MISSION_CARD_SCHEMA = 'vivim.mission-card/1';
const plain = v => v !== null && typeof v === 'object' && !Array.isArray(v);
const value = (v, limit = 240) => typeof v === 'string'
  ? v.replace(/\s+/g, ' ').trim().slice(0, limit) : '';
const rows = v => Array.isArray(v) ? v : [];
const completed = new Set(['ready', 'failed', 'skipped', 'stopped', 'cancelled']);
const liveActive = new Set(['created', 'remote_queued', 'claimed', 'send_authorized', 'waiting_reply']);
const stageFor = role => ({
  answer: 'Gathering information', synthesize: 'Comparing the answers',
  judge: 'Comparing the answers', critique: 'Checking the answer',
  verify: 'Checking the answer', revise: 'Refining the answer',
  improve: 'Refining the answer', planner: 'Planning the next step'
}[role] || 'Working on your request');
function card(fields) {
  return {
    schema: MISSION_CARD_SCHEMA, eta: null, mayApprove: false, mayExecute: false,
    ...fields
  };
}
// The existence of an AI answer is not independent proof of real-world completion.
export function projectOrchestratorMission(plan) {
  if (!plain(plan) || !value(plan.id, 100) || !value(plan.question, 500)) return null;
  const steps = rows(plan.steps).filter(plain);
  const done = steps.filter(step => completed.has(step.state)).length;
  const answers = steps.filter(step => step.state === 'ready' && step.valid === true).length;
  const doing = steps.find(step => ['asking', 'waiting', 'running'].includes(step.state));
  const state = value(plan.state, 30);
  const running = state === 'queued' || state === 'running';
  const partial = state === 'partial';
  const finished = state === 'complete' || partial;
  const failed = state === 'failed';
  const stopped = state === 'cancelled';
  const pickedAnswer = typeof plan.result?.answer === 'string'
    ? plan.result.answer.trim()
    : rows(plan.result?.answers).filter(a => typeof a?.answer === 'string')
      .map(a => a.answer.trim()).filter(Boolean).join('\n\n');
  const hasAnswer = finished && pickedAnswer.length > 0;
  const title = value(plan.question, 120);
  const status = failed ? 'needs-attention' : stopped ? 'stopped'
    : partial ? 'partial' : finished ? 'ready' : running ? 'working' : 'unconfirmed';
  const phase = running ? (doing ? stageFor(doing.role) : state === 'queued'
    ? 'Preparing your request' : 'Waiting for the next step') : finished
      ? 'Answer received' : failed ? 'Could not finish' : stopped ? 'Stopped' : 'Status not confirmed';
  const message = failed ? 'I could not finish this request. Check the details before trying again.'
    : stopped ? 'You stopped waiting. An earlier question might still finish in its original AI tab.'
      : partial ? 'I have part of an answer, but some steps did not finish.'
        : finished ? (hasAnswer ? 'An answer is ready for you to read.' : 'The work ended, but no answer text was provided.')
          : running ? 'I am working through the steps needed for your request.'
            : 'I cannot confirm the current state of this request.';
  return card({
    id: 'orchestrate:' + value(plan.id, 100), source: 'studio-orchestrator',
    title, status, phase, message, needsYou: failed || partial,
    action: failed || partial ? 'Review the result and any missing steps' : null,
    progress: { complete: done, total: steps.length, answered: answers },
    evidence: { sourceId: value(plan.id, 100), sourceState: state,
      answerObserved: hasAnswer, independentlyVerified: false,
      updatedAt: value(plan.updatedAt, 60) || null },
    outcome: hasAnswer ? { label: partial ? 'Partial answer' : 'Answer', text: pickedAnswer.slice(0, 6000),
      qualification: 'An AI answer was observed. Real-world results were not independently verified.' } : null,
    detail: steps.map(step => ({
      id: value(step.id, 80), stage: stageFor(step.role),
      state: value(step.state, 40), observedAnswer: step.state === 'ready' && step.valid === true
    }))
  });
}
// A completed bridge command does not imply verified external delivery.
// The receipt remains authoritative; this is only an understandable reading.
export function projectCommandMission(command) {
  if (!plain(command) || !value(command.id, 120)) return null;
  const state = value(command.status, 30);
  const status = state === 'done' ? 'recorded' : state === 'failed'
    ? 'needs-attention' : ['queued', 'claimed'].includes(state) ? 'working' : 'unconfirmed';
  const phase = state === 'queued' ? 'Waiting for your PC'
    : state === 'claimed' ? 'Your PC is handling this'
      : state === 'done' ? 'PC result recorded'
        : state === 'failed' ? 'Your PC reported a problem' : 'Status not confirmed';
  const title = value(command.request, 120) || value(command.label, 120) || 'Your request';
  return card({
    id: 'command:' + value(command.id, 120), source: 'host-command',
    title, status, phase,
    message: status === 'working' ? 'Your request is being handled. No action is indicated by this receipt.'
      : status === 'recorded' ? 'Your PC recorded completion. This alone does not confirm an outside action.'
        : status === 'needs-attention' ? 'Your PC reported that this request failed. Check its receipt before trying again.'
          : 'This receipt does not confirm the current state.',
    needsYou: status === 'needs-attention',
    action: status === 'needs-attention' ? 'Review the receipt on your PC' : null,
    progress: null, outcome: null, detail: [],
    evidence: { sourceId: value(command.id, 120), sourceState: state,
      answerObserved: false, independentlyVerified: false, updatedAt: value(command.at || command.updatedAt, 60) || null }
  });
}
export function projectLiveMission(item) {
  if (!plain(item) || !value(item.id, 120) || !liveActive.has(item.state)) return null;
  return card({
    id: 'live:' + value(item.id, 120), source: 'host-live',
    title: 'Your conversation', status: 'working',
    phase: item.state === 'waiting_reply' ? 'Waiting for an answer' : 'Preparing your conversation',
    message: 'Your PC is tracking this conversation. No action is indicated by its current state.',
    needsYou: false, action: null, progress: null, outcome: null, detail: [],
    evidence: { sourceId: value(item.id, 120), sourceState: value(item.state, 30),
      answerObserved: false, independentlyVerified: false, updatedAt: null }
  });
}
export function projectUncertainMission(item) {
  if (!plain(item) || !value(item.id, 120)) return null;
  return card({
    id: 'review:' + value(item.id, 120), source: 'host-live',
    title: 'A conversation needs review', status: 'needs-attention',
    phase: 'Send outcome not confirmed',
    message: 'Your PC cannot confirm what happened. Nothing should be sent again until its original receipt is checked.',
    needsYou: true, action: 'Open Talk and review the original receipt',
    progress: null, outcome: null, detail: [],
    evidence: { sourceId: value(item.id, 120), sourceState: value(item.state, 30),
      answerObserved: false, independentlyVerified: false, updatedAt: null }
  });
}
export function projectWorkMission(item) {
  if (!plain(item) || !value(item.id, 120)) return null;
  const status = value(item.status, 30);
  const labels = { queued: 'Ready to begin', active: 'In progress', blocked: 'Waiting for you',
    completed: 'Marked complete', cancelled: 'Stopped' };
  return card({
    id: 'work:' + value(item.id, 120), source: 'personal-agent-work',
    title: value(item.title, 120) || 'Your saved work',
    status: status === 'blocked' ? 'needs-attention' : status === 'completed' ? 'recorded'
      : status === 'cancelled' ? 'stopped' : ['queued', 'active'].includes(status) ? 'working' : 'unconfirmed',
    phase: labels[status] || 'Status not confirmed',
    message: status === 'completed' ? 'This was marked complete in your saved Work. That is not proof of execution.'
      : status === 'blocked' ? 'Your saved Work is waiting for you.'
        : 'Your saved Work is a planning record; no action runs from viewing it.',
    needsYou: status === 'blocked', action: status === 'blocked' ? value(item.nextAction, 180) || 'Review your next step' : null,
    progress: null, outcome: null, detail: [],
    evidence: { sourceId: value(item.id, 120), sourceState: status,
      answerObserved: false, independentlyVerified: false, updatedAt: value(item.updatedAt, 60) || null }
  });
}
// Presentation policy only. "Batch" never grants authority or changes an effect's risk.
export function organizeInterruptions(requests) {
  const immediate = [], batch = [], automatic = [];
  const seen = new Set();
  for (const entry of rows(requests)) {
    const projectedId = value(entry?.id, 120);
    // Deduplicate the exact ID visible in review, not an unbounded raw input.
    // Otherwise whitespace or 120-char truncation can present two different
    // underlying receipts as the same actionable card.
    if (!plain(entry) || !projectedId || seen.has(projectedId)) continue;
    seen.add(projectedId);
    // An explicit effect is review-critical unless its exact known contract
    // names a read-only/no-effect operation. Never infer harmlessness from an
    // unrecognized or malformed effect value, even when a source self-reports
    // safeAuthorized/readOnly. This only categorizes UI, never grants approval.
    const effect = value(entry.effect, 40);
    const harmlessEffect = entry.effect === undefined ||
      (typeof entry.effect === 'string' && ['none', 'read', 'read-only'].includes(effect.toLowerCase()));
    const urgent = !harmlessEffect || entry.requiresApproval === true || entry.outcomeUncertain === true
      || entry.consequential === true || entry.severity === 'critical';
    const record = { id: projectedId, reason: value(entry.reason, 300),
      requiresApproval: entry.requiresApproval === true, effect: effect || null };
    if (urgent) immediate.push(record);
    else if (entry.safeAuthorized === true && entry.readOnly === true) automatic.push(record);
    else batch.push(record);
  }
  return { immediate, batch, automatic, grants: [] };
}
export function selectTodayMission({ commands = [], live = [], reviews = [] } = {}) {
  const commandCards = rows(commands).map(projectCommandMission).filter(Boolean);
  const liveCards = rows(live).map(projectLiveMission).filter(Boolean);
  return rows(reviews).map(projectUncertainMission).find(Boolean)
    || commandCards.find(c => c.status === 'needs-attention')
    || liveCards[0] || commandCards.find(c => c.status === 'working')
    || commandCards[0] || null;
}
