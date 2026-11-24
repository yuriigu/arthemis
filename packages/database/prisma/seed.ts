import { config } from "dotenv";
import bcrypt from "bcrypt";
import { PrismaPg } from "@prisma/adapter-pg";
import { resolve } from "node:path";
import { PrismaClient } from "../generated/prisma/client";
import {
  Direction,
  IndicatorComponent,
  ProjectStatus,
  UserRole,
} from "../generated/prisma/enums";

config({ path: resolve(process.cwd(), "../../apps/api/.env") });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL must be set to run the demo seed.");
}

if (process.env.NODE_ENV === "production") {
  throw new Error("The demo seed must not run in production.");
}

const prisma = new PrismaClient({ adapter: new PrismaPg(databaseUrl) });

async function seed() {
  const adminPassword = await bcrypt.hash("admin123", 10);
  const managerPassword = await bcrypt.hash("manager123", 10);
  const visitorPassword = await bcrypt.hash("visitor123", 10);

  // Clean up legacy admin username if present
  const legacyAdmin = await prisma.user.findUnique({
    where: { username: "admin" },
  });

  if (legacyAdmin) {
    await prisma.user.update({
      where: { id: legacyAdmin.id },
      data: {
        username: "admin@email.com",
        email: "admin@email.com",
        password: adminPassword,
        role: UserRole.admin,
      },
    });
  }

  // 1. Proponents (Organizações)
  const organizations = await Promise.all([
    prisma.proponent.upsert({
      where: { email: "contato@amazonia-demo.local" },
      create: {
        id: "10000000-0000-4000-8000-000000000001",
        name: "Instituto Amazônia Viva",
        email: "contato@amazonia-demo.local",
      },
      update: { name: "Instituto Amazônia Viva" },
    }),
    prisma.proponent.upsert({
      where: { email: "projetos@oceano-demo.local" },
      create: {
        id: "10000000-0000-4000-8000-000000000002",
        name: "Rede Oceano Limpo",
        email: "projetos@oceano-demo.local",
      },
      update: { name: "Rede Oceano Limpo" },
    }),
    prisma.proponent.upsert({
      where: { email: "contato@cerrado-demo.local" },
      create: {
        id: "10000000-0000-4000-8000-000000000003",
        name: "Fundação Cerrado Sustentável",
        email: "contato@cerrado-demo.local",
      },
      update: { name: "Fundação Cerrado Sustentável" },
    }),
    prisma.proponent.upsert({
      where: { email: "projetos@mataatlantica-demo.local" },
      create: {
        id: "10000000-0000-4000-8000-000000000004",
        name: "Associação Mata Atlântica",
        email: "projetos@mataatlantica-demo.local",
      },
      update: { name: "Associação Mata Atlântica" },
    }),
    prisma.proponent.upsert({
      where: { email: "contato@caatinga-demo.local" },
      create: {
        id: "10000000-0000-4000-8000-000000000005",
        name: "Cooperativa Caatinga Verde",
        email: "contato@caatinga-demo.local",
      },
      update: { name: "Cooperativa Caatinga Verde" },
    }),
  ]);

  // 2. Users (Admin, Manager, Visitor)
  await Promise.all([
    prisma.user.upsert({
      where: { username: "admin@email.com" },
      create: {
        username: "admin@email.com",
        email: "admin@email.com",
        password: adminPassword,
        role: UserRole.admin,
      },
      update: {
        email: "admin@email.com",
        password: adminPassword,
        role: UserRole.admin,
      },
    }),
    prisma.user.upsert({
      where: { username: "manager@email.com" },
      create: {
        username: "manager@email.com",
        email: "manager@email.com",
        password: managerPassword,
        role: UserRole.manager,
        proponentId: organizations[0].id,
      },
      update: {
        email: "manager@email.com",
        password: managerPassword,
        role: UserRole.manager,
        proponentId: organizations[0].id,
      },
    }),
    prisma.user.upsert({
      where: { username: "visitor@email.com" },
      create: {
        username: "visitor@email.com",
        email: "visitor@email.com",
        password: visitorPassword,
        role: UserRole.visitor,
        proponentId: organizations[1].id,
      },
      update: {
        email: "visitor@email.com",
        password: visitorPassword,
        role: UserRole.visitor,
        proponentId: organizations[1].id,
      },
    }),
  ]);

  // 3. SDGs (ODS 1 a 17)
  const sdgs = await Promise.all([
    prisma.sdg.upsert({
      where: { number: 1 },
      create: { number: 1, name: "Erradicação da Pobreza" },
      update: { name: "Erradicação da Pobreza" },
    }),
    prisma.sdg.upsert({
      where: { number: 2 },
      create: { number: 2, name: "Fome Zero e Agricultura Sustentável" },
      update: { name: "Fome Zero e Agricultura Sustentável" },
    }),
    prisma.sdg.upsert({
      where: { number: 3 },
      create: { number: 3, name: "Saúde e Bem-Estar" },
      update: { name: "Saúde e Bem-Estar" },
    }),
    prisma.sdg.upsert({
      where: { number: 4 },
      create: { number: 4, name: "Educação de Qualidade" },
      update: { name: "Educação de Qualidade" },
    }),
    prisma.sdg.upsert({
      where: { number: 5 },
      create: { number: 5, name: "Igualdade de Gênero" },
      update: { name: "Igualdade de Gênero" },
    }),
    prisma.sdg.upsert({
      where: { number: 6 },
      create: { number: 6, name: "Água Potável e Saneamento" },
      update: { name: "Água Potável e Saneamento" },
    }),
    prisma.sdg.upsert({
      where: { number: 7 },
      create: { number: 7, name: "Energia Limpa e Acessível" },
      update: { name: "Energia Limpa e Acessível" },
    }),
    prisma.sdg.upsert({
      where: { number: 8 },
      create: { number: 8, name: "Trabalho Decente e Crescimento Econômico" },
      update: { name: "Trabalho Decente e Crescimento Econômico" },
    }),
    prisma.sdg.upsert({
      where: { number: 9 },
      create: { number: 9, name: "Indústria, Inovação e Infraestrutura" },
      update: { name: "Indústria, Inovação e Infraestrutura" },
    }),
    prisma.sdg.upsert({
      where: { number: 10 },
      create: { number: 10, name: "Redução das Desigualdades" },
      update: { name: "Redução das Desigualdades" },
    }),
    prisma.sdg.upsert({
      where: { number: 11 },
      create: { number: 11, name: "Cidades e Comunidades Sustentáveis" },
      update: { name: "Cidades e Comunidades Sustentáveis" },
    }),
    prisma.sdg.upsert({
      where: { number: 12 },
      create: { number: 12, name: "Consumo e Produção Responsáveis" },
      update: { name: "Consumo e Produção Responsáveis" },
    }),
    prisma.sdg.upsert({
      where: { number: 13 },
      create: { number: 13, name: "Ação Contra a Mudança Global do Clima" },
      update: { name: "Ação Contra a Mudança Global do Clima" },
    }),
    prisma.sdg.upsert({
      where: { number: 14 },
      create: { number: 14, name: "Vida na Água" },
      update: { name: "Vida na Água" },
    }),
    prisma.sdg.upsert({
      where: { number: 15 },
      create: { number: 15, name: "Vida Terrestre" },
      update: { name: "Vida Terrestre" },
    }),
    prisma.sdg.upsert({
      where: { number: 16 },
      create: { number: 16, name: "Paz, Justiça e Instituições Eficazes" },
      update: { name: "Paz, Justiça e Instituições Eficazes" },
    }),
    prisma.sdg.upsert({
      where: { number: 17 },
      create: { number: 17, name: "Parcerias e Meios de Implementação" },
      update: { name: "Parcerias e Meios de Implementação" },
    }),
  ]);

  // 4. Projects (Todos os 7 status: draft, listed, under_validation, validated, under_verification, verified, expired)
  const projectIds = [
    "20000000-0000-4000-8000-000000000001",
    "20000000-0000-4000-8000-000000000002",
    "20000000-0000-4000-8000-000000000003",
    "20000000-0000-4000-8000-000000000004",
    "20000000-0000-4000-8000-000000000005",
    "20000000-0000-4000-8000-000000000006",
    "20000000-0000-4000-8000-000000000007",
  ];

  const projects = await Promise.all([
    prisma.project.upsert({
      where: { id: projectIds[0] },
      create: {
        id: projectIds[0],
        proponentId: organizations[0].id,
        name: "Rios Vivos da Amazônia",
        lifetimeStart: new Date("2025-01-01T00:00:00.000Z"),
        lifetimeEnd: new Date("2028-12-31T00:00:00.000Z"),
        justification:
          "Monitoramento comunitário da qualidade da água em rios amazônicos.",
        status: ProjectStatus.draft,
      },
      update: {
        proponentId: organizations[0].id,
        name: "Rios Vivos da Amazônia",
        status: ProjectStatus.draft,
      },
    }),
    prisma.project.upsert({
      where: { id: projectIds[1] },
      create: {
        id: projectIds[1],
        proponentId: organizations[1].id,
        name: "Costa sem Plástico",
        lifetimeStart: new Date("2025-06-01T00:00:00.000Z"),
        lifetimeEnd: new Date("2027-05-31T00:00:00.000Z"),
        justification:
          "Redução de resíduos plásticos em comunidades costeiras.",
        status: ProjectStatus.listed,
      },
      update: {
        proponentId: organizations[1].id,
        name: "Costa sem Plástico",
        status: ProjectStatus.listed,
      },
    }),
    prisma.project.upsert({
      where: { id: projectIds[2] },
      create: {
        id: projectIds[2],
        proponentId: organizations[2].id,
        name: "Recuperação do Cerrado Central",
        lifetimeStart: new Date("2024-01-01T00:00:00.000Z"),
        lifetimeEnd: new Date("2027-12-31T00:00:00.000Z"),
        justification:
          "Restauração ecológica de nascentes e bacias hidrográficas no bioma Cerrado.",
        status: ProjectStatus.under_validation,
      },
      update: {
        proponentId: organizations[2].id,
        name: "Recuperação do Cerrado Central",
        status: ProjectStatus.under_validation,
      },
    }),
    prisma.project.upsert({
      where: { id: projectIds[3] },
      create: {
        id: projectIds[3],
        proponentId: organizations[3].id,
        name: "Corredores da Mata Atlântica",
        lifetimeStart: new Date("2023-01-01T00:00:00.000Z"),
        lifetimeEnd: new Date("2026-12-31T00:00:00.000Z"),
        justification:
          "Conexão de fragmentos florestais e conservação da biodiversidade da Mata Atlântica.",
        status: ProjectStatus.validated,
      },
      update: {
        proponentId: organizations[3].id,
        name: "Corredores da Mata Atlântica",
        status: ProjectStatus.validated,
      },
    }),
    prisma.project.upsert({
      where: { id: projectIds[4] },
      create: {
        id: projectIds[4],
        proponentId: organizations[0].id,
        name: "Águas do Pantanal",
        lifetimeStart: new Date("2024-06-01T00:00:00.000Z"),
        lifetimeEnd: new Date("2029-05-31T00:00:00.000Z"),
        justification:
          "Proteção de nascentes e monitoramento de áreas úmidas pantaneiras.",
        status: ProjectStatus.under_verification,
      },
      update: {
        proponentId: organizations[0].id,
        name: "Águas do Pantanal",
        status: ProjectStatus.under_verification,
      },
    }),
    prisma.project.upsert({
      where: { id: projectIds[5] },
      create: {
        id: projectIds[5],
        proponentId: organizations[4].id,
        name: "Caatinga Regenerativa",
        lifetimeStart: new Date("2022-01-01T00:00:00.000Z"),
        lifetimeEnd: new Date("2025-12-31T00:00:00.000Z"),
        justification:
          "Sistemas agroflorestais adaptados e combate à desertificação no semiárido.",
        status: ProjectStatus.verified,
      },
      update: {
        proponentId: organizations[4].id,
        name: "Caatinga Regenerativa",
        status: ProjectStatus.verified,
      },
    }),
    prisma.project.upsert({
      where: { id: projectIds[6] },
      create: {
        id: projectIds[6],
        proponentId: organizations[1].id,
        name: "Reflorestamento Piloto Sul",
        lifetimeStart: new Date("2020-01-01T00:00:00.000Z"),
        lifetimeEnd: new Date("2023-12-31T00:00:00.000Z"),
        justification:
          "Projeto piloto de reflorestamento com espécies pioneiras concluído e encerrado.",
        status: ProjectStatus.expired,
      },
      update: {
        proponentId: organizations[1].id,
        name: "Reflorestamento Piloto Sul",
        status: ProjectStatus.expired,
      },
    }),
  ]);

  // 5. Monitoring Periods
  const monitoringPeriods = await Promise.all([
    prisma.monitoringPeriod.upsert({
      where: { id: "30000000-0000-4000-8000-000000000001" },
      create: {
        id: "30000000-0000-4000-8000-000000000001",
        projectId: projectIds[0],
        startDate: new Date("2025-01-01"),
        endDate: new Date("2025-12-31"),
        yearT: 2025,
        verified: false,
      },
      update: {
        startDate: new Date("2025-01-01"),
        endDate: new Date("2025-12-31"),
        yearT: 2025,
        verified: false,
      },
    }),
    prisma.monitoringPeriod.upsert({
      where: { id: "30000000-0000-4000-8000-000000000002" },
      create: {
        id: "30000000-0000-4000-8000-000000000002",
        projectId: projectIds[1],
        startDate: new Date("2025-06-01"),
        endDate: new Date("2026-05-31"),
        yearT: 2025,
        verified: false,
      },
      update: {
        startDate: new Date("2025-06-01"),
        endDate: new Date("2026-05-31"),
        yearT: 2025,
        verified: false,
      },
    }),
    prisma.monitoringPeriod.upsert({
      where: { id: "30000000-0000-4000-8000-000000000003" },
      create: {
        id: "30000000-0000-4000-8000-000000000003",
        projectId: projectIds[2],
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-12-31"),
        yearT: 2024,
        verified: false,
      },
      update: {
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-12-31"),
        yearT: 2024,
        verified: false,
      },
    }),
    prisma.monitoringPeriod.upsert({
      where: { id: "30000000-0000-4000-8000-000000000004" },
      create: {
        id: "30000000-0000-4000-8000-000000000004",
        projectId: projectIds[3],
        startDate: new Date("2023-01-01"),
        endDate: new Date("2023-12-31"),
        yearT: 2023,
        verified: false,
      },
      update: {
        startDate: new Date("2023-01-01"),
        endDate: new Date("2023-12-31"),
        yearT: 2023,
        verified: false,
      },
    }),
    prisma.monitoringPeriod.upsert({
      where: { id: "30000000-0000-4000-8000-000000000005" },
      create: {
        id: "30000000-0000-4000-8000-000000000005",
        projectId: projectIds[4],
        startDate: new Date("2024-06-01"),
        endDate: new Date("2025-05-31"),
        yearT: 2024,
        verified: false,
      },
      update: {
        startDate: new Date("2024-06-01"),
        endDate: new Date("2025-05-31"),
        yearT: 2024,
        verified: false,
      },
    }),
    prisma.monitoringPeriod.upsert({
      where: { id: "30000000-0000-4000-8000-000000000006" },
      create: {
        id: "30000000-0000-4000-8000-000000000006",
        projectId: projectIds[5],
        startDate: new Date("2022-01-01"),
        endDate: new Date("2022-12-31"),
        yearT: 2022,
        verified: true,
      },
      update: {
        startDate: new Date("2022-01-01"),
        endDate: new Date("2022-12-31"),
        yearT: 2022,
        verified: true,
      },
    }),
  ]);

  // 6. CreditResults (Resultados de Crédito de Carbono)
  await Promise.all([
    prisma.creditResult.upsert({
      where: { periodId: monitoringPeriods[0].id },
      create: {
        id: "60000000-0000-4000-8000-000000000001",
        periodId: monitoringPeriods[0].id,
        qhaGross: 12500.5,
        b: 0.15,
        leakage: 0.05,
        nbo: 10000.4,
        nc: 9500,
        buffer: 1900,
        nnc: 7600,
      },
      update: {
        qhaGross: 12500.5,
        b: 0.15,
        leakage: 0.05,
        nbo: 10000.4,
        nc: 9500,
        buffer: 1900,
        nnc: 7600,
      },
    }),
    prisma.creditResult.upsert({
      where: { periodId: monitoringPeriods[5].id },
      create: {
        id: "60000000-0000-4000-8000-000000000002",
        periodId: monitoringPeriods[5].id,
        qhaGross: 25000.0,
        b: 0.1,
        leakage: 0.02,
        nbo: 22000.0,
        nc: 21560,
        buffer: 4312,
        nnc: 17248,
      },
      update: {
        qhaGross: 25000.0,
        b: 0.1,
        leakage: 0.02,
        nbo: 22000.0,
        nc: 21560,
        buffer: 4312,
        nnc: 17248,
      },
    }),
  ]);

  // 7. Locations (Localidades com GeoJSON)
  const locations = await Promise.all([
    prisma.location.upsert({
      where: { id: "30000000-0000-4000-8000-000000000001" },
      create: {
        id: "30000000-0000-4000-8000-000000000001",
        projectId: projects[0].id,
        ecosystem: "Floresta tropical",
        ecosystemCode: "T1.1",
        extent: 120,
        country: "Brasil",
        position: {
          type: "Point",
          coordinates: [-60.0217, -3.119],
        },
      },
      update: {
        projectId: projects[0].id,
        ecosystem: "Floresta tropical",
        ecosystemCode: "T1.1",
        extent: 120,
        country: "Brasil",
        position: {
          type: "Point",
          coordinates: [-60.0217, -3.119],
        },
      },
    }),
    prisma.location.upsert({
      where: { id: "30000000-0000-4000-8000-000000000002" },
      create: {
        id: "30000000-0000-4000-8000-000000000002",
        projectId: projects[1].id,
        ecosystem: "Manguezal",
        ecosystemCode: "MFT1.1",
        extent: 35,
        country: "Brasil",
        position: {
          type: "Point",
          coordinates: [-44.3068, -2.5307],
        },
      },
      update: {
        projectId: projects[1].id,
        ecosystem: "Manguezal",
        ecosystemCode: "MFT1.1",
        extent: 35,
        country: "Brasil",
        position: {
          type: "Point",
          coordinates: [-44.3068, -2.5307],
        },
      },
    }),
    prisma.location.upsert({
      where: { id: "30000000-0000-4000-8000-000000000003" },
      create: {
        id: "30000000-0000-4000-8000-000000000003",
        projectId: projects[2].id,
        ecosystem: "Savana tropical",
        ecosystemCode: "T4.1",
        extent: 200,
        country: "Brasil",
        position: {
          type: "Point",
          coordinates: [-47.9292, -15.7801],
        },
      },
      update: {
        projectId: projects[2].id,
        ecosystem: "Savana tropical",
        ecosystemCode: "T4.1",
        extent: 200,
        country: "Brasil",
        position: {
          type: "Point",
          coordinates: [-47.9292, -15.7801],
        },
      },
    }),
    prisma.location.upsert({
      where: { id: "30000000-0000-4000-8000-000000000004" },
      create: {
        id: "30000000-0000-4000-8000-000000000004",
        projectId: projects[3].id,
        ecosystem: "Mata pluvial subtropical",
        ecosystemCode: "T1.3",
        extent: 80,
        country: "Brasil",
        position: {
          type: "Point",
          coordinates: [-46.6333, -23.5505],
        },
      },
      update: {
        projectId: projects[3].id,
        ecosystem: "Mata pluvial subtropical",
        ecosystemCode: "T1.3",
        extent: 80,
        country: "Brasil",
        position: {
          type: "Point",
          coordinates: [-46.6333, -23.5505],
        },
      },
    }),
    prisma.location.upsert({
      where: { id: "30000000-0000-4000-8000-000000000005" },
      create: {
        id: "30000000-0000-4000-8000-000000000005",
        projectId: projects[4].id,
        ecosystem: "Áreas úmidas continentais",
        ecosystemCode: "TF1.1",
        extent: 350,
        country: "Brasil",
        position: {
          type: "Point",
          coordinates: [-56.0969, -16.2736],
        },
      },
      update: {
        projectId: projects[4].id,
        ecosystem: "Áreas úmidas continentais",
        ecosystemCode: "TF1.1",
        extent: 350,
        country: "Brasil",
        position: {
          type: "Point",
          coordinates: [-56.0969, -16.2736],
        },
      },
    }),
    prisma.location.upsert({
      where: { id: "30000000-0000-4000-8000-000000000006" },
      create: {
        id: "30000000-0000-4000-8000-000000000006",
        projectId: projects[5].id,
        ecosystem: "Caatinga e matas secas",
        ecosystemCode: "T4.4",
        extent: 150,
        country: "Brasil",
        position: {
          type: "Point",
          coordinates: [-40.5096, -9.3891],
        },
      },
      update: {
        projectId: projects[5].id,
        ecosystem: "Caatinga e matas secas",
        ecosystemCode: "T4.4",
        extent: 150,
        country: "Brasil",
        position: {
          type: "Point",
          coordinates: [-40.5096, -9.3891],
        },
      },
    }),
  ]);

  // 8. Activities
  const activities = await Promise.all([
    prisma.activity.upsert({
      where: { id: "40000000-0000-4000-8000-000000000001" },
      create: {
        id: "40000000-0000-4000-8000-000000000001",
        projectId: projects[0].id,
        name: "Coleta de amostras de água",
        description: "Coletas mensais em pontos definidos pela comunidade.",
        justification: "Garantir a amostragem representativa das bacias.",
      },
      update: {
        projectId: projects[0].id,
        name: "Coleta de amostras de água",
        description: "Coletas mensais em pontos definidos pela comunidade.",
      },
    }),
    prisma.activity.upsert({
      where: { id: "40000000-0000-4000-8000-000000000002" },
      create: {
        id: "40000000-0000-4000-8000-000000000002",
        projectId: projects[1].id,
        name: "Mutirões de limpeza costeira",
        description: "Ações trimestrais com voluntários e pescadores locais.",
        justification: "Remoção de resíduos sólidos das praias e manguezais.",
      },
      update: {
        projectId: projects[1].id,
        name: "Mutirões de limpeza costeira",
        description: "Ações trimestrais com voluntários e pescadores locais.",
      },
    }),
    prisma.activity.upsert({
      where: { id: "40000000-0000-4000-8000-000000000003" },
      create: {
        id: "40000000-0000-4000-8000-000000000003",
        projectId: projects[2].id,
        name: "Plantio de mudas nativas do Cerrado",
        description: "Enriquecimento de áreas degradadas com mudas do bioma.",
        justification: "Acelerar a regeneração natural da vegetação.",
      },
      update: {
        projectId: projects[2].id,
        name: "Plantio de mudas nativas do Cerrado",
        description: "Enriquecimento de áreas degradadas com mudas do bioma.",
      },
    }),
    prisma.activity.upsert({
      where: { id: "40000000-0000-4000-8000-000000000004" },
      create: {
        id: "40000000-0000-4000-8000-000000000004",
        projectId: projects[3].id,
        name: "Cercamento e enriquecimento florestal",
        description: "Proteção contra pastoreio e introdução de espécies clímax.",
        justification: "Isolar a área para favorecer a sucessão ecológica.",
      },
      update: {
        projectId: projects[3].id,
        name: "Cercamento e enriquecimento florestal",
        description: "Proteção contra pastoreio e introdução de espécies clímax.",
      },
    }),
    prisma.activity.upsert({
      where: { id: "40000000-0000-4000-8000-000000000005" },
      create: {
        id: "40000000-0000-4000-8000-000000000005",
        projectId: projects[4].id,
        name: "Monitoramento de macrófitas e ictiofauna",
        description: "Avaliação periódica da saúde dos corpos d'água pantaneiros.",
        justification: "Indicador sensível de perturbação ambiental.",
      },
      update: {
        projectId: projects[4].id,
        name: "Monitoramento de macrófitas e ictiofauna",
        description: "Avaliação periódica da saúde dos corpos d'água pantaneiros.",
      },
    }),
    prisma.activity.upsert({
      where: { id: "40000000-0000-4000-8000-000000000006" },
      create: {
        id: "40000000-0000-4000-8000-000000000006",
        projectId: projects[5].id,
        name: "Implantação de SAFs e retenção hídrica",
        description: "Construção de curvas de nível, barraginhas e sistemas agroflorestais.",
        justification: "Reter água no solo e gerar renda sustentável para produtores.",
      },
      update: {
        projectId: projects[5].id,
        name: "Implantação de SAFs e retenção hídrica",
        description: "Construção de curvas de nível, barraginhas e sistemas agroflorestais.",
      },
    }),
  ]);

  // 9. ActivityLocation
  await Promise.all(
    activities.map((activity, index) =>
      prisma.activityLocation.upsert({
        where: {
          activityId_locationId: {
            activityId: activity.id,
            locationId: locations[index].id,
          },
        },
        create: { activityId: activity.id, locationId: locations[index].id },
        update: {},
      }),
    ),
  );

  // 10. ProjectSdg
  await Promise.all(
    projects.flatMap((project, index) =>
      sdgs.slice((index * 2) % sdgs.length, ((index * 2) % sdgs.length) + 3).map((sdg) =>
        prisma.projectSdg.upsert({
          where: {
            projectId_sdgId: { projectId: project.id, sdgId: sdg.id },
          },
          create: { projectId: project.id, sdgId: sdg.id },
          update: {},
        }),
      ),
    ),
  );

  // 11. ProjectProponent
  await Promise.all(
    projects.map((project, index) =>
      prisma.projectProponent.upsert({
        where: {
          projectId_proponentId: {
            projectId: project.id,
            proponentId: project.proponentId,
          },
        },
        create: {
          projectId: project.id,
          proponentId: project.proponentId,
          role: index % 2 === 0 ? "Proponente Principal" : "Implementadora",
        },
        update: {
          role: index % 2 === 0 ? "Proponente Principal" : "Implementadora",
        },
      }),
    ),
  );

  // 12. Indicators
  const indicators = await Promise.all([
    prisma.indicator.upsert({
      where: { id: "50000000-0000-4000-8000-000000000001" },
      create: {
        id: "50000000-0000-4000-8000-000000000001",
        activityId: activities[0].id,
        locationId: locations[0].id,
        name: "Turbidez da água",
        component: IndicatorComponent.composition,
        direction: Direction.decreases_with_condition,
        unit: "NTU",
        valueBaseline: 18.5,
        valueReference: 12,
        threshold: 15,
        referenceSource: "CONAMA 357/2005",
        observationMethod: "Turbidímetro portátil",
      },
      update: {
        activityId: activities[0].id,
        locationId: locations[0].id,
        name: "Turbidez da água",
        component: IndicatorComponent.composition,
        direction: Direction.decreases_with_condition,
        unit: "NTU",
        valueBaseline: 18.5,
        valueReference: 12,
        threshold: 15,
        referenceSource: "CONAMA 357/2005",
        observationMethod: "Turbidímetro portátil",
      },
    }),
    prisma.indicator.upsert({
      where: { id: "50000000-0000-4000-8000-000000000002" },
      create: {
        id: "50000000-0000-4000-8000-000000000002",
        activityId: activities[1].id,
        locationId: locations[1].id,
        name: "Resíduos recolhidos",
        component: IndicatorComponent.structure,
        direction: Direction.increases_with_condition,
        unit: "kg",
        valueBaseline: 850,
        valueReference: 500,
        referenceSource: "Monitoramento comunitário local",
        observationMethod: "Pesagem ao final de cada mutirão",
      },
      update: {
        activityId: activities[1].id,
        locationId: locations[1].id,
        name: "Resíduos recolhidos",
        component: IndicatorComponent.structure,
        direction: Direction.increases_with_condition,
        unit: "kg",
        valueBaseline: 850,
        valueReference: 500,
        referenceSource: "Monitoramento comunitário local",
        observationMethod: "Pesagem ao final de cada mutirão",
      },
    }),
    prisma.indicator.upsert({
      where: { id: "50000000-0000-4000-8000-000000000003" },
      create: {
        id: "50000000-0000-4000-8000-000000000003",
        activityId: activities[2].id,
        locationId: locations[2].id,
        name: "Área sob restauração ativa",
        component: IndicatorComponent.structure,
        direction: Direction.increases_with_condition,
        unit: "ha",
        valueBaseline: 10,
        valueReference: 200,
        referenceSource: "Inventário florestal e sensoriamento",
        observationMethod: "Mapeamento com GPS geodésico",
      },
      update: {
        activityId: activities[2].id,
        locationId: locations[2].id,
        name: "Área sob restauração ativa",
        component: IndicatorComponent.structure,
        direction: Direction.increases_with_condition,
        unit: "ha",
        valueBaseline: 10,
        valueReference: 200,
        referenceSource: "Inventário florestal e sensoriamento",
        observationMethod: "Mapeamento com GPS geodésico",
      },
    }),
    prisma.indicator.upsert({
      where: { id: "50000000-0000-4000-8000-000000000004" },
      create: {
        id: "50000000-0000-4000-8000-000000000004",
        activityId: activities[3].id,
        locationId: locations[3].id,
        name: "Densidade de árvores nativas",
        component: IndicatorComponent.composition,
        direction: Direction.increases_with_condition,
        unit: "ind/ha",
        valueBaseline: 450,
        valueReference: 1200,
        referenceSource: "Protocolo de Monitoramento Pacto Mata Atlântica",
        observationMethod: "Amostragem em parcelas permanentes",
      },
      update: {
        activityId: activities[3].id,
        locationId: locations[3].id,
        name: "Densidade de árvores nativas",
        component: IndicatorComponent.composition,
        direction: Direction.increases_with_condition,
        unit: "ind/ha",
        valueBaseline: 450,
        valueReference: 1200,
        referenceSource: "Protocolo de Monitoramento Pacto Mata Atlântica",
        observationMethod: "Amostragem em parcelas permanentes",
      },
    }),
    prisma.indicator.upsert({
      where: { id: "50000000-0000-4000-8000-000000000005" },
      create: {
        id: "50000000-0000-4000-8000-000000000005",
        activityId: activities[4].id,
        locationId: locations[4].id,
        name: "Índice de Qualidade da Água (IQA)",
        component: IndicatorComponent.composition,
        direction: Direction.increases_with_condition,
        unit: "pontos",
        valueBaseline: 62,
        valueReference: 85,
        referenceSource: "Resolução CONAMA e CETESB",
        observationMethod: "Sonda multiparâmetros in loco",
      },
      update: {
        activityId: activities[4].id,
        locationId: locations[4].id,
        name: "Índice de Qualidade da Água (IQA)",
        component: IndicatorComponent.composition,
        direction: Direction.increases_with_condition,
        unit: "pontos",
        valueBaseline: 62,
        valueReference: 85,
        referenceSource: "Resolução CONAMA e CETESB",
        observationMethod: "Sonda multiparâmetros in loco",
      },
    }),
    prisma.indicator.upsert({
      where: { id: "50000000-0000-4000-8000-000000000006" },
      create: {
        id: "50000000-0000-4000-8000-000000000006",
        activityId: activities[5].id,
        locationId: locations[5].id,
        name: "Biomassa vegetal acima do solo",
        component: IndicatorComponent.structure,
        direction: Direction.increases_with_condition,
        unit: "t/ha",
        valueBaseline: 25,
        valueReference: 65,
        referenceSource: "Equações alométricas para Caatinga",
        observationMethod: "Inventário dendrométrico",
      },
      update: {
        activityId: activities[5].id,
        locationId: locations[5].id,
        name: "Biomassa vegetal acima do solo",
        component: IndicatorComponent.structure,
        direction: Direction.increases_with_condition,
        unit: "t/ha",
        valueBaseline: 25,
        valueReference: 65,
        referenceSource: "Equações alométricas para Caatinga",
        observationMethod: "Inventário dendrométrico",
      },
    }),
  ]);

  // 13. Observations (Observações com valores, datas e posições GeoJSON)
  await Promise.all([
    prisma.observation.upsert({
      where: { id: "70000000-0000-4000-8000-000000000001" },
      create: {
        id: "70000000-0000-4000-8000-000000000001",
        indicatorId: indicators[0].id,
        periodId: monitoringPeriods[0].id,
        value: 16.2,
        date: new Date("2025-03-15"),
        position: {
          type: "Point",
          coordinates: [-60.0217, -3.119],
        },
      },
      update: {
        indicatorId: indicators[0].id,
        periodId: monitoringPeriods[0].id,
        value: 16.2,
        date: new Date("2025-03-15"),
        position: {
          type: "Point",
          coordinates: [-60.0217, -3.119],
        },
      },
    }),
    prisma.observation.upsert({
      where: { id: "70000000-0000-4000-8000-000000000002" },
      create: {
        id: "70000000-0000-4000-8000-000000000002",
        indicatorId: indicators[0].id,
        periodId: monitoringPeriods[0].id,
        value: 14.8,
        date: new Date("2025-06-20"),
        position: {
          type: "Point",
          coordinates: [-60.035, -3.125],
        },
      },
      update: {
        indicatorId: indicators[0].id,
        periodId: monitoringPeriods[0].id,
        value: 14.8,
        date: new Date("2025-06-20"),
        position: {
          type: "Point",
          coordinates: [-60.035, -3.125],
        },
      },
    }),
    prisma.observation.upsert({
      where: { id: "70000000-0000-4000-8000-000000000003" },
      create: {
        id: "70000000-0000-4000-8000-000000000003",
        indicatorId: indicators[0].id,
        periodId: monitoringPeriods[0].id,
        value: 13.1,
        date: new Date("2025-09-10"),
        position: {
          type: "Point",
          coordinates: [-60.012, -3.108],
        },
      },
      update: {
        indicatorId: indicators[0].id,
        periodId: monitoringPeriods[0].id,
        value: 13.1,
        date: new Date("2025-09-10"),
        position: {
          type: "Point",
          coordinates: [-60.012, -3.108],
        },
      },
    }),
    prisma.observation.upsert({
      where: { id: "70000000-0000-4000-8000-000000000004" },
      create: {
        id: "70000000-0000-4000-8000-000000000004",
        indicatorId: indicators[1].id,
        periodId: monitoringPeriods[1].id,
        value: 320,
        date: new Date("2025-07-12"),
        position: {
          type: "Point",
          coordinates: [-44.3068, -2.5307],
        },
      },
      update: {
        indicatorId: indicators[1].id,
        periodId: monitoringPeriods[1].id,
        value: 320,
        date: new Date("2025-07-12"),
        position: {
          type: "Point",
          coordinates: [-44.3068, -2.5307],
        },
      },
    }),
    prisma.observation.upsert({
      where: { id: "70000000-0000-4000-8000-000000000005" },
      create: {
        id: "70000000-0000-4000-8000-000000000005",
        indicatorId: indicators[1].id,
        periodId: monitoringPeriods[1].id,
        value: 410,
        date: new Date("2025-10-05"),
        position: {
          type: "Point",
          coordinates: [-44.298, -2.525],
        },
      },
      update: {
        indicatorId: indicators[1].id,
        periodId: monitoringPeriods[1].id,
        value: 410,
        date: new Date("2025-10-05"),
        position: {
          type: "Point",
          coordinates: [-44.298, -2.525],
        },
      },
    }),
    prisma.observation.upsert({
      where: { id: "70000000-0000-4000-8000-000000000006" },
      create: {
        id: "70000000-0000-4000-8000-000000000006",
        indicatorId: indicators[5].id,
        periodId: monitoringPeriods[5].id,
        value: 48.5,
        date: new Date("2022-06-30"),
        position: {
          type: "Point",
          coordinates: [-40.5096, -9.3891],
        },
      },
      update: {
        indicatorId: indicators[5].id,
        periodId: monitoringPeriods[5].id,
        value: 48.5,
        date: new Date("2022-06-30"),
        position: {
          type: "Point",
          coordinates: [-40.5096, -9.3891],
        },
      },
    }),
    prisma.observation.upsert({
      where: { id: "70000000-0000-4000-8000-000000000007" },
      create: {
        id: "70000000-0000-4000-8000-000000000007",
        indicatorId: indicators[5].id,
        periodId: monitoringPeriods[5].id,
        value: 55.2,
        date: new Date("2022-11-15"),
        position: {
          type: "Point",
          coordinates: [-40.515, -9.395],
        },
      },
      update: {
        indicatorId: indicators[5].id,
        periodId: monitoringPeriods[5].id,
        value: 55.2,
        date: new Date("2022-11-15"),
        position: {
          type: "Point",
          coordinates: [-40.515, -9.395],
        },
      },
    }),
  ]);

  console.log(`Demo seed completed com sucesso!
Usuários disponíveis:
- Administrador: admin@email.com / admin123 (role: admin)
- Gerente:       manager@email.com / manager123 (role: manager)
- Visitante:     visitor@email.com / visitor123 (role: visitor)

Entidades criadas:
- 5 Organizações (Proponent)
- 7 Projetos (Status: draft, listed, under_validation, validated, under_verification, verified, expired)
- 17 Objetivos de Desenvolvimento Sustentável (ODS)
- 6 Períodos de Monitoramento (MonitoringPeriod)
- 2 Resultados de Crédito (CreditResult)
- 6 Localizações com GeoJSON (Location)
- 6 Atividades (Activity)
- 6 Indicadores (Indicator)
- 7 Observações com GeoJSON e períodos (Observation)
`);
}

seed()
  .catch((error: unknown) => {
    console.error("Demo seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
