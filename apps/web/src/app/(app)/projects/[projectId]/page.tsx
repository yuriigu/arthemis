import { Suspense } from "react";
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

async function ProjectDetailContent({
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

export default function ProjectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  return (
    <Suspense
      fallback={
        <section
          className="w-full space-y-6"
          aria-busy="true"
          aria-label="Carregando detalhes do projeto"
        >
          <div className="h-6 w-32 animate-pulse rounded bg-muted" />
          <div className="h-40 animate-pulse rounded-lg bg-muted" />
          <div className="h-96 animate-pulse rounded-lg bg-muted" />
        </section>
      }
    >
      <ProjectDetailContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}