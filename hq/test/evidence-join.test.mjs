/**
 * @hq:context The evidence join must match a receipt to its outcome by requestId, say where a thread id
 *   came from, and count what it could not name — with no registry and with no throw.
 * @hq:owner channel-manager
 * @hq:task evidence-join
 * @hq:invariant a join is proved by requestId only; a matching filename or id without the matching request is a miss
 * @hq:invariant every unnamed placeholder stays visible as basis 'unknown'; nothing is guessed
 * @hq:see hq/lib/evidence-join.mjs
 * @hq:see hq/lib/comms-roof.mjs
 */
import { describe, expect, test } from 'bun:test';
import { joinEvidence, isPlaceholderThread } from '../lib/evidence-join.mjs';

const NID = 'cnp1;d=chatgpt;l=1;o=chatgpt;c=chat;';

const receipt = (over = {}) => ({
  receiptId: 'R1',
  requestId: 'q1',
  actor: { kind: 'agent', id: 'chatgpt' },
  effect: 'OK',
  thread: { before: '', after: 'uuid-1111' },
  createdAt: '2026-11-01T00:00:00.000Z',
  ...over,
});

const outcome = (over = {}) => ({ requestId: 'q1', effect: 'OK', evidenceState: 'VERIFIED', ...over });

describe('the join', () => {
  test('a receipt joins its outcome by requestId', () => {
    const { records, summary } = joinEvidence({ receipts: [receipt()], outcomes: [outcome()] });

    expect(records).toHaveLength(1);
    expect(records[0]).toEqual({
      receiptId: 'R1',
      requestId: 'q1',
      actor: 'chatgpt',
      effect: 'OK',
      storedThreadId: 'uuid-1111',
      threadId: 'uuid-1111',
      basis: 'stored',
      outcomeEffect: 'OK',
      evidenceState: 'VERIFIED',
      joinable: true,
    });
    expect(summary.joinable).toBe(1);
  });

  test('a matching filename or receipt id is not a join key', () => {
    const { records } = joinEvidence({
      receipts: [receipt()],
      outcomes: [{ id: 'R1', file: 'R1.json', requestId: 'q2', effect: 'FAILED', evidenceState: 'CLAIMED' }],
    });

    expect(records[0].joinable).toBe(false);
    expect(records[0].outcomeEffect).toBeNull();
    expect(records[0].evidenceState).toBeNull();
  });

  test('a receipt with no outcome is not joinable', () => {
    const { records, summary } = joinEvidence({
      receipts: [receipt(), receipt({ receiptId: 'R2', requestId: 'q2', thread: { after: 'uuid-2222' } })],
      outcomes: [outcome()],
    });

    expect(records.map((r) => r.joinable)).toEqual([true, false]);
    expect(summary.receipts).toBe(2);
    expect(summary.joinable).toBe(1);

    // A null requestId is not a key, so two records that both lack one do not join.
    const noRequest = joinEvidence({
      receipts: [receipt({ receiptId: 'R3', requestId: null, thread: { after: 'uuid-3333' } })],
      outcomes: [outcome({ requestId: null })],
    });
    expect(noRequest.records[0].joinable).toBe(false);
  });
});

