import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AdminGatewayGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const header: string | undefined = req.headers['authorization'];
    if (!header) throw new UnauthorizedException();
    const [type, token] = header.split(' ');
    if (type !== 'Bearer' || !token) throw new UnauthorizedException();
    const payload = (() => {
      try {
        return this.jwt.verify(token);
      } catch {
        throw new UnauthorizedException();
      }
    })();
    if (payload?.role !== 'ADMIN') throw new ForbiddenException('Admin only');
    return true;
  }
}
