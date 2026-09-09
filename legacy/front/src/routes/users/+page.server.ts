import type { Actions, PageServerLoad } from './$types.js';
import { fail, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { userSchema } from '$lib/components/ui/form/UserFormSchema.js';
import {
	createBrainUser,
	deleteUser,
	listProponents,
	listUsers,
	registerAuthUser,
	updateUser
} from '$lib/server/arthemis-api.js';

function requiredString(data: FormData, key: string): string {
	const value = data.get(key);
	return typeof value === 'string' ? value.trim() : '';
}

function parseProponentId(value: string): number | null {
	const id = Number(value);
	return Number.isInteger(id) && id > 0 ? id : null;
}

export const load: PageServerLoad = async ({ locals }) => {
	const token = locals.token;

	if (!token) {
		throw redirect(303, '/login');
	}

	const [proponents, users] = await Promise.all([listProponents(token), listUsers(token)]);

	return {
		form: await superValidate(zod4(userSchema)),
		proponents,
		users
	};
};

export const actions: Actions = {
	create: async (event) => {
		const token = event.cookies.get('arthemis_token');

		if (!token) {
			throw redirect(303, '/login');
		}

		const form = await superValidate(event, zod4(userSchema));

		if (!form.valid) {
			return fail(400, { form, message: 'Revise os dados do usuário.' });
		}

		const proponentId = parseProponentId(form.data.proponent_id);
		if (!proponentId) {
			return fail(400, { form, message: 'Organização inválida.' });
		}

		try {
			const authUser = await registerAuthUser({
				username: form.data.username,
				password: form.data.password,
				role: form.data.role
			});

			await createBrainUser({
				id: authUser.sub,
				proponent_id: proponentId,
				username: form.data.username,
				email: form.data.email,
				role: form.data.role,
				token
			});

			return {
				form,
				success: true,
				message: 'Usuário cadastrado com sucesso!'
			};
		} catch (error) {
			return fail(400, {
				form,
				message: error instanceof Error ? error.message : 'Erro ao cadastrar usuário.'
			});
		}
	},

	update: async (event) => {
		const token = event.cookies.get('arthemis_token');

		if (!token) {
			throw redirect(303, '/login');
		}

		const data = await event.request.formData();
		const id = requiredString(data, 'id');
		const proponentId = parseProponentId(requiredString(data, 'proponent_id'));
		const username = requiredString(data, 'username');
		const email = requiredString(data, 'email');
		const role = requiredString(data, 'role') as 'admin' | 'manager' | 'visitor';

		if (
			!id ||
			!proponentId ||
			!username ||
			!email ||
			!['admin', 'manager', 'visitor'].includes(role)
		) {
			return fail(400, { message: 'Revise os dados do usuário antes de atualizar.' });
		}

		try {
			await updateUser(id, { proponentId, username, email, role }, token);
			return { success: true, message: 'Usuário atualizado com sucesso!' };
		} catch (error) {
			return fail(400, {
				message: error instanceof Error ? error.message : 'Erro ao atualizar usuário.'
			});
		}
	},

	delete: async (event) => {
		const token = event.cookies.get('arthemis_token');

		if (!token) {
			throw redirect(303, '/login');
		}

		const data = await event.request.formData();
		const id = requiredString(data, 'id');

		if (!id) {
			return fail(400, { message: 'Usuário inválido.' });
		}

		try {
			await deleteUser(id, token);
			return { success: true, message: 'Usuário excluído com sucesso!' };
		} catch (error) {
			return fail(400, {
				message: error instanceof Error ? error.message : 'Erro ao excluir usuário.'
			});
		}
	}
};
