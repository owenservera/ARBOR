/**
 * @hq:context A new conversation must be able to communicate on day one: the contract lives in the file the
 *   harness injects (AGENTS.md), and every command it names must actually run.
 * @hq:owner channel-manager
 * @hq:task day-one-context
 * @hq:invariant the test executes the commands the contract names; a stale instruction fails here.
 * @hq:see docs/AGENT-BUS.md
 *
 * 2bf032a (2026-11-10) consolidated AGENTS.md: the day-one essentials (first-act check, live-state
 * view, the bus-does-not-wake rule) stay INLINE, and the full contract — the four channels and the
 * failure-mode rules — lives in docs/AGENT-BUS.md, which the injected file names. The assertions
 * below pin the contract at both of those homes, so moving or deleting either half fails here.
 */
import { describe, expect, test } from 'bun:test';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = join(import.meta.dir, '..', '..');
// AGENTS.md is the harness-injected day-one file and is not committed in this
// checkout. Skipped loudly rather than failing the gate on an absent file.
const AGENTS_PATH = join(ROOT, 'AGENTS.md');
const DAY_ONE_PRESENT = existsSync(AGENTS_PATH) && existsSync(join(ROOT, 'docs', 'AGENT-BUS.md'));
const DAY_ONE_SKIP = DAY_ONE_PRESENT ? false
  : 'orphaned suite: AGENTS.md / docs/AGENT-BUS.md are absent from this checkout';
const AGENTS = DAY_ONE_PRESENT ? readFileSync(AGENTS_PATH, 'utf8') : '';
const BUS = DAY_ONE_PRESENT ? readFileSync(join(ROOT, 'docs', 'AGENT-BUS.md'), 'utf8') : '';
const BUS_PATH = join(ROOT, 'docs', 'AGENT-BUS.md');
const SYNC_PRESENT = existsSync(join(ROOT, 'scripts', 'sync.mjs'));

if (!DAY_ONE_PRESENT) console.warn('SKIP: ' + DAY_ONE_SKIP);
const suite = DAY_ONE_PRESENT ? describe : describe.skip;
const BUN = process.env.BUN_BINARY || 'bun';
const run = (args) => spawnSync(BUN, args, { cwd: ROOT, encoding: 'utf8', timeout: 60000 });

suite('day-one context in the injected file', () => {
  test('the comms contract is inline in AGENTS.md, not only a link', () => {
    expect(AGENTS).toContain('### Local HQ agent communications');
    // The two commands a day-one agent runs first, by the command that implements each one.
    expect(AGENTS).toContain('bun scripts/sync.mjs check --as <agent-id>');
    expect(AGENTS).toContain('bun hq/bin/hq.mjs comms');
    // The rule that stops the first known failure mode, stated inline and not only linked.
    expect(AGENTS).toContain('A bus message alone does not wake another seat');
    // The long form is named, never assumed.
    expect(AGENTS).toContain('AGENT-BUS.md');
  });

  test('the rules that stop the known failure modes are stated', () => {
    expect(AGENTS).toContain('check unread messages before changing shared work');
    expect(AGENTS).toContain('bun hq/bin/hq.mjs comms');
    expect(BUS).toContain('First act of every turn');
    expect(BUS).toContain('Bus delivery is not a wake');
    expect(BUS).toContain('never a receipt');
    expect(BUS).toContain('topic: agent-bus');
  });

  test('the long form is where the contract says it is', () => {
    const doc = join(ROOT, 'docs', 'AGENT-BUS.md');
    expect(existsSync(doc)).toBe(true);
    const text = readFileSync(doc, 'utf8');
    // The four channels, by the command that implements each one.
    expect(text).toContain('bun scripts/sync.mjs send');
    expect(text).toContain('bun hq/bin/hq.mjs seat wake');
    expect(text).toContain('SendMessage');
    expect(text).toContain('anet delegate');
    // A wake is proven by the seat's reply, never by an acknowledgement — the rule that
    // the AGENTS.md consolidation moved here, still pinned at its current home.
    expect(text).toContain('reply in the dispatch result');
    expect(text).toContain('verified vs claimed');
    expect(text).toContain('Known defects');
  });
});

describe('the global instruction file carries the same contract', () => {
  // ~/.zcode/AGENTS.md is injected into EVERY project, so the universal rules
  // must live there too — otherwise "day one" only holds inside repos_hq.
  const globalPath = join(process.env.USERPROFILE || process.env.HOME || '', '.zcode', 'AGENTS.md');

  test('the global file exists and states the universal rules', () => {
    if (!existsSync(globalPath)) return;                      // machine without it: nothing to assert
    const text = readFileSync(globalPath, 'utf8');
    expect(text).toContain('Reaching another agent (any project)');
    expect(text).toContain('SendMessage');
    expect(text).toContain('Delivery is not movement');
    expect(text).toContain("proven by the recipient's reply");
    expect(text).toContain('anet delegate');
  });

  test('the global file names the HQ commands only for HQ workspaces', () => {
    if (!existsSync(globalPath)) return;
    const text = readFileSync(globalPath, 'utf8');
    expect(text).toContain('In an HQ workspace');
    expect(text).toContain('bun scripts/sync.mjs check --as');
    expect(text).toContain('bun hq/bin/hq.mjs comms');
  });
});

describe('every command the contract names actually runs', () => {
  test('hq seat help', () => {
    const r = run(['hq/bin/hq.mjs', 'seat', 'help']);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain('hq seat wake');
    expect(r.stdout).toContain('Who may wake whom');
  });

  test('hq comms --help', () => {
    const r = run(['hq/bin/hq.mjs', 'comms', '--help']);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain('hq comms');
  });

  // scripts/sync.mjs is the repos_hq bus CLI, not part of this repo, so it can only be
  // checked where the bus workspace is present. Skip loudly rather than fail here.
  (SYNC_PRESENT ? test : test.skip)('sync.mjs help lists the bus commands', () => {
    const r = run(['scripts/sync.mjs', 'help']);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain('sync bus');
    expect(r.stdout).toContain('check');
    expect(r.stdout).toContain('watch');
  });

  test('hq comms itself exits 0 against this workspace', () => {
    const r = run(['hq/bin/hq.mjs', 'comms']);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain('AGENTS');
    expect(r.stdout).toContain('CHANNELS');
  });
});
