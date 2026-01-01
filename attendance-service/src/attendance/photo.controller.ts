import { Controller, Get, Param, Res } from '@nestjs/common';
import { join } from 'path';
import type { Response } from 'express';
import { existsSync } from 'fs';

@Controller('attendance/photo')
export class PhotoController {
  @Get(':filename')
  async getPhoto(@Param('filename') filename: string, @Res() res: Response) {
    const altPath = join(process.cwd(), 'database', 'data', 'photos', filename);
    const filePath = existsSync(altPath) ? altPath : join(process.cwd(), 'data', 'database', 'photos', filename);
    res.setHeader('Cache-Control', 'public, max-age=300');
    if (!existsSync(filePath)) {
      return res.status(404).send({ statusCode: 404, message: 'Photo not found' });
    }
    return res.sendFile(filePath);
  }
}
