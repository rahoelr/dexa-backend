import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';
import { JwtGatewayGuard } from '../src/auth/jwt-gateway.guard';

describe('Attendance Photo (e2e)', () => {
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
            data: Buffer.from([0xff, 0xd8, 0xff]), // minimal jpeg signature
            headers: { 'content-type': 'image/jpeg' },
          }),
      })
      .overrideGuard(JwtGatewayGuard)
      .useValue({ canActivate: () => true })
      .compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('serves photo without auth', async () => {
    await request(app.getHttpServer()).get('/attendance/photo/abc.jpg').expect(200).expect('Content-Type', /image\/jpeg/);
  });
});
