"use client";

import { useEffect, useState } from "react";

import { fetchHealthcheck, type HealthCheckResponse } from "@/lib/health";

type LoadState =
  | { kind: "loading" }
  | { kind: "ready"; data: HealthCheckResponse }
  | { kind: "offline" };

export function HealthStatus() {
  const [state, setState] = useState<LoadState>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;

    fetchHealthcheck()
      .then((data) => {
        if (!cancelled) setState({ kind: "ready", data });
      })
      .catch(() => {
        if (!cancelled) setState({ kind: "offline" });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (state.kind === "loading") {
    return (
      <article className="rounded-xl border border-border bg-card p-5">
        <p className="mb-1 text-sm text-muted-foreground">Status da API</p>
        <p className="mb-0 font-medium">Verificando...</p>
      </article>
    );
  }

  if (state.kind === "offline") {
    return (
      <article className="rounded-xl border border-destructive/40 bg-card p-5">
        <p className="mb-1 text-sm text-muted-foreground">Status da API</p>
        <p className="mb-1 font-medium text-destructive">Sem conexão</p>
        <p className="mb-0 text-sm text-muted-foreground">
          Não foi possível alcançar o healthcheck.
        </p>
      </article>
    );
  }

  const ok = state.data.status === "ok";
  const database = state.data.checks.database;

  return (
    <article className="rounded-xl border border-border bg-card p-5">
      <p className="mb-1 text-sm text-muted-foreground">Status da API</p>
      <p className={`mb-2 font-medium ${ok ? "text-sage-green-700" : "text-amber-700"}`}>
        {ok ? "Online" : "Offline"}
      </p>
      <p className="mb-0 text-sm text-muted-foreground">
        Banco: {database.status} — {database.message}
      </p>
    </article>
  );
}