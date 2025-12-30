import { Injectable } from '@nestjs/common';

@Injectable()
export class ConfigService {
  get port(): number {
    return Number(process.env.PORT || 8080);
  }
  get authServiceUrl(): string {
    return process.env.AUTH_SERVICE_URL || 'http://localhost:3000';
  }
  get attendanceServiceUrl(): string {
    return process.env.ATTENDANCE_SERVICE_URL || 'http://localhost:3001';
  }
  get requestTimeoutMs(): number {
    return Number(process.env.GATEWAY_TIMEOUT_MS || 15000);
  }
  get jwtSecret(): string {
    return process.env.JWT_SECRET || 'rahulrtest';
  }
}
