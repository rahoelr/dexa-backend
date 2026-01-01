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
    if (req.method === 'OPTIONS') {
      const origin = (req.headers.origin as string) || '*';
      const reqHeaders = (req.headers['access-control-request-headers'] as string) || 'Authorization, Content-Type, X-Request-Id';
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', reqHeaders);
      res.setHeader('Access-Control-Allow-Credentials', 'false');
      res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Max-Age', '600');
      return res.status(204).end();
    }
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
      const origin = (req.headers.origin as string) || '';
      if (origin) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Credentials', 'false');
        res.setHeader('Access-Control-Expose-Headers', 'X-Request-Id');
        // merge Vary header properly
        const existingVary = (res.getHeader('Vary') as string) || '';
        const varyParts = new Set(existingVary.split(',').map(s => s.trim()).filter(Boolean));
        varyParts.add('Origin');
        res.setHeader('Vary', Array.from(varyParts).join(', '));
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
