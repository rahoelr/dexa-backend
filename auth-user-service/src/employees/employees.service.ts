import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class EmployeesService {
  constructor(private prisma: PrismaService) {}

  async create(data: { name: string; email: string; password: string; isActive?: boolean }) {
    const existing = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new BadRequestException('email_taken');
    const hashed = await bcrypt.hash(data.password, 10);
    const created = await this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashed,
        role: 'EMPLOYEE',
        isActive: data.isActive ?? true,
      },
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
    });
    return created;
  }

  async list(params: { search?: string; page?: number; limit?: number }) {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(100, Math.max(1, params.limit ?? 10));
    const where = {
      role: 'EMPLOYEE' as const,
      OR: params.search
        ? [
            { name: { contains: params.search, mode: 'insensitive' } },
            { email: { contains: params.search, mode: 'insensitive' } },
          ]
        : undefined,
    };
    const [total, items] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
      }),
    ]);
    return { items, page, limit, total };
  }

  async get(id: number) {
    const emp = await this.prisma.user.findFirst({
      where: { id, role: 'EMPLOYEE' },
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
    });
    if (!emp) throw new NotFoundException('not_found');
    return emp;
  }

  async update(id: number, data: { name?: string; email?: string; password?: string; isActive?: boolean }) {
    const existing = await this.prisma.user.findFirst({ where: { id, role: 'EMPLOYEE' } });
    if (!existing) throw new NotFoundException('not_found');
    if (data.email) {
      const dup = await this.prisma.user.findUnique({ where: { email: data.email } });
      if (dup && dup.id !== id) throw new BadRequestException('email_taken');
    }
    const hashed = data.password ? await bcrypt.hash(data.password, 10) : undefined;
    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        name: data.name,
        email: data.email,
        password: hashed,
        isActive: data.isActive,
      },
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
    });
    return updated;
  }

  async remove(id: number, hard?: boolean) {
    const existing = await this.prisma.user.findFirst({ where: { id, role: 'EMPLOYEE' } });
    if (!existing) throw new NotFoundException('not_found');
    if (hard) {
      await this.prisma.user.delete({ where: { id } });
      return { success: true };
    }
    const updated = await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
    });
    return updated;
  }
}
