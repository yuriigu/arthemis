import { z } from "zod";

export function getTodayCivilDate(): string {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${today.getFullYear()}-${month}-${day}`;
}

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Informe uma data válida.")
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }, "Informe uma data civil válida.");

const longitudeSchema = z.number().min(-180, "Longitude mínima: -180.").max(180, "Longitude máxima: 180.");
const latitudeSchema = z.number().min(-90, "Latitude mínima: -90.").max(90, "Latitude máxima: 90.");
const coordinateSchema = z.tuple([longitudeSchema, latitudeSchema]);
const lineStringCoordinatesSchema = z.array(coordinateSchema).min(2);
const polygonCoordinatesSchema = z.array(lineStringCoordinatesSchema).min(1);
const numericValue = (message: string) =>
  z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? Number.NaN : value),
    z.coerce.number().finite(message),
  );

const geoJsonGeometrySchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("Point"), coordinates: coordinateSchema }),
  z.object({ type: z.literal("LineString"), coordinates: lineStringCoordinatesSchema }),
  z.object({ type: z.literal("Polygon"), coordinates: polygonCoordinatesSchema }),
  z.object({ type: z.literal("MultiPoint"), coordinates: z.array(coordinateSchema).min(1) }),
  z.object({ type: z.literal("MultiLineString"), coordinates: z.array(lineStringCoordinatesSchema).min(1) }),
  z.object({ type: z.literal("MultiPolygon"), coordinates: z.array(polygonCoordinatesSchema).min(1) }),
]);

const geoJsonFeatureSchema = z.object({
  type: z.literal("Feature"),
  geometry: geoJsonGeometrySchema,
  properties: z.record(z.string(), z.json()).nullable(),
});

const geoJsonSchema = z.union([
  geoJsonGeometrySchema,
  geoJsonFeatureSchema,
  z.object({
    type: z.literal("FeatureCollection"),
    features: z.array(geoJsonFeatureSchema),
  }),
]);

const geoJsonTextSchema = z
  .string()
  .trim()
  .min(1, "Informe as coordenadas ou carregue um arquivo GeoJSON.")
  .transform((value, context) => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(value);
    } catch {
      context.addIssue({ code: "custom", message: "O conteúdo precisa ser um JSON válido." });
      return z.NEVER;
    }

    const result = geoJsonSchema.safeParse(parsed);
    if (!result.success) {
      context.addIssue({
        code: "custom",
        message: "Informe uma geometria GeoJSON válida (Point, Polygon ou Feature).",
      });
      return z.NEVER;
    }
    return result.data;
  });

export const activitySchema = z
  .object({
    name: z.string().trim().min(2, "Informe um nome com pelo menos 2 caracteres.").max(100, "Use até 100 caracteres."),
    description: z.string().trim().min(5, "A descrição deve ter pelo menos 5 caracteres."),
    justification: z.string().trim().min(5, "A justificativa deve ter pelo menos 5 caracteres."),
    startDate: dateSchema,
    endDate: dateSchema,
    locationIds: z.array(z.string()).min(1, "Vincule pelo menos uma localidade."),
  })
  .refine((value) => value.startDate <= value.endDate, {
    message: "A data final não pode ser anterior à data inicial.",
    path: ["endDate"],
  });

export const locationSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome da localidade.").max(100, "Use até 100 caracteres."),
  description: z.string().trim(),
  ecosystem: z.string().trim().min(2, "Informe o ecossistema.").max(100, "Use até 100 caracteres."),
  country: z.string().trim().min(2, "Informe o país.").max(100, "Use até 100 caracteres."),
  extent: numericValue("Informe uma área válida.").pipe(z.number().positive("A área deve ser maior que zero.")),
  position: geoJsonTextSchema,
});

export const indicatorSchema = z.object({
  activityId: z.string().min(1, "Selecione uma atividade."),
  locationId: z.string().min(1, "Selecione uma localidade."),
  name: z.string().trim().min(2, "Informe um nome com pelo menos 2 caracteres.").max(100, "Use até 100 caracteres."),
  unit: z.string().trim().min(1, "Informe a unidade de medida.").max(50, "Use até 50 caracteres."),
  valueBaseline: numericValue("Informe um valor-base válido."),
  valueReference: numericValue("Informe um valor de referência válido."),
  observationMethod: z.string().trim().min(10, "Descreva o método de observação (mínimo 10 caracteres)."),
  justification: z.string().trim().min(10, "A justificativa deve ter pelo menos 10 caracteres."),
});

export const observationSchema = z.object({
  indicatorId: z.string().min(1, "Selecione um indicador."),
  value: numericValue("Informe um valor válido."),
  date: dateSchema.refine((value) => value <= getTodayCivilDate(), {
    message: "A data da observação não pode estar no futuro.",
  }),
  position: geoJsonTextSchema,
});

export type ActivityFormData = z.infer<typeof activitySchema>;
export type LocationFormData = z.input<typeof locationSchema>;
export type IndicatorFormData = z.input<typeof indicatorSchema>;
export type ObservationFormData = z.input<typeof observationSchema>;
