/**
 * Type surface for the committed synthetic-only A -> B/D action-ref adapter.
 * The runtime implementation is `action-adapter.mjs`; this file only describes
 * its shape so TypeScript can check callers. It adds no runtime behaviour.
 */
export declare const ADAPTER_SCHEMA: string;

export interface InertActionVersionEntry {
  readonly alias: string;
  readonly nodeId: string;
  readonly id: string;
  readonly version: number;
  readonly inert: true;
}

export interface InertActionProjection {
  readonly schema: string;
  readonly synthetic: true;
  readonly actionVersionTable: readonly InertActionVersionEntry[];
  readonly rendererDocument: {
    readonly schema: string;
    readonly nodes: readonly unknown[];
  };
}

export declare function projectInertActionRefs(document: unknown): InertActionProjection;
