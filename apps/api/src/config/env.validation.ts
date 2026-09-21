import { z } from 'zod';

/**
 * Porta default da API: 8081, mantida por compatibilidade com o gateway
 * Traefik legado (o serviço `brain` era exposto em brain:8081).
 */
const DEFAULT_PORT = 8081;
const DEFAULT_SERVICE_NAME = 'arthemis-api';

/**
 * Validação das variáveis de ambiente executada no boot pelo ConfigModule.
 *
 * O `@nestjs/config` v12 valida via Standard Schema (https://standardschema.dev),
 * por isso o schema abaixo é um ZodObject — e não Joi/class-validator.
 *
 * Se uma variável obrigatória estiver ausente ou inválida a aplicação não sobe
 * (fail-fast) — comportamento herdado do serviço `auth` legado, que encerrava o
 * processo quando o .env não era encontrado.
 */
export const envValidationSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),

  PORT: z.coerce.number().int().min(1).max(65_535).default(DEFAULT_PORT),

  SERVICE_NAME: z.string().trim().min(1).default(DEFAULT_SERVICE_NAME),

  DATABASE_URL: z
    .string({ error: 'DATABASE_URL is required (copy .env.example to .env).' })
    .regex(
      /^postgres(ql)?:\/\//,
      'DATABASE_URL must be a valid postgresql:// connection string.',
    ),
});

