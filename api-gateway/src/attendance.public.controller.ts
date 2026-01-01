import { All, Controller, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { ProxyService } from './proxy.service';
import { ConfigService } from './config.service';

@Controller('attendance/photo')
export class AttendancePublicController {
  constructor(private readonly proxy: ProxyService, private readonly cfg: ConfigService) {}

  @All('*')
  async serve(@Req() req: Request, @Res() res: Response) {
    res.setHeader('Cache-Control', 'public, max-age=300');
    return this.proxy.forward(req, res, this.cfg.attendanceServiceUrl, `/attendance/photo`);
  }
}
