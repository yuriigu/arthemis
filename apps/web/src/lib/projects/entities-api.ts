import { api, ApiError } from "@/lib/api";

import type {
  ProjectActivity,
  ProjectIndicator,
  ProjectLocation,
  ProjectObservation,
} from "./entities";

export function entityErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof ApiError)) return fallback;
  if (
    error.body &&
    typeof error.body === "object" &&
    "message" in error.body
  ) {
    const message = error.body.message;
    if (typeof message === "string") return message;
    if (Array.isArray(message) && message.every((item) => typeof item === "string")) {
      return message.join(" ");
    }
  }
  return fallback;
}

function projectPath(projectId: string, entity: string): string {
  return `/projects/${encodeURIComponent(projectId)}/${entity}`;
}

export function listProjectActivities(
  projectId: string,
): Promise<ProjectActivity[]> {
  return api.get(projectPath(projectId, "activities"));
}

export function saveProjectActivity(
  projectId: string,
  activityId: string | undefined,
  body: unknown,
): Promise<ProjectActivity> {
  const path = projectPath(
    projectId,
    `activities${activityId ? `/${encodeURIComponent(activityId)}` : ""}`,
  );
  return activityId
    ? api.patch(path, { body })
    : api.post(path, { body });
}

export function listProjectLocations(
  projectId: string,
): Promise<ProjectLocation[]> {
  return api.get(projectPath(projectId, "locations"));
}

export function saveProjectLocation(
  projectId: string,
  locationId: string | undefined,
  body: unknown,
): Promise<ProjectLocation> {
  const path = projectPath(
    projectId,
    `locations${locationId ? `/${encodeURIComponent(locationId)}` : ""}`,
  );
  return locationId
    ? api.patch(path, { body })
    : api.post(path, { body });
}

export function listProjectIndicators(
  projectId: string,
): Promise<ProjectIndicator[]> {
  return api.get(projectPath(projectId, "indicators"));
}

export function saveProjectIndicator(
  projectId: string,
  indicatorId: string | undefined,
  body: unknown,
): Promise<ProjectIndicator> {
  const path = projectPath(
    projectId,
    `indicators${indicatorId ? `/${encodeURIComponent(indicatorId)}` : ""}`,
  );
  return indicatorId
    ? api.patch(path, { body })
    : api.post(path, { body });
}

export function listProjectObservations(
  projectId: string,
): Promise<ProjectObservation[]> {
  return api.get(projectPath(projectId, "observations"));
}

export function saveProjectObservation(
  projectId: string,
  observationId: string | undefined,
  body: unknown,
): Promise<ProjectObservation> {
  const path = projectPath(
    projectId,
    `observations${observationId ? `/${encodeURIComponent(observationId)}` : ""}`,
  );
  return observationId
    ? api.patch(path, { body })
    : api.post(path, { body });
}
