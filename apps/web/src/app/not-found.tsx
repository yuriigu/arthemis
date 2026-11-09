import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-3xl font-semibold">Página não encontrada</h1>
      <p className="text-muted-foreground">O endereço pode estar incorreto ou a página não existe mais.</p>
      <Link href="/" className="font-medium text-primary underline">
        Voltar ao início
      </Link>
    </main>
  );
}
