import { Body, Controller, Get, Headers, Post, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AdminGuard } from './admin.guard';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService, private jwt: JwtService) {}

  @Post('register')
  @UseGuards(AdminGuard)
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Get('me')
  me(@Headers('authorization') authorization?: string) {
    if (!authorization) return {};
    const [type, token] = authorization.split(' ');
    if (type !== 'Bearer' || !token) return {};
    try {
      const payload = this.jwt.verify(token, { secret: process.env.JWT_SECRET || 'rahulrtest' });
      return payload;
    } catch {
      return {};
    }
  }
}
