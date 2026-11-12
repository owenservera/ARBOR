/**
 * The one function this fixture project owns.
 *
 * Deliberately dependency-free: proving TierFlow works on an unrelated
 * project must not depend on that project having any packages installed.
 */
export function sum(a: number, b: number): number {
  return a + b;
}
