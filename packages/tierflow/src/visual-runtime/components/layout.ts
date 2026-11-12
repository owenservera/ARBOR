/** Pure 2D constraints for nodes in the Wave 2 vivim.ui-document/1 fixture.
 * No CSS, DOM, storage, device API, or action execution takes place here.
 */
export interface LayoutConstraints {
  readonly mode?: "stack" | "grid";
  readonly gapPx?: number;
  readonly paddingPx?: number;
  readonly minItemWidthPx?: number;
  readonly maxColumns?: number;
  readonly maxWidthPx?: number;
  readonly motion?: "none" | "subtle";
}

export type LayoutResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly code: "INVALID_LAYOUT" | "LAYOUT_OVERFLOW"; readonly reason: string };

export interface ResolvedLayout {
  readonly viewportPx: number;
  readonly widthPx: number;
  readonly contentWidthPx: number;
  readonly columns: number;
  readonly itemWidthPx: number;
  readonly gapPx: number;
  readonly paddingPx: number;
  readonly motion: "none" | "subtle";
}

const KEYS = new Set(["mode", "gapPx", "paddingPx", "minItemWidthPx", "maxColumns", "maxWidthPx", "motion"]);
const FIXTURE_VIEWPORTS = [320, 360, 1280] as const;

function plain(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value) &&
    (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
}
function integer(value: unknown, low: number, high: number): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= low && value <= high;
}
function invalid(reason: string): LayoutResult<never> {
  return { ok: false, code: "INVALID_LAYOUT", reason };
}

export function validateLayoutConstraints(input: unknown): LayoutResult<LayoutConstraints> {
  if (input === undefined) return { ok: true, value: {} };
  if (!plain(input)) return invalid("layout must be a plain object");
  for (const key of Object.keys(input)) if (!KEYS.has(key)) return invalid(`unknown layout field: ${key}`);
  if (input.mode !== undefined && input.mode !== "stack" && input.mode !== "grid") return invalid("mode must be stack or grid");
  if (input.motion !== undefined && input.motion !== "none" && input.motion !== "subtle") return invalid("motion must be none or subtle");
  if (input.gapPx !== undefined && !integer(input.gapPx, 0, 32)) return invalid("gapPx must be 0..32 integer");
  if (input.paddingPx !== undefined && !integer(input.paddingPx, 0, 32)) return invalid("paddingPx must be 0..32 integer");
  if (input.minItemWidthPx !== undefined && !integer(input.minItemWidthPx, 44, 1080)) return invalid("minItemWidthPx must be 44..1080 integer");
  if (input.maxColumns !== undefined && !integer(input.maxColumns, 1, 6)) return invalid("maxColumns must be 1..6 integer");
  if (input.maxWidthPx !== undefined && !integer(input.maxWidthPx, 44, 1280)) return invalid("maxWidthPx must be 44..1280 integer");
  const value: LayoutConstraints = {
    ...(input.mode === undefined ? {} : { mode: input.mode as "stack" | "grid" }),
    ...(input.gapPx === undefined ? {} : { gapPx: input.gapPx as number }),
    ...(input.paddingPx === undefined ? {} : { paddingPx: input.paddingPx as number }),
    ...(input.minItemWidthPx === undefined ? {} : { minItemWidthPx: input.minItemWidthPx as number }),
    ...(input.maxColumns === undefined ? {} : { maxColumns: input.maxColumns as number }),
    ...(input.maxWidthPx === undefined ? {} : { maxWidthPx: input.maxWidthPx as number }),
    ...(input.motion === undefined ? {} : { motion: input.motion as "none" | "subtle" }),
  };
  for (const viewport of FIXTURE_VIEWPORTS) {
    const resolved = resolveLayout(value, viewport, 1, true);
    if (!resolved.ok) return resolved;
  }
  return { ok: true, value };
}

/** A deterministic measuring plan; the renderer must preserve DOM/source order. */
export function resolveLayout(
  constraints: LayoutConstraints,
  viewportPx: number,
  childCount: number,
  prefersReducedMotion = false,
): LayoutResult<ResolvedLayout> {
  if (!integer(viewportPx, 240, 3840) || !integer(childCount, 0, 64)) {
    return invalid("invalid viewport or child count");
  }
  if (!plain(constraints) ||
    (constraints.mode !== undefined && constraints.mode !== "stack" && constraints.mode !== "grid") ||
    (constraints.motion !== undefined && constraints.motion !== "none" && constraints.motion !== "subtle") ||
    (constraints.gapPx !== undefined && !integer(constraints.gapPx, 0, 32)) ||
    (constraints.paddingPx !== undefined && !integer(constraints.paddingPx, 0, 32)) ||
    (constraints.minItemWidthPx !== undefined && !integer(constraints.minItemWidthPx, 44, 1080)) ||
    (constraints.maxColumns !== undefined && !integer(constraints.maxColumns, 1, 6)) ||
    (constraints.maxWidthPx !== undefined && !integer(constraints.maxWidthPx, 44, 1280))) {
    return invalid("invalid layout constraints");
  }
  const padding = constraints.paddingPx ?? 16;
  const gap = constraints.gapPx ?? 12;
  const width = Math.min(viewportPx, constraints.maxWidthPx ?? 1120);
  const content = width - padding * 2;
  const minItem = constraints.minItemWidthPx ?? 160;
  if (content < 44 || content < minItem) {
    return { ok: false, code: "LAYOUT_OVERFLOW", reason: "content cannot fit the minimum item width at this viewport" };
  }
  const possible = Math.floor((content + gap) / (minItem + gap));
  const columns = constraints.mode === "grid"
    ? Math.max(1, Math.min(constraints.maxColumns ?? 4, possible, Math.max(1, childCount)))
    : 1;
  const itemWidth = (content - (columns - 1) * gap) / columns;
  if (itemWidth < 44 || itemWidth < minItem) {
    return { ok: false, code: "LAYOUT_OVERFLOW", reason: "computed item is narrower than allowed minimum" };
  }
  return {
    ok: true,
    value: {
      viewportPx, widthPx: width, contentWidthPx: content, columns,
      itemWidthPx: itemWidth, gapPx: gap, paddingPx: padding,
      motion: prefersReducedMotion ? "none" : (constraints.motion ?? "none"),
    },
  };
}

export const RESPONSIVE_FIXTURE_WIDTHS = FIXTURE_VIEWPORTS;
