import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import type { Request, Response } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );
  app.use((req: Request, res: Response, next) => {
    const start = Date.now();
    const incomingId = (req.headers['x-request-id'] as string) || '';
    const reqId = incomingId || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    res.setHeader('x-request-id', reqId);
    res.on('finish', () => {
      const dur = Date.now() - start;
      // eslint-disable-next-line no-console
      console.log(JSON.stringify({ reqId, method: req.method, url: req.originalUrl, status: res.statusCode, durationMs: dur }));
    });
    next();
  });
  const limits = new Map<string, { count: number; windowStart: number }>();
  const WINDOW_MS = 60_000;
  const LIMIT = Number(process.env.GATEWAY_RATE_LIMIT || 100);
  app.use((req: Request, res: Response, next) => {
    const ip = (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown';
    const now = Date.now();
    const rec = limits.get(ip) || { count: 0, windowStart: now };
    if (now - rec.windowStart > WINDOW_MS) {
      rec.count = 0;
      rec.windowStart = now;
    }
    rec.count++;
    limits.set(ip, rec);
    if (rec.count > LIMIT) {
      return res.status(429).send({ statusCode: 429, message: 'Too Many Requests', error: 'Too Many Requests' });
    }
    next();
  });
  app.enableCors({
    origin: (process.env.CORS_ORIGIN || '*')
      .split(',')
      .map(v => v.trim())
      .filter(Boolean),
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: ['Authorization', 'Content-Type', 'X-Request-Id'],
    credentials: false,
  });
  app.use((req: Request, res: Response, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('X-XSS-Protection', '0');
    next();
  });
  const port = Number(process.env.PORT || 8080);
  await app.listen(port);
}
bootstrap();
