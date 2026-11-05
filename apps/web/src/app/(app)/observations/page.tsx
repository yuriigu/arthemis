import { Suspense } from "react";
import { ObservationList } from "@/components/ObservationList";
import {
  listIndicators,
  listObservations,
  requireAuthToken,
} from "@/lib/api/server";
import {
  createObservationAction,
  deleteObservationAction,
  updateObservationAction,
} from "../actions";

async function ObservationsContent() {
  const token = await requireAuthToken();
  const [indicators, observations] = await Promise.all([
    listIndicators(token),
    listObservations(token),
  ]);

  return (
    <section className="mx-auto max-w-5xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Observações</h1>
        <p className="mt-1 text-sm text-muted-foreground">Acompanhe observações vinculadas aos indicadores.</p>
      </header>
      <ObservationList
        observations={observations}
        indicators={indicators}
        createAction={createObservationAction}
        updateAction={updateObservationAction}
        deleteAction={deleteObservationAction}
      />
    </section>
  );
}

export default function ObservationsPage() {
  return (
    <Suspense
      fallback={
        <section
          className="mx-auto max-w-5xl space-y-6"
          aria-busy="true"
          aria-label="Carregando observações"
        >
          <div className="h-8 w-48 animate-pulse rounded bg-muted" />
          <div className="h-24 animate-pulse rounded-lg bg-muted" />
          <div className="h-48 animate-pulse rounded-lg bg-muted" />
        </section>
      }
    >
      <ObservationsContent />
    </Suspense>
  );
}
