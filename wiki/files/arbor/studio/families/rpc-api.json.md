# File: studio/families/rpc-api.json

> Generated 2026-11-19 · JSON · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | studio/families/rpc-api.json |
| Language | JSON |
| Kind | config |
| Size | 2794 B |
| Lines | 46 |
| Hash | 54078913c867 |
| Test | no |
| Generated | no |
| Component | studio |

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
  "name": "rpc-api",
  "version": 1,
  "description": "Sites whose data arrives through a uniform RPC surface rather than per-resource REST: GraphQL, JSON-RPC, gRPC-Web or a single batched POST endpoint. The shared model is the call itself — operation name, variables shape, result shape and errors — which is what makes such a site re-readable later.",
  "members": [],
  "detect": [
    { "signal": "graphql_api", "weight": 0.45, "label": "a GraphQL endpoint or subscription" },
    { "signal": "rpc_envelope", "weight": 0.4, "label": "JSON-RPC or gRPC framing" },
    { "signal": "url_path", "patterns": ["/graphql", "/gql", "/rpc", "/jsonrpc", "/api/v\\d+/batch", "/trpc", "/twirp/"], "weight": 0.25, "label": "an RPC-style request path" },
    { "signal": "field_name", "names": ["operationName", "variables", "extensions", "jsonrpc", "params", "procedure", "errors"], "weight": 0.25, "label": "RPC envelope fields" },
    { "signal": "method_used", "methods": ["POST"], "weight": 0.1, "label": "POST-only data requests" },
    { "signal": "event_type_variety", "minTypes": 3, "weight": 0.1, "label": "several operation names on one endpoint" },
    { "signal": "auth_gated", "weight": 0.05, "label": "account-scoped responses" }
  ],
  "entities": {
    "call": {
      "key": "id",
      "revisions": "all",
      "fields": {
        "id": { "type": "id", "names": ["id", "request_id", "operation_id", "call_id"] },
        "operation": { "type": "string", "names": ["operationName", "operation", "method", "procedure", "name", "query_name"] },
        "kind": { "type": "enum", "values": ["query", "mutation", "subscription", "call", "unknown"], "names": ["type", "kind", "operation_type"], "valueHints": ["query", "mutation", "subscription"] },
        "endpoint": { "type": "string", "names": ["endpoint", "url", "path", "service"] },
        "at": { "type": "time", "names": ["timestamp", "ts", "time", "at"] }
      }
    },
    "result": {
      "key": "id",
      "parent": { "entity": "call", "field": "call_id" },
      "openFields": true,
      "fields": {
        "call_id": { "type": "id", "names": ["id", "request_id", "operation_id"] },
        "data": { "type": "text", "names": ["data", "result", "payload", "response"], "prefer": "longest" },
        "status": { "type": "string", "names": ["status", "code", "state"] }
      }
    },
    "error": {
      "embeddedIn": "result",
      "fields": {
        "message": { "type": "text", "names": ["message", "error", "detail", "description", "reason"] },
        "code": { "type": "string", "names": ["code", "errorType", "type", "status", "extensions.code"] },
        "path": { "type": "string", "names": ["path", "pointer", "field", "location"] }
      }
    }
  }
}
```

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
