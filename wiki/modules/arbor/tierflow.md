# Module: arbor/tierflow

> Generated 2026-11-19 · 186 files · 7293 symbols

## Files

| File | Language | Lines | Symbols |
| --- | --- | --- | --- |
| [packages/tierflow/README.md](../../files/arbor/packages/tierflow/README.md.md) | Markdown | 44 | 0 |
| [packages/tierflow/package.json](../../files/arbor/packages/tierflow/package.json.md) | JSON | 21 | 0 |
| [packages/tierflow/runtime/config.json](../../files/arbor/packages/tierflow/runtime/config.json.md) | JSON | 19 | 0 |
| [packages/tierflow/runtime/surface.json](../../files/arbor/packages/tierflow/runtime/surface.json.md) | JSON | 48 | 0 |
| [packages/tierflow/scripts/generate-host-tokens.mjs](../../files/arbor/packages/tierflow/scripts/generate-host-tokens.mjs.md) | JavaScript | 128 | 18 |
| [packages/tierflow/src/bus.ts](../../files/arbor/packages/tierflow/src/bus.ts.md) | TypeScript | 151 | 20 |
| [packages/tierflow/src/cli.ts](../../files/arbor/packages/tierflow/src/cli.ts.md) | TypeScript | 91 | 17 |
| [packages/tierflow/src/config.ts](../../files/arbor/packages/tierflow/src/config.ts.md) | TypeScript | 183 | 17 |
| [packages/tierflow/src/coordination/contract.ts](../../files/arbor/packages/tierflow/src/coordination/contract.ts.md) | TypeScript | 501 | 58 |
| [packages/tierflow/src/coordination/index.ts](../../files/arbor/packages/tierflow/src/coordination/index.ts.md) | TypeScript | 9 | 0 |
| [packages/tierflow/src/coordination/poller.ts](../../files/arbor/packages/tierflow/src/coordination/poller.ts.md) | TypeScript | 81 | 11 |
| [packages/tierflow/src/hotpath.ts](../../files/arbor/packages/tierflow/src/hotpath.ts.md) | TypeScript | 229 | 28 |
| [packages/tierflow/src/lab.ts](../../files/arbor/packages/tierflow/src/lab.ts.md) | TypeScript | 321 | 51 |
| [packages/tierflow/src/observability.ts](../../files/arbor/packages/tierflow/src/observability.ts.md) | TypeScript | 211 | 39 |
| [packages/tierflow/src/protocol.ts](../../files/arbor/packages/tierflow/src/protocol.ts.md) | TypeScript | 262 | 29 |
| [packages/tierflow/src/registry.ts](../../files/arbor/packages/tierflow/src/registry.ts.md) | TypeScript | 344 | 44 |
| [packages/tierflow/src/security.ts](../../files/arbor/packages/tierflow/src/security.ts.md) | TypeScript | 158 | 26 |
| [packages/tierflow/src/server.ts](../../files/arbor/packages/tierflow/src/server.ts.md) | TypeScript | 523 | 92 |
| [packages/tierflow/src/stats.ts](../../files/arbor/packages/tierflow/src/stats.ts.md) | TypeScript | 190 | 53 |
| [packages/tierflow/src/surface.ts](../../files/arbor/packages/tierflow/src/surface.ts.md) | TypeScript | 173 | 22 |
| [packages/tierflow/src/surfaces/http.ts](../../files/arbor/packages/tierflow/src/surfaces/http.ts.md) | TypeScript | 887 | 136 |
| [packages/tierflow/src/surfaces/websocket.ts](../../files/arbor/packages/tierflow/src/surfaces/websocket.ts.md) | TypeScript | 458 | 37 |
| [packages/tierflow/src/theme.ts](../../files/arbor/packages/tierflow/src/theme.ts.md) | TypeScript | 155 | 8 |
| [packages/tierflow/src/tier1/agent.ts](../../files/arbor/packages/tierflow/src/tier1/agent.ts.md) | TypeScript | 155 | 16 |
| [packages/tierflow/src/tier2/router.ts](../../files/arbor/packages/tierflow/src/tier2/router.ts.md) | TypeScript | 431 | 52 |
| [packages/tierflow/src/tier3/executor.ts](../../files/arbor/packages/tierflow/src/tier3/executor.ts.md) | TypeScript | 502 | 65 |
| [packages/tierflow/src/ui/commands.ts](../../files/arbor/packages/tierflow/src/ui/commands.ts.md) | TypeScript | 1088 | 139 |
| [packages/tierflow/src/ui/hash.ts](../../files/arbor/packages/tierflow/src/ui/hash.ts.md) | TypeScript | 80 | 13 |
| [packages/tierflow/src/ui/realtime.ts](../../files/arbor/packages/tierflow/src/ui/realtime.ts.md) | TypeScript | 187 | 15 |
| [packages/tierflow/src/ui/store.ts](../../files/arbor/packages/tierflow/src/ui/store.ts.md) | TypeScript | 1167 | 129 |
| [packages/tierflow/src/ui/types.ts](../../files/arbor/packages/tierflow/src/ui/types.ts.md) | TypeScript | 251 | 30 |
| [packages/tierflow/src/ui/world.ts](../../files/arbor/packages/tierflow/src/ui/world.ts.md) | TypeScript | 1267 | 207 |
| [packages/tierflow/src/visual-runtime/command/compile.ts](../../files/arbor/packages/tierflow/src/visual-runtime/command/compile.ts.md) | TypeScript | 110 | 19 |
| [packages/tierflow/src/visual-runtime/command/crosswalk.ts](../../files/arbor/packages/tierflow/src/visual-runtime/command/crosswalk.ts.md) | TypeScript | 110 | 21 |
| [packages/tierflow/src/visual-runtime/command/ir.ts](../../files/arbor/packages/tierflow/src/visual-runtime/command/ir.ts.md) | TypeScript | 69 | 24 |
| [packages/tierflow/src/visual-runtime/command/wave3-descriptor-proof.ts](../../files/arbor/packages/tierflow/src/visual-runtime/command/wave3-descriptor-proof.ts.md) | TypeScript | 192 | 30 |
| [packages/tierflow/src/visual-runtime/command/wave4-typed-transport-adapter.ts](../../files/arbor/packages/tierflow/src/visual-runtime/command/wave4-typed-transport-adapter.ts.md) | TypeScript | 280 | 50 |
| [packages/tierflow/src/visual-runtime/components/accessibility.ts](../../files/arbor/packages/tierflow/src/visual-runtime/components/accessibility.ts.md) | TypeScript | 122 | 31 |
| [packages/tierflow/src/visual-runtime/components/catalog.ts](../../files/arbor/packages/tierflow/src/visual-runtime/components/catalog.ts.md) | TypeScript | 145 | 29 |
| [packages/tierflow/src/visual-runtime/components/layout.ts](../../files/arbor/packages/tierflow/src/visual-runtime/components/layout.ts.md) | TypeScript | 116 | 21 |
| [packages/tierflow/src/visual-runtime/components/wave3-canonical-map.ts](../../files/arbor/packages/tierflow/src/visual-runtime/components/wave3-canonical-map.ts.md) | TypeScript | 224 | 57 |
| [packages/tierflow/src/visual-runtime/device/wave4-desktop-adapter.ts](../../files/arbor/packages/tierflow/src/visual-runtime/device/wave4-desktop-adapter.ts.md) | TypeScript | 238 | 36 |
| [packages/tierflow/src/visual-runtime/device/wave4-phone-adapter.ts](../../files/arbor/packages/tierflow/src/visual-runtime/device/wave4-phone-adapter.ts.md) | TypeScript | 268 | 50 |
| [packages/tierflow/src/visual-runtime/document/import-legacy.ts](../../files/arbor/packages/tierflow/src/visual-runtime/document/import-legacy.ts.md) | TypeScript | 203 | 52 |
| [packages/tierflow/src/visual-runtime/document/schema.ts](../../files/arbor/packages/tierflow/src/visual-runtime/document/schema.ts.md) | TypeScript | 96 | 20 |
| [packages/tierflow/src/visual-runtime/document/validate.ts](../../files/arbor/packages/tierflow/src/visual-runtime/document/validate.ts.md) | TypeScript | 281 | 75 |
| [packages/tierflow/src/visual-runtime/document/wave3-action-semantics.ts](../../files/arbor/packages/tierflow/src/visual-runtime/document/wave3-action-semantics.ts.md) | TypeScript | 192 | 41 |
| [packages/tierflow/src/visual-runtime/experience/help.ts](../../files/arbor/packages/tierflow/src/visual-runtime/experience/help.ts.md) | TypeScript | 130 | 23 |
| [packages/tierflow/src/visual-runtime/experience/onboarding.ts](../../files/arbor/packages/tierflow/src/visual-runtime/experience/onboarding.ts.md) | TypeScript | 164 | 28 |
| [packages/tierflow/src/visual-runtime/experience/recovery.ts](../../files/arbor/packages/tierflow/src/visual-runtime/experience/recovery.ts.md) | TypeScript | 83 | 17 |
| [packages/tierflow/src/visual-runtime/experience/wave3-journey-fixture.ts](../../files/arbor/packages/tierflow/src/visual-runtime/experience/wave3-journey-fixture.ts.md) | TypeScript | 266 | 57 |
| [packages/tierflow/src/visual-runtime/experience/wave4-onboarding-resume.ts](../../files/arbor/packages/tierflow/src/visual-runtime/experience/wave4-onboarding-resume.ts.md) | TypeScript | 268 | 64 |
| [packages/tierflow/src/visual-runtime/final-wave/integration/master.ts](../../files/arbor/packages/tierflow/src/visual-runtime/final-wave/integration/master.ts.md) | TypeScript | 338 | 51 |
| [packages/tierflow/src/visual-runtime/final-wave/integration/runner.ts](../../files/arbor/packages/tierflow/src/visual-runtime/final-wave/integration/runner.ts.md) | TypeScript | 91 | 17 |
| [packages/tierflow/src/visual-runtime/final-wave/integration/schema-boundary.ts](../../files/arbor/packages/tierflow/src/visual-runtime/final-wave/integration/schema-boundary.ts.md) | TypeScript | 183 | 22 |
| [packages/tierflow/src/visual-runtime/final-wave/integration/world-visual-bridge.ts](../../files/arbor/packages/tierflow/src/visual-runtime/final-wave/integration/world-visual-bridge.ts.md) | TypeScript | 156 | 24 |
| [packages/tierflow/src/visual-runtime/final-wave/lane-a/normalize.ts](../../files/arbor/packages/tierflow/src/visual-runtime/final-wave/lane-a/normalize.ts.md) | TypeScript | 243 | 42 |
| [packages/tierflow/src/visual-runtime/final-wave/lane-b/studio-editing.ts](../../files/arbor/packages/tierflow/src/visual-runtime/final-wave/lane-b/studio-editing.ts.md) | TypeScript | 182 | 48 |
| [packages/tierflow/src/visual-runtime/final-wave/lane-c/adapters.ts](../../files/arbor/packages/tierflow/src/visual-runtime/final-wave/lane-c/adapters.ts.md) | TypeScript | 70 | 19 |
| [packages/tierflow/src/visual-runtime/final-wave/lane-c/first-edit.ts](../../files/arbor/packages/tierflow/src/visual-runtime/final-wave/lane-c/first-edit.ts.md) | TypeScript | 48 | 14 |
| [packages/tierflow/src/visual-runtime/final-wave/lane-c/templates.ts](../../files/arbor/packages/tierflow/src/visual-runtime/final-wave/lane-c/templates.ts.md) | TypeScript | 111 | 31 |
| [packages/tierflow/src/visual-runtime/final-wave/lane-d/knowledge-presentation.ts](../../files/arbor/packages/tierflow/src/visual-runtime/final-wave/lane-d/knowledge-presentation.ts.md) | TypeScript | 158 | 30 |
| [packages/tierflow/src/visual-runtime/final-wave/lane-e/host-journey.ts](../../files/arbor/packages/tierflow/src/visual-runtime/final-wave/lane-e/host-journey.ts.md) | TypeScript | 142 | 24 |
| [packages/tierflow/src/visual-runtime/final-wave/lane-f/existing-clients.ts](../../files/arbor/packages/tierflow/src/visual-runtime/final-wave/lane-f/existing-clients.ts.md) | TypeScript | 201 | 30 |
| [packages/tierflow/src/visual-runtime/final-wave/lane-g/cutover-dry-run.ts](../../files/arbor/packages/tierflow/src/visual-runtime/final-wave/lane-g/cutover-dry-run.ts.md) | TypeScript | 203 | 46 |
| [packages/tierflow/src/visual-runtime/final-wave/lane-h/verification.ts](../../files/arbor/packages/tierflow/src/visual-runtime/final-wave/lane-h/verification.ts.md) | TypeScript | 232 | 41 |
| [packages/tierflow/src/visual-runtime/host/fixture.ts](../../files/arbor/packages/tierflow/src/visual-runtime/host/fixture.ts.md) | TypeScript | 213 | 41 |
| [packages/tierflow/src/visual-runtime/host/outcome.ts](../../files/arbor/packages/tierflow/src/visual-runtime/host/outcome.ts.md) | TypeScript | 79 | 10 |
| [packages/tierflow/src/visual-runtime/host/port.ts](../../files/arbor/packages/tierflow/src/visual-runtime/host/port.ts.md) | TypeScript | 171 | 21 |
| [packages/tierflow/src/visual-runtime/host/wave3-read-gateway-fixture.ts](../../files/arbor/packages/tierflow/src/visual-runtime/host/wave3-read-gateway-fixture.ts.md) | TypeScript | 152 | 26 |
| [packages/tierflow/src/visual-runtime/host/wave4-h-host-status-contract.ts](../../files/arbor/packages/tierflow/src/visual-runtime/host/wave4-h-host-status-contract.ts.md) | TypeScript | 270 | 31 |
| [packages/tierflow/src/visual-runtime/input/wave4-device-semantics.ts](../../files/arbor/packages/tierflow/src/visual-runtime/input/wave4-device-semantics.ts.md) | TypeScript | 254 | 49 |
| [packages/tierflow/src/visual-runtime/integration-2/action-adapter.d.mts](../../files/arbor/packages/tierflow/src/visual-runtime/integration-2/action-adapter.d.mts.md) | TypeScript | 26 | 3 |
| [packages/tierflow/src/visual-runtime/integration-2/action-adapter.mjs](../../files/arbor/packages/tierflow/src/visual-runtime/integration-2/action-adapter.mjs.md) | JavaScript | 25 | 9 |
| [packages/tierflow/src/visual-runtime/integration-2/compose.ts](../../files/arbor/packages/tierflow/src/visual-runtime/integration-2/compose.ts.md) | TypeScript | 836 | 110 |
| [packages/tierflow/src/visual-runtime/integration-3/compose.ts](../../files/arbor/packages/tierflow/src/visual-runtime/integration-3/compose.ts.md) | TypeScript | 296 | 47 |
| [packages/tierflow/src/visual-runtime/integration-4/compose.ts](../../files/arbor/packages/tierflow/src/visual-runtime/integration-4/compose.ts.md) | TypeScript | 500 | 71 |
| [packages/tierflow/src/visual-runtime/knowledge/client.ts](../../files/arbor/packages/tierflow/src/visual-runtime/knowledge/client.ts.md) | TypeScript | 249 | 56 |
| [packages/tierflow/src/visual-runtime/knowledge/fixtures.ts](../../files/arbor/packages/tierflow/src/visual-runtime/knowledge/fixtures.ts.md) | TypeScript | 48 | 9 |
| [packages/tierflow/src/visual-runtime/knowledge/hvi-inspector.mjs](../../files/arbor/packages/tierflow/src/visual-runtime/knowledge/hvi-inspector.mjs.md) | JavaScript | 85 | 20 |
| [packages/tierflow/src/visual-runtime/knowledge/projection.ts](../../files/arbor/packages/tierflow/src/visual-runtime/knowledge/projection.ts.md) | TypeScript | 46 | 8 |
| [packages/tierflow/src/visual-runtime/knowledge/wave3-feed-projection.ts](../../files/arbor/packages/tierflow/src/visual-runtime/knowledge/wave3-feed-projection.ts.md) | TypeScript | 206 | 46 |
| [packages/tierflow/src/visual-runtime/knowledge/wave4-device-snapshot-adapter.ts](../../files/arbor/packages/tierflow/src/visual-runtime/knowledge/wave4-device-snapshot-adapter.ts.md) | TypeScript | 244 | 54 |
| [packages/tierflow/src/visual-runtime/render/dom.ts](../../files/arbor/packages/tierflow/src/visual-runtime/render/dom.ts.md) | TypeScript | 255 | 85 |
| [packages/tierflow/src/visual-runtime/render/hvi-inspector.mjs](../../files/arbor/packages/tierflow/src/visual-runtime/render/hvi-inspector.mjs.md) | JavaScript | 136 | 26 |
| [packages/tierflow/src/visual-runtime/render/inspect.ts](../../files/arbor/packages/tierflow/src/visual-runtime/render/inspect.ts.md) | TypeScript | 40 | 6 |
| [packages/tierflow/src/visual-runtime/render/spatial-fallback.ts](../../files/arbor/packages/tierflow/src/visual-runtime/render/spatial-fallback.ts.md) | TypeScript | 25 | 3 |
| [packages/tierflow/src/visual-runtime/render/wave3-semantics.ts](../../files/arbor/packages/tierflow/src/visual-runtime/render/wave3-semantics.ts.md) | TypeScript | 155 | 32 |
| [packages/tierflow/src/visual-runtime/revisions/fixture-store.ts](../../files/arbor/packages/tierflow/src/visual-runtime/revisions/fixture-store.ts.md) | TypeScript | 172 | 45 |
| [packages/tierflow/src/visual-runtime/revisions/port.ts](../../files/arbor/packages/tierflow/src/visual-runtime/revisions/port.ts.md) | TypeScript | 58 | 8 |
| [packages/tierflow/src/visual-runtime/revisions/wave3-atomic-replay.ts](../../files/arbor/packages/tierflow/src/visual-runtime/revisions/wave3-atomic-replay.ts.md) | TypeScript | 296 | 62 |
| [packages/tierflow/src/visual-runtime/revisions/wave4-session-reconcile.ts](../../files/arbor/packages/tierflow/src/visual-runtime/revisions/wave4-session-reconcile.ts.md) | TypeScript | 318 | 67 |
| [packages/tierflow/tests/architecture-boundary.test.ts](../../files/arbor/packages/tierflow/tests/architecture-boundary.test.ts.md) | TypeScript | 437 | 77 |
| [packages/tierflow/tests/bus.test.ts](../../files/arbor/packages/tierflow/tests/bus.test.ts.md) | TypeScript | 135 | 17 |
| [packages/tierflow/tests/e2e.test.ts](../../files/arbor/packages/tierflow/tests/e2e.test.ts.md) | TypeScript | 269 | 41 |
| [packages/tierflow/tests/executor.test.ts](../../files/arbor/packages/tierflow/tests/executor.test.ts.md) | TypeScript | 136 | 24 |
| [packages/tierflow/tests/fixtures/notgit/README.md](../../files/arbor/packages/tierflow/tests/fixtures/notgit/README.md.md) | Markdown | 11 | 0 |
| [packages/tierflow/tests/fixtures/notgit/data.txt](../../files/arbor/packages/tierflow/tests/fixtures/notgit/data.txt.md) | Text | 3 | 0 |
| [packages/tierflow/tests/fixtures/py-mini/README.md](../../files/arbor/packages/tierflow/tests/fixtures/py-mini/README.md.md) | Markdown | 17 | 0 |
| [packages/tierflow/tests/fixtures/py-mini/calc.py](../../files/arbor/packages/tierflow/tests/fixtures/py-mini/calc.py.md) | Python | 15 | 2 |
| [packages/tierflow/tests/fixtures/py-mini/test_calc.py](../../files/arbor/packages/tierflow/tests/fixtures/py-mini/test_calc.py.md) | Python | 20 | 3 |
| [packages/tierflow/tests/fixtures/py-mini/test_fail.py](../../files/arbor/packages/tierflow/tests/fixtures/py-mini/test_fail.py.md) | Python | 21 | 2 |
| [packages/tierflow/tests/fixtures/ts-mini/README.md](../../files/arbor/packages/tierflow/tests/fixtures/ts-mini/README.md.md) | Markdown | 20 | 0 |
| [packages/tierflow/tests/fixtures/ts-mini/package.json](../../files/arbor/packages/tierflow/tests/fixtures/ts-mini/package.json.md) | JSON | 11 | 0 |
| [packages/tierflow/tests/fixtures/ts-mini/src/sum.ts](../../files/arbor/packages/tierflow/tests/fixtures/ts-mini/src/sum.ts.md) | TypeScript | 9 | 1 |
| [packages/tierflow/tests/fixtures/ts-mini/tests/fail.check.ts](../../files/arbor/packages/tierflow/tests/fixtures/ts-mini/tests/fail.check.ts.md) | TypeScript | 10 | 0 |
| [packages/tierflow/tests/fixtures/ts-mini/tests/sum.check.ts](../../files/arbor/packages/tierflow/tests/fixtures/ts-mini/tests/sum.check.ts.md) | TypeScript | 11 | 0 |
| [packages/tierflow/tests/hvi-inspector.test.mjs](../../files/arbor/packages/tierflow/tests/hvi-inspector.test.mjs.md) | JavaScript | 121 | 25 |
| [packages/tierflow/tests/lab.test.ts](../../files/arbor/packages/tierflow/tests/lab.test.ts.md) | TypeScript | 96 | 5 |
| [packages/tierflow/tests/protocol.test.ts](../../files/arbor/packages/tierflow/tests/protocol.test.ts.md) | TypeScript | 98 | 4 |
| [packages/tierflow/tests/router.test.ts](../../files/arbor/packages/tierflow/tests/router.test.ts.md) | TypeScript | 167 | 17 |
| [packages/tierflow/tests/security.test.ts](../../files/arbor/packages/tierflow/tests/security.test.ts.md) | TypeScript | 110 | 11 |
| [packages/tierflow/tests/stats.test.ts](../../files/arbor/packages/tierflow/tests/stats.test.ts.md) | TypeScript | 110 | 12 |
| [packages/tierflow/tests/tier-capability.test.ts](../../files/arbor/packages/tierflow/tests/tier-capability.test.ts.md) | TypeScript | 140 | 19 |
| [packages/tierflow/tests/ui-commands.test.ts](../../files/arbor/packages/tierflow/tests/ui-commands.test.ts.md) | TypeScript | 546 | 63 |
| [packages/tierflow/tests/ui-http-surface.test.ts](../../files/arbor/packages/tierflow/tests/ui-http-surface.test.ts.md) | TypeScript | 979 | 152 |
| [packages/tierflow/tests/ui-realtime.test.ts](../../files/arbor/packages/tierflow/tests/ui-realtime.test.ts.md) | TypeScript | 205 | 31 |
| [packages/tierflow/tests/ui-store.test.ts](../../files/arbor/packages/tierflow/tests/ui-store.test.ts.md) | TypeScript | 629 | 91 |
| [packages/tierflow/tests/ui-websocket-surface.test.ts](../../files/arbor/packages/tierflow/tests/ui-websocket-surface.test.ts.md) | TypeScript | 491 | 55 |
| [packages/tierflow/tests/ui-world.test.ts](../../files/arbor/packages/tierflow/tests/ui-world.test.ts.md) | TypeScript | 734 | 105 |
| [packages/tierflow/tests/visual-runtime/command-negative.test.ts](../../files/arbor/packages/tierflow/tests/visual-runtime/command-negative.test.ts.md) | TypeScript | 93 | 18 |
| [packages/tierflow/tests/visual-runtime/command.test.ts](../../files/arbor/packages/tierflow/tests/visual-runtime/command.test.ts.md) | TypeScript | 68 | 19 |
| [packages/tierflow/tests/visual-runtime/components.test.ts](../../files/arbor/packages/tierflow/tests/visual-runtime/components.test.ts.md) | TypeScript | 104 | 9 |
| [packages/tierflow/tests/visual-runtime/document-compat.test.ts](../../files/arbor/packages/tierflow/tests/visual-runtime/document-compat.test.ts.md) | TypeScript | 86 | 21 |
| [packages/tierflow/tests/visual-runtime/document.test.ts](../../files/arbor/packages/tierflow/tests/visual-runtime/document.test.ts.md) | TypeScript | 91 | 15 |
| [packages/tierflow/tests/visual-runtime/experience.test.ts](../../files/arbor/packages/tierflow/tests/visual-runtime/experience.test.ts.md) | TypeScript | 171 | 26 |
| [packages/tierflow/tests/visual-runtime/final-wave/integration/i4-real-import.test.ts](../../files/arbor/packages/tierflow/tests/visual-runtime/final-wave/integration/i4-real-import.test.ts.md) | TypeScript | 33 | 4 |
| [packages/tierflow/tests/visual-runtime/final-wave/integration/master.test.ts](../../files/arbor/packages/tierflow/tests/visual-runtime/final-wave/integration/master.test.ts.md) | TypeScript | 377 | 63 |
| [packages/tierflow/tests/visual-runtime/final-wave/integration/world-visual-bridge.refusals.test.ts](../../files/arbor/packages/tierflow/tests/visual-runtime/final-wave/integration/world-visual-bridge.refusals.test.ts.md) | TypeScript | 6 | 0 |
| [packages/tierflow/tests/visual-runtime/final-wave/integration/world-visual-bridge.test.ts](../../files/arbor/packages/tierflow/tests/visual-runtime/final-wave/integration/world-visual-bridge.test.ts.md) | TypeScript | 97 | 24 |
| [packages/tierflow/tests/visual-runtime/final-wave/lane-a/normalize.test.ts](../../files/arbor/packages/tierflow/tests/visual-runtime/final-wave/lane-a/normalize.test.ts.md) | TypeScript | 160 | 35 |
| [packages/tierflow/tests/visual-runtime/final-wave/lane-b/studio-editing.test.ts](../../files/arbor/packages/tierflow/tests/visual-runtime/final-wave/lane-b/studio-editing.test.ts.md) | TypeScript | 189 | 64 |
| [packages/tierflow/tests/visual-runtime/final-wave/lane-c/adapters.test.ts](../../files/arbor/packages/tierflow/tests/visual-runtime/final-wave/lane-c/adapters.test.ts.md) | TypeScript | 43 | 12 |
| [packages/tierflow/tests/visual-runtime/final-wave/lane-c/first-edit.test.ts](../../files/arbor/packages/tierflow/tests/visual-runtime/final-wave/lane-c/first-edit.test.ts.md) | TypeScript | 31 | 4 |
| [packages/tierflow/tests/visual-runtime/final-wave/lane-c/templates.test.ts](../../files/arbor/packages/tierflow/tests/visual-runtime/final-wave/lane-c/templates.test.ts.md) | TypeScript | 50 | 7 |
| [packages/tierflow/tests/visual-runtime/final-wave/lane-d/knowledge-presentation.test.ts](../../files/arbor/packages/tierflow/tests/visual-runtime/final-wave/lane-d/knowledge-presentation.test.ts.md) | TypeScript | 260 | 71 |
| [packages/tierflow/tests/visual-runtime/final-wave/lane-e/host-journey.test.ts](../../files/arbor/packages/tierflow/tests/visual-runtime/final-wave/lane-e/host-journey.test.ts.md) | TypeScript | 55 | 4 |
| [packages/tierflow/tests/visual-runtime/final-wave/lane-f/existing-clients.test.ts](../../files/arbor/packages/tierflow/tests/visual-runtime/final-wave/lane-f/existing-clients.test.ts.md) | TypeScript | 161 | 27 |
| [packages/tierflow/tests/visual-runtime/final-wave/lane-f/real-wave4b-regression.test.ts](../../files/arbor/packages/tierflow/tests/visual-runtime/final-wave/lane-f/real-wave4b-regression.test.ts.md) | TypeScript | 81 | 17 |
| [packages/tierflow/tests/visual-runtime/final-wave/lane-g/cutover-dry-run.test.ts](../../files/arbor/packages/tierflow/tests/visual-runtime/final-wave/lane-g/cutover-dry-run.test.ts.md) | TypeScript | 177 | 35 |
| [packages/tierflow/tests/visual-runtime/final-wave/lane-h/verification.test.ts](../../files/arbor/packages/tierflow/tests/visual-runtime/final-wave/lane-h/verification.test.ts.md) | TypeScript | 172 | 40 |
| [packages/tierflow/tests/visual-runtime/help.test.ts](../../files/arbor/packages/tierflow/tests/visual-runtime/help.test.ts.md) | TypeScript | 111 | 19 |
| [packages/tierflow/tests/visual-runtime/host-fixture.test.ts](../../files/arbor/packages/tierflow/tests/visual-runtime/host-fixture.test.ts.md) | TypeScript | 146 | 33 |
| [packages/tierflow/tests/visual-runtime/host-security.test.ts](../../files/arbor/packages/tierflow/tests/visual-runtime/host-security.test.ts.md) | TypeScript | 206 | 54 |
| [packages/tierflow/tests/visual-runtime/integration-2/action-adapter.test.mjs](../../files/arbor/packages/tierflow/tests/visual-runtime/integration-2/action-adapter.test.mjs.md) | JavaScript | 24 | 6 |
| [packages/tierflow/tests/visual-runtime/integration-2/compose.test.ts](../../files/arbor/packages/tierflow/tests/visual-runtime/integration-2/compose.test.ts.md) | TypeScript | 184 | 5 |
| [packages/tierflow/tests/visual-runtime/integration-2/real-a-h.test.ts](../../files/arbor/packages/tierflow/tests/visual-runtime/integration-2/real-a-h.test.ts.md) | TypeScript | 1225 | 183 |
| [packages/tierflow/tests/visual-runtime/integration-3.test.ts](../../files/arbor/packages/tierflow/tests/visual-runtime/integration-3.test.ts.md) | TypeScript | 301 | 68 |
| [packages/tierflow/tests/visual-runtime/integration-4/compose.test.ts](../../files/arbor/packages/tierflow/tests/visual-runtime/integration-4/compose.test.ts.md) | TypeScript | 590 | 85 |
| [packages/tierflow/tests/visual-runtime/integration-4/fixture.ts](../../files/arbor/packages/tierflow/tests/visual-runtime/integration-4/fixture.ts.md) | TypeScript | 239 | 31 |
| [packages/tierflow/tests/visual-runtime/knowledge-privacy.test.ts](../../files/arbor/packages/tierflow/tests/visual-runtime/knowledge-privacy.test.ts.md) | TypeScript | 122 | 19 |
| [packages/tierflow/tests/visual-runtime/knowledge.test.ts](../../files/arbor/packages/tierflow/tests/visual-runtime/knowledge.test.ts.md) | TypeScript | 101 | 23 |
| [packages/tierflow/tests/visual-runtime/layout.test.ts](../../files/arbor/packages/tierflow/tests/visual-runtime/layout.test.ts.md) | TypeScript | 105 | 18 |
| [packages/tierflow/tests/visual-runtime/render-snapshots.test.ts](../../files/arbor/packages/tierflow/tests/visual-runtime/render-snapshots.test.ts.md) | TypeScript | 53 | 6 |
| [packages/tierflow/tests/visual-runtime/render.test.ts](../../files/arbor/packages/tierflow/tests/visual-runtime/render.test.ts.md) | TypeScript | 167 | 26 |
| [packages/tierflow/tests/visual-runtime/revisions.test.ts](../../files/arbor/packages/tierflow/tests/visual-runtime/revisions.test.ts.md) | TypeScript | 72 | 27 |
| [packages/tierflow/tests/visual-runtime/wave3-a-schema.test.ts](../../files/arbor/packages/tierflow/tests/visual-runtime/wave3-a-schema.test.ts.md) | TypeScript | 169 | 26 |
| [packages/tierflow/tests/visual-runtime/wave3-b-components.test.ts](../../files/arbor/packages/tierflow/tests/visual-runtime/wave3-b-components.test.ts.md) | TypeScript | 187 | 43 |
| [packages/tierflow/tests/visual-runtime/wave3-c-replay.test.ts](../../files/arbor/packages/tierflow/tests/visual-runtime/wave3-c-replay.test.ts.md) | TypeScript | 222 | 49 |
| [packages/tierflow/tests/visual-runtime/wave3-d-render.test.ts](../../files/arbor/packages/tierflow/tests/visual-runtime/wave3-d-render.test.ts.md) | TypeScript | 158 | 28 |
| [packages/tierflow/tests/visual-runtime/wave3-e-experience.test.ts](../../files/arbor/packages/tierflow/tests/visual-runtime/wave3-e-experience.test.ts.md) | TypeScript | 290 | 65 |
| [packages/tierflow/tests/visual-runtime/wave3-f-knowledge.test.ts](../../files/arbor/packages/tierflow/tests/visual-runtime/wave3-f-knowledge.test.ts.md) | TypeScript | 303 | 50 |
| [packages/tierflow/tests/visual-runtime/wave3-g-command.test.ts](../../files/arbor/packages/tierflow/tests/visual-runtime/wave3-g-command.test.ts.md) | TypeScript | 174 | 48 |
| [packages/tierflow/tests/visual-runtime/wave3-h-host.test.ts](../../files/arbor/packages/tierflow/tests/visual-runtime/wave3-h-host.test.ts.md) | TypeScript | 224 | 49 |
| [packages/tierflow/tests/visual-runtime/wave4-a-desktop-adapter.test.ts](../../files/arbor/packages/tierflow/tests/visual-runtime/wave4-a-desktop-adapter.test.ts.md) | TypeScript | 179 | 30 |
| [packages/tierflow/tests/visual-runtime/wave4-b-phone-adapter.test.ts](../../files/arbor/packages/tierflow/tests/visual-runtime/wave4-b-phone-adapter.test.ts.md) | TypeScript | 240 | 63 |
| [packages/tierflow/tests/visual-runtime/wave4-c-device-semantics.test.ts](../../files/arbor/packages/tierflow/tests/visual-runtime/wave4-c-device-semantics.test.ts.md) | TypeScript | 283 | 70 |
| [packages/tierflow/tests/visual-runtime/wave4-d-session-reconcile.test.ts](../../files/arbor/packages/tierflow/tests/visual-runtime/wave4-d-session-reconcile.test.ts.md) | TypeScript | 296 | 64 |
| [packages/tierflow/tests/visual-runtime/wave4-e-onboarding-resume.test.ts](../../files/arbor/packages/tierflow/tests/visual-runtime/wave4-e-onboarding-resume.test.ts.md) | TypeScript | 227 | 44 |
| [packages/tierflow/tests/visual-runtime/wave4-f-device-snapshot.test.ts](../../files/arbor/packages/tierflow/tests/visual-runtime/wave4-f-device-snapshot.test.ts.md) | TypeScript | 300 | 62 |
| [packages/tierflow/tests/visual-runtime/wave4-g-typed-transport.test.ts](../../files/arbor/packages/tierflow/tests/visual-runtime/wave4-g-typed-transport.test.ts.md) | TypeScript | 164 | 36 |
| [packages/tierflow/tests/visual-runtime/wave4-h-host-status.test.ts](../../files/arbor/packages/tierflow/tests/visual-runtime/wave4-h-host-status.test.ts.md) | TypeScript | 202 | 41 |
| [packages/tierflow/tests/world-client.test.ts](../../files/arbor/packages/tierflow/tests/world-client.test.ts.md) | TypeScript | 410 | 40 |
| [packages/tierflow/tsconfig.json](../../files/arbor/packages/tierflow/tsconfig.json.md) | JSON | 22 | 0 |
| [packages/tierflow/web/app.js](../../files/arbor/packages/tierflow/web/app.js.md) | JavaScript | 688 | 91 |
| [packages/tierflow/web/index.html](../../files/arbor/packages/tierflow/web/index.html.md) | HTML | 323 | 0 |
| [packages/tierflow/web/lib/dom.js](../../files/arbor/packages/tierflow/web/lib/dom.js.md) | JavaScript | 30 | 7 |
| [packages/tierflow/web/lib/format.js](../../files/arbor/packages/tierflow/web/lib/format.js.md) | JavaScript | 87 | 24 |
| [packages/tierflow/web/lib/palette.js](../../files/arbor/packages/tierflow/web/lib/palette.js.md) | JavaScript | 52 | 5 |
| [packages/tierflow/web/lib/runboard.js](../../files/arbor/packages/tierflow/web/lib/runboard.js.md) | JavaScript | 215 | 38 |
| [packages/tierflow/web/lib/timeline.js](../../files/arbor/packages/tierflow/web/lib/timeline.js.md) | JavaScript | 355 | 89 |
| [packages/tierflow/web/lib/topology.js](../../files/arbor/packages/tierflow/web/lib/topology.js.md) | JavaScript | 279 | 66 |
| [packages/tierflow/web/lib/transcript.js](../../files/arbor/packages/tierflow/web/lib/transcript.js.md) | JavaScript | 106 | 23 |
| [packages/tierflow/web/styles.css](../../files/arbor/packages/tierflow/web/styles.css.md) | CSS | 1091 | 0 |
| [packages/tierflow/web/world.css](../../files/arbor/packages/tierflow/web/world.css.md) | CSS | 998 | 0 |
| [packages/tierflow/web/world.js](../../files/arbor/packages/tierflow/web/world.js.md) | JavaScript | 3803 | 766 |

