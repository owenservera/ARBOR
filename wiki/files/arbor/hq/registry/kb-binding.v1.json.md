# File: hq/registry/kb-binding.v1.json

> Generated 2026-11-19 · JSON · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/registry/kb-binding.v1.json |
| Language | JSON |
| Kind | config |
| Size | 14423 B |
| Lines | 362 |
| Hash | d625bb10f797 |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

_No symbols._

## Imports

_No imports._

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```json
{
  "schema": "hq.kb-binding/1",
  "version": 1,
  "generatedFrom": {
    "path": "vivim-web-harness:docs/knowledge/kb-types.v1.json",
    "sha256": "415a3b85886adb04b3c6a8ac92905fd471d76e7f6ca332de7a7293f4ed090d73"
  },
  "bindings": [
    {
      "kbId": "KB-ACTION",
      "title": "Typed actions and capabilities",
      "target": "grammar.action",
      "targetKind": "canonical",
      "family": "system",
      "reason": "HQ already declares the action id namespace (grammar.action); the KB type names that same family and must not be duplicated as an extension."
    },
    {
      "kbId": "KB-AUTHORITY-GRANT",
      "title": "Authority grants and revocations",
      "target": "hq.ext.kb-authority-grant",
      "targetKind": "unbound",
      "family": "system",
      "reason": "Grant state is permission authority; HQ is read-only and must not expose a lookup that could be read as an approval."
    },
    {
      "kbId": "KB-AUTHORITY-RULE",
      "title": "Authority and precedence rules",
      "target": "hq.ext.kb-authority-rule",
      "targetKind": "extension",
      "family": "system",
      "reason": "HQ records and compares authority rules; it never grants, so the rule type stays a namespaced catalog entry."
    },
    {
      "kbId": "KB-CAPABILITY-STATUS",
      "title": "Capability and evidence status",
      "target": "hq.ext.kb-capability-status",
      "targetKind": "extension",
      "family": "operational",
      "reason": "The HQ capability registry is HQ-owned; this KB status projection stays namespaced and never overwrites it."
    },
    {
      "kbId": "KB-CHROME-PROFILE",
      "title": "Chrome profiles and account bindings",
      "target": "hq.ext.kb-chrome-profile",
      "targetKind": "extension",
      "family": "system",
      "reason": "Profile paths and account bindings are sensitive (S2); HQ catalogues the type but never stores cookies or profile data."
    },
    {
      "kbId": "KB-COMMAND",
      "title": "VIVIM commands and settings",
      "target": "hq.ext.kb-command",
      "targetKind": "extension",
      "family": "operational",
      "reason": "Commands are generated from source; the type is catalogued as vocabulary and is never an authoritative command list."
    },
    {
      "kbId": "KB-COMMITMENT",
      "title": "Commitments and follow-ups",
      "target": "hq.ext.kb-commitment",
      "targetKind": "extension",
      "family": "personal",
      "reason": "HQ holds no commitment or reminder store; the type is vocabulary only and schedules nothing."
    },
    {
      "kbId": "KB-CONFIG-SETTING",
      "title": "Platform-wide configuration settings",
      "target": "hq.ext.kb-config-setting",
      "targetKind": "extension",
      "family": "system",
      "reason": "Config files remain the write authority and secrets stay out; a namespaced type avoids an HQ config store."
    },
    {
      "kbId": "KB-CONTRACT",
      "title": "Platform contracts",
      "target": "hq.ext.kb-contract",
      "targetKind": "extension",
      "family": "system",
      "reason": "Contract files stay authoritative; the KB catalog type is discoverable vocabulary and not an HQ contract id."
    },
```

_First 80 of 363 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
