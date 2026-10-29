import { ServerApiError, serverRequest } from "@/lib/api-server";
import { getAuthToken } from "@/lib/auth/server";

import type { Project } from "./types";

type ApiProject = {
  id: string;
  name: string;
  justification: string | null;
  lifetimeStart: string | null;
  lifetimeEnd: string | null;
  organization: { id: string; name: string };
  organizations: {
    organizationId: string;
    name: string;
    role: string | null;
  }[];
  sdgs: Project["sdgs"];
};

export async function getProject(id: string): Promise<Project | null> {
  const token = await getAuthToken();
  if (!token) return null;

  try {
    const project = await serverRequest<ApiProject>(
      `/projects/${encodeURIComponent(id)}`,
      { token },
    );
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
        ...project.organizations.map((organization) => ({
          organizationId: organization.organizationId,
          name: organization.name,
          role: organization.role ?? "",
          isPrimary: false,
        })),
      ],
      sdgs: project.sdgs,
    };
  } catch (error) {
    if (error instanceof ServerApiError && error.status === 404) return null;
    throw error;
  }
}
