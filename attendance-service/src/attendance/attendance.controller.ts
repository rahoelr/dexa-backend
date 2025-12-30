import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CheckInDto } from './dto/check-in.dto';
import { CheckOutDto } from './dto/check-out.dto';

@UseGuards(JwtAuthGuard)
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly service: AttendanceService) {}

  @Post('check-in')
  async checkIn(@Req() req: any, @Body() body: CheckInDto) {
    return this.service.checkIn(Number(req.user.id), body.photoUrl, body.description);
  }

  @Post('check-out')
  async checkOut(@Req() req: any, @Body() body: CheckOutDto) {
    return this.service.checkOut(Number(req.user.id), body.description);
  }

  @Get('me')
  async me(
    @Req() req: any,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const f = from ? new Date(from) : undefined;
    const t = to ? new Date(to) : undefined;
    const p = page ? Number(page) : 1;
    const ps = pageSize ? Number(pageSize) : 20;
    return this.service.history(Number(req.user.id), f, t, p, ps);
  }
}
