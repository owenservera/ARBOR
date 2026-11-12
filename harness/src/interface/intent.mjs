// Intent classification for user change prompts.
// Classifies what kind of automation the user is asking for, where it should
// execute (local PC, mobile app, or AI webapp), and the domain it touches.
// Pure: no browser, no network, no filesystem. Heuristics only; confidence is
// deliberately modest so callers treat ambiguous input as needing clarification.
export const INTENT_TYPES = Object.freeze(['code-change', 'ui-change', 'data-task', 'webapp-chat', 'mobile-task', 'pc-task', 'question']);
export const EXECUTION_TARGETS = Object.freeze(['local-pc', 'mobile-app', 'webapp', 'auto']);
export const DOMAINS = Object.freeze(['code', 'ui', 'data', 'media', 'general']);

const PC = /\b(windows|pc|computer|desktop|laptop|local machine|localhost|file system|filesystem|folder|directory|\.env|env file|registry|powershell|cmd\.exe|task scheduler|startup|boot)\b/i;
const MOBILE = /\b(mobile|phone|android|ios|iphone|app\b|tablet|handset|device)\b/i;
const CODE = /\b(implement|write (the )?code|add a (feature|function|endpoint)|fix the bug|refactor|make the change|write a patch|edit (the |a )?file|create (a |an )?(component|endpoint|route|api)|diff|pull request|merge|commit|build|deploy|test|lint|typescript|javascript|python|react|node|bash|script|shell)\b/i;
const UI = /\b(ui|interface|layout|theme|background|color|palette|font|typography|spacing|responsive|dashboard|screen|page|component|widget|visual|style|css|dark mode|light mode)\b/i;
const DATA = /\b(data|database|query|sql|export|import|csv|json|spreadsheet|table|record|row|schema|migration|backup|restore|analytics|metric|log)\b/i;
const MEDIA = /\b(image|photo|video|audio|picture|generate|create an|draw|illustrate|mockup|wireframe)\b/i;
const MEDIAS = Object.freeze([MEDIA]);
const QUESTION_END = /\?\s*$/;

function containsAny(text, res) { return res.some(r => r.test(text)); }

export function classifyIntent({ task = '', role = null, constraints = {} } = {}) {
  const text = String(task ?? '');
  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();

  let intentType = 'webapp-chat';
  let executionTarget = 'webapp';
  let domain = 'general';
  let confidence = 0.45;
  const reasons = [];

  // Strongest signal: explicit role from the caller.
  if (role) {
    const roleMap = { implementer: 'code-change', reviewer: 'code-change', copywriter: 'webapp-chat', designer: 'ui-change', analyst: 'data-task' };
    if (roleMap[role]) { intentType = roleMap[role]; confidence += 0.2; reasons.push(`role ${role} implies ${intentType}`); }
  }

  // Domain & intent heuristics.
  if (containsAny(lower, [CODE])) {
    intentType = 'code-change';
    domain = 'code';
    executionTarget = 'local-pc';
    confidence += 0.25;
    reasons.push('code-change keywords');
    if (containsAny(lower, [UI])) { domain = 'code'; reasons.push('UI mentioned within code change'); }
  } else if (containsAny(lower, [UI])) {
    intentType = 'ui-change';
    domain = 'ui';
    executionTarget = 'webapp';
    confidence += 0.2;
    reasons.push('UI/visual keywords');
  } else if (containsAny(lower, [DATA])) {
    intentType = 'data-task';
    domain = 'data';
    executionTarget = 'local-pc';
    confidence += 0.2;
    reasons.push('data-task keywords');
  } else if (containsAny(lower, MEDIAS)) {
    intentType = 'webapp-chat';
    domain = 'media';
    executionTarget = 'webapp';
    confidence += 0.15;
    reasons.push('media/generation keywords');
  }

  // Execution target overrides from explicit PC/mobile signals.
  if (containsAny(lower, [PC])) {
    executionTarget = 'local-pc';
    confidence += 0.15;
    reasons.push('PC/local keywords');
  }
  if (containsAny(lower, [MOBILE])) {
    executionTarget = 'mobile-app';
    confidence += 0.15;
    reasons.push('mobile keywords');
  }
  // If both PC and mobile are mentioned, prefer the one that matches the intent domain.
  if (containsAny(lower, [PC]) && containsAny(lower, [MOBILE])) {
    executionTarget = 'auto';
    confidence -= 0.1;
    reasons.push('both PC and mobile mentioned -> auto target');
  }

  // Short question -> webapp chat.
  if (trimmed.length <= 160 && QUESTION_END.test(trimmed) && intentType === 'webapp-chat') {
    confidence += 0.1;
    reasons.push('short question');
  }

  // Long, detailed text without strong domain keywords -> research-ish chat.
  if (text.length > 300 && intentType === 'webapp-chat') {
    confidence += 0.05;
    reasons.push('long-form text');
  }

  confidence = Math.min(0.98, Math.max(0.25, confidence));

  return {
    intentType,
    executionTarget,
    domain,
    confidence: Math.round(confidence * 100) / 100,
    reasoning: reasons.length ? reasons.join('; ') : 'no strong signal, default webapp chat',
    taskLength: trimmed.length
  };
}
