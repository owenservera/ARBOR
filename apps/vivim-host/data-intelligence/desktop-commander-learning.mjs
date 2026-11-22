// Read-only, private bridge from the existing Labs Desktop Commander archive into
// the Host's owner Wiki learning projection. This module never reads raw logs.
import { open } from 'node:fs/promises';
import path from 'node:path';

export const LEARNING_SCHEMA = 'vivim.development-learning/1';
const CAPTURE_MAX_AGE_MS = 7 * 60_000;
const ANALYSIS_MAX_AGE_MS = 30 * 60 * 60_000;
const MAX_REPORT_BYTES = 64 * 1024;
const METRICS = Object.freeze({
  powershell_profile_noise: 'PowerShell profile noise',
  pwa_offline_asset_assertion: 'PWA offline asset assertions',
  wiki_typing_assertion: 'Wiki typing assertions',
  http_401_403_test_mismatch: 'Authorization-test mismatches',
  git_dirty_build_guard: 'Dirty-tree build guards',
  model_rate_limit: 'Model rate limits',
  precheck_timeout: 'Precheck timeouts',
});
const FALLBACK = Object.freeze({ schema: LEARNING_SCHEMA, source: 'desktop-commander',
  scope: 'developer-operations', authority: 'read-only-evidence',
  privateContentIncluded: false, executable: false, promotesLearning: false });

function count(value) {
  return Number.isSafeInteger(value) && value >= 0 && value <= 1_000_000_000 ? value : null;
}
function timestamp(value, now) {
  if (typeof value !== 'string' || value.length > 55) return null;
  const time = Date.parse(value);
  if (!Number.isFinite(time) || time > now + 60_000) return null;
  return { at: new Date(time).toISOString(), ageMinutes: Math.max(0, Math.floor((now - time) / 60_000)), ms: time };
}
async function readBoundedJson(file) {
  let handle;
  try {
    handle = await open(file, 'r');
    const stat = await handle.stat();
    if (!stat.isFile() || stat.size < 2 || stat.size > MAX_REPORT_BYTES) return null;
    const bytes = await handle.readFile();
    if (bytes.byteLength > MAX_REPORT_BYTES) return null;
    return JSON.parse(bytes.toString('utf8'));
  } catch { return null; }
  finally { await handle?.close(); }
}

// Archive root is supplied by the Host itself, NEVER by a browser request.
// Missing, malformed or old receipts are reported rather than invented.
export async function readDesktopCommanderLearning({ archiveRoot, now = Date.now() } = {}) {
  if (typeof archiveRoot !== 'string' || !path.isAbsolute(archiveRoot) ||
      !Number.isFinite(now)) return { ...FALLBACK, state: 'unavailable', code: 'ARCHIVE_NOT_CONFIGURED' };
  const [capture, report] = await Promise.all([
    readBoundedJson(path.join(archiveRoot, 'state', 'cycle-latest.json')),
    readBoundedJson(path.join(archiveRoot, 'reports', 'learning-latest.json')),
  ]);
  if (capture?.schema !== 'desktop-commander-cycle-v1' ||
      capture.status !== 'SUCCESS') return { ...FALLBACK, state: 'unavailable', code: 'CAPTURE_NOT_VERIFIED' };
  const observed = timestamp(capture.finished_utc, now);
  if (!observed) return { ...FALLBACK, state: 'unavailable', code: 'CAPTURE_TIME_INVALID' };
  const captureView = { status: 'verified', lastCapturedAt: observed.at, ageMinutes: observed.ageMinutes,
    fresh: now - observed.ms <= CAPTURE_MAX_AGE_MS };
  if (report?.schema !== 'dc-local-learning-observatory-v1') {
    return { ...FALLBACK, state: captureView.fresh ? 'capturing' : 'stale',
      capture: captureView, analysis: null, code: 'ANALYSIS_NOT_AVAILABLE' };
  }
  const analysed = timestamp(report.generated_utc, now);
  const indexed = count(report.observed_index_rows);
  const omitted = count(report.upstream_large_output_omissions);
  const exitZero = count(report.process_exit_zero_entries);
  const exitNonzero = count(report.process_exit_nonzero_entries);
  if (!analysed || indexed === null || omitted === null || exitZero === null || exitNonzero === null ||
      omitted > indexed || exitZero + exitNonzero > indexed) {
    return { ...FALLBACK, state: 'unavailable', code: 'ANALYSIS_INVALID', capture: captureView };
  }
  const patterns = [];
  for (const [name, label] of Object.entries(METRICS)) {
    const value = count(report.pattern_hit_entries?.[name]);
    if (value !== null && value > 0 && value <= indexed) patterns.push({ kind: name, label, observations: value });
  }
  return {
    ...FALLBACK, state: captureView.fresh ? 'ready' : 'stale', capture: captureView,
    analysis: { generatedAt: analysed.at, fresh: now - analysed.ms <= ANALYSIS_MAX_AGE_MS,
      indexedObservations: indexed, upstreamOutputsOmitted: omitted,
      recordedExitZero: exitZero, recordedExitNonzero: exitNonzero,
      patterns, status: 'historical-observations-not-verified-regressions' },
    note: 'Metadata-only. No raw commands, arguments, outputs, tokens, user facts or inferred failures.',
  };
}
