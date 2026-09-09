import { z } from 'zod';

export const userLoginSchema = z.object({
	username: z.string().min(1, 'Informe seu usuário').max(150, 'Usuário muito longo'),
	password: z.string().min(1, 'Informe sua senha').max(255, 'Senha muito longa')
});

export type UserLoginSchema = typeof userLoginSchema;
