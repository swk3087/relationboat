import { FastifyPluginAsync } from 'fastify';
import { prisma } from '../lib/prisma.js';
import { assertFolderOwnership } from '../services/folder-scope.js';

const searchRoutes: FastifyPluginAsync = async (app) => {
  app.get('/folders/:folderId/search/people', async (request) => {
    const { folderId } = request.params as { folderId: string };
    const { q, category } = request.query as { q?: string; category?: string };

    await assertFolderOwnership(request.authUser.userId, folderId);

    return prisma.person.findMany({
      where: {
        folderId,
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { phone: { contains: q, mode: 'insensitive' } },
                { memo: { contains: q, mode: 'insensitive' } },
                {
                  outgoingRelationships: {
                    some: {
                      OR: [
                        { title: { contains: q, mode: 'insensitive' } },
                        { memo: { contains: q, mode: 'insensitive' } },
                      ],
                    },
                  },
                },
                {
                  incomingRelationships: {
                    some: {
                      OR: [
                        { title: { contains: q, mode: 'insensitive' } },
                        { memo: { contains: q, mode: 'insensitive' } },
                      ],
                    },
                  },
                },
              ],
            }
          : {}),
        ...(category
          ? {
              OR: [
                { outgoingRelationships: { some: { categories: { some: { category } } } } },
                { incomingRelationships: { some: { categories: { some: { category } } } } },
              ],
            }
          : {}),
      },
      include: {
        outgoingRelationships: { include: { categories: true } },
        incomingRelationships: { include: { categories: true } },
      },
      orderBy: { name: 'asc' },
    });
  });
};

export default searchRoutes;
