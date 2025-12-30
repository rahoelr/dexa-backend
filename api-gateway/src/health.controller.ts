import { Controller, Get, Res } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import type { Response } from 'express';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from './config.service';

@Controller('health')
export class HealthController {
  constructor(private readonly http: HttpService, private readonly cfg: ConfigService) {}

  @Get()
  async get(@Res() res: Response) {
    const results: Record<string, { status: 'UP' | 'DOWN'; latencyMs?: number; error?: string }> = {};
    const startAuth = Date.now();
    try {
      const r = await firstValueFrom(
        this.http.get(`${this.cfg.authServiceUrl}/auth/me`, { validateStatus: () => true }),
      );
      results.auth = { status: r.status >= 200 && r.status < 500 ? 'UP' : 'DOWN', latencyMs: Date.now() - startAuth };
    } catch (e: any) {
      results.auth = { status: 'DOWN', error: 'unreachable', latencyMs: Date.now() - startAuth };
    }

    const startAtt = Date.now();
    try {
      const r = await firstValueFrom(
        this.http.get(`${this.cfg.attendanceServiceUrl}/health`, { validateStatus: () => true }),
      );
      results.attendance = { status: r.status === 200 ? 'UP' : 'DOWN', latencyMs: Date.now() - startAtt };
    } catch (e: any) {
      results.attendance = { status: 'DOWN', error: 'unreachable', latencyMs: Date.now() - startAtt };
    }

    const overall = Object.values(results).every(r => r.status === 'UP') ? 'UP' : 'DOWN';
    const statusCode = overall === 'UP' ? 200 : 503;
    return res.status(statusCode).send({ status: overall, services: results });
  }
}
