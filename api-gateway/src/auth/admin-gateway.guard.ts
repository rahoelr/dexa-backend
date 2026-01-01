import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AdminGatewayGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    if (req.method === 'OPTIONS') return true;
    const header: string | undefined = req.headers['authorization'];
    if (!header) throw new UnauthorizedException();
    const [type, token] = header.split(' ');
    if (type !== 'Bearer' || !token) throw new UnauthorizedException();
    const payload: any = (() => {
      try {
        return this.jwt.verify(token);
      } catch {
        throw new UnauthorizedException();
      }
    })();
    const role: unknown = payload?.role;
    const roles: unknown = payload?.roles;
    const sub: unknown = payload?.sub;
    const adminIdsEnv = process.env.ADMIN_IDS || '';
    const adminIds = adminIdsEnv
      .split(',')
      .map((s) => Number(String(s).trim()))
      .filter((n) => !Number.isNaN(n));
    const hasAdminRole =
      typeof role === 'string' && role.toUpperCase() === 'ADMIN';
    const hasAdminRolesArray =
      Array.isArray(roles) &&
      (roles as unknown[])
        .filter((r) => typeof r === 'string')
        .some((r: any) => String(r).toUpperCase() === 'ADMIN');
    const isAdminById =
      typeof sub === 'number' && adminIds.length > 0 && adminIds.includes(sub as number);
    if (!(hasAdminRole || hasAdminRolesArray || isAdminById)) {
      throw new ForbiddenException('Admin only');
    }
    return true;
  }
}
