// R03: conservative read-only changed-path triage for source-pinned unique-commit branches.
// Never grants merge, archive or deletion authority; GitHub compare may truncate file lists.
const sha = s => typeof s === 'string' && /^[a-f0-9]{40}$/.test(s);
const rules = [
 ['provider-studio', /^studio\//],
 ['host-authority', /^apps\/vivim-host\//],
 ['native-desktop', /^(native\/|src-tauri\/)/],
 ['mobile-visual', /^(apps\/mobile-relay\/|packages\/(tierflow|vec-ui))/],
 ['core-contracts', /^(core\/|contracts\/)/],
 ['knowledge', /^(hq\/|wiki\/)/],
 ['build-ci', /^(\.github\/|scripts\/|tools\/packaging\/)/],
 ['documentation', /^(docs\/|\.integration\/)/]
];
export function classifyChangedPath(filename) {
 if (typeof filename !== 'string' || !filename || filename.startsWith('/') || filename.includes('\\') || filename.split('/').includes('..'))
   return 'unsafe-or-unknown';
 return rules.find(([,re])=>re.test(filename))?.[0] ?? 'other';
}
export function assessBranchContent({name,tipSha,baseSha,ahead,comparison}) {
 if(typeof name!=='string'||!name||!sha(tipSha)||!sha(baseSha)||!Number.isSafeInteger(ahead)||ahead<=0)
   throw new Error('NOT_PINNED_UNIQUE_BRANCH');
 const files=Array.isArray(comparison?.files)?comparison.files:[];
 const verifiedBase=comparison?.base_commit?.sha===baseSha;
 const comparisonMatches=verifiedBase&&comparison?.ahead_by===ahead;
 const truncated=comparison?.too_large===true || files.length>=300;
 const listed=files.map(f=>({path:f.filename,area:classifyChangedPath(f.filename),status:f.status??'unknown'}));
 const areas=[...new Set(listed.map(f=>f.area))].sort();
 const evidenceComplete=comparisonMatches&&!truncated&&Array.isArray(comparison?.files);
 return {name,tipSha,baseSha,ahead,listedFiles:listed.length,areas,
   sampleFiles:listed.slice(0,25),fileListComplete:evidenceComplete,
   disposition:evidenceComplete?'MANUAL_CONTENT_REVIEW_REQUIRED':'INCOMPLETE_COMPARE_PRESERVE',
   canDelete:false,canMerge:false,
   note:'File-name comparisons do not prove feature parity, runtime acceptance or safe branch deletion.'};
}
