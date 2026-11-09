"use client";

import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useId,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import {
  Map as MapLibre,
  Marker,
  Popup,
  type Map as MapLibreMap,
  type MapOptions,
  type MarkerOptions,
  type ProjectionSpecification,
  type PopupOptions,
  type StyleSpecification,
} from "maplibre-gl";
import type { Feature, FeatureCollection, LineString } from "geojson";
import {
  Compass,
  LocateFixed,
  Maximize,
  Minimize,
  X,
  ZoomIn,
  ZoomOut,
  LoaderCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface MapViewport {
  center: [number, number];
  zoom: number;
  bearing: number;
  pitch: number;
}
export type MapTheme = "light" | "dark";
export type MapStyleOption = string | StyleSpecification;
export interface MapProps extends Omit<HTMLAttributes<HTMLDivElement>, "style"> {
  styles?: { light?: MapStyleOption; dark?: MapStyleOption };
  theme?: MapTheme;
  projection?: ProjectionSpecification;
  center?: [number, number];
  zoom?: number;
  options?: Omit<MapOptions, "container" | "style">;
  viewport?: Partial<MapViewport>;
  onViewportChange?: (viewport: MapViewport) => void;
  onStyleLoaded?: () => void;
  onstyleloaded?: () => void;
  onMapChange?: (map: MapLibreMap | null) => void;
}

interface MapState {
  map: MapLibreMap | null;
  loaded: boolean;
  styleReady: boolean;
  revision: number;
}
const MapContext = createContext<MapState | null>(null);
function useMap() {
  const context = useContext(MapContext);
  if (!context) throw new Error("Map components must be rendered inside MapView.");
  return context;
}

export function useMapContext() {
  return useMap();
}

const defaultStyles: Record<MapTheme, MapStyleOption> = {
  dark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
  light: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
};

function getViewport(map: MapLibreMap): MapViewport {
  const center = map.getCenter();
  return {
    center: [center.lng, center.lat],
    zoom: map.getZoom(),
    bearing: map.getBearing(),
    pitch: map.getPitch(),
  };
}

export function MapView({
  styles,
  theme: explicitTheme,
  projection,
  center = [13.405, 52.52],
  zoom = 0,
  options = {},
  viewport,
  onViewportChange,
  onStyleLoaded,
  onstyleloaded,
  onMapChange,
  className,
  children,
  ...props
}: MapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const internalUpdateRef = useRef(false);
  const [map, setMap] = useState<MapLibreMap | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [styleReady, setStyleReady] = useState(false);
  const [revision, setRevision] = useState(0);
  const [theme, setTheme] = useState<MapTheme>(explicitTheme ?? "light");
  const resolvedTheme = explicitTheme ?? theme;
  const style = useMemo(
    () => styles?.[resolvedTheme] ?? defaultStyles[resolvedTheme],
    [styles, resolvedTheme],
  );
  const activeStyleRef = useRef(style);
  const controlled = viewport !== undefined && onViewportChange !== undefined;

  useEffect(() => {
    if (explicitTheme) return;
    const root = document.documentElement;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const readTheme = () => {
      const documentTheme = root.classList.contains("dark")
        ? "dark"
        : root.classList.contains("light")
          ? "light"
          : null;
      setTheme(documentTheme ?? (media.matches ? "dark" : "light"));
    };
    const initialThemeUpdate = window.requestAnimationFrame(readTheme);
    const observer = new MutationObserver(readTheme);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    media.addEventListener("change", readTheme);
    return () => {
      observer.disconnect();
      media.removeEventListener("change", readTheme);
      window.cancelAnimationFrame(initialThemeUpdate);
    };
  }, [explicitTheme]);

  useEffect(() => {
    if (!containerRef.current) return;
    const instance = new MapLibre({
      container: containerRef.current,
      style,
      fadeDuration: 0,
      renderWorldCopies: false,
      attributionControl: { compact: true },
      center: viewport?.center ?? center,
      zoom: viewport?.zoom ?? zoom,
      bearing: viewport?.bearing ?? 0,
      pitch: viewport?.pitch ?? 0,
      ...options,
    });
    mapRef.current = instance;
    setMap(instance);
    onMapChange?.(instance);

    const handleLoad = () => setLoaded(true);
    const handleStyleLoad = () => {
      setStyleReady(true);
      setRevision((value) => value + 1);
      if (projection) instance.setProjection(projection);
      (onStyleLoaded ?? onstyleloaded)?.();
    };
    const handleMove = () => {
      if (!internalUpdateRef.current) onViewportChange?.(getViewport(instance));
    };
    instance.on("load", handleLoad);
    instance.on("style.load", handleStyleLoad);
    instance.on("move", handleMove);

    return () => {
      instance.off("load", handleLoad);
      instance.off("style.load", handleStyleLoad);
      instance.off("move", handleMove);
      instance.remove();
      mapRef.current = null;
      setMap(null);
      onMapChange?.(null);
    };
    // Options and callback props initialize the map instance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const instance = mapRef.current;
    if (!instance || !loaded) return;
    if (activeStyleRef.current === style) return;
    activeStyleRef.current = style;
    setStyleReady(false);
    instance.setStyle(style, { diff: true });
  }, [style, loaded]);

  useEffect(() => {
    const instance = mapRef.current;
    if (!instance || !controlled || !viewport || instance.isMoving()) return;
    const current = getViewport(instance);
    const next = {
      center: viewport.center ?? current.center,
      zoom: viewport.zoom ?? current.zoom,
      bearing: viewport.bearing ?? current.bearing,
      pitch: viewport.pitch ?? current.pitch,
    };
    if (
      next.center[0] !== current.center[0] ||
      next.center[1] !== current.center[1] ||
      next.zoom !== current.zoom ||
      next.bearing !== current.bearing ||
      next.pitch !== current.pitch
    ) {
      internalUpdateRef.current = true;
      instance.once("moveend", () => { internalUpdateRef.current = false; });
      instance.jumpTo(next);
    }
  }, [controlled, viewport]);

  const context = useMemo(() => ({ map, loaded, styleReady, revision }), [map, loaded, styleReady, revision]);
  return (
    <div className={cn("relative h-full w-full", className)} {...props}>
      <div ref={containerRef} className="absolute inset-0" />
      <MapContext.Provider value={context}>
        <div className="pointer-events-none absolute inset-0">{styleReady ? children : <div aria-label="Carregando mapa" className="absolute inset-0 z-10 grid place-items-center bg-muted/70"><span className="size-2 animate-pulse rounded-full bg-muted-foreground" /></div>}</div>
      </MapContext.Provider>
    </div>
  );
}

interface MarkerContextState {
  marker: Marker | null;
  element: HTMLDivElement | null;
  draggable: boolean;
}
const MarkerContext = createContext<MarkerContextState | null>(null);

type MarkerAnchor = NonNullable<MarkerOptions["anchor"]>;
export interface MapMarkerProps {
  longitude: number;
  latitude: number;
  children?: ReactNode;
  onClick?: (event: MouseEvent) => void;
  onMouseEnter?: (event: MouseEvent) => void;
  onMouseLeave?: (event: MouseEvent) => void;
  onDragStart?: (position: { lng: number; lat: number }) => void;
  onDrag?: (position: { lng: number; lat: number }) => void;
  onDragEnd?: (position: { lng: number; lat: number }) => void;
  draggable?: boolean;
  anchor?: MarkerAnchor;
  offset?: MarkerOptions["offset"];
  rotation?: number;
  pitchAlignment?: MarkerOptions["pitchAlignment"];
  rotationAlignment?: MarkerOptions["rotationAlignment"];
}

export function MapMarker({
  longitude,
  latitude,
  children,
  draggable = false,
  anchor = "center",
  offset,
  rotation,
  pitchAlignment,
  rotationAlignment,
  onClick,
  onMouseEnter,
  onMouseLeave,
  onDragStart,
  onDrag,
  onDragEnd,
}: MapMarkerProps) {
  const { map, loaded } = useMap();
  const [marker, setMarker] = useState<Marker | null>(null);
  const [element, setElement] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!map || !loaded || !Number.isFinite(longitude) || !Number.isFinite(latitude)) return;
    const markerElement = document.createElement("div");
    markerElement.className = "cursor-pointer";
    const markerInstance = new Marker({
      element: markerElement,
      draggable,
      anchor,
      offset,
      rotation,
      pitchAlignment,
      rotationAlignment,
    }).setLngLat([longitude, latitude]).addTo(map);
    const renderFrame = window.requestAnimationFrame(() => {
      setMarker(markerInstance);
      setElement(markerElement);
    });

    const getLngLat = () => {
      const position = markerInstance.getLngLat();
      return { lng: position.lng, lat: position.lat };
    };
    const handleDragStart = () => onDragStart?.(getLngLat());
    const handleDrag = () => onDrag?.(getLngLat());
    const handleDragEnd = () => onDragEnd?.(getLngLat());
    if (onClick) markerElement.addEventListener("click", onClick);
    if (onMouseEnter) markerElement.addEventListener("mouseenter", onMouseEnter);
    if (onMouseLeave) markerElement.addEventListener("mouseleave", onMouseLeave);
    if (draggable) {
      markerInstance.on("dragstart", handleDragStart);
      markerInstance.on("drag", handleDrag);
      markerInstance.on("dragend", handleDragEnd);
    }
    return () => {
      if (onClick) markerElement.removeEventListener("click", onClick);
      if (onMouseEnter) markerElement.removeEventListener("mouseenter", onMouseEnter);
      if (onMouseLeave) markerElement.removeEventListener("mouseleave", onMouseLeave);
      markerInstance.off("dragstart", handleDragStart);
      markerInstance.off("drag", handleDrag);
      markerInstance.off("dragend", handleDragEnd);
      window.cancelAnimationFrame(renderFrame);
      markerInstance.remove();
      setMarker(null);
      setElement(null);
    };
  }, [map, loaded, longitude, latitude, draggable, anchor, offset, rotation, pitchAlignment, rotationAlignment, onClick, onMouseEnter, onMouseLeave, onDragStart, onDrag, onDragEnd]);

  useEffect(() => {
    marker?.setLngLat([longitude, latitude]);
  }, [marker, longitude, latitude]);

  const context = useMemo(() => ({ marker, element, draggable }), [marker, element, draggable]);
  return element ? createPortal(
    <MarkerContext.Provider value={context}>
      {children ?? <div className="size-4 rounded-full border-2 border-white bg-primary shadow-lg" />}
    </MarkerContext.Provider>,
    element,
  ) : null;
}

