import { Logger, UnauthorizedException } from '@nestjs/common';
import type { CallHandler, ExecutionContext } from '@nestjs/common';
import type { Request, Response } from 'express';
import { lastValueFrom, of, throwError } from 'rxjs';
import { LoggingInterceptor } from './logging.interceptor.js';

describe('LoggingInterceptor', () => {
  let interceptor: LoggingInterceptor;
  let request: Request & { requestId?: string; requestLogged?: boolean };
  let response: Pick<Response, 'setHeader' | 'statusCode'>;
  let context: ExecutionContext;

  beforeEach(() => {
    vi.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    interceptor = new LoggingInterceptor();
    request = { method: 'GET', path: '/test' } as Request & {
      requestId?: string;
      requestLogged?: boolean;
    };
    response = { setHeader: vi.fn(), statusCode: 200 };
    context = {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => response,
      }),
    } as ExecutionContext;
  });

  it('sets a request ID and logs successful requests with it', async () => {
    const handler = { handle: () => of({ ok: true }) } as CallHandler;

    await expect(
      lastValueFrom(interceptor.intercept(context, handler)),
    ).resolves.toEqual({ ok: true });

    expect(request.requestId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(response.setHeader).toHaveBeenCalledWith(
      'X-Request-Id',
      request.requestId,
    );
    expect(Logger.prototype.log).toHaveBeenCalledWith(
      expect.stringContaining(`"requestId":"${request.requestId}"`),
    );
  });

  it('logs the HTTP status when a handler throws', async () => {
    const handler = {
      handle: () => throwError(() => new UnauthorizedException()),
    } as CallHandler;

    await expect(
      lastValueFrom(interceptor.intercept(context, handler)),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(Logger.prototype.log).toHaveBeenCalledWith(
      expect.stringContaining('"statusCode":401'),
    );
  });
});
