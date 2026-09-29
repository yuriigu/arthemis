/**
 * Contratos de usuário do módulo `users`.
 *
 * Herdado de `legacy/brain/internal/models/user.go` (papéis e sanitização de
 * credenciais) e de `legacy/edge/services/auth/models/i_user.go` (credenciais).
 */

/** Papéis de autorização — espelha UserRoleAdmin/Manager/Visitor do Go. */
export const USER_ROLES = ['admin', 'manager', 'visitor'] as const;

export type UserRole = (typeof USER_ROLES)[number];

/** Default do legado (`gorm:"...;default:'visitor'"`). */
export const DEFAULT_USER_ROLE: UserRole = 'visitor';

/**
 * Usuário como está no banco, **incluindo** o `passwordHash`.
 *
 * Uso interno (login/auth): o hash é necessário para o `bcrypt.compare`.
 * Nunca devolver esta estrutura em resposta HTTP.
 */
export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Usuário exposto pela API, sem `passwordHash`.
 *
 * Equivale ao `sanitizeUser` de `legacy/brain/internal/handlers/user.go`, mas
 * a garantia é estrutural: o repositório usa `select` e o hash sequer é lido.
 */
export type PublicUser = Omit<UserRecord, 'passwordHash'>;
