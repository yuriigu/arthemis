import type { ReactNode } from "react";
import type { PathOptions, LatLngExpression } from "leaflet";
import type { FeatureCollection, Geometry } from "geojson";

export interface LeafletViewProps {
  center?: [number, number];
  zoom?: number;
  scrollWheelZoom?: boolean;
  className?: string;
  children?: ReactNode;
}

export interface LeafletMarkerProps {
  position: [number, number];
  color?: string;
  icon?: import("leaflet").Icon | import("leaflet").DivIcon;
  children?: ReactNode;
}

export interface LeafletPopupProps {
  children?: ReactNode;
  className?: string;
}

export interface LeafletControlsProps {
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
  showZoom?: boolean;
  showLocate?: boolean;
  className?: string;
}

export interface LeafletPolygonProps {
  positions: LatLngExpression[] | LatLngExpression[][] | LatLngExpression[][][];
  pathOptions?: PathOptions;
  children?: ReactNode;
}

export interface LeafletPolylineProps {
  positions: LatLngExpression[] | LatLngExpression[][];
  pathOptions?: PathOptions;
  children?: ReactNode;
}

export interface LeafletGeoJSONProps {
  data: FeatureCollection | Geometry;
  style?: PathOptions | ((feature?: unknown) => PathOptions);
  children?: ReactNode;
}
