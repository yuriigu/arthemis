export interface MapLocation {
  position?: unknown;
  ecosystem?: string | null;
  country?: string | null;
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
