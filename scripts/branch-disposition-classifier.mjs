// R03: no-effect disposition of SHA-pinned GitHub ancestry metadata.
// This module never changes Git refs, merges branches or interprets files as safe to delete.
const sha = value => typeof value === 'string' && /^[a-f0-9]{40}$/.test(value);
const integer = value => Number.isSafeInteger(value) && value >= 0;

export function classifyBranch({ name, tipSha, baseSha, comparison }) {
  if (typeof name !== 'string' || !name || /[\r\n\0]/.test(name) || !sha(tipSha) || !sha(baseSha))
    throw new Error('INVALID_BRANCH_IDENTITY');
  const baseMatches = comparison?.base_commit?.sha === baseSha;
  const ahead = comparison?.ahead_by;
  const behind = comparison?.behind_by;
  const status = comparison?.status;
  const coherent = baseMatches && integer(ahead) && integer(behind) &&
    ((status === 'identical' && ahead === 0 && behind === 0) ||
     (status === 'behind' && ahead === 0 && behind > 0) ||
     (status === 'ahead' && ahead > 0 && behind === 0) ||
     (status === 'diverged' && ahead > 0 && behind > 0));
  const disposition = !coherent ? 'UNKNOWN_PRESERVE' :
    ahead > 0 ? 'UNIQUE_COMMITS_PRESERVE' : 'ANCESTOR_REVIEW_ONLY';
  return { name, tipSha, baseSha, status: coherent ? status : 'unverified',
    ahead: coherent ? ahead : null, behind: coherent ? behind : null,
    disposition, canDelete: false };
}

export function classifyInventory({ baseSha, branches }) {
  if (!sha(baseSha) || !Array.isArray(branches) || branches.length === 0)
    throw new Error('INVALID_INVENTORY');
  const seen = new Set();
  const rows = branches.map(branch => {
    const row = classifyBranch({ ...branch, baseSha });
    if (seen.has(row.name)) throw new Error('DUPLICATE_BRANCH');
    seen.add(row.name);
    return row;
  }).sort((a,b) => a.name.localeCompare(b.name,'en'));
  const summary = { total: rows.length, uniquePreserve: 0, ancestorReview: 0, unknownPreserve: 0 };
  for (const row of rows) {
    if (row.disposition === 'UNIQUE_COMMITS_PRESERVE') summary.uniquePreserve++;
    else if (row.disposition === 'ANCESTOR_REVIEW_ONLY') summary.ancestorReview++;
    else summary.unknownPreserve++;
  }
  return { schema: 'arbor.branch-ancestry-reconciliation/1', mainSha: baseSha,
    summary, branches: rows, deletionAuthorized: false,
    note: 'Ancestry does not prove content retirement, branch ownership release, or deletion permission.' };
}
