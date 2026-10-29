import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import type {
  CallHandler,
  ExecutionContext,
  NestInterceptor,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Request, Response } from 'express';
import { catchError, tap, throwError } from 'rxjs';
import type { Observable } from 'rxjs';

type RequestWithId = Request & {
  requestId?: string;
  requestLogged?: boolean;
};

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<RequestWithId>();
    const response = httpContext.getResponse<Response>();
    const requestId = request.requestId ?? randomUUID();
    const startedAt = Date.now();

    request.requestId = requestId;
    response.setHeader('X-Request-Id', requestId);

    const logRequest = (statusCode: number): void => {
      if (request.requestLogged) {
        return;
      }

      request.requestLogged = true;
      this.logger.log(
        JSON.stringify({
          event: 'http_request',
          requestId,
          method: request.method,
          path: request.path,
          statusCode,
          durationMs: Date.now() - startedAt,
        }),
      );
    };

    return next.handle().pipe(
      tap({
        next: () => logRequest(response.statusCode),
      }),
      catchError((error: unknown) => {
        const statusCode =
          error instanceof HttpException
            ? error.getStatus()
            : HttpStatus.INTERNAL_SERVER_ERROR;
        logRequest(statusCode);
        return throwError(() => error);
      }),
    );
  }
}
