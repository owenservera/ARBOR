# Craft Anything → Studio: running read-only intelligence bridge

This is the first **live product-side seam** in ARBOR for the external Craft Anything investigation pipeline. It consumes Labs' existing sanitized application-surface reports; it does not import the Craft browser, run providers, or mint authorized commands.

## Files / routes
- `studio/src/studio/craft-intel-routes.mjs`: bounded, read-only local reporter, mounted in the existing integration hub.
- `GET /api/v1/dev/craft-intelligence`: source-scoped, sanitized API; inherits the existing Studio HTTP Host/Origin/token policy.
- `/craft-intel`: human-readable coverage page; linked from Studio's sidebar.
- `studio/test/unit/craft-intel-routes.test.mjs`: source privacy, shape, scope, authority and local path tests.

## Actual first-party data (do not substitute synthetic product claims)
1. Collect a genuine Craft investigation against an authorized VIVIM-owned MVP using its own isolated browser session, not Studio's browser profile.
2. In `owenservera/vivim-labs/craft-anything-arbor-adapter`, use the existing `src/cli.mjs import` workflow to verify and normalize the Craft bundle. Preserve original private evidence outside Git. Prefer `--native-bin` with the real Craft Rust verifier to establish native SHA-256 parity.
3. Optionally run the Labs `reconcile` command to produce `reconciliation.json` for that exact same site ID and origin.
4. Before starting Studio using its existing startup command, set these PowerShell environment variables to the absolute local paths:

    $env:VIVIM_CRAFT_ATLAS_FILE='C:\captures\report-01\atlas.json'
    $env:VIVIM_CRAFT_RECONCILIATION_FILE='C:\captures\comparison-01\reconciliation.json'

5. Visit `/craft-intel` on the running Studio origin, or `GET /api/v1/dev/craft-intelligence`. Without `VIVIM_CRAFT_ATLAS_FILE`, the endpoint responds `not-configured` rather than generating example data. Studio reads the report on each request; replace the source file under the same path and select Refresh to see the new report.

## Privacy, authority and coverage
- Local file selection is operator configuration, **never an HTTP path parameter**. File must be an existing absolute path, valid JSON and at most 4 MiB.
- Only site ID, origin, digest, bounded counts, role names, operation names and redacted feature reconciliation are projected. Raw Craft evidence, private URLs, free text labels, selector strings, screenshot pixels and tool parameters remain outside the Studio response.
- All source records must remain non-executable. Atlas status and reconciliation status cannot be upgraded to runtime verification here.
- No new graph, persistence store, browser actor, Host effect authority, provider API, grant or learned selector activation is added.
- Studio's current learned adapter factory and HQKG remain independent existing canonical owners. This is a dev observability bridge, not a replacement.
- The report's `nativeVerified: true` only reflects the Labs adapter field; it is not a Studio signature and cannot mint Studio Core capture acceptance.
- Neither the existence of a control nor a visible label proves that an action works, is uniquely identified, or is authorized.

## Verification
From the ARBOR repository root:

    node --test studio/test/unit/craft-intel-routes.test.mjs

Run the existing Studio bootstrap, then verify `GET /api/v1/dev/craft-intelligence` returns `not-configured` without a configured atlas, and real scoped counts when a genuine Labs output is supplied. Verify all paths in LAN token mode remain behind Studio's existing auth gate. Ensure there is no write route.

**Status for this integration round:** new source and unit tests committed to `main`; a local prototype passed five focused tests. Full repository test execution, actual Craft MVP bundle import and end-to-end running Studio readback remain UNRUN here until the relevant checkout/browser is available. Do not count synthetic unit input as a real product capture.
