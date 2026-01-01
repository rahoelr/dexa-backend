import { Body, Controller, Get, Param, Post, Query, Req, Res, UploadedFile, UseGuards, UseInterceptors, BadRequestException } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CheckInDto } from './dto/check-in.dto';
import { CheckOutDto } from './dto/check-out.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import type { Response } from 'express';

@UseGuards(JwtAuthGuard)
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly service: AttendanceService) {}

  @Post('check-in')
  async checkIn(@Req() req: any, @Body() body?: CheckInDto) {
    const { photoUrl, description } = body ?? {};
    return this.service.checkIn(Number(req.user.id), photoUrl, description);
  }

  @Post('check-out')
  async checkOut(@Req() req: any, @Body() body?: CheckOutDto) {
    const { description } = body ?? {};
    return this.service.checkOut(Number(req.user.id), description);
  }

  @Post('photo')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: join(process.cwd(), 'data', 'database', 'photos'),
        filename: (req, file, cb) => {
          const userId = (req as any)?.user?.id ? String((req as any).user.id) : 'anon';
          const ts = Date.now();
          const rnd = Math.random().toString(36).slice(2, 8);
          const ext = extname(file.originalname || '');
          cb(null, `${userId}-${ts}-${rnd}${ext}`);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        const ok = file.mimetype === 'image/jpeg' || file.mimetype === 'image/png';
        cb(null, ok);
      },
    }),
  )
  async uploadPhoto(@Req() req: any, @UploadedFile() file?: any) {
    if (!file) {
      throw new BadRequestException('FILE_REQUIRED');
    }
    return { url: `/attendance/photo/${file.filename}` };
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
