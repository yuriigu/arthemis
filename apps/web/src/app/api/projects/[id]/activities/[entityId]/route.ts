import { serverRequest } from "@/lib/api-server";
import {
  getProjectActivity,
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
    const activity = await getProjectActivity(entityId, token);
    if (activity.projectId !== id) throw projectMismatch();
    const body = await readRequestObject(request);
    return serverRequest(`/activities/${encodeURIComponent(entityId)}`, {
      method: "PATCH",
      body,
      token,
    });
  });
}