export function MarkerContent({ children, className }: { children?: ReactNode; className?: string }) {
  return <div className={cn("relative cursor-pointer", className)}>{children ?? <div className="size-4 rounded-full border-2 border-white bg-primary shadow-lg" />}</div>;
}
export function MarkerLabel({ children, className }: { children?: ReactNode; className?: string }) {
  return <span className={cn("text-xs", className)}>{children}</span>;
}

export function MarkerPopup({
  children,
  className,
  closeButton = false,
  offset = 16,
  anchor,
  closeOnClick,
  closeOnMove,
  focusAfterOpen,
  maxWidth = "none",
}: {
  children?: ReactNode;
  className?: string;
  closeButton?: boolean;
  offset?: PopupOptions["offset"];
  anchor?: PopupOptions["anchor"];
  closeOnClick?: boolean;
  closeOnMove?: boolean;
  focusAfterOpen?: boolean;
  maxWidth?: string;
}) {
  const markerContext = useContext(MarkerContext);
  const popupRef = useRef<Popup | null>(null);
  const [target, setTarget] = useState<HTMLElement | null>(null);
  useEffect(() => {
    const marker = markerContext?.marker;
    if (!marker) return;
    const popup = new Popup({
      offset,
      anchor,
      closeButton: false,
      closeOnClick,
      closeOnMove: markerContext.draggable ? false : closeOnMove,
      focusAfterOpen,
      className: "maplibre-popup-transparent",
    }).setDOMContent(document.createElement("div")).setMaxWidth(maxWidth);
    marker.setPopup(popup);
    popupRef.current = popup;
    const targetElement = popup.getElement().querySelector<HTMLElement>(".maplibregl-popup-content");
    const renderFrame = window.requestAnimationFrame(() => setTarget(targetElement));
    return () => {
      marker.setPopup(null);
      popup.remove();
      window.cancelAnimationFrame(renderFrame);
      popupRef.current = null;
      setTarget(null);
    };
  }, [markerContext?.marker, markerContext?.draggable, offset, anchor, closeOnClick, closeOnMove, focusAfterOpen, maxWidth]);
  if (!target) return null;
  return createPortal(
    <div className={cn("relative max-w-64 rounded-md border border-border bg-card p-3 text-foreground shadow-md", className)}>
      {closeButton && <button type="button" onClick={() => popupRef.current?.remove()} aria-label="Fechar popup" className="absolute right-1 top-1 rounded p-1 text-muted-foreground hover:bg-accent"><X className="size-4" aria-hidden="true" /></button>}
      {children}
    </div>,
    target,
  );
}

