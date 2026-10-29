import { serverRequest } from "@/lib/api-server";
import {
  getProjectLocation,
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
    const location = await getProjectLocation(entityId, token);
    if (location.projectId !== id) throw projectMismatch();
    const body = await readRequestObject(request);
    return serverRequest(`/locations/${encodeURIComponent(entityId)}`, {
      method: "PATCH",
      body,
      token,
    });
  });
}
