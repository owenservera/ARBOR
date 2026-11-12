/**
 * @hq:context The whole action map composes: 20 domains x 10 objects x 10 verbs must build one 2000-action
 *   catalog whose ids address, whose summary partitions, whose validation is clean, whose status follows
 *   HANDLERS, and which the router can reach from a plain-English sentence.
 * @hq:owner hq-agent
 * @hq:task action-map
 * @hq:invariant the expected total is arithmetic (20 x 10 x 10), never read back from the catalog, so a
 *   shrunken taxonomy fails instead of quietly redefining success.
 * @hq:invariant wired and declared are asserted in both directions against the HANDLERS keys, so a status
 *   that disagrees with the handler table fails whichever side is wrong.
 * @hq:invariant nonsense must be NO_MATCH with an empty match list, so a plausible-looking wrong answer
 *   cannot pass as routing.
 * @hq:see hq/lib/action-registry.mjs · hq/lib/action-router.mjs · hq/lib/actions/verbs.mjs
 */
import { describe, expect, test } from 'bun:test';
import { buildActions, summarize, validate } from '../lib/action-registry.mjs';
import { NO_MATCH, describe as describeAction, route } from '../lib/action-router.mjs';
import { VERBS } from '../lib/actions/verbs.mjs';
import { DOMAINS as DOMAINS_1 } from '../lib/actions/domains-1.mjs';
import { DOMAINS as DOMAINS_2 } from '../lib/actions/domains-2.mjs';
import { DOMAINS as DOMAINS_3 } from '../lib/actions/domains-3.mjs';
import { DOMAINS as DOMAINS_4 } from '../lib/actions/domains-4.mjs';
import { HANDLERS } from '../lib/actions/handlers.mjs';
import { expand } from '../lib/actions/aliases.mjs';

const DOMAIN_FILES = [DOMAINS_1, DOMAINS_2, DOMAINS_3, DOMAINS_4];
const DOMAINS = DOMAIN_FILES.flat();
const ACTIONS = buildActions({ domains: DOMAINS, verbs: VERBS, handlers: HANDLERS });

const DOMAIN_COUNT = 20;
const OBJECTS_PER_DOMAIN = 10;
const VERB_COUNT = 10;
const ACTIONS_PER_DOMAIN = OBJECTS_PER_DOMAIN * VERB_COUNT; // 100
const EXPECTED_TOTAL = DOMAIN_COUNT * ACTIONS_PER_DOMAIN; // 2000
const ID_PATTERN = /^[a-z0-9-]+\.[a-z]+\.[a-z0-9-]+$/;

/** Handler keys normalized exactly as the registry's handlerIndex does, so casing cannot fake a match. */
const HANDLER_KEYS = new Set(Object.keys(HANDLERS ?? {}).map((key) => String(key).trim().toLowerCase()));

