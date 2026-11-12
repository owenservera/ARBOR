// @ts-check
/**
 * @hq:context Authored typed work-order queue — the dispatchable record of what to build, every order naming the one file it may write and the command that proves it
 * @hq:owner autonomy-dispatcher
 * @hq:task work-orders-w1
 * @hq:invariant pure: no fs, no spawn, no clock read. `at` is an argument wherever a transition stamps a time.
 * @hq:invariant an authored order is not an observation: only this document names `file` and `proofCommand`, because transcripts discard the tool calls that would have supplied them
 * @hq:invariant every refusal is a stable code from WORK_ORDER_CODES, never free prose; the same input always yields the same code list in the same order
 * @hq:invariant transitions return a NEW document and never mutate the argument; an ambiguous (duplicated) id is refused rather than guessed
 * @hq:invariant `dependsOn` gates dispatch, not validity: a pending dependency is a normal authored plan, only a dead one (blocked/cancelled/self) is a defect
 * @hq:see hq/lib/autonomy.mjs — buildPromptSlice is the consumer of toTask()
 * @hq:see hq/work/orders.json — the live queue this module validates
 */

/** The only schema id this module understands. */
export const WORK_ORDER_SCHEMA = 'hq.work-order/1';

/** The whole legal status vocabulary. A status outside this list is BAD_STATUS. */
export const WORK_ORDER_STATUSES = Object.freeze(['open', 'claimed', 'done', 'blocked', 'cancelled']);

/** Statuses a dependency can never leave, so a dependent order can never become dispatchable. */
const DEAD_STATUSES = new Set(['blocked', 'cancelled']);

/** The statuses completeOrder may land on: finishing is done, blocked or cancelled, never open. */
const FINAL_STATUSES = new Set(['done', 'blocked', 'cancelled']);

/** A seat marker meaning "any seat". Mirrors the UNBOUND_SEATS set autonomy applies. */
const UNBOUND_SEATS = new Set(['', 'unbound', 'any', '*', 'none']);

/**
 * The whole refusal vocabulary. A code outside this list is a bug, and a code is
 * the contract: it is stable across wording changes.
 */
export const WORK_ORDER_CODES = Object.freeze([
  'BAD_ORDER',
  'MISSING_ID',
  'DUPLICATE_ID',
  'MISSING_TASK',
  'MISSING_FILE',
  'MISSING_PROOF',
  'BAD_PROOF_COMMAND',
  'BAD_STATUS',
  'BAD_CREATED_AT',
  'BAD_SEAT',
  'MISSING_DEP',
  'DEP_NOT_FOUND',
  'DEP_NOT_DONE',
  'BAD_SCHEMA',
  'BAD_ORDERS',
  'ORDER_NOT_FOUND',
  'ILLEGAL_TRANSITION',
  'MISSING_AT',
]);

/**
 * A proof must be a command, not prose. Same prefix set autonomy applies
 * (including its extra tool aliases), with two deliberate tightenings: a real
 * separator must follow the tool name, so `google-chrome` is not read as `go`;
 * and a Windows executable suffix (`pwsh.exe`) is accepted rather than refused.
 */
const PROOF_COMMAND_RE = /^(?:bun|bunx|node|npm|npx|pnpm|yarn|deno|python[0-9.]*|py|cargo|rustc|go|dotnet|tsc|git|gh|curl|wget|pwsh|powershell|cmd|sh|bash|hq|zcode|es|du|handle|fclones|sqlite3)(?:\.(?:exe|cmd|bat))?(?=\s|$)/i;

/** @param {any} value */
function textOf(value) {
  return typeof value === 'string' ? value.trim() : '';
}

/**
 * Read a timestamp as epoch ms. Anything unreadable is null, never a guess — the
 * same rule autonomy and seat-heartbeat apply to an observation.
 *
 * @param {any} value
 * @returns {number|null}
 */
