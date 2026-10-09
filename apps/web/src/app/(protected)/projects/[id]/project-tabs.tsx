"use client";

import { useState } from "react";

import type { ProjectProponent, Sdg } from "@/lib/projects/types";

const TABS = ["Visão Geral", "Atividades", "Localidades", "Indicadores"] as const;

type ProjectTabsProps = {
  justification: string;
  sdgs: Sdg[];
  primary?: ProjectProponent;
  secondary: ProjectProponent[];
};

export function ProjectTabs({ justification, sdgs, primary, secondary }: ProjectTabsProps) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Visão Geral");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {TABS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            className={`rounded-lg px-3 py-2 text-sm ${tab === item ? "bg-primary text-primary-foreground" : "border border-border"}`}
          >
            {item}
          </button>
        ))}
      </div>

      {tab === "Visão Geral" ? (
        <div className="flex flex-col gap-6">
          <p>{justification}</p>
          <div>
            <h2 className="mb-3 text-lg">ODS</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {sdgs.map((sdg) => (
                <article key={sdg.id} className="rounded-lg border border-border p-3">
                  <img src={sdg.iconUrl} alt="" className="mb-2 aspect-square w-full object-cover" />
                  <p className="text-sm">{sdg.number}. {sdg.name}</p>
                </article>
              ))}
            </div>
          </div>
          <div>
            <h2 className="mb-3 text-lg">Proponentes</h2>
            {primary ? <p>Principal: {primary.name} — {primary.role}</p> : null}
            <ul className="mt-2 flex flex-col gap-1">
              {secondary.map((item) => (
                <li key={item.proponentId}>
                  {item.name} — {item.role}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <p className="text-muted-foreground">Em breve.</p>
      )}
    </div>
  );
}