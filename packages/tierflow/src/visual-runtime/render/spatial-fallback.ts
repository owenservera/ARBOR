/** Pure, loss-aware accessible projection. Geometry is never UI identity or an action. */
export interface SpatialFallback {
  readonly present: boolean;
  readonly description: string;
  readonly lossCodes: readonly string[];
  readonly sourceViewCount: number;
}

export function projectSpatialFallback(views: unknown): SpatialFallback {
  const spatial = Array.isArray(views)
    ? views.filter((view) => view !== null && typeof view === "object" &&
      !Array.isArray(view) &&
      (Object.getOwnPropertyDescriptor(view, "kind")?.value === "spatial" ||
        Object.getOwnPropertyDescriptor(view, "type")?.value === "spatial"))
    : [];
  if (spatial.length === 0) {
    return { present: false, description: "", lossCodes: [], sourceViewCount: 0 };
  }
  return {
    present: true,
    description: "Spatial view is not interactive here. Use the accessible two-dimensional document; spatial geometry and outbound flows were not converted.",
    lossCodes: ["SPATIAL_UNSUPPORTED"],
    sourceViewCount: spatial.length,
  };
}
