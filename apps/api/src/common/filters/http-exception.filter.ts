import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@arthemis/database';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
        this.logger.error(
          'Unhandled HTTP exception',
          exception instanceof Error ? exception.stack : String(exception),
        );
        response.status(status).json({
          statusCode: status,
          message: 'Internal server error',
        });
        return;
      }

      const body = exception.getResponse();
      response
        .status(status)
        .json(
          typeof body === 'string'
            ? { statusCode: status, message: body }
            : body,
        );
      return;
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      const mappedError = this.mapPrismaError(exception);
      if (mappedError) {
        response.status(mappedError.status).json({
          statusCode: mappedError.status,
          message: mappedError.message,
          error: mappedError.error,
        });
        return;
      }
    }

    this.logger.error(
      'Unhandled exception',
      exception instanceof Error ? exception.stack : String(exception),
    );
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
    });
  }

  private mapPrismaError(exception: Prisma.PrismaClientKnownRequestError) {
    switch (exception.code) {
      case 'P2002':
        return {
          status: HttpStatus.CONFLICT,
          error: 'Conflict',
          message: 'A record with the same unique value already exists',
        };
      case 'P2003':
      case 'P2014':
        return {
          status: HttpStatus.CONFLICT,
          error: 'Conflict',
          message:
            'The record cannot be changed because it is referenced by other records',
        };
      case 'P2025':
        return {
          status: HttpStatus.NOT_FOUND,
          error: 'Not Found',
          message: 'Record not found',
        };
      default:
        return undefined;
    }
  }
}
