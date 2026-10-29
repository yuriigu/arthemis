import { serverRequest } from "@/lib/api-server";
import {
  listAll,
  projectApiRoute,
  readRequestObject,
  type ProjectRouteContext,
} from "@/lib/projects/bff";

type Location = { id: string; projectId: string };

export async function GET(
  _request: Request,
  { params }: ProjectRouteContext,
) {
  const { id } = await params;
  return projectApiRoute((token) =>
    listAll<Location>(`/locations?projectId=${encodeURIComponent(id)}`, token),
  );
}

export async function POST(
  request: Request,
  { params }: ProjectRouteContext,
) {
  const { id } = await params;
  return projectApiRoute(async (token) => {
    const body = await readRequestObject(request);
    return serverRequest("/locations", {
      method: "POST",
      body: { ...body, projectId: id },
      token,
    });
  }, 201);
}