export function MapPopup({
  longitude,
  latitude,
  children,
  className,
  closeButton = false,
  offset = 16,
  anchor,
  closeOnClick,
  closeOnMove,
  focusAfterOpen,
  maxWidth = "none",
  onClose,
}: {
  longitude: number;
  latitude: number;
  children?: ReactNode;
  className?: string;
  closeButton?: boolean;
  offset?: PopupOptions["offset"];
  anchor?: PopupOptions["anchor"];
  closeOnClick?: boolean;
  closeOnMove?: boolean;
  focusAfterOpen?: boolean;
  maxWidth?: string;
  onClose?: () => void;
}) {
  const { map, loaded } = useMap();
  const popupRef = useRef<Popup | null>(null);
  const [target, setTarget] = useState<HTMLElement | null>(null);
  useEffect(() => {
    if (!map || !loaded || !Number.isFinite(longitude) || !Number.isFinite(latitude)) return;
    const popup = new Popup({
      offset, anchor, closeButton: false, closeOnClick, closeOnMove, focusAfterOpen,
      className: "maplibre-popup-transparent",
    }).setLngLat([longitude, latitude]).setDOMContent(document.createElement("div")).addTo(map).setMaxWidth(maxWidth);
    popupRef.current = popup;
    const targetElement = popup.getElement().querySelector<HTMLElement>(".maplibregl-popup-content");
    const renderFrame = window.requestAnimationFrame(() => setTarget(targetElement));
    const handleClose = () => onClose?.();
    popup.on("close", handleClose);
    return () => {
      popup.off("close", handleClose);
      popup.remove();
      window.cancelAnimationFrame(renderFrame);
      popupRef.current = null;
      setTarget(null);
    };
  }, [map, loaded, longitude, latitude, offset, anchor, closeOnClick, closeOnMove, focusAfterOpen, maxWidth, onClose]);
  if (!target) return null;
  return createPortal(<div className={cn("relative max-w-64 rounded-md border border-border bg-card p-3 text-foreground shadow-md", className)}>
    {closeButton && <button type="button" onClick={() => popupRef.current?.remove()} aria-label="Fechar popup" className="absolute right-1 top-1 rounded p-1 text-muted-foreground hover:bg-accent"><X className="size-4" aria-hidden="true" /></button>}
    {children}
  </div>, target);
}

