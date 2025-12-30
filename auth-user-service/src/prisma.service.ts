import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit(): Promise<void> {
    await this.$connect();
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'password';
    const adminName = process.env.ADMIN_NAME || 'Admin';
    const existingAdmin = await this.user.findFirst({ where: { role: 'ADMIN' } });
    if (!existingAdmin) {
      const hashed = await bcrypt.hash(adminPassword, 10);
      await this.user.create({
        data: { name: adminName, email: adminEmail, password: hashed, role: 'ADMIN', isActive: true },
      });
    }
  }
  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