## Symbols

| Symbol | Kind | Exported | Line |
| --- | --- | --- | --- |
| [$](../../files/arbor/packages/tierflow/web/app.js.md) | function | no | 20 |
| [A](../../files/arbor/packages/tierflow/tests/hvi-inspector.test.mjs.md) | const | no | 4 |
| [A11yResult](../../files/arbor/packages/tierflow/src/visual-runtime/components/accessibility.ts.md) | type | yes | 20 |
| [ACCENT_PATTERN](../../files/arbor/packages/tierflow/src/ui/world.ts.md) | const | no | 42 |
| [ACTION](../../files/arbor/packages/tierflow/tests/visual-runtime/integration-4/fixture.ts.md) | const | yes | 39 |
| [ACTION](../../files/arbor/packages/tierflow/tests/visual-runtime/wave4-g-typed-transport.test.ts.md) | const | no | 14 |
| [ACTIONS](../../files/arbor/packages/tierflow/tests/visual-runtime/wave3-b-components.test.ts.md) | const | no | 7 |
| [ACTION_ID](../../files/arbor/packages/tierflow/src/visual-runtime/command/ir.ts.md) | const | yes | 54 |
| [ACTION_ID](../../files/arbor/packages/tierflow/tests/visual-runtime/wave3-e-experience.test.ts.md) | const | no | 18 |
| [ACTION_REF_ID](../../files/arbor/packages/tierflow/src/visual-runtime/integration-2/compose.ts.md) | const | no | 46 |
| [ACTION_REF_ID](../../files/arbor/packages/tierflow/tests/visual-runtime/integration-2/real-a-h.test.ts.md) | const | no | 74 |
| [ACTION_REF_VERSION](../../files/arbor/packages/tierflow/src/visual-runtime/integration-2/compose.ts.md) | const | no | 47 |
| [ACTION_REF_VERSION](../../files/arbor/packages/tierflow/tests/visual-runtime/integration-2/real-a-h.test.ts.md) | const | no | 75 |
| [ACTIVE_MARKUP](../../files/arbor/packages/tierflow/src/visual-runtime/knowledge/wave4-device-snapshot-adapter.ts.md) | const | no | 80 |
| [ACTOR_REF](../../files/arbor/packages/tierflow/src/visual-runtime/integration-2/compose.ts.md) | const | no | 57 |
| [ACTOR_REF](../../files/arbor/packages/tierflow/tests/visual-runtime/integration-2/real-a-h.test.ts.md) | const | no | 66 |
| [ADAPTERS_DIR](../../files/arbor/packages/tierflow/tests/architecture-boundary.test.ts.md) | const | no | 32 |
| [ADAPTER_SCHEMA](../../files/arbor/packages/tierflow/src/visual-runtime/integration-2/action-adapter.mjs.md) | const | yes | 2 |
| [ALLOW_ALL](../../files/arbor/packages/tierflow/src/tier3/executor.ts.md) | function | no | 28 |
| [ARGS_HASH](../../files/arbor/packages/tierflow/tests/visual-runtime/wave3-e-experience.test.ts.md) | const | no | 21 |
| [ARG_KEY](../../files/arbor/packages/tierflow/src/visual-runtime/command/ir.ts.md) | const | yes | 55 |
| [AUTHORITY_SHAPED_KEYS](../../files/arbor/packages/tierflow/src/coordination/contract.ts.md) | const | yes | 49 |
| [AUTHOR_ARGS](../../files/arbor/packages/tierflow/tests/visual-runtime/final-wave/integration/master.test.ts.md) | const | no | 53 |
| [AUTHOR_PINS](../../files/arbor/packages/tierflow/tests/visual-runtime/final-wave/integration/master.test.ts.md) | const | no | 50 |
| [AUTHOR_SCOPE](../../files/arbor/packages/tierflow/tests/visual-runtime/final-wave/integration/master.test.ts.md) | const | no | 51 |
| [AbResult](../../files/arbor/packages/tierflow/src/stats.ts.md) | interface | yes | 27 |
| [AccessibilityMetadata](../../files/arbor/packages/tierflow/src/visual-runtime/components/accessibility.ts.md) | interface | yes | 3 |
| [AccessibleComponent](../../files/arbor/packages/tierflow/src/visual-runtime/components/accessibility.ts.md) | interface | yes | 11 |
| [ActionDescriptor](../../files/arbor/packages/tierflow/src/visual-runtime/command/crosswalk.ts.md) | type | yes | 17 |
| [ActionJourneyEvidence](../../files/arbor/packages/tierflow/src/visual-runtime/experience/wave4-onboarding-resume.ts.md) | interface | yes | 58 |
| [ActionState](../../files/arbor/packages/tierflow/src/visual-runtime/experience/wave4-onboarding-resume.ts.md) | type | yes | 18 |
| [ActionTarget](../../files/arbor/packages/tierflow/src/visual-runtime/command/ir.ts.md) | type | yes | 15 |
| [ActivationMethod](../../files/arbor/packages/tierflow/src/visual-runtime/input/wave4-device-semantics.ts.md) | type | no | 16 |
| [ActiveRun](../../files/arbor/packages/tierflow/src/tier3/executor.ts.md) | type | no | 48 |
| [Agent](../../files/arbor/packages/tierflow/src/tier1/agent.ts.md) | class | yes | 46 |
| [ArgRule](../../files/arbor/packages/tierflow/src/visual-runtime/command/crosswalk.ts.md) | type | yes | 4 |
| [ArgumentSpec](../../files/arbor/packages/tierflow/src/visual-runtime/host/port.ts.md) | type | yes | 8 |
| [ArgumentType](../../files/arbor/packages/tierflow/src/visual-runtime/host/port.ts.md) | type | yes | 7 |
| [AtomicReplayOptions](../../files/arbor/packages/tierflow/src/visual-runtime/revisions/wave3-atomic-replay.ts.md) | interface | yes | 28 |
| [AtomicReplayStore](../../files/arbor/packages/tierflow/src/visual-runtime/revisions/wave3-atomic-replay.ts.md) | type | yes | 24 |
| [AuditRow](../../files/arbor/packages/tierflow/src/ui/store.ts.md) | interface | no | 141 |
| [AuthorContext](../../files/arbor/packages/tierflow/src/visual-runtime/final-wave/lane-a/normalize.ts.md) | type | yes | 67 |
| [AuthorControl](../../files/arbor/packages/tierflow/src/visual-runtime/final-wave/lane-a/normalize.ts.md) | type | yes | 59 |
| [AuthorIntent](../../files/arbor/packages/tierflow/src/visual-runtime/final-wave/lane-a/normalize.ts.md) | type | yes | 30 |
| [AuthorResult](../../files/arbor/packages/tierflow/src/visual-runtime/final-wave/lane-a/normalize.ts.md) | type | yes | 88 |
| [AuthorScope](../../files/arbor/packages/tierflow/src/visual-runtime/final-wave/lane-a/normalize.ts.md) | type | yes | 26 |
| [AuthorSurface](../../files/arbor/packages/tierflow/src/visual-runtime/final-wave/lane-a/normalize.ts.md) | type | yes | 25 |
| [AuthorizedKbHelp](../../files/arbor/packages/tierflow/src/visual-runtime/experience/help.ts.md) | interface | yes | 28 |
| [Availability](../../files/arbor/packages/tierflow/src/visual-runtime/command/ir.ts.md) | type | yes | 6 |
| [BAD_TEXT](../../files/arbor/packages/tierflow/src/visual-runtime/final-wave/lane-a/normalize.ts.md) | const | no | 100 |
| [BANNED_KEYS](../../files/arbor/packages/tierflow/src/visual-runtime/render/dom.ts.md) | const | no | 44 |
| [BASE](../../files/arbor/packages/tierflow/tests/e2e.test.ts.md) | const | no | 18 |
| [BASE_TOKENS](../../files/arbor/packages/tierflow/src/theme.ts.md) | const | yes | 91 |
| [BG](../../files/arbor/packages/tierflow/web/world.js.md) | const | no | 26 |
| [BILLBOARD_HEIGHT](../../files/arbor/packages/tierflow/web/world.js.md) | const | no | 989 |
| [BOX_FACES](../../files/arbor/packages/tierflow/web/world.js.md) | const | no | 2080 |
| [BRIDGE_REQUIREMENTS](../../files/arbor/packages/tierflow/src/visual-runtime/final-wave/integration/schema-boundary.ts.md) | const | yes | 87 |
| [BUSY_TIMEOUT_MS](../../files/arbor/packages/tierflow/src/ui/store.ts.md) | const | no | 47 |
| [BUS_EVENT_TYPES](../../files/arbor/packages/tierflow/src/protocol.ts.md) | const | yes | 97 |
| [Base](../../files/arbor/packages/tierflow/src/visual-runtime/input/wave4-device-semantics.ts.md) | type | no | 56 |
| [BodyKind](../../files/arbor/packages/tierflow/src/visual-runtime/final-wave/lane-c/templates.ts.md) | type | no | 9 |
| [BridgeAssessment](../../files/arbor/packages/tierflow/src/visual-runtime/final-wave/integration/schema-boundary.ts.md) | interface | yes | 113 |
| [BridgeFailure](../../files/arbor/packages/tierflow/src/visual-runtime/final-wave/integration/world-visual-bridge.ts.md) | type | yes | 13 |
| [BridgePrincipal](../../files/arbor/packages/tierflow/src/visual-runtime/final-wave/integration/world-visual-bridge.ts.md) | interface | yes | 26 |
| [BridgeProjection](../../files/arbor/packages/tierflow/src/visual-runtime/final-wave/integration/world-visual-bridge.ts.md) | interface | yes | 32 |
| [BridgeRequirement](../../files/arbor/packages/tierflow/src/visual-runtime/final-wave/integration/schema-boundary.ts.md) | interface | yes | 76 |
| [BridgeResult](../../files/arbor/packages/tierflow/src/visual-runtime/final-wave/integration/world-visual-bridge.ts.md) | type | yes | 17 |
| [BridgeStatus](../../files/arbor/packages/tierflow/src/visual-runtime/final-wave/integration/schema-boundary.ts.md) | type | yes | 111 |
| [BusEvent](../../files/arbor/packages/tierflow/src/protocol.ts.md) | interface | yes | 80 |
| [BusEventType](../../files/arbor/packages/tierflow/src/protocol.ts.md) | type | yes | 123 |
| [CANDIDATE_KEYS](../../files/arbor/packages/tierflow/src/visual-runtime/final-wave/lane-c/templates.ts.md) | const | no | 63 |
| [CANONICAL_COMPONENT_MAP_VERSION](../../files/arbor/packages/tierflow/src/visual-runtime/components/wave3-canonical-map.ts.md) | const | yes | 13 |
| [CANONICAL_DOCUMENT](../../files/arbor/packages/tierflow/src/visual-runtime/integration-2/compose.ts.md) | const | yes | 69 |
| [CANONICAL_DOCUMENT](../../files/arbor/packages/tierflow/tests/visual-runtime/integration-2/real-a-h.test.ts.md) | const | no | 85 |
| [CANONICAL_VISUAL_SCHEMA](../../files/arbor/packages/tierflow/src/visual-runtime/final-wave/integration/schema-boundary.ts.md) | const | yes | 33 |
| [CATALOG](../../files/arbor/packages/tierflow/tests/visual-runtime/wave4-g-typed-transport.test.ts.md) | const | no | 12 |
| [CATALOG_DIGEST](../../files/arbor/packages/tierflow/tests/visual-runtime/wave3-e-experience.test.ts.md) | const | no | 19 |
| [CHAT_PATTERNS](../../files/arbor/packages/tierflow/tests/architecture-boundary.test.ts.md) | const | no | 76 |
| [CHILDREN](../../files/arbor/packages/tierflow/src/visual-runtime/components/catalog.ts.md) | const | no | 32 |
| [CLASS_NEEDS_DEVICE](../../files/arbor/packages/tierflow/src/visual-runtime/final-wave/lane-h/verification.ts.md) | const | no | 123 |
| [CLEAR_HELP](../../files/arbor/packages/tierflow/src/visual-runtime/final-wave/lane-c/first-edit.ts.md) | const | no | 15 |
| [COLORS](../../files/arbor/packages/tierflow/src/cli.ts.md) | const | no | 33 |
| [COMMAND_KINDS](../../files/arbor/packages/tierflow/src/surfaces/websocket.ts.md) | const | no | 41 |
| [COMMAND_KINDS](../../files/arbor/packages/tierflow/src/ui/commands.ts.md) | const | no | 52 |
| [COMPONENT_TYPES](../../files/arbor/packages/tierflow/src/visual-runtime/components/catalog.ts.md) | const | yes | 8 |
| [COMPOSITION_SCHEMA](../../files/arbor/packages/tierflow/src/visual-runtime/integration-2/compose.ts.md) | const | yes | 36 |
| [COORDINATION_AUTHORITY](../../files/arbor/packages/tierflow/src/coordination/contract.ts.md) | const | yes | 26 |
| [COORDINATION_CONTRACT](../../files/arbor/packages/tierflow/src/coordination/contract.ts.md) | const | yes | 20 |
| [COORDINATION_DIR](../../files/arbor/packages/tierflow/tests/architecture-boundary.test.ts.md) | const | no | 33 |
| [COORDINATION_KINDS](../../files/arbor/packages/tierflow/src/coordination/contract.ts.md) | const | yes | 29 |
| [COORDINATION_RECEIPT](../../files/arbor/packages/tierflow/src/coordination/contract.ts.md) | const | yes | 23 |
| [COORDINATION_RECEIPT_OPS](../../files/arbor/packages/tierflow/src/coordination/contract.ts.md) | const | yes | 44 |
| [CORE_FORBIDDEN_DIRS](../../files/arbor/packages/tierflow/tests/architecture-boundary.test.ts.md) | const | no | 39 |
| [CORE_FORBIDDEN_FILES](../../files/arbor/packages/tierflow/tests/architecture-boundary.test.ts.md) | const | no | 48 |
| [CURSOR_TTL_MS](../../files/arbor/packages/tierflow/src/visual-runtime/knowledge/client.ts.md) | const | no | 109 |
| [CalcTests](../../files/arbor/packages/tierflow/tests/fixtures/py-mini/test_calc.py.md) | class | yes | 11 |
| [CanonicalActionRef](../../files/arbor/packages/tierflow/src/visual-runtime/components/wave3-canonical-map.ts.md) | interface | yes | 28 |
| [CanonicalBindingRef](../../files/arbor/packages/tierflow/src/visual-runtime/components/wave3-canonical-map.ts.md) | interface | yes | 35 |
| [CanonicalComponentProjection](../../files/arbor/packages/tierflow/src/visual-runtime/components/wave3-canonical-map.ts.md) | interface | yes | 47 |
| [CanonicalComponentRef](../../files/arbor/packages/tierflow/src/visual-runtime/components/wave3-canonical-map.ts.md) | interface | yes | 18 |
| [CanonicalKnowledgeRecord](../../files/arbor/packages/tierflow/src/visual-runtime/knowledge/client.ts.md) | interface | yes | 45 |
| [CanonicalMapFailure](../../files/arbor/packages/tierflow/src/visual-runtime/components/wave3-canonical-map.ts.md) | type | yes | 14 |
| [CanonicalMapResult](../../files/arbor/packages/tierflow/src/visual-runtime/components/wave3-canonical-map.ts.md) | type | yes | 62 |
| [CanonicalViewportPlan](../../files/arbor/packages/tierflow/src/visual-runtime/components/wave3-canonical-map.ts.md) | interface | yes | 43 |
| [Capability](../../files/arbor/packages/tierflow/src/security.ts.md) | type | yes | 19 |
| [CapabilityAuthority](../../files/arbor/packages/tierflow/src/visual-runtime/experience/help.ts.md) | type | yes | 4 |
| [CapabilityDescriptor](../../files/arbor/packages/tierflow/src/visual-runtime/experience/help.ts.md) | interface | yes | 5 |
| [CapabilityEvidence](../../files/arbor/packages/tierflow/src/visual-runtime/command/ir.ts.md) | type | yes | 7 |
| [CapabilityGate](../../files/arbor/packages/tierflow/src/tier3/executor.ts.md) | type | yes | 26 |
| [CatalogAction](../../files/arbor/packages/tierflow/src/visual-runtime/command/wave3-descriptor-proof.ts.md) | type | no | 55 |
| [ChainResult](../../files/arbor/packages/tierflow/tests/visual-runtime/integration-2/real-a-h.test.ts.md) | interface | no | 189 |
| [Change](../../files/arbor/packages/tierflow/src/visual-runtime/final-wave/lane-b/studio-editing.ts.md) | interface | yes | 27 |
| [CheckId](../../files/arbor/packages/tierflow/src/visual-runtime/final-wave/lane-h/verification.ts.md) | type | yes | 11 |
| [CheckOutcome](../../files/arbor/packages/tierflow/src/visual-runtime/final-wave/lane-h/verification.ts.md) | type | yes | 54 |
| [CheckResult](../../files/arbor/packages/tierflow/src/visual-runtime/final-wave/lane-h/verification.ts.md) | interface | yes | 104 |
| [CheckSpec](../../files/arbor/packages/tierflow/src/visual-runtime/final-wave/lane-h/verification.ts.md) | type | yes | 12 |
| [Client](../../files/arbor/packages/tierflow/src/server.ts.md) | type | no | 82 |
| [ClientData](../../files/arbor/packages/tierflow/src/server.ts.md) | type | no | 83 |
| [ClientParityInput](../../files/arbor/packages/tierflow/src/visual-runtime/final-wave/lane-f/existing-clients.ts.md) | interface | yes | 117 |
| [ClientParityReport](../../files/arbor/packages/tierflow/src/visual-runtime/final-wave/lane-f/existing-clients.ts.md) | interface | yes | 104 |
| [Collector](../../files/arbor/packages/tierflow/src/ui/world.ts.md) | interface | no | 149 |
| [CommandFailure](../../files/arbor/packages/tierflow/src/ui/commands.ts.md) | class | no | 229 |
| [CommandInput](../../files/arbor/packages/tierflow/src/visual-runtime/command/ir.ts.md) | type | yes | 29 |
| [CommandRow](../../files/arbor/packages/tierflow/src/ui/store.ts.md) | interface | no | 136 |
| [CommandRow](../../files/arbor/packages/tierflow/src/visual-runtime/revisions/fixture-store.ts.md) | type | no | 8 |
| [Commit](../../files/arbor/packages/tierflow/src/visual-runtime/final-wave/lane-b/studio-editing.ts.md) | interface | yes | 35 |
| [Compilation](../../files/arbor/packages/tierflow/src/visual-runtime/command/ir.ts.md) | type | yes | 38 |
| [CompileContext](../../files/arbor/packages/tierflow/src/visual-runtime/command/compile.ts.md) | type | yes | 5 |
| [ComponentKind](../../files/arbor/packages/tierflow/src/visual-runtime/components/catalog.ts.md) | type | yes | 9 |
| [ComponentProps](../../files/arbor/packages/tierflow/src/visual-runtime/components/catalog.ts.md) | type | yes | 10 |
| [ComponentResult](../../files/arbor/packages/tierflow/src/visual-runtime/components/catalog.ts.md) | type | yes | 22 |
| [ComponentType](../../files/arbor/packages/tierflow/src/visual-runtime/components/accessibility.ts.md) | type | yes | 2 |
| [CompositionLaneLeg](../../files/arbor/packages/tierflow/src/visual-runtime/integration-2/compose.ts.md) | interface | yes | 145 |
| [CompositionSeam](../../files/arbor/packages/tierflow/src/visual-runtime/integration-2/compose.ts.md) | interface | yes | 151 |
| [ConfigLike](../../files/arbor/packages/tierflow/src/config.ts.md) | interface | yes | 74 |
| [ConfigListener](../../files/arbor/packages/tierflow/src/config.ts.md) | type | yes | 71 |
| [ConfigStore](../../files/arbor/packages/tierflow/src/config.ts.md) | class | yes | 108 |
| [ConnectOptions](../../files/arbor/packages/tierflow/tests/ui-websocket-surface.test.ts.md) | interface | no | 97 |
| [CoordinationAckInput](../../files/arbor/packages/tierflow/src/coordination/contract.ts.md) | interface | yes | 444 |
| [CoordinationBus](../../files/arbor/packages/tierflow/src/coordination/contract.ts.md) | interface | yes | 489 |
| [CoordinationCapabilities](../../files/arbor/packages/tierflow/src/coordination/contract.ts.md) | interface | yes | 117 |
| [CoordinationCheck](../../files/arbor/packages/tierflow/src/coordination/contract.ts.md) | interface | yes | 390 |
| [CoordinationCheckQuery](../../files/arbor/packages/tierflow/src/coordination/contract.ts.md) | interface | yes | 385 |
| [CoordinationClaimInput](../../files/arbor/packages/tierflow/src/coordination/contract.ts.md) | interface | yes | 427 |
| [CoordinationError](../../files/arbor/packages/tierflow/src/coordination/contract.ts.md) | class | yes | 154 |
| [CoordinationHandoffInput](../../files/arbor/packages/tierflow/src/coordination/contract.ts.md) | interface | yes | 423 |
| [CoordinationIdentity](../../files/arbor/packages/tierflow/src/coordination/contract.ts.md) | interface | yes | 143 |
| [CoordinationInbox](../../files/arbor/packages/tierflow/src/coordination/contract.ts.md) | interface | yes | 405 |
| [CoordinationInboxQuery](../../files/arbor/packages/tierflow/src/coordination/contract.ts.md) | interface | yes | 397 |
| [CoordinationInvalidError](../../files/arbor/packages/tierflow/src/coordination/contract.ts.md) | class | yes | 187 |
| [CoordinationKind](../../files/arbor/packages/tierflow/src/coordination/contract.ts.md) | type | yes | 41 |
| [CoordinationMessage](../../files/arbor/packages/tierflow/src/coordination/contract.ts.md) | interface | yes | 78 |
| [CoordinationPayload](../../files/arbor/packages/tierflow/src/coordination/contract.ts.md) | interface | yes | 64 |
| [CoordinationPoller](../../files/arbor/packages/tierflow/src/coordination/poller.ts.md) | interface | yes | 26 |
| [CoordinationPollerOptions](../../files/arbor/packages/tierflow/src/coordination/poller.ts.md) | interface | yes | 15 |
| [CoordinationReceipt](../../files/arbor/packages/tierflow/src/coordination/contract.ts.md) | interface | yes | 102 |
| [CoordinationReceiptOp](../../files/arbor/packages/tierflow/src/coordination/contract.ts.md) | type | yes | 46 |
| [CoordinationReceiptsQuery](../../files/arbor/packages/tierflow/src/coordination/contract.ts.md) | interface | yes | 460 |
| [CoordinationRegistration](../../files/arbor/packages/tierflow/src/coordination/contract.ts.md) | interface | yes | 466 |
| [CoordinationRejectedError](../../files/arbor/packages/tierflow/src/coordination/contract.ts.md) | class | yes | 176 |
| [CoordinationReleaseInput](../../files/arbor/packages/tierflow/src/coordination/contract.ts.md) | interface | yes | 436 |
| [CoordinationSendInput](../../files/arbor/packages/tierflow/src/coordination/contract.ts.md) | interface | yes | 411 |
| [CoordinationSendResult](../../files/arbor/packages/tierflow/src/coordination/contract.ts.md) | interface | yes | 450 |
| [CoordinationStatus](../../files/arbor/packages/tierflow/src/coordination/contract.ts.md) | interface | yes | 474 |
| [CoordinationUnavailableError](../../files/arbor/packages/tierflow/src/coordination/contract.ts.md) | class | yes | 168 |
| [CrosswalkResult](../../files/arbor/packages/tierflow/src/visual-runtime/command/crosswalk.ts.md) | type | yes | 25 |
| [CrosswalkRow](../../files/arbor/packages/tierflow/src/visual-runtime/command/crosswalk.ts.md) | type | yes | 5 |
| [DANGEROUS_KEYS](../../files/arbor/packages/tierflow/src/visual-runtime/document/validate.ts.md) | const | no | 26 |
| [DANGEROUS_TEXT](../../files/arbor/packages/tierflow/src/visual-runtime/components/catalog.ts.md) | const | no | 34 |
| [DEFAULT_ACCENT](../../files/arbor/packages/tierflow/web/world.js.md) | const | no | 25 |
| [DEFAULT_AUDIT_LIMIT](../../files/arbor/packages/tierflow/src/ui/store.ts.md) | const | no | 55 |
| [DEFAULT_CONFIG](../../files/arbor/packages/tierflow/src/config.ts.md) | const | yes | 55 |
| [DEFAULT_HARNESS_ROOT](../../files/arbor/packages/tierflow/scripts/generate-host-tokens.mjs.md) | const | no | 25 |
| [DEFAULT_INTERVAL_MS](../../files/arbor/packages/tierflow/src/coordination/poller.ts.md) | const | no | 34 |
| [DEFAULT_OUT](../../files/arbor/packages/tierflow/scripts/generate-host-tokens.mjs.md) | const | yes | 29 |
| [DEFAULT_RETENTION](../../files/arbor/packages/tierflow/src/ui/store.ts.md) | const | no | 49 |
| [DEFAULT_REVISION_LIMIT](../../files/arbor/packages/tierflow/src/ui/store.ts.md) | const | no | 52 |
| [DEFAULT_ROLE](../../files/arbor/packages/tierflow/src/visual-runtime/components/accessibility.ts.md) | const | no | 29 |
| [DEFAULT_WORLD_MODULE](../../files/arbor/packages/tierflow/src/ui/commands.ts.md) | const | no | 88 |
| [DENIED_EXEC](../../files/arbor/packages/tierflow/src/tier3/executor.ts.md) | const | yes | 23 |
| [DEVICE_KNOWLEDGE_SNAPSHOT_SCHEMA](../../files/arbor/packages/tierflow/src/visual-runtime/knowledge/wave4-device-snapshot-adapter.ts.md) | const | yes | 11 |
| [DEVICE_REF](../../files/arbor/packages/tierflow/src/visual-runtime/integration-2/compose.ts.md) | const | no | 58 |
| [DEVICE_REF](../../files/arbor/packages/tierflow/tests/visual-runtime/integration-2/real-a-h.test.ts.md) | const | no | 67 |
| [DIGEST](../../files/arbor/packages/tierflow/src/visual-runtime/command/ir.ts.md) | const | yes | 52 |
| [DIGEST](../../files/arbor/packages/tierflow/src/visual-runtime/revisions/wave4-session-reconcile.ts.md) | const | no | 91 |
| [DOCUMENT_ID](../../files/arbor/packages/tierflow/src/visual-runtime/integration-2/compose.ts.md) | const | no | 61 |
| [DOCUMENT_ID](../../files/arbor/packages/tierflow/tests/visual-runtime/integration-2/real-a-h.test.ts.md) | const | no | 70 |
| [DRAFT_METHODS](../../files/arbor/packages/tierflow/src/surfaces/http.ts.md) | const | no | 190 |
| [Data](../../files/arbor/packages/tierflow/src/visual-runtime/render/dom.ts.md) | type | no | 42 |
| [DeepMutable](../../files/arbor/packages/tierflow/src/ui/world.ts.md) | type | no | 142 |
| [Dependencies](../../files/arbor/packages/tierflow/src/visual-runtime/final-wave/lane-b/studio-editing.ts.md) | interface | yes | 17 |
| [DescriptorCrosswalkEvidence](../../files/arbor/packages/tierflow/src/visual-runtime/command/wave3-descriptor-proof.ts.md) | type | yes | 58 |
| [DescriptorProofContext](../../files/arbor/packages/tierflow/src/visual-runtime/command/wave3-descriptor-proof.ts.md) | type | yes | 44 |
| [DescriptorProofResult](../../files/arbor/packages/tierflow/src/visual-runtime/command/wave3-descriptor-proof.ts.md) | type | yes | 69 |
| [DesktopAdapterRequest](../../files/arbor/packages/tierflow/src/visual-runtime/device/wave4-desktop-adapter.ts.md) | interface | yes | 29 |
| [DesktopAdapterResult](../../files/arbor/packages/tierflow/src/visual-runtime/device/wave4-desktop-adapter.ts.md) | type | yes | 93 |
| [DesktopHostObservation](../../files/arbor/packages/tierflow/src/visual-runtime/device/wave4-desktop-adapter.ts.md) | interface | yes | 19 |
| [DesktopRefusalCode](../../files/arbor/packages/tierflow/src/visual-runtime/device/wave4-desktop-adapter.ts.md) | type | yes | 40 |
| [DesktopShellView](../../files/arbor/packages/tierflow/src/visual-runtime/device/wave4-desktop-adapter.ts.md) | interface | yes | 47 |
| [Device](../../files/arbor/packages/tierflow/src/visual-runtime/input/wave4-device-semantics.ts.md) | type | no | 15 |
| [DeviceInput](../../files/arbor/packages/tierflow/src/visual-runtime/input/wave4-device-semantics.ts.md) | type | yes | 63 |
| [DeviceInputContext](../../files/arbor/packages/tierflow/src/visual-runtime/input/wave4-device-semantics.ts.md) | type | yes | 42 |
| [DeviceInputResult](../../files/arbor/packages/tierflow/src/visual-runtime/input/wave4-device-semantics.ts.md) | type | yes | 73 |
| [DeviceKnowledgeCard](../../files/arbor/packages/tierflow/src/visual-runtime/knowledge/wave4-device-snapshot-adapter.ts.md) | interface | yes | 16 |
| [DeviceKnowledgeSnapshot](../../files/arbor/packages/tierflow/src/visual-runtime/knowledge/wave4-device-snapshot-adapter.ts.md) | interface | yes | 36 |
| [DeviceKnowledgeSurface](../../files/arbor/packages/tierflow/src/visual-runtime/knowledge/wave4-device-snapshot-adapter.ts.md) | type | yes | 12 |
| [DeviceSnapshotAdapter](../../files/arbor/packages/tierflow/src/visual-runtime/knowledge/wave4-device-snapshot-adapter.ts.md) | interface | yes | 51 |
| [DeviceSnapshotOptions](../../files/arbor/packages/tierflow/src/visual-runtime/knowledge/wave4-device-snapshot-adapter.ts.md) | interface | yes | 58 |
| [DeviceSnapshotState](../../files/arbor/packages/tierflow/src/visual-runtime/knowledge/wave4-device-snapshot-adapter.ts.md) | type | yes | 13 |
| [DocumentSeries](../../files/arbor/packages/tierflow/src/visual-runtime/revisions/fixture-store.ts.md) | type | no | 6 |
| [Draft](../../files/arbor/packages/tierflow/tests/world-client.test.ts.md) | interface | no | 99 |
| [DraftRow](../../files/arbor/packages/tierflow/src/ui/store.ts.md) | interface | no | 116 |
| [DraftRow](../../files/arbor/packages/tierflow/src/visual-runtime/revisions/fixture-store.ts.md) | type | no | 7 |
| [DryRunResult](../../files/arbor/packages/tierflow/src/visual-runtime/final-wave/lane-g/cutover-dry-run.ts.md) | type | yes | 18 |
| [EDGES](../../files/arbor/packages/tierflow/web/lib/topology.js.md) | const | no | 17 |
| [EFFECT_HANDLE_KEYS](../../files/arbor/packages/tierflow/src/visual-runtime/integration-2/compose.ts.md) | const | no | 282 |
| [EMPTY](../../files/arbor/packages/tierflow/src/visual-runtime/knowledge/wave3-feed-projection.ts.md) | const | no | 61 |
| [EVENT_TYPE_SET](../../files/arbor/packages/tierflow/src/protocol.ts.md) | const | no | 125 |
| [EXACT](../../files/arbor/packages/tierflow/tests/visual-runtime/wave3-e-experience.test.ts.md) | const | no | 22 |
| [EXISTING_CLIENT_IDENTITIES](../../files/arbor/packages/tierflow/src/visual-runtime/final-wave/lane-f/existing-clients.ts.md) | const | yes | 14 |
| [EXPECTED_HOTPATH](../../files/arbor/packages/tierflow/tests/e2e.test.ts.md) | const | no | 24 |
| [EXPORT_PATTERN](../../files/arbor/packages/tierflow/tests/architecture-boundary.test.ts.md) | const | no | 82 |
| [EventBus](../../files/arbor/packages/tierflow/src/bus.ts.md) | class | yes | 29 |
| [EventInput](../../files/arbor/packages/tierflow/src/bus.ts.md) | type | yes | 16 |
| [Executor](../../files/arbor/packages/tierflow/src/tier3/executor.ts.md) | class | yes | 61 |
| [ExecutorOptions](../../files/arbor/packages/tierflow/src/tier3/executor.ts.md) | interface | yes | 36 |
| [ExistingCanonicalBindings](../../files/arbor/packages/tierflow/src/visual-runtime/final-wave/lane-g/cutover-dry-run.ts.md) | type | yes | 203 |
| [ExplanationRequest](../../files/arbor/packages/tierflow/src/visual-runtime/final-wave/lane-d/knowledge-presentation.ts.md) | interface | yes | 21 |
| [ExposureConfig](../../files/arbor/packages/tierflow/src/security.ts.md) | interface | yes | 21 |
| [ExposurePolicy](../../files/arbor/packages/tierflow/src/security.ts.md) | interface | yes | 32 |
| [FAIL](../../files/arbor/packages/tierflow/src/visual-runtime/components/wave3-canonical-map.ts.md) | function | no | 66 |
| [FINAL_H_SCHEMA](../../files/arbor/packages/tierflow/src/visual-runtime/final-wave/lane-h/verification.ts.md) | const | yes | 5 |
| [FIXTURE_IDS](../../files/arbor/packages/tierflow/src/visual-runtime/knowledge/fixtures.ts.md) | const | yes | 11 |
| [FIXTURE_VIEWPORTS](../../files/arbor/packages/tierflow/src/visual-runtime/components/layout.ts.md) | const | no | 30 |
| [FONT_FACES](../../files/arbor/packages/tierflow/src/theme.ts.md) | const | yes | 126 |
| [FONT_MONO](../../files/arbor/packages/tierflow/web/lib/format.js.md) | const | yes | 4 |
| [FORBIDDEN](../../files/arbor/packages/tierflow/src/visual-runtime/document/validate.ts.md) | const | no | 25 |
| [FORBIDDEN_KEY](../../files/arbor/packages/tierflow/src/visual-runtime/command/ir.ts.md) | const | yes | 56 |
| [FORBIDDEN_VALUE](../../files/arbor/packages/tierflow/src/visual-runtime/command/ir.ts.md) | const | yes | 57 |
| [FOUNDER_JOURNEY_SCHEMA](../../files/arbor/packages/tierflow/src/visual-runtime/experience/wave3-journey-fixture.ts.md) | const | yes | 19 |
| [FOUR_MODALITIES](../../files/arbor/packages/tierflow/src/visual-runtime/final-wave/integration/master.ts.md) | const | yes | 35 |
| [FUTURE_SKEW](../../files/arbor/packages/tierflow/src/visual-runtime/knowledge/wave4-device-snapshot-adapter.ts.md) | const | no | 77 |
| [Fail](../../files/arbor/packages/tierflow/src/visual-runtime/revisions/wave3-atomic-replay.ts.md) | type | no | 37 |
| [FailTests](../../files/arbor/packages/tierflow/tests/fixtures/py-mini/test_fail.py.md) | class | yes | 15 |
| [FakeCore](../../files/arbor/packages/tierflow/tests/ui-http-surface.test.ts.md) | class | no | 137 |
| [FakeCore](../../files/arbor/packages/tierflow/tests/ui-websocket-surface.test.ts.md) | interface | no | 48 |
| [FakeCoreOptions](../../files/arbor/packages/tierflow/tests/ui-websocket-surface.test.ts.md) | interface | no | 52 |
| [FaultStage](../../files/arbor/packages/tierflow/src/visual-runtime/revisions/wave3-atomic-replay.ts.md) | type | no | 38 |
| [FenceObservation](../../files/arbor/packages/tierflow/src/visual-runtime/final-wave/lane-g/cutover-dry-run.ts.md) | type | yes | 42 |
| [FirstEditControl](../../files/arbor/packages/tierflow/src/visual-runtime/final-wave/lane-c/first-edit.ts.md) | interface | yes | 9 |

