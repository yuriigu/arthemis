import type { PageServerLoad, Actions } from './$types.js';
import { message } from 'sveltekit-superforms/server';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { userLoginSchema } from '$lib/components/ui/form/UserLoginSchema.js';
import { fail, redirect } from '@sveltejs/kit';
import { loginAuthUser } from '$lib/server/arthemis-api.js';

/**
 * Função de carga da página (load).
 * Executada no servidor antes de renderizar a tela de login.
 * Inicializa a validação do formulário com o schema do Zod via sveltekit-superforms.
 *
 * @returns Um objeto contendo a instância vazia do formulário de login validado.
 */
export const load: PageServerLoad = async () => {
	return {
		form: await superValidate(zod4(userLoginSchema))
	};
};

/**
 * Ações de formulário do SvelteKit (Form Actions).
 * Gerencia a requisição POST enviada pelo formulário de Login.
 */
export const actions: Actions = {
	/**
	 * Ação de login padrão (default).
	 * Executa a validação dos campos no servidor e tenta autenticar o usuário.
	 * Se obtiver sucesso, define um cookie HttpOnly e redireciona o usuário para a página principal.
	 */
	default: async (event) => {
		// Valida os dados da submissão com base no schema do Zod (UserLoginSchema)
		const form = await superValidate(event, zod4(userLoginSchema));

		// Retorna erro 400 se houver campos inválidos (ex: e-mail em formato errado, senha curta)
		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			// Tenta autenticar o usuário no serviço de autenticação
			const { token } = await loginAuthUser(form.data);

			// Define o cookie de sessão seguro contendo o token JWT retornado
			event.cookies.set('arthemis_token', token, {
				path: '/', // O cookie fica visível para todas as rotas do app
				httpOnly: true, // Protege o cookie contra acessos via JavaScript (XSS)
				sameSite: 'lax', // Proteção básica contra CSRF
				secure: event.url.protocol === 'https:', // Exige HTTPS em produção
				maxAge: 60 * 60 * 24 // Duração de 1 dia (24 horas) em segundos
			});
		} catch (error: unknown) {
			// Captura falhas de autenticação (usuário não encontrado ou senha errada) e retorna 401
			return message(form, 'Usuário ou senha incorretos. Tente novamente.', { status: 401 });
		}

		// Redireciona o usuário para a raiz do sistema após a autenticação bem-sucedida
		redirect(303, '/');
	}
};
