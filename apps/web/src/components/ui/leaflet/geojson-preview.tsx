"use client";

import dynamic from "next/dynamic";
import type { GeoJSONPreviewProps } from "./geojson-preview-content";

export type { GeoJSONPreviewProps };

const GeoJSONPreviewContent = dynamic(
  () =>
    import("./geojson-preview-content").then((m) => m.GeoJSONPreviewContent),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-96 w-full items-center justify-center rounded-md border border-border bg-muted text-sm text-muted-foreground animate-pulse">
        Carregando mapa...
      </div>
    ),
  },
);

export function GeoJSONPreview(props: GeoJSONPreviewProps) {
  if (!props.data) return null;
  return <GeoJSONPreviewContent {...props} />;
}
