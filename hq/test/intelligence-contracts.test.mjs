/**
 * @hq:context P1 typed-contract fixtures: every .valid.json passes and every .invalid-*.json fails with a path-naming error.
 * @hq:owner hq-agent
 * @hq:task OVN-A lane 5 (continuous work-order program, P1 contracts)
 * @hq:why BASELINE.md §8 records "P1 Contracts: NOT STARTED"; this is the executable acceptance for that line.
 * @hq:see docs/orchestration/intelligence-upgrade/local-integration/contracts/
 */
import { describe, expect, test } from 'bun:test';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { validate } from '../../docs/orchestration/intelligence-upgrade/local-integration/contracts/validate.mjs';

const CONTRACTS_DIR = join(
  import.meta.dir,
  '..',
  '..',
  'docs',
  'orchestration',
  'intelligence-upgrade',
  'local-integration',
  'contracts'
);

const CONTRACTS = [
  'task-work-order',
  'execution-event',
  'verification-receipt',
  'graph-change-set',
  'context-bundle-request',
  'context-bundle-receipt',
  'agentic-file-contract',
];

function loadJson(rel) {
  return JSON.parse(readFileSync(join(CONTRACTS_DIR, rel), 'utf8'));
}

function fixturesFor(name, suffix) {
  const dir = join(CONTRACTS_DIR, 'fixtures');
  const all = readdirSync(dir);
  if (suffix === 'valid') {
    return all.filter((f) => f === `${name}.valid.json`);
  }
  return all.filter((f) => f.startsWith(`${name}.invalid-`) && f.endsWith('.json'));
}

describe('P1 intelligence contracts', () => {
  for (const name of CONTRACTS) {
    describe(name, () => {
      test(`schema file ${name}.schema.json exists and is JSON`, () => {
        const schema = loadJson(`${name}.schema.json`);
        expect(schema.$schema).toBe('https://json-schema.org/draft/2020-12/schema');
        expect(typeof schema.properties).toBe('object');
      });

      test('every .valid.json fixture passes', () => {
        const files = fixturesFor(name, 'valid');
        expect(files.length).toBeGreaterThanOrEqual(1);
        for (const file of files) {
          const result = validate(loadJson(`${name}.schema.json`), loadJson(`fixtures/${file}`));
          expect(result.ok).toBe(true);
          expect(result.errors).toEqual([]);
        }
      });

      test('every .invalid-*.json fixture fails with a path-naming error (>= 2 violations covered)', () => {
        const files = fixturesFor(name, 'invalid');
        expect(files.length).toBeGreaterThanOrEqual(2);
        for (const file of files) {
          const result = validate(loadJson(`${name}.schema.json`), loadJson(`fixtures/${file}`));
          expect(result.ok).toBe(false);
          expect(result.errors.length).toBeGreaterThanOrEqual(1);
          // the violated JSON path must be named, e.g. "#/state" or "#/claims/0/evidenceRef"
          for (const err of result.errors) {
            expect(String(err.message)).toMatch(/#\//);
          }
        }
      });
    });
  }
});
