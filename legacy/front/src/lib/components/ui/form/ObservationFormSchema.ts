import { z } from 'zod';

const jsonStringToValueSchema = z.string().transform((value, ctx) => {
	try {
		return JSON.parse(value) as unknown;
	} catch {
		ctx.addIssue({
			code: 'custom',
			message: 'Posição deve ser um JSON válido'
		});

		return z.NEVER;
	}
});

const longitudeSchema = z.number('Longitude deve ser um número').min(-180).max(180);
const latitudeSchema = z.number('Latitude deve ser um número').min(-90).max(90);
const positionCoordinatesSchema = z.tuple([longitudeSchema, latitudeSchema]);
const lineStringCoordinatesSchema = z.array(positionCoordinatesSchema).min(2);
const polygonCoordinatesSchema = z.array(lineStringCoordinatesSchema).min(1);

export const geoJsonPointSchema = z.object({
	type: z.literal('Point'),
	coordinates: positionCoordinatesSchema
});

export const geoJsonLineStringSchema = z.object({
	type: z.literal('LineString'),
	coordinates: lineStringCoordinatesSchema
});

export const geoJsonPolygonSchema = z.object({
	type: z.literal('Polygon'),
	coordinates: polygonCoordinatesSchema
});

export const geoJsonMultiPointSchema = z.object({
	type: z.literal('MultiPoint'),
	coordinates: z.array(positionCoordinatesSchema).min(1)
});

export const geoJsonMultiLineStringSchema = z.object({
	type: z.literal('MultiLineString'),
	coordinates: z.array(lineStringCoordinatesSchema).min(1)
});

export const geoJsonMultiPolygonSchema = z.object({
	type: z.literal('MultiPolygon'),
	coordinates: z.array(polygonCoordinatesSchema).min(1)
});

export const geoJsonGeometrySchema = z.union([
	geoJsonPointSchema,
	geoJsonLineStringSchema,
	geoJsonPolygonSchema,
	geoJsonMultiPointSchema,
	geoJsonMultiLineStringSchema,
	geoJsonMultiPolygonSchema
]);

export const geoJsonPropertiesSchema = z.record(z.string(), z.json()).nullable();

export const geoJsonFeatureSchema = z.object({
	type: z.literal('Feature'),
	geometry: geoJsonGeometrySchema,
	properties: geoJsonPropertiesSchema
});

export const geoJsonFeatureCollectionSchema = z.object({
	type: z.literal('FeatureCollection'),
	features: z.array(geoJsonFeatureSchema)
});

export const geoJsonSchema = z.union([
	geoJsonGeometrySchema,
	geoJsonFeatureSchema,
	geoJsonFeatureCollectionSchema
]);

export const positionSchema = z.union([
	geoJsonSchema,
	jsonStringToValueSchema.pipe(geoJsonSchema)
]);

export const observationSchema = z.object({
	indicator_id: z.string().min(1, 'Selecione um indicador válido'),
	value: z.number('Valor deve ser um número'),
	date: z.date('Data deve ser válida'),
	position: positionSchema
});

export type ObservationSchema = typeof observationSchema;
