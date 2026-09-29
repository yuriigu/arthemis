import { API_BASE_URL, ApiError } from "@/lib/api";

export type HealthStatus = "ok" | "degraded";
export type HealthCheckStatus = "up" | "down";

export type HealthCheckResponse = {
  status: HealthStatus;
  service: string;
  timestamp: string;
  checks: {
    database: {
      status: HealthCheckStatus;
      message: string;
    };
  };
};

export async function fetchHealthcheck(): Promise<HealthCheckResponse> {
  const response = await fetch(`${API_BASE_URL}/healthcheck`, {
    method: "GET",
    credentials: "include",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (response.status !== 200 && response.status !== 503) {
    throw new ApiError(
      `Healthcheck falhou: ${response.status}`,
      response.status,
      body,
    );
  }

  return body as HealthCheckResponse;
}