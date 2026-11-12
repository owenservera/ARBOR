/** Wave 2 Integration 2, synthetic-only A -> B/D action-ref adapter. */
export const ADAPTER_SCHEMA = 'vivim.integration-2-action-adapter/1';
const ID = /^(?!javascript:|data:|https?:|file:|vbscript:)[A-Za-z][A-Za-z0-9._:-]{0,95}$/i;
const copy = value => JSON.parse(JSON.stringify(value));
const refuse = code => { throw new TypeError(`ACTION_ADAPTER_${code}`); };
/** Canonical Lane A validation MUST already have succeeded; this is not an auth check. */
export function projectInertActionRefs(document) {
  if (document?.schema !== 'vivim.ui-document/1' || !Array.isArray(document.nodes) || document.nodes.length > 64) refuse('SCHEMA');
  const references = [], nodes = [], seen = new Set();
  for (const [i, node] of document.nodes.entries()) {
    if (!ID.test(node?.id ?? '') || seen.has(node.id)) refuse('NODE_ID');
    seen.add(node.id);
    if (!['stack','grid','text','card','button','collection','profile-card','project-card','timeline','chart'].includes(node.type)) refuse('NODE_TYPE');
    const source = node.actionRefs ?? [];
    if (!Array.isArray(source) || source.length > 8 || (node.type !== 'button' && source.length)) refuse('ACTION_SCOPE');
    const actionRefs = source.map((entry,j) => {
      if (!ID.test(entry?.id ?? '') || !Number.isSafeInteger(entry.version) || entry.version < 1) refuse('ACTION_VERSION');
      const alias = `synthetic_ref_${i}_${j}`;
      references.push(Object.freeze({alias, nodeId:node.id, id:entry.id, version:entry.version, inert:true}));
      return alias;
    });
    nodes.push({...copy(node), actionRefs});
  }
  return Object.freeze({schema:ADAPTER_SCHEMA,synthetic:true,actionVersionTable:Object.freeze(references),rendererDocument:{...copy(document),nodes}});
}
