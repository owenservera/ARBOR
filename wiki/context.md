# Using HQ

> Generated 2026-11-19 · CLI, MCP and task-scoped reading

Everything HQ does is local: one SQLite index under `.hq/`, deterministic output, no network calls.

Owner-facing words: **Space** for a registered project, **Discover** for a context bundle, **Build** for this wiki, **Progress Report** for the brief and **Activity Record** for the receipts ledger. Engineering pages keep the precise term; see the [Glossary](./glossary.md).

## Commands

```sh
hq index                 # index every registered project
hq index --changed       # re-index changed files only
hq search "query"        # full text over indexed content
hq symbols name          # symbol lookup
hq context "task"        # Discover — context bundle
hq brief                 # Progress Report
hq receipts              # Activity Record
hq wiki                  # Build — regenerate this wiki
hq mcp                   # expose the index over MCP
```

## Read order

1. Start with the project page for scope and entrypoints.

2. Open the module page that owns the code you are changing.

3. Use the file page for symbols, imports, dependents and annotations.

4. Check the dependency graph before cross-module edits.

5. Read the protocol before adding or changing inline annotations.

6. For agent work, compose a context bundle instead of pasting whole files.

## Projects

| Project | Files | Symbols | Modules |
| --- | --- | --- | --- |
| [arbor](./projects/arbor.md) | 2593 | 60255 | 23 |

## Surfaces

- [Symbols](./symbols.md) — Symbol index for name-first navigation.
- [Dependency graph](./graph.md) — Dependency graph for impact review.
- [Documentation](./docs.md) — Documentation catalog.
- [Changes](./changes.md) — Commit history and drift.
- [Open tasks](./todos.md) — Open task annotations with owners.
- [Deprecated](./deprecated.md) — Scheduled removals and replacements.
- [Agent annotation protocol](./protocol.md) — Annotation tags and rules.
- [Glossary](./glossary.md) — VIVIM owner vocabulary next to the engineering term.

## Notes

- Generated pages are deterministic: the same index produces byte-identical output.

- Secret paths are excluded from pages, symbols, search and graphs.

- Rebuild the wiki after indexing; do not hand-edit generated pages.

---

[HQ wiki](./index.md) · [Symbols](./symbols.md) · [Dependency graph](./graph.md) · [Documentation](./docs.md) · [Changes](./changes.md) · [Open tasks](./todos.md) · [Deprecated](./deprecated.md) · [Agent annotation protocol](./protocol.md) · [Glossary](./glossary.md) · [Using HQ](./context.md) · [Capabilities](./capabilities.md) · [Search index](./search.json) · [Browser view](./index.html)
