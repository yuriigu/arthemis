import type { Metadata } from "next";

import { ProjectForm } from "./project-form";

export const metadata: Metadata = {
  title: "Novo projeto",
};

export default function NewProjectPage() {
  return (
    <section className="flex flex-col gap-6">
      <div>
        <p className="text-sm font-medium text-sage-green-700">Projetos</p>
        <h1>Novo projeto</h1>
      </div>
      <ProjectForm />
    </section>
  );
}