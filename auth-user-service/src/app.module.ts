import { Module } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { AuthModule } from './auth/auth.module';
import { EmployeesModule } from './employees/employees.module';

@Module({
  imports: [AuthModule, EmployeesModule],
  controllers: [],
  providers: [DatabaseService],
})
export class AppModule {}