function toMs(value) {
  if (value instanceof Date) return Number.isFinite(value.getTime()) ? value.getTime() : null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') {
    const text = value.trim();
    if (!text) return null;
    const parsed = Date.parse(text);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

/** @param {any} value @returns {boolean} */
function isTimestamp(value) {
  return toMs(value) !== null;
}

/**
 * One document's orders, defensively. A non-array is an empty queue here and
 * BAD_ORDERS in validateDoc: reading never throws, validating always reports.
 *
 * @param {any} doc
 * @returns {any[]}
 */
function ordersOf(doc) {
  return Array.isArray(doc?.orders) ? doc.orders : [];
}

/** @param {any} order @returns {any[]} */
function depsOf(order) {
  return Array.isArray(order?.dependsOn) ? order.dependsOn : [];
}

/**
 * Index orders by id and remember how often each id appears, so a duplicated id
 * can never be resolved to one of its copies.
 *
 * @param {any[]} orders
 * @returns {Map<string, {order: any, count: number}>}
 */
function indexOrders(orders) {
  /** @type {Map<string, {order: any, count: number}>} */
  const index = new Map();
  for (const order of orders) {
    const id = textOf(order?.id);
    if (!id) continue;
    const hit = index.get(id);
    if (hit) hit.count += 1;
    else index.set(id, { order, count: 1 });
  }
  return index;
}

/** @param {any} seat @returns {string|null} */
function normalizeSeat(seat) {
  if (seat === null || seat === undefined) return null;
  if (typeof seat !== 'string') return String(seat).trim() || null;
  const text = seat.trim();
  if (!text) return null;
  return UNBOUND_SEATS.has(text.toLowerCase()) ? null : text;
}

/** An Error carrying a stable `code`, so a caller can branch without parsing prose. */
function fail(code, message) {
  return Object.assign(new Error(`${code}: ${message}`), { code });
}

/**
 * Validate one order. `doc` is optional: pass it to also resolve `dependsOn`
 * against the document (DEP_NOT_FOUND / DEP_NOT_DONE). Without it, only the
 * shape of the dependency list can be judged (MISSING_DEP).
 *
 * @param {any} order
 * @param {any} [doc]
 * @returns {{ok: boolean, errors: string[]}}
 */
export function validateOrder(order, doc) {
  /** @type {string[]} */
  const errors = [];
  /** @param {string} code */
  const add = (code) => {
    if (!errors.includes(code)) errors.push(code);
  };

  if (!order || typeof order !== 'object' || Array.isArray(order)) {
    add('BAD_ORDER');
    return { ok: false, errors };
  }

  const id = textOf(order.id);
  if (!id) add('MISSING_ID');
  if (!textOf(order.task)) add('MISSING_TASK');
  if (!textOf(order.file)) add('MISSING_FILE');

  const proof = textOf(order.proofCommand);
  if (!proof) add('MISSING_PROOF');
  else if (/[\r\n]/.test(proof) || !PROOF_COMMAND_RE.test(proof)) add('BAD_PROOF_COMMAND');

  if (!WORK_ORDER_STATUSES.includes(textOf(order.status))) add('BAD_STATUS');
  if (!isTimestamp(order.createdAt)) add('BAD_CREATED_AT');
  if (order.seat !== undefined && order.seat !== null && typeof order.seat !== 'string') add('BAD_SEAT');

  const deps = order.dependsOn;
  let depsWellFormed = true;
  if (deps !== undefined && deps !== null) {
    if (!Array.isArray(deps) || deps.some((dep) => typeof dep !== 'string' || !dep.trim())) {
      add('MISSING_DEP');
      depsWellFormed = false;
    }
  }

  if (depsWellFormed && doc && Array.isArray(deps) && deps.length) {
    const index = indexOrders(ordersOf(doc));
    for (const dep of deps) {
      const key = textOf(dep);
      const hit = index.get(key);
      if (!hit || hit.count > 1) {
        add('DEP_NOT_FOUND');
        continue;
      }
      const state = textOf(hit.order?.status);
      // A pending dependency is a plan; one that cannot ever finish is a defect.
      if (key === id || DEAD_STATUSES.has(state)) add('DEP_NOT_DONE');
    }
  }

  return { ok: errors.length === 0, errors };
}

/**
 * Validate a whole document: shape, per-order rules, duplicate ids, and every
 * dependency resolved against the same document.
 *
 * @param {any} doc
 * @returns {{ok: boolean, errors: string[], duplicateIds: string[]}}
 */
export function validateDoc(doc) {
  /** @type {string[]} */
  const errors = [];
  /** @type {string[]} */
  const duplicateIds = [];
  /** @param {string} code */
  const add = (code) => {
    if (!errors.includes(code)) errors.push(code);
  };

  if (!doc || typeof doc !== 'object' || Array.isArray(doc)) {
    add('BAD_ORDERS');
    return { ok: false, errors, duplicateIds };
  }
  if (textOf(doc.schema) !== WORK_ORDER_SCHEMA) add('BAD_SCHEMA');
  if (!Array.isArray(doc.orders)) {
    add('BAD_ORDERS');
    return { ok: false, errors, duplicateIds };
  }

  for (const [id, hit] of indexOrders(doc.orders)) {
    if (hit.count > 1) duplicateIds.push(id);
  }
  if (duplicateIds.length) add('DUPLICATE_ID');

  for (const order of doc.orders) {
    for (const code of validateOrder(order, doc).errors) add(code);
  }

  return { ok: errors.length === 0, errors, duplicateIds };
}

/**
 * The orders a dispatcher may take right now: status `open` and every
 * `dependsOn` target present exactly once and `done`. Document order is kept, so
 * an authored priority is the queue order.
 *
 * @param {any} doc
 * @returns {any[]}
 */
export function openOrders(doc) {
  const orders = ordersOf(doc);
  const index = indexOrders(orders);
  /** @param {any} dep */
  const satisfied = (dep) => {
    const hit = index.get(textOf(dep));
    return Boolean(hit && hit.count === 1 && textOf(hit.order?.status) === 'done');
  };
  return orders.filter((order) => textOf(order?.status) === 'open' && depsOf(order).every(satisfied));
}

/**
 * Detect open work orders that duplicate already-completed work (AII scenario
 * HQ-084).
 *
 * Two orders duplicate when they share the same `task` text or the same
 * `file`. An open order is flagged when any completed (`done`) order shares
 * its task or its file. Returns the ids of open orders that duplicate
 * completed work, each carrying the id of the completed order it duplicates
 * and the surface (`task` or `file`) on which the duplication was detected.
 * Existing exports and behavior unchanged; additive only.
 *
 * @param {any} doc
 * @returns {Array<{id: string, duplicates: string, on: 'task'|'file'}>}
 */
export function openOrdersDuplicatingCompleted(doc) {
  const orders = ordersOf(doc);
  const done = orders.filter((order) => textOf(order?.status) === 'done');
  const open = orders.filter((order) => textOf(order?.status) === 'open');

  /** @type {Array<{id: string, duplicates: string, on: 'task'|'file'}>} */
  const dupes = [];
  const seen = new Set();

  for (const openOrder of open) {
    const openId = textOf(openOrder.id);
    for (const doneOrder of done) {
      const doneId = textOf(doneOrder.id);
      let on = null;
      if (textOf(openOrder.task) && textOf(openOrder.task) === textOf(doneOrder.task)) on = 'task';
      else if (textOf(openOrder.file) && textOf(openOrder.file) === textOf(doneOrder.file)) on = 'file';
      if (on && !seen.has(`${openId}::${doneId}`)) {
        seen.add(`${openId}::${doneId}`);
        dupes.push({ id: openId, duplicates: doneId, on });
      }
    }
  }
  return dupes;
}

/**
 * The task shape hq/lib/autonomy.mjs consumes. `buildPromptSlice` must return a
 * slice for this, unchanged: an order that cannot become a slice is not
 * dispatchable, and `kind`/`status` keep it out of the observation queue.
 *
 * @param {any} order
 * @returns {{id: string, task: string, file: string, proofCommand: string, seat: string|null, kind: 'work-order', status: 'open'}}
 */
export function toTask(order) {
  if (!order || typeof order !== 'object') throw fail('BAD_ORDER', 'toTask needs an order object');
  return {
    id: textOf(order.id),
    task: textOf(order.task),
    file: textOf(order.file),
    proofCommand: textOf(order.proofCommand),
    seat: normalizeSeat(order.seat),
    kind: 'work-order',
    status: 'open',
  };
}

/**
 * One line per order (`id  status  seat  file  task`) plus a trailing count line.
 *
 * @param {any} doc
 * @returns {string[]}
 */
export function renderOrders(doc) {
  const orders = ordersOf(doc);
  const lines = orders.map((order) => [
    textOf(order?.id) || '(no id)',
    textOf(order?.status) || '(no status)',
    normalizeSeat(order?.seat) ?? 'any',
    textOf(order?.file) || '(no file)',
    textOf(order?.task) || '(no task)',
  ].join('  '));
  const counts = WORK_ORDER_STATUSES
    .map((status) => `${orders.filter((order) => textOf(order?.status) === status).length} ${status}`)
    .join(', ');
  lines.push(`${orders.length} order(s); ${openOrders(doc).length} dispatchable; ${counts}`);
  return lines;
}

/** The one canonical form: two-space JSON with a trailing newline. @param {any} doc @returns {string} */
export function formatDoc(doc) {
  return `${JSON.stringify(doc, null, 2)}\n`;
}

/**
 * The single order for `id`, refused when the id is absent or ambiguous.
 *
 * @param {any} doc
 * @param {string} id
 * @returns {any}
 */
function pickOrder(doc, id) {
  const matches = ordersOf(doc).filter((order) => textOf(order?.id) === id);
  if (!matches.length) throw fail('ORDER_NOT_FOUND', `no order "${id}" in this document`);
  if (matches.length > 1) throw fail('DUPLICATE_ID', `order "${id}" appears ${matches.length} times; an ambiguous id is never transitioned`);
  return matches[0];
}

/**
 * @param {any} doc
 * @param {string} id
 * @param {any} next
 * @returns {any}
 */
function replaceOrder(doc, id, next) {
  const orders = ordersOf(doc).map((order) => (textOf(order?.id) === id ? next : order));
  return { ...doc, orders };
}

/**
 * Read `at` as a required transition timestamp. The clock is never read here.
 *
 * @param {any} at
 * @param {string} fn
 * @returns {string}
 */
function stampOf(at, fn) {
  const ms = toMs(at);
  if (ms === null) throw fail('MISSING_AT', `${fn} needs a timestamp \`at\`; the clock is an argument, never a read`);
  return new Date(ms).toISOString();
}

/**
 * open -> claimed. Returns a new document; the input is untouched. An existing
 * seat binding is kept unless `seat` is given.
 *
 * @param {any} doc
 * @param {string} id
 * @param {{at: any, seat?: string|null}} options
 * @returns {any}
 */
export function claimOrder(doc, id, { at, seat } = /** @type {any} */ ({})) {
  const orderId = textOf(id);
  if (!orderId) throw fail('MISSING_ID', 'claimOrder needs an order id');
  const atIso = stampOf(at, 'claimOrder');
  const order = pickOrder(doc, orderId);
  const state = textOf(order.status);
  if (state !== 'open') {
    throw fail('ILLEGAL_TRANSITION', `order "${orderId}" is ${state || '(no status)'}; only open -> claimed is legal`);
  }
  const next = {
    ...order,
    status: 'claimed',
    seat: seat === undefined ? normalizeSeat(order.seat) : normalizeSeat(seat),
    claimedAt: atIso,
  };
  return replaceOrder(doc, orderId, next);
}

/**
 * claimed -> done|blocked|cancelled. Anything else throws: an order is never
 * "completed" back to open, and an unclaimed order is never completed.
 *
 * @param {any} doc
 * @param {string} id
 * @param {{at: any, status?: string}} options
 * @returns {any}
 */
export function completeOrder(doc, id, { at, status = 'done' } = /** @type {any} */ ({})) {
  const orderId = textOf(id);
  if (!orderId) throw fail('MISSING_ID', 'completeOrder needs an order id');
  const final = textOf(status);
  if (!FINAL_STATUSES.has(final)) {
    throw fail('BAD_STATUS', `completeOrder cannot land on "${final}"; finishing is done, blocked or cancelled`);
  }
  const atIso = stampOf(at, 'completeOrder');
  const order = pickOrder(doc, orderId);
  const state = textOf(order.status);
  if (state !== 'claimed') {
    throw fail('ILLEGAL_TRANSITION', `order "${orderId}" is ${state || '(no status)'}; only claimed -> ${final} is legal`);
  }
  const next = { ...order, status: final, completedAt: atIso };
  return replaceOrder(doc, orderId, next);
}
