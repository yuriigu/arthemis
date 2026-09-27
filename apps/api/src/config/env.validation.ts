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

  // Segredo do JWT (HS256) usado no login e na validação do Bearer token.
  // Obrigatório e sem default de propósito: o auth legado abortava o boot
  // quando `JWT_TOKEN` faltava (fail-fast) e um segredo fraco/desperdiçado
  // permitiria forjar tokens. Gere um com: openssl rand -base64 48
  JWT_SECRET: z
    .string({
      error: 'JWT_SECRET is required (copy .env.example to .env).',
    })
    .min(
      32,
      'JWT_SECRET must be at least 32 characters long (openssl rand -base64 48).',
    ),

  // Validade do access_token. Default 24h: mesma janela do `exp` fixo
  // (time.Now().Add(24 * time.Hour)) do login legado.
  JWT_EXPIRES_IN: z
    .string({ error: 'JWT_EXPIRES_IN must be a string such as 24h or 7d.' })
    .trim()
    .min(1, 'JWT_EXPIRES_IN must not be empty.')
    .default('24h'),
});
