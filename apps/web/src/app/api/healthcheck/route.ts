import { NextResponse } from "next/server";
import { API_SERVER_BASE_URL } from "@/lib/api-server";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  try {
    const upstream = await fetch(`${API_SERVER_BASE_URL}/healthcheck`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    const body = await upstream.json().catch(() => null);

    return NextResponse.json(body, { status: upstream.status });
  } catch {
    return NextResponse.json(
      {
        status: "degraded",
        service: "arthemis-api",
        timestamp: new Date().toISOString(),
        checks: {
          database: {
            status: "down",
            message: "não foi possível alcançar a API",
          },
        },
      },
      { status: 503 },
    );
  }
}