export function MarkerTooltip({ children }: { children?: ReactNode }) {
  return <span title={typeof children === "string" ? children : undefined}>{children}</span>;
}

export function MapControls({
  position = "bottom-right",
  showZoom = true,
  showCompass = false,
  showLocate = false,
  showFullscreen = false,
  className,
  onLocate,
}: {
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  showZoom?: boolean;
  showCompass?: boolean;
  showLocate?: boolean;
  showFullscreen?: boolean;
  className?: string;
  onLocate?: (coordinates: { longitude: number; latitude: number }) => void;
}) {
  const { map, loaded } = useMap();
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState("");
  if (!loaded || !map) return null;
  const positions = {
    "top-left": "left-2 top-2",
    "top-right": "right-2 top-2",
    "bottom-left": "bottom-2 left-2",
    "bottom-right": "bottom-10 right-2",
  };
  const controlClass = "grid size-9 place-items-center border-b border-border bg-card text-lg last:border-0 hover:bg-accent disabled:opacity-50";
  return <div className={cn("pointer-events-auto absolute z-10 flex flex-col overflow-hidden rounded-md border border-border shadow", positions[position], className)}>
    {showZoom && <><button type="button" className={controlClass} onClick={() => map.zoomTo(map.getZoom() + 1, { duration: 300 })} aria-label="Aproximar"><ZoomIn className="size-4" aria-hidden="true" /></button><button type="button" className={controlClass} onClick={() => map.zoomTo(map.getZoom() - 1, { duration: 300 })} aria-label="Afastar"><ZoomOut className="size-4" aria-hidden="true" /></button></>}
    {showCompass && <button type="button" className={controlClass} onClick={() => map.resetNorthPitch({ duration: 300 })} aria-label="Redefinir orientação"><Compass className="size-4" aria-hidden="true" /></button>}
    {showLocate && <button type="button" className={controlClass} disabled={locating} aria-label="Localizar" onClick={() => {
      if (!navigator.geolocation) { setError("Geolocalização não disponível neste navegador."); return; }
      setLocating(true);
      setError("");
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          const point = { longitude: coords.longitude, latitude: coords.latitude };
          map.flyTo({ center: [point.longitude, point.latitude], zoom: 14, duration: 1500 });
          onLocate?.(point);
          setLocating(false);
        },
        (cause) => { setError(`Não foi possível obter a localização: ${cause.message}`); setLocating(false); },
      );
    }}>{locating ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <LocateFixed className="size-4" aria-hidden="true" />}</button>}
    {showFullscreen && <button type="button" className={controlClass} aria-label="Alternar tela cheia" onClick={() => {
      const container = map.getContainer();
      if (document.fullscreenElement) void document.exitFullscreen().catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Não foi possível sair da tela cheia."));
      else void container.requestFullscreen().catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Não foi possível abrir a tela cheia."));
    }}>{document.fullscreenElement ? <Minimize className="size-4" aria-hidden="true" /> : <Maximize className="size-4" aria-hidden="true" />}</button>}
    {error && <span role="alert" className="absolute right-11 top-0 w-64 rounded bg-card p-2 text-xs text-destructive shadow">{error}</span>}
  </div>;
}