describe('thread identity', () => {
  test('placeholder thread ids are detected', () => {
    for (const id of ['chatgpt-live-tab', 'chatgpt-main-new', 't1', 'T12', 'new', '', null, undefined]) {
      expect(isPlaceholderThread(id)).toBe(true);
    }
    expect(isPlaceholderThread('123e4567-e89b-42d3-a456-426614174000')).toBe(false);
    expect(isPlaceholderThread('chatgpt-live-tab-archive')).toBe(false);

    const { records, summary } = joinEvidence({
      receipts: [
        receipt({ receiptId: 'R1', requestId: 'q1', thread: { after: 'chatgpt-live-tab' } }),
        receipt({ receiptId: 'R2', requestId: 'q2', thread: { after: 'chatgpt-main-new' } }),
        receipt({ receiptId: 'R3', requestId: 'q3', thread: { after: 't1' } }),
        receipt({ receiptId: 'R4', requestId: 'q4', thread: { after: '' } }),
        receipt({ receiptId: 'R5', requestId: 'q5', thread: null }),
      ],
    });

    expect(records.map((r) => r.basis)).toEqual(['unknown', 'unknown', 'unknown', 'unknown', 'unknown']);
    expect(records.map((r) => r.storedThreadId)).toEqual(['chatgpt-live-tab', 'chatgpt-main-new', 't1', null, null]);
    expect(records.map((r) => r.threadId)).toEqual(['chatgpt-live-tab', 'chatgpt-main-new', 't1', null, null]);
    expect(summary).toEqual({ receipts: 5, joinable: 0, decisions: 0, stored: 0, named: 0, unknown: 5 });
  });

  test('a registry turns a placeholder into a named thread', () => {
    const registry = {
      get: (key) => ({ R1: { nid: NID }, R2: { nid: 'cnp1;d=chatgpt;l=2;o=chatgpt;c=chat;' } })[key] ?? null,
    };
    const { records, summary } = joinEvidence({
      receipts: [
        receipt({ receiptId: 'R1', requestId: 'q1', thread: { after: 'chatgpt-live-tab' } }),
        receipt({ receiptId: 'R2', requestId: 'q2', thread: { after: 'uuid-2222' } }),
      ],
      registry,
    });

    expect(records[0].basis).toBe('named');
    expect(records[0].threadId).toBe(NID);
    expect(records[0].storedThreadId).toBe('chatgpt-live-tab');
    expect(records[1].basis).toBe('stored');
    expect(records[1].threadId).toBe('uuid-2222');       // a real id is never overwritten
    expect(summary).toEqual({ receipts: 2, joinable: 0, decisions: 0, stored: 1, named: 1, unknown: 0 });
  });

  test('a registry may answer with a bare name string', () => {
    const registry = { get: () => 'named-by-string' };
    const { records } = joinEvidence({ receipts: [receipt({ thread: { after: 'chatgpt-live-tab' } })], registry });

    expect(records[0].basis).toBe('named');
    expect(records[0].threadId).toBe('named-by-string');
  });

  test('no registry yields unknown for a placeholder and nothing throws', () => {
    let join;
    expect(() => {
      join = joinEvidence({ receipts: [receipt({ thread: { after: 'chatgpt-live-tab' } })] });
    }).not.toThrow();

    expect(join.records[0].basis).toBe('unknown');
    expect(join.records[0].threadId).toBe('chatgpt-live-tab');
    expect(join.summary.unknown).toBe(1);

    // Explicit null is the same answer, not a different code path.
    expect(joinEvidence({ receipts: [receipt({ thread: null })], registry: null }).records[0].basis).toBe('unknown');
  });

  test('a registry that throws is a miss, not a crash', () => {
    const registry = { get: () => { throw new Error('registry on fire'); } };
    let join;
    expect(() => {
      join = joinEvidence({ receipts: [receipt({ thread: { after: 'chatgpt-live-tab' } })], registry });
    }).not.toThrow();

    expect(join.records[0].basis).toBe('unknown');
    expect(join.records[0].threadId).toBe('chatgpt-live-tab');
  });
});

describe('the summary', () => {
  test('summary counts equal the array lengths', () => {
    const registry = { get: (key) => (key === 'R2' ? { nid: NID } : null) };
    const receipts = [
      receipt({ receiptId: 'R1', requestId: 'q1' }),
      receipt({ receiptId: 'R2', requestId: 'q2', thread: { after: 'chatgpt-live-tab' } }),
      receipt({ receiptId: 'R3', requestId: 'q3', thread: null }),
    ];
    const outcomes = [outcome(), outcome({ requestId: 'q4' })];
    const decisions = [
      { decisionId: 'CM-001', effect: 'ACCEPTED', kind: 'send', decidedAt: '2026-11-01T00:00:00.000Z' },
      { decisionId: 'CM-002', effect: 'REFUSED', decidedAt: '2026-11-02T00:00:00.000Z' },
    ];

    const { records, decisions: rows, summary } = joinEvidence({ receipts, outcomes, decisions, registry });

    expect(records).toHaveLength(receipts.length);
    expect(rows).toHaveLength(decisions.length);
    expect(summary.receipts).toBe(records.length);
    expect(summary.decisions).toBe(rows.length);
    expect(summary.stored + summary.named + summary.unknown).toBe(records.length);
    expect(summary).toEqual({ receipts: 3, joinable: 1, decisions: 2, stored: 1, named: 1, unknown: 1 });
    expect(rows[0]).toEqual({ id: 'CM-001', effect: 'ACCEPTED', kind: 'send', at: '2026-11-01T00:00:00.000Z' });
    expect(rows[1]).toEqual({ id: 'CM-002', effect: 'REFUSED', kind: null, at: '2026-11-02T00:00:00.000Z' });
  });

  test('an empty input is an empty join', () => {
    expect(joinEvidence()).toEqual({
      records: [],
      decisions: [],
      summary: { receipts: 0, joinable: 0, decisions: 0, stored: 0, named: 0, unknown: 0 },
    });
  });
});
