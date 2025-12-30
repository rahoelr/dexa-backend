import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtGatewayGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const auth = req.headers['authorization'] || '';
    const m = /^Bearer\s+(.+)$/.exec(auth);
    if (!m) throw new UnauthorizedException('Missing bearer token');
    try {
      const payload = this.jwt.verify(m[1]);
      const userId = payload.userId ?? payload.id ?? payload.sub;
      if (!userId) throw new UnauthorizedException('Invalid token payload');
      req.user = { id: Number(userId) || userId };
      return true;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
