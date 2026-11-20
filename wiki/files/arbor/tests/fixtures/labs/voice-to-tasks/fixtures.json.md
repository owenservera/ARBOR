# File: tests/fixtures/labs/voice-to-tasks/fixtures.json

> Generated 2026-11-19 · JSON · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | tests/fixtures/labs/voice-to-tasks/fixtures.json |
| Language | JSON |
| Kind | config |
| Size | 1542 B |
| Lines | 12 |
| Hash | ec34b9af9ebb |
| Test | yes |
| Generated | no |
| Component | tests |

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
[
  {"name":"en-multi","locale":"en-US","text":"Email the supplier tomorrow; send the invoice by Friday; check the pump filter. I enjoyed the beach.","expectedActions":["Email the supplier tomorrow","send the invoice by Friday","check the pump filter"]},
  {"name":"en-irrelevant","locale":"en-US","text":"I enjoyed the beach. The sky is blue.","expectedActions":[]},
  {"name":"en-negation","locale":"en-US","text":"Don't send the invoice. Never order the filters.","expectedActions":[]},
  {"name":"en-quick","locale":"en-US","text":"Call the plumber tomorrow.","expectedActions":["Call the plumber tomorrow"]},
  {"name":"en-unknown","locale":"en-GB","text":"Book the appointment next Friday.","expectedActions":["Book the appointment next Friday"]},
  {"name":"es-tasks","locale":"es-ES","text":"Llamar al técnico mañana; enviar la factura pasado mañana.","expectedActions":["Llamar al técnico mañana","enviar la factura pasado mañana"]},
  {"name":"es-none","locale":"es-ES","text":"Ayer fui a la playa.","expectedActions":[]},
  {"name":"ca-tasks","locale":"ca-ES","text":"Trucar al metge demà; revisar el filtre demà passat.","expectedActions":["Trucar al metge demà","revisar el filtre demà passat"]},
  {"name":"ca-none","locale":"ca-ES","text":"M'agrada la platja.","expectedActions":[]},
  {"name":"en-three","locale":"en-US","text":"Pay the electricity bill; prepare the presentation; contact the supplier.","expectedActions":["Pay the electricity bill","prepare the presentation","contact the supplier"]}
]
```

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
