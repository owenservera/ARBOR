/**
 * @hq:context The action registry must expand three injected taxonomies without inventing one, and must name what it refuses
 * @hq:owner hq-agent
 * @hq:task action-registry
 * @hq:invariant every case builds a synthetic two-domain fixture; no case reads the real action taxonomy
 * @hq:invariant a defect is asserted through its problem code and its id, never through a helper's opinion
 * @hq:see hq/lib/action-registry.mjs
 */
import { describe, expect, test } from 'bun:test';
import { ACTION_STATUSES, buildActions, summarize, validate } from '../lib/action-registry.mjs';

/**
 * Two domains, two objects each, two verbs. Small enough to read in one glance,
 * and shaped so exactly one domain is wired to each verb — which is what makes
 * the wired/declared split visible without reading the implementation.
 */
function fixture({ handlers } = {}) {
  return {
    domains: [
      {
        name: 'docs',
        purpose: 'document work',
        objects: [
          { name: 'note', purpose: 'a written note' },
          { name: 'board', purpose: 'a place notes collect' },
        ],
      },
      {
        name: 'team',
        purpose: 'people work',
        objects: [
          { name: 'session', purpose: 'a working session' },
          { name: 'seat', purpose: 'an assignable seat' },
        ],
      },
    ],
    verbs: [
      { verb: 'read', purpose: 'look at', risk: 'low', mutates: false, actors: ['agent'], approval: false },
      { verb: 'publish', purpose: 'make public', risk: 'high', mutates: true, actors: ['agent', 'owner'], approval: true },
    ],
    handlers: handlers ?? {
      'docs.read': { command: 'hq docs read', note: 'read one document' },
      'team.publish': { command: 'hq team publish', note: 'publish one team object' },
    },
  };
}

/** A single well-formed action, for the validator cases where the fixture would add noise. */
function action(over = {}) {
  return {
    id: 'docs.read.note',
    domain: 'docs',
    verb: 'read',
    object: 'note',
    purpose: 'read note — document work: a written note',
    risk: 'low',
    mutates: false,
    actors: ['agent'],
    approval: false,
    status: 'declared',
    handler: null,
    ...over,
  };
}

const sum = (map) => Object.values(map).reduce((total, n) => total + n, 0);

describe('buildActions — one flat list from three injected taxonomies', () => {
  test('two domains of two objects and two verbs produce eight actions', () => {
    const actions = buildActions(fixture());

    expect(actions).toHaveLength(8);
    expect(actions.map((a) => a.id)).toEqual([
      'docs.read.note',
      'docs.read.board',
      'docs.publish.note',
      'docs.publish.board',
      'team.read.session',
      'team.read.seat',
      'team.publish.session',
      'team.publish.seat',
    ]);
    expect(new Set(actions.map((a) => a.id)).size).toBe(8);

    // Every action carries the whole contract, filled from domain, verb and handler.
    for (const action of actions) {
      expect(Object.keys(action)).toEqual([
        'id', 'domain', 'verb', 'object', 'purpose',
        'risk', 'mutates', 'actors', 'approval', 'status', 'handler',
      ]);
      expect([...ACTION_STATUSES]).toContain(action.status);
    }
  });

  test('an id reads domain, verb, object, lowercased, with hyphens kept', () => {
    const actions = buildActions({
      domains: [{ name: 'Docs', purpose: 'document work', objects: [{ name: 'Team-Session', purpose: 'a joint session' }] }],
      verbs: [{ verb: 'Read', risk: 'low', mutates: false, actors: ['agent'], approval: false }],
      handlers: {},
    });

    expect(actions.map((a) => a.id)).toEqual(['docs.read.team-session']);

    // The subject of the readable line follows the same normalized vocabulary.
    expect(actions[0].purpose).toBe('read team-session — document work: a joint session');
    expect(actions[0].domain).toBe('docs');
    expect(actions[0].verb).toBe('read');
    expect(actions[0].object).toBe('team-session');
  });

  test('a handler keyed by domain.verb makes both of its actions wired and the rest declared', () => {
    const actions = buildActions(fixture());
    const byId = Object.fromEntries(actions.map((a) => [a.id, a]));

    expect(byId['docs.read.note'].status).toBe('wired');
    expect(byId['docs.read.note'].handler).toEqual({ command: 'hq docs read', note: 'read one document' });
    expect(byId['docs.read.board'].status).toBe('wired');

    expect(byId['docs.publish.note'].status).toBe('declared');
    expect(byId['docs.publish.note'].handler).toBeNull();
    expect(byId['team.read.seat'].status).toBe('declared');

    expect(byId['team.publish.session'].status).toBe('wired');
    expect(byId['team.publish.session'].handler.command).toBe('hq team publish');

    expect(actions.filter((a) => a.status === 'wired')).toHaveLength(4);
    expect(actions.filter((a) => a.status === 'declared')).toHaveLength(4);

    // Risk, mutation, actors and approval come from the verb, not from the domain.
    expect(byId['docs.publish.board']).toMatchObject({ risk: 'high', mutates: true, actors: ['agent', 'owner'], approval: true });
    expect(byId['team.read.seat']).toMatchObject({ risk: 'low', mutates: false, actors: ['agent'], approval: false });
  });

  test('an object name colliding across domains is fine, but a repeat inside one domain throws', () => {
    const shared = {
      domains: [
        { name: 'docs', purpose: 'document work', objects: [{ name: 'note', purpose: 'a written note' }] },
        { name: 'team', purpose: 'people work', objects: [{ name: 'note', purpose: 'a shared note' }] },
      ],
      verbs: [{ verb: 'read', risk: 'low', mutates: false, actors: ['agent'], approval: false }],
      handlers: {},
    };
    expect(buildActions(shared).map((a) => a.id)).toEqual(['docs.read.note', 'team.read.note']);

    const duplicated = {
      domains: [{ name: 'docs', purpose: 'document work', objects: [{ name: 'note', purpose: 'one' }, { name: 'note', purpose: 'two' }] }],
      verbs: [{ verb: 'read', risk: 'low', mutates: false, actors: ['agent'], approval: false }],
      handlers: {},
    };

    let thrown = null;
    try {
      buildActions(duplicated);
    } catch (error) {
      thrown = error;
    }
    expect(thrown).toBeInstanceOf(Error);
    expect(thrown.message).toMatch(/duplicate action id "docs\.read\.note"/);
    expect(thrown.code).toBe('DUPLICATE_ACTION_ID');
    expect(thrown.domain).toBe('docs');

    // Two verbs that normalize to the same segment collide for the same reason.
    expect(() => buildActions({
      domains: [{ name: 'docs', purpose: 'document work', objects: [{ name: 'note', purpose: 'a written note' }] }],
      verbs: [
        { verb: 'read', risk: 'low', mutates: false, actors: ['agent'], approval: false },
        { verb: 'Read', risk: 'low', mutates: false, actors: ['agent'], approval: false },
      ],
      handlers: {},
    })).toThrow(/duplicate action id/);
  });
});

