import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <main className="flex w-full max-w-2xl flex-col items-center gap-6 text-center">
        <span className="rounded-full bg-sage-green-100 px-3 py-1 text-sm font-medium text-sage-green-700">
          Arthemis
        </span>

        <h1>Plataforma Arthemis</h1>

        <p className="max-w-lg">
          Frontend em Next.js (App Router) com os design tokens do projeto
          legado: paleta <em className="font-serif not-italic text-sage-green-700">sage-green</em>,
          fontes Instrument Sans e Lora e tokens semânticos shadcn.
        </p>

        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <Link
            href="https://nextjs.org/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-6 font-medium text-primary-foreground transition-colors hover:opacity-90"
          >
            Documentação
          </Link>
          <Link
            href="https://nextjs.org/learn"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 items-center justify-center rounded-lg border border-border bg-card px-6 font-medium text-card-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            Aprender Next.js
          </Link>
        </div>

        <small className="mt-4 text-muted-foreground">
          Cliente HTTP pronto em{" "}
          <code className="rounded bg-sage-green-100 px-1.5 py-0.5 text-[0.85em] text-sage-green-800">
            src/lib/api.ts
          </code>
        </small>
      </main>
    </div>
  );
}

