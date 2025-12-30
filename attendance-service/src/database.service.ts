import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { createConnection } from 'mysql2/promise';

@Injectable()
export class DatabaseService implements OnModuleInit {
  async checkConnection(): Promise<boolean> {
    try {
      const uri = process.env.DATABASE_URL;
      if (!uri) {
        return false;
      }
      const u = new URL(uri);
      const conn = await createConnection({
        host: u.hostname,
        port: Number(u.port || 3306),
        user: decodeURIComponent(u.username),
        password: decodeURIComponent(u.password),
        database: u.pathname.replace(/^\//, ''),
      } as any);
      await conn.ping();
      await conn.end();
      return true;
    } catch {
      return false;
    }
  }
  async onModuleInit(): Promise<void> {
    try {
      const uri = process.env.DATABASE_URL;
      if (!uri) {
        Logger.warn('DATABASE_URL not set');
        return;
      }
      const u = new URL(uri);
      const conn = await createConnection({
        host: u.hostname,
        port: Number(u.port || 3306),
        user: decodeURIComponent(u.username),
        password: decodeURIComponent(u.password),
        database: u.pathname.replace(/^\//, ''),
      } as any);
      await conn.ping();
      await conn.end();
      Logger.log('database connected');
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      Logger.error(`database error msg=${msg}`);
    }
  }
}
