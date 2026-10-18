import type { Metadata } from "next";

import { ProjectsList } from "./projects-list";

export const metadata: Metadata = {
  title: "Projetos",
};

type PageProps = {
  searchParams: Promise<{ search?: string; page?: string }>;
};

export default async function ProjectsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Number(params.page ?? "1");

  return (
    <ProjectsList
      search={params.search ?? ""}
      page={Number.isFinite(page) && page > 0 ? page : 1}
    />
  );
}