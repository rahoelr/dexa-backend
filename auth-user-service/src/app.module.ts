import { Module } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [],
  providers: [DatabaseService],
})
export class AppModule {}