describe('summarize — every map partitions the list', () => {
  test('each map sums back to the total', () => {
    const actions = buildActions(fixture());
    const summary = summarize(actions);

    expect(summary.total).toBe(8);
    expect(summary.byStatus).toEqual({ declared: 4, wired: 4 });
    expect(summary.byDomain).toEqual({ docs: 4, team: 4 });
    expect(summary.byRisk).toEqual({ high: 4, low: 4 });
    expect(summary.byActor).toEqual({ agent: 4, 'agent+owner': 4 });

    for (const map of [summary.byStatus, summary.byDomain, summary.byRisk, summary.byActor]) {
      expect(sum(map)).toBe(summary.total);
    }
  });

  test('an action with no actor still lands in a bucket, so the total stays reconcilable', () => {
    const summary = summarize([action(), action({ id: 'docs.read.board', actors: [] })]);

    expect(summary.total).toBe(2);
    expect(summary.byActor).toEqual({ '(none)': 1, agent: 1 });
    expect(sum(summary.byActor)).toBe(summary.total);
  });
});

describe('validate — naming the defect, not just failing', () => {
  test('a clean list is ok with no problems', () => {
    const actions = buildActions(fixture());
    const verdict = validate(actions);

    expect(verdict.ok).toBe(true);
    expect(verdict.problems).toEqual([]);
    // A read-only action is not a defect: `mutates: false` is a valid boolean claim.
    expect(actions.some((a) => a.mutates === false)).toBe(true);
  });

  test('duplicate ids, a missing actor, unapproved high risk and a non-boolean mutates are each named', () => {
    const verdict = validate([
      action(),
      action(), // same id twice
      action({ id: 'docs.read.board', actors: [] }),
      action({ id: 'docs.publish.note', risk: 'high', mutates: true, approval: false }),
      action({ id: 'team.read.seat', mutates: 'false' }),
    ]);

    expect(verdict.ok).toBe(false);
    expect(verdict.problems.map((p) => p.code)).toEqual([
      'duplicate-id',
      'no-actor',
      'high-risk-without-approval',
      'mutates-not-boolean',
    ]);
    expect(verdict.problems.map((p) => p.id)).toEqual([
      'docs.read.note',
      'docs.read.board',
      'docs.publish.note',
      'team.read.seat',
    ]);
    for (const problem of verdict.problems) expect(problem.detail.length).toBeGreaterThan(0);
  });

  test('each defect on its own is enough to fail the list', () => {
    const cases = [
      ['duplicate-id', [action(), action()]],
      ['no-actor', [action({ actors: undefined })]],
      ['high-risk-without-approval', [action({ risk: 'high' })]],
      ['mutates-not-boolean', [action({ mutates: 0 })]],
    ];

    for (const [code, list] of cases) {
      const verdict = validate(list);
      expect(verdict.ok).toBe(false);
      expect(verdict.problems.map((p) => p.code)).toEqual([code]);
    }

    // Approval must be a real `true`: a truthy stand-in does not open the gate.
    expect(validate([action({ risk: 'high', approval: 'yes' })]).problems.map((p) => p.code))
      .toEqual(['high-risk-without-approval']);
    expect(validate([action({ risk: 'HIGH', approval: true })]).ok).toBe(true);
  });
});
