import { api } from "@/lib/api";
import { listSdgs as fetchSdgs } from "@/lib/sdgs/api";

import type {
  CreateProjectInput,
  PageMeta,
  Project,
  ProjectPage,
  Sdg,
} from "./types";

type ApiOrganization = {
  id: string;
  name: string;
  email: string;
};

type ApiProject = {
  id: string;
  name: string;
  justification: string | null;
  lifetimeStart: string | null;
  lifetimeEnd: string | null;
  organization: ApiOrganization;
  organizations?: {
    organizationId: string;
    name: string;
    email: string;
    role: string | null;
  }[];
  sdgs: Sdg[];
};

type ApiProjectPage = {
  data: ApiProject[];
  meta: PageMeta;
};

function toProject(project: ApiProject): Project {
  return {
    id: project.id,
    name: project.name,
    justification: project.justification ?? "",
    lifetimeStart: project.lifetimeStart ?? "",
    lifetimeEnd: project.lifetimeEnd ?? "",
    organizationId: project.organization.id,
    organizations: [
      {
        organizationId: project.organization.id,
        name: project.organization.name,
        role: "Principal",
        isPrimary: true,
      },
      ...(project.organizations ?? []).map((organization) => ({
        organizationId: organization.organizationId,
        name: organization.name,
        role: organization.role ?? "",
        isPrimary: false,
      })),
    ],
    sdgs: project.sdgs,
  };
}

export async function listSdgs(): Promise<Sdg[]> {
  return fetchSdgs();
}

export async function listOrganizations(): Promise<
  { id: string; name: string; email: string }[]
> {
  return api.get<{ id: string; name: string; email: string }[]>(
    "/organizations",
  );
}

export async function listProjects(query: {
  search?: string;
  page?: number;
  limit?: number;
}): Promise<ProjectPage> {
  const params = new URLSearchParams({
    page: String(query.page ?? 1),
    limit: String(query.limit ?? 6),
  });
  if (query.search?.trim()) params.set("search", query.search.trim());

  const result = await api.get<ApiProjectPage>(
    `/projects?${params.toString()}`,
  );
  return { data: result.data.map(toProject), meta: result.meta };
}

export async function createProject(
  input: CreateProjectInput,
): Promise<Project> {
  const project = await api.post<ApiProject>("/projects", { body: input });
  return toProject(project);
}

export async function deleteProject(id: string): Promise<void> {
  await api.delete(`/projects/${encodeURIComponent(id)}`);
}
