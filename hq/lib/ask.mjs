// hq/lib/ask.mjs — deterministic natural-language router for the Owner surface.
// No model, no network: patterns route to an HQ command plus arguments.
import { toPosix } from './util.mjs';

const RULES = [
  {
    intent: 'catchup',
    patterns: [/what (did|have) i (work|do)/i, /catch me up/i, /what happened/i],
    command: 'brief',
    args: { since: '7d' },
    explanation: 'Summarise recent work across your spaces.',
  },
  {
    intent: 'changes',
    patterns: [/what changed/i, /what'?s new/i, /recent changes/i, /diff since/i],
    command: 'since',
    args: { ref: 'yesterday' },
    explanation: 'Show what changed recently.',
  },
  {
    intent: 'attention',
    patterns: [/what needs attention/i, /is anything (broken|wrong|stale)/i, /what should i fix/i, /health/i],
    command: 'brief',
    args: { attention: true },
    explanation: 'List items that need attention.',
  },
  {
    intent: 'next',
    patterns: [/what should i do next/i, /next step/i, /where do i start/i],
    command: 'brief',
    args: { next: true },
    explanation: 'Suggest the next action.',
  },
  {
    intent: 'impact',
    patterns: [/what depends on/i, /what breaks if i change/i, /blast radius/i, /impact of/i],
    command: 'impact',
    args: {},
    explanation: 'Show transitive dependents.',
  },
  {
    intent: 'deps',
    patterns: [/who imports/i, /what does .* import/i, /dependencies of/i],
    command: 'deps',
    args: {},
    explanation: 'Show dependency edges.',
  },
  {
    intent: 'run',
    patterns: [/how do i run/i, /how to start/i, /run command/i],
    command: 'file',
    args: { kind: 'runbook' },
    explanation: 'Find run instructions from the project manifest and README.',
  },
  {
    intent: 'test',
    patterns: [/how do i test/i, /which tests/i, /test command/i],
    command: 'file',
    args: { kind: 'test' },
    explanation: 'Find test instructions and nearby tests.',
  },
  {
    intent: 'remember',
    patterns: [/^remember (that )?/i, /^save (a )?note/i, /^note (that )?/i],
    command: 'note',
    args: { action: 'add' },
    explanation: 'Save a note in Recent memory.',
  },
  {
    intent: 'recall',
    patterns: [/what do i know about/i, /remind me/i, /recall/i, /my notes on/i],
    command: 'recall',
    args: {},
    explanation: 'Search your saved notes.',
  },
  {
    intent: 'learn',
    patterns: [/what should i learn/i, /what should i improve/i, /suggest/i],
    command: 'brief',
    args: { suggestions: true },
    explanation: 'Suggest documentation, tests, and cleanup.',
  },
  {
    intent: 'docs',
    patterns: [/where are the docs/i, /documentation for/i, /find docs/i, /how does .* work/i],
    command: 'search',
    args: { kind: 'doc' },
    explanation: 'Search documentation.',
  },
];

const FILE_PATTERN = /(?:explain|open|show|what is|tell me about)\s+([A-Za-z0-9_./\\-]+\.[A-Za-z0-9]+)/i;
const SYMBOL_PATTERN = /(?:explain|find|where is|show me)\s+(?:the\s+)?(?:symbol\s+)?([A-Za-z_$][\w$]*)/i;

export function routeAsk(question, { audience = 'owner' } = {}) {
  const q = String(question ?? '').trim();
  if (!q) {
    return {
      schema: 'hq.ask/1', question: q, intent: 'unknown', command: null, args: {},
      confidence: 0, audience, explanation: 'Ask a question about your spaces, changes, or notes.',
    };
  }

  const fileMatch = q.match(FILE_PATTERN);
  if (fileMatch) {
    return {
      schema: 'hq.ask/1', question: q, intent: 'explain-file', command: 'file',
      args: { path: toPosix(fileMatch[1]) }, confidence: 0.95, audience,
      explanation: 'Explain one file and its relationships.',
    };
  }

  for (const rule of RULES) {
    if (rule.patterns.some((re) => re.test(q))) {
      const args = { ...rule.args };
      if (rule.intent === 'remember') args.text = q.replace(/^(remember|save|note)\s+(that\s+)?/i, '').trim();
      if (rule.intent === 'recall') args.query = q.replace(/^(what do i know about|remind me about|recall|my notes on)\s*/i, '').trim();
      if (rule.intent === 'impact' || rule.intent === 'deps') {
        const m = q.match(/(?:on|of|imports?)\s+([A-Za-z0-9_./\\-]+)/i)
          || q.match(/([A-Za-z0-9_./\\-]+\.[A-Za-z0-9]+)/);
        if (m) args.target = toPosix(m[1]);
      }
      return {
        schema: 'hq.ask/1', question: q, intent: rule.intent, command: rule.command,
        args, confidence: 0.85, audience, explanation: rule.explanation,
      };
    }
  }

  const symbolMatch = q.match(SYMBOL_PATTERN);
  if (symbolMatch && symbolMatch[1].length > 2) {
    return {
      schema: 'hq.ask/1', question: q, intent: 'find-symbol', command: 'find',
      args: { query: symbolMatch[1] }, confidence: 0.6, audience,
      explanation: 'Search for a symbol by name.',
    };
  }

  return {
    schema: 'hq.ask/1', question: q, intent: 'search', command: 'search',
    args: { query: q }, confidence: 0.4, audience,
    explanation: 'Search code, docs, and notes for the question.',
  };
}
