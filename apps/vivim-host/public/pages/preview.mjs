// Pure wiki-edit preview model for the chat → wiki phrase 'Change <Page>/<Section> to <text>'.
// Preview only: this module builds the diff a human or AI actor would review BEFORE any write.
// No network, no fetch, no POST, no filesystem, no state mutation. Wiring into chat.js is a
// separate slice; until then nothing imports this except the focused test.
//
// Contract:
//   buildWikiEditPreview(command, wikiState) -> {target, baseRevision, current, proposed, executable:false}
//   buildWikiEditPreview(...)                 -> {refused: reason}   for unknown or malformed targets
// wikiState shape (chat/baseline-state.mjs loadWiki): { revision:number, pages:{ Page:{ sections:{ Section:text } } } }

const COMMAND_RE = /^\s*change\s+(\S+)\/([^\s]+)\s+to\s+([\s\S]*?)\s*$/i;

function refusing(reason) { return { refused: reason }; }

export function buildWikiEditPreview(command, wikiState) {
  if (typeof command !== 'string') return refusing('malformed command: expected a string');
  const commandText = command.trim();
  if (!commandText) return refusing('malformed command: empty');

  // Bounded phrase only: Change <Page>/<Section> to <text>. Anything outside the phrase is not actionable.
  const match = COMMAND_RE.exec(commandText);
  if (!match) return refusing('malformed command: expected "Change <Page>/<Section> to <text>"');

  const [, page, section, proposedRaw] = match;
  const proposed = proposedRaw.trim();
  if (!proposed) return refusing('malformed command: replacement text is empty');

  if (!wikiState || typeof wikiState !== 'object' || !wikiState.pages || typeof wikiState.pages !== 'object') {
    return refusing('malformed command: wikiState has no pages');
  }

  // Refuse unknown targets: never synthesize a page or section that does not exist.
  const pageRecord = wikiState.pages[page];
  if (!pageRecord || typeof pageRecord !== 'object') return refusing('unknown target: page "' + page + '" does not exist');
  const sections = pageRecord.sections;
  if (!sections || typeof sections !== 'object' || !Object.hasOwn(sections, section)) {
    return refusing('unknown target: section "' + section + '" does not exist on page "' + page + '"');
  }

  return {
    target: { page, section },
    baseRevision: Number.isSafeInteger(wikiState.revision) ? wikiState.revision : 0,
    current: typeof sections[section] === 'string' ? sections[section] : String(sections[section] ?? ''),
    proposed,
    executable: false // preview only; application is a future owner-authorized slice
  };
}