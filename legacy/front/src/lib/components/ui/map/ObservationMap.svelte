<script lang="ts">
  import { onDestroy } from 'svelte';
  import { Map, MapMarker, MarkerContent, MarkerPopup } from '$lib/components/ui/map';
  import type { GeoJSONSource, Map as MapLibreMap } from 'maplibre-gl';
  import type { Polygon } from 'geojson';
  import type { ObservationMapProps } from '$lib/components/ui/map/types';

  let { locations, observations }: ObservationMapProps = $props();
  let mapInstance = $state<MapLibreMap | null>(null);

  let mapCenter = $derived.by<[number, number]>(() => {
    const ring = (locations?.[0]?.position as Polygon)?.coordinates?.[0];
    if (!ring || ring.length === 0) return [0.0, 0.0];

    let minLng = Infinity;
    let maxLng = -Infinity;
    let minLat = Infinity;
    let maxLat = -Infinity;

    for (const [lng, lat] of ring) {
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    }

    return [
      (minLng + maxLng) / 2,
      (minLat + maxLat) / 2
    ];
  });

  // Drwas a custom layer; no built-in mapcn-svelte component 
  function drawLocationBoundary() {
    const map = mapInstance;
    if (!map || !locations || locations.length === 0) return;
    
    const sourceName = "boundaries";
    
    const validLocations = locations.filter(loc => loc?.position?.type);
    if (!map.getSource(sourceName) && validLocations.length > 0) {

      // Adds new GeoJSON polygon to the map instance
      map.addSource(sourceName, { 
        type: "geojson", 
        data: {
          type: "FeatureCollection",
          features: validLocations.map(loc => ({
            type: "Feature",
            properties: {
              ecosystem: loc.ecosystem,
              country: loc.country
            },
            geometry: structuredClone(loc.position)
          }))
        }
      });

      // Adds a fill to the polygon
      map.addLayer({
        id: "boundary-fill",
        type: "fill",
        source: sourceName,
        paint: {
          "fill-color": "#22c55e",
          "fill-opacity": 0.4
        },
      });

      // Adds an outline to the polygon
      map.addLayer({
        id: "boundary-outline",
        type: "line",
        source: sourceName,
        paint: {
          "line-color": "#16a34a",
          "line-width": 2
        },
      });
    }
  }

  $effect(() => {
    const map = mapInstance;
    if (!map || !locations) return;

    const source = map.getSource("boundaries") as GeoJSONSource | undefined;
    if (source && typeof source.setData === 'function') {
      const validLocations = locations.filter(loc => loc?.position?.type);
      
      source.setData({
        type: "FeatureCollection",
        features: validLocations.map(loc => ({
          type: "Feature",
          properties: { ecosystem: loc.ecosystem, country: loc.country },
          geometry: structuredClone(loc.position)
        }))
      });
    }
  });

  onDestroy(() => {
    if (mapInstance) {
      mapInstance.remove();
    }
  });
</script>

<div class="map-container">
  <Map 
    bind:map={mapInstance} 
    onstyleloaded={drawLocationBoundary}
    center={mapCenter} 
    zoom={6} 
  >
    {#each observations as o (o.id)}
      {#if o.lng !== 0 && o.lat !== 0}
        <MapMarker longitude={o.lng} latitude={o.lat}>
          <MarkerContent>
            <div class="marker-dot" style="background-color: {o.color};"></div>
          </MarkerContent>
          
          <MarkerPopup>
            <div class="popup-content">
              <p class="popup-title">{o.name}</p>
              <p class="popup-value">{o.value} {o.unit}</p>
              <p class="popup-date">{new Date(o.date).toLocaleDateString('pt-BR')}</p>
            </div>
          </MarkerPopup>
        </MapMarker>
      {/if}
    {/each}
  </Map>
</div>

<style>
  .map-container {
    height: 500px; 
    width: 100%; 
    border-radius: 0.375rem;
    overflow: hidden;
    position: relative;
    background-color: #f9fafb;
  }

  .marker-dot {
    width: 16px;
    height: 16px;
    border: 2px solid #ffffff;
    border-radius: 50%;
    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    cursor: pointer;
    transition: transform 0.1s ease-in-out;
  }
  
  .marker-dot:hover {
    transform: scale(1.2);
  }

  .popup-content {
    padding: 0.5rem;
  }

.popup-title {
    font-weight: 600;
    font-size: 0.875rem;
    margin: 0 0 4px 0;
    color: var(--foreground);
  }

  .popup-value {
    font-size: 1.125rem;
    font-weight: 700;
    color: var(--primary);
    margin: 0 0 2px 0;
  }

  .popup-date {
    font-size: 0.75rem;
    color: var(--muted-foreground);
    margin: 0;
  }
</style>
