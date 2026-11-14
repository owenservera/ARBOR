/** W1/D provisional typed seam. Mock only; G must reconcile with W1/A and real Host catalog. */
export const ACTION_PORT_SCHEMA: 'vivim.provider-hub.action-port/1';
export const ACTION_CONTEXT_SCHEMA: 'vivim.provider-hub.action-context/1';
export const ACTION_PLAN_SCHEMA: 'vivim.provider-hub.action-plan/1';
export const MOCK_RECEIPT_SCHEMA: 'vivim.provider-hub.mock-receipt/1';
export const MOCK_MODE: 'MOCK_ONLY';

export type SyntheticRef = string;
export type MockActionContext = {
  schema: typeof ACTION_CONTEXT_SCHEMA;
  principalRef: SyntheticRef;
  worldRef: SyntheticRef;
  providerId: string;
  accountRef: SyntheticRef;
  accountEpoch: number;
  grantVersion: number;
  sourceRevision: number;
};
export type MockActionIntent = {
  actionKind: 'message.send';
  recipientRef: SyntheticRef;
  threadRef: SyntheticRef;
  draftRef: SyntheticRef;
  draftSha256: string;
  attachmentDigests: string[];
  expectedSourceRevision: number;
  idempotencyKey: string;
};
export type MockHostSnapshot = Omit<MockActionContext, 'schema'> & {
  recipientRef: SyntheticRef;
  threadRef: SyntheticRef;
  draftSha256: string;
  grantState: 'active' | 'revoked' | 'denied';
  privacyState: 'allow' | 'hard_no';
  sessionState: 'mock_active' | 'offline' | 'unlinked';
  capabilityState: 'mock_enabled' | 'unsupported';
};
export type MockActionPlan = {
  schema: typeof ACTION_PLAN_SCHEMA;
  mode: typeof MOCK_MODE;
  planId: SyntheticRef;
  planDigest: string;
  actionKind: 'message.send';
  target: { providerId: string; accountRef: SyntheticRef; recipientRef: SyntheticRef; threadRef: SyntheticRef };
  draft: { draftRef: SyntheticRef; draftSha256: string; attachmentDigests: string[] };
  expected: { principalRef: SyntheticRef; worldRef: SyntheticRef; accountEpoch: number; grantVersion: number; sourceRevision: number };
  createdAt: string;
  expiresAt: string;
  approvalPolicy: { ownerReviewRequired: true; channels: ['desktop-owner-token']; evidence: typeof MOCK_MODE };
  replayed?: boolean;
};
export type MockReceipt = {
  schema: typeof MOCK_RECEIPT_SCHEMA;
  marker: 'MOCK_RECEIPT';
  mode: typeof MOCK_MODE;
  planId: SyntheticRef;
  planDigest: string;
  actionKind: 'message.send';
  status: 'applied' | 'failed' | 'uncertain';
  at: string;
  externalEffectPerformed: false;
  liveVerification: 'UNRUN';
  sourceRef: SyntheticRef;
  reasonCode?: string;
  replayed?: boolean;
};
export type MockActionPort = {
  schema: typeof ACTION_PORT_SCHEMA;
  mode: typeof MOCK_MODE;
  proposeAction(request: { context: MockActionContext; intent: MockActionIntent }): MockActionPlan;
  readback(request: { context: MockActionContext; planId: SyntheticRef }):
    | { schema: typeof ACTION_PORT_SCHEMA; mode: typeof MOCK_MODE; state: 'awaiting_mock_owner_review'; plan: MockActionPlan; reviewDigest: string }
    | { schema: typeof ACTION_PORT_SCHEMA; mode: typeof MOCK_MODE; planId: SyntheticRef; state: string; receipt: MockReceipt };
  approve(request: { context: MockActionContext; planId: SyntheticRef; planDigest: string; reviewDigest: string;
    approval: { channel: 'desktop-owner-token'; actor: 'mock-owner'; decision: 'approve' | 'deny' } }): MockReceipt;
  actionStatus(request: { context: MockActionContext; planId: SyntheticRef }): {
    schema: typeof ACTION_PORT_SCHEMA; mode: typeof MOCK_MODE; planId: SyntheticRef; state: string; receipt: MockReceipt | null
  };
};
export function createMockHostActionPort(dependencies: {
  /** MUST be injected by deterministic test harness; never a real authorization provider. */
  hostSnapshot: () => MockHostSnapshot;
  now: () => number;
  mockOutcome: (request: { plan: MockActionPlan; context: MockActionContext }) =>
    { kind: 'mock_applied' | 'mock_failed' | 'mock_partial' | string };
  ttlMs?: number;
}): MockActionPort;
