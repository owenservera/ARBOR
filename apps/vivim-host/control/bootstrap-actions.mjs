/**
 * The ONE bootstrap action allowlist. The command worker, the relay route and the
 * consumer command registry all read this list. Duplicated allowlists are a
 * duplicate authority: they drift, and an order-sensitive comparison of two
 * copies of the same set is already wrong today.
 *
 * The seventh consumer-commands id `control-plan` is deliberately NOT here:
 * it is a control-mode, device-scope command, not a bootstrap action.
 */
export const BOOTSTRAP_ACTIONS = Object.freeze([
  'apply-proposal',
  'choose-preset',
  'grant-visual',
  'personalize',
  'undo-theme',
  'undo-ui-revision',
]);
export const BOOTSTRAP_ACTION_SET = new Set(BOOTSTRAP_ACTIONS);
