import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';

describe('CORS (e2e)', () => {
  let app: INestApplication;
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(HttpService)
      .useValue({
        request: () =>
          of({
            status: 200,
            data: { ok: true },
            headers: { 'content-type': 'application/json' },
          }),
        get: () =>
          of({
            status: 200,
            data: { ok: true },
            headers: { 'content-type': 'application/json' },
          }),
      })
      .compile();
    app = moduleRef.createNestApplication();
    app.enableCors({
      origin: ['http://localhost:5173'],
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      allowedHeaders: ['Authorization', 'Content-Type', 'content-type', 'Accept', 'X-Requested-With', 'X-Request-Id'],
      credentials: false,
    });
    await app.init();
  });
  afterAll(async () => {
    await app.close();
  });

  it('preflight /auth/login returns CORS headers', async () => {
    const res = await request(app.getHttpServer())
      .options('/auth/login')
      .set('Origin', 'http://localhost:5173')
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'Authorization, Content-Type')
      .expect(204);
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(res.headers['access-control-allow-methods']).toContain('POST');
    expect(res.headers['vary']).toContain('Origin');
  });

  it('preflight /employees is not blocked by guard', async () => {
    const res = await request(app.getHttpServer())
      .options('/employees')
      .set('Origin', 'http://localhost:5173')
      .set('Access-Control-Request-Method', 'GET')
      .expect(204);
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
  });

  it('proxied response includes CORS headers', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .set('Origin', 'http://localhost:5173')
      .send({ email: 'a@b.c', password: 'x' })
      .expect(200);
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(res.headers['access-control-expose-headers']).toContain('X-Request-Id');
  });

  it('health endpoint includes CORS headers', async () => {
    const res = await request(app.getHttpServer())
      .get('/health')
      .set('Origin', 'http://localhost:5173')
      .expect(200);
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
  });
});
