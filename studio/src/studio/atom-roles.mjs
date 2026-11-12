/**
 * @hq:context Role layer: which manager owns each atomic capability, and what that manager may do.
 * @hq:owner atlas
 * @hq:task VC-21
 * @hq:invariant every atom has exactly one owning role; an unowned atom cannot be scheduled.
 * @hq:invariant only the provider role may hold a provider-send; the account role never exposes values.
 */
// One node, four managers. The 2000 atoms are partitioned so authority is not one flat grant:
// browser owns page mechanics, tab owns targets and frames, account owns identity and storage,
// provider owns site-specific and quota-bearing behaviour. A scheduler asks the role first.

export const ROLE_IDS = ['browser', 'tab', 'account', 'provider'];

export const ROLES = {
  browser: {
    id: 'browser',
    seat: 'browser-manager',
    purpose: 'Owns the single browser process: launch, profile, viewport, page mechanics.',
    may: ['page-write', 'read', 'browser-navigation'],
    mayNot: ['provider-send'],
  },
  tab: {
    id: 'tab',
    seat: 'tab-manager',
    purpose: 'Owns targets: which tab, which frame, which window. Never opens a second browser.',
    may: ['browser-navigation', 'read', 'page-write'],
    mayNot: ['provider-send'],
  },
  account: {
    id: 'account',
    seat: 'account-manager',
    purpose: 'Owns identity and session state: sign-in status, storage keys, consent of the owner.',
    may: ['read', 'page-write'],
    mayNot: ['provider-send', 'secret-value'],
  },
  provider: {
    id: 'provider',
    seat: 'provider-manager',
    purpose: 'Owns site behaviour and quota: composers, transcripts, walls, rate limits, sends.',
    may: ['read', 'page-write', 'provider-send'],
    mayNot: [],
  },
};

/** Ordered predicates. First match wins, so the partition is deterministic and total. */
const accountFamily = new Set(['auth', 'state']);
const providerFamily = new Set(['consent']);
const tabFamily = new Set(['frame']);
const tabVerbs = new Set(['goto', 'back', 'forward', 'reload', 'open', 'close', 'list', 'switch']);
const accountTargets = new Set(['loginwall', 'authwall', 'captcha', 'twofactor', 'signedin', 'signedout', 'sessionexpired', 'wrongaccount', 'profile', 'session']);
const providerTargets = new Set(['paywall', 'planlimit', 'ratelimit', 'errorpage', 'transcript', 'messages', 'lastmessage', 'composer']);

/**
 * Which role owns this atom. Unknown shapes fall to `browser`, which is the least privileged
 * manager that can still be told no: it cannot send.
 */
export function roleOf(atom) {
  const target = String(atom.target ?? '').toLowerCase();
  const verb = String(atom.verb ?? '').toLowerCase();
  if (accountFamily.has(atom.family) || accountTargets.has(target)) return 'account';
  if (providerFamily.has(atom.family) || providerTargets.has(target)) return 'provider';
  if (tabFamily.has(atom.family) || (atom.family === 'nav' && tabVerbs.has(verb))) return 'tab';
  return 'browser';
}

/** Attach the owning role to every atom, and report the partition. */
export function partitionByRole(atoms) {
  const byRole = Object.fromEntries(ROLE_IDS.map((r) => [r, []]));
  for (const atom of atoms) byRole[roleOf(atom)].push(atom);
  return byRole;
}

/**
 * Validate the partition: total, exclusive, and authority-honest. A provider-send held outside the
 * provider role, or a secret-shaped argument anywhere, is a defect rather than a warning.
 */
export function validateRoles(atoms) {
  const problems = [];
  const counts = Object.fromEntries(ROLE_IDS.map((r) => [r, 0]));
  const ids = new Set();
  for (const atom of atoms) {
    const role = roleOf(atom);
    counts[role] += 1;
    if (ids.has(atom.id)) problems.push(`duplicate atom in partition: ${atom.id}`);
    ids.add(atom.id);
    if (atom.effect === 'provider-send' && role !== 'provider') {
      problems.push(`${atom.id}: provider-send outside the provider role (${role})`);
    }
    for (const arg of atom.args ?? []) {
      if (/^(password|token|secret|credential|cookie)$/i.test(arg.name)) {
        problems.push(`${atom.id}: secret-shaped argument "${arg.name}" on role ${role}`);
      }
    }
    if (ROLES[role].mayNot.includes(atom.effect)) {
      problems.push(`${atom.id}: role ${role} may not perform ${atom.effect}`);
    }
  }
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  if (total !== atoms.length) problems.push(`partition covers ${total} of ${atoms.length} atoms`);
  return { ok: problems.length === 0, counts, total, problems };
}

/** The manager a scheduler should ask before running this atom. */
export function managerFor(atom) {
  const role = roleOf(atom);
  return { role, seat: ROLES[role].seat, authority: ROLES[role].may };
}
