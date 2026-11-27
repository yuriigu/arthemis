"use client";

import { useMemo } from "react";
import type { FeatureCollection, Geometry } from "geojson";
import { cn } from "@/lib/utils";
import { isValidGeoJSON } from "@/lib/geojson";
import {
  LeafletView,
  LeafletMarker,
  LeafletPopup,
  LeafletGeoJSON,
  LeafletControls,
} from "@/components/ui/leaflet";
import type { MapLocation, ObservationMapProps } from "./types";

function getBoundaryGeometry(position: unknown): Geometry | null {
  if (!isValidGeoJSON(position) || !position || typeof position !== "object")
    return null;
  const geometry =
    "type" in position && position.type === "Feature" && "geometry" in position
      ? position.geometry
      : position;
  if (!geometry || typeof geometry !== "object" || !("type" in geometry))
    return null;
  return geometry as Geometry;
}

function ObservationBoundaries({ locations }: { locations: MapLocation[] }) {
  const data = useMemo<FeatureCollection>(
    () => ({
      type: "FeatureCollection",
      features: locations.flatMap((location) => {
        const geometry = getBoundaryGeometry(location.position);
        return geometry
          ? [
              {
                type: "Feature" as const,
                properties: {
                  ecosystem: location.ecosystem ?? "",
                  country: location.country ?? "",
                },
                geometry,
              },
            ]
          : [];
      }),
    }),
    [locations],
  );

  if (!data.features.length) return null;

  return (
    <LeafletGeoJSON
      key={JSON.stringify(data)}
      data={data}
      style={{
        fillColor: "#22c55e",
        fillOpacity: 0.4,
        color: "#16a34a",
        weight: 2,
      }}
    />
  );
}

function getCenter(locations: MapLocation[]): [number, number] {
  for (const location of locations) {
    const geometry = getBoundaryGeometry(location.position);
    if (!geometry) continue;
    let coordinates: [number, number][] = [];
    if (geometry.type === "Point") {
      coordinates = [geometry.coordinates as [number, number]];
    } else if (geometry.type === "MultiPoint") {
      coordinates = geometry.coordinates as [number, number][];
    } else if (geometry.type === "LineString") {
      coordinates = geometry.coordinates as [number, number][];
    } else if (geometry.type === "MultiLineString") {
      coordinates = (geometry.coordinates as [number, number][][]).flat();
    } else if (geometry.type === "Polygon") {
      coordinates = geometry.coordinates[0] as [number, number][];
    } else if (geometry.type === "MultiPolygon") {
      coordinates = (geometry.coordinates[0]?.[0] ?? []) as [number, number][];
    }
    if (!coordinates.length) continue;
    const longitudes = coordinates.map((point) => point[0]);
    const latitudes = coordinates.map((point) => point[1]);
    return [
      (Math.min(...latitudes) + Math.max(...latitudes)) / 2,
      (Math.min(...longitudes) + Math.max(...longitudes)) / 2,
    ];
  }
  return [0, 0];
}

export function ObservationMapContent({
  locations,
  observations = [],
  className,
}: ObservationMapProps) {
  const center = useMemo(() => getCenter(locations), [locations]);

  return (
    <div
      className={cn(
        "relative h-125 w-full overflow-hidden rounded-md bg-background border border-border",
        className,
      )}
    >
      <LeafletView center={center} zoom={6} className="h-full w-full">
        <ObservationBoundaries locations={locations} />
        {observations.map((observation) => (
          <LeafletMarker
            key={observation.id}
            position={[observation.lat, observation.lng]}
            color={observation.color}
          >
            <LeafletPopup>
              <div className="space-y-1">
                <p className="font-semibold text-foreground">{observation.name}</p>
                <p className="text-lg font-bold text-primary">
                  {observation.value} {observation.unit}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(observation.date).toLocaleDateString("pt-BR", {
                    timeZone: "UTC",
                  })}
                </p>
              </div>
            </LeafletPopup>
          </LeafletMarker>
        ))}
        <LeafletControls position="top-right" />
      </LeafletView>
    </div>
  );
}
