import type { Actions, PageServerLoad } from './$types.js';
import { fail, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { proponentSchema } from '$lib/components/ui/form/ProponentFormschema.js';
import {
	createProponent,
	deleteProponent,
	listProponents,
	updateProponent
} from '$lib/server/arthemis-api.js';

function requiredString(data: FormData, key: string): string {
	const value = data.get(key);
	return typeof value === 'string' ? value.trim() : '';
}

export const load: PageServerLoad = async ({ cookies }) => {
	const token = cookies.get('arthemis_token');

	if (!token) {
		throw redirect(303, '/login');
	}

	return {
		form: await superValidate(zod4(proponentSchema)),
		organizations: await listProponents(token)
	};
};

export const actions: Actions = {
	create: async (event) => {
		const token = event.locals.token;

		if (!token) {
			throw redirect(303, '/login');
		}

		const form = await superValidate(event, zod4(proponentSchema));

		if (!form.valid) {
			return fail(400, { form, message: 'Revise os dados da organização.' });
		}

		try {
			await createProponent(form.data, token);
			return { form, success: true, message: 'Organização cadastrada com sucesso!' };
		} catch (error: unknown) {
			return fail(500, {
				form,
				message: error instanceof Error ? error.message : 'Erro interno.'
			});
		}
	},

	update: async (event) => {
		const token = event.locals.token;

		if (!token) {
			throw redirect(303, '/login');
		}

		const data = await event.request.formData();
		const id = requiredString(data, 'id');
		const name = requiredString(data, 'name');
		const email = requiredString(data, 'email');

		if (!id || !name || !email) {
			return fail(400, { message: 'Revise os dados da organização antes de atualizar.' });
		}

		try {
			await updateProponent(id, { name, email }, token);
			return { success: true, message: 'Organização atualizada com sucesso!' };
		} catch (error: unknown) {
			return fail(500, {
				message: error instanceof Error ? error.message : 'Erro ao atualizar organização.'
			});
		}
	},

	delete: async (event) => {
		const token = event.locals.token;

		if (!token) {
			throw redirect(303, '/login');
		}

		const data = await event.request.formData();
		const id = requiredString(data, 'id');

		if (!id) {
			return fail(400, { message: 'Organização inválida.' });
		}

		try {
			await deleteProponent(id, token);
			return { success: true, message: 'Organização excluída com sucesso!' };
		} catch (error: unknown) {
			return fail(500, {
				message: error instanceof Error ? error.message : 'Erro ao excluir organização.'
			});
		}

		//return { form };
	}
};
