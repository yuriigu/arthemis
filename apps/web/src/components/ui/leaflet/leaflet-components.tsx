"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useMemo } from "react";
import L from "leaflet";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polygon,
  Polyline,
  GeoJSON,
  useMap,
} from "react-leaflet";
import { LocateFixed, ZoomIn, ZoomOut } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  LeafletControlsProps,
  LeafletGeoJSONProps,
  LeafletMarkerProps,
  LeafletPolygonProps,
  LeafletPolylineProps,
  LeafletPopupProps,
  LeafletViewProps,
} from "./types";

function ChangeView({
  center,
  zoom,
}: {
  center: [number, number];
  zoom: number;
}) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

export function LeafletView({
  center = [0, 0],
  zoom = 6,
  scrollWheelZoom = true,
  className,
  children,
}: LeafletViewProps) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      scrollWheelZoom={scrollWheelZoom}
      zoomControl={false}
      className={cn("h-full w-full", className)}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ChangeView center={center} zoom={zoom} />
      {children}
    </MapContainer>
  );
}

export function LeafletMarker({
  position,
  color,
  icon,
  children,
}: LeafletMarkerProps) {
  const markerIcon = useMemo(() => {
    if (icon) return icon;
    if (color) {
      return L.divIcon({
        className: "custom-leaflet-pin",
        html: `<span style="background-color: ${color}; width: 1rem; height: 1rem; border-radius: 9999px; border: 2px solid #ffffff; box-shadow: 0 2px 4px rgba(0,0,0,0.25); display: block; transition: transform 0.15s ease;"></span>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
        popupAnchor: [0, -10],
      });
    }
    return new L.Icon.Default();
  }, [icon, color]);

  return (
    <Marker position={position} icon={markerIcon}>
      {children}
    </Marker>
  );
}

export function LeafletPopup({ children, className }: LeafletPopupProps) {
  return <Popup className={className}>{children}</Popup>;
}

export function LeafletPolygon({
  positions,
  pathOptions,
  children,
}: LeafletPolygonProps) {
  return (
    <Polygon positions={positions} pathOptions={pathOptions}>
      {children}
    </Polygon>
  );
}

export function LeafletPolyline({
  positions,
  pathOptions,
  children,
}: LeafletPolylineProps) {
  return (
    <Polyline positions={positions} pathOptions={pathOptions}>
      {children}
    </Polyline>
  );
}

export function LeafletGeoJSON({
  data,
  style,
  children,
}: LeafletGeoJSONProps) {
  return (
    <GeoJSON data={data} style={style}>
      {children}
    </GeoJSON>
  );
}

export function LeafletControls({
  position = "top-right",
  showZoom = true,
  showLocate = true,
  className,
}: LeafletControlsProps) {
  const map = useMap();

  const positionClasses = {
    "top-right": "top-3 right-3",
    "top-left": "top-3 left-3",
    "bottom-right": "bottom-3 right-3",
    "bottom-left": "bottom-3 left-3",
  }[position];

  return (
    <div
      className={cn(
        "absolute z-[1000] flex flex-col gap-1 rounded-md border border-border bg-card/95 p-1 shadow-md backdrop-blur-sm",
        positionClasses,
        className,
      )}
    >
      {showZoom && (
        <>
          <button
            type="button"
            onClick={() => map.zoomIn()}
            title="Aumentar zoom"
            aria-label="Aumentar zoom"
            className="flex size-7 items-center justify-center rounded text-foreground transition-colors hover:bg-muted"
          >
            <ZoomIn className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => map.zoomOut()}
            title="Diminuir zoom"
            aria-label="Diminuir zoom"
            className="flex size-7 items-center justify-center rounded text-foreground transition-colors hover:bg-muted"
          >
            <ZoomOut className="size-4" />
          </button>
        </>
      )}
      {showLocate && (
        <button
          type="button"
          onClick={() => {
            if ("geolocation" in navigator) {
              navigator.geolocation.getCurrentPosition(
                (pos) => {
                  map.setView([pos.coords.latitude, pos.coords.longitude], 13);
                },
                (err) => {
                  console.warn("Geolocalização indisponível:", err);
                },
                { enableHighAccuracy: true, timeout: 5000 },
              );
            }
          }}
          title="Minha localização"
          aria-label="Minha localização"
          className="flex size-7 items-center justify-center rounded text-foreground transition-colors hover:bg-muted"
        >
          <LocateFixed className="size-4" />
        </button>
      )}
    </div>
  );
}

export { useMap, useMapEvents } from "react-leaflet";
