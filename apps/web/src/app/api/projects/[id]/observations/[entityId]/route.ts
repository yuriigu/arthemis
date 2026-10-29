import { serverRequest } from "@/lib/api-server";
import {
  assertProjectIndicator,
  getProjectObservation,
  projectApiRoute,
  invalidProjectInput,
  readRequestObject,
  type EntityRouteContext,
} from "@/lib/projects/bff";

export async function PATCH(
  request: Request,
  { params }: EntityRouteContext,
) {
  const { id, entityId } = await params;
  return projectApiRoute(async (token) => {
    const observation = await getProjectObservation(entityId, token);
    await assertProjectIndicator(id, observation.indicatorId, token);
    const body = await readRequestObject(request);
    if (body.indicatorId !== undefined) {
      if (typeof body.indicatorId !== "string") {
        throw invalidProjectInput("Selecione um indicador.");
      }
      await assertProjectIndicator(id, body.indicatorId, token);
    }
    return serverRequest(`/observations/${encodeURIComponent(entityId)}`, {
      method: "PATCH",
      body,
      token,
    });
  });
}
