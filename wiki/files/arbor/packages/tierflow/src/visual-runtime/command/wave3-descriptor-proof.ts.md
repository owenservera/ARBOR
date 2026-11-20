# File: packages/tierflow/src/visual-runtime/command/wave3-descriptor-proof.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../../projects/arbor.md) |
| Path | packages/tierflow/src/visual-runtime/command/wave3-descriptor-proof.ts |
| Language | TypeScript |
| Kind | source |
| Size | 11168 B |
| Lines | 192 |
| Hash | 346c40377b31 |
| Test | no |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| sha256 | function | 13 | no | const sha256 = (text: string) =&gt; createHash(&#39;sha256&#39;).update(text, &#39;utf8&#39;).digest(&#39;hex&#39;); |
| MAX_CATALOG_BYTES | const | 14 | no | const MAX_CATALOG_BYTES = 256_000; |
| MAX_HQ_BYTES | const | 15 | no | const MAX_HQ_BYTES = 256_000; |
| RISKS | const | 16 | no | const RISKS: readonly string[] = [&#39;R0&#39;, &#39;R1&#39;, &#39;R2&#39;, &#39;R3&#39;]; |
| READINESS | const | 17 | no | const READINESS: readonly string[] = [&#39;verified&#39;, &#39;source_wired&#39;, &#39;adapter_pending&#39;, &#39;enforcement_missing&#39;, &#39;unsupported&#39;]; |
| descriptorArgsDigest | function | 20 | yes | export function descriptorArgsDigest(args: unknown): string \| null { |
| encode | function | 22 | no | const encode = (value: unknown): string =&gt; { |
| ReviewedHostBinding | type | 31 | yes | export type ReviewedHostBinding = Readonly&lt;{ |
| DescriptorProofContext | type | 44 | yes | export type DescriptorProofContext = Readonly&lt;{ |
| CatalogAction | type | 55 | no | type CatalogAction = Pick&lt;HostActionDescriptor, &#39;actionId&#39; \| &#39;risk&#39; \| &#39;readiness&#39;&gt; &amp; { |
| DescriptorCrosswalkEvidence | type | 58 | yes | export type DescriptorCrosswalkEvidence = Readonly&lt;{ |
| DescriptorProofResult | type | 69 | yes | export type DescriptorProofResult = |
| refuse | function | 73 | no | function refuse(reasonCode: string, outcome: &#39;refused&#39; \| &#39;clarification_required&#39; = &#39;refused&#39;): DescriptorProofResult { |
| reviewed | function | 76 | no | function reviewed(v: unknown): v is ReviewedHostBinding { |
| validContext | function | 86 | no | function validContext(v: unknown): v is DescriptorProofContext { |
| parseCatalog | function | 99 | no | function parseCatalog(text: string): {version: number; actions: readonly CatalogAction[]} \| null { |
| payload | variable | 100 | no | let payload: unknown; |
| ids | const | 111 | no | const ids = new Set&lt;string&gt;(); |
| actions | const | 112 | no | const actions: CatalogAction[] = []; |
| compileDescriptorProof | function | 129 | yes | export function compileDescriptorProof(input: unknown, trusted: unknown): DescriptorProofResult { |
| catalog | const | 134 | no | const catalog = parseCatalog(trusted.catalogText); |
| semanticIds | const | 136 | no | const semanticIds = new Set&lt;string&gt;(); |
| actionIds | const | 137 | no | const actionIds = new Set&lt;string&gt;(); |
| rows | const | 138 | no | const rows: CrosswalkRow[] = []; |
| descriptors | const | 139 | no | const descriptors: ActionDescriptor[] = []; |
| hostAction | const | 148 | no | const hostAction = catalog.actions.find(a =&gt; a.actionId === review.actionId); |
| argsSchemaHash | const | 150 | no | const argsSchemaHash = descriptorArgsDigest(hostAction.args); |
| row | const | 155 | no | const row: CrosswalkRow = { |
| compiled | variable | 170 | no | let compiled: Compilation; |
| picked | const | 184 | no | const picked = rows.find(r =&gt; r.semanticRef.id === compiled.command.semanticRef.id); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 7 | external |
| ./compile.ts | import | 8 | [packages/tierflow/src/visual-runtime/command/compile.ts](./compile.ts.md) |
| ./crosswalk.ts | import | 9 | [packages/tierflow/src/visual-runtime/command/crosswalk.ts](./crosswalk.ts.md) |
| ./ir.ts | import | 10 | [packages/tierflow/src/visual-runtime/command/ir.ts](./ir.ts.md) |
| ../host/port.ts | import | 11 | [packages/tierflow/src/visual-runtime/host/port.ts](../host/port.ts.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [packages/tierflow/src/visual-runtime/command/wave4-typed-transport-adapter.ts](./wave4-typed-transport-adapter.ts.md) | ./wave3-descriptor-proof.ts |
| [packages/tierflow/src/visual-runtime/input/wave4-device-semantics.ts](../input/wave4-device-semantics.ts.md) | ../command/wave3-descriptor-proof.ts |
| [packages/tierflow/src/visual-runtime/integration-3/compose.ts](../integration-3/compose.ts.md) | ../command/wave3-descriptor-proof.ts |
| [packages/tierflow/src/visual-runtime/integration-4/compose.ts](../integration-4/compose.ts.md) | ../command/wave3-descriptor-proof.ts |
| [packages/tierflow/tests/visual-runtime/integration-3.test.ts](../../../tests/visual-runtime/integration-3.test.ts.md) | ../../src/visual-runtime/command/wave3-descriptor-proof.ts |
| [packages/tierflow/tests/visual-runtime/integration-3.test.ts](../../../tests/visual-runtime/integration-3.test.ts.md) | ../../src/visual-runtime/command/wave3-descriptor-proof.ts |
| [packages/tierflow/tests/visual-runtime/integration-4/fixture.ts](../../../tests/visual-runtime/integration-4/fixture.ts.md) | ../../../src/visual-runtime/command/wave3-descriptor-proof.ts |
| [packages/tierflow/tests/visual-runtime/wave3-g-command.test.ts](../../../tests/visual-runtime/wave3-g-command.test.ts.md) | ../../src/visual-runtime/command/wave3-descriptor-proof.ts |
| [packages/tierflow/tests/visual-runtime/wave4-c-device-semantics.test.ts](../../../tests/visual-runtime/wave4-c-device-semantics.test.ts.md) | ../../src/visual-runtime/command/wave3-descriptor-proof.ts |
| [packages/tierflow/tests/visual-runtime/wave4-c-device-semantics.test.ts](../../../tests/visual-runtime/wave4-c-device-semantics.test.ts.md) | ../../src/visual-runtime/command/wave3-descriptor-proof.ts |
| [packages/tierflow/tests/visual-runtime/wave4-g-typed-transport.test.ts](../../../tests/visual-runtime/wave4-g-typed-transport.test.ts.md) | ../../src/visual-runtime/command/wave3-descriptor-proof.ts |

## Annotations

_No annotations._

## Excerpt

```typescript
/**
 * Wave 3 Lane G: inert, exact Host v6 descriptor crosswalk fixture.
 * A trusted test/integration broker provides source bytes and owner-reviewed bindings;
 * this module CANNOT certify the broker, grants, live availability, or effect execution.
 * No registry, transport, Host calls, approval, fuzzy aliases or provider sends.
 */
import { createHash } from 'node:crypto';
import { compileVisualCommand } from './compile.ts';
import { validRow, type ActionDescriptor, type ArgRule, type CrosswalkRow } from './crosswalk.ts';
import { DIGEST, onlyKeys, safeRecord, validPins, type Compilation, type Risk, type VersionPins, type VisualCommand } from './ir.ts';
import type { HostActionDescriptor } from '../host/port.ts';

const sha256 = (text: string) => createHash('sha256').update(text, 'utf8').digest('hex');
const MAX_CATALOG_BYTES = 256_000;
const MAX_HQ_BYTES = 256_000;
const RISKS: readonly string[] = ['R0', 'R1', 'R2', 'R3'];
const READINESS: readonly string[] = ['verified', 'source_wired', 'adapter_pending', 'enforcement_missing', 'unsupported'];

/** Stable hashing only for comparing the *same* action argument contract, not a Host signature. */
export function descriptorArgsDigest(args: unknown): string | null {
  if (!safeRecord(args)) return null;
  const encode = (value: unknown): string => {
    if (Array.isArray(value)) return '[' + value.map(encode).join(',') + ']';
    if (safeRecord(value)) return '{' + Object.keys(value).sort().map(k => JSON.stringify(k) + ':' + encode(value[k])).join(',') + '}';
    return JSON.stringify(value);
  };
  try { return sha256(encode(args)); } catch { return null; }
}

/** Fixture-only human review: not asserted to exist in the current HQ action registry. */
export type ReviewedHostBinding = Readonly<{
  schema: 'vivim.reviewed-host-binding-fixture/1';
  semanticId: string;
  semanticVersion: string;
  actionId: string;
  risk: Risk;
  argsSchemaSha256: string;
  hostCatalogSha256: string;
  hqRegistrySha256: string;
  reviewed: true;
}>;

/** Trusted broker input. NEVER sourced from an owner command, NLCL output, or an AI proposal. */
export type DescriptorProofContext = Readonly<{
  schema: 'vivim.descriptor-proof-context-fixture/1';
  catalogText: string;
  expectedCatalogSha256: string;
  hqRegistryText: string;
  expectedHqRegistrySha256: string;
  reviews: readonly ReviewedHostBinding[];
  currentVersions: VersionPins;
  deviceSurface: 'desktop' | 'phone';
}>;

type CatalogAction = Pick<HostActionDescriptor, 'actionId' | 'risk' | 'readiness'> & {
  args: Readonly<Record<string, ArgRule>>;
};
export type DescriptorCrosswalkEvidence = Readonly<{
  evidenceClass: 'source_bound_inert_fixture';
  effectInvoked: false;
  hostAuthorizationRequired: true;
  liveHostVerified: false;
  catalogVersion: number;
  catalogSha256: string;
  hqRegistrySha256: string;
  argsSchemaSha256: string;
  deviceSurface: 'desktop' | 'phone';
}>;
export type DescriptorProofResult =
  | Readonly<{ outcome: 'candidate'; command: VisualCommand; evidence: DescriptorCrosswalkEvidence }>
  | Readonly<{ outcome: 'refused' | 'clarification_required'; reasonCode: string; alternatives: readonly string[]; effectInvoked: false }>;

function refuse(reasonCode: string, outcome: 'refused' | 'clarification_required' = 'refused'): DescriptorProofResult {
  return { outcome, reasonCode, alternatives: [], effectInvoked: false };
}
function reviewed(v: unknown): v is ReviewedHostBinding {
  return onlyKeys(v, ['schema', 'semanticId', 'semanticVersion', 'actionId', 'risk', 'argsSchemaSha256',
    'hostCatalogSha256', 'hqRegistrySha256', 'reviewed']) &&
    v.schema === 'vivim.reviewed-host-binding-fixture/1' && v.reviewed === true &&
    typeof v.semanticId === 'string' && /^[a-z0-9][a-z0-9._-]{0,94}@\d+(?:\.\d+)*$/.test(v.semanticId) &&
```

_First 80 of 193 lines._

---

[HQ wiki](../../../../../../../index.md) · [Symbols](../../../../../../../symbols.md) · [Dependency graph](../../../../../../../graph.md) · [Documentation](../../../../../../../docs.md) · [Changes](../../../../../../../changes.md) · [Open tasks](../../../../../../../todos.md) · [Deprecated](../../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../../protocol.md) · [Glossary](../../../../../../../glossary.md) · [Using HQ](../../../../../../../context.md) · [Capabilities](../../../../../../../capabilities.md) · [Search index](../../../../../../../search.json) · [Browser view](../../../../../../../index.html)
