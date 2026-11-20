#!/usr/bin/env node
// scripts/batch-evidence/tauri-schema-permissions.test.mjs
//
// Verifies the VERIFY:CONSOLIDATE:src-tauri/gen/schemas owned files (P1):
//   src-tauri/gen/schemas/acl-manifests.json
//   src-tauri/gen/schemas/capabilities.json
//   src-tauri/gen/schemas/desktop-schema.json
//   src-tauri/gen/schemas/windows-schema.json
//
// Checks asserted:
//   (a) every owned schema file is valid JSON;
//   (b) no owned schema file exposes a service port (approved permissions only);
//   (c) the schema required by the Tauri production closure (desktop-schema.json,
//       referenced by src-tauri/capabilities/default.json $schema) is present and
//       a valid JSON Schema draft-07 document.
//
// Lane: VERIFY:CONSOLIDATE:src-tauri/gen/schemas  (rows AT-5262C33DBBD2,
// AT-ED120D585F6D, AT-BC62FCEC9ECD, AT-D4B4C5F178B5)
// Acceptance: Frozen build/package works from clean checkout; approved permissions only.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

const OWNED = [
  'src-tauri/gen/schemas/acl-manifests.json',
  'src-tauri/gen/schemas/capabilities.json',
  'src-tauri/gen/schemas/desktop-schema.json',
  'src-tauri/gen/schemas/windows-schema.json',
];

function readJson(rel) {
  return JSON.parse(readFileSync(join(REPO_ROOT, rel), 'utf8'));
}

// A service port is a capability remote URL whose port is a wildcard, e.g.
// http://127.0.0.1:* (any port on localhost). "Approved permissions only"
// forbids this footprint in the owned schema files.
function servicePortRefs(rel) {
  const text = readFileSync(join(REPO_ROOT, rel), 'utf8');
  return text.match(/https?:\/\/[^"\\s]*:[*]/g) ?? [];
}

test('owned schema files are valid JSON', () => {
  for (const rel of OWNED) {
    assert.doesNotThrow(() => readJson(rel), rel + ' must parse as JSON');
  }
});

test('no owned schema file exposes a service port (approved permissions only)', () => {
  for (const rel of OWNED) {
    const refs = servicePortRefs(rel);
    assert.equal(refs.length, 0, rel + ' must not expose a service port, found: ' + JSON.stringify(refs));
  }
  // Regression pin: capabilities.json previously carried http://127.0.0.1:*;
  // that service port must be gone while local-only capability is retained.
  const caps = readJson('src-tauri/gen/schemas/capabilities.json');
  assert.equal(Object.prototype.hasOwnProperty.call(caps.default, 'remote'), false,
    'capabilities.json default must not carry a remote/service-port block');
  assert.equal(caps.default.local, true, 'capabilities.json default must remain local-only');
});

test('desktop-schema.json is required by the Tauri production closure', () => {
  // src-tauri/capabilities/default.json is the production capability the Tauri
  // build consumes (tauri.conf.json declares no capabilities dir, so the default
  // src-tauri/capabilities/ location is used). It validates against
  // ../gen/schemas/desktop-schema.json, which pins desktop-schema.json into the
  // production closure.
  const def = readJson('src-tauri/capabilities/default.json');
  assert.equal(def.$schema, '../gen/schemas/desktop-schema.json',
    'production default.json must validate against desktop-schema.json');

  const schema = readJson('src-tauri/gen/schemas/desktop-schema.json');
  assert.equal(schema.$schema, 'http://json-schema.org/draft-07/schema#',
    'desktop-schema.json must be a JSON Schema draft-07 document');
  assert.ok(schema.definitions && schema.definitions.Capability,
    'desktop-schema.json must define the Capability schema');
});
