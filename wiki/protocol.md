# Agent annotation protocol

> Generated 2026-11-19 · inline comments that give the index its context

HQ reads structured `@hq:` tags from comments. They are the smallest durable unit of intent an agent can leave behind.

## Tags

| Tag | Use it for |
| --- | --- |
| `@hq:context` | What this file or block is for, in one line. Put it at the top of the file. |
| `@hq:why` | A non-obvious decision, tradeoff or constraint that shaped the code. |
| `@hq:invariant` | A rule that must stay true for correctness or safety. |
| `@hq:see` | A pointer to another file, symbol or `path:line` anchor. |
| `@hq:todo` | Known work. Add an owner when one exists: `@hq:todo(name): text`. |
| `@hq:owner` | The person or team accountable for the file or block. |
| `@hq:task` | The task or ticket this code serves. |
| `@hq:risk` | A hazard, failure mode or security concern. |
| `@hq:deprecated` | Scheduled removal, with a replacement pointer when possible. |

## Shape

```js
// @hq:context: resolves import specifiers for the local index
// @hq:why: relative paths win over package names to keep the index local
// @hq:todo(owner): add Windows drive-letter coverage
```

## Rules

- Comments only (`//`, `#`, `/* */`, `--`, `<!-- -->`); ordinary `// TODO` is not an annotation.

- One line per tag. Text is capped at 500 characters.

- Never write credentials, tokens, keys or session state into a comment.

- Do not restate the signature; explain intent the code cannot show.

- `@hq:todo` without an owner is a warning in protocol lint.

- `@hq:deprecated` should pair with `@hq:see` pointing at the replacement.

- Generated wiki pages are read-only; edit the source and rebuild.

## Current annotations

| Kind | Count |
| --- | --- |
| context | 162 |
| deprecated | 1 |
| invariant | 356 |
| owner | 162 |
| risk | 1 |
| see | 171 |
| task | 141 |
| todo | 2 |
| v2:action | 1 |
| v2:capability | 1 |
| v2:consumes | 3 |
| v2:contract | 1 |
| v2:effect | 1 |
| v2:emits | 2 |
| v2:evidence | 1 |
| v2:type | 2 |
| why | 55 |

---

[HQ wiki](./index.md) · [Symbols](./symbols.md) · [Dependency graph](./graph.md) · [Documentation](./docs.md) · [Changes](./changes.md) · [Open tasks](./todos.md) · [Deprecated](./deprecated.md) · [Agent annotation protocol](./protocol.md) · [Glossary](./glossary.md) · [Using HQ](./context.md) · [Capabilities](./capabilities.md) · [Search index](./search.json) · [Browser view](./index.html)
