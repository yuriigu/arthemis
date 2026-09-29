/**
 * Contrato do GET /healthcheck.
 *
 * Espelha o formato definido em `legacy/edge/services/auth/models/i_health.go`
 * (status/service/timestamp/checks.database), incluindo os status HTTP 200
 * (saudável) e 503 (degradado).
 */
export type HealthStatus = 'ok' | 'degraded';

export type HealthCheckStatus = 'up' | 'down';

export interface HealthCheck {
  status: HealthCheckStatus;
  message: string;
}

export interface HealthCheckResponse {
  status: HealthStatus;
  service: string;
  timestamp: string;
  checks: {
    database: HealthCheck;
  };
}

export interface HealthCheckResult {
  /** 200 quando todos os checks estão `up`; 503 quando algum está `down`. */
  statusCode: number;
  body: HealthCheckResponse;
}
