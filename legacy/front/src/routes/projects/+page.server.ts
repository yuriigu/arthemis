import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { projectSchema } from '$lib/components/ui/form/ProjectFormSchema.js';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad, } from './$types.js';
import { 
    listProponents, 
	listSdgs, 
    createProject, 
	createProjectProponent,
    createLocation, 
    createActivity, 
    createIndicator,
} from '$lib/server/arthemis-api.js';

export const load: PageServerLoad = async (event) => {
	const token = event.locals.token;

	try {
		const proponents = await listProponents(token);
		const sdgs = await listSdgs(token);

		return {
			form: await superValidate(zod4(projectSchema)),
			proponents,
			sdgs
		};
	} catch (error: unknown) {
		return {
			form: await superValidate(zod4(projectSchema)),
			proponents: [],
			sdgs: []
		};
	}
};

export const actions: Actions = {
	default: async (event) => {
		const token = event.locals.token;
		const form = await superValidate(event, zod4(projectSchema));
		const data = form.data;
	
		try {            
            const projectId = await createProject({
                proponentId: Number(data.proponent_id),
                name: data.name,
                justification: data.justification,
                lifetimeStart: data.lifetime_start,
                lifetimeEnd: data.lifetime_end,
				sdgIds: data.project_sdgs.map(id => Number(id))
            }, token);
			
			if (!projectId) throw new Error("Erro ao cadastrar Projeto.");

			if (data.project_proponents.length > 0) {
				const projectProponents = data.project_proponents.map(p => ({
					projectId: projectId,
					proponentId: Number(p.proponent_id),
					role: p.role
				}));

				await createProjectProponent(projectProponents, token);
			}

			const locations = data.locations.map(l => ({
				projectId: projectId,
				ecosystem: l.ecosystem,
				country: l.country,
				extentHa: l.extent_ha,
				position: l.position
			}));
			
			const locationIdMap = new Map<string, number>();
			const locationIds = await createLocation(locations, token);

			if (!locationIds) throw new Error("Erro ao cadastrar Localizações.");

			data.locations.forEach((l, i) => {
				locationIdMap.set(l.id, locationIds[i]);
			})

			const activities = data.activities.map(a => {
				const locationIds = a.location_ids
                    .map(id => locationIdMap.get(id))
					.filter(id => id !== undefined);

				return {
					projectId: projectId,
					name: a.name,
					description: a.description,
					justification: a.justification,
					locationIds: locationIds
				}
			});

			const activityIdMap = new Map<string, number>();
			const activityIds = await createActivity(activities, token);
                
			if (!activityIds) throw new Error("Erro ao cadastrar Atividades.");
			
			data.activities.forEach((a, i) => {
				activityIdMap.set(a.id, activityIds[i]);
			})

			const indicators = data.indicators.map(i => {
				const locationId = locationIdMap.get(i.location_id);
				const activityId = activityIdMap.get(i.activity_id);

				if (!locationId || !activityId) throw new Error("Erro ao cadastrar Indicadores.")

				return {
					projectId: projectId,
					locationId: locationId,
					activityId: activityId,
					name: i.name,
					unit: i.unit,
					valueBaseline: i.value_baseline,
					valueReference: i.value_reference,
					observationMethod: i.observation_method,
					justification: i.justification
				};
			});

            await createIndicator(indicators, token);
		} catch (error: unknown) {
			return fail(500, { form });
		}

		return { form };
	}
};

