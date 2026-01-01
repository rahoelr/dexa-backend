import { Module, OnModuleInit } from '@nestjs/common';
import { AttendanceController } from './attendance.controller';
import { AdminAttendanceController } from './admin.controller';
import { AttendanceService } from './attendance.service';
import { PrismaService } from '../prisma.service';
import { join } from 'path';
import { promises as fs } from 'fs';
import { PhotoController } from './photo.controller';

@Module({
  controllers: [AttendanceController, AdminAttendanceController, PhotoController],
  providers: [AttendanceService, PrismaService],
})
export class AttendanceModule implements OnModuleInit {
  async onModuleInit(): Promise<void> {
    const dir = join(process.cwd(), 'data', 'database', 'photos');
    await fs.mkdir(dir, { recursive: true }).catch(() => {});
  }
}
