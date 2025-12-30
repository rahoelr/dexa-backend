import { All, Controller, Req, Res, UseGuards } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import type { Request, Response } from 'express';
import { firstValueFrom } from 'rxjs';
import { ProxyService } from './proxy.service';
import { ConfigService } from './config.service';
import { AdminGatewayGuard } from './auth/admin-gateway.guard';
import { JwtService } from '@nestjs/jwt';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly http: HttpService,
    private readonly proxy: ProxyService,
    private readonly cfg: ConfigService,
    private readonly jwt: JwtService,
  ) {}

  @All('*')
  async handle(@Req() req: Request, @Res() res: Response) {
    const subpath = (req.params && (req.params as any)[0]) || '';
    if (subpath === 'register') {
      const header: string | undefined = req.headers['authorization'] as string | undefined;
      if (!header) return res.status(401).send({ statusCode: 401, message: 'Missing bearer token', error: 'Unauthorized' });
      const [type, token] = header.split(' ');
      if (type !== 'Bearer' || !token) return res.status(401).send({ statusCode: 401, message: 'Invalid token', error: 'Unauthorized' });
      try {
        const payload = this.jwt.verify(token);
        if (payload?.role !== 'ADMIN') {
          return res.status(403).send({ statusCode: 403, message: 'Admin only', error: 'Forbidden' });
        }
      } catch {
        return res.status(401).send({ statusCode: 401, message: 'Invalid token', error: 'Unauthorized' });
      }
    }
    return this.proxy.forward(req, res, this.cfg.authServiceUrl, '/auth');
  }

  @All()
  async handleRoot(@Req() req: Request, @Res() res: Response) {
    return this.proxy.forward(req, res, this.cfg.authServiceUrl, '/auth');
  }
}

@Controller('employees')
@UseGuards(AdminGatewayGuard)
export class EmployeesController {
  constructor(
    private readonly http: HttpService,
    private readonly proxy: ProxyService,
    private readonly cfg: ConfigService,
  ) {}

  @All('*')
  async handle(@Req() req: Request, @Res() res: Response) {
    return this.proxy.forward(req, res, this.cfg.authServiceUrl, '/employees');
  }

  @All()
  async handleRoot(@Req() req: Request, @Res() res: Response) {
    return this.proxy.forward(req, res, this.cfg.authServiceUrl, '/employees');
  }
}
