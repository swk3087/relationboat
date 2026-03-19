import { FastifyPluginAsync } from 'fastify';
import { prisma } from '../lib/prisma.js';

const exportRoutes: FastifyPluginAsync = async (app) => {
  app.get('/export/full', async (request) => {
    const userId = request.authUser.userId;

    const [user, folders, dailyMemos, settings, syncAccounts] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.folder.findMany({
        where: { userId },
        include: {
          people: true,
          relationships: { include: { categories: true } },
        },
      }),
      prisma.dailyMemo.findMany({ where: { userId }, orderBy: { memoDate: 'desc' } }),
      prisma.setting.findUnique({ where: { userId } }),
      prisma.syncAccount.findMany({ where: { userId } }),
    ]);

    return {
      exportedAt: new Date().toISOString(),
      encryption: 'not_applied_server_side',
      user,
      folders,
      dailyMemos,
      settings,
      syncAccounts,
    };
  });
};

export default exportRoutes;
