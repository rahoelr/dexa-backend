import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { createConnection } from 'mysql2/promise';

@Injectable()
export class DatabaseService implements OnModuleInit {
  async onModuleInit(): Promise<void> {
    try {
      const url = process.env.DATABASE_URL;
      if (!url) {
        Logger.warn('DATABASE_URL not set');
        return;
      }
      const conn = await createConnection(url);
      await conn.ping();
      await conn.end();
      Logger.log('database s=connected');
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      Logger.error(`database s=error msg=${msg}`);
    }
  }
}
