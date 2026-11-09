"use client";

import { useEffect } from "react";

export default function GlobalError({
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
    <html lang="pt-BR">
      <body>
        <main
          style={{
            minHeight: "100vh",
            display: "grid",
            placeContent: "center",
            gap: "1rem",
            padding: "2rem",
            fontFamily: "system-ui, sans-serif",
            textAlign: "center",
          }}
        >
          <h1>Ocorreu um erro inesperado</h1>
          <p>Não foi possível carregar o Arthemis. Tente novamente.</p>
          <button type="button" onClick={reset} style={{ justifySelf: "center", padding: "0.5rem 1rem" }}>
            Tentar novamente
          </button>
        </main>
      </body>
    </html>
  );
}
