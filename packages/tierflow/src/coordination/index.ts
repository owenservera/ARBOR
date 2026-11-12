/**
 * Public surface of the project-neutral coordination layer.
 *
 * The core of TierFlow depends on these shapes only. A provider adapter
 * lives behind `src/adapters/` and is never imported from the tiers.
 */

export * from "./contract.ts";
export * from "./poller.ts";
