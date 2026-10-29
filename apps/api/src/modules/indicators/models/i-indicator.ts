export interface PublicIndicator {
  id: string;
  activityId: string;
  locationId: string;
  name: string;
  unit: string | null;
  valueBaseline: number;
  valueReference: number;
  observationMethod: string | null;
  justification: string | null;
  createdAt: Date;
  updatedAt: Date;
}
