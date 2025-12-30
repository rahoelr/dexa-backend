import { Module } from '@nestjs/common';
import { AttendanceController } from './attendance.controller';
import { AdminAttendanceController } from './admin.controller';
import { AttendanceService } from './attendance.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [AttendanceController, AdminAttendanceController],
  providers: [AttendanceService, PrismaService],
})
export class AttendanceModule {}
