import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { EmployeesService } from './employees.service';
import { EmployeesController } from './employees.controller';
import { JwtModule } from '@nestjs/jwt';
import { AdminGuard } from '../auth/admin.guard';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'rahulrtest',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  providers: [PrismaService, EmployeesService, AdminGuard],
  controllers: [EmployeesController],
})
export class EmployeesModule {}
