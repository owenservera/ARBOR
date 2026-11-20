# File: studio/src/studio/ui/native-bridge.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | studio/src/studio/ui/native-bridge.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 2947 B |
| Lines | 77 |
| Hash | 6db46c8d9717 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| NATIVE_PROGRAM_SCHEMA | const | 19 | yes | export const NATIVE_PROGRAM_SCHEMA = &#39;vivim.native-program/1&#39;; |
| nativeProbeRequest | function | 25 | yes | export function nativeProbeRequest() { |
| tauriInvoke | function | 56 | yes | export function tauriInvoke() { |
| invoke | const | 57 | no | const invoke = globalThis.window?.__TAURI__?.core?.invoke; |
| validateNativeProgram | function | 68 | yes | export async function validateNativeProgram(request) { |
| invoke | const | 69 | no | const invoke = tauriInvoke(); |
| result | const | 72 | no | const result = await invoke(&#39;validate_native_program&#39;, { request }); |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [studio/src/studio/ui/world-view.mjs](./world-view.mjs.md) | ./native-bridge.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
/** Native Tauri bridge for the Studio web UI.
 *
 * The Studio page is served from http://127.0.0.1 by the Node Host and is also
 * loaded inside the VIVIM Host desktop shell (src-tauri). Inside that shell, and
 * only there, Tauri v2 injects `window.__TAURI__` (app.withGlobalTauri) and the
 * `default` capability exposes the IPC to the 127.0.0.1 remote origin.
 *
 * Exposed surface is exactly one inert, read-only command:
 * `validate_native_program` (src-tauri/src/main.rs) backed by
 * vivim_programmability_core::wire::validate_json. A successful answer is a
 * validation result with executionAuthorized:false — never an effect permit and
 * never a grant.
 *
 * Outside Tauri (plain browser, plain Node test) every helper reports
 * `{ available: false }` and callers change nothing, so non-Tauri runtimes are
 * unaffected.
 */

export const NATIVE_PROGRAM_SCHEMA = 'vivim.native-program/1';

// Strict wire shape from core/programmability/src/wire.rs: Request, WireProgram,
// WirePolicy, WireStep and WireSource all use #[serde(deny_unknown_fields)], so
// this payload must carry exactly these keys and nothing more. Values mirror the
// wire.rs unit-test vector (valid_wire_compiles_inertly).
export function nativeProbeRequest() {
  return {
    schema: NATIVE_PROGRAM_SCHEMA,
    program: {
      id: 'mission',
      revision: 1,
      policy_id: 'owner-policy',
      policy_revision: 1,
      steps: [{
        id: 'read',
        kind: 'evaluate',
        dependencies: [],
        inputs: [],
        output_data_class: 'public',
        risk: 'R0',
        destination: null,
      }],
    },
    policy: {
      id: 'owner-policy',
      revision: 1,
      max_risk: 'R0',
      max_input_class: 'private',
      max_output_class: 'private',
      allowed_destinations: [],
      allow_effect_candidates: false,
    },
  };
}

/** The Tauri v2 invoke function when running inside the desktop shell, else null. */
export function tauriInvoke() {
  const invoke = globalThis.window?.__TAURI__?.core?.invoke;
  return typeof invoke === 'function' ? invoke : null;
}

/**
 * Call the native validator. Resolves with `{ available: boolean, result, error }`:
 * - `{ available: false, result: null, error: null }` outside Tauri.
 * - `{ available: true, result }` with the wire.rs response on success.
 * - `{ available: true, result: null, error }` when the invoke itself fails.
 * Never throws; never authorizes an effect.
 */
export async function validateNativeProgram(request) {
  const invoke = tauriInvoke();
  if (!invoke) return { available: false, result: null, error: null };
  try {
    const result = await invoke('validate_native_program', { request });
    return { available: true, result: result ?? null, error: null };
  } catch (error) {
    return { available: true, result: null, error: String(error?.message ?? error) };
  }
}
```

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
