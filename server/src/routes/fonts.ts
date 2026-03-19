import fs from 'node:fs';
import path from 'node:path';
import { FastifyPluginAsync } from 'fastify';
import { config } from '../lib/config.js';
import { prisma } from '../lib/prisma.js';

const allowedMimeTypes = new Set(['font/ttf', 'font/otf', 'application/x-font-ttf', 'application/x-font-otf']);
const allowedExtensions = new Set(['.ttf', '.otf']);

const fontRoutes: FastifyPluginAsync = async (app) => {
  app.post('/settings/fonts/upload', async (request, reply) => {
    const file = await request.file();
    if (!file) return reply.badRequest('font file is required');

    const extension = path.extname(file.filename).toLowerCase();
    if (!allowedExtensions.has(extension) || !allowedMimeTypes.has(file.mimetype)) {
      return reply.badRequest('Only .ttf and .otf font files are allowed');
    }

    const fileName = `${request.authUser.userId}-${Date.now()}${extension}`;
    const dest = path.join(config.fileStorageRoot, 'fonts', fileName);
    await fs.promises.writeFile(dest, await file.toBuffer());

    const url = `${config.fontBaseUrl}/${fileName}`;
    const settings = await prisma.setting.upsert({
      where: { userId: request.authUser.userId },
      update: { fontFamily: path.basename(file.filename, extension), fontFileUrl: url },
      create: { userId: request.authUser.userId, fontFamily: path.basename(file.filename, extension), fontFileUrl: url },
    });

    return { uploaded: true, url, settings };
  });
};

export default fontRoutes;
