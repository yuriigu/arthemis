import { z } from 'zod';

export const proponentSchema = z.object({
	name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(150, 'Nome muito longo'),
	email: z.email('E-mail inválido').max(150, 'E-mail muito longo')
});

export type ProponentSchema = typeof proponentSchema;