type Position = [number, number];

function isPosition(value: unknown): value is Position {
  if (!Array.isArray(value) || value.length !== 2) return false;
  const [longitude, latitude] = value;
  return typeof longitude === "number" && Number.isFinite(longitude) && longitude >= -180 && longitude <= 180 &&
    typeof latitude === "number" && Number.isFinite(latitude) && latitude >= -90 && latitude <= 90;
}

function isLineString(value: unknown): value is Position[] {
  return Array.isArray(value) && value.length >= 2 && value.every(isPosition);
}

function isPolygonCoordinates(value: unknown): value is Position[][] {
  return Array.isArray(value) && value.length >= 1 && value.every(isLineString);
}

function isGeometry(value: unknown): boolean {
  if (!value || typeof value !== "object" || !("type" in value) || !("coordinates" in value)) return false;
  const geometry = value as { type: unknown; coordinates: unknown };
  switch (geometry.type) {
    case "Point": return isPosition(geometry.coordinates);
    case "LineString": return isLineString(geometry.coordinates);
    case "Polygon": return isPolygonCoordinates(geometry.coordinates);
    case "MultiPoint": return Array.isArray(geometry.coordinates) && geometry.coordinates.length > 0 && geometry.coordinates.every(isPosition);
    case "MultiLineString": return Array.isArray(geometry.coordinates) && geometry.coordinates.length > 0 && geometry.coordinates.every(isLineString);
    case "MultiPolygon": return Array.isArray(geometry.coordinates) && geometry.coordinates.length > 0 && geometry.coordinates.every(isPolygonCoordinates);
    default: return false;
  }
}

export function isValidGeoJSON(value: unknown): boolean {
  if (!value || typeof value !== "object" || !("type" in value)) return false;
  const feature = value as { type: unknown; geometry?: unknown; features?: unknown };
  if (feature.type === "Feature") return isGeometry(feature.geometry);
  if (feature.type === "FeatureCollection") {
    return Array.isArray(feature.features) && feature.features.every((item) =>
      !!item && typeof item === "object" && "type" in item &&
      (item as { type: unknown }).type === "Feature" &&
      isGeometry((item as { geometry?: unknown }).geometry),
    );
  }
  return isGeometry(value);
}
