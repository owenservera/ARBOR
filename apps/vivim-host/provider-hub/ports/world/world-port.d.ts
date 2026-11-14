/** Adapter shape only. Production authority must remain in the existing Host World. */
export declare const WORLD_PORT_SCHEMA: 'arbor.provider-hub.world-port/1';
export declare const MOCK_MODE: 'MOCK_ONLY';
export declare const MOCK_RECEIPT: 'MOCK_RECEIPT';
export type WorldCapability = 'stream.read' | 'evidence.commit';
export type WorldMode = 'MOCK_ONLY' | 'HOST_INJECTED';
export type WorldContext = Readonly<{
  worldId: string; principalRef: string; providerId: string; accountRef: string;
  accountEpoch: number; origin: string; grantRef: string;
}>;
export type WorldGrantFixture = WorldContext & Readonly<{
  schema: typeof WORLD_PORT_SCHEMA; scopes: readonly WorldCapability[]; expiresAt: string;
}>;
export type WorldEvidence = Readonly<{
  sourceRef: string; sourceRevision: string; digest: string; observedAt: string;
  coverage: 'COMPLETE' | 'PARTIAL' | 'UNAVAILABLE';
  gapCodes: readonly ('E2EE_UNAVAILABLE' | 'HISTORY_GAP' | 'OFFLINE' | 'EXPORT_CORRUPT' | 'REDACTED')[];
}>;
export type GrantDecision = Readonly<{
  schema: typeof WORLD_PORT_SCHEMA; mode: WorldMode; decision: 'ALLOWED' | 'DENIED'; reason: string | null;
}>;
export type WorldMockReceipt = Readonly<{
  schema: typeof WORLD_PORT_SCHEMA; mode: 'MOCK_ONLY'; kind: 'MOCK_RECEIPT';
  worldId: string; principalRef: string; providerId: string; accountRef: string;
  accountEpoch: number; idempotencyKey: string;
  status: 'DENIED' | 'MOCK_APPLIED' | 'PARTIAL' | 'UNCERTAIN' | 'NOT_FOUND';
  code: string | null; revision: number | null;
  replayed?: boolean; evidenceRef?: string; coverage?: WorldEvidence['coverage'];
  gaps?: WorldEvidence['gapCodes']; deduplicated?: boolean;
}>;
export interface WorldPort {
  readonly schema: typeof WORLD_PORT_SCHEMA;
  readonly mode: WorldMode;
  checkGrant(input: {context: WorldContext; capability: WorldCapability}): GrantDecision;
  commitEvidence(input: {context: WorldContext; evidence: WorldEvidence;
    expectedRevision: number; idempotencyKey: string}): WorldMockReceipt;
  readEvidence(input: {context: WorldContext; cursor?: number; limit?: number}):
    Readonly<{schema: typeof WORLD_PORT_SCHEMA; mode: WorldMode; status: string;
      items: readonly WorldEvidence[]; revision?: number; nextCursor: number | null; code?: string}>;
  readReceipt(input: {context: WorldContext; idempotencyKey: string}): WorldMockReceipt;
}
export declare function assertWorldPort<T extends WorldPort>(port: T): T;
export declare function validateWorldContext(input: unknown): WorldContext;
export declare function validateWorldGrant(input: unknown): WorldGrantFixture;
export declare function validateWorldEvidence(input: unknown): WorldEvidence;
export declare function createFakeWorldPort(input: {
  grants: readonly WorldGrantFixture[]; clock: () => string;
}): Readonly<{
  port: WorldPort & {readonly mode: 'MOCK_ONLY'};
  /** Test-fixture controls only; not part of WorldPort, never wire to live. */
  scenario: Readonly<{
    revoke(grantRef: string): void;
    switchAccount(input: Omit<WorldContext,'origin'|'grantRef'>): void;
    fault(idempotencyKey: string, kind: 'OFFLINE_BEFORE_CLAIM' | 'UNCERTAIN_AFTER_CLAIM'): void;
  }>;
}>;
