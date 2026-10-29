import { z } from "zod";

export const createProjectSchema = z
  .object({
    name: z.string().trim().min(1, "Informe o nome"),
    justification: z.string().trim().min(10, "Mínimo de 10 caracteres"),
    lifetimeStart: z.string().min(1, "Informe o início"),
    lifetimeEnd: z.string().min(1, "Informe o fim"),
    organizationId: z.string().min(1, "Escolha a organização principal"),
    organizations: z.array(
      z.object({
        organizationId: z.string().min(1, "Escolha a organização"),
        role: z.string().trim().min(1, "Informe o papel"),
      }),
    ),
    sdgIds: z.array(z.number()).min(1, "Selecione ao menos 1 ODS"),
  })
  .refine((value) => value.lifetimeEnd >= value.lifetimeStart, {
    message: "A data final não pode ser anterior à inicial",
    path: ["lifetimeEnd"],
  });
