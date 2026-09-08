import type { Indicator, Location, Observation } from "$lib/types";

export interface ChartDataPoint {
  date: Date;
  [key: string]: number | Date;
};

export interface MapIndicator extends Indicator {
  color: string;
}

export interface MapObservation extends Observation {
  name: string;
  unit: string;
  lng: number;
  lat: number;  
  color: string;
}

export interface ObservationMapProps {
    locations: Location[];
    observations?: MapObservation[];
  }
