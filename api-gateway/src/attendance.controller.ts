import { All, Controller, Req, Res, UseGuards } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import type { Request, Response } from 'express';
import { firstValueFrom } from 'rxjs';
import { ProxyService } from './proxy.service';
import { ConfigService } from './config.service';
import { JwtGatewayGuard } from './auth/jwt-gateway.guard';

@Controller('attendance')
@UseGuards(JwtGatewayGuard)
export class AttendanceController {
  constructor(
    private readonly http: HttpService,
    private readonly proxy: ProxyService,
    private readonly cfg: ConfigService,
  ) {}

  @All('*')
  async handle(@Req() req: Request, @Res() res: Response) {
    return this.proxy.forward(req, res, this.cfg.attendanceServiceUrl, '/attendance');
  }

  @All()
  async handleRoot(@Req() req: Request, @Res() res: Response) {
    return this.proxy.forward(req, res, this.cfg.attendanceServiceUrl, '/attendance');
  }
}
