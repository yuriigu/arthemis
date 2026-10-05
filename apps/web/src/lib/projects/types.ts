export type Sdg = {
  id: number;
  number: number;
  name: string;
  iconUrl: string;
};

export type Proponent = {
  id: string;
  name: string;
  email: string;
};

export type ProjectProponent = {
  proponentId: string;
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
  proponentId: string;
  proponents: ProjectProponent[];
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
  proponentId: string;
  proponents: { proponentId: string; role: string }[];
  sdgIds: number[];
};