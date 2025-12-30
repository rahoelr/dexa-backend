import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';

describe('API Gateway (e2e)', () => {
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