export function MapRoute({
  id,
  coordinates,
  color = "#4285F4",
  width = 3,
  opacity = 0.8,
  dashArray,
  interactive = true,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: {
  id?: string;
  coordinates: [number, number][];
  color?: string;
  width?: number;
  opacity?: number;
  dashArray?: [number, number];
  interactive?: boolean;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}) {
  const generatedId = useId();
  const routeId = id ?? `route-${generatedId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const sourceId = `route-source-${routeId}`;
  const layerId = `route-layer-${routeId}`;
  const { map, styleReady, revision } = useMap();
  const line: Feature<LineString> = useMemo(() => ({
    type: "Feature",
    properties: {},
    geometry: { type: "LineString", coordinates },
  }), [coordinates]);
  useEffect(() => {
    if (!map || !styleReady || coordinates.length < 2) return;
    if (map.getLayer(layerId)) map.removeLayer(layerId);
    if (map.getSource(sourceId)) map.removeSource(sourceId);
    map.addSource(sourceId, { type: "geojson", data: line });
    map.addLayer({
      id: layerId,
      type: "line",
      source: sourceId,
      layout: { "line-join": "round", "line-cap": "round" },
      paint: {
        "line-color": color,
        "line-width": width,
        "line-opacity": opacity,
        ...(dashArray ? { "line-dasharray": dashArray } : {}),
      },
    });
    return () => {
      if (map.getLayer(layerId)) map.removeLayer(layerId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);
    };
  }, [map, styleReady, revision, coordinates.length, line, sourceId, layerId, color, width, opacity, dashArray]);
  useEffect(() => {
    if (!map || !styleReady || !interactive || !map.getLayer(layerId)) return;
    const click = () => onClick?.();
    const enter = () => { map.getCanvas().style.cursor = "pointer"; onMouseEnter?.(); };
    const leave = () => { map.getCanvas().style.cursor = ""; onMouseLeave?.(); };
    map.on("click", layerId, click);
    map.on("mouseenter", layerId, enter);
    map.on("mouseleave", layerId, leave);
    return () => {
      map.off("click", layerId, click);
      map.off("mouseenter", layerId, enter);
      map.off("mouseleave", layerId, leave);
    };
  }, [map, styleReady, revision, interactive, layerId, onClick, onMouseEnter, onMouseLeave]);
  useEffect(() => {
    if (!map || !styleReady || !map.getLayer(layerId)) return;
    map.setPaintProperty(layerId, "line-color", color);
    map.setPaintProperty(layerId, "line-width", width);
    map.setPaintProperty(layerId, "line-opacity", opacity);
  }, [map, styleReady, revision, layerId, color, width, opacity]);
  return null;
}

export function MapClusterLayer({
  id = "observation-clusters",
  data,
  radius = 50,
}: {
  id?: string;
  data: FeatureCollection;
  radius?: number;
}) {
  const { map, styleReady, revision } = useMap();
  useEffect(() => {
    if (!map || !styleReady) return;
    const sourceId = `${id}-source`;
    const layerId = `${id}-circles`;
    if (map.getLayer(layerId)) map.removeLayer(layerId);
    if (map.getSource(sourceId)) map.removeSource(sourceId);
    map.addSource(sourceId, { type: "geojson", data, cluster: true, clusterRadius: radius });
    map.addLayer({
      id: layerId,
      type: "circle",
      source: sourceId,
      filter: ["has", "point_count"],
      paint: {
        "circle-color": ["step", ["get", "point_count"], "#60a5fa", 10, "#3b82f6", 50, "#1d4ed8"],
        "circle-radius": ["step", ["get", "point_count"], 16, 10, 22, 50, 30],
        "circle-stroke-width": 2,
        "circle-stroke-color": "#fff",
      },
    });
    return () => {
      if (map.getLayer(layerId)) map.removeLayer(layerId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);
    };
  }, [map, styleReady, revision, data, id, radius]);
  return null;
}

export function MapRouteLayer({ children }: { children?: ReactNode }) {
  return createElement("div", { className: "contents" }, children);
}
