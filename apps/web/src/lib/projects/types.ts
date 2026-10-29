import type { Sdg } from "../sdgs/types";

export type { Sdg } from "../sdgs/types";

export type Organization = {
  id: string;
  name: string;
  email: string;
};

export type ProjectOrganization = {
  organizationId: string;
  name: string;
  role: string;
  isPrimary: boolean;
};

export type Project = {
  id: string;
  name: string;
  justification: string;
  lifetimeStart: string;
  lifetimeEnd: string;
  organizationId: string;
  organizations: ProjectOrganization[];
  sdgs: Sdg[];
};

export type PageMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type ProjectPage = {
  data: Project[];
  meta: PageMeta;
};

export type CreateProjectInput = {
  name: string;
  justification: string;
  lifetimeStart: string;
  lifetimeEnd: string;
  organizationId: string;
  organizations: { organizationId: string; role: string }[];
  sdgIds: number[];
};
