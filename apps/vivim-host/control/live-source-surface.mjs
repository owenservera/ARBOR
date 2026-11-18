// Live Host adapter for the existing HQ development index. No demo fallback.
export async function createLiveSourceSurface({ approvedRoots, dataDir, actorId, sessionId, authorize }) {
  if (!Array.isArray(approvedRoots) || !approvedRoots.length)
    throw new Error('HQ_SOURCE_ROOTS_NOT_CONFIGURED');
  const { createDevIntelligence } = await import('../../../hq/lib/arbor-service.mjs');
  const hq = createDevIntelligence({ mode: 'host', approvedRoots, dataDir, actorId, sessionId, authorize });
  return Object.freeze({
    status: () => hq.status(),
    register: params => hq.registerSource(params),
    read: params => hq.fileSurface(params),
    context: params => hq.fileSurfaceContext(params),
    compiledContext: params => hq.compiledContext(params),
    // Same existing incremental index, never a source edit. Git is optional.
    refresh: () => {
      const result = hq.index({ useGit: false });
      return { status: result.errors.length ? 'partial' : result.projects.length ? 'indexed' : 'empty',
        totals: result.totals, errorCount: result.errors.length };
    }
  });
}
