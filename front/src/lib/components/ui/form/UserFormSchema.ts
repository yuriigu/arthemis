import { z } from 'zod';

export const userSchema = z.object({
	proponent_id: z.string().min(1, 'Selecione uma organização válida'),
	username: z.string().min(1, 'Informe o usuário').max(150, 'Usuário muito longo'),
	email: z.email('E-mail inválido').max(150, 'E-mail muito longo'),
	password: z
		.string()
		.min(8, 'Senha deve ter pelo menos 8 caracteres')
		.max(255, 'Senha muito longa'),
	role: z.enum(['admin', 'manager', 'visitor'])
});

export type UserSchema = typeof userSchema;