function countBy(list, pick) {
  const counts = new Map();
  for (const item of list) {
    const key = pick(item);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

function sumValues(map) {
  return Object.values(map ?? {}).reduce((total, value) => total + value, 0);
}

/** Accept the text (or text-bearing object) an alias expander may return, so this test pins composition, not shape. */
function asQuery(value) {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map(String).join(' ');
  if (value && typeof value === 'object') {
    for (const key of ['text', 'query', 'expanded', 'value']) {
      if (typeof value[key] === 'string') return value[key];
    }
  }
  return '';
}

describe('the catalog', () => {
  test('is exactly 2000 actions: 20 domains x 10 objects x 10 verbs', () => {
    expect(ACTIONS).toHaveLength(EXPECTED_TOTAL);
    expect(VERBS).toHaveLength(VERB_COUNT);
    expect(DOMAINS).toHaveLength(DOMAIN_COUNT);
  });

  test('every id is unique and reads domain.verb.object', () => {
    const ids = ACTIONS.map((action) => action.id);
    expect(new Set(ids).size).toBe(ids.length);

    const malformed = ids.filter((id) => !ID_PATTERN.test(id));
    expect(malformed).toEqual([]);

    const mismatched = ACTIONS
      .filter((action) => action.id !== `${action.domain}.${action.verb}.${action.object}`)
      .map((action) => action.id);
    expect(mismatched).toEqual([]);
  });

  test('every domain contributes exactly 100 actions from 10 objects', () => {
    for (let index = 0; index < DOMAIN_FILES.length; index++) {
      expect(DOMAIN_FILES[index], `domains-${index + 1}.mjs`).toHaveLength(DOMAIN_COUNT / DOMAIN_FILES.length);
    }

    const badObjects = DOMAINS
      .filter((domain) => !Array.isArray(domain?.objects) || domain.objects.length !== OBJECTS_PER_DOMAIN)
      .map((domain) => domain?.name ?? '(unnamed)');
    expect(badObjects).toEqual([]);

    const counts = countBy(ACTIONS, (action) => action.domain);
    expect(counts.size).toBe(DOMAIN_COUNT);
    expect([...counts].filter(([, count]) => count !== ACTIONS_PER_DOMAIN)).toEqual([]);
  });
});

describe('summarize', () => {
  test('partitions the 2000 actions: every map sums back to the total', () => {
    const summary = summarize(ACTIONS);
    expect(summary.total).toBe(EXPECTED_TOTAL);
    for (const field of ['byStatus', 'byDomain', 'byRisk', 'byActor']) {
      expect(sumValues(summary[field]), field).toBe(EXPECTED_TOTAL);
    }
    expect(Object.keys(summary.byDomain)).toHaveLength(DOMAIN_COUNT);
    expect(Object.keys(summary.byStatus).every((key) => key === 'wired' || key === 'declared')).toBe(true);
    expect(Object.keys(summary.byRisk).every((key) => ['low', 'medium', 'high'].includes(key))).toBe(true);
  });
});

describe('validate', () => {
  test('returns ok with an empty problems list', () => {
    const result = validate(ACTIONS);
    expect(result.ok).toBe(true);
    expect(result.problems).toEqual([]);
  });
});

describe('wiring', () => {
  test('status is wired exactly where HANDLERS has the domain.verb key', () => {
    const mismatches = [];
    for (const action of ACTIONS) {
      const handlerKey = `${action.domain}.${action.verb}`;
      const hasHandler = HANDLER_KEYS.has(handlerKey);
      const isWired = action.status === 'wired';
      if (hasHandler !== isWired) {
        mismatches.push(`${action.id}: status=${action.status} handlerKey=${handlerKey} present=${hasHandler}`);
      }
    }
    expect(mismatches).toEqual([]);

    const wired = ACTIONS.filter((action) => action.status === 'wired').length;
    const declared = ACTIONS.length - wired;
    console.log(`action-map wiring: wired=${wired} declared=${declared} handlerKeys=${HANDLER_KEYS.size}/${DOMAIN_COUNT * VERB_COUNT}`);
    expect(wired + declared).toBe(EXPECTED_TOTAL);
  });
});

describe('routing', () => {
  test('"list the seats" and "rename a conversation" match, nonsense is NO_MATCH', () => {
    for (const query of ['list the seats', 'rename a conversation']) {
      const result = route(ACTIONS, query);
      expect(result.ok, query).toBe(true);
      expect(result.matches.length, query).toBeGreaterThan(0);
    }

    const none = route(ACTIONS, 'zzz nonsense zzz');
    expect(none.ok).toBe(false);
    expect(none.code).toBe(NO_MATCH);
    expect(none.matches).toEqual([]);
  });

  test('expand yields a routeable query against the same catalog', () => {
    expect(typeof expand).toBe('function');
    const expanded = asQuery(expand('rename a conversation'));
    expect(expanded.length).toBeGreaterThan(0);

    const result = route(ACTIONS, expanded);
    expect(result.ok).toBe(true);
    expect(result.matches.length).toBeGreaterThan(0);
  });
});

describe('describe', () => {
  test('every line names its status and risk', () => {
    const wrong = [];
    for (const action of ACTIONS) {
      const line = describeAction(action);
      const parts = line.split(' · ');
      const namesFields = parts[1] === action.risk && parts[3] === action.status;
      if (!namesFields || !line.includes(action.status) || !line.includes(action.risk)) wrong.push(line);
    }
    expect(wrong).toEqual([]);
  });
});
