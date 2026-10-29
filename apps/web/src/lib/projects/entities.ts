export type ProjectActivity = {
  id: string;
  projectId: string;
  name: string;
  description: string | null;
  justification: string | null;
  startDate: string | null;
  endDate: string | null;
  locationIds: string[];
};

export type ProjectLocation = {
  id: string;
  projectId: string;
  name: string;
  description: string | null;
  ecosystem: string;
  country: string;
  extent: number;
  position: unknown;
};

export type ProjectIndicator = {
  id: string;
  activityId: string;
  locationId: string;
  name: string;
  unit: string | null;
  valueBaseline: number;
  valueReference: number;
  observationMethod: string | null;
  justification: string | null;
};

export type ProjectObservation = {
  id: string;
  indicatorId: string;
  value: number;
  date: string;
  position: unknown;
};
