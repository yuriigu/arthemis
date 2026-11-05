import { config } from "dotenv";
import bcrypt from "bcrypt";
import { PrismaPg } from "@prisma/adapter-pg";
import { resolve } from "node:path";
import { PrismaClient } from "../generated/prisma/client";

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
  const password = await bcrypt.hash("admin123", 10);

  await prisma.user.upsert({
    where: { username: "admin" },
    create: {
      username: "admin",
      password,
      role: "admin",
    },
    update: {
      password,
      role: "admin",
    },
  });

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
  ]);

  const sdgs = await Promise.all([
    prisma.sdg.upsert({
      where: { number: 6 },
      create: {
        number: 6,
        name: "Água potável e saneamento",
      },
      update: { name: "Água potável e saneamento" },
    }),
    prisma.sdg.upsert({
      where: { number: 13 },
      create: {
        number: 13,
        name: "Ação contra a mudança global do clima",
      },
      update: { name: "Ação contra a mudança global do clima" },
    }),
    prisma.sdg.upsert({
      where: { number: 14 },
      create: {
        number: 14,
        name: "Vida na água",
      },
      update: { name: "Vida na água" },
    }),
  ]);

  const projectIds = [
    "20000000-0000-4000-8000-000000000001",
    "20000000-0000-4000-8000-000000000002",
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
      },
      update: {
        proponentId: organizations[0].id,
        name: "Rios Vivos da Amazônia",
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
      },
      update: {
        proponentId: organizations[1].id,
        name: "Costa sem Plástico",
      },
    }),
  ]);

  const locations = await Promise.all([
    prisma.location.upsert({
      where: { id: "30000000-0000-4000-8000-000000000001" },
      create: {
        id: "30000000-0000-4000-8000-000000000001",
        projectId: projects[0].id,
        ecosystem: "Floresta tropical",
        extent: 120,
        country: "Brasil",
        position: { lat: -3.119, lng: -60.0217 },
      },
      update: {
        projectId: projects[0].id,
        ecosystem: "Floresta tropical",
        extent: 120,
        country: "Brasil",
        position: { lat: -3.119, lng: -60.0217 },
      },
    }),
    prisma.location.upsert({
      where: { id: "30000000-0000-4000-8000-000000000002" },
      create: {
        id: "30000000-0000-4000-8000-000000000002",
        projectId: projects[1].id,
        ecosystem: "Manguezal",
        extent: 35,
        country: "Brasil",
        position: { lat: -2.5307, lng: -44.3068 },
      },
      update: {
        projectId: projects[1].id,
        ecosystem: "Manguezal",
        extent: 35,
        country: "Brasil",
        position: { lat: -2.5307, lng: -44.3068 },
      },
    }),
  ]);

  const activities = await Promise.all([
    prisma.activity.upsert({
      where: { id: "40000000-0000-4000-8000-000000000001" },
      create: {
        id: "40000000-0000-4000-8000-000000000001",
        projectId: projects[0].id,
        name: "Coleta de amostras de água",
        description: "Coletas mensais em pontos definidos pela comunidade.",
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
      },
      update: {
        projectId: projects[1].id,
        name: "Mutirões de limpeza costeira",
        description: "Ações trimestrais com voluntários e pescadores locais.",
      },
    }),
  ]);

  await Promise.all([
    prisma.activityLocation.upsert({
      where: {
        activityId_locationId: {
          activityId: activities[0].id,
          locationId: locations[0].id,
        },
      },
      create: { activityId: activities[0].id, locationId: locations[0].id },
      update: {},
    }),
    prisma.activityLocation.upsert({
      where: {
        activityId_locationId: {
          activityId: activities[1].id,
          locationId: locations[1].id,
        },
      },
      create: { activityId: activities[1].id, locationId: locations[1].id },
      update: {},
    }),
    ...projects.flatMap((project, index) =>
      sdgs.slice(index, index + 2).map((sdg) =>
        prisma.projectSdg.upsert({
          where: {
            projectId_sdgId: { projectId: project.id, sdgId: sdg.id },
          },
          create: { projectId: project.id, sdgId: sdg.id },
          update: {},
        }),
      ),
    ),
    ...projects.map((project, index) =>
      prisma.projectProponent.upsert({
        where: {
          projectId_proponentId: {
            projectId: project.id,
            proponentId: organizations[index].id,
          },
        },
        create: {
          projectId: project.id,
          proponentId: organizations[index].id,
          role: "Implementadora",
        },
        update: { role: "Implementadora" },
      }),
    ),
  ]);

  await Promise.all([
    prisma.indicator.upsert({
      where: { id: "50000000-0000-4000-8000-000000000001" },
      create: {
        id: "50000000-0000-4000-8000-000000000001",
        activityId: activities[0].id,
        locationId: locations[0].id,
        name: "Turbidez da água",
        unit: "NTU",
        valueBaseline: 18.5,
        valueReference: 12,
        observationMethod: "Turbidímetro portátil",
      },
      update: {
        activityId: activities[0].id,
        locationId: locations[0].id,
        name: "Turbidez da água",
        unit: "NTU",
        valueBaseline: 18.5,
        valueReference: 12,
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
        unit: "kg",
        valueBaseline: 850,
        valueReference: 500,
        observationMethod: "Pesagem ao final de cada mutirão",
      },
      update: {
        activityId: activities[1].id,
        locationId: locations[1].id,
        name: "Resíduos recolhidos",
        unit: "kg",
        valueBaseline: 850,
        valueReference: 500,
        observationMethod: "Pesagem ao final de cada mutirão",
      },
    }),
  ]);

  console.log("Demo seed completed. Login: admin / admin123");
}

seed()
  .catch((error: unknown) => {
    console.error("Demo seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
