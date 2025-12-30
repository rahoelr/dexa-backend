import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'rahulrtest',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  providers: [PrismaService, AuthService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
