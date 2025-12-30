import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
import { DatabaseService } from './database.service';

@Controller('health')
export class HealthController {
  constructor(private readonly db: DatabaseService) {}
  @Get()
  get(): string {
    return 'OK';
  }
  @Get('db')
  async dbCheck(): Promise<{ status: string }> {
    const ok = await this.db.checkConnection();
    if (!ok) {
      throw new HttpException({ status: 'error' }, HttpStatus.SERVICE_UNAVAILABLE);
    }
    return { status: 'ok' };
  }
}
