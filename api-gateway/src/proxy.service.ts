import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import type { Request, Response } from 'express';
import { firstValueFrom } from 'rxjs';

const HOP_BY_HOP = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
  'host',
  'content-length',
  'content-encoding',
  'expect',
]);

@Injectable()
export class ProxyService {
  constructor(private readonly http: HttpService) {}

  async forward(req: Request, res: Response, baseUrl: string, prefix: string) {
    const path = (req.params && (req.params as any)[0]) ? `/${(req.params as any)[0]}` : '';
    const url = `${baseUrl}${prefix}${path}`;
    const headers: Record<string, string> = {};
    for (const [k, v] of Object.entries(req.headers)) {
      const key = k.toLowerCase();
      if (HOP_BY_HOP.has(key)) continue;
      if (typeof v === 'string') headers[key] = v;
    }
    const xfip = ((req.headers['x-forwarded-for'] as string) || req.ip || 'unknown') as string;
    headers['x-forwarded-for'] = xfip;
    headers['x-forwarded-host'] = req.headers['host'] as string;
    headers['x-forwarded-proto'] = (req.protocol || 'http') as string;

    try {
      const r = await firstValueFrom(
        this.http.request({
          method: req.method,
          url,
          headers,
          data: req.body,
          params: req.query as any,
          validateStatus: () => true,
        }),
      );
      for (const [k, v] of Object.entries(r.headers || {})) {
        if (typeof v === 'string' && !HOP_BY_HOP.has(k.toLowerCase())) {
          res.setHeader(k, v);
        }
      }
      return res.status(r.status).send(r.data);
    } catch (e: any) {
      const code = e?.code || 'UNKNOWN_ERROR';
      const message = e?.message || 'unknown';
      const reqId = (req.headers['x-request-id'] as string) || '';
      // simple console log for observability
      // format: [proxy-error] code=<code> url=<url> reqId=<x-request-id> msg=<message>
      console.error(`[proxy-error] code=${code} url=${url} reqId=${reqId} msg=${message}`);
      return res
        .status(503)
        .send({
          statusCode: 503,
          message: 'Upstream unavailable',
          error: 'Service Unavailable',
        });
    }
  }
}
