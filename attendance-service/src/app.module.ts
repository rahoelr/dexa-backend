import { Module } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { JwtModule } from '@nestjs/jwt';
import { HealthController } from './health.controller';
import { AttendanceModule } from './attendance/attendance.module';

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || 'rahulrtest',
    }),
    AttendanceModule,
  ],
  controllers: [HealthController],
  providers: [DatabaseService],
})
export class AppModule {}
