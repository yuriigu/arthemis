import {
  BadRequestException,
  ConflictException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type { ArgumentsHost } from '@nestjs/common';
import { GlobalExceptionFilter } from './global-exception.filter.js';

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;
  let response: {
    status: ReturnType<typeof vi.fn>;
    json: ReturnType<typeof vi.fn>;
  };
  let host: ArgumentsHost;
  const request = {
    method: 'GET',
    path: '/test',
    requestId: 'test-request-id',
  };

  beforeEach(() => {
    vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    filter = new GlobalExceptionFilter();
    response = { status: vi.fn(), json: vi.fn() };
    response.status.mockReturnValue(response);
    host = {
      switchToHttp: () => ({
        getResponse: () => response,
        getRequest: () => request,
      }),
    } as ArgumentsHost;
  });

  it('preserves the status and message of HTTP exceptions', () => {
    filter.catch(new ConflictException('email already registered'), host);

    expect(response.status).toHaveBeenCalledWith(409);
    expect(response.json).toHaveBeenCalledWith({
      code: 'CONFLICT',
      message: 'email already registered',
      details: [],
      timestamp: expect.any(String),
    });
  });

  it('includes validation messages in details', () => {
    filter.catch(
      new BadRequestException({
        message: ['resource not found', 'resource is unavailable'],
        error: 'Bad Request',
        statusCode: 400,
      }),
      host,
    );

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith({
      code: 'BAD_REQUEST',
      message: 'Validation failed',
      details: ['resource not found', 'resource is unavailable'],
      timestamp: expect.any(String),
    });
  });

  it('maps not-found exceptions to the standard error envelope', () => {
    filter.catch(new NotFoundException('organization not found'), host);

    expect(response.status).toHaveBeenCalledWith(404);
    expect(response.json).toHaveBeenCalledWith({
      code: 'NOT_FOUND',
      message: 'organization not found',
      details: [],
      timestamp: expect.any(String),
    });
  });

  it('does not expose unexpected exception details', () => {
    filter.catch(new Error('database connection string'), host);

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.json).toHaveBeenCalledWith({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
      details: [],
      timestamp: expect.any(String),
    });
  });

  it('uses a uniform response for unauthorized errors', () => {
    filter.catch(new UnauthorizedException('custom message'), host);

    expect(response.status).toHaveBeenCalledWith(401);
    expect(response.json).toHaveBeenCalledWith({
      code: 'UNAUTHORIZED',
      message: 'Unauthorized',
      details: [],
      timestamp: expect.any(String),
    });
  });
});
