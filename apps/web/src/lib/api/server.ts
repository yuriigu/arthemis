import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const apiBaseUrl = (
  process.env.ARTHEMIS_API_URL ??
  process.env.API_URL ??
  "http://localhost:3000/api"
).replace(/\/+$/, "");

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const authCookieName = "arthemis_token";

export async function getAuthToken() {
  return (await cookies()).get(authCookieName)?.value;
}

export async function requireAuthToken() {
  const token = await getAuthToken();
  if (!token) throw new ApiError("Sua sessão expirou. Entre novamente.", 401);
  return token;
}

export function getCurrentTimestamp() {
  return Date.now();
}

export function requiredFormString(formData: FormData, key: string) {
  const value = formData.get(key);
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`O campo "${key}" é obrigatório.`);
  }
  return value.trim();
}

export function requireUuid(value: string, field: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
    throw new Error(`O identificador de ${field} é inválido.`);
  }
  return value;
}

export function formatDate(value: string | Date | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

export interface LoginResponse {
  token: string;
}

export interface Organization {
  id: string;
  name: string;
  email: string;
  projects?: Project[];
}

export type UserRole = "admin" | "manager" | "visitor";

export interface User {
  id: string;
  proponentId: string | null;
  username: string;
  email: string;
  role: UserRole;
  proponent?: Organization | null;
}

export interface Sdg {
  id: string;
  name: string;
  number: number;
  iconUrl: string;
}

export interface Location {
  id: string;
  projectId: string;
  ecosystem: string | null;
  extent: number | null;
  country: string | null;
  position: unknown;
}

export interface Indicator {
  id: string;
  activityId: string;
  locationId: string | null;
  name: string;
  unit: string | null;
  valueBaseline: number | null;
  valueReference: number | null;
  observationMethod: string | null;
  justification: string | null;
}

export interface Observation {
  id: string;
  indicatorId: string;
  value: number;
  date: string;
  position: unknown | null;
  indicator?: Pick<Indicator, "id" | "name" | "unit">;
}

export interface Activity {
  id: string;
  projectId: string;
  name: string;
  description: string | null;
  justification: string | null;
  indicators: Indicator[];
  activityLocations: Array<{ location: Location }>;
}

export interface Project {
  id: string;
  proponentId: string;
  name: string;
  lifetimeStart: string | null;
  lifetimeEnd: string | null;
  justification: string | null;
  proponent?: Organization;
  locations: Location[];
  activities: Activity[];
  projectProponents: Array<{ id: string; projectId: string; proponentId: string; role: string }>;
  projectSdgs: Array<{ sdg: Sdg }>;
}

export interface CreateOrganizationInput {
  name: string;
  email: string;
}

export interface CreateUserInput {
  proponentId: string;
  username: string;
  email: string;
  password?: string;
  role?: UserRole;
}

export interface CreateProjectInput {
  proponentId: string;
  name: string;
  lifetimeStart?: string;
  lifetimeEnd?: string;
  justification?: string;
  sdgIds?: string[];
}

export interface CreateLocationInput {
  projectId: string;
  ecosystem?: string;
  extent?: number;
  country?: string;
  position?: unknown;
}

export interface CreateActivityInput {
  projectId: string;
  name: string;
  description?: string;
  justification?: string;
  locationIds?: string[];
}

export interface CreateIndicatorInput {
  activityId: string;
  locationId?: string;
  name: string;
  unit?: string;
  valueBaseline?: number;
  valueReference?: number;
  observationMethod?: string;
  justification?: string;
}

export interface CreateObservationInput {
  indicatorId: string;
  value: number;
  date: string;
  position?: unknown;
}

export interface CreateSdgInput {
  number: number;
  name: string;
  iconUrl?: string;
}

async function request<T>(
  path: string,
  token?: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${apiBaseUrl}/${path.replace(/^\/+/, "")}`, {
    ...init,
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    if (response.status === 401 && token) {
      redirect("/login?error=session");
    }

    const body = await response.text();
    let message = body || `A API respondeu com status ${response.status}.`;

    try {
      const payload: unknown = JSON.parse(body);
      if (typeof payload === "object" && payload !== null && "message" in payload) {
        const apiMessage = payload.message;
        message = Array.isArray(apiMessage) ? apiMessage.join(" ") : String(apiMessage);
      }
    } catch {
      // Error responses can be plain text.
    }

    throw new ApiError(message, response.status);
  }

  const body = await response.text();
  if (!body) return undefined as T;
  return JSON.parse(body) as T;
}

export function jsonBody(value: unknown) {
  return JSON.stringify(value);
}

function pagination(limit = 100, offset = 0) {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  return params.toString();
}

export function apiRequest<T>(
  path: string,
  token: string,
  init: RequestInit = {},
): Promise<T> {
  return request<T>(path, token, init);
}

export function loginAuthUser(input: {
  username: string;
  password: string;
}): Promise<LoginResponse> {
  return request<LoginResponse>("auth/login", undefined, {
    method: "POST",
    body: jsonBody(input),
  });
}

export function registerAuthUser(input: {
  username: string;
  password: string;
}): Promise<{ id: string; username: string; role: UserRole }> {
  return request("auth/register", undefined, {
    method: "POST",
    body: jsonBody(input),
  });
}

export function listOrganizations(token: string, limit = 100, offset = 0) {
  return request<Organization[]>(`organizations?${pagination(limit, offset)}`, token);
}

export function createOrganization(input: CreateOrganizationInput, token: string) {
  return request<Organization>("organizations/create", token, {
    method: "POST",
    body: jsonBody(input),
  });
}

export function updateOrganization(
  id: string,
  input: Partial<CreateOrganizationInput>,
  token: string,
) {
  return request<Organization>(`organizations/update/${encodeURIComponent(id)}`, token, {
    method: "PATCH",
    body: jsonBody(input),
  });
}

export function deleteOrganization(id: string, token: string) {
  return request<boolean>(`organizations/delete/${encodeURIComponent(id)}`, token, {
    method: "DELETE",
  });
}

export function listUsers(token: string, limit = 100, offset = 0) {
  return request<User[]>(`user?${pagination(limit, offset)}`, token);
}

export function createUser(input: CreateUserInput, token: string) {
  return request<User>("user/create", token, {
    method: "POST",
    body: jsonBody(input),
  });
}

export function updateUser(id: string, input: Partial<CreateUserInput>, token: string) {
  return request<User>(`user/update/${encodeURIComponent(id)}`, token, {
    method: "PATCH",
    body: jsonBody(input),
  });
}

export function deleteUser(id: string, token: string) {
  return request<boolean>(`user/delete/${encodeURIComponent(id)}`, token, {
    method: "DELETE",
  });
}

export function listSdgs(token: string, limit = 100, offset = 0) {
  return request<Sdg[]>(`sdg?${pagination(limit, offset)}`, token);
}

export function createSdg(input: CreateSdgInput, token: string) {
  return request<Sdg>("sdg/create", token, {
    method: "POST",
    body: jsonBody(input),
  });
}

export function getSdg(id: string, token: string) {
  return request<Sdg>(`sdg/${encodeURIComponent(id)}`, token);
}

export function updateSdg(id: string, input: Partial<CreateSdgInput>, token: string) {
  return request<Sdg>(`sdg/${encodeURIComponent(id)}`, token, {
    method: "PATCH",
    body: jsonBody(input),
  });
}

export function deleteSdg(id: string, token: string) {
  return request<boolean>(`sdg/${encodeURIComponent(id)}`, token, {
    method: "DELETE",
  });
}

export function listProjects(token: string, limit = 100, offset = 0) {
  return request<Project[]>(`project?${pagination(limit, offset)}`, token);
}

export function getProject(id: string, token: string) {
  return request<Project>(`project/${encodeURIComponent(id)}`, token);
}

export function createProject(input: CreateProjectInput, token: string) {
  return request<string>("project/create", token, {
    method: "POST",
    body: jsonBody(input),
  });
}

export function updateProject(id: string, input: Partial<CreateProjectInput>, token: string) {
  return request<Project>(`project/update/${encodeURIComponent(id)}`, token, {
    method: "PUT",
    body: jsonBody(input),
  });
}

export function deleteProject(id: string, token: string) {
  return request<boolean>(`project/delete/${encodeURIComponent(id)}`, token, {
    method: "DELETE",
  });
}

export function addProjectProponents(
  projectId: string,
  proponents: Array<{ proponentId: string; role: string }>,
  token: string,
) {
  return request<boolean>(`project/${encodeURIComponent(projectId)}/add_proponent`, token, {
    method: "POST",
    body: jsonBody(proponents),
  });
}

export function removeProjectProponent(projectId: string, proponentId: string, token: string) {
  return request<boolean>(
    `project/${encodeURIComponent(projectId)}/remove_proponent/${encodeURIComponent(proponentId)}`,
    token,
    { method: "DELETE" },
  );
}

export function createLocations(input: CreateLocationInput[], token: string) {
  return request<string[]>("location/create", token, {
    method: "POST",
    body: jsonBody(input),
  });
}

export function getLocation(id: string, token: string) {
  return request<Location>(`location/${encodeURIComponent(id)}`, token);
}

export function updateLocation(
  id: string,
  input: Partial<CreateLocationInput>,
  token: string,
) {
  return request<Location>(`location/update/${encodeURIComponent(id)}`, token, {
    method: "PUT",
    body: jsonBody(input),
  });
}

export function deleteLocation(id: string, token: string) {
  return request<boolean>(`location/delete/${encodeURIComponent(id)}`, token, {
    method: "DELETE",
  });
}

export function createActivities(input: CreateActivityInput[], token: string) {
  return request<string[]>("activity/create", token, {
    method: "POST",
    body: jsonBody(input),
  });
}

export function getActivity(id: string, token: string) {
  return request<Activity>(`activity/${encodeURIComponent(id)}`, token);
}

export function updateActivity(
  id: string,
  input: Partial<CreateActivityInput>,
  token: string,
) {
  return request<Activity>(`activity/update/${encodeURIComponent(id)}`, token, {
    method: "PUT",
    body: jsonBody(input),
  });
}

export function deleteActivity(id: string, token: string) {
  return request<boolean>(`activity/delete/${encodeURIComponent(id)}`, token, {
    method: "DELETE",
  });
}

export function listIndicators(token: string, limit = 100, offset = 0) {
  return request<Indicator[]>(`indicator?${pagination(limit, offset)}`, token);
}

export function listObservations(token: string, limit = 100, offset = 0) {
  return request<Observation[]>(`observation?${pagination(limit, offset)}`, token);
}

export function createObservations(input: CreateObservationInput[], token: string) {
  return request<string[]>("observation/create", token, {
    method: "POST",
    body: jsonBody(input),
  });
}

export function updateObservation(
  id: string,
  input: Partial<CreateObservationInput>,
  token: string,
) {
  return request<Observation>(`observation/update/${encodeURIComponent(id)}`, token, {
    method: "PATCH",
    body: jsonBody(input),
  });
}

export function deleteObservation(id: string, token: string) {
  return request<boolean>(`observation/delete/${encodeURIComponent(id)}`, token, {
    method: "DELETE",
  });
}

export function createIndicators(input: CreateIndicatorInput[], token: string) {
  return request<string[]>("indicator/create", token, {
    method: "POST",
    body: jsonBody(input),
  });
}

export function getIndicator(id: string, token: string) {
  return request<Indicator>(`indicator/${encodeURIComponent(id)}`, token);
}

export function updateIndicator(
  id: string,
  input: Partial<CreateIndicatorInput>,
  token: string,
) {
  return request<Indicator>(`indicator/update/${encodeURIComponent(id)}`, token, {
    method: "PUT",
    body: jsonBody(input),
  });
}

export function deleteIndicator(id: string, token: string) {
  return request<boolean>(`indicator/delete/${encodeURIComponent(id)}`, token, {
    method: "DELETE",
  });
}
