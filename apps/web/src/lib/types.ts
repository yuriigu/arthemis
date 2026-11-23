export type FormAction =
  | string
  | ((formData: FormData) => void | Promise<void>)
  | undefined;

export interface ProjectActionState {
  error: string | null;
}

export type ProjectFormAction = (
  previousState: ProjectActionState,
  formData: FormData,
) => Promise<ProjectActionState>;
 
export interface MonitoringPeriod {
  id: string;
  projectId: string;
  startDate: string;
  endDate: string;
  yearT: number;
  verified: boolean;
}