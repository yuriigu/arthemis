import { serverRequest } from "@/lib/api-server";
import {
  assertProjectIndicator,
  invalidProjectInput,
  listAll,
  projectApiRoute,
  readRequestObject,
  type ProjectRouteContext,
} from "@/lib/projects/bff";

type Activity = { id: string; projectId: string };
type Indicator = { id: string; activityId: string; locationId: string };
type Observation = { id: string; indicatorId: string };

export async function GET(
  _request: Request,
  { params }: ProjectRouteContext,
) {
  const { id } = await params;
  return projectApiRoute(async (token) => {
    const activities = await listAll<Activity>(
      `/activities?projectId=${encodeURIComponent(id)}`,
      token,
    );
    const indicators = (
      await Promise.all(
        activities.map((activity) =>
          listAll<Indicator>(
            `/indicators?activityId=${encodeURIComponent(activity.id)}`,
            token,
          ),
        ),
      )
    ).flat();
    const observations = await Promise.all(
      indicators.map((indicator) =>
        listAll<Observation>(
          `/observations?indicatorId=${encodeURIComponent(indicator.id)}`,
          token,
        ),
      ),
    );
    return observations.flat();
  });
}

export async function POST(
  request: Request,
  { params }: ProjectRouteContext,
) {
  const { id } = await params;
  return projectApiRoute(async (token) => {
    const body = await readRequestObject(request);
    if (typeof body.indicatorId !== "string") {
      throw invalidProjectInput("Selecione um indicador.");
    }
    await assertProjectIndicator(id, body.indicatorId, token);

    return serverRequest("/observations", {
      method: "POST",
      body,
      token,
    });
  }, 201);
}
