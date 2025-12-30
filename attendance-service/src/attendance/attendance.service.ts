import { Injectable, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { AttendanceStatus } from '@prisma/client';

function midnightUTC(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0));
}
function parseShiftStart(envVal: string | undefined): number {
  const v = envVal || '09:00';
  const m = /^(\d{1,2}):(\d{2})$/.exec(v);
  if (!m) return 9 * 60;
  const hh = Math.min(23, Math.max(0, Number(m[1])));
  const mm = Math.min(59, Math.max(0, Number(m[2])));
  return hh * 60 + mm;
}
function nowMinutesUTC(now: Date): number {
  return now.getUTCHours() * 60 + now.getUTCMinutes();
}

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  async checkIn(userId: number, photoUrl?: string, description?: string) {
    const now = new Date();
    const day = midnightUTC(now);
    const existing = await this.prisma.attendance.findUnique({ where: { userId_date: { userId, date: day } } }).catch(() => null);
    if (existing) throw new ConflictException('Already checked in');
    const shiftStart = parseShiftStart(process.env.SHIFT_START);
    const grace = Number(process.env.LATE_GRACE || 15);
    const status = nowMinutesUTC(now) <= shiftStart + grace ? AttendanceStatus.ON_TIME : AttendanceStatus.LATE;
    return this.prisma.attendance.create({
      data: { userId, date: day, checkIn: now, status, photoUrl, description },
    });
  }

  async checkOut(userId: number, description?: string) {
    const now = new Date();
    const day = midnightUTC(now);
    const existing = await this.prisma.attendance.findUnique({ where: { userId_date: { userId, date: day } } });
    if (!existing || !existing.checkIn) throw new BadRequestException('Not checked in');
    if (existing.checkOut) throw new ConflictException('Already checked out');
    return this.prisma.attendance.update({
      where: { userId_date: { userId, date: day } },
      data: { checkOut: now, description: description ?? existing.description },
    });
  }

  async history(userId: number, from?: Date, to?: Date, page = 1, pageSize = 20) {
    const where: any = { userId };
    if (from || to) {
      const cond: any = {};
      if (from) cond.gte = midnightUTC(from);
      if (to) cond.lte = midnightUTC(to);
      where.date = cond;
    }
    const total = await this.prisma.attendance.count({ where });
    const items = await this.prisma.attendance.findMany({
      where,
      orderBy: { date: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { items, page, pageSize, total };
  }
}
