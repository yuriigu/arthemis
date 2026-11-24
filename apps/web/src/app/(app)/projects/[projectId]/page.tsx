import {
  ApiError,
  getProject,
  getSession,
  listMonitoringPeriods,
  listProjectObservations,
  requireAuthToken,
} from "@/lib/api/server";
import { ProjectDetails } from "@/features/projects/project-details";
import { notFound } from "next/navigation";

async function getProjectOrNotFound(projectId: string, token: string) {
  try {
    return await getProject(projectId, token);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
}

export default async function ProjectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ projectId }, { error }, token] = await Promise.all([
    params,
    searchParams,
    requireAuthToken(),
  ]);
  const [project, observations, session, periods] = await Promise.all([
    getProjectOrNotFound(projectId, token),
    listProjectObservations(token, projectId),
    getSession(token),
    listMonitoringPeriods(projectId, token),
  ]);

  return (
    <ProjectDetails
      project={project}
      observations={observations}
      role={session.role}
      error={error}
      periods={periods}
    />
  );
}