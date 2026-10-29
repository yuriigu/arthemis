import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import type { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import type { Request, Response } from 'express';

interface ApiErrorResponse {
  code: string;
  message: string;
  details: unknown[];
  timestamp: string;
}

@Injectable()
export class GlobalExceptionFilter implements ExceptionFilter<unknown> {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request & { requestId?: string }>();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const errorResponse = this.toErrorResponse(exception, status);

    if (!(exception instanceof HttpException)) {
      this.logger.error(
        JSON.stringify({
          event: 'unhandled_exception',
          requestId: request.requestId ?? 'unknown',
          method: request.method,
          path: request.path,
        }),
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(status).json(errorResponse);
  }

  private toErrorResponse(
    exception: unknown,
    status: number,
  ): ApiErrorResponse {
    if (status === HttpStatus.UNAUTHORIZED) {
      return {
        code: 'UNAUTHORIZED',
        message: 'Unauthorized',
        details: [],
        timestamp: new Date().toISOString(),
      };
    }

    if (!(exception instanceof HttpException)) {
      return {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error',
        details: [],
        timestamp: new Date().toISOString(),
      };
    }

    const body = exception.getResponse();
    const responseBody = isRecord(body) ? body : undefined;
    const responseMessage = responseBody?.message;
    const details = Array.isArray(responseMessage) ? responseMessage : [];
    const message =
      typeof responseMessage === 'string'
        ? responseMessage
        : details.length > 0
          ? 'Validation failed'
          : typeof body === 'string'
            ? body
            : exception.message;
    const statusCode = HttpStatus[status];

    return {
      code:
        typeof responseBody?.code === 'string'
          ? responseBody.code
          : typeof statusCode === 'string'
            ? statusCode
            : 'UNKNOWN',
      message,
      details,
      timestamp: new Date().toISOString(),
    };
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
