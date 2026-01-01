import { All, Controller, Post, Req, Res, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import type { Request, Response } from 'express';
import { firstValueFrom } from 'rxjs';
import { ProxyService } from './proxy.service';
import { ConfigService } from './config.service';
import { JwtGatewayGuard } from './auth/jwt-gateway.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import FormData from 'form-data';

@Controller('attendance')
@UseGuards(JwtGatewayGuard)
export class AttendanceController {
  constructor(
    private readonly http: HttpService,
    private readonly proxy: ProxyService,
    private readonly cfg: ConfigService,
  ) {}

  @Post('check-in')
  @UseInterceptors(FileInterceptor('file'))
  async checkInWithPhoto(@Req() req: Request, @Res() res: Response, @UploadedFile() file?: any) {
    if (!file) {
      const r = await firstValueFrom(
        this.http.post(`${this.cfg.attendanceServiceUrl}/attendance/check-in`, req.body, {
          headers: {
            authorization: (req.headers['authorization'] as string) || '',
          },
          validateStatus: () => true,
        }),
      );
      for (const [k, v] of Object.entries(r.headers || {})) {
        if (typeof v === 'string') {
          res.setHeader(k, v);
        }
      }
      return res.status(r.status).send(r.data);
    }
    const form = new FormData();
    form.append('file', file.buffer, { filename: file.originalname || 'upload.jpg', contentType: file.mimetype || 'application/octet-stream' });
    const headers = {
      ...form.getHeaders(),
      authorization: (req.headers['authorization'] as string) || '',
      'x-forwarded-for': ((req.headers['x-forwarded-for'] as string) || req.ip || 'unknown') as string,
      'x-forwarded-host': (req.headers['host'] as string) || '',
      'x-forwarded-proto': (req.protocol || 'http') as string,
    };
    const up = await firstValueFrom(
      this.http.post(`${this.cfg.attendanceServiceUrl}/attendance/photo`, form, {
        headers,
        validateStatus: () => true,
      }),
    );
    if (up.status >= 400) {
      try {
        console.warn(
          JSON.stringify({
            tag: 'gateway-checkin-upload-error',
            status: up.status,
            data: typeof up.data === 'object' ? up.data : String(up.data),
          }),
        );
      } catch {}
      return res.status(up.status).send(up.data);
    }
    const rel = (up.data && typeof up.data.url === 'string' && up.data.url) ? String(up.data.url) : '';
    if (!rel) {
      return res.status(400).send({ statusCode: 400, message: 'Upload failed: missing url' });
    }
    const abs = `${req.protocol}://${req.headers.host}${rel}`;
    const body = { photoUrl: abs, description: (req.body as any)?.description };
    const r = await firstValueFrom(
      this.http.post(`${this.cfg.attendanceServiceUrl}/attendance/check-in`, body, {
        headers: {
          authorization: (req.headers['authorization'] as string) || '',
        },
        validateStatus: () => true,
      }),
    );
    if (r.status >= 400) {
      try {
        console.warn(
          JSON.stringify({
            tag: 'gateway-checkin-upstream-error',
            status: r.status,
            data: typeof r.data === 'object' ? r.data : String(r.data),
          }),
        );
      } catch {}
    }
    for (const [k, v] of Object.entries(r.headers || {})) {
      if (typeof v === 'string') {
        res.setHeader(k, v);
      }
    }
    return res.status(r.status).send(r.data);
  }

  @All('*')
  async handle(@Req() req: Request, @Res() res: Response) {
    return this.proxy.forward(req, res, this.cfg.attendanceServiceUrl, '/attendance');
  }

  @All()
  async handleRoot(@Req() req: Request, @Res() res: Response) {
    return this.proxy.forward(req, res, this.cfg.attendanceServiceUrl, '/attendance');
  }
}
