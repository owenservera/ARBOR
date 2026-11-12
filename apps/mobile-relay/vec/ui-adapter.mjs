// VEC paired-PWA adapter/0.1. Strict deterministic UI grammar -> the EXISTING
// vivim.ui-proposal/1 validator. No model, network, OS read, Host write or Rust compile.
// UI changes are NOT ordinary command execution. User must still tap Activate and
// the existing paired Host revalidates and commits the exact revision.
import { validateSurface, PROPOSAL_SCHEMA } from '../generative-ui/catalog.mjs';
import { compileUiProposal } from '../generative-ui/compiler.mjs';

const PREFIX = /^(?:add|create|rename|remove|delete|move)\b/i;
// Refuse possible second actions/conditionals instead of treating them as card titles.
const COMPLEX = /(?:[;]|\b(?:and then|and also|and (?:add|create|remove|delete|move|rename)|after that|unless|whenever|when|if|then|automatically|every (?:day|morning|night|week))\b)/i;
const ADD = /^(?:add|create) (?:a |an )?(card|heading|text) (?:called|named|saying) (.+)$/i;
const RENAME = /^rename (?:the )?(card|heading|text) (?:called |named )?(.+?) to (.+)$/i;
const REMOVE = /^(?:remove|delete) (?:the )?(card|heading|text) (?:called |named )?(.+)$/i;
const MOVE = /^move (?:the )?(card|heading|text) (?:called |named )?(.+?) to (?:the )?(top|bottom)$/i;
const normalized = value => value.trim().toLocaleLowerCase('en');
const MAX_UI_REQUEST = 400;
const WORD = /[^a-z0-9]+/g;
const outcome = (state, code, detail = null) => ({
  outcome: state, code, ...(detail ? { detail } : {})
});
function isType(node, type) {
  if (type === 'card') return node.type === 'card';
  return node.type === 'text' &&
    (type === 'heading' ? node.props?.variant === 'heading' : node.props?.variant !== 'heading');
}
function visibleCandidates(node, type, name, found = [], visible = true) {
  const allowed = visible && node.visibility !== 'pc-private';
  if (!allowed) return found;
  const label = node.props?.title ?? node.props?.value;
  if (isType(node, type) && typeof label === 'string' && normalized(label) === normalized(name))
    found.push(node);
  for (const child of node.children ?? []) visibleCandidates(child, type, name, found, allowed);
  return found;
}
function identifier(title, type, tree) {
  let base = normalized(title).normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(WORD, '-').replace(/^-|-$/g, '');
  base = base.slice(0, 38).replace(/-$/, '') || 'item';
  const taken = new Set();
  const visit = n => { taken.add(n.id); (n.children ?? []).forEach(visit); };
  visit(tree);
  const stem = 'vec.' + type + '.' + base;
  let current = stem, index = 2;
  while (taken.has(current)) current = stem + '-' + index++;
  return current;
}
function safeTitle(title) {
  const value = title.trim();
  return value && value.length <= 80 && !/[\u0000-\u001f\u007f]/.test(value) ? value : null;
}
function makeProposal(surface, op, explanation) {
  return {
    schema: PROPOSAL_SCHEMA, surfaceId: surface.surfaceId, baseRevision: surface.revision,
    operations: [{ opId: 'vec.ui.1', ...op }],
    explanation, assumptions: [], unknowns: []
  };
}
export function compileVecUiRequest({ text, surface } = {}) {
  if (typeof text !== 'string' || !text.trim() || text.length > MAX_UI_REQUEST ||
      /[\u0000-\u001f\u007f]/.test(text))
    return outcome('refused', 'INVALID_UI_REQUEST');
  const request = text.trim().replace(/\s+/g, ' ');
  if (COMPLEX.test(request)) return outcome('unsupported', 'COMPLEX_REQUEST');
  const add = ADD.exec(request), rename = RENAME.exec(request),
    remove = REMOVE.exec(request), move = MOVE.exec(request);
  if (!add && !rename && !remove && !move)
    return outcome('unsupported', PREFIX.test(request) ? 'UNSUPPORTED_UI_GRAMMAR' : 'NOT_A_KNOWN_UI_INTENT');
  let current;
  try { current = validateSurface(surface, { refs: new Set() }); }
  catch { return outcome('refused', 'INVALID_OR_UNAVAILABLE_SURFACE'); }
  const found = add ?? rename ?? remove ?? move, type = normalized(found[1]);
  const title = safeTitle(add ? add[2] : found[2]);
  if (!title) return outcome('refused', 'INVALID_UI_TITLE');
  let op, explanation;
  if (add) {
    const componentType = type === 'heading' ? 'text' : type;
    const component = { id: identifier(title, type, current.tree), type: componentType,
      props: type === 'card' ? { title } : { value: title, variant: type === 'heading' ? 'heading' : 'body' },
      children: [] };
    op = { type: 'insert', parentId: 'root', component };
    explanation = 'Add ' + type + ' "' + title + '".';
  } else {
    const matches = visibleCandidates(current.tree, type, title);
    if (matches.length === 0) return outcome('clarification_required', 'UI_TARGET_NOT_FOUND');
    if (matches.length > 1) return outcome('clarification_required', 'UI_TARGET_AMBIGUOUS');
    const target = matches[0];
    if (rename) {
      const next = safeTitle(rename[3]);
      if (!next) return outcome('refused', 'INVALID_UI_TITLE');
      op = { type: 'replace-props', componentId: target.id,
        props: type === 'card' ? { title: next } : { value: next } };
      explanation = 'Rename ' + type + ' "' + title + '" to "' + next + '".';
    } else if (remove) {
      op = { type: 'remove', componentId: target.id };
      explanation = 'Remove ' + type + ' "' + title + '".';
    } else {
      if (!current.tree.children.some(x => x.id === target.id))
        return outcome('unsupported', 'MOVE_NESTED_NOT_SUPPORTED');
      const position = normalized(move[3]);
      op = { type: 'move', componentId: target.id, parentId: 'root',
        index: position === 'top' ? 0 : current.tree.children.length - 1 };
      explanation = 'Move ' + type + ' "' + title + '" to the ' + position + '.';
    }
  }
  try {
    const proposal = makeProposal(current, op, explanation);
    const preview = compileUiProposal({
      proposal, surface: current, approvedRefs: [], audience: 'phone'
    });
    return { outcome: 'candidate', code: 'PURE_UI_PREVIEW', proposal, preview,
      summary: { explanation: preview.notes.explanation, changes: preview.operations,
        unknowns: preview.notes.unknowns } };
  } catch { return outcome('refused', 'UI_PROPOSAL_VALIDATION_FAILED'); }
}
