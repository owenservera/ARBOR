# File: hq/capabilities/registry/taxonomy.v1.json

> Generated 2026-11-19 · JSON · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/capabilities/registry/taxonomy.v1.json |
| Language | JSON |
| Kind | config |
| Size | 10905 B |
| Lines | 197 |
| Hash | 6de2697b30f2 |
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
  "schema": "hq.capability-taxonomy/1",
  "version": 1,
  "description": "Bounded capability taxonomy for static candidate mapping. A node is a vocabulary entry, never an execution grant.",
  "domains": [
    { "id": "discovery", "name": "File and path discovery", "description": "Find, resolve and represent files without executing package code." },
    { "id": "configuration", "name": "Configuration and input", "description": "Parse argv, normalize settings and read manifests." },
    { "id": "orchestration", "name": "Task orchestration", "description": "Compose, sequence and run bounded work." },
    { "id": "templates", "name": "Templates and scaffolding", "description": "Load, render and emit file content from templates." },
    { "id": "state", "name": "State and persistence", "description": "Store bounded key/value state and options." },
    { "id": "dependencies", "name": "Dependency inspection", "description": "Resolve, normalize and verify package dependency data." }
  ],
  "nodes": [
    {
      "id": "discovery.glob",
      "domain": "discovery",
      "name": "Glob matching",
      "description": "Match paths against glob patterns.",
      "rules": { "name": ["glob", "micromatch", "minimatch", "matched", "multimatch", "picomatch", "nanomatch"], "description": ["glob", "wildcard", "pattern match"], "keywords": ["glob", "pattern", "match"] }
    },
    {
      "id": "discovery.walk",
      "domain": "discovery",
      "name": "Directory walking",
      "description": "Enumerate directory trees and file streams.",
      "rules": { "name": ["glob-stream", "walk", "readdir", "vinyl-fs", "through2"], "description": ["file system", "directory", "stream", "walk"], "keywords": ["fs", "walk", "stream"] }
    },
    {
      "id": "discovery.resolve",
      "domain": "discovery",
      "name": "Path and module resolution",
      "description": "Resolve files, modules and relative paths.",
      "rules": { "name": ["^resolve$", "resolve-", "resolve-glob", "resolve-dir", "global-modules", "find-up"], "description": ["resolve", "require.resolve", "filepath"], "keywords": ["resolve", "path", "module"] }
    },
    {
      "id": "discovery.vinyl",
      "domain": "discovery",
      "name": "Virtual file objects",
      "description": "Represent files as inspectable objects before writing.",
      "rules": { "name": ["vinyl", "cloneable-readable", "clone-stats"], "description": ["virtual file", "vinyl", "file object"], "keywords": ["vinyl", "file", "stream"] }
    },
    {
      "id": "discovery.frontmatter",
      "domain": "discovery",
      "name": "Front-matter parsing",
      "description": "Split structured metadata from document bodies.",
      "rules": { "name": ["gray-matter", "front-matter", "parse-front"], "description": ["front matter", "frontmatter", "yaml front"], "keywords": ["yaml", "front-matter", "metadata"] }
    },
    {
      "id": "configuration.argv",
      "domain": "configuration",
      "name": "argv parsing",
      "description": "Normalize command-line arguments into typed options.",
      "rules": { "name": ["minimist", "argparse", "yargs", "expand-args", "base-cli"], "description": ["argv", "command line", "arguments", "options"], "keywords": ["argv", "cli", "args"] }
    },
    {
      "id": "configuration.schema",
      "domain": "configuration",
      "name": "Schema normalization",
      "description": "Validate and normalize configuration against a schema.",
      "rules": { "name": ["schema", "map-schema", "base-config", "normalize-config"], "description": ["schema", "normaliz", "validate config"], "keywords": ["schema", "config", "normalize"] }
    },
    {
      "id": "configuration.store",
      "domain": "configuration",
      "name": "Configuration store",
      "description": "Persist and retrieve namespaced configuration values.",
      "rules": { "name": ["data-store", "base-store", "option-cache", "common-config", "config-store"], "description": ["config store", "store config", "persist", "options"], "keywords": ["config", "store", "options"] }
    },
    {
      "id": "configuration.environment",
      "domain": "configuration",
      "name": "Environment normalization",
      "description": "Build a normalized environment from arguments, files or instances.",
      "rules": { "name": ["base-env", "expand-env", "env-"], "description": ["environment", "normalized environment"], "keywords": ["env", "environment"] }
    },
    {
      "id": "configuration.package",
      "domain": "configuration",
      "name": "Manifest normalization",
```

_First 80 of 198 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
