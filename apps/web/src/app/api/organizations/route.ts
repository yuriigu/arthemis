import { NextResponse } from "next/server";

import { ServerApiError, serverRequest } from "@/lib/api-server";
import { getAuthToken } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

type OrganizationsPage = {
  data: unknown[];
  meta: { totalPages: number };
};

function errorResponse(error: unknown): NextResponse {
  if (error instanceof ServerApiError) {
    return NextResponse.json(
      error.body ?? { message: "Não foi possível processar a solicitação." },
      { status: error.status },
    );
  }
  return NextResponse.json({ message: "Erro interno." }, { status: 500 });
}

export async function GET(request: Request): Promise<NextResponse> {
  const token = await getAuthToken();
  if (!token)
    return NextResponse.json(
      { message: "Sessão não encontrada." },
      { status: 401 },
    );

  const search = new URL(request.url).searchParams.get("search")?.trim();

  try {
    const organizations: unknown[] = [];
    let page = 1;
    let totalPages = 1;

    do {
      const params = new URLSearchParams({ page: String(page), limit: "100" });
      if (search) params.set("search", search);

      const result = await serverRequest<OrganizationsPage>(
        `/organizations?${params.toString()}`,
        { token },
      );
      organizations.push(...result.data);
      totalPages = result.meta.totalPages;
      page += 1;
    } while (page <= totalPages);

    return NextResponse.json(organizations);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  const token = await getAuthToken();
  if (!token)
    return NextResponse.json(
      { message: "Sessão não encontrada." },
      { status: 401 },
    );

  try {
    const body: unknown = await request.json();
    const organization = await serverRequest("/organizations", {
      method: "POST",
      body,
      token,
    });
    return NextResponse.json(organization, { status: 201 });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ message: "Corpo inválido." }, { status: 400 });
    }
    return errorResponse(error);
  }
}
