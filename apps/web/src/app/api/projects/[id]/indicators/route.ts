import { serverRequest } from "@/lib/api-server";
import {
  getProjectActivity,
  getProjectLocation,
  invalidProjectInput,
  listAll,
  projectApiRoute,
  readRequestObject,
  type ProjectRouteContext,
} from "@/lib/projects/bff";

type Activity = { id: string; projectId: string };
type Indicator = { id: string; activityId: string; locationId: string };

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
    const indicators = await Promise.all(
      activities.map((activity) =>
        listAll<Indicator>(
          `/indicators?activityId=${encodeURIComponent(activity.id)}`,
          token,
        ),
      ),
    );
    return indicators.flat();
  });
}

export async function POST(
  request: Request,
  { params }: ProjectRouteContext,
) {
  const { id } = await params;
  return projectApiRoute(async (token) => {
    const body = await readRequestObject(request);
    const activityId = body.activityId;
    const locationId = body.locationId;
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

    return serverRequest("/indicators", {
      method: "POST",
      body,
      token,
    });
  }, 201);
}
