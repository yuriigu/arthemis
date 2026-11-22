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
 
export const ProjectStatus = {
  draft: "draft",
  listed: "listed",
  under_validation: "under_validation",
  validated: "validated",
  under_verification: "under_verification",
  verified: "verified",
  expired: "expired",
} as const;

export type ProjectStatus = (typeof ProjectStatus)[keyof typeof ProjectStatus];

export const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  draft: "Rascunho",
  listed: "Listado",
  under_validation: "Em validação",
  validated: "Validado",
  under_verification: "Em verificação",
  verified: "Verificado",
  expired: "Expirado",
};

export const NEXT_STATUS: Record<ProjectStatus, ProjectStatus | null> = {
  draft: "listed",
  listed: "under_validation",
  under_validation: "validated",
  validated: "under_verification",
  under_verification: "verified",
  verified: null,
  expired: null,
};