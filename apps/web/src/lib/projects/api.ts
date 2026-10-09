import type {
  CreateProjectInput,
  PageMeta,
  Proponent,
  Project,
  ProjectPage,
  Sdg,
} from "./types";

const SDG_NAMES = [
  "Erradicação da pobreza",
  "Fome zero",
  "Saúde e bem-estar",
  "Educação de qualidade",
  "Igualdade de gênero",
  "Água potável e saneamento",
  "Energia limpa",
  "Trabalho decente e crescimento",
  "Indústria, inovação e infraestrutura",
  "Redução das desigualdades",
  "Cidades e comunidades sustentáveis",
  "Consumo e produção responsáveis",
  "Ação contra a mudança global do clima",
  "Vida na água",
  "Vida terrestre",
  "Paz, justiça e instituições eficazes",
  "Parcerias e meios de implementação",
];

function iconUrl(number: number): string {
  return `https://sdgs.un.org/sites/default/files/goals/E_SDG_Icons-${String(number).padStart(2, "0")}.jpg`;
}

const sdgs: Sdg[] = SDG_NAMES.map((name, index) => ({
  id: index + 1,
  number: index + 1,
  name,
  iconUrl: iconUrl(index + 1),
}));

const proponents: Proponent[] = [
  { id: "p1", name: "Instituto Verde", email: "contato@verde.test" },
  { id: "p2", name: "Cooperativa Rio", email: "contato@rio.test" },
  { id: "p3", name: "Associação Mata", email: "contato@mata.test" },
];

const projects: Project[] = [
  {
    id: "prj-1",
    name: "Restauração da mata ciliar",
    justification: "Recuperar a faixa ciliar do rio principal do município.",
    lifetimeStart: "2026-01-01",
    lifetimeEnd: "2027-12-31",
    proponentId: "p1",
    proponents: [
      { proponentId: "p1", name: "Instituto Verde", role: "Principal", isPrimary: true },
    ],
    sdgs: [sdgs[14], sdgs[5]],
  },
];

export async function listSdgs(): Promise<Sdg[]> {
  return sdgs;
}

export async function listProponents(): Promise<Proponent[]> {
  return proponents;
}

export async function listProjects(query: {
  search?: string;
  page?: number;
  limit?: number;
}): Promise<ProjectPage> {
  const search = query.search?.trim().toLowerCase() ?? "";
  const page = query.page && query.page > 0 ? query.page : 1;
  const limit = query.limit && query.limit > 0 ? query.limit : 6;

  const filtered = projects.filter((project) =>
    project.name.toLowerCase().includes(search),
  );
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * limit;

  const meta: PageMeta = { total, page: safePage, limit, totalPages };
  return { data: filtered.slice(start, start + limit), meta };
}

export async function createProject(input: CreateProjectInput): Promise<Project> {
  const primary = proponents.find((item) => item.id === input.proponentId);
  const selectedSdgs = sdgs.filter((item) => input.sdgIds.includes(item.id));

  const project: Project = {
    id: crypto.randomUUID(),
    name: input.name,
    justification: input.justification,
    lifetimeStart: input.lifetimeStart,
    lifetimeEnd: input.lifetimeEnd,
    proponentId: input.proponentId,
    sdgs: selectedSdgs,
    proponents: [
      {
        proponentId: input.proponentId,
        name: primary?.name ?? "Proponente",
        role: "Principal",
        isPrimary: true,
      },
      ...input.proponents.map((item) => ({
        proponentId: item.proponentId,
        name: proponents.find((proponent) => proponent.id === item.proponentId)?.name ?? "Proponente",
        role: item.role,
        isPrimary: false,
      })),
    ],
  };

  projects.unshift(project);
  return project;
}

export async function deleteProject(id: string): Promise<void> {
  const index = projects.findIndex((project) => project.id === id);
  if (index >= 0) projects.splice(index, 1);
}

export async function getProject(id: string): Promise<Project | null> {
  return projects.find((project) => project.id === id) ?? null;
}