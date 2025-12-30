import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AuthController, EmployeesController } from './auth.controller';
import { AttendanceController } from './attendance.controller';
import { AdminAttendanceController } from './admin-attendance.controller';

@Module({
  imports: [
    HttpModule.register({
      timeout: 15000,
      maxRedirects: 5,
    }),
  ],
  controllers: [
    AuthController,
    EmployeesController,
    AttendanceController,
    AdminAttendanceController,
  ],
})
export class AppModule {}
