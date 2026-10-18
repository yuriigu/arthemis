import Link from "next/link";

export default function NotFound() {
  return (
    <section className="flex flex-col gap-3 p-8">
      <h1>Página não encontrada</h1>
      <p>O projeto não existe ou foi removido.</p>
      <Link href="/projects" className="text-sm underline">
        Voltar para projetos
      </Link>
    </section>
  );
}