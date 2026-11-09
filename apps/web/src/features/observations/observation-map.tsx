"use client";

import { useEffect, useMemo } from "react";
import type { Geometry, FeatureCollection } from "geojson";
import { cn } from "@/lib/utils";
import {
  MapControls,
  MapMarker,
  MapView,
  MarkerContent,
  MarkerPopup,
  useMapContext,
} from "@/components/ui/map";

export interface MapLocation {
  position?: Geometry | null;
  ecosystem?: string;
  country?: string;
}

export interface MapObservation {
  id: number | string;
  name: string;
  unit: string;
  value: number | string;
  date: string | Date;
  lng: number;
  lat: number;
  color: string;
}

export interface ObservationMapProps {
  locations: MapLocation[];
  observations?: MapObservation[];
  className?: string;
}

function ObservationBoundaries({ locations }: { locations: MapLocation[] }) {
  const { map, styleReady, revision } = useMapContext();
  const data = useMemo<FeatureCollection>(() => ({
    type: "FeatureCollection",
    features: locations.flatMap((location) => location.position ? [{
      type: "Feature" as const,
      properties: { ecosystem: location.ecosystem ?? "", country: location.country ?? "" },
      geometry: location.position,
    }] : []),
  }), [locations]);

  useEffect(() => {
    if (!map || !styleReady) return;
    const sourceId = "observation-boundaries";
    if (map.getLayer("observation-boundary-fill")) map.removeLayer("observation-boundary-fill");
    if (map.getLayer("observation-boundary-outline")) map.removeLayer("observation-boundary-outline");
    if (map.getSource(sourceId)) map.removeSource(sourceId);
    if (!data.features.length) return;
    map.addSource(sourceId, { type: "geojson", data });
    map.addLayer({ id: "observation-boundary-fill", type: "fill", source: sourceId, paint: { "fill-color": "#22c55e", "fill-opacity": 0.4 } });
    map.addLayer({ id: "observation-boundary-outline", type: "line", source: sourceId, paint: { "line-color": "#16a34a", "line-width": 2 } });
    return () => {
      if (map.getLayer("observation-boundary-fill")) map.removeLayer("observation-boundary-fill");
      if (map.getLayer("observation-boundary-outline")) map.removeLayer("observation-boundary-outline");
      if (map.getSource(sourceId)) map.removeSource(sourceId);
    };
  }, [map, styleReady, revision, data]);
  return null;
}

function getCenter(locations: MapLocation[]): [number, number] {
  for (const location of locations) {
    const geometry = location.position;
    if (!geometry || (geometry.type !== "Polygon" && geometry.type !== "MultiPolygon")) continue;
    const coordinates = geometry.type === "Polygon"
      ? geometry.coordinates[0]
      : geometry.coordinates[0]?.[0];
    if (!coordinates?.length) continue;
    const longitudes = coordinates.map((point) => point[0]);
    const latitudes = coordinates.map((point) => point[1]);
    return [
      (Math.min(...longitudes) + Math.max(...longitudes)) / 2,
      (Math.min(...latitudes) + Math.max(...latitudes)) / 2,
    ];
  }
  return [0, 0];
}

export function ObservationMap({ locations, observations = [], className }: ObservationMapProps) {
  const center = useMemo(() => getCenter(locations), [locations]);
  return (
    <div className={cn("relative h-125 w-full overflow-hidden rounded-md bg-background", className)}>
      <MapView center={center} zoom={6} className="absolute inset-0">
        <ObservationBoundaries locations={locations} />
        {observations.filter((item) => item.lng !== 0 && item.lat !== 0).map((observation) => (
          <MapMarker key={observation.id} longitude={observation.lng} latitude={observation.lat}>
            <MarkerContent><span className="block size-4 rounded-full border-2 border-white shadow-md transition-transform hover:scale-125" style={{ backgroundColor: observation.color }} /></MarkerContent>
            <MarkerPopup>
              <div className="space-y-1">
                <p className="font-semibold">{observation.name}</p>
                <p className="text-lg font-bold text-primary">{observation.value} {observation.unit}</p>
                <p className="text-xs text-muted-foreground">{new Date(observation.date).toLocaleDateString("pt-BR")}</p>
              </div>
            </MarkerPopup>
          </MapMarker>
        ))}
        <MapControls position="top-right" />
      </MapView>
    </div>
  );
}
