import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';

@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin/attendance')
export class AdminAttendanceController {
  constructor(private readonly service: AttendanceService) {}

  @Get()
  async list(
    @Query('userId') userId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const f = from ? new Date(from) : undefined;
    const t = to ? new Date(to) : undefined;
    const p = page ? Number(page) : 1;
    const ps = pageSize ? Number(pageSize) : 20;
    if (userId) return this.service.history(Number(userId), f, t, p, ps);
    return this.service.historyAll(f, t, p, ps);
  }

  @Get('today')
  async today(@Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    const p = page ? Number(page) : 1;
    const ps = pageSize ? Number(pageSize) : 50;
    return this.service.today(p, ps);
  }
}
