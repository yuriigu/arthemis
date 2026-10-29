import { serverRequest } from "@/lib/api-server";
import {
  getProjectActivity,
  getProjectIndicator,
  getProjectLocation,
  invalidProjectInput,
  projectApiRoute,
  projectMismatch,
  readRequestObject,
  type EntityRouteContext,
} from "@/lib/projects/bff";

export async function PATCH(
  request: Request,
  { params }: EntityRouteContext,
) {
  const { id, entityId } = await params;
  return projectApiRoute(async (token) => {
    const indicator = await getProjectIndicator(entityId, token);
    const currentActivity = await getProjectActivity(indicator.activityId, token);
    if (currentActivity.projectId !== id) throw projectMismatch();
    const body = await readRequestObject(request);
    const activityId = body.activityId ?? indicator.activityId;
    const locationId = body.locationId ?? indicator.locationId;
    if (typeof activityId !== "string" || typeof locationId !== "string") {
      throw invalidProjectInput("Atividade e localização são obrigatórias.");
    }

    const [activity, location] = await Promise.all([
      getProjectActivity(activityId, token),
      getProjectLocation(locationId, token),
    ]);
    if (activity.projectId !== id || location.projectId !== id) {
      throw invalidProjectInput(
        "Atividade ou localização não pertence ao projeto.",
      );
    }
    return serverRequest(`/indicators/${encodeURIComponent(entityId)}`, {
      method: "PATCH",
      body,
      token,
    });
  });
}
