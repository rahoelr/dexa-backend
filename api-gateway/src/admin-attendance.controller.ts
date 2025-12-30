import { All, Controller, Req, Res } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import type { Request, Response } from 'express';
import { firstValueFrom } from 'rxjs';

@Controller('admin/attendance')
export class AdminAttendanceController {
  constructor(private readonly http: HttpService) {}

  @All('*')
  async handle(@Req() req: Request, @Res() res: Response) {
    const baseUrl = process.env.ATTENDANCE_SERVICE_URL || 'http://localhost:3001';
    const path = req.params[0] ? `/${req.params[0]}` : '';
    const url = `${baseUrl}/admin/attendance${path}`;
    const r = await firstValueFrom(
      this.http.request({
        method: req.method,
        url,
        headers: req.headers as any,
        data: req.body,
        params: req.query as any,
        validateStatus: () => true,
      }),
    );
    Object.entries(r.headers || {}).forEach(([k, v]) => {
      if (typeof v === 'string') res.setHeader(k, v);
    });
    return res.status(r.status).send(r.data);
  }
}
