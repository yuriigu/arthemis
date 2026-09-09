import { z } from 'zod';

const activitySchema = z.object({
   id: z.string(),
   name: z.string().min(2, 'Nome da atividade é obrigatório'),
   description: z.string().min(5, 'Descrição é obrigatória'),
   justification: z.string().min(5, 'Justificativa é obrigatória'),
   location_ids: z.array(z.string()).min(1, 'Vincule pelo menos uma localização')
});

const indicatorSchema = z.object({
   id: z.string(),
   location_id: z.string().min(1, 'Vincule a um local'),
   activity_id: z.string().min(1, 'Vincule a uma atividade'),
   name: z.string().min(2, 'Nome é obrigatório'),
   unit: z.string().min(1, 'Unidade é obrigatória'),
   value_baseline: z.number().default(0),
   value_reference: z.number().default(0),
   observation_method: z.string().min(10, 'Método de observação é obrigatório'),
   justification: z.string().min(10, 'Justificativa é obrigatória')
})

export const locationSchema = z.object({
	id: z.string(),
	ecosystem: z.string().min(2, 'Ecossistema é obrigatório'),
	extent_ha: z.number().min(0.01, 'A extensão deve ser maior que zero'),
	country: z.string().min(2, 'País é obrigatório'),
	position: z.preprocess(
		(value) => {
			if (typeof value === 'string') {
				try { 
					return JSON.parse(value); 
				} catch { 
					return null; 
				}
			}
			return value;
		},
		z.any().refine(
			(value) => {
				if (!value || typeof value !== 'object') return false;
				if (typeof value.type !== 'string') return false;
				if (!Array.isArray(value.coordinates)) return false;
				return true;
			},
			{ message: 'O arquivo deve ser um JSON válido'}
		)
	)
});


export const projectProponentSchema = z.object({
   id: z.string(),
   proponent_id: z.string().min(1, 'Vincule a uma organização'),
   role: z.string().min(5, 'Função é obrigatório')
});

export const projectSchema = z.object({
	// FK para a tabela proponent — uuid do proponente selecionado
	proponent_id: z.string().min(1, 'Selecione uma organização válida'),

	name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(150, 'Nome muito longo'),

	// Objetos Date nativos — convertidos do CalendarDate do RangeCalendar via .toDate()
	lifetime_start: z.date('Data de início é obrigatória'),
	lifetime_end: z.date('Data de término é obrigatória'),

	justification: z.string().min(10, 'Justificativa deve ter pelo menos 10 caracteres'),

	project_proponents: z.array(projectProponentSchema).default([]),
	project_sdgs: z.array(z.string()).default([]),
	locations: z.array(locationSchema).default([]),
	activities: z.array(activitySchema).default([]),
   	indicators: z.array(indicatorSchema).default([])
})
	.refine((data) => data.lifetime_start <= data.lifetime_end, {
			message: 'A data de término não pode ser anterior à data de início',
			path: ['lifetime_end']
	})
	
	.refine((data) => data.project_sdgs.length >= 1, {
		message: 'O projeto deve conter pelo menos um ODS.',
		path: ['project_sdgs']
	})

	.refine((data) => data.locations.length >= 1, {
		message: 'O projeto deve conter pelo menos uma localização.',
		path: ['locations']
	})

	.refine((data) => data.activities.length >= 1, {
		message: 'O projeto deve conter pelo menos uma atividade.',
		path: ['activities']
	})

	.refine((data) => data.indicators.length >= 1, {
		message: 'O projeto deve conter pelo menos um indicador.',
		path: ['indicators']
	})

	.refine(
		(data) => {
			const linkedLocationIds = new Set(data.indicators.map((i) => i.location_id));
			return data.locations.every((loc) => linkedLocationIds.has(loc.id));
		},
		{
			message: 'Cada local cadastrado deve possuir pelo menos um indicador vinculado.',
			path: ['locations']
		}
	)

	.refine(
		(data) => {
			const linkedActivityIds = new Set(data.indicators.map((i) => i.activity_id));
			return data.activities.every((act) => linkedActivityIds.has(act.id));
		},
		{
			message: 'Cada atividade cadastrada deve possuir pelo menos um indicador vinculado.',
			path: ['activities']
		}
	);

export type ProjectSchema = typeof projectSchema;
