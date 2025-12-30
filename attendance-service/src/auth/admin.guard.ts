import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const auth = req.headers['authorization'] || '';
    const m = /^Bearer\s+(.+)$/.exec(auth);
    if (!m) throw new UnauthorizedException('Missing bearer token');
    try {
      const payload = this.jwt.verify(m[1], { secret: process.env.JWT_SECRET || 'rahulrtest' });
      const role = payload.role ?? payload.roles;
      if (role === 'admin' || (Array.isArray(role) && role.includes('admin'))) return true;
      const ids = (process.env.ADMIN_IDS || '').split(',').map(v => v.trim()).filter(Boolean);
      const uid = String(payload.userId ?? payload.id ?? payload.sub);
      if (ids.includes(uid)) return true;
      throw new ForbiddenException('Admin only');
    } catch (e) {
      if (e instanceof ForbiddenException) throw e;
      throw new UnauthorizedException('Invalid token');
    }
  }
}
