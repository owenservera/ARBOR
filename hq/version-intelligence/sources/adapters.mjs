// Authorized development-source adapter: injected Git-object functions ONLY.
// The caller must supply authorization; this module never connects to GitHub,
// invokes gh/git, reads user-home credentials, or touches a working tree.
import { fail } from './common.mjs';

export function createGitObjectAdapter({ resolveRef, readCommit, listTree, readBlob } = {}) {
  if ([resolveRef, readCommit, listTree, readBlob].some(fn => typeof fn !== 'function')) {
    fail('SOURCE_UNAUTHORIZED', 'adapter_methods_missing');
  }
  return Object.freeze({
    kind: 'verified-git-objects',
    authorizedDevelopmentSource: true,
    resolveRef: async input => resolveRef(input),
    readCommit: async input => readCommit(input),
    listTree: async input => listTree(input),
    readBlob: async input => readBlob(input),
  });
}

// This deliberate non-adapter prevents ambient source access.
export const NO_SOURCE_ADAPTER = Object.freeze({ kind: 'disabled', authorizedDevelopmentSource: false });
