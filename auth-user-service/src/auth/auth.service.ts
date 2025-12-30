import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new BadRequestException('email_taken');
    const hashed = await bcrypt.hash(dto.password, 10);
    const role = dto.role ?? 'EMPLOYEE';
    const created = await this.prisma.user.create({
      data: { name: dto.name, email: dto.email, password: hashed, role, isActive: true },
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
    });
    return created;
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('invalid_credentials');
    const ok = await bcrypt.compare(dto.password, user.password);
    if (!ok) throw new UnauthorizedException('invalid_credentials');
    const payload = { sub: user.id, email: user.email, role: user.role };
    const token = await this.jwt.signAsync(payload);
    return { access_token: token };
  }
}
