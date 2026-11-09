"use client";

import { useEffect } from "react";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="w-full space-y-4 rounded-lg border border-destructive/30 bg-card p-6">
      <h1 className="text-xl font-semibold">Não foi possível carregar esta página</h1>
      <p role="alert" className="text-sm text-muted-foreground">{error.message}</p>
      <button type="button" onClick={reset} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white">
        Tentar novamente
      </button>
    </main>
  );
}
