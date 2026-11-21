# ARBOR Studio ↔ Craft Anything intelligence connector (R003)

Status: **implemented read-only Studio connector extension**, no live Craft/Claude runtime proof. 2026-11-21.

## Product architecture

| Stage | Owner now | Owner after native convergence | Can perform effects? |
|---|---|---|---|
| Browser investigation | External Craft Anything dev session | External dev tool initially; selective approved Rust components later | Only in its *separate* authorized investigation session, never through ARBOR Host |
| Bundle verification and artifact association | VIVIM Labs `craft-anything-arbor-adapter` | Rust native evidence crate / pure app-intel normalizer | No |
| Source inventory registration | Studio operator-configured index file | Studio/Host config owner (static registration) | No |
| Atlas projection | `studio/src/studio/craft-intel-routes.mjs` | Existing Rust product kernel pure operation | No |
| Read-only API/UI | Studio integration-hub + `/craft-intel` | Same API; native backend behind it | No |
| Semantic graph projection | No writer in this connector | Existing HQKG ingest/journal owner, after explicit admitted mapping | No direct write |
| Approved webapp interaction | Existing Studio/Harness/Host paths (not this connector) | Existing Host alone; native pure planning where appropriate | Host only |

**Do not copy Craft's MCP server, CDP browser owner, account/session service, or journal into ARBOR's product runtime.** This is a dev-mode evidence source. Source inspection is not authorization to interact with third-party apps. Retain signed-in Chrome ownership and Host effects exactly as designed.

## Implemented Studio API

The existing endpoint is backward-compatible:

- `GET /api/v1/dev/craft-intelligence`: existing single-atlas report; if an index is configured, it returns `status:index-configured` rather than choosing an arbitrary target.

The extension adds:

- `GET /api/v1/dev/craft-intelligence/targets`: operator-configured application IDs, no local paths.
- `GET /api/v1/dev/craft-intelligence/targets/{siteId}`: validated inert evidence projection for that registered site only.
- `GET /api/v1/dev/craft-intelligence/targets/{siteId}/delta`: optional previous/current atlas comparison; changes to observations, **not** feature removal claims.

All are `GET`, inherit Studio's existing host/origin/token checks, and are tagged as read-only in the integration hub tool manifest. No endpoints write files, send prompts, install tools, discover browser targets, or grant permissions.

## Operator source index (dev-only)

Set `VIVIM_CRAFT_INDEX_FILE` to a **local absolute path** containing JSON:

```json
{
  "schema": "vivim.craft-intelligence-sources/1",
  "targets": [
    {
      "siteId": "vivim-mvp",
      "atlasPath": "C:\\path\\to\\vivim-atlas.json",
      "reconciliationPath": "C:\\path\\to\\reconciliation.json",
      "previousAtlasPath": "C:\\path\\to\\previous-vivim-atlas.json"
    }
  ]
}
```

Paths above are placeholders and must be replaced with real absolute local files. Do not commit the index itself; it may disclose workstation paths. `reconciliationPath` and `previousAtlasPath` are optional. Maximum 24 configured target IDs. Files are read on demand and capped (4 MiB atlas/reconciliation, 64 KiB index). No path can be selected through an HTTP query or body.

For an existing single target, `VIVIM_CRAFT_ATLAS_FILE`, `VIVIM_CRAFT_RECONCILIATION_FILE`, and optional `VIVIM_CRAFT_PREVIOUS_ATLAS_FILE` remain supported. No index is necessary.

## Wire contract and Rust migration seam

The current input remains the Labs output `vivim.application-surface-atlas/0.1`, optionally accompanied by `vivim.application-surface-reconciliation/1`.

The output remains `vivim.studio-craft-intelligence/1`, extended additively with:

- `observationKinds`: sorted `{kind,count}` rows from bounded known observation types.
- `confidence`: sorted `{confidence,count}` rows (`observed`, `derived`, `inferred`, `unknown`).
- `coverage`: sorted `{coverage,count}` rows (`complete`, `partial`, `unknown`).
- `evidence`: sorted source references with **only** immutable Craft evidence IDs, allowlisted operation IDs, confidence and coverage qualifiers, limitation count, and clean-room flag.
- `reconciliation.unmappedCount` and per-feature `evidenceCount`, counting only references that belong to the atlas.

New delta output: `vivim.studio-craft-observation-delta/1`. It never infers a missing feature from partial observations.

**Suggested Rust ABI** (not registered yet):

```json
{
  "schema": "vivim.product-pure-request/1",
  "operation": "application-intelligence-projection",
  "input": {"atlas": "<validated JSON object>", "reconciliation": null}
}
```

The operation must remain pure and effect-free. Its result must bytewise/structurally match the JavaScript projection for identical bounded inputs. Replace the projection call behind `registerCraftIntelRoutes` with the existing `native-product-pure-sync` bridge only after native/JS parity is actually demonstrated; do **not** create a new native process or global router. Avoid putting entire rich Craft results through the product WASM 512 KiB wire: use bounded per-page evidence or native-side normalization before projection.

When the Craft source is harvested, pin source refs and license attribution separately; reuse the producer's `craft-anything-evidence` algorithms rather than creating another unverified canonical JSON format. Retain evidence IDs and original capture revisions, and refuse mismatches. Retain a data-only read model for the Studio UI.

## Threat model and guarantees

- No raw URLs with account or conversation IDs, user text, selector CSS, screen content, filesystem paths, unknown text, credentials or API keys are returned by this connector. Only the site origin, evidence IDs, finite counts, known operation labels and closed enums are visible.
- Local-source index entries and atlas target IDs are validated. Requested site IDs are exact matches; a request can never provide a file path.
- Direct evidence references are checked against the listed atlas evidence; duplicates, invalid qualifiers and unknown observation kinds are refused.
- The source's `nativeVerified` flag is **not an attestation**: Studio displays it as an external producer claim. Real acceptance must separately verify the original Craft bundle and source artifacts.
- Role-count or evidence-ID changes do not prove regressions or feature removals. Coverage remains bounded and potentially partial.
- Third-party terms and user authorization still govern target investigations.

## Development checks

From the ARBOR checkout:

```powershell
node --test studio/test/unit/craft-intel-routes.test.mjs
node --check studio/src/studio/craft-intel-routes.mjs
node --check studio/src/studio/ui/craft-intel.mjs
```

These test only contract/projection behavior. Also run the existing broader Studio unit suites locally when the full checkout and dependencies are available. Rust/Craft native hash verification, real VIVIM app captures, live Studio HTTP and genuine Claude.ai coverage are **UNRUN** in this R003 integration round.

## Next concrete steps

1. Produce genuine, authorized VIVIM MVP Craft evidence with the separate Craft process; run the Labs native evidence verifier before treating the data as verified.
2. Generate an actual atlas/reconciliation pair; configure the Studio source index; use `/craft-intel` to inspect coverage and provenance in a real running Studio instance.
3. Compare the atlas to existing Studio and Harness source profiles; propose individual data-only read mappings. No auto-execution.
4. Move the pure projection into the existing Rust product kernel with exhaustive parity fixtures. Do not import Craft browser tools into ARBOR Host.
5. Only then add accepted semantic graph identities via the current HQKG ingest owner, with source revision, revocation and idempotence.
6. Later selectively import Craft Rust evidence/analysis modules into ARBOR after boundary/ABI/license review; leave the standalone research workbench as a development accelerator.
