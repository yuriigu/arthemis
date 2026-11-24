"use client";

import dynamic from "next/dynamic";
import type { MapLocation, MapObservation, ObservationMapProps } from "./types";

export type { MapLocation, MapObservation, ObservationMapProps };

const ObservationMapContent = dynamic(
  () =>
    import("./observation-map-content").then((m) => m.ObservationMapContent),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-125 w-full items-center justify-center rounded-md border border-border bg-muted text-sm text-muted-foreground animate-pulse">
        Carregando mapa...
      </div>
    ),
  },
);

export function ObservationMap(props: ObservationMapProps) {
  return <ObservationMapContent {...props} />;
}
