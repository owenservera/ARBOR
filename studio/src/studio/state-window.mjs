/**
 * @hq:context OS window state sampler: samples CDP targets into OS window observations and classifies window geometry.
 * @hq:owner atlas
 * @hq:task state-window-sampler
 * @hq:invariant never opens a connection; the bounds getter is injected; throwing lookups are reported, never counted.
 */

const DEFAULT_SCREEN = { width: 1920, height: 1080 };

/**
 * Sample one OS window observation per CDP target. Several tabs can share one OS windowId,
 * so `count` and `distinctWindows` count distinct windowId values, not targets.
 *
 * Never opens a connection: `getWindowBounds` is injected by the caller (browser control stays Studio-owned).
 * A target whose bounds lookup throws is reported as { targetId, windowId: null, error }
 * and does not count toward distinctWindows.
 *
 * @param {{ targets?: Array<{ id: string, url?: string, title?: string, type?: string }>, getWindowBounds: (targetId: string) => Promise<{ windowId: number | string, bounds: { left: number, top: number, width: number, height: number }, state: string }> }} args
 * @returns {{ count: number, windows: Array<{ windowId: number | string | null, targetId: string, title?: string, bounds?: { left: number, top: number, width: number, height: number }, state?: string } | { targetId: string, windowId: null, error: string }>, distinctWindows: number }}
 */
export async function sampleWindows({ targets = [], getWindowBounds }) {
  const windows = [];
  const seen = new Set();

  for (const target of targets) {
    const targetId = target.id;
    try {
      const observation = await getWindowBounds(targetId);
      const { windowId, bounds, state } = observation;
      windows.push({ windowId, targetId, title: target.title, bounds, state });
      seen.add(windowId);
    } catch (error) {
      windows.push({ targetId, windowId: null, error: String(error) });
    }
  }

  return {
    count: seen.size,
    windows,
    distinctWindows: seen.size,
  };
}

/**
 * Classify a window's geometry against a screen size.
 *
 * @param {{ left: number, top: number, width: number, height: number }} bounds
 * @param {{ width?: number, height?: number }} [screen]
 * @returns {'left-half' | 'right-half' | 'top-half' | 'bottom-half' | 'full' | 'floating'}
 */
export function describeGeometry(bounds, screen = DEFAULT_SCREEN) {
  const { left, top, width, height } = bounds;
  const { width: screenWidth, height: screenHeight } = screen;
  const halfWidth = screenWidth / 2;
  const halfHeight = screenHeight / 2;

  if (left === 0 && top === 0 && width === screenWidth && height === screenHeight) return 'full';
  if (left === 0 && top === 0 && width === halfWidth && height === screenHeight) return 'left-half';
  if (left === halfWidth && top === 0 && width === halfWidth && height === screenHeight) return 'right-half';
  if (left === 0 && top === 0 && width === screenWidth && height === halfHeight) return 'top-half';
  if (left === 0 && top === halfHeight && width === screenWidth && height === halfHeight) return 'bottom-half';
  return 'floating';
}
