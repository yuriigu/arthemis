import {
  ApiError,
  getProject,
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
}: {
  params: Promise<{ projectId: string }>;
}) {
  const [{ projectId }, token] = await Promise.all([
    params,
    requireAuthToken(),
  ]);
  const [project, observations] = await Promise.all([
    getProjectOrNotFound(projectId, token),
    listProjectObservations(token, projectId),
  ]);

  return <ProjectDetails project={project} observations={observations} />;
}
