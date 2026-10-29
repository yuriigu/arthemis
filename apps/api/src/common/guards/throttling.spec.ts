import { Controller, Get } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { configureApp } from '../../config/app.setup.js';
import { getRequestId } from '../request-context.js';

@Controller('limited')
class LimitedController {
  @Get()
  get(): { requestId: string | null } {
    return { requestId: getRequestId() ?? null };
  }
}

describe('global throttling', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ThrottlerModule.forRoot([{ ttl: 60_000, limit: 1 }])],
      controllers: [LimitedController],
      providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
    }).compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('returns the standard error envelope when the limit is exceeded', async () => {
    const firstResponse = await request(app.getHttpServer())
      .get('/limited')
      .expect(200);
    expect(firstResponse.body.requestId).toBe(
      firstResponse.headers['x-request-id'],
    );

    const response = await request(app.getHttpServer())
      .get('/limited')
      .expect(429);

    expect(response.body).toEqual({
      code: 'TOO_MANY_REQUESTS',
      message: expect.any(String),
      details: [],
      timestamp: expect.any(String),
    });
    expect(response.headers['x-request-id']).toEqual(expect.any(String));
  });

  it('serves the generated Swagger document', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/docs-json')
      .expect(200);

    expect(response.body.paths).toHaveProperty('/limited');
  });
});
