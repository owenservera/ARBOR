# File: studio/src/export/schemas.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/export/schemas.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 5287 B |
| Lines | 83 |
| Hash | c16eca4f906c |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| DRAFT | const | 4 | no | const DRAFT = &#39;https://json-schema.org/draft/2020-12/schema&#39;; |
| typeDescription | function | 7 | no | function typeDescription(type) { |
| fields | const | 9 | no | const fields = Array.isArray(type.fields) ? type.fields : Object.entries(type.fields ?? {}).map(([name, value]) =&gt; ({ name, ...value })); |
| savedArtifacts | function | 20 | no | async function savedArtifacts(session) { |
| loadArtifacts | const | 22 | no | const loadArtifacts = await exportCapability(&#39;../replay/derive-all.mjs&#39;, &#39;loadArtifacts&#39;, &#39;Derived schema artifacts&#39;); |
| sessionSchemas | function | 30 | yes | export async function sessionSchemas(session) { |
| loaded | const | 31 | no | const loaded = await savedArtifacts(session); |
| artifacts | const | 32 | no | const artifacts = loaded?.artifacts ?? (loaded &amp;&amp; typeof loaded === &#39;object&#39; ? loaded : {}); |
| model | const | 33 | no | const model = artifacts.model ?? session.kv.get(&#39;MODEL&#39;, null); |
| entries | const | 35 | no | const entries = (model?.types ?? []).map((type) =&gt; ({ id: String(type.id ?? type.name), name: type.name ?? type.id, ...typeDescription(type) })); |
| schemas | const | 36 | no | const schemas = artifacts.schemas ?? artifacts.schemaProfiler ?? session.kv.get(&#39;SCHEMAS&#39;, null); |
| groups | const | 37 | no | const groups = Array.isArray(schemas) ? schemas : schemas?.groups ?? []; |
| description | const | 39 | no | const description = group.schema ?? group.description; |
| id | const | 40 | no | const id = group.id ?? group.group ?? group.name; |
| alreadyJsonSchema | function | 47 | no | function alreadyJsonSchema(description) { |
| portableSchema | function | 51 | no | async function portableSchema(entry) { |
| toJsonSchema | const | 56 | no | const toJsonSchema = await exportCapability(&#39;../shapes/profiler.mjs&#39;, &#39;toJsonSchema&#39;, &#39;JSON Schema conversion&#39;); |
| schemaForType | function | 62 | yes | export async function schemaForType(session, name, { jsonSchema = false } = {}) { |
| entries | const | 63 | no | const entries = await sessionSchemas(session); |
| exact | const | 64 | no | const exact = entries.filter((entry) =&gt; entry.id === name); |
| matches | const | 65 | no | const matches = exact.length ? exact : entries.filter((entry) =&gt; String(entry.name).toLowerCase() === String(name).toLowerCase()); |
| exportSchemas | function | 70 | yes | export async function exportSchemas(session, outFile, { type } = {}) { |
| entries | const | 71 | no | const entries = await sessionSchemas(session); |
| selected | const | 72 | no | const selected = type ? entries.filter((entry) =&gt; entry.id === type \|\| String(entry.name).toLowerCase() === String(type).toLowerCase()) : entries; |
| definitions | const | 74 | no | const definitions = []; |
| bundle | const | 76 | no | const bundle = { $schema: DRAFT, title: `Observed schemas for ${session.id}`, &#39;x-session&#39;: session.id, |
| text | const | 79 | no | const text = JSON.stringify(bundle, null, 2) + &#39;\\n&#39;; |
| sink | const | 80 | no | const sink = openSink(outFile); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./capabilities.mjs | import | 1 | [studio/src/export/capabilities.mjs](./capabilities.mjs.md) |
| ./export.mjs | import | 2 | [studio/src/export/export.mjs](./export.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/bin/commands/knowledge.mjs](../../bin/commands/knowledge.mjs.md) | ../../src/export/schemas.mjs |
| [studio/src/export/export.mjs](./export.mjs.md) | ./schemas.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
import { exportCapability } from './capabilities.mjs';
import { openSink, ExportError } from './export.mjs';

const DRAFT = 'https://json-schema.org/draft/2020-12/schema';

// Older MODEL snapshots retain field summaries, not the full nested schema. Mark that loss.
function typeDescription(type) {
  if (type.schema) return { description: type.schema, summaryOnly: false };
  const fields = Array.isArray(type.fields) ? type.fields : Object.entries(type.fields ?? {}).map(([name, value]) => ({ name, ...value }));
  return { summaryOnly: true, description: { type: 'object', count: type.support ?? 0,
    fields: Object.fromEntries(fields.map((field) => [field.name, field.schema ?? {
      type: field.type, nullable: field.nullable, presence: field.presence,
      // Rounded presence values cannot prove a field was always present.
      required: field.required === true,
      ...(field.enum ? { string: { enum: field.enum.map((value) => ({ value })) } } : {}),
    }])) } };
}

// loadArtifacts is optional. A missing derive-all engine must not block schemas already stored on the session.
async function savedArtifacts(session) {
  try {
    const loadArtifacts = await exportCapability('../replay/derive-all.mjs', 'loadArtifacts', 'Derived schema artifacts');
    return await loadArtifacts(session);
  } catch (error) {
    if (error.code !== 'CAPABILITY_UNAVAILABLE' && !session.kv.get('MODEL', null) && !session.kv.get('SCHEMAS', null)) throw error;
    return null;
  }
}

export async function sessionSchemas(session) {
  const loaded = await savedArtifacts(session);
  const artifacts = loaded?.artifacts ?? (loaded && typeof loaded === 'object' ? loaded : {});
  const model = artifacts.model ?? session.kv.get('MODEL', null);
  if (model?.error) throw new ExportError(`Knowledge derivation failed: ${model.error}`, 'KNOWLEDGE_FAILED');
  const entries = (model?.types ?? []).map((type) => ({ id: String(type.id ?? type.name), name: type.name ?? type.id, ...typeDescription(type) }));
  const schemas = artifacts.schemas ?? artifacts.schemaProfiler ?? session.kv.get('SCHEMAS', null);
  const groups = Array.isArray(schemas) ? schemas : schemas?.groups ?? [];
  for (const group of groups) {
    const description = group.schema ?? group.description;
    const id = group.id ?? group.group ?? group.name;
    if (id !== undefined && description && !entries.some((entry) => entry.id === String(id))) entries.push({ id: String(id), name: group.name ?? String(id), description, summaryOnly: false });
  }
  if (!model && !schemas) throw new ExportError(`No schemas for ${session.id}. Run "studio derive ${session.id}" first.`, 'NO_KNOWLEDGE');
  return entries;
}

function alreadyJsonSchema(description) {
  return !!description && typeof description === 'object' && (description.$schema || description.properties || description.$ref);
}

async function portableSchema(entry) {
  if (alreadyJsonSchema(entry.description)) {
    return { $schema: entry.description.$schema ?? DRAFT, ...entry.description, title: entry.description.title ?? entry.name,
      'x-capture-type': entry.id, 'x-summary-only': entry.summaryOnly };
  }
  const toJsonSchema = await exportCapability('../shapes/profiler.mjs', 'toJsonSchema', 'JSON Schema conversion');
  return { ...toJsonSchema(entry.description), title: entry.name,
    'x-capture-type': entry.id, 'x-summary-only': entry.summaryOnly,
    $comment: 'Inferred from observed samples, not an authoritative server contract. Summary-only schemas omit unavailable nested detail.' };
}

export async function schemaForType(session, name, { jsonSchema = false } = {}) {
  const entries = await sessionSchemas(session);
  const exact = entries.filter((entry) => entry.id === name);
  const matches = exact.length ? exact : entries.filter((entry) => String(entry.name).toLowerCase() === String(name).toLowerCase());
  if (matches.length !== 1) throw new ExportError(matches.length ? `Ambiguous type "${name}"; use its exact id.` : `No schema for type "${name}" in ${session.id}.`, 'NO_KNOWLEDGE');
  return jsonSchema ? portableSchema(matches[0]) : { session: session.id, ...matches[0] };
}

export async function exportSchemas(session, outFile, { type } = {}) {
  const entries = await sessionSchemas(session);
  const selected = type ? entries.filter((entry) => entry.id === type || String(entry.name).toLowerCase() === String(type).toLowerCase()) : entries;
  if (type && selected.length !== 1) throw new ExportError(`Expected one schema for "${type}", found ${selected.length}. Use an exact type id.`, 'NO_KNOWLEDGE');
  const definitions = [];
  for (const entry of selected) definitions.push([entry.id, await portableSchema(entry)]);
  const bundle = { $schema: DRAFT, title: `Observed schemas for ${session.id}`, 'x-session': session.id,
    $comment: 'Definition bundle; select a type with a JSON Pointer into $defs. The root imposes no instance constraint.',
    $defs: Object.fromEntries(definitions) };
  const text = JSON.stringify(bundle, null, 2) + '\n';
  const sink = openSink(outFile);
```

_First 80 of 84 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
