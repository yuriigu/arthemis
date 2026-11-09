"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import styles from "./search-results.module.css";

type Category = "all" | "projects" | "organizations" | "users" | "observations";

interface Organization {
  id: string;
  name: string;
  email: string;
}

interface Project {
  id: string;
  name: string;
  lifetimeStart: string | null;
  lifetimeEnd: string | null;
}

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  organization: string;
}

interface Observation {
  id: string;
  indicatorId: string;
  value: number;
  date: string;
  indicator?: { name: string; unit: string | null };
}

const categories: Array<{ key: Category; label: string }> = [
  { key: "all", label: "Tudo" },
  { key: "projects", label: "Projetos" },
  { key: "organizations", label: "Organizações" },
  { key: "users", label: "Usuários" },
  { key: "observations", label: "Observações" },
];

interface SearchResultCounts {
  projects: number;
  organizations: number;
  users: number;
  observations: number;
}

export function SearchResults({
  organizations,
  projects,
  users,
  observations,
}: {
  organizations: Organization[];
  projects: Project[];
  users: User[];
  observations: Observation[];
}) {
  const [category, setCategory] = useState<Category>("all");
  const [query, setQuery] = useState("");
  const needle = query.trim().toLocaleLowerCase("pt-BR");
  const filtered = useMemo(() => ({
    organizations: organizations.filter((item) =>
      [item.id, item.name, item.email].some((value) => value.toLocaleLowerCase("pt-BR").includes(needle)),
    ),
    projects: projects.filter((item) =>
      [item.id, item.name].some((value) => value.toLocaleLowerCase("pt-BR").includes(needle)),
    ),
    users: users.filter((item) =>
      [item.id, item.username, item.email, item.role, item.organization]
        .some((value) => value.toLocaleLowerCase("pt-BR").includes(needle)),
    ),
    observations: observations.filter((item) =>
      [
        item.id,
        item.indicatorId,
        item.indicator?.name ?? "",
        item.value,
        item.date,
      ].some((value) => String(value).toLocaleLowerCase("pt-BR").includes(needle)),
    ),
  }), [needle, organizations, projects, users, observations]);

  const showProjects = category === "all" || category === "projects";
  const showOrganizations = category === "all" || category === "organizations";
  const showUsers = category === "all" || category === "users";
  const showObservations = category === "all" || category === "observations";
  const counts: SearchResultCounts = {
    projects: filtered.projects.length,
    organizations: filtered.organizations.length,
    users: filtered.users.length,
    observations: filtered.observations.length,
  };
  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
  const visibleCount = category === "all" ? total : counts[category];

  return (
    <div className={styles.searchResults}>
      <section className={styles.searchPanel}>
        <label className={styles.searchInputWrap}>
          <Search className={styles.searchIcon} aria-hidden="true" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Digite para buscar em tudo (nome, ID, e-mail, valores, datas...)"
            aria-label="Buscar"
            className={styles.searchInput}
          />
        </label>
      <nav aria-label="Categorias da busca" className={styles.tabs}>
        {categories.map((item) => (
          <button
            type="button"
            key={item.key}
            onClick={() => setCategory(item.key)}
            aria-pressed={category === item.key}
            className={styles.tab}
            data-active={category === item.key}
          >
            {item.label} ({item.key === "all" ? total : counts[item.key]})
          </button>
        ))}
      </nav>
      </section>
      {visibleCount === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyTitle}>Nenhum resultado encontrado</p>
          <p className={styles.emptyDescription}>Tente digitar outras palavras-chave ou IDs na barra de busca.</p>
        </div>
      ) : <div className={styles.resultsContainer}>
      {showProjects && <section className={styles.resultPanel}>
        <header className={styles.panelHeader}><h2>Projetos</h2><span className={styles.countBadge}>{filtered.projects.length}</span></header>
        {filtered.projects.length ? <ul className="divide-y divide-border">
          {filtered.projects.map((project) => <li key={project.id} className="py-3">
            <Link href={`/projects/${project.id}`} className="font-medium text-primary hover:underline">{project.name}</Link>
            <span className="ml-2 text-xs text-muted-foreground">{project.id}</span>
          </li>)}
        </ul> : <p className="text-sm text-muted-foreground">Nenhum projeto encontrado.</p>}
      </section>}
      {showOrganizations && <section className={styles.resultPanel}>
        <header className={styles.panelHeader}><h2>Organizações</h2><span className={styles.countBadge}>{filtered.organizations.length}</span></header>
        {filtered.organizations.length ? <ul className="divide-y divide-border">
          {filtered.organizations.map((item) => <li key={item.id} className="py-3">
            <strong>{item.name}</strong><span className="ml-2 text-sm text-muted-foreground">{item.email}</span>
          </li>)}
        </ul> : <p className="text-sm text-muted-foreground">Nenhuma organização encontrada.</p>}
      </section>}
      {showUsers && <section className={styles.resultPanel}>
        <header className={styles.panelHeader}><h2>Usuários</h2><span className={styles.countBadge}>{filtered.users.length}</span></header>
        {filtered.users.length ? <ul className="divide-y divide-border">
          {filtered.users.map((item) => <li key={item.id} className="py-3">
            <strong>{item.username}</strong><span className="ml-2 text-sm text-muted-foreground">{item.email} · {item.organization || "Sem organização"}</span>
          </li>)}
        </ul> : <p className="text-sm text-muted-foreground">Nenhum usuário encontrado.</p>}
      </section>}
      {showObservations && <section className={styles.resultPanel}>
        <header className={styles.panelHeader}><h2>Observações</h2><span className={styles.countBadge}>{filtered.observations.length}</span></header>
        {filtered.observations.length ? <ul className="divide-y divide-border">
          {filtered.observations.map((item) => <li key={item.id} className="py-3">
            <strong>{item.indicator?.name ?? `Indicador ${item.indicatorId}`}</strong>
            <span className="ml-2 text-sm text-muted-foreground">
              {item.value}{item.indicator?.unit ? ` ${item.indicator.unit}` : ""}
              {" · "}
              {new Date(`${item.date.slice(0, 10)}T00:00:00`).toLocaleDateString("pt-BR")}
            </span>
          </li>)}
        </ul> : <p className="text-sm text-muted-foreground">Nenhuma observação encontrada.</p>}
      </section>}
      </div>}
    </div>
  );
}
