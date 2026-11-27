"use client";

import { useMemo } from "react";
import { getGeoJSONCenter, toGeoJSONFeatureCollection } from "@/lib/geojson";
import { cn } from "@/lib/utils";
import {
  LeafletControls,
  LeafletGeoJSON,
  LeafletView,
} from "./leaflet-components";

export interface GeoJSONPreviewProps {
  data: unknown;
  className?: string;
  zoom?: number;
}

export function GeoJSONPreviewContent({
  data,
  className,
  zoom = 10,
}: GeoJSONPreviewProps) {
  const featureCollection = useMemo(
    () => toGeoJSONFeatureCollection(data),
    [data],
  );
  const center = useMemo(
    () => getGeoJSONCenter(featureCollection),
    [featureCollection],
  );
  const serializedKey = useMemo(
    () => (featureCollection ? JSON.stringify(featureCollection) : ""),
    [featureCollection],
  );

  if (!featureCollection) return null;

  return (
    <div
      className={cn(
        "relative h-96 w-full overflow-hidden rounded-md border border-border bg-background",
        className,
      )}
    >
      <LeafletView center={center} zoom={zoom} className="h-full w-full">
        <LeafletGeoJSON
          key={serializedKey}
          data={featureCollection}
          style={{
            fillColor: "#22c55e",
            fillOpacity: 0.4,
            color: "#16a34a",
            weight: 2,
          }}
        />
        <LeafletControls position="top-right" showLocate={false} />
      </LeafletView>
    </div>
  );
}
