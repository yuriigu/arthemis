import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getProject } from "@/lib/projects/api";
import { ProjectTabs } from "./project-tabs";

type PageProps = {
  params: Promise<{ id: string }>;
};

export const metadata: Metadata = {
  title: "Projeto",
};

function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
}

function lifetimeStatus(start: string, end: string): "Futuro" | "Vigente" | "Encerrado" {
  const today = new Date().toISOString().slice(0, 10);
  if (today < start) return "Futuro";
  if (today > end) return "Encerrado";
  return "Vigente";
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  const status = lifetimeStatus(project.lifetimeStart, project.lifetimeEnd);
  const primary = project.proponents.find((item) => item.isPrimary);
  const secondary = project.proponents.filter((item) => !item.isPrimary);

  return (
    <section className="flex flex-col gap-6">
      <Link href="/projects" className="text-sm text-muted-foreground">
        Voltar
      </Link>
      <header className="flex flex-wrap items-center gap-3">
        <h1>{project.name}</h1>
        <span className="rounded-full bg-sage-green-100 px-3 py-1 text-sm">{status}</span>
      </header>
      <p className="text-sm text-muted-foreground">
        {formatDate(project.lifetimeStart)} — {formatDate(project.lifetimeEnd)}
      </p>
      <p>{project.justification}</p>
      <ProjectTabs
        justification={project.justification}
        sdgs={project.sdgs}
        primary={primary}
        secondary={secondary}
      />
    </section>
  );
}