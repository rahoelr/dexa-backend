import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { JwtModule } from '@nestjs/jwt';
import { AuthController, EmployeesController } from './auth.controller';
import { AttendanceController } from './attendance.controller';
import { AdminAttendanceController } from './admin-attendance.controller';
import { ConfigService } from './config.service';
import { ProxyService } from './proxy.service';
import { JwtGatewayGuard } from './auth/jwt-gateway.guard';
import { AdminGatewayGuard } from './auth/admin-gateway.guard';
import { HealthController } from './health.controller';
import { AttendancePublicController } from './attendance.public.controller';

@Module({
  imports: [
    HttpModule.register({
      timeout: Number(process.env.GATEWAY_TIMEOUT_MS || 15000),
      maxRedirects: 0,
    }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'rahulrtest',
    }),
  ],
  controllers: [
    AuthController,
    EmployeesController,
    AttendancePublicController,
    AttendanceController,
    AdminAttendanceController,
    HealthController,
  ],
  providers: [ConfigService, ProxyService, JwtGatewayGuard, AdminGatewayGuard],
})
export class AppModule {}
