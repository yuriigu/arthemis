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
 