_Showing 250 of 7293 symbols._

## Dependencies

### Outgoing

| Target | Imports |
| --- | --- |
| external:node:assert | 48 |
| external:node:test | 48 |
| external:node:fs | 28 |
| external:node:crypto | 27 |
| external:bun:test | 23 |
| external:node:path | 20 |
| external:node:os | 8 |
| external:node:url | 4 |
| external:bun:sqlite | 3 |
| external:calc | 2 |
| external:unittest | 2 |
| external:node:perf_hooks | 1 |
| external:node:process | 1 |
| external:node:readline | 1 |

### Incoming

| Source | Imports |
| --- | --- |
| arbor/tierflow | 2 |

## Context annotations

| Kind | File | Line | Owner | Text |
| --- | --- | --- | --- | --- |
| context | packages/tierflow/scripts/generate-host-tokens.mjs | 2 | — | Generates the harness host tokens CSS from the vivim-ui canonical theme (src/theme.ts) — vivim-ui is the token authority, the harness file is a build artifact. |
| context | packages/tierflow/src/theme.ts | 2 | — | Canonical VIVIM design-token source — the single theme authority whose generated copy is consumed by the harness host at vivim-web-harness/apps/vivim-host/public/vivim-tokens.css. |
| invariant | packages/tierflow/src/theme.ts | 6 | — | Regeneration must never drop a custom property the host uses (parity oracle in test/generate-host-tokens.test.mjs). |
| owner | packages/tierflow/scripts/generate-host-tokens.mjs | 3 | one-app-m5 | one-app-m5 |
| owner | packages/tierflow/src/theme.ts | 3 | one-app-m5 | one-app-m5 |
| task | packages/tierflow/scripts/generate-host-tokens.mjs | 4 | — | M5 vivim-ui token authority (one-app fan-out 2026-11-09) |
| task | packages/tierflow/src/theme.ts | 4 | — | M5 vivim-ui token authority (one-app fan-out 2026-11-09) |

---

[HQ wiki](../../index.md) · [Symbols](../../symbols.md) · [Dependency graph](../../graph.md) · [Documentation](../../docs.md) · [Changes](../../changes.md) · [Open tasks](../../todos.md) · [Deprecated](../../deprecated.md) · [Agent annotation protocol](../../protocol.md) · [Glossary](../../glossary.md) · [Using HQ](../../context.md) · [Capabilities](../../capabilities.md) · [Search index](../../search.json) · [Browser view](../../index.html)
