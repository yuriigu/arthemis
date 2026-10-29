import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Painel de monitoramento ambiental do Arthemis",
};

export default function DashboardPage() {
  const dataByPeriod = {
    '1M': [
      { date: new Date("2024-03-10"), impacto: 0.5, credito: 0.5 },
      { date: new Date("2024-03-12"), impacto: 0.6, credito: 0.75 },
      { date: new Date("2024-03-14"), impacto: 0.75, credito: 1.1 },
      { date: new Date("2024-03-16"), impacto: 0.9, credito: 1.5 },
      { date: new Date("2024-03-18"), impacto: 1.05, credito: 1.9 },
      { date: new Date("2024-03-20"), impacto: 1.2, credito: 2.2 },
      { date: new Date("2024-03-22"), impacto: 1.4, credito: 2.4 },
      { date: new Date("2024-03-24"), impacto: 1.55, credito: 2.5 },
      { date: new Date("2024-03-26"), impacto: 1.5, credito: 2.1 },
      { date: new Date("2024-03-28"), impacto: 1.6, credito: 1.5 },
      { date: new Date("2024-03-30"), impacto: 1.65, credito: 0.8 },
      { date: new Date("2024-04-01"), impacto: 1.7, credito: 0.55 },
      { date: new Date("2024-04-03"), impacto: 1.85, credito: 0.5 },
      { date: new Date("2024-04-05"), impacto: 2.1, credito: 0.55 },
      { date: new Date("2024-04-07"), impacto: 2.3, credito: 0.6 },
    ],
    '1Y': [
      { date: new Date("2023-01-01"), impacto: 0.4, credito: 0.3 },
      { date: new Date("2023-02-01"), impacto: 0.55, credito: 0.5 },
      { date: new Date("2023-03-01"), impacto: 0.7, credito: 0.9 },
      { date: new Date("2023-04-01"), impacto: 0.9, credito: 1.4 },
      { date: new Date("2023-05-01"), impacto: 1.1, credito: 1.8 },
      { date: new Date("2023-06-01"), impacto: 1.3, credito: 2.1 },
      { date: new Date("2023-07-01"), impacto: 1.5, credito: 2.4 },
      { date: new Date("2023-08-01"), impacto: 1.7, credito: 1.8 },
      { date: new Date("2023-09-01"), impacto: 1.9, credito: 1.2 },
      { date: new Date("2023-10-01"), impacto: 2.1, credito: 0.7 },
      { date: new Date("2023-11-01"), impacto: 2.3, credito: 0.55 },
      { date: new Date("2023-12-01"), impacto: 2.5, credito: 0.6 },
    ],
    All: [
      { date: new Date("2021-01-01"), impacto: 0.3, credito: 0.2 },
      { date: new Date("2022-01-01"), impacto: 0.8, credito: 0.9 },
      { date: new Date("2023-01-01"), impacto: 1.5, credito: 2.0 },
      { date: new Date("2024-01-01"), impacto: 2.3, credito: 0.6 },
    ],
  };
  const data = dataByPeriod['1M'];
  const metrics = [
    { label: 'Impacto Total', value: '7.2', change: '+2%', period: 'no ultimo mes', positive: true },
    { label: 'Crédito Total', value: '1.328', change: '-7%', period: 'no ultimo mes', positive: false },
    { label: 'Projetos Ativos', value: '11', change: '+5', period: 'no ultimo ano', positive: true },
  ];
  const projectSlices = [
    { label: 'Ativos', value: 72, color: '#2563eb' },
    { label: 'Finalizados', value: 28, color: '#a855f7' },
  ];
  const series = [
    { key: 'impacto', label: 'Impacto', color: '#2563eb' },
    { key: 'credito', label: 'Crédito', color: '#a855f7' },
  ];
  return (
    <section className="flex flex-col gap-6">
      <div>
        <p className="mb-2 text-sm font-medium text-foreground/70">Visao geral</p>
        <h1>Dashboard</h1>
      </div>
      <div className="border-b border-border bg-card pb-4">
        <div className="flex items-center gap-4">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {metrics.map((m, i) => (
              <div
                key={i}
                className="rounded-lg border border-border bg-card p-4 min-w-48"
              >
                <p className="text-sm font-medium text-foreground/70 mb-1">{m.label}</p>
                <div className="text-2xl font-bold text-foreground">{m.value}</div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">{m.change}</span>
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    className="transform" style={{ transform: m.positive ? 'rotate(0deg)' : 'rotate(180deg)' }}
                  >
                    <path d="M7 17L17 7M17 7H7M17 7V17" />
                  </svg>
                </div>
                <p className="text-xs text-foreground/60">{m.period}</p>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-colors">
              Adicionar
            </button>
            <button className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-colors">
              Ordenar
            </button>
          </div>
        </div>
      </div>
      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-6 md:p-8">
          <h2 className="text-sm font-medium text-foreground/70 mb-4">Impacto vs Credito</h2>
          <div
            className="h-64 border border-border bg-secondary/20 rounded-lg flex items-center justify-center text-foreground/60"
          >
            Gráfico de linha: Impacto vs Crédito
            (dados simulados - conectar BFF API)
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-6 md:p-8">
          <h2 className="text-sm font-medium text-foreground/70 mb-4">Projetos</h2>
          <div
            className="h-64 border border-border bg-secondary/20 rounded-lg flex items-center justify-center text-foreground/60"
          >
            Gráfico de pizza: Distribuição de projetos
            (dados simulados - conectar BFF API)
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-6 md:p-8">
          <h2 className="text-sm font-medium text-foreground/70 mb-4">Indicadores</h2>
          <p className="text-sm text-foreground/60">
            Cards de indicadores ambientais em desenvolvimento
          </p>
        </div>
      </div>
    </section>
  );
}
