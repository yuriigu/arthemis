import {
  getProject,
  listObservations,
  requireAuthToken,
} from "@/lib/api/server";
import { ProjectDetails } from "./ProjectDetails";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const [{ projectId }, token] = await Promise.all([params, requireAuthToken()]);
  const [project, observations] = await Promise.all([
    getProject(projectId, token),
    listObservations(token),
  ]);

  return <ProjectDetails project={project} observations={observations} />;
}
