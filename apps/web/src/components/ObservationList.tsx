"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import RecordActions from "@/components/RecordActions";
import { ObservationForm } from "@/components/ui/form/ObservationForm";
import type { FormAction } from "@/lib/types";
import styles from "./ObservationList.module.css";

interface ObservationRecord {
  id: string;
  indicatorId: string;
  value: number;
  date: string;
  position: unknown | null;
  indicator?: { id: string; name: string; unit: string | null };
}

interface ObservationIndicator {
  id: string;
  name: string;
  unit: string | null;
}

export function ObservationList({
  observations,
  indicators,
  createAction,
  updateAction,
  deleteAction,
}: {
  observations: ObservationRecord[];
  indicators: ObservationIndicator[];
  createAction: FormAction;
  updateAction: FormAction;
  deleteAction: FormAction;
}) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("pt-BR");
    return observations.filter((item) =>
      [
        item.id,
        item.indicator?.name ?? item.indicatorId,
        item.value,
        item.date,
        JSON.stringify(item.position ?? ""),
      ].some((value) => String(value).toLocaleLowerCase("pt-BR").includes(needle)),
    );
  }, [observations, query]);
  const formIndicators = indicators.map(({ id, name }) => ({ id, name }));

  return (
    <div className={styles.observationList}>
      <section className={styles.createPanel}>
        <h2 className="mb-4 text-lg font-semibold">Cadastrar observação</h2>
        {indicators.length ? (
          <ObservationForm
            indicators={formIndicators}
            action={createAction}
            className="border-0 p-0 shadow-none"
          />
        ) : (
          <p className="text-sm text-muted-foreground">Cadastre um indicador antes de registrar observações.</p>
        )}
      </section>

      <section className={styles.listSection}>
        <div className={styles.filterRow}>
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="min-w-64 flex-1"
            placeholder="Buscar por indicador, valor, data ou posição..."
            aria-label="Buscar observações"
          />
          <span className={styles.resultCount}>
            {filtered.length} de {observations.length} registro(s)
          </span>
        </div>
        {!filtered.length ? (
          <p className={styles.emptyState}>
            {observations.length
              ? "Nenhuma observação encontrada para a busca."
              : "Nenhuma observação cadastrada."}
          </p>
        ) : (
          <div className={styles.recordList}>
            {filtered.map((observation) => {
              const formId = `observation-${observation.id}`;
              return (
                <article key={observation.id} className={styles.recordCard}>
                  <header className={styles.recordHeader}>
                    <div>
                      <h3 className="font-semibold">
                        {observation.indicator?.name ?? `Indicador ${observation.indicatorId}`}
                      </h3>
                      <p className={styles.recordMeta}>
                        {observation.value}
                        {observation.indicator?.unit ? ` ${observation.indicator.unit}` : ""}
                        {" · "}
                        {new Date(`${observation.date.slice(0, 10)}T00:00:00`).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <RecordActions
                      updateFormId={formId}
                      deleteId={observation.id}
                      updateAction={updateAction}
                      deleteAction={deleteAction}
                    />
                  </header>
                  <ObservationForm
                    formId={formId}
                    recordId={observation.id}
                    indicators={formIndicators}
                    data={{
                      indicator_id: observation.indicatorId,
                      value: observation.value,
                      date: observation.date,
                      position: observation.position,
                    }}
                    action={updateAction}
                    submitLabel="Salvar alterações"
                    className="border-0 p-0 shadow-none"
                  />
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
