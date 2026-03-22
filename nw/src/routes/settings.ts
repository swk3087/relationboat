import { FastifyPluginAsync } from 'fastify';
import { prisma } from '../lib/prisma.js';

const storageModes = ['sync'] as const;
type StorageMode = (typeof storageModes)[number];

const defaultFonts = [
  { id: 'system-default', family: 'System Default', source: 'builtin' },
  { id: 'pretendard', family: 'Pretendard', source: 'builtin' },
  { id: 'noto-sans-kr', family: 'Noto Sans KR', source: 'builtin' },
];

const settingsRoutes: FastifyPluginAsync = async (app) => {
  app.get('/settings', async (request) => {
    const settings = await prisma.setting.upsert({
      where: { userId: request.authUser.userId },
      update: {},
      create: { userId: request.authUser.userId, storageMode: 'sync' },
    });

    if (settings.storageMode !== 'sync') {
      const forced = await prisma.setting.update({
        where: { userId: request.authUser.userId },
        data: { storageMode: 'sync' },
      });
      return { ...forced, defaultFonts };
    }

    return { ...settings, defaultFonts };
  });

  app.patch('/settings', async (request, reply) => {
    const body = request.body as { storageMode?: StorageMode; fontFamily?: string | null; fontFileUrl?: string | null };
    if (body.storageMode && !storageModes.includes(body.storageMode)) {
      return reply.badRequest('Invalid storageMode');
    }

    return prisma.setting.upsert({
      where: { userId: request.authUser.userId },
      update: {
        storageMode: 'sync',
        fontFamily: body.fontFamily === undefined ? undefined : body.fontFamily?.trim() || null,
        fontFileUrl: body.fontFileUrl === undefined ? undefined : body.fontFileUrl?.trim() || null,
      },
      create: {
        userId: request.authUser.userId,
        storageMode: 'sync',
        fontFamily: body.fontFamily?.trim() || null,
        fontFileUrl: body.fontFileUrl?.trim() || null,
      },
    });
  });

  app.get('/settings/fonts', async () => defaultFonts);
};

export default settingsRoutes;
