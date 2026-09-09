import type { Actions, PageServerLoad } from './$types.js';
import { fail, redirect } from '@sveltejs/kit';
import { listProponents, listUsers, listObservations, listProjects, deleteProject } from '$lib/server/arthemis-api.js';

export const load: PageServerLoad = async ({ locals }) => {
	const token = locals.token;

	const [organizations, users, observations, projects] = await Promise.all([
		listProponents(token),
		listUsers(token),
		listObservations(token),
		listProjects(token)
	]);

	return {
		organizations,
		users,
		observations,
		projects
	};
};

export const actions: Actions = {
	delete: async ({ request, locals }) => {
		const token = locals.token;
		if (!token) {
			return fail(401, { message: 'Não autorizado.' });
		}

		const data = await request.formData();
		const id = data.get('id');

		if (!id || typeof id !== 'string') {
			return fail(400, { message: 'ID do projeto é inválido ou está ausente.' });
		}

		try {
			await deleteProject(id, token);
			return { success: true };
		} catch (error) {
			console.error('Erro ao deletar projeto:', error);
			return fail(500, { 
                message: error instanceof Error ? error.message : 'Falha ao tentar deletar o projeto.' 
            });
		}
	}
};
