import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';
import { JwtGatewayGuard } from '../src/auth/jwt-gateway.guard';
import { AdminGatewayGuard } from '../src/auth/admin-gateway.guard';
import { JwtService } from '@nestjs/jwt';

describe('API Gateway (e2e)', () => {
  describe('forwarding', () => {
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
        })
        .overrideGuard(JwtGatewayGuard)
        .useValue({ canActivate: () => true })
        .overrideGuard(AdminGatewayGuard)
        .useValue({ canActivate: () => true })
        .compile();

      app = moduleRef.createNestApplication();
      await app.init();
    });

    afterAll(async () => {
      await app.close();
    });

    it('forwards /auth/login', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'a@b.c', password: 'x' })
        .expect(200)
        .expect({ ok: true });
    });

    it('forwards /attendance/check-in', async () => {
      await request(app.getHttpServer())
        .post('/attendance/check-in')
        .send({ description: 'start' })
        .expect(200)
        .expect({ ok: true });
    });
  });

  describe('guards', () => {
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
        })
        .overrideProvider(JwtService)
        .useValue({
          verify: (token: string) => {
            if (token === 'admin') return { role: 'ADMIN', sub: 1 };
            if (token === 'user') return { sub: 2 };
            throw new Error('invalid');
          },
        })
        .compile();
      app = moduleRef.createNestApplication();
      await app.init();
    });
    afterAll(async () => {
      await app.close();
    });

    it('rejects attendance without token', async () => {
      await request(app.getHttpServer()).get('/attendance/me').expect(401);
    });
    it('allows attendance with user token', async () => {
      await request(app.getHttpServer())
        .get('/attendance/me')
        .set('Authorization', 'Bearer user')
        .expect(200);
    });
    it('rejects employees without admin', async () => {
      await request(app.getHttpServer()).get('/employees').expect(401);
    });
    it('rejects employees with non-admin', async () => {
      await request(app.getHttpServer()).get('/employees').set('Authorization', 'Bearer user').expect(403);
    });
    it('allows employees with admin', async () => {
      await request(app.getHttpServer()).get('/employees').set('Authorization', 'Bearer admin').expect(200);
    });
    it('auth/register requires admin', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .set('Authorization', 'Bearer user')
        .send({ name: 'x', email: 'x@y.z', password: 'secret123', role: 'ADMIN' })
        .expect(403);
      await request(app.getHttpServer())
        .post('/auth/register')
        .set('Authorization', 'Bearer admin')
        .send({ name: 'x', email: 'x@y.z', password: 'secret123', role: 'ADMIN' })
        .expect(200);
    });
  });

  describe('health', () => {
    let app: INestApplication;
    beforeAll(async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [AppModule],
      })
        .overrideProvider(HttpService)
        .useValue({
          get: (url: string) => {
            if (url.includes('/health')) {
              return of({ status: 200, data: 'OK', headers: {} });
            }
            if (url.includes('/auth/me')) {
              return of({ status: 200, data: {}, headers: {} });
            }
            return of({ status: 404, data: {}, headers: {} });
          },
          request: () => of({ status: 200, data: {}, headers: {} }),
        })
        .compile();
      app = moduleRef.createNestApplication();
      await app.init();
    });
    afterAll(async () => {
      await app.close();
    });
    it('aggregates health', async () => {
      const res = await request(app.getHttpServer()).get('/health').expect(200);
      expect(res.body.status).toBe('UP');
      expect(res.body.services.auth.status).toBe('UP');
      expect(res.body.services.attendance.status).toBe('UP');
    });
  });
